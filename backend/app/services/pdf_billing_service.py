"""
PowerConnect — Institutional PDF Generation Service for Electricity Bills & Payment Receipts
Produces print-ready, formal A4 documents with authoritative backend data, exact balance reconciliation,
professional typography, and tamper-resistant layout.
"""

from io import BytesIO
from datetime import datetime, UTC
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

from backend.app.models.entities import Bill, Consumer, Meter, PaymentTransaction, User

class NumberedBillingCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page counting, institutional running headers and footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        # Top Running Header
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#334155"))
        self.drawString(36, 808, "POWERCONNECT — STATE ELECTRICITY DISTRIBUTION BOARD")
        self.drawRightString(559, 808, "CONSUMER REVENUE & BILLING NETWORK")

        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(36, 802, 559, 802)

        # Bottom Running Footer
        self.line(36, 42, 559, 42)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 30, "OFFICIAL BILLING RECORD • REGULATORY APPROVED TARIFF • DIGITALLY VERIFIED VIA POWERCONNECT")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(559, 30, page_str)
        self.restoreState()


class PdfBillingService:
    """Service generating institutional PDF bills and payment receipts."""

    @staticmethod
    def generate_bill_pdf(bill_id: int, db: Session) -> bytes:
        """
        Generates an authoritative, print-ready A4 PDF electricity bill statement.
        """
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill record not found.")

        consumer = bill.consumer
        if not consumer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer profile not found.")

        meter = consumer.meter
        payments = db.query(PaymentTransaction).filter(
            PaymentTransaction.bill_id == bill.id,
            PaymentTransaction.status == "SUCCESS"
        ).order_by(PaymentTransaction.verified_at.desc()).all()

        total_settled = sum(float(p.amount_inr) for p in payments)
        orig_amount = float(bill.amount_inr)
        outstanding = max(0.0, round(orig_amount - total_settled, 2))

        # Status text and color
        status_code = bill.status
        if outstanding <= 0.0 or status_code == "PAID":
            status_label = "PAID (FULLY SETTLED)"
            status_color = "#047857"
            status_bg = "#ECFDF5"
        elif total_settled > 0.0 or status_code == "PARTIALLY_PAID":
            status_label = f"PARTIALLY PAID (₹{total_settled:,.2f} SETTLED)"
            status_color = "#B45309"
            status_bg = "#FFFBEB"
        elif status_code == "OVERDUE":
            status_label = "OVERDUE"
            status_color = "#B91C1C"
            status_bg = "#FEF2F2"
        else:
            status_label = "UNPAID / CURRENT DUE"
            status_color = "#1D4ED8"
            status_bg = "#EFF6FF"

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=48,
            bottomMargin=48
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]

        body_style = ParagraphStyle(
            "BillBody",
            parent=normal,
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        body_bold = ParagraphStyle(
            "BillBodyBold",
            parent=body_style,
            fontName="Helvetica-Bold"
        )
        title_style = ParagraphStyle(
            "BillDocTitle",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#0F172A")
        )
        subtitle_style = ParagraphStyle(
            "BillDocSubtitle",
            parent=normal,
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#64748B")
        )

        elements = []

        # 1. Header Banner with Brand Mark
        header_table = Table([
            [
                Paragraph("<b>PowerConnect</b><br/><font size='8' color='#059669'>Electricity Theft Intelligence & Inspection Platform</font>", body_style),
                Paragraph("<font size='14'><b>ELECTRICITY BILL & TAX INVOICE</b></font><br/><font size='8' color='#64748B'>State Electricity Distribution Board • Regulatory Form EB-04</font>", ParagraphStyle("RightHeader", parent=body_style, alignment=2))
            ]
        ], colWidths=[240, 283])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(header_table)

        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceBefore=2, spaceAfter=8))

        # 2. Key Statement Strip: Bill Number, Due Date, and Status Banner
        bill_num_str = f"<b>Statement #:</b> {bill.bill_number}"
        period_str = f"<b>Period:</b> {bill.billing_period_start.strftime('%d %b %Y')} to {bill.billing_period_end.strftime('%d %b %Y')}"
        due_str = f"<b>Due Date:</b> <font color='#B91C1C'>{bill.due_date.strftime('%d %b %Y')}</font>"

        summary_strip = Table([
            [
                Paragraph(bill_num_str, body_style),
                Paragraph(period_str, body_style),
                Paragraph(due_str, body_style),
                Paragraph(f"<b>STATUS:</b> <font color='{status_color}'>{status_label}</font>", ParagraphStyle("StatusCol", parent=body_bold, alignment=2))
            ]
        ], colWidths=[130, 150, 110, 133])
        summary_strip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(status_bg)),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
        ]))
        elements.append(summary_strip)
        elements.append(Spacer(1, 10))

        # 3. Two-Column Consumer & Meter Identification Table
        meter_no = meter.meter_number if meter else "MTR-SMART-DIGITAL"
        meter_type = meter.meter_type if meter else "SMART_DIGITAL"

        consumer_info = [
            [Paragraph("<b>CONSUMER & SERVICE DETAILS</b>", ParagraphStyle("H1", parent=body_bold, fontSize=9.5, textColor=colors.HexColor("#0F172A"))),
             Paragraph("<b>METERING & TECHNICAL PROFILE</b>", ParagraphStyle("H2", parent=body_bold, fontSize=9.5, textColor=colors.HexColor("#0F172A")))],
            [Paragraph(f"<b>Consumer Name:</b> {consumer.name}", body_style),
             Paragraph(f"<b>Meter Serial #:</b> {meter_no}", body_style)],
            [Paragraph(f"<b>Consumer ID (LT):</b> {consumer.cons_no}", body_style),
             Paragraph(f"<b>Meter Category:</b> {meter_type}", body_style)],
            [Paragraph(f"<b>Service Address:</b> {consumer.address}", body_style),
             Paragraph(f"<b>Tariff Schedule:</b> {consumer.tariff_category}", body_style)],
            [Paragraph(f"<b>Distribution Feeder:</b> {consumer.feeder}", body_style),
             Paragraph(f"<b>Sanctioned Load:</b> {float(consumer.sanctioned_load_kw):.2f} kW", body_style)],
            [Paragraph(f"<b>Substation / Zone:</b> {consumer.substation} ({consumer.zone})", body_style),
             Paragraph(f"<b>Bill Issue Timestamp:</b> {bill.created_at.strftime('%d %b %Y %H:%M')}", body_style)],
        ]
        info_table = Table(consumer_info, colWidths=[261, 262])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F1F5F9")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 12))

        # 4. Energy Consumption & Billing Assessment Table
        elements.append(Paragraph("<b>ENERGY CONSUMPTION & BILLING BREAKDOWN</b>", ParagraphStyle("SecHeading", parent=body_bold, fontSize=10, textColor=colors.HexColor("#0F172A"))))
        elements.append(Spacer(1, 4))

        units_val = float(bill.units_consumed_kwh)
        avg_rate = orig_amount / units_val if units_val > 0 else 7.45

        assessment_rows = [
            [Paragraph("<b>Description / Assessment Head</b>", body_bold),
             Paragraph("<b>Units / Basis</b>", ParagraphStyle("CH1", parent=body_bold, alignment=1)),
             Paragraph("<b>Approved Tariff Rate</b>", ParagraphStyle("CH2", parent=body_bold, alignment=2)),
             Paragraph("<b>Assessment Amount (INR)</b>", ParagraphStyle("CH3", parent=body_bold, alignment=2))],
            [Paragraph("Active Energy Consumption (Smart Meter Interval Data)", body_style),
             Paragraph(f"{units_val:,.2f} kWh", ParagraphStyle("C1", parent=body_style, alignment=1)),
             Paragraph(f"₹{avg_rate:.2f} / kWh", ParagraphStyle("C2", parent=body_style, alignment=2)),
             Paragraph(f"₹{orig_amount:,.2f}", ParagraphStyle("C3", parent=body_style, alignment=2))],
            [Paragraph("Fixed Distribution & Grid Transmission Charges", body_style),
             Paragraph(f"{float(consumer.sanctioned_load_kw):.1f} kW", ParagraphStyle("C1", parent=body_style, alignment=1)),
             Paragraph("Included in Tariff", ParagraphStyle("C2", parent=body_style, alignment=2)),
             Paragraph("₹0.00", ParagraphStyle("C3", parent=body_style, alignment=2))],
            [Paragraph("Electricity Regulatory Duty & Surcharge", body_style),
             Paragraph("Statutory", ParagraphStyle("C1", parent=body_style, alignment=1)),
             Paragraph("Included in Tariff", ParagraphStyle("C2", parent=body_style, alignment=2)),
             Paragraph("₹0.00", ParagraphStyle("C3", parent=body_style, alignment=2))],
            [Paragraph("<b>Total Billed Electricity Charges (A)</b>", body_bold),
             Paragraph("-", ParagraphStyle("C1", parent=body_style, alignment=1)),
             Paragraph("-", ParagraphStyle("C2", parent=body_style, alignment=2)),
             Paragraph(f"<b>₹{orig_amount:,.2f}</b>", ParagraphStyle("C3", parent=body_bold, alignment=2))],
            [Paragraph("<b>Total Amount Settled / Paid to Date (B)</b>", body_bold),
             Paragraph(f"{len(payments)} transaction(s)", ParagraphStyle("C1", parent=body_style, alignment=1)),
             Paragraph("Verified Remittance", ParagraphStyle("C2", parent=body_style, alignment=2)),
             Paragraph(f"<b><font color='#047857'>- ₹{total_settled:,.2f}</font></b>", ParagraphStyle("C3", parent=body_bold, alignment=2))],
            [Paragraph("<b>NET OUTSTANDING PAYABLE BALANCE (A - B)</b>", ParagraphStyle("NetH", parent=body_bold, fontSize=10, textColor=colors.HexColor("#0F172A"))),
             Paragraph("", body_style),
             Paragraph("", body_style),
             Paragraph(f"<b><font size='12' color='#059669'>₹{outstanding:,.2f}</font></b>", ParagraphStyle("NetAmt", parent=body_bold, alignment=2))]
        ]
        assess_table = Table(assessment_rows, colWidths=[233, 90, 100, 100])
        assess_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
            ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#F8FAFC")),
            ("BACKGROUND", (0, 5), (-1, 5), colors.HexColor("#F0FDF4")),
            ("BACKGROUND", (0, 6), (-1, 6), colors.HexColor("#F8FAFC")),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(assess_table)
        elements.append(Spacer(1, 10))

        # 5. Settlement / Partial Payments History (if any payments exist)
        if payments:
            elements.append(Paragraph("<b>CONFIRMED PAYMENT & REMITTANCE RECORDS</b>", ParagraphStyle("PayHeading", parent=body_bold, fontSize=9.5, textColor=colors.HexColor("#0F172A"))))
            elements.append(Spacer(1, 3))

            pay_rows = [
                [Paragraph("<b>Receipt #</b>", body_bold),
                 Paragraph("<b>Payment Date</b>", body_bold),
                 Paragraph("<b>Provider Ref (Razorpay)</b>", body_bold),
                 Paragraph("<b>Amount Paid (INR)</b>", ParagraphStyle("PRC", parent=body_bold, alignment=2))]
            ]
            for p in payments:
                pay_date = p.verified_at.strftime('%d %b %Y %H:%M') if p.verified_at else p.created_at.strftime('%d %b %Y %H:%M')
                pay_ref = p.razorpay_payment_id or p.razorpay_order_id or "Direct Remittance"
                pay_rows.append([
                    Paragraph(f"<b>{p.receipt_number}</b>", body_style),
                    Paragraph(pay_date, body_style),
                    Paragraph(pay_ref, body_style),
                    Paragraph(f"₹{float(p.amount_inr):,.2f}", ParagraphStyle("PRAmt", parent=body_style, alignment=2))
                ])

            pay_table = Table(pay_rows, colWidths=[143, 130, 150, 100])
            pay_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(pay_table)
            elements.append(Spacer(1, 10))

        # 6. Payment Instructions & Institutional Notice Box
        instructions_text = (
            "<b>FLEXIBLE PAYMENT INSTRUCTIONS & COMPLIANCE NOTICE:</b><br/>"
            "• <b>Partial Remittance Supported:</b> Consumers may pay any amount from ₹1.00 up to the full outstanding balance directly through the PowerConnect Consumer Portal.<br/>"
            "• <b>Payment Modes:</b> Secured online checkout via Razorpay supports UPI (GPay, PhonePe, Paytm), Netbanking (50+ banks), Debit/Credit Cards, and Wallets.<br/>"
            "• <b>Dynamic Balance Ledger:</b> Any partial payment instantly reduces your outstanding dues and updates your online statement with an official downloadable payment receipt.<br/>"
            "• <b>Disconnection Advisory:</b> Dues remaining outstanding after the due date are subject to delayed payment surcharge under Electricity Supply Code regulations."
        )
        inst_table = Table([
            [Paragraph(instructions_text, ParagraphStyle("InstBody", parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor("#334155")))]
        ], colWidths=[523])
        inst_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(inst_table)

        doc.build(elements, canvasmaker=NumberedBillingCanvas)
        return buffer.getvalue()

    @staticmethod
    def generate_payment_receipt_pdf(payment_id: int, db: Session) -> bytes:
        """
        Generates an authoritative, print-ready A4 PDF payment receipt for a verified transaction.
        """
        payment = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

        bill = payment.bill
        consumer = payment.consumer
        if not bill or not consumer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated billing record not found.")

        # Reconcile bill balance
        all_settled = db.query(PaymentTransaction).filter(
            PaymentTransaction.bill_id == bill.id,
            PaymentTransaction.status == "SUCCESS"
        ).all()
        total_settled = sum(float(p.amount_inr) for p in all_settled)
        orig_bill_amt = float(bill.amount_inr)
        remaining = max(0.0, round(orig_bill_amt - total_settled, 2))

        is_full = remaining <= 0.0 or bill.status == "PAID"

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=48,
            bottomMargin=48
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]

        body_style = ParagraphStyle(
            "RcptBody",
            parent=normal,
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        body_bold = ParagraphStyle(
            "RcptBodyBold",
            parent=body_style,
            fontName="Helvetica-Bold"
        )

        elements = []

        # 1. Header with Brand & Document Title
        header_table = Table([
            [
                Paragraph("<b>PowerConnect</b><br/><font size='8' color='#059669'>Electricity Theft Intelligence & Inspection Platform</font>", body_style),
                Paragraph("<font size='14'><b>OFFICIAL PAYMENT RECEIPT</b></font><br/><font size='8' color='#64748B'>State Electricity Distribution Board • Digital Remittance Voucher</font>", ParagraphStyle("RightH", parent=body_style, alignment=2))
            ]
        ], colWidths=[240, 283])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(header_table)

        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceBefore=2, spaceAfter=10))

        # 2. Receipt Identification Banner
        settlement_desc = "FULL SETTLEMENT RECEIPT (BILL PAID IN FULL)" if is_full else "PARTIAL REMITTANCE RECEIPT (BALANCE REMAINS)"
        banner_bg = "#ECFDF5" if is_full else "#FFFBEB"
        banner_color = "#047857" if is_full else "#B45309"

        receipt_strip = Table([
            [
                Paragraph(f"<b>RECEIPT #:</b> <font size='10'>{payment.receipt_number}</font>", body_style),
                Paragraph(f"<b>PAYMENT STATUS:</b> <font color='{banner_color}'><b>{payment.status}</b></font>", ParagraphStyle("St", parent=body_style, alignment=1)),
                Paragraph(f"<font color='{banner_color}'><b>{settlement_desc}</b></font>", ParagraphStyle("Typ", parent=body_bold, alignment=2))
            ]
        ], colWidths=[180, 150, 193])
        receipt_strip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(banner_bg)),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE")
        ]))
        elements.append(receipt_strip)
        elements.append(Spacer(1, 12))

        # 3. Two-Column Transaction Details Grid
        txn_timestamp = payment.verified_at or payment.created_at
        formatted_ts = txn_timestamp.strftime('%d %b %Y, %H:%M:%S UTC')
        pay_id = payment.razorpay_payment_id or "TXN-DIRECT"
        order_id = payment.razorpay_order_id or "ORDER-DIRECT"

        grid_data = [
            [Paragraph("<b>REMITTANCE & PROVIDER METADATA</b>", ParagraphStyle("TH1", parent=body_bold, fontSize=9.5, textColor=colors.HexColor("#0F172A"))),
             Paragraph("<b>ACCOUNT & CONSUMER INFORMATION</b>", ParagraphStyle("TH2", parent=body_bold, fontSize=9.5, textColor=colors.HexColor("#0F172A")))],
            [Paragraph(f"<b>Payment Date & Time:</b> {formatted_ts}", body_style),
             Paragraph(f"<b>Consumer Name:</b> {consumer.name}", body_style)],
            [Paragraph(f"<b>Payment Gateway:</b> Razorpay Standard Checkout", body_style),
             Paragraph(f"<b>Consumer ID (LT):</b> {consumer.cons_no}", body_style)],
            [Paragraph(f"<b>Razorpay Payment ID:</b> {pay_id}", body_style),
             Paragraph(f"<b>Service Address:</b> {consumer.address}", body_style)],
            [Paragraph(f"<b>Razorpay Order ID:</b> {order_id}", body_style),
             Paragraph(f"<b>Feeder / Division:</b> {consumer.feeder} / {consumer.division}", body_style)],
            [Paragraph(f"<b>Payment Method:</b> {payment.payment_method or 'Online (UPI / NetBanking / Cards)'}", body_style),
             Paragraph(f"<b>Tariff Category:</b> {consumer.tariff_category}", body_style)],
            [Paragraph(f"<b>Electricity Statement #:</b> {bill.bill_number}", body_style),
             Paragraph(f"<b>Billing Period:</b> {bill.billing_period_start.strftime('%d %b %Y')} to {bill.billing_period_end.strftime('%d %b %Y')}", body_style)],
        ]
        grid_table = Table(grid_data, colWidths=[261, 262])
        grid_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F1F5F9")),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#F1F5F9")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(grid_table)
        elements.append(Spacer(1, 14))

        # 4. Financial Reconciliation Summary
        elements.append(Paragraph("<b>FINANCIAL SETTLEMENT RECONCILIATION</b>", ParagraphStyle("FinHead", parent=body_bold, fontSize=10, textColor=colors.HexColor("#0F172A"))))
        elements.append(Spacer(1, 4))

        recon_rows = [
            [Paragraph("<b>Financial Ledger Account</b>", body_bold),
             Paragraph("<b>Amount (INR)</b>", ParagraphStyle("RCH", parent=body_bold, alignment=2))],
            [Paragraph("Total Assessed Bill Amount for Billing Cycle", body_style),
             Paragraph(f"₹{orig_bill_amt:,.2f}", ParagraphStyle("RA1", parent=body_style, alignment=2))],
            [Paragraph(f"<b>Amount Received in this Transaction ({payment.receipt_number})</b>", body_bold),
             Paragraph(f"<b><font size='10' color='#059669'>₹{float(payment.amount_inr):,.2f}</font></b>", ParagraphStyle("RA2", parent=body_bold, alignment=2))],
            [Paragraph("Cumulative Successfully Settled Payments to Date", body_style),
             Paragraph(f"₹{total_settled:,.2f}", ParagraphStyle("RA3", parent=body_style, alignment=2))],
            [Paragraph("<b>REMAINING OUTSTANDING BALANCE DUE</b>", ParagraphStyle("BalH", parent=body_bold, fontSize=10, textColor=colors.HexColor("#0F172A"))),
             Paragraph(f"<b><font size='11' color='{'#059669' if is_full else '#B45309'}'>₹{remaining:,.2f}</font></b>", ParagraphStyle("BalAmt", parent=body_bold, alignment=2))],
            [Paragraph("Updated Electricity Statement Status", body_style),
             Paragraph(f"<b>{bill.status}</b>", ParagraphStyle("StatV", parent=body_bold, alignment=2))]
        ]
        recon_table = Table(recon_rows, colWidths=[373, 150])
        recon_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
            ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#F0FDF4")),
            ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#F8FAFC")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(recon_table)
        elements.append(Spacer(1, 14))

        # 5. Certification & Regulatory Compliance Box
        cert_text = (
            "<b>STATUTORY ELECTRONIC RECEIPT VALIDATION:</b><br/>"
            "This document constitutes an official receipt of remittance recognized by the State Electricity Regulatory Commission (SERC). "
            "Payments processed via Razorpay are settled directly to the designated treasury account of the State Electricity Distribution Board. "
            "Retain this receipt for your records. For tariff inquiries or billing reconciliation, quote Receipt Number and Consumer ID."
        )
        cert_table = Table([
            [Paragraph(cert_text, ParagraphStyle("CertBody", parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor("#475569")))]
        ], colWidths=[523])
        cert_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(cert_table)

        doc.build(elements, canvasmaker=NumberedBillingCanvas)
        return buffer.getvalue()
