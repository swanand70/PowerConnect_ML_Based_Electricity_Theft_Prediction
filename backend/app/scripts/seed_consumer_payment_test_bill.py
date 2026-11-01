"""
Safe, Idempotent Seeding Script for Consumer Demonstration Test Bill (₹50.00).

Purpose:
- Seeds or reuses exactly one database-backed ₹50.00 bill for the authenticated demonstration consumer account.
- Creates an authoritative billing notification referencing the exact bill ID.
- Fully idempotent: running multiple times preserves existing records and avoids duplicate bills/notifications.
- Never mutates paid historical records or leaks secrets.
"""

import argparse
import sys
from datetime import date, datetime, UTC
from decimal import Decimal
from typing import Optional

# Reconfigure stdout/stderr for UTF-8 on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.core.database import SessionLocal
from backend.app.models.entities import User, Consumer, Meter, Bill, Notification


def seed_test_bill(username: str = "cons_01", force_new: bool = False) -> dict:
    """
    Seeds or reuses a ₹50.00 test bill and associated notification for the specified consumer.
    """
    db = SessionLocal()
    try:
        # 1. Identify consumer user account
        user = db.query(User).filter(User.username == username).first()
        if not user:
            # Fallback: search for first active consumer user
            user = db.query(User).filter(User.role == "CONSUMER", User.is_active == True).first()
            if not user:
                raise RuntimeError("No active consumer account found in database.")

        consumer: Optional[Consumer] = user.consumer
        if not consumer:
            raise RuntimeError(f"User '{user.username}' (ID: {user.id}) has no associated consumer profile.")

        meter: Optional[Meter] = consumer.meter
        meter_number = meter.meter_number if meter else "UNKNOWN-METER"

        # 2. Check for existing unpaid ₹50 test bill (Idempotency)
        existing_bill = (
            db.query(Bill)
            .filter(
                Bill.consumer_id == consumer.id,
                Bill.amount_inr == Decimal("50.00"),
                Bill.status == "PENDING",
                Bill.paid_amount_inr == Decimal("0.00")
            )
            .order_by(Bill.id.desc())
            .first()
        )

        bill: Bill
        action: str

        if existing_bill and not force_new:
            bill = existing_bill
            action = "REUSED_EXISTING"
        else:
            # Generate stable, collision-free bill number
            base_number = f"BILL-2026-{consumer.id:04d}-50"
            count = db.query(Bill).filter(
                Bill.consumer_id == consumer.id,
                Bill.bill_number.like(f"{base_number}%")
            ).count()

            bill_number = base_number if count == 0 else f"{base_number}-v{count + 1}"

            bill = Bill(
                consumer_id=consumer.id,
                bill_number=bill_number,
                billing_period_start=date(2026, 9, 1),
                billing_period_end=date(2026, 9, 30),
                units_consumed_kwh=Decimal("10.00"),
                amount_inr=Decimal("50.00"),
                paid_amount_inr=Decimal("0.00"),
                due_date=date(2026, 11, 15),
                status="PENDING",
                created_at=datetime.now(UTC)
            )
            db.add(bill)
            db.commit()
            db.refresh(bill)
            action = "CREATED_NEW"

        # 3. Create or verify notification referencing this exact bill ID
        target_link = f"/consumer/dashboard?tab=billing&bill_id={bill.id}"
        existing_notif = (
            db.query(Notification)
            .filter(
                Notification.user_id == user.id,
                Notification.link_url == target_link,
                Notification.category == "BILL"
            )
            .first()
        )

        notif: Notification
        notif_action: str

        if existing_notif:
            notif = existing_notif
            notif_action = "REUSED_EXISTING"
        else:
            notif = Notification(
                user_id=user.id,
                title="Electricity Bill Available for Payment",
                message=f"Electricity bill {bill.bill_number} of ₹50.00 is now ready for review and payment.",
                category="BILL",
                is_read=False,
                link_url=target_link,
                created_at=datetime.now(UTC)
            )
            db.add(notif)
            db.commit()
            db.refresh(notif)
            notif_action = "CREATED_NEW"

        return {
            "action": action,
            "bill_id": bill.id,
            "bill_number": bill.bill_number,
            "consumer_id": consumer.id,
            "consumer_name": consumer.name,
            "consumer_number": consumer.cons_no,
            "meter_number": meter_number,
            "username": user.username,
            "user_id": user.id,
            "amount_inr": float(bill.amount_inr),
            "outstanding_amount_inr": bill.outstanding_amount_inr,
            "status": bill.status,
            "due_date": str(bill.due_date),
            "notification_id": notif.id,
            "notification_link": notif.link_url,
            "notification_action": notif_action
        }
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Seed or verify ₹50 test bill for consumer demonstration.")
    parser.add_argument("--username", default="cons_01", help="Consumer username (default: cons_01)")
    parser.add_argument("--force-new", action="store_true", help="Force creation of a new ₹50 bill even if one exists")
    args = parser.parse_args()

    print("=" * 70)
    print("PowerConnect — ₹50 Test Bill Seeding for Consumer Portal")
    print("=" * 70)

    try:
        result = seed_test_bill(username=args.username, force_new=args.force_new)
        print(f"Action:                  {result['action']}")
        print(f"User:                    {result['username']} (User ID: {result['user_id']})")
        print(f"Consumer:                {result['consumer_name']} (Consumer ID: {result['consumer_id']}, No: {result['consumer_number']})")
        print(f"Meter:                   {result['meter_number']}")
        print(f"Bill ID:                 {result['bill_id']}")
        print(f"Bill Number:             {result['bill_number']}")
        print(f"Original Amount:         INR {result['amount_inr']:.2f}")
        print(f"Initial Outstanding:     INR {result['outstanding_amount_inr']:.2f}")
        print(f"Bill Status:             {result['status']}")
        print(f"Due Date:                {result['due_date']}")
        print(f"Notification ID:         {result['notification_id']} ({result['notification_action']})")
        print(f"Notification Route:      {result['notification_link']}")
        print("=" * 70)
        print("[SUCCESS] Test bill is ready in MySQL for demonstration.")
    except Exception as e:
        print(f"[ERROR] Failed to seed test bill: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
