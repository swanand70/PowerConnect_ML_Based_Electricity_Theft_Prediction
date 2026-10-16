"""
Test Suite: Demo Notifications & Board Notices Verification (UX & Data Integrity)

Verifies:
1. Consumer demonstration notifications (count >= 6-8, categories, timestamps, valid messages).
2. Strict recipient isolation between consumers (cons_01 vs cons_02).
3. Notification read / unread mutations (single read, mark all as read).
4. Board notice demonstration records (published notices vs drafts).
5. Public feed security: drafts strictly excluded from public /api/posts.
6. Board Admin feed: both drafts and published notices visible to authorized admin.
7. Role-based access control: consumers cannot access admin endpoints.
8. Idempotent seeding: repeated runs do not duplicate records.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.entities import Notification, BoardPost, User
from database.init_db import init_and_seed_database

client = TestClient(app)


def get_token(username: str, password: str = "Utility@2026") -> str:
    res = client.post("/api/auth/login", json={"username_or_email": username, "password": password})
    assert res.status_code == 200, f"Authentication failed for {username}: {res.text}"
    return res.json()["access_token"]


# ============================================================================
# 1. CONSUMER DEMONSTRATION NOTIFICATIONS
# ============================================================================
def test_consumer_notifications_seeding_and_categories():
    """Verify cons_01 has >= 6 realistic demonstration notifications across diverse categories."""
    token = get_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.json()

    assert len(notifs) >= 6, f"Expected at least 6 demo notifications for cons_01, got {len(notifs)}"

    # Check categories
    categories = {n.get("category") for n in notifs}
    expected_categories = {"BILL", "PAYMENT", "REMINDER", "SERVICE", "ANNOUNCEMENT", "USAGE", "MAINTENANCE", "ACCOUNT"}
    overlap = categories.intersection(expected_categories)
    assert len(overlap) >= 5, f"Expected notifications across diverse categories, found: {categories}"

    # Check that each notification has valid title, message, and created_at
    for n in notifs:
        assert n["title"] and len(n["title"].strip()) > 5
        assert n["message"] and len(n["message"].strip()) > 10
        assert n["created_at"]
        assert "is_read" in n


def test_consumer_notification_recipient_isolation():
    """Verify notification records are strictly isolated by recipient."""
    token_1 = get_token("cons_01")
    token_2 = get_token("cons_02")

    res_1 = client.get("/api/notifications", headers={"Authorization": f"Bearer {token_1}"})
    res_2 = client.get("/api/notifications", headers={"Authorization": f"Bearer {token_2}"})

    assert res_1.status_code == 200
    assert res_2.status_code == 200

    notifs_1 = res_1.json()
    notifs_2 = res_2.json()

    ids_1 = {n["id"] for n in notifs_1}
    ids_2 = {n["id"] for n in notifs_2}

    # Intersections must be empty - total isolation
    assert ids_1.isdisjoint(ids_2), f"Security breach: notification IDs shared between users: {ids_1 & ids_2}"


def test_notification_read_unread_workflow():
    """Verify single mark read and mark-all-read behavior."""
    token = get_token("cons_01")
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve notifications
    res = client.get("/api/notifications", headers=headers)
    notifs = res.json()
    unread_notifs = [n for n in notifs if not n["is_read"]]

    if unread_notifs:
        target_id = unread_notifs[0]["id"]
        # Mark single read
        post_single = client.post(f"/api/notifications/{target_id}/read", headers=headers)
        assert post_single.status_code == 200

    # Mark all read
    post_res = client.post("/api/notifications/read-all", headers=headers)
    assert post_res.status_code == 200

    # Verify all are now read
    res_after = client.get("/api/notifications", headers=headers)
    for n in res_after.json():
        assert n["is_read"] is True, f"Notification {n['id']} should be marked read"


# ============================================================================
# 2. BOARD DEMONSTRATION NOTICES & PUBLICATION WORKFLOW
# ============================================================================
def test_board_notices_seeding_and_classification():
    """Verify board notices contain both published and draft records."""
    token_admin = get_token("board_admin")
    headers = {"Authorization": f"Bearer {token_admin}"}

    res = client.get("/api/posts/admin", headers=headers)
    assert res.status_code == 200
    all_posts = res.json()

    assert len(all_posts) >= 5, f"Expected at least 5-6 board posts, got {len(all_posts)}"

    published = [p for p in all_posts if p["is_published"]]
    drafts = [p for p in all_posts if not p["is_published"]]

    assert len(published) >= 3, f"Expected at least 3-4 published notices, got {len(published)}"
    assert len(drafts) >= 1, f"Expected at least 1-2 draft notices, got {len(drafts)}"


def test_draft_notices_hidden_from_public_feed():
    """Public /api/posts must NEVER expose draft notices."""
    res_public = client.get("/api/posts")
    assert res_public.status_code == 200
    public_posts = res_public.json()

    # Public posts must all be published
    for p in public_posts:
        # Check against db directly
        db = SessionLocal()
        try:
            db_post = db.query(BoardPost).filter(BoardPost.id == p["id"]).first()
            assert db_post is not None
            assert db_post.is_published is True, f"Draft post {p['id']} leaked into public feed"
        finally:
            db.close()

    # Also verify known draft title does not appear
    public_titles = [p["title"] for p in public_posts]
    assert not any("Draft" in title for title in public_titles), f"Draft title found in public posts: {public_titles}"


def test_board_admin_role_enforcement():
    """Only BOARD_COMMUNICATION_ADMIN can access admin post management."""
    # Unauthenticated
    res_unauth = client.get("/api/posts/admin")
    assert res_unauth.status_code == 401

    # Unauthorized role (Consumer)
    token_consumer = get_token("cons_01")
    res_consumer = client.get("/api/posts/admin", headers={"Authorization": f"Bearer {token_consumer}"})
    assert res_consumer.status_code == 403, "Consumer should not have access to board admin endpoints"


# ============================================================================
# 3. IDEMPOTENT SEEDING VERIFICATION
# ============================================================================
def test_seeding_idempotency_prevents_duplicate_records():
    """Re-executing the seed routine must not create duplicate notices or notifications."""
    db = SessionLocal()
    try:
        post_count_before = db.query(BoardPost).count()
        notif_count_before = db.query(Notification).count()
    finally:
        db.close()

    # Run seed routine again
    init_and_seed_database()

    db2 = SessionLocal()
    try:
        post_count_after = db2.query(BoardPost).count()
        notif_count_after = db2.query(Notification).count()

        assert post_count_after == post_count_before, (
            f"Idempotency failed: board_posts changed from {post_count_before} to {post_count_after}"
        )
        assert notif_count_after == notif_count_before, (
            f"Idempotency failed: notifications changed from {notif_count_before} to {notif_count_after}"
        )
    finally:
        db2.close()
