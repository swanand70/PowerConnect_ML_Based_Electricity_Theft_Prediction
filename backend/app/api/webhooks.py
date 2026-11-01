"""
PowerConnect — Secure Razorpay Webhooks Processing & Idempotency Handler
Processes asynchronous payment gateway events (payment.captured, payment.failed, order.paid).
Verifies HMAC-SHA256 signature against raw request body using RAZORPAY_WEBHOOK_SECRET.
Prevents duplicate event processing and protects against race conditions.
"""

import hmac
import hashlib
import json
from decimal import Decimal
from datetime import datetime, UTC
from typing import Dict, Any

from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.entities import (
    PaymentTransaction, Bill, RazorpayWebhookEvent, AuditLog, Notification
)

router = APIRouter()

@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handles Razorpay Webhook events asynchronously with cryptographic verification,
    idempotency protection, and atomic state transitions.
    """
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # 1. Cryptographic HMAC-SHA256 Signature Verification
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if webhook_secret:
        expected_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            # In test mode, allow test simulator if header matches mock pattern
            if not (settings.RAZORPAY_PAYMENT_MODE == "test" and signature.startswith("mock_wh_sig_")):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature.")
    else:
        if settings.RAZORPAY_PAYMENT_MODE != "test":
            raise HTTPException(status_code=500, detail="Razorpay webhook secret is not configured.")

    # 2. Parse Event JSON Payload
    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_id = payload.get("event_id") or payload.get("id")
    event_type = payload.get("event", "unknown")

    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event identifier.")

    # 3. Idempotency Check: Prevent duplicate event execution
    existing_event = db.query(RazorpayWebhookEvent).filter(
        RazorpayWebhookEvent.event_id == event_id
    ).first()

    if existing_event:
        return {"status": "already_processed", "event_id": event_id}

    # Extract payment and order payload entities
    entity_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
    if not entity_data:
        entity_data = payload.get("payload", {}).get("order", {}).get("entity", {})

    payment_id = entity_data.get("id")
    order_id = entity_data.get("order_id") or (entity_data.get("id") if "order_" in str(entity_data.get("id", "")) else None)
    now_utc = datetime.now(UTC)

    # 4. Handle Specific Event Types
    if event_type in ["payment.captured", "order.paid"]:
        if order_id:
            # Lock payment attempt row for update
            txn = db.query(PaymentTransaction).filter(
                PaymentTransaction.razorpay_order_id == order_id
            ).with_for_update().first()

            if txn and txn.status != "SUCCESS":
                bill = db.query(Bill).filter(Bill.id == txn.bill_id).with_for_update().first()
                if bill:
                    txn.status = "SUCCESS"
                    if payment_id:
                        txn.razorpay_payment_id = payment_id
                    txn.payment_method = entity_data.get("method", "online")
                    txn.verified_at = now_utc
                    db.flush()

                    # Reconcile settled total
                    settled_sum = db.query(func.sum(PaymentTransaction.amount_inr)).filter(
                        PaymentTransaction.bill_id == bill.id,
                        PaymentTransaction.status == "SUCCESS"
                    ).scalar() or 0.0

                    new_total = round(float(settled_sum), 2)
                    bill.paid_amount_inr = Decimal(str(new_total))
                    outstanding = max(0.0, round(float(bill.amount_inr) - new_total, 2))

                    if outstanding <= 0.0:
                        bill.status = "PAID"
                        bill.paid_at = now_utc
                    else:
                        bill.status = "PARTIALLY_PAID"

                    # Audit Log
                    audit = AuditLog(
                        actor_user_id=txn.consumer.user_id if txn.consumer else None,
                        action="PAYMENT_WEBHOOK_SETTLED",
                        entity_type="BILL",
                        entity_id=str(bill.id),
                        details={
                            "event_id": event_id,
                            "order_id": order_id,
                            "payment_id": payment_id,
                            "amount_inr": float(txn.amount_inr),
                            "bill_status": bill.status
                        }
                    )
                    db.add(audit)

    elif event_type == "payment.failed":
        if order_id:
            txn = db.query(PaymentTransaction).filter(
                PaymentTransaction.razorpay_order_id == order_id
            ).with_for_update().first()

            if txn and txn.status == "CREATED":
                txn.status = "FAILED"
                txn.error_code = entity_data.get("error_code", "PAYMENT_FAILED")
                txn.error_description = entity_data.get("error_description", "Payment failed at gateway.")

    # 5. Persist Webhook Idempotency Record
    webhook_log = RazorpayWebhookEvent(
        event_id=event_id,
        event_type=event_type,
        order_id=order_id,
        payment_id=payment_id,
        payload_json={"event": event_type, "order_id": order_id, "payment_id": payment_id},
        processed_at=now_utc
    )
    db.add(webhook_log)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during webhook logging.")

    return {"status": "processed", "event_id": event_id, "event_type": event_type}
