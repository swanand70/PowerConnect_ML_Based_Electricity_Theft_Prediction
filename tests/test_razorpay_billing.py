"""
PowerConnect — Institutional Billing, Partial Payments & Razorpay Integration Tests
Verifies consumer ownership isolation, exact integer paise conversion, HMAC-SHA256 signature verification,
atomic balance accounting, webhooks idempotency, and formal ReportLab PDF invoice/receipt generation.
"""

import sys
import hmac
import hashlib
import json
import uuid
from decimal import Decimal
from datetime import datetime, UTC
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, Consumer, Bill, PaymentTransaction, RazorpayWebhookEvent, Notification, AuditLog

client = TestClient(app)

def get_auth_token(username: str, password: str = "Utility@2026") -> str:
    """Helper to retrieve JWT access token."""
    response = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    return response.json()["access_token"]

def get_consumer_by_username(username: str) -> Consumer:
    """Helper to fetch consumer associated with a username."""
    db = SessionLocal()
    user = db.query(User).filter(User.username == username).first()
    assert user is not None, f"User {username} not found"
    cons = user.consumer
    assert cons is not None, f"Consumer for {username} not found"
    # detach
    consumer_id = cons.id
    db.close()
    
    db2 = SessionLocal()
    c = db2.query(Consumer).filter(Consumer.id == consumer_id).first()
    db2.close()
    return c

