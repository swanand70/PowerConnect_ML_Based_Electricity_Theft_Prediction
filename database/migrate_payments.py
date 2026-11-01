"""
Migration script for PowerConnect Payment Gateway Integration
- Adds paid_amount_inr to bills table
- Updates bills.status ENUM to include 'PARTIALLY_PAID'
- Creates payment_transactions table
- Creates razorpay_webhook_events table
- Ensures cons_01 has an unpaid bill and unread notification for the acceptance workflow
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pymysql
from backend.app.core.config import settings

def run_migration():
    print(f"Connecting to MySQL database '{settings.DB_NAME}' at {settings.DB_HOST}:{settings.DB_PORT}...")
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset='utf8mb4',
        autocommit=False
    )
    cursor = conn.cursor()

    try:
        # 1. Check if paid_amount_inr column exists on bills
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'bills' AND COLUMN_NAME = 'paid_amount_inr';
        """, (settings.DB_NAME,))
        if not cursor.fetchone():
            print("Adding paid_amount_inr column to bills table...")
            cursor.execute("""
                ALTER TABLE bills ADD COLUMN paid_amount_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER amount_inr;
            """)
        else:
            print("Column paid_amount_inr already exists on bills table.")

        # 2. Modify status enum on bills to include PARTIALLY_PAID
        print("Ensuring status ENUM on bills includes 'PARTIALLY_PAID'...")
        cursor.execute("""
            ALTER TABLE bills MODIFY COLUMN status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING';
        """)

        # 3. Synchronize existing PAID bills so paid_amount_inr equals amount_inr
        cursor.execute("""
            UPDATE bills SET paid_amount_inr = amount_inr WHERE status = 'PAID' AND paid_amount_inr = 0.00;
        """)

        # 4. Create payment_transactions table
        print("Creating payment_transactions table if not exists...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bill_id INT NOT NULL,
            consumer_id INT NOT NULL,
            receipt_number VARCHAR(64) NOT NULL UNIQUE,
            amount_inr DECIMAL(10, 2) NOT NULL,
            amount_paise INT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            status ENUM('CREATED', 'ATTEMPTED', 'SUCCESS', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'CREATED',
            razorpay_order_id VARCHAR(100) NULL UNIQUE,
            razorpay_payment_id VARCHAR(100) NULL UNIQUE,
            razorpay_signature VARCHAR(255) NULL,
            idempotency_key VARCHAR(100) NULL UNIQUE,
            payment_method VARCHAR(50) NULL,
            error_code VARCHAR(100) NULL,
            error_description TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            verified_at TIMESTAMP NULL,
            CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE,
            CONSTRAINT fk_payments_consumer FOREIGN KEY (consumer_id) REFERENCES consumers (id) ON DELETE CASCADE,
            INDEX idx_payments_bill (bill_id),
            INDEX idx_payments_consumer (consumer_id),
            INDEX idx_payments_order (razorpay_order_id),
            INDEX idx_payments_payment (razorpay_payment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 5. Create razorpay_webhook_events table
        print("Creating razorpay_webhook_events table if not exists...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id VARCHAR(100) NOT NULL UNIQUE,
            event_type VARCHAR(100) NOT NULL,
            order_id VARCHAR(100) NULL,
            payment_id VARCHAR(100) NULL,
            payload_json JSON NULL,
            processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_webhook_event (event_id),
            INDEX idx_webhook_payment (payment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 6. Ensure cons_01 has an active unpaid bill for end-to-end testing
        cursor.execute("""
            SELECT b.id, b.bill_number, b.amount_inr, u.id FROM bills b
            JOIN consumers c ON b.consumer_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE u.username = 'cons_01' AND b.bill_number = 'BILL-2026-0025-0';
        """)
        b_row = cursor.fetchone()
        if b_row:
            b_id, b_num, b_amt, u_id = b_row
            print(f"Setting bill {b_num} (ID: {b_id}) for cons_01 to PENDING for acceptance testing...")
            cursor.execute("""
                UPDATE bills SET status = 'PENDING', paid_amount_inr = 0.00, paid_at = NULL WHERE id = %s;
            """, (b_id,))
            
            # Also ensure an unread bill notification exists for cons_01
            cursor.execute("""
                SELECT id FROM notifications WHERE user_id = %s AND title LIKE %s;
            """, (u_id, '%Bill%Available%'))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, category, is_read, link_url, created_at)
                    VALUES (%s, 'Electricity Bill Available for Payment', %s, 'BILL', FALSE, '/consumer-portal', NOW());
                """, (u_id, f"Your electricity bill {b_num} of ₹{float(b_amt):.2f} is now ready for review and payment."))

        conn.commit()
        print("Migration and seeding check completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Migration error: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
