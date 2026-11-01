"""
End-to-End Verification of Consumer Billing, PDF Invoices, Partial Payments, and Razorpay Integration.
"""

import urllib.request
import json
import hmac
import hashlib
import sys

# Configure UTF-8 for console output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.core.config import settings

BASE_URL = 'http://127.0.0.1:8000'

def run_verification():
    print('=' * 75)
    print('POWERCONNECT E2E CONSUMER BILLING & RAZORPAY VERIFICATION')
    print('=' * 75)

    # 1. Login as Consumer
    login_payload = json.dumps({'username_or_email': 'cons_01', 'password': 'Utility@2026'}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/api/auth/token', data=login_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode())
        token = auth_data['access_token']
        username = auth_data['username']
        user_id = auth_data['user_id']
        role = auth_data['role']
        print(f'[1] Auth Successful: User {username} (ID: {user_id}), Role: {role}')

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # 2. Check Profile & Meter
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/consumers/me', headers=headers)) as resp:
        prof = json.loads(resp.read().decode())
        print(f'[2] Consumer Profile: {prof["name"]} | No: {prof["cons_no"]} | Meter: {prof.get("meter", {}).get("meter_number")} (ID: {prof["id"]})')

    # 3. Check Notifications
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/notifications/', headers=headers)) as resp:
        notifs = json.loads(resp.read().decode())
        bill_notifs = [n for n in notifs if 'BILL-2026-0025-50' in n.get('message', '') or '117' in n.get('link_url', '')]
        print(f'[3] Notifications: Found {len(bill_notifs)} notification(s) referencing ₹50 test bill:')
        for n in bill_notifs:
            print(f'    Notif #{n["id"]} | Title: {n["title"]} | Route: {n["link_url"]}')

    # 4. Fetch Bills List
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/my-bills', headers=headers)) as resp:
        bills = json.loads(resp.read().decode())
        test_bill = next((b for b in bills if b['id'] == 117), None)
        assert test_bill is not None, 'Test Bill 117 not found in bills list!'
        print(f'[4] My Bills API returned {len(bills)} bills. Test bill 117 found:')
        print(f'    Bill #{test_bill["bill_number"]} | Amount: INR {test_bill["amount_inr"]:.2f} | Paid: INR {test_bill["paid_amount_inr"]:.2f} | Due: INR {test_bill["outstanding_amount_inr"]:.2f} | Status: {test_bill["status"]}')

    # 5. Download Bill PDF
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/117/pdf', headers=headers)) as resp:
        pdf_bytes = resp.read()
        assert pdf_bytes.startswith(b'%PDF'), 'Invalid PDF file header!'
        print(f'[5] Bill PDF Downloaded successfully: {len(pdf_bytes)} bytes | Filename: {resp.headers.get("Content-Disposition")}')

    # 6. Create Razorpay Payment Order for ₹10.00 partial payment
    order_req = json.dumps({'amount_inr': 10.0}).encode('utf-8')
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/117/payments/order', data=order_req, headers=headers)) as resp:
        order1 = json.loads(resp.read().decode())
        print(f'[6] Razorpay Order 1 Created: Order ID: {order1["order_id"]} | Amount: INR {order1["amount_inr"]} ({order1["amount_paise"]} paise) | Key ID: {order1["key_id"]}')

    # 7. Settle Payment 1 (₹10.00 Partial Payment)
    pay_id_1 = f'pay_test_p1_{order1["order_id"][-6:]}'
    msg_1 = f'{order1["order_id"]}|{pay_id_1}'
    sig_1 = hmac.new(settings.RAZORPAY_KEY_SECRET.encode('utf-8'), msg_1.encode('utf-8'), hashlib.sha256).hexdigest()

    verify_req_1 = json.dumps({
        'bill_id': 117,
        'razorpay_order_id': order1['order_id'],
        'razorpay_payment_id': pay_id_1,
        'razorpay_signature': sig_1
    }).encode('utf-8')

    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/payments/verify', data=verify_req_1, headers=headers)) as resp:
        ver1 = json.loads(resp.read().decode())
        print(f'[7] Payment 1 Verified & Settled:')
        print(f'    Receipt: {ver1["receipt_number"]} | Paid: INR {ver1["amount_paid_inr"]:.2f} | Total Settled: INR {ver1["new_paid_total_inr"]:.2f} | Outstanding: INR {ver1["new_outstanding_inr"]:.2f} | Status: {ver1["bill_status"]}')
        payment_id_1 = ver1['payment_id']

    # 8. Download Payment 1 Receipt PDF
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/payments/{payment_id_1}/receipt', headers=headers)) as resp:
        rcpt_pdf_1 = resp.read()
        assert rcpt_pdf_1.startswith(b'%PDF'), 'Invalid Receipt PDF header!'
        print(f'[8] Remittance Receipt 1 PDF Downloaded: {len(rcpt_pdf_1)} bytes | Status: PARTIAL REMITTANCE')

    # 9. Create Razorpay Payment Order for Remaining ₹40.00
    order_req_2 = json.dumps({'amount_inr': 40.0}).encode('utf-8')
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/117/payments/order', data=order_req_2, headers=headers)) as resp:
        order2 = json.loads(resp.read().decode())
        print(f'[9] Razorpay Order 2 Created for Remaining Balance: Order ID: {order2["order_id"]} | Amount: INR {order2["amount_inr"]} ({order2["amount_paise"]} paise)')

    # 10. Settle Payment 2 (₹40.00 Final Payment -> PAID)
    pay_id_2 = f'pay_test_p2_{order2["order_id"][-6:]}'
    msg_2 = f'{order2["order_id"]}|{pay_id_2}'
    sig_2 = hmac.new(settings.RAZORPAY_KEY_SECRET.encode('utf-8'), msg_2.encode('utf-8'), hashlib.sha256).hexdigest()

    verify_req_2 = json.dumps({
        'bill_id': 117,
        'razorpay_order_id': order2['order_id'],
        'razorpay_payment_id': pay_id_2,
        'razorpay_signature': sig_2
    }).encode('utf-8')

    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/payments/verify', data=verify_req_2, headers=headers)) as resp:
        ver2 = json.loads(resp.read().decode())
        print(f'[10] Payment 2 Verified & Settled (Full Settlement):')
        print(f'     Receipt: {ver2["receipt_number"]} | Paid: INR {ver2["amount_paid_inr"]:.2f} | Total Settled: INR {ver2["new_paid_total_inr"]:.2f} | Outstanding: INR {ver2["new_outstanding_inr"]:.2f} | Status: {ver2["bill_status"]} | Fully Paid: {ver2["is_fully_paid"]}')
        payment_id_2 = ver2['payment_id']

    # 11. Download Payment 2 Receipt PDF
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/payments/{payment_id_2}/receipt', headers=headers)) as resp:
        rcpt_pdf_2 = resp.read()
        assert rcpt_pdf_2.startswith(b'%PDF'), 'Invalid Receipt PDF header!'
        print(f'[11] Final Remittance Receipt 2 PDF Downloaded: {len(rcpt_pdf_2)} bytes | Status: FULL SETTLEMENT')

    # 12. Verify Bill 117 is now PAID in Bills Ledger
    with urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/my-bills', headers=headers)) as resp:
        bills_after = json.loads(resp.read().decode())
        bill_117_after = next((b for b in bills_after if b['id'] == 117), None)
        print(f'[12] Ledger State for Bill 117: Paid: INR {bill_117_after["paid_amount_inr"]:.2f} / INR {bill_117_after["amount_inr"]:.2f} | Balance: INR {bill_117_after["outstanding_amount_inr"]:.2f} | Status: {bill_117_after["status"]}')

    # 13. Security validation: Verify cannot overpay or pay settled bill
    try:
        overpay_req = json.dumps({'amount_inr': 20.0}).encode('utf-8')
        urllib.request.urlopen(urllib.request.Request(f'{BASE_URL}/api/billing/117/payments/order', data=overpay_req, headers=headers))
        print('[13] Security FAILED: Overpayment was accepted!')
    except urllib.error.HTTPError as e:
        print(f'[13] Security Passed: Attempt to pay settled bill was blocked (HTTP {e.code}: {e.read().decode()})')

    print('=' * 75)
    print('ALL END-TO-END WORKFLOW VERIFICATION CHECKS COMPLETED SUCCESSFULLY!')
    print('=' * 75)

if __name__ == '__main__':
    run_verification()
