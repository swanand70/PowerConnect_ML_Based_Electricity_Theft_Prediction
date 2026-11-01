"""
PowerConnect — Institutional Billing, Partial Payments & Razorpay Integration API Endpoints
Provides authoritative balance accounting, exact integer paise conversion, HMAC-SHA256 verification,
and print-ready PDF invoice / payment receipt generation.
"""

import hmac
import hashlib
import uuid
from typing import List, Optional
from datetime import datetime, UTC
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.entities import (
    User, Consumer, Bill, PaymentTransaction, AuditLog, Notification
)
from backend.app.schemas.portal import (
    BillResponse,
    CreatePaymentOrderRequest,
    CreatePaymentOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    PaymentTransactionSummary,
    PaymentReceiptResponse
)
from backend.app.api.deps import require_role
from backend.app.services.pdf_billing_service import PdfBillingService

import razorpay

router = APIRouter()

# --- 1. My Bills Listing ---
@router.get("/my-bills", response_model=List[BillResponse])
def get_my_bills(
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Fetches all bills for the authenticated consumer with reconciled balances."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    bills = db.query(Bill).filter(Bill.consumer_id == consumer.id).order_by(Bill.due_date.desc()).all()
    return [
        BillResponse(
            id=b.id,
            bill_number=b.bill_number,
            billing_period_start=b.billing_period_start,
            billing_period_end=b.billing_period_end,
            units_consumed_kwh=float(b.units_consumed_kwh),
            amount_inr=float(b.amount_inr),
            paid_amount_inr=float(b.paid_amount_inr or 0.0),
            outstanding_amount_inr=b.outstanding_amount_inr,
            due_date=b.due_date,
            status=b.status,
            paid_at=b.paid_at
        )
        for b in bills
    ]

# --- 2. Single Bill Details ---
@router.get("/{bill_id}", response_model=BillResponse)
def get_bill_by_id(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Fetches single bill details with strict consumer ownership validation."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill record not found")

    if bill.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied: You can only access your own electricity bills.")

    return BillResponse(
        id=bill.id,
        bill_number=bill.bill_number,
        billing_period_start=bill.billing_period_start,
        billing_period_end=bill.billing_period_end,
        units_consumed_kwh=float(bill.units_consumed_kwh),
        amount_inr=float(bill.amount_inr),
        paid_amount_inr=float(bill.paid_amount_inr or 0.0),
        outstanding_amount_inr=bill.outstanding_amount_inr,
        due_date=bill.due_date,
        status=bill.status,
        paid_at=bill.paid_at
    )

# --- 3. Create Razorpay Payment Order (Partial & Full Payments Supported) ---
@router.post("/{bill_id}/payments/order", response_model=CreatePaymentOrderResponse)
def create_payment_order(
    bill_id: int,
    payload: CreatePaymentOrderRequest,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """
    Creates an authentic Razorpay order for the requested partial or full payment amount.
    Validates consumer ownership, enforces minimums and outstanding balance caps,
    and returns server-configured checkout parameters. Never exposes secrets.
    """
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot pay a bill belonging to another account.")

    # Reconcile outstanding balance
    outstanding = bill.outstanding_amount_inr
    if outstanding <= 0.0 or bill.status == "PAID":
        raise HTTPException(status_code=400, detail="This bill is already fully settled. No payment required.")

    # Validate payment amount
    req_amount = round(payload.amount_inr, 2)
    if req_amount <= 0.0:
        raise HTTPException(status_code=400, detail="Payment amount must be strictly greater than zero.")

    if req_amount < 1.0:
        raise HTTPException(status_code=400, detail="Minimum payable amount is ₹1.00 (100 paise).")

    if req_amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail=f"Requested payment amount of ₹{req_amount:,.2f} exceeds current outstanding balance of ₹{outstanding:,.2f}."
        )

    # Convert to integer paise (1 INR = 100 paise)
    amount_paise = int(round(req_amount * 100))
    receipt_num = f"RCP-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    # Handle Idempotency Key
    idempotency_key = payload.idempotency_key or f"idem_{bill.id}_{amount_paise}_{uuid.uuid4().hex[:8]}"

    # Resolve mobile contact for customer prefill (required for UPI Intent & QR)
    cons_phone = getattr(consumer, "phone", None) or getattr(current_user, "phone", None) or "9876543210"

    # Check if an existing CREATED transaction exists with this idempotency key
    existing_txn = db.query(PaymentTransaction).filter(
        PaymentTransaction.idempotency_key == idempotency_key,
        PaymentTransaction.status == "CREATED"
    ).first()
    if existing_txn and existing_txn.razorpay_order_id:
        return CreatePaymentOrderResponse(
            order_id=existing_txn.razorpay_order_id,
            key_id=settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
            amount_inr=float(existing_txn.amount_inr),
            amount_paise=existing_txn.amount_paise,
            currency=existing_txn.currency,
            receipt_number=existing_txn.receipt_number,
            bill_id=bill.id,
            bill_number=bill.bill_number,
            consumer_name=consumer.name,
            consumer_email=current_user.email,
            consumer_phone=cons_phone
        )

    # Create order via Razorpay API
    order_id = None
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order_payload = {
                "amount": amount_paise,
                "currency": settings.RAZORPAY_CURRENCY,
                "receipt": receipt_num,
                "notes": {
                    "bill_id": str(bill.id),
                    "bill_number": bill.bill_number,
                    "consumer_id": str(consumer.id),
                    "cons_no": consumer.cons_no,
                    "service": "PowerConnect Electricity Payment"
                }
            }
            order_res = client.order.create(data=order_payload)
            order_id = order_res.get("id")
        except Exception as e:
            # If external network failure or invalid test key, fallback safely in test mode
            if settings.RAZORPAY_PAYMENT_MODE == "test":
                order_id = f"order_test_{uuid.uuid4().hex[:14]}"
            else:
                raise HTTPException(status_code=502, detail=f"Failed to create order with payment gateway: {str(e)}")
    else:
        order_id = f"order_test_{uuid.uuid4().hex[:14]}"

    # Persist local payment attempt transaction
    new_txn = PaymentTransaction(
        bill_id=bill.id,
        consumer_id=consumer.id,
        receipt_number=receipt_num,
        amount_inr=Decimal(str(req_amount)),
        amount_paise=amount_paise,
        currency=settings.RAZORPAY_CURRENCY,
        status="CREATED",
        razorpay_order_id=order_id,
        idempotency_key=idempotency_key
    )
    db.add(new_txn)
    try:
        db.commit()
        db.refresh(new_txn)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to initialize payment transaction in database.")

    return CreatePaymentOrderResponse(
        order_id=order_id,
        key_id=settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
        amount_inr=req_amount,
        amount_paise=amount_paise,
        currency=settings.RAZORPAY_CURRENCY,
        receipt_number=receipt_num,
        bill_id=bill.id,
        bill_number=bill.bill_number,
        consumer_name=consumer.name,
        consumer_email=current_user.email,
        consumer_phone=cons_phone
    )

# --- 4. Verify Razorpay Payment Signature & Reconcile Balance ---
@router.post("/payments/verify", response_model=VerifyPaymentResponse)
def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """
    Authoritative server-side payment verification.
    Validates HMAC-SHA256 signature using locally stored secret key.
    Reconciles settled payments, updates outstanding balances atomically,
    and logs immutable audit trail.
    """
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    # Lock transaction row for update to prevent concurrent double-settlement
    txn = db.query(PaymentTransaction).filter(
        PaymentTransaction.razorpay_order_id == payload.razorpay_order_id
    ).with_for_update().first()

    if not txn:
        raise HTTPException(status_code=404, detail="Payment transaction attempt not found.")

    if txn.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied: Payment transaction belongs to another consumer.")

    bill = db.query(Bill).filter(Bill.id == txn.bill_id).with_for_update().first()
    if not bill or bill.id != payload.bill_id:
        raise HTTPException(status_code=400, detail="Mismatched bill association for payment attempt.")

    # Idempotent response if already processed
    if txn.status == "SUCCESS":
        return VerifyPaymentResponse(
            success=True,
            message="Payment was already verified and settled successfully.",
            receipt_number=txn.receipt_number,
            payment_id=txn.id,
            amount_paid_inr=float(txn.amount_inr),
            new_paid_total_inr=float(bill.paid_amount_inr),
            new_outstanding_inr=bill.outstanding_amount_inr,
            bill_status=bill.status,
            is_fully_paid=(bill.status == "PAID")
        )

    # 1. Verify HMAC-SHA256 Signature
    expected_msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    secret_key = settings.RAZORPAY_KEY_SECRET

    if secret_key:
        generated_sig = hmac.new(
            secret_key.encode("utf-8"),
            expected_msg.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        is_valid_sig = hmac.compare_digest(generated_sig, payload.razorpay_signature)
        if not is_valid_sig:
            # Handle controlled test-mode signature simulation if secret was not yet provisioned
            if not (settings.RAZORPAY_PAYMENT_MODE == "test" and payload.razorpay_signature.startswith("mock_sig_")):
                txn.status = "FAILED"
                txn.error_code = "SIGNATURE_VERIFICATION_FAILED"
                txn.error_description = "HMAC-SHA256 signature mismatch."
                db.commit()
                raise HTTPException(status_code=400, detail="Invalid payment signature from provider.")
    else:
        if settings.RAZORPAY_PAYMENT_MODE != "test":
            raise HTTPException(status_code=500, detail="Payment gateway secret is not configured.")

    # 2. Check Payment Status with Razorpay API where credentials are live
    pay_method = "upi" if "upi" in payload.razorpay_payment_id.lower() else "online"
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET and not payload.razorpay_payment_id.startswith("pay_mock_") and not payload.razorpay_payment_id.startswith("pay_test_"):
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            pay_details = client.payment.fetch(payload.razorpay_payment_id)
            pay_status = pay_details.get("status")
            pay_method = pay_details.get("method", pay_method)

            # If authorized, auto-capture
            if pay_status == "authorized":
                client.payment.capture(payload.razorpay_payment_id, pay_details.get("amount"))
            elif pay_status != "captured":
                txn.status = "FAILED"
                txn.error_code = f"STATUS_{pay_status.upper()}"
                txn.error_description = f"Payment status is {pay_status}, not settled."
                db.commit()
                raise HTTPException(status_code=400, detail=f"Payment status is {pay_status}, cannot settle bill.")
        except HTTPException:
            raise
        except Exception as e:
            # In test mode allow verification to continue if signature passed
            if settings.RAZORPAY_PAYMENT_MODE != "test":
                raise HTTPException(status_code=502, detail=f"Could not verify payment status with Razorpay API: {str(e)}")

    # 3. Apply Payment Atomically
    now_utc = datetime.now(UTC)
    txn.status = "SUCCESS"
    txn.razorpay_payment_id = payload.razorpay_payment_id
    txn.razorpay_signature = payload.razorpay_signature
    txn.payment_method = pay_method
    txn.verified_at = now_utc
    db.flush()

    # Reconcile all settled payments on this bill
    all_settled_sum = db.query(func.sum(PaymentTransaction.amount_inr)).filter(
        PaymentTransaction.bill_id == bill.id,
        PaymentTransaction.status == "SUCCESS"
    ).scalar() or 0.0

    new_settled_total = round(float(all_settled_sum), 2)
    bill.paid_amount_inr = Decimal(str(new_settled_total))
    orig_total = float(bill.amount_inr)
    outstanding_rem = max(0.0, round(orig_total - new_settled_total, 2))

    if outstanding_rem <= 0.0:
        bill.status = "PAID"
        bill.paid_at = now_utc
    else:
        bill.status = "PARTIALLY_PAID"

    # Log in immutable Audit Log
    audit = AuditLog(
        actor_user_id=current_user.id,
        action="PAYMENT_VERIFIED",
        entity_type="BILL",
        entity_id=str(bill.id),
        details={
            "bill_number": bill.bill_number,
            "receipt_number": txn.receipt_number,
            "amount_paid_inr": float(txn.amount_inr),
            "new_paid_total_inr": new_settled_total,
            "remaining_outstanding_inr": outstanding_rem,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "bill_status": bill.status
        }
    )
    db.add(audit)

    # Create consumer notification
    is_fully = (bill.status == "PAID")
    notif_msg = (
        f"Payment of ₹{float(txn.amount_inr):,.2f} recorded for Bill #{bill.bill_number}. "
        f"{'Bill is now fully paid.' if is_fully else f'Remaining balance due: ₹{outstanding_rem:,.2f}.'}"
    )
    notif = Notification(
        user_id=current_user.id,
        title="Payment Confirmation Receipt Available",
        message=notif_msg,
        category="PAYMENT",
        is_read=False,
        link_url="/consumer-portal",
        created_at=now_utc
    )
    db.add(notif)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during payment settlement.")

    return VerifyPaymentResponse(
        success=True,
        message="Payment verified and settled successfully.",
        receipt_number=txn.receipt_number,
        payment_id=txn.id,
        amount_paid_inr=float(txn.amount_inr),
        new_paid_total_inr=new_settled_total,
        new_outstanding_inr=outstanding_rem,
        bill_status=bill.status,
        is_fully_paid=is_fully
    )

# --- 5. Download Professional PDF Bill ---
@router.get("/{bill_id}/pdf")
def download_bill_pdf(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """
    Generates and returns an authoritative, formal A4 PDF electricity bill.
    Verifies that the authenticated consumer owns the bill record.
    """
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")

    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill record not found.")

    if bill.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot access another consumer's bill.")

    pdf_bytes = PdfBillingService.generate_bill_pdf(bill_id, db)
    clean_bill_no = bill.bill_number.replace("/", "-").replace(" ", "_")
    filename = f"PowerConnect_Bill_{clean_bill_no}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# --- 6. Download Official Payment Receipt PDF ---
@router.get("/payments/{payment_id}/receipt")
def download_payment_receipt_pdf(
    payment_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """
    Generates and returns a formal A4 payment remittance receipt PDF.
    Verifies consumer ownership and successful settlement state.
    """
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")

    txn = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    if txn.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied: You can only download your own payment receipts.")

    if txn.status != "SUCCESS":
        raise HTTPException(status_code=400, detail="Receipts are only generated for verified, successful payments.")

    pdf_bytes = PdfBillingService.generate_payment_receipt_pdf(payment_id, db)
    clean_rcpt_no = txn.receipt_number.replace("/", "-").replace(" ", "_")
    filename = f"PowerConnect_Receipt_{clean_rcpt_no}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

# --- 7. List Payment Transactions for a Bill ---
@router.get("/{bill_id}/payments", response_model=List[PaymentTransactionSummary])
def get_bill_payments(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Lists all payment attempts and settled receipts for a specific bill."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found.")

    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found.")

    if bill.consumer_id != consumer.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    txns = db.query(PaymentTransaction).filter(
        PaymentTransaction.bill_id == bill_id
    ).order_by(PaymentTransaction.created_at.desc()).all()

    return [
        PaymentTransactionSummary(
            id=t.id,
            receipt_number=t.receipt_number,
            amount_inr=float(t.amount_inr),
            currency=t.currency,
            status=t.status,
            razorpay_order_id=t.razorpay_order_id,
            razorpay_payment_id=t.razorpay_payment_id,
            payment_method=t.payment_method,
            created_at=t.created_at,
            verified_at=t.verified_at
        )
        for t in txns
    ]

# --- 8. Simulated Payment Mutation Path (Preserved for Legacy Test Compatibility) ---
@router.post("/{bill_id}/pay")
def pay_bill_legacy_simulation(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Legacy simulated payment endpoint preserved for backward test suite compatibility."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.consumer_id == consumer.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == "PAID":
        return {"message": "Bill is already paid.", "status": "PAID"}

    now_utc = datetime.now(UTC)
    bill.status = "PAID"
    bill.paid_amount_inr = bill.amount_inr
    bill.paid_at = now_utc

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="BILL_PAID",
        entity_type="BILL",
        entity_id=str(bill.id),
        details={"bill_number": bill.bill_number, "amount_inr": float(bill.amount_inr)}
    )
    db.add(audit)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during simulation.")

    return {"message": f"Payment of ₹{float(bill.amount_inr):.2f} successful for {bill.bill_number}.", "status": "PAID"}


# --- Consumer API Alias Router for /api/consumer Paths ---
consumer_router = APIRouter()
consumer_router.add_api_route("/bills/my-bills", get_my_bills, methods=["GET"], response_model=List[BillResponse])
consumer_router.add_api_route("/bills/{bill_id}", get_bill_by_id, methods=["GET"], response_model=BillResponse)
consumer_router.add_api_route("/bills/{bill_id}/payments/order", create_payment_order, methods=["POST"], response_model=CreatePaymentOrderResponse)
consumer_router.add_api_route("/payments/verify", verify_payment, methods=["POST"], response_model=VerifyPaymentResponse)
consumer_router.add_api_route("/bills/{bill_id}/pdf", download_bill_pdf, methods=["GET"])
consumer_router.add_api_route("/payments/{payment_id}/receipt", download_payment_receipt_pdf, methods=["GET"])
consumer_router.add_api_route("/bills/{bill_id}/payments", get_bill_payments, methods=["GET"], response_model=List[PaymentTransactionSummary])

