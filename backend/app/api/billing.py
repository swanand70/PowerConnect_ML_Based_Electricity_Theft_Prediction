"""
Billing & Invoicing API Endpoints
"""

from typing import List
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.entities import User, Consumer, Bill, AuditLog
from backend.app.schemas.portal import BillResponse
from backend.app.api.deps import require_role

router = APIRouter()

@router.get("/my-bills", response_model=List[BillResponse])
def get_my_bills(
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Fetches all bills for the authenticated consumer."""
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
            due_date=b.due_date,
            status=b.status,
            paid_at=b.paid_at
        )
        for b in bills
    ]

@router.get("/{bill_id}", response_model=BillResponse)
def get_bill_by_id(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Fetches single bill details with strict ownership validation."""
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
        due_date=bill.due_date,
        status=bill.status,
        paid_at=bill.paid_at
    )

@router.post("/{bill_id}/pay")
def pay_bill(
    bill_id: int,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Simulates payment of an electricity bill."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.consumer_id == consumer.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status == "PAID":
        return {"message": "Bill is already paid.", "status": "PAID"}

    bill.status = "PAID"
    bill.paid_at = datetime.now(UTC)

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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during bill settlement.")

    return {"message": f"Payment of ₹{float(bill.amount_inr):.2f} successful for {bill.bill_number}.", "status": "PAID"}
