"""
Official Board Communication Feed Endpoints
"""

from typing import List, Optional
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.entities import User, BoardPost, InspectionCase, InspectionResult, AuditLog
from backend.app.schemas.portal import (
    BoardPostCreateRequest,
    BoardPostUpdateRequest,
    BoardPostResponse,
    BoardPostAdminResponse,
    AggregateEnforcementStats
)
from backend.app.api.deps import require_role, get_current_user

router = APIRouter()

@router.get("", response_model=List[BoardPostResponse])
def list_board_posts(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Public & Consumer endpoint to view official published utility communications."""
    query = db.query(BoardPost).filter(BoardPost.is_published == True)
    if category and category != "ALL":
        query = query.filter(BoardPost.category == category)

    posts = query.order_by(BoardPost.published_at.desc(), BoardPost.id.desc()).all()

    # Content signature deduplication: ensure distinct publications only
    seen_signatures = set()
    unique_posts = []
    for p in posts:
        sig = (p.title.strip().lower(), p.category)
        if sig not in seen_signatures:
            seen_signatures.add(sig)
            unique_posts.append(p)

    return [
        BoardPostResponse(
            id=p.id,
            author_name=p.author.username if p.author else "Utility Board",
            title=p.title,
            category=p.category,
            summary=p.summary,
            content=p.content,
            published_at=p.published_at or p.created_at,
            is_published=p.is_published
        )
        for p in unique_posts
    ]

@router.get("/enforcement-summary", response_model=AggregateEnforcementStats)
def get_aggregate_enforcement_summary(db: Session = Depends(get_db)):
    """
    Public / Board communication aggregate statistics.
    Strict Anti-Shaming Rule: NEVER exposes individual consumer identities or flags.
    """
    total_completed = db.query(InspectionCase).filter(InspectionCase.status.in_(["OUTCOME_RECORDED", "CLOSED"])).count()
    theft_confirmed = db.query(InspectionCase).filter(InspectionCase.outcome == "THEFT_CONFIRMED").count()
    clean_cases = db.query(InspectionCase).filter(InspectionCase.outcome == "NO_THEFT_FOUND").count()
    inconclusive = db.query(InspectionCase).filter(InspectionCase.outcome == "INCONCLUSIVE").count()

    total_penalty = db.query(func.coalesce(func.sum(InspectionResult.penalty_amount_inr), 0.0)).scalar()
    total_units = db.query(func.coalesce(func.sum(InspectionResult.estimated_units_stolen), 0.0)).scalar()

    return AggregateEnforcementStats(
        total_inspections_completed=total_completed,
        theft_confirmed_count=theft_confirmed,
        clean_inspections_count=clean_cases,
        inconclusive_count=inconclusive,
        total_penalty_assessed_inr=float(total_penalty),
        total_estimated_units_recovered_kwh=float(total_units),
        monitored_feeders_count=18
    )

@router.get("/admin", response_model=List[BoardPostAdminResponse])
def list_admin_board_posts(
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin reviews all communications, including unpublished drafts."""
    posts = db.query(BoardPost).order_by(BoardPost.created_at.desc()).all()
    return [
        BoardPostAdminResponse(
            id=p.id,
            author_name=p.author.username if p.author else "Board Admin",
            title=p.title,
            category=p.category,
            summary=p.summary,
            content=p.content,
            is_published=p.is_published,
            published_at=p.published_at or p.created_at,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in posts
    ]

@router.get("/{post_id}", response_model=BoardPostResponse)
def get_board_post_by_id(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves a single published board post for public/consumer viewing."""
    post = db.query(BoardPost).filter(BoardPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if not post.is_published:
        # Drafts are not exposed publicly
        raise HTTPException(status_code=404, detail="Announcement not found or not yet published")

    return BoardPostResponse(
        id=post.id,
        author_name=post.author.username if post.author else "Utility Board",
        title=post.title,
        category=post.category,
        summary=post.summary,
        content=post.content,
        published_at=post.published_at or post.created_at,
        is_published=post.is_published
    )

@router.post("", response_model=BoardPostAdminResponse)
def create_board_post(
    payload: BoardPostCreateRequest,
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin publishes or drafts a new official notification or scheme announcement."""
    valid_categories = ["POLICY", "SCHEME", "MAINTENANCE", "ADVISORY", "ENERGY_SAVING", "ENFORCEMENT_UPDATE"]
    if payload.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of {valid_categories}")

    is_pub = payload.is_published if payload.is_published is not None else True
    now_dt = datetime.now(UTC)

    new_post = BoardPost(
        author_user_id=current_user.id,
        title=payload.title,
        category=payload.category,
        summary=payload.summary,
        content=payload.content,
        is_published=is_pub,
        published_at=now_dt if is_pub else now_dt
    )
    db.add(new_post)
    try:
        db.commit()
        db.refresh(new_post)
        audit = AuditLog(
            actor_user_id=current_user.id,
            action="BOARD_POST_CREATED",
            entity_type="BOARD_POST",
            entity_id=str(new_post.id),
            details={"title": new_post.title, "category": new_post.category, "is_published": is_pub}
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during board post creation.")

    return BoardPostAdminResponse(
        id=new_post.id,
        author_name=current_user.username,
        title=new_post.title,
        category=new_post.category,
        summary=new_post.summary,
        content=new_post.content,
        is_published=new_post.is_published,
        published_at=new_post.published_at or new_post.created_at,
        created_at=new_post.created_at,
        updated_at=new_post.updated_at
    )

@router.put("/{post_id}", response_model=BoardPostAdminResponse)
def update_board_post(
    post_id: int,
    payload: BoardPostUpdateRequest,
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin edits an existing post or transitions a draft to published."""
    post = db.query(BoardPost).filter(BoardPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Announcement not found")

    valid_categories = ["POLICY", "SCHEME", "MAINTENANCE", "ADVISORY", "ENERGY_SAVING", "ENFORCEMENT_UPDATE"]
    if payload.category and payload.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of {valid_categories}")

    if payload.title is not None:
        post.title = payload.title
    if payload.category is not None:
        post.category = payload.category
    if payload.summary is not None:
        post.summary = payload.summary
    if payload.content is not None:
        post.content = payload.content
    if payload.is_published is not None:
        if payload.is_published and not post.is_published:
            post.published_at = datetime.now(UTC)
        post.is_published = payload.is_published

    try:
        audit = AuditLog(
            actor_user_id=current_user.id,
            action="BOARD_POST_UPDATED",
            entity_type="BOARD_POST",
            entity_id=str(post.id),
            details={"title": post.title, "is_published": post.is_published}
        )
        db.add(audit)
        db.commit()
        db.refresh(post)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during board post update.")

    return BoardPostAdminResponse(
        id=post.id,
        author_name=post.author.username if post.author else current_user.username,
        title=post.title,
        category=post.category,
        summary=post.summary,
        content=post.content,
        is_published=post.is_published,
        published_at=post.published_at or post.created_at,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.delete("/{post_id}")
def delete_board_post(
    post_id: int,
    current_user: User = Depends(require_role(["BOARD_COMMUNICATION_ADMIN"])),
    db: Session = Depends(get_db)
):
    """Board Admin removes or withdraws an official announcement."""
    post = db.query(BoardPost).filter(BoardPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Announcement not found")

    try:
        audit = AuditLog(
            actor_user_id=current_user.id,
            action="BOARD_POST_DELETED",
            entity_type="BOARD_POST",
            entity_id=str(post.id),
            details={"title": post.title}
        )
        db.add(audit)
        db.delete(post)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed during board post deletion.")

    return {"message": f"Announcement #{post_id} successfully deleted."}