def get_or_create_bill_for_consumer(consumer_id: int) -> int:
    """Ensures consumer has at least one bill and returns bill_id."""
    db = SessionLocal()
    bill = db.query(Bill).filter(Bill.consumer_id == consumer_id).first()
    if not bill:
        bill = Bill(
            consumer_id=consumer_id,
            bill_number=f"BILL-SEED-{uuid.uuid4().hex[:6].upper()}",
            billing_period_start="2026-09-01",
            billing_period_end="2026-09-30",
            units_consumed_kwh=Decimal("150.00"),
            amount_inr=Decimal("1100.00"),
            paid_amount_inr=Decimal("0.00"),
            due_date="2026-10-31",
            status="PENDING"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
    b_id = bill.id
    db.close()
    return b_id


# ============================================================================
# 1. BILL LISTING & OWNERSHIP ISOLATION
# ============================================================================
def test_consumer_can_view_own_bills_with_reconciled_balances():
    """Consumer can list their own bills with accurate paid and outstanding amounts."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/billing/my-bills", headers=headers)
    assert res.status_code == 200
    bills = res.json()
    assert isinstance(bills, list)
    assert len(bills) > 0

    first_bill = bills[0]
    assert "id" in first_bill
    assert "bill_number" in first_bill
    assert "amount_inr" in first_bill
    assert "paid_amount_inr" in first_bill
    assert "outstanding_amount_inr" in first_bill
    assert first_bill["outstanding_amount_inr"] >= 0.0

    # Also test consumer alias route /api/consumer/bills/my-bills
    alias_res = client.get("/api/consumer/bills/my-bills", headers=headers)
    assert alias_res.status_code == 200


def test_consumer_ownership_checks_on_bill_details():
    """Consumer cannot view a bill belonging to another consumer."""
    token_cons1 = get_auth_token("cons_01")
    token_cons2 = get_auth_token("cons_02")

    cons2 = get_consumer_by_username("cons_02")
    bill_cons2_id = get_or_create_bill_for_consumer(cons2.id)

    # cons_01 attempts to view cons_02's bill -> 403 Forbidden
    res = client.get(f"/api/billing/{bill_cons2_id}", headers={"Authorization": f"Bearer {token_cons1}"})
    assert res.status_code == 403
    assert "only access your own" in res.json()["detail"].lower()

    # cons_02 views their own bill -> 200 OK
    res_own = client.get(f"/api/billing/{bill_cons2_id}", headers={"Authorization": f"Bearer {token_cons2}"})
    assert res_own.status_code == 200
    assert res_own.json()["id"] == bill_cons2_id


# ============================================================================
# 2. PARTIAL PAYMENT ORDER CREATION & VALIDATION
# ============================================================================
def test_create_payment_order_validation_rules():
    """
    Verifies amount validation:
    - Minimum ₹1.00 enforced
    - Zero and negative amounts rejected
    - Amount exceeding outstanding balance rejected
    - Cross-consumer order creation rejected
    """
    token_cons1 = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token_cons1}"}

    cons1 = get_consumer_by_username("cons_01")
    db = SessionLocal()
    bill = db.query(Bill).filter(Bill.consumer_id == cons1.id, Bill.status != "PAID").first()
    if not bill:
        bill = Bill(
            consumer_id=cons1.id,
            bill_number=f"BILL-ORD-{uuid.uuid4().hex[:6].upper()}",
            billing_period_start="2026-09-01",
            billing_period_end="2026-09-30",
            units_consumed_kwh=Decimal("150.00"),
            amount_inr=Decimal("1500.00"),
            paid_amount_inr=Decimal("0.00"),
            due_date="2026-10-31",
            status="PENDING"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
    bill_id = bill.id
    outstanding = bill.outstanding_amount_inr
    db.close()

    # 1. Zero amount -> 400
    r_zero = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 0.0}, headers=headers)
    assert r_zero.status_code == 400
    assert "greater than zero" in r_zero.json()["detail"]

    # 2. Negative amount -> 400
    r_neg = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": -50.0}, headers=headers)
    assert r_neg.status_code == 400

    # 3. Below minimum ₹1.00 -> 400
    r_min = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 0.50}, headers=headers)
    assert r_min.status_code == 400
    assert "minimum" in r_min.json()["detail"].lower()

    # 4. Amount exceeding outstanding balance -> 400
    r_exceed = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": outstanding + 1000.0}, headers=headers)
    assert r_exceed.status_code == 400
    assert "exceeds" in r_exceed.json()["detail"].lower()

    # 5. Cross-consumer bill payment attempt -> 403
    token_cons2 = get_auth_token("cons_02")
    r_cross = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 100.0}, headers={"Authorization": f"Bearer {token_cons2}"})
    assert r_cross.status_code == 403

    # 6. Valid partial payment order -> 200
    r_valid = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 100.0}, headers=headers)
    assert r_valid.status_code == 200
    data = r_valid.json()
    assert "order_id" in data
    assert data["amount_inr"] == 100.0
    assert data["amount_paise"] == 10000  # Exact paise conversion
    assert data["currency"] == "INR"
    assert "receipt_number" in data
    assert data["bill_id"] == bill_id


# ============================================================================
# 3. PAYMENT VERIFICATION, SIGNATURES & RECONCILIATION
# ============================================================================
def test_payment_verification_lifecycle_and_balance_reconciliation():
    """
    Tests the complete partial payment verification cycle:
    - Rejects invalid HMAC signatures
    - Accepts valid signature
    - Reconciles remaining balance accurately
    - Transitions to PARTIALLY_PAID
    - Second payment settles bill to PAID
    """
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    cons = get_consumer_by_username("cons_01")
    db = SessionLocal()
    test_bill = Bill(
        consumer_id=cons.id,
        bill_number=f"BILL-TEST-{uuid.uuid4().hex[:6].upper()}",
        billing_period_start="2026-09-01",
        billing_period_end="2026-09-30",
        units_consumed_kwh=Decimal("200.00"),
        amount_inr=Decimal("1500.00"),
        paid_amount_inr=Decimal("0.00"),
        due_date="2026-10-30",
        status="PENDING"
    )
    db.add(test_bill)
    db.commit()
    db.refresh(test_bill)
    bill_id = test_bill.id
    db.close()

    try:
        # Step 1: Create Order for ₹500 partial payment
        r_order1 = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 500.0}, headers=headers)
        assert r_order1.status_code == 200
        order1 = r_order1.json()
        order_id1 = order1["order_id"]
        payment_id1 = f"pay_test_{uuid.uuid4().hex[:12]}"

        # Step 2: Attempt verification with forged / invalid signature -> 400
        r_bad_sig = client.post(
            "/api/billing/payments/verify",
            json={
                "bill_id": bill_id,
                "razorpay_order_id": order_id1,
                "razorpay_payment_id": payment_id1,
                "razorpay_signature": "invalid_forged_signature_12345"
            },
            headers=headers
        )
        assert r_bad_sig.status_code == 400

        # Step 3: Compute valid HMAC-SHA256 signature
        secret = settings.RAZORPAY_KEY_SECRET or "test_secret"
        valid_sig1 = hmac.new(
            secret.encode("utf-8"),
            f"{order_id1}|{payment_id1}".encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # Step 4: Verify payment with authentic signature
        r_verify1 = client.post(
            "/api/billing/payments/verify",
            json={
                "bill_id": bill_id,
                "razorpay_order_id": order_id1,
                "razorpay_payment_id": payment_id1,
                "razorpay_signature": valid_sig1
            },
            headers=headers
        )
        assert r_verify1.status_code == 200
        res1 = r_verify1.json()
        assert res1["success"] is True
        assert res1["amount_paid_inr"] == 500.0
        assert res1["new_paid_total_inr"] == 500.0
        assert res1["new_outstanding_inr"] == 1000.0
        assert res1["bill_status"] == "PARTIALLY_PAID"
        assert res1["is_fully_paid"] is False

        # Step 5: Test Idempotent Retries (Submitting same verification again)
        r_idem = client.post(
            "/api/billing/payments/verify",
            json={
                "bill_id": bill_id,
                "razorpay_order_id": order_id1,
                "razorpay_payment_id": payment_id1,
                "razorpay_signature": valid_sig1
            },
            headers=headers
        )
        assert r_idem.status_code == 200
        assert "already verified" in r_idem.json()["message"].lower()

        # Step 6: Second Payment of Remaining ₹1,000 to Fully Settle
        r_order2 = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 1000.0}, headers=headers)
        assert r_order2.status_code == 200
        order2 = r_order2.json()
        order_id2 = order2["order_id"]
        payment_id2 = f"pay_test_{uuid.uuid4().hex[:12]}"

        valid_sig2 = hmac.new(
            secret.encode("utf-8"),
            f"{order_id2}|{payment_id2}".encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        r_verify2 = client.post(
            "/api/billing/payments/verify",
            json={
                "bill_id": bill_id,
                "razorpay_order_id": order_id2,
                "razorpay_payment_id": payment_id2,
                "razorpay_signature": valid_sig2
            },
            headers=headers
        )
        assert r_verify2.status_code == 200
        res2 = r_verify2.json()
        assert res2["success"] is True
        assert res2["amount_paid_inr"] == 1000.0
        assert res2["new_paid_total_inr"] == 1500.0
        assert res2["new_outstanding_inr"] == 0.0
        assert res2["bill_status"] == "PAID"
        assert res2["is_fully_paid"] is True

    finally:
        # Cleanup test bill & payments
        db = SessionLocal()
        db.query(PaymentTransaction).filter(PaymentTransaction.bill_id == bill_id).delete()
        db.query(Bill).filter(Bill.id == bill_id).delete()
        db.commit()
        db.close()


# ============================================================================
# 4. WEBHOOKS PROCESSING & IDEMPOTENCY
# ============================================================================
def test_signed_webhook_processing_and_idempotency():
    """
    Verifies that Razorpay webhooks:
    - Reject invalid signatures
    - Accept valid cryptographic HMAC-SHA256 signatures
    - Prevent duplicate event processing via idempotency keys
    """
    cons = get_consumer_by_username("cons_01")
    db = SessionLocal()
    test_bill = Bill(
        consumer_id=cons.id,
        bill_number=f"BILL-WH-{uuid.uuid4().hex[:6].upper()}",
        billing_period_start="2026-09-01",
        billing_period_end="2026-09-30",
        units_consumed_kwh=Decimal("100.00"),
        amount_inr=Decimal("800.00"),
        paid_amount_inr=Decimal("0.00"),
        due_date="2026-10-30",
        status="PENDING"
    )
    db.add(test_bill)
    db.commit()
    db.refresh(test_bill)

    order_id = f"order_wh_{uuid.uuid4().hex[:12]}"
    txn = PaymentTransaction(
        bill_id=test_bill.id,
        consumer_id=cons.id,
        receipt_number=f"RCP-WH-{uuid.uuid4().hex[:6]}",
        amount_inr=Decimal("800.00"),
        amount_paise=80000,
        currency="INR",
        status="CREATED",
        razorpay_order_id=order_id
    )
    db.add(txn)
    db.commit()
    bill_id = test_bill.id
    db.close()

    event_id = f"evt_{uuid.uuid4().hex[:14]}"
    try:
        webhook_payload = {
            "entity": "event",
            "event_id": event_id,
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": f"pay_wh_{uuid.uuid4().hex[:10]}",
                        "order_id": order_id,
                        "amount": 80000,
                        "currency": "INR",
                        "status": "captured",
                        "method": "netbanking"
                    }
                }
            }
        }
        body_bytes = json.dumps(webhook_payload).encode("utf-8")

        # 1. Invalid webhook signature -> 400
        r_bad = client.post(
            "/api/webhooks/razorpay",
            content=body_bytes,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": "invalid_wh_sig"}
        )
        assert r_bad.status_code == 400

        # 2. Valid webhook signature -> 200
        wh_secret = settings.RAZORPAY_WEBHOOK_SECRET or "test_webhook_secret"
        valid_wh_sig = hmac.new(
            wh_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()

        r_good = client.post(
            "/api/webhooks/razorpay",
            content=body_bytes,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_wh_sig}
        )
        assert r_good.status_code == 200
        assert r_good.json()["status"] == "processed"

        # 3. Duplicate event delivery -> idempotent status 'already_processed'
        r_dup = client.post(
            "/api/webhooks/razorpay",
            content=body_bytes,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_wh_sig}
        )
        assert r_dup.status_code == 200
        assert r_dup.json()["status"] == "already_processed"

        # Verify bill was settled to PAID in database
        db = SessionLocal()
        b_after = db.query(Bill).filter(Bill.id == bill_id).first()
        assert b_after.status == "PAID"
        assert float(b_after.paid_amount_inr) == 800.0
        db.close()

    finally:
        db = SessionLocal()
        db.query(RazorpayWebhookEvent).filter(RazorpayWebhookEvent.event_id == event_id).delete()
        db.query(PaymentTransaction).filter(PaymentTransaction.bill_id == bill_id).delete()
        db.query(Bill).filter(Bill.id == bill_id).delete()
        db.commit()
        db.close()


# ============================================================================
# 5. PROFESSIONAL PDF BILL & PAYMENT RECEIPT GENERATION
# ============================================================================
def test_pdf_bill_generation_and_ownership():
    """Generates authentic A4 PDF electricity bill with valid header and branding."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    cons1 = get_consumer_by_username("cons_01")
    bill_id = get_or_create_bill_for_consumer(cons1.id)

    res = client.get(f"/api/billing/{bill_id}/pdf", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "Content-Disposition" in res.headers
    assert "PowerConnect_Bill_" in res.headers["Content-Disposition"]

    # Verify standard PDF file header
    pdf_bytes = res.content
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 2000  # Valid rendered document size


def test_pdf_payment_receipt_generation_and_ownership():
    """Generates authentic A4 payment receipt PDF for settled transactions."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    cons1 = get_consumer_by_username("cons_01")
    bill_id = get_or_create_bill_for_consumer(cons1.id)

    # Create a dummy settled payment transaction for testing receipt download
    db = SessionLocal()
    txn = PaymentTransaction(
        bill_id=bill_id,
        consumer_id=cons1.id,
        receipt_number=f"RCP-TEST-{uuid.uuid4().hex[:6].upper()}",
        amount_inr=Decimal("250.00"),
        amount_paise=25000,
        currency="INR",
        status="SUCCESS",
        razorpay_order_id=f"order_{uuid.uuid4().hex[:12]}",
        razorpay_payment_id=f"pay_{uuid.uuid4().hex[:12]}",
        payment_method="UPI / QR",
        verified_at=datetime.now(UTC)
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    txn_id = txn.id
    db.close()

    try:
        res = client.get(f"/api/billing/payments/{txn_id}/receipt", headers=headers)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert "PowerConnect_Receipt_" in res.headers["Content-Disposition"]
        assert res.content.startswith(b"%PDF-")
        assert len(res.content) > 2000

        # Verify unauthorized consumer cannot download receipt -> 403
        token_cons2 = get_auth_token("cons_02")
        res_unauth = client.get(f"/api/billing/payments/{txn_id}/receipt", headers={"Authorization": f"Bearer {token_cons2}"})
        assert res_unauth.status_code == 403

    finally:
        db = SessionLocal()
        db.query(PaymentTransaction).filter(PaymentTransaction.id == txn_id).delete()
        db.commit()
        db.close()


# ============================================================================
# 6. CREDENTIAL ISOLATION & SECURITY AUDIT
# ============================================================================
def test_no_secret_keys_leaked_in_api_responses():
    """Confirms that server secret keys are strictly isolated and never leaked."""
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    cons1 = get_consumer_by_username("cons_01")
    db = SessionLocal()
    bill = db.query(Bill).filter(Bill.consumer_id == cons1.id, Bill.status != "PAID").first()
    if not bill or bill.outstanding_amount_inr <= 0.0:
        bill = Bill(
            consumer_id=cons1.id,
            bill_number=f"BILL-SEC-{uuid.uuid4().hex[:6].upper()}",
            billing_period_start="2026-09-01",
            billing_period_end="2026-09-30",
            units_consumed_kwh=Decimal("150.00"),
            amount_inr=Decimal("1000.00"),
            paid_amount_inr=Decimal("0.00"),
            due_date="2026-10-31",
            status="PENDING"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
    bill_id = bill.id
    db.close()

    r_order = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 10.0}, headers=headers)
    assert r_order.status_code == 200
    body_text = r_order.text
    assert "secret" not in body_text.lower()
    if settings.RAZORPAY_KEY_SECRET:
        assert settings.RAZORPAY_KEY_SECRET not in body_text

    # Bill listing response does not leak secret
    r_bills = client.get("/api/billing/my-bills", headers=headers)
    assert r_bills.status_code == 200
    if settings.RAZORPAY_KEY_SECRET:
        assert settings.RAZORPAY_KEY_SECRET not in r_bills.text


# ============================================================================
# 7. UPI (UNIFIED PAYMENTS INTERFACE) PAYMENT LIFECYCLE & VERIFICATION
# ============================================================================
def test_order_creation_returns_consumer_phone_for_upi_checkout():
    """
    Razorpay Standard Checkout requires a valid 10-digit mobile number in options.prefill.contact
    for UPI Intent (GPay, PhonePe, Paytm) and QR code display.
    """
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}
    cons = get_consumer_by_username("cons_01")

    db = SessionLocal()
    order_bill = Bill(
        consumer_id=cons.id,
        bill_number=f"BILL-PHONE-{uuid.uuid4().hex[:6].upper()}",
        billing_period_start="2026-09-01",
        billing_period_end="2026-09-30",
        units_consumed_kwh=Decimal("100.00"),
        amount_inr=Decimal("200.00"),
        paid_amount_inr=Decimal("0.00"),
        due_date="2026-10-31",
        status="PENDING"
    )
    db.add(order_bill)
    db.commit()
    db.refresh(order_bill)
    bill_id = order_bill.id
    db.close()

    try:
        res = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 25.0}, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "consumer_phone" in data
        assert data["consumer_phone"] is not None
        assert len(data["consumer_phone"]) >= 10
        assert data["currency"] == "INR"
    finally:
        db = SessionLocal()
        db.query(PaymentTransaction).filter(PaymentTransaction.bill_id == bill_id).delete()
        db.query(Bill).filter(Bill.id == bill_id).delete()
        db.commit()
        db.close()


def test_upi_payment_verification_and_settlement():
    """
    Simulates a successful Razorpay UPI checkout flow:
    - Order creation
    - UPI payment completion with pay_upi_...
    - Valid HMAC-SHA256 signature verification
    - Recording payment_method as 'upi'
    - Decrementing bill outstanding balance atomically
    """
    token = get_auth_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}
    cons = get_consumer_by_username("cons_01")

    db = SessionLocal()
    upi_bill = Bill(
        consumer_id=cons.id,
        bill_number=f"BILL-UPI-{uuid.uuid4().hex[:6].upper()}",
        billing_period_start="2026-09-01",
        billing_period_end="2026-09-30",
        units_consumed_kwh=Decimal("100.00"),
        amount_inr=Decimal("200.00"),
        paid_amount_inr=Decimal("0.00"),
        due_date="2026-10-31",
        status="PENDING"
    )
    db.add(upi_bill)
    db.commit()
    db.refresh(upi_bill)
    bill_id = upi_bill.id
    db.close()

    try:
        # 1. Create order for ₹150 UPI partial payment
        r_order = client.post(f"/api/billing/{bill_id}/payments/order", json={"amount_inr": 150.0}, headers=headers)
        assert r_order.status_code == 200
        order_info = r_order.json()
        order_id = order_info["order_id"]
        upi_payment_id = f"pay_upi_test_{uuid.uuid4().hex[:10]}"

        # 2. Generate valid HMAC-SHA256 signature
        secret = settings.RAZORPAY_KEY_SECRET or "test_secret"
        expected_msg = f"{order_id}|{upi_payment_id}"
        sig = hmac.new(secret.encode("utf-8"), expected_msg.encode("utf-8"), hashlib.sha256).hexdigest()

        # 3. Verify payment
        r_verify = client.post(
            "/api/billing/payments/verify",
            json={
                "bill_id": bill_id,
                "razorpay_order_id": order_id,
                "razorpay_payment_id": upi_payment_id,
                "razorpay_signature": sig
            },
            headers=headers
        )
        assert r_verify.status_code == 200
        verify_data = r_verify.json()
        assert verify_data["success"] is True
        assert verify_data["amount_paid_inr"] == 150.0
        assert verify_data["new_outstanding_inr"] == 50.0
        assert verify_data["bill_status"] == "PARTIALLY_PAID"

        # 4. Check PaymentTransaction in database has payment_method == 'upi'
        db = SessionLocal()
        txn = db.query(PaymentTransaction).filter(PaymentTransaction.razorpay_order_id == order_id).first()
        assert txn is not None
        assert txn.status == "SUCCESS"
        assert txn.payment_method == "upi"
        db.close()

    finally:
        db = SessionLocal()
        db.query(PaymentTransaction).filter(PaymentTransaction.bill_id == bill_id).delete()
        db.query(Bill).filter(Bill.id == bill_id).delete()
        db.commit()
        db.close()


def test_upi_webhook_captured_lifecycle():
    """
    Verifies that a Razorpay webhook event `payment.captured` with method="upi"
    is cryptographically verified and settles the bill idempotently.
    """
    cons = get_consumer_by_username("cons_01")
    db = SessionLocal()
    wh_bill = Bill(
        consumer_id=cons.id,
        bill_number=f"BILL-WHUPI-{uuid.uuid4().hex[:6].upper()}",
        billing_period_start="2026-09-01",
        billing_period_end="2026-09-30",
        units_consumed_kwh=Decimal("50.00"),
        amount_inr=Decimal("100.00"),
        paid_amount_inr=Decimal("0.00"),
        due_date="2026-10-31",
        status="PENDING"
    )
    db.add(wh_bill)
    db.commit()
    db.refresh(wh_bill)
    bill_id = wh_bill.id

    order_id = f"order_whupi_{uuid.uuid4().hex[:10]}"
    txn = PaymentTransaction(
        bill_id=bill_id,
        consumer_id=cons.id,
        receipt_number=f"RCP-WHUPI-{uuid.uuid4().hex[:6].upper()}",
        amount_inr=Decimal("100.00"),
        amount_paise=10000,
        currency="INR",
        status="CREATED",
        razorpay_order_id=order_id,
        idempotency_key=f"idem_whupi_{uuid.uuid4().hex[:8]}"
    )
    db.add(txn)
    db.commit()
    db.close()

    event_id = f"evt_upi_{uuid.uuid4().hex[:14]}"
    try:
        pay_id = f"pay_wh_upi_{uuid.uuid4().hex[:10]}"
        event_payload = {
            "entity": "event",
            "event_id": event_id,
            "account_id": "acc_powerconnect",
            "event": "payment.captured",
            "contains": ["payment"],
            "payload": {
                "payment": {
                    "entity": {
                        "id": pay_id,
                        "order_id": order_id,
                        "amount": 10000,
                        "currency": "INR",
                        "status": "captured",
                        "method": "upi",
                        "vpa": "success@razorpay",
                        "email": "cons_01@powerconnect.utility",
                        "contact": "+919876543210",
                        "fee": 0,
                        "tax": 0,
                        "error_code": None,
                        "error_description": None,
                        "notes": {
                            "bill_id": str(bill_id)
                        }
                    }
                }
            },
            "created_at": 1729000000
        }
        body_bytes = json.dumps(event_payload).encode("utf-8")
        wh_secret = settings.RAZORPAY_WEBHOOK_SECRET or "test_webhook_secret"
        valid_wh_sig = hmac.new(wh_secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

        # Send webhook
        r_wh = client.post(
            "/api/webhooks/razorpay",
            content=body_bytes,
            headers={"X-Razorpay-Signature": valid_wh_sig, "Content-Type": "application/json"}
        )
        assert r_wh.status_code == 200
        assert r_wh.json()["status"] == "processed"

        # Assert bill status is PAID
        db = SessionLocal()
        b_after = db.query(Bill).filter(Bill.id == bill_id).first()
        assert b_after.status == "PAID"
        assert b_after.outstanding_amount_inr == 0.0

        t_after = db.query(PaymentTransaction).filter(PaymentTransaction.razorpay_order_id == order_id).first()
        assert t_after.status == "SUCCESS"
        assert t_after.payment_method == "upi"
        db.close()

    finally:
        db = SessionLocal()
        db.query(RazorpayWebhookEvent).filter(RazorpayWebhookEvent.event_id == event_id).delete()
        db.query(PaymentTransaction).filter(PaymentTransaction.bill_id == bill_id).delete()
        db.query(Bill).filter(Bill.id == bill_id).delete()
        db.commit()
        db.close()

