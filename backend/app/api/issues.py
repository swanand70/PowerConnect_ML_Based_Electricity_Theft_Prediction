"""
Consumer Grievances & Issue Tracking API Endpoints
"""

from typing import List
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.entities import User, Consumer, ConsumerIssue, AuditLog
from backend.app.schemas.portal import IssueCreateRequest, IssueResponse, IssueResolveRequest
from backend.app.api.deps import require_role, get_current_user

router = APIRouter()

@router.get("/my-issues", response_model=List[IssueResponse])
def get_my_issues(
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Consumer fetches all issues filed by their account."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    issues = db.query(ConsumerIssue).filter(ConsumerIssue.consumer_id == consumer.id).order_by(ConsumerIssue.created_at.desc()).all()
    return [
        IssueResponse(
            id=i.id,
            ticket_number=i.ticket_number,
            consumer_name=consumer.name,
            category=i.category,
            subject=i.subject,
            description=i.description,
            status=i.status,
            response_notes=i.response_notes,
            resolved_at=i.resolved_at,
            created_at=i.created_at
        )
        for i in issues
    ]

@router.post("/report", response_model=IssueResponse)
def report_issue(
    payload: IssueCreateRequest,
    current_user: User = Depends(require_role(["CONSUMER"])),
    db: Session = Depends(get_db)
):
    """Consumer files a new service or billing grievance."""
    consumer = current_user.consumer
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer profile not found")

    ticket_num = f"TKT-{datetime.now().strftime('%Y%m%d')}-{consumer.id:04d}-{db.query(ConsumerIssue).count() + 1}"
    new_issue = ConsumerIssue(
        consumer_id=consumer.id,
        ticket_number=ticket_num,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        status="SUBMITTED"
    )
    db.add(new_issue)
    try:
        db.commit()
        db.refresh(new_issue)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during issue submission.")

    return IssueResponse(
        id=new_issue.id,
        ticket_number=new_issue.ticket_number,
        consumer_name=consumer.name,
        category=new_issue.category,
        subject=new_issue.subject,
        description=new_issue.description,
        status=new_issue.status,
        created_at=new_issue.created_at
    )

@router.get("", response_model=List[IssueResponse])
def list_all_issues(
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin reviews all consumer issues across the distribution grid."""
    issues = db.query(ConsumerIssue).join(Consumer).order_by(ConsumerIssue.created_at.desc()).all()
    return [
        IssueResponse(
            id=i.id,
            ticket_number=i.ticket_number,
            consumer_name=i.consumer.name,
            category=i.category,
            subject=i.subject,
            description=i.description,
            status=i.status,
            response_notes=i.response_notes,
            resolved_at=i.resolved_at,
            created_at=i.created_at
        )
        for i in issues
    ]

@router.post("/{issue_id}/respond")
def respond_to_issue(
    issue_id: int,
    payload: IssueResolveRequest,
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin updates issue status and records official response."""
    issue = db.query(ConsumerIssue).filter(ConsumerIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = payload.status
    issue.response_notes = payload.response_notes
    if payload.status in ["RESOLVED", "CLOSED"]:
        issue.resolved_at = datetime.now(UTC)

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ISSUE_RESOLVED",
        entity_type="CONSUMER_ISSUE",
        entity_id=str(issue.id),
        details={"ticket": issue.ticket_number, "status": payload.status}
    )
    db.add(audit)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during issue response update.")

    return {"message": f"Issue {issue.ticket_number} updated to {payload.status}."}

@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue_by_id(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves single issue with strict ownership validation."""
    issue = db.query(ConsumerIssue).filter(ConsumerIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue ticket not found")

    if current_user.role == "CONSUMER":
        if not current_user.consumer or issue.consumer_id != current_user.consumer.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only view issues submitted by your own account.")
    elif current_user.role != "BOARD_COMMUNICATION_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied: Not authorized to view consumer issues.")

    return IssueResponse(
        id=issue.id,
        ticket_number=issue.ticket_number,
        consumer_name=issue.consumer.name,
        category=issue.category,
        subject=issue.subject,
        description=issue.description,
        status=issue.status,
        response_notes=issue.response_notes,
        resolved_at=issue.resolved_at,
        created_at=issue.created_at
    )
