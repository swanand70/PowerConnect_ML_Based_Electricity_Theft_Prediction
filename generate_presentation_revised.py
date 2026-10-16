"""
Academic Presentation Generator (Revised Version):
ELECTRICITY THEFT INTELLIGENCE & INSPECTION PLATFORM
Author: Swanand Siknis (24BRS1358)
Degree: B.Tech CSE (AI & Robotics) — VIT Chennai

Generates a revised 36-slide formal academic PowerPoint presentation (.pptx)
focused on Software Engineering methodology, simple and direct language,
consistent Times New Roman typography, blank title-only UML and screenshot slides,
and strictly verified technical claims without GitHub links or AI clichés.
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# ==============================================================================
# DESIGN SYSTEM CONSTANTS
# ==============================================================================
FONT_PRIMARY = 'Times New Roman'

# Dark Editorial Academic Palette
COLOR_BG = RGBColor(16, 18, 22)              # Near-black charcoal #101216
COLOR_CARD_BG = RGBColor(24, 28, 36)         # Dark slate card #181C24
COLOR_CARD_BORDER = RGBColor(45, 55, 72)     # Understated border #2D3748
COLOR_BORDER_LIGHT = RGBColor(75, 85, 105)   # Subtle highlight border #4B5569
COLOR_TEXT_PRIMARY = RGBColor(240, 242, 245) # Off-white primary text #F0F2F5
COLOR_TEXT_MUTED = RGBColor(156, 163, 175)   # Muted secondary text #9CA3AF
COLOR_ACCENT_CYAN = RGBColor(34, 211, 238)   # Restrained Cyan accent #22D3EE
COLOR_ACCENT_GREEN = RGBColor(52, 211, 153)  # Complete status #34D399
COLOR_ACCENT_AMBER = RGBColor(251, 191, 36)  # Underway status #FBBF24
COLOR_ACCENT_RED = RGBColor(248, 113, 113)    # Alert / high risk #F87171

TOTAL_SLIDES = 36

def build_revised_presentation(output_path="Electricity_Theft_Intelligence_Project_Presentation_Revised.pptx"):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # -------------------------------------------------------------------------
    # Helper Functions
    # -------------------------------------------------------------------------
    def add_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_slide_header(slide, section_tag, title_text):
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.32))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_PRIMARY
        p_tag.font.size = Pt(11.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.38), Inches(11.733), Inches(0.015))
        divider.fill.solid()
        divider.fill.fore_color.rgb = COLOR_CARD_BORDER
        divider.line.fill.background()

    def add_slide_footer(slide, slide_num):
        foot_left = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(6.5), Inches(0.3))
        tf_left = foot_left.text_frame
        tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
        p_fl = tf_left.paragraphs[0]
        p_fl.text = "Electricity Theft Intelligence & Inspection Platform | VIT Chennai"
        p_fl.font.name = FONT_PRIMARY
        p_fl.font.size = Pt(10)
        p_fl.font.color.rgb = COLOR_TEXT_MUTED

        foot_right = slide.shapes.add_textbox(Inches(7.5), Inches(7.0), Inches(5.033), Inches(0.3))
        tf_right = foot_right.text_frame
        tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
        p_fr = tf_right.paragraphs[0]
        p_fr.alignment = PP_ALIGN.RIGHT
        p_fr.text = f"Swanand Siknis (24BRS1358) | Slide {slide_num} of {TOTAL_SLIDES}"
        p_fr.font.name = FONT_PRIMARY
        p_fr.font.size = Pt(10)
        p_fr.font.color.rgb = COLOR_TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    def add_blank_canvas_slide(slide, section_tag, title_text):
        """
        Creates a clean, unobtrusive slide with ONLY the dark background
        and a small, neat title at the top. The entire rest of the canvas is completely blank,
        giving the user total freedom to paste and format their own diagrams or screenshots.
        """
        add_slide_bg(slide)
        
        # Small category tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.3))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_PRIMARY
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        # Small, neat title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.733), Inches(0.5))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        # Thin understated line below title
        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.25), Inches(11.733), Inches(0.015))
        divider.fill.solid()
        divider.fill.fore_color.rgb = COLOR_CARD_BORDER
        divider.line.fill.background()
        # Entire slide area from y=1.35 to 7.5 is 100% BLANK

    # ==============================================================================
    # SLIDE 1: TITLE SLIDE
    # ==============================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    t1_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.933), Inches(0.4))
    tf1 = t1_box.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "B.TECH SOFTWARE ENGINEERING PROJECT REVIEW"
    p1.font.name = FONT_PRIMARY
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ACCENT_CYAN

    title_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.55), Inches(10.933), Inches(1.7))
    tf_title1 = title_box1.text_frame
    tf_title1.word_wrap = True
    p_t1 = tf_title1.paragraphs[0]
    p_t1.text = "ELECTRICITY THEFT INTELLIGENCE &\nINSPECTION PLATFORM"
    p_t1.font.name = FONT_PRIMARY
    p_t1.font.size = Pt(36)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(3.45), Inches(10.933), Inches(0.8))
    tf_sub1 = sub_box1.text_frame
    tf_sub1.word_wrap = True
    p_s1 = tf_sub1.paragraphs[0]
    p_s1.text = "Machine Learning-Based Risk Detection, Explainable Inspection Prioritization and Utility Operations"
    p_s1.font.name = FONT_PRIMARY
    p_s1.font.size = Pt(17)
    p_s1.font.color.rgb = COLOR_TEXT_MUTED

    rule1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.45), Inches(10.933), Inches(0.02))
    rule1.fill.solid()
    rule1.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule1.line.fill.background()

    meta_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(4.75), Inches(5.3), Inches(1.9))
    tf_m1 = meta_box1.text_frame
    p = tf_m1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta_box2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.75), Inches(5.3), Inches(1.9))
    tf_m2 = meta_box2.text_frame
    p = tf_m2.paragraphs[0]
    p.text = "Programme & Institution:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m2.add_paragraph()
    p.text = "Vellore Institute of Technology (VIT), Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 2: PROBLEM STATEMENT — CHALLENGES IN ELECTRICITY DISTRIBUTION
    # ==============================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_slide_header(s2, "02 | Problem Statement", "Challenges in Electricity Distribution")
    add_slide_footer(s2, 2)

    cards_s2 = [
        ("Limited Meter Visibility",
         "Traditional billing meters record only monthly consumption totals. Monthly figures hide daily anomalies, night-time bypasses, and sudden zero-load periods, preventing utilities from detecting suspicious consumption in a timely manner."),
        ("Large Consumer Base",
         "Electricity distribution utilities serve hundreds of thousands of consumers. Non-technical losses—caused by meter tampering, illegal phase tapping, and billing fraud—lead to severe revenue loss and strain power grids."),
        ("Inefficient Manual Audits",
         "Physical field audits by utility flying squads are slow, resource-constrained, and dangerous. Selecting meters manually or based on complaints results in low hit rates (~8%), wasting officer time on normal consumers.")
    ]

    for i, (head, text) in enumerate(cards_s2):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s2, x, y, w, h)

        tb = s2.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"0{i+1}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

        p2 = tf.add_paragraph()
        p2.text = head
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(18)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.space_after = Pt(12)

        p3 = tf.add_paragraph()
        p3.text = text
        p3.font.name = FONT_PRIMARY
        p3.font.size = Pt(13.5)
        p3.font.color.rgb = COLOR_TEXT_MUTED
        p3.line_spacing = 1.3
        p3.alignment = PP_ALIGN.LEFT

    # ==============================================================================
    # SLIDE 3: PROBLEM STATEMENT — FROM PREDICTION TO VERIFICATION
    # ==============================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_slide_header(s3, "02 | Problem Statement", "From Prediction to Verification")
    add_slide_footer(s3, 3)

    add_card(s3, Inches(0.8), Inches(1.75), Inches(5.6), Inches(4.9))
    tb_l3 = s3.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(5.0), Inches(4.5))
    tf_l3 = tb_l3.text_frame
    tf_l3.word_wrap = True

    p = tf_l3.paragraphs[0]
    p.text = "CORE DISTINCTION"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l3.add_paragraph()
    p.text = "Prediction Is Not Physical Proof"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_l3.add_paragraph()
    p.text = "A high ML risk score does not prove electricity theft. Physical inspection is required."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(8)

    p = tf_l3.add_paragraph()
    p.text = "Legitimate events—such as solar rooftop generation, extended vacations, seasonal factory closures, or faulty meter wiring—can also cause sharp consumption drops. Utility officers cannot issue fines or disconnect service without verified on-site evidence."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.LEFT

    add_card(s3, Inches(6.8), Inches(1.75), Inches(5.733), Inches(4.9))
    tb_r3 = s3.shapes.add_textbox(Inches(7.1), Inches(1.95), Inches(5.133), Inches(4.5))
    tf_r3 = tb_r3.text_frame
    tf_r3.word_wrap = True

    p = tf_r3.paragraphs[0]
    p.text = "THE OPERATIONAL GAP"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    p = tf_r3.add_paragraph()
    p.text = "Models Need an Inspection Workflow"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_r3.add_paragraph()
    p.text = "An isolated risk score does not assign officers, schedule visits, record meter tamper evidence, or feed verified results back to improve future models. Academic research often stops at model accuracy without delivering an operational system."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.space_after = Pt(12)

    p = tf_r3.add_paragraph()
    p.text = "Central Project Question:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_r3.add_paragraph()
    p.text = '"How can smart-meter data and machine learning be integrated into an explainable, risk-prioritized inspection workflow that connects model predictions with verified field outcomes?"'
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 4: PAST WORK — MACHINE LEARNING IN ELECTRICITY THEFT
    # ==============================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_slide_header(s4, "03 | Past Work in This Area", "Machine Learning for Electricity Theft Detection")
    add_slide_footer(s4, 4)

    lit_cards = [
        ("Petrlik, Lezama, et al. (2022)",
         "IJACSA (Vol. 13, No. 12, DOI: 10.14569/IJACSA.2022.0131251)",
         "Evaluated five classic ML algorithms on the State Grid Corporation of China (SGCC) dataset (~42,000 consumers). Demonstrated that tree-based models and SVMs significantly outperform linear models. Established XGBoost as the top-performing architecture for tabular consumption classification."),
        ("Tsao, Rahmalia, & Lu (2024)",
         "Energy Reports (Vol. 12, pp. 3048–3064)",
         "Investigated Decision Trees, Support Vector Machines, and feature engineering for smart-meter anomaly detection. Demonstrated that combining consumer time-series features with distribution network metrics improves detection stability across feeder networks."),
        ("Industry & Academic Consensus",
         "Tabular Smart-Meter Consumption Modeling",
         "Studies consistently demonstrate that gradient-boosted decision trees (XGBoost) yield superior performance on tabular smart-meter data compared to standard neural networks. They handle missing telemetry well and support feature explainability (SHAP).")
    ]

    for i, (auth, pub, desc) in enumerate(lit_cards):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s4, x, y, w, h)

        tb = s4.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = auth
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

        p = tf.add_paragraph()
        p.text = pub
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(10)

        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3
        p.alignment = PP_ALIGN.LEFT

    # ==============================================================================
    # SLIDE 5: PAST WORK — RESEARCH GAPS IN EXISTING SYSTEMS
    # ==============================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_slide_header(s5, "03 | Past Work in This Area", "Research Gaps in Existing Systems")
    add_slide_footer(s5, 5)

    gaps = [
        ("Gap 1: Black-Box Predictions",
         "Most research papers output a raw risk probability without explaining why a consumer was flagged. Field officers cannot justify physical audits without knowing which consumption features triggered the alert.",
         "Our Solution: SHAP explainability highlights the exact consumption features (such as sudden quarterly drops or zero-load runs) driving each prediction."),
        ("Gap 2: Missing Operational Workflow",
         "Existing studies focus almost entirely on offline algorithm accuracy. They do not provide software to assign flying squads, schedule inspections, record field evidence, or track penalties.",
         "Our Solution: A complete operational portal managing case queues, officer assignments, GIS map views, and verified outcome logging."),
        ("Gap 3: Lack of Field Feedback",
         "Prior works treat the dataset as static and discard real inspection outcomes. When an inspection confirms theft or proves normal use, that ground-truth result is lost.",
         "Our Solution: A relational feedback architecture that logs verified field findings to support future model evaluation and maintenance.")
    ]

    for i, (g_title, g_desc, p_contrib) in enumerate(gaps):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s5, x, y, w, h)

        tb = s5.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = g_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_AMBER
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = g_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.25
        p.space_after = Pt(12)

        p = tf.add_paragraph()
        p.text = p_contrib
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 6: METHODOLOGY — SOFTWARE ENGINEERING DEVELOPMENT WORKFLOW
    # ==============================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_slide_header(s6, "04 | Methodology", "Software Engineering Development Workflow")
    add_slide_footer(s6, 6)

    se_stages = [
        ("1. Requirements Analysis",
         "• Identified 3 primary user roles: Inspection Employee, Consumer, and Board Admin.\n• Established functional requirements for case triage, scheduling, and evidence logging.\n• Defined access control boundaries to isolate consumer personal data from field squads."),
        ("2. System & Database Design",
         "• Created UML structural and behavioural models (Use Case, Class, Sequence, Activity).\n• Designed normalized MySQL 8.0 schema across 16 relational tables in 3NF.\n• Designed RESTful API specifications connecting frontend portals with backend services."),
        ("3. Incremental Implementation",
         "• Developed system in staged increments: ML engine, backend API, and user portals.\n• Built FastAPI backend with JWT authentication and Role-Based Access Control (RBAC).\n• Delivered Phase 4 Inspection Intelligence Portal for field employees."),
        ("4. Testing & Verification",
         "• Created 19 automated integration tests in pytest covering authentication, RBAC, and APIs.\n• Validated React frontend with zero TypeScript errors on production builds.\n• Conducted end-to-end workflow verification across the complete inspection lifecycle.")
    ]

    for i, (st_head, st_body) in enumerate(se_stages):
        x = Inches(0.8 + i * 3.0)
        y = Inches(1.75)
        w = Inches(2.75)
        h = Inches(4.9)
        add_card(s6, x, y, w, h)

        tb = s6.shapes.add_textbox(x + Inches(0.2), y + Inches(0.25), w - Inches(0.4), h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = st_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(10)

        p = tf.add_paragraph()
        p.text = st_body
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 7: METHODOLOGY — OPERATIONAL ML & INSPECTION WORKFLOW
    # ==============================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_slide_header(s7, "04 | Methodology", "Operational ML and Inspection Workflow")
    add_slide_footer(s7, 7)

    ml_steps = [
        ("Step 1: Data Collection",
         "Daily smart-meter readings gathered from the SGCC dataset (42,372 consumers, 1,034 days)."),
        ("Step 2: Cleaning & Features",
         "Handled missing readings (25.6%) chronologically; extracted volatility, trend, and zero-reading features."),
        ("Step 3: Risk Estimation",
         "Class-weighted XGBoost model estimates the risk score of suspicious consumption for each consumer."),
        ("Step 4: Explainability (SHAP)",
         "SHAP TreeExplainer computes exact feature contributions, showing inspectors why a meter was flagged."),
        ("Step 5: Inspection Dispatch",
         "Flagged consumers are prioritized into an actionable inspection queue and mapped geographically."),
        ("Step 6: Outcome Recording",
         "Officers log verified field findings (Theft Confirmed, Verified Clean, Inconclusive) into the database.")
    ]

    for i, (m_title, m_desc) in enumerate(ml_steps):
        col = i % 3
        row = i // 3
        x = Inches(0.8 + col * 4.0)
        y = Inches(1.75 + row * 2.5)
        w = Inches(3.733)
        h = Inches(2.3)
        add_card(s7, x, y, w, h)

        tb = s7.shapes.add_textbox(x + Inches(0.25), y + Inches(0.2), w - Inches(0.5), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = m_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = m_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 8: METHODOLOGY — MODEL EVALUATION RESULTS (ONE READABLE SLIDE)
    # ==============================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_slide_header(s8, "04 | Methodology", "Model Evaluation Results")
    add_slide_footer(s8, 8)

    # 4 Top Metric Cards
    eval_metrics = [
        ("PR-AUC (Primary Metric)", "0.3164", "Baseline: 0.0853 (3.7x improvement)", COLOR_ACCENT_CYAN),
        ("ROC-AUC", "0.7758", "Strong discriminative capability", COLOR_TEXT_PRIMARY),
        ("Test F1-Score", "0.3748", "At calibrated threshold 0.65", COLOR_ACCENT_GREEN),
        ("Precision / Recall", "38.9% / 36.2%", "Balanced operational trade-off", COLOR_ACCENT_AMBER)
    ]
    for i, (m_title, m_val, m_sub, m_col) in enumerate(eval_metrics):
        x = Inches(0.8 + i * 3.0)
        y = Inches(1.75)
        w = Inches(2.75)
        h = Inches(1.8)
        add_card(s8, x, y, w, h)

        tb = s8.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), w - Inches(0.4), h - Inches(0.3))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = m_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_TEXT_MUTED

        p = tf.add_paragraph()
        p.text = m_val
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = m_col

        p = tf.add_paragraph()
        p.text = m_sub
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_TEXT_MUTED

    # Bottom Left: Confusion Matrix
    add_card(s8, Inches(0.8), Inches(3.75), Inches(5.6), Inches(2.9))
    tb_cm = s8.shapes.add_textbox(Inches(1.0), Inches(3.9), Inches(5.2), Inches(2.6))
    tf_cm = tb_cm.text_frame
    p = tf_cm.paragraphs[0]
    p.text = "HELD-OUT TEST CONFUSION MATRIX (6,356 CONSUMERS)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    tbl_cm = s8.shapes.add_table(3, 3, Inches(1.0), Inches(4.3), Inches(5.2), Inches(1.4)).table
    cm_data = [
        ["", "Pred. Normal", "Pred. Theft"],
        ["Actual Normal", "5,506 (TN)", "308 (FP - 5.3% FPR)"],
        ["Actual Theft", "346 (FN)", "196 (TP - 36.2% Recall)"]
    ]
    for r_idx, row in enumerate(cm_data):
        for c_idx, val in enumerate(row):
            cell = tbl_cm.cell(r_idx, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BORDER if (r_idx == 0 or c_idx == 0) else COLOR_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(10.5)
            p.font.color.rgb = COLOR_ACCENT_CYAN if (r_idx == 0 or c_idx == 0) else COLOR_TEXT_PRIMARY

    # Bottom Right: Operational Efficiency Multiplier
    add_card(s8, Inches(6.8), Inches(3.75), Inches(5.733), Inches(2.9))
    tb_strat = s8.shapes.add_textbox(Inches(7.1), Inches(3.9), Inches(5.133), Inches(2.6))
    tf_strat = tb_strat.text_frame
    tf_strat.word_wrap = True

    p = tf_strat.paragraphs[0]
    p.text = "OPERATIONAL INSPECTION EFFICIENCY"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN

    p = tf_strat.add_paragraph()
    p.text = "• Random Inspection: 8.0% hit rate (~40 confirmed thefts per 500 visits)\n• Risk Prioritization: 39.0% hit rate (~195 confirmed thefts per 500 visits)\n• Result: 4.9x efficiency improvement over unprioritized manual inspections."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.space_after = Pt(8)

    p = tf_strat.add_paragraph()
    p.text = "Key Engineering Takeaway: The machine learning model prioritizes which meters to inspect; physical field inspection provides the verified outcome."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 9: NOVELTY OF OUR PROJECT — FOUR CORE CONTRIBUTIONS
    # ==============================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_slide_header(s9, "05 | Novelty of Our Project", "Novelty of Our Project")
    add_slide_footer(s9, 9)

    contributions = [
        ("01", "Risk-Based Inspection",
         "Instead of relying on unprioritized audits or complaints, machine-learning predictions rank the entire consumer base to create daily prioritized inspection queues for field teams."),
        ("02", "Explainable Predictions",
         "SHAP values show officers exactly which consumption features (such as sudden drop ratios or zero-load spikes) caused a meter to be flagged, providing clear evidence before inspection."),
        ("03", "Operational Inspection Workflow",
         "The platform supports the complete inspection process: reviewing cases, assigning officers, scheduling visits, viewing geographic maps, and recording verified field outcomes."),
        ("04", "Connected Utility Platform",
         "Extends beyond field inspection teams to include consumer self-service (usage telemetry, dispute filing) and board communication in Phase 5, connecting all utility stakeholders.")
    ]

    for i, (num, c_title, c_desc) in enumerate(contributions):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(1.75 + row * 2.5)
        w = Inches(5.733)
        h = Inches(2.3)
        add_card(s9, x, y, w, h)

        tb = s9.shapes.add_textbox(x + Inches(0.3), y + Inches(0.25), w - Inches(0.6), h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{num} | {c_title}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = c_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 10: NOVELTY OF OUR PROJECT — SYSTEM ARCHITECTURE
    # ==============================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s10)
    add_slide_header(s10, "05 | Novelty of Our Project", "Layered System Architecture")
    add_slide_footer(s10, 10)

    arch_layers = [
        ("Layer 1: Data & Machine Learning Layer",
         "COMPLETE", COLOR_ACCENT_GREEN,
         "• SGCC smart-meter dataset ingestion (42,372 consumers)\n• Automated data cleaning and chronological processing\n• 15 engineered consumption volatility and trend features\n• Class-weighted XGBoost inference engine\n• SHAP TreeExplainer feature attribution generator"),
        ("Layer 2: Backend & Database Layer",
         "COMPLETE", COLOR_ACCENT_GREEN,
         "• FastAPI REST framework (Python 3.13)\n• MySQL 8.0 relational schema across 16 normalized tables\n• JWT token authentication and Bcrypt password hashing\n• Server-side Role-Based Access Control (RBAC)\n• 19 automated integration tests verified"),
        ("Layer 3: User Portals Layer",
         "PHASE 4 COMPLETE | PHASE 5 UNDERWAY", COLOR_ACCENT_AMBER,
         "• Inspection Intelligence Portal [COMPLETE — Phase 4]\n  (Dashboard, inspection queue, SHAP details, map, outcome modal, reports)\n• Consumer Self-Service Portal [UNDERWAY — Phase 5]\n• Board Communication Portal [UNDERWAY — Phase 5]"),
        ("Layer 4: Closed-Loop Feedback Layer",
         "PLANNED (PHASE 6)", COLOR_ACCENT_CYAN,
         "• Database storage of physical audit findings (Theft Confirmed, Clean, Inconclusive)\n• Recorded evidence: meter tamper status, seal check, penalty assessment\n• Model feedback log connecting field outcomes with original predictions\n• Foundation for future model evaluation and maintenance")
    ]

    for i, (l_title, l_stat, l_col, l_content) in enumerate(arch_layers):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(1.75 + row * 2.5)
        w = Inches(5.733)
        h = Inches(2.3)
        add_card(s10, x, y, w, h)

        tb = s10.shapes.add_textbox(x + Inches(0.3), y + Inches(0.2), w - Inches(0.6), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = l_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

        p = tf.add_paragraph()
        p.text = f"Status: {l_stat}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = l_col
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = l_content
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 11: SDLC MODEL — THE INCREMENTAL MODEL
    # ==============================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s11)
    add_slide_header(s11, "06 | SDLC Model", "The Incremental Model")
    add_slide_footer(s11, 11)

    sdlc_arguments = [
        ("Modular System Structure",
         "The platform consists of separable modules: an ML engine, a relational backend, an employee inspection portal, and external consumer portals. The Incremental Model allows each subsystem to be designed, implemented, and tested independently."),
        ("Independent Validation",
         "Each increment is tested and validated before starting the next. For example, backend APIs and the 16-table database schema (Phase 3) were validated with 19 integration tests before the Phase 4 frontend was built."),
        ("Reduced Integration Risk",
         "Staged development prevents large-scale integration errors. Proving backend security, JWT authentication, and inspection workflows first ensures that future portals integrate smoothly into a stable core.")
    ]

    for i, (r_head, r_body) in enumerate(sdlc_arguments):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s11, x, y, w, h)

        tb = s11.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"REASON 0{i+1}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

        p = tf.add_paragraph()
        p.text = r_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.space_after = Pt(12)

        p = tf.add_paragraph()
        p.text = r_body
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3
        p.alignment = PP_ALIGN.LEFT

    # ==============================================================================
    # SLIDE 12: SDLC MODEL — PROJECT PHASE MAP
    # ==============================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s12)
    add_slide_header(s12, "06 | SDLC Model", "Project Phase Map")
    add_slide_footer(s12, 12)

    phases_data = [
        ("Phase 1", "Requirements & Data Audit", "SGCC audit, missingness strategy, zero-leakage protocol", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 2", "Data Preprocessing & ML Engine", "15 engineered features, XGBoost training, SHAP explanations", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 3", "Database & Backend API Foundation", "FastAPI, MySQL 8.0 (16 tables), JWT Auth, RBAC middleware", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 4", "Inspection Intelligence Portal", "Employee dashboard, priority queue, details, map, reports", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 5", "Consumer & Board Portals", "Consumer usage telemetry, bill dispute UI, board circulars", "UNDERWAY", COLOR_ACCENT_AMBER),
        ("Phase 6", "Model Feedback & Governance", "Verified outcome logging, accuracy monitoring, model lifecycle", "PENDING", COLOR_TEXT_MUTED),
        ("Phase 7", "Hardening & Documentation", "Security review, rate limiting, system documentation", "PENDING", COLOR_TEXT_MUTED),
        ("Phase 8", "System-Wide Validation & Testing", "Cross-role acceptance testing, final university review", "PENDING", COLOR_TEXT_MUTED)
    ]

    tbl_ph = s12.shapes.add_table(9, 4, Inches(0.8), Inches(1.75), Inches(11.733), Inches(4.8)).table
    ph_headers = ["Phase", "Scope", "Key Deliverables", "Status"]
    for c_idx, h in enumerate(ph_headers):
        cell = tbl_ph.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_CARD_BORDER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

    for r_idx, (p_id, p_scope, p_deliv, p_stat, p_col) in enumerate(phases_data):
        row_cells = [p_id, p_scope, p_deliv, p_stat]
        for c_idx, val in enumerate(row_cells):
            cell = tbl_ph.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BG if r_idx % 2 == 0 else COLOR_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(11.5)
            if c_idx == 0:
                p.font.bold = True
                p.font.color.rgb = COLOR_TEXT_PRIMARY
            elif c_idx == 3:
                p.font.bold = True
                p.font.color.rgb = p_col
            else:
                p.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 13: PROJECT PHASES — REQUIREMENTS ANALYSIS & USER ROLES
    # ==============================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s13)
    add_slide_header(s13, "07 | Project Phases", "Requirements Analysis and User Roles")
    add_slide_footer(s13, 13)

    roles = [
        ("INSPECTION_EMPLOYEE",
         "Field & Vigilance Flying Squads [Complete]", COLOR_ACCENT_CYAN,
         "• View operational dashboard with high-priority action cards.\n• Access candidate inspection queue prioritized by ML risk.\n• Review case details with SHAP feature explanations.\n• View geographic inspection map for route planning.\n• Record verified field audit outcomes and penalty details.\n• Generate operational verification and strike-rate reports."),
        ("CONSUMER",
         "Electricity Consumers [Phase 5 Underway]", COLOR_ACCENT_AMBER,
         "• Strict isolation: Cannot view inspection queues or other consumers.\n• View personal daily electricity usage telemetry.\n• Examine billing history and tariff tier breakdowns.\n• Receive proactive alerts for unusual consumption surges.\n• Submit formal meter dispute and service requests."),
        ("BOARD_COMMUNICATION_ADMIN",
         "Utility Leadership & Board [Phase 5 Underway]", COLOR_ACCENT_GREEN,
         "• View high-level loss analytics across distribution zones.\n• Monitor inspection hit rates and penalty recovery progress.\n• Broadcast official circulars and notices to consumers.\n• Oversee system audit logs and model verification outcomes.")
    ]

    for i, (r_name, r_sub, r_col, r_perm) in enumerate(roles):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s13, x, y, w, h)

        tb = s13.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = r_name
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = r_col

        p = tf.add_paragraph()
        p.text = r_sub
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(12)

        p = tf.add_paragraph()
        p.text = r_perm
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35

    # ==============================================================================
    # SLIDE 14: PROJECT PHASES — DATABASE & ARCHITECTURAL DESIGN
    # ==============================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s14)
    add_slide_header(s14, "07 | Project Phases", "Database and Architectural Design")
    add_slide_footer(s14, 14)

    # Left: MySQL 8.0 Schema
    add_card(s14, Inches(0.8), Inches(1.75), Inches(5.6), Inches(4.9))
    tb_l14 = s14.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(5.0), Inches(4.5))
    tf_l14 = tb_l14.text_frame
    tf_l14.word_wrap = True

    p = tf_l14.paragraphs[0]
    p.text = "RELATIONAL SCHEMA DESIGN"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l14.add_paragraph()
    p.text = "MySQL 8.0 Schema (16 Tables in 3NF)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    db_tables = [
        ("Authentication & Users:", "users, user_roles, audit_logs"),
        ("Consumer & Metering:", "consumers, meters, daily_readings"),
        ("ML Intelligence:", "model_registry, predictions, shap_factors"),
        ("Inspection Workflow:", "inspection_cases, case_assignments, inspection_results"),
        ("Model Governance:", "model_feedback, model_evaluations"),
        ("Portals & Alerts:", "billing_records, consumer_issues, board_posts, notifications")
    ]
    for lbl, val in db_tables:
        p = tf_l14.add_paragraph()
        p.text = f"• {lbl} {val}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    # Right: Backend Architecture & Lifecycle
    add_card(s14, Inches(6.8), Inches(1.75), Inches(5.733), Inches(4.9))
    tb_r14 = s14.shapes.add_textbox(Inches(7.1), Inches(1.95), Inches(5.133), Inches(4.5))
    tf_r14 = tb_r14.text_frame
    tf_r14.word_wrap = True

    p = tf_r14.paragraphs[0]
    p.text = "BACKEND & WORKFLOW ARCHITECTURE"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    p = tf_r14.add_paragraph()
    p.text = "FastAPI & State-Driven Lifecycle"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_r14.add_paragraph()
    p.text = "• FastAPI Framework: Asynchronous REST endpoints with strict Pydantic schema validation.\n• JWT Authentication: Secure session tokens with Bcrypt password hashing.\n• Server-Side RBAC: Middleware strictly verifies user role permissions on every request.\n• Inspection Lifecycle State Machine:\n  FLAGGED → ASSIGNED → SCHEDULED → INSPECTED → RESOLVED\n• Audit Traceability: Immutable logging of officer actions and recorded outcomes."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 15: PROJECT PHASES — TESTING & QUALITY ASSURANCE
    # ==============================================================================
    s15 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s15)
    add_slide_header(s15, "07 | Project Phases", "Testing and Quality Assurance")
    add_slide_footer(s15, 15)

    test_cards = [
        ("Backend Automated Test Suite",
         "19 Integration Tests (100% Passing)", COLOR_ACCENT_GREEN,
         "• Executed using pytest against live MySQL database.\n• Validates database schema integrity and foreign keys.\n• Verifies authentication, JWT expiration, and password hashing.\n• Confirms strict role authorization: consumers blocked from inspection APIs.\n• Validates XGBoost inference, threshold calculation, and SHAP factors.\n• Confirms full case lifecycle: creation → assignment → outcome recording."),
        ("Frontend Production Verification",
         "0 TypeScript Errors | Vite Production Build", COLOR_ACCENT_CYAN,
         "• Compiled with strict TypeScript configuration (tsc -b && vite build).\n• Zero compilation errors, zero broken imports, and zero typing bypasses.\n• Component-driven UI built with modern responsive CSS styling.\n• Validated single-row command header and clean workspace navigation.\n• Production bundle: 60.05 kB CSS, 881.50 kB JS (minified and optimized)."),
        ("Testing Scope & Boundaries",
         "QA Environment Assessment", COLOR_ACCENT_AMBER,
         "• Automated HTTP and API integration tests pass with 100% success.\n• Browser-level automated driver execution (Playwright) encountered an external upstream CDN limitation for driver binaries.\n• System workflows were verified through comprehensive API integration tests and manual end-to-end testing.\n• Production build compiles cleanly without requiring remote driver dependencies.")
    ]

    for i, (t_head, t_sub, t_col, t_desc) in enumerate(test_cards):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.75)
        w = Inches(3.733)
        h = Inches(4.9)
        add_card(s15, x, y, w, h)

        tb = s15.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = t_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

        p = tf.add_paragraph()
        p.text = t_sub
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = t_col
        p.space_after = Pt(12)

        p = tf.add_paragraph()
        p.text = t_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3

    # ==============================================================================
    # SLIDES 16–23: UML DIAGRAM SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
    # ==============================================================================
    uml_titles = [
        "Use Case Diagram",
        "Class Diagram",
        "Sequence Diagram",
        "Activity Diagram",
        "Entity Relationship Diagram (ERD)",
        "Data Flow Diagram – Level 0",
        "Data Flow Diagram – Level 1",
        "Data Flow Diagram – Level 2"
    ]
    for u_title in uml_titles:
        s = prs.slides.add_slide(blank_layout)
        add_blank_canvas_slide(s, "07 | Project Phases", u_title)

    # ==============================================================================
    # SLIDE 24: CURRENT IMPLEMENTATION — COMPLETED MODULES
    # ==============================================================================
    s24 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s24)
    add_slide_header(s24, "08 | Current Implementation", "Completed System Modules")
    add_slide_footer(s24, 24)

    impl_modules = [
        ("Phase 1: Dataset Audit & Ingestion", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "Audited 42,372 SGCC consumers, handled missing values chronologically, and established zero-leakage splits."),
        ("Phase 2: Feature & ML Pipeline", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "Extracted 15 engineered features, trained class-weighted XGBoost model, tuned 0.65 threshold, and integrated SHAP explanations."),
        ("Phase 3: Database & Backend APIs", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "Normalized 16 MySQL tables, built FastAPI REST endpoints, implemented JWT auth, server-side RBAC, and 19 integration tests."),
        ("Phase 4: Inspection Intelligence Portal", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "Delivered operational employee dashboard, prioritized inspection queue, SHAP explanations, map view, and outcome recording."),
        ("Phase 5: Consumer & Board Portals", "UNDERWAY (IN PROGRESS)", COLOR_ACCENT_AMBER,
         "Backend foundations and database schemas established. User-facing frontend portal workflows are currently in active development.")
    ]

    for i, (m_name, m_st, m_col, m_text) in enumerate(impl_modules):
        y = Inches(1.75 + i * 1.0)
        add_card(s24, Inches(0.8), y, Inches(11.733), Inches(0.85))

        tb = s24.shapes.add_textbox(Inches(1.1), y + Inches(0.12), Inches(11.133), Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{m_name}  —  "
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY

        run_st = p.add_run()
        run_st.text = f"[{m_st}]"
        run_st.font.bold = True
        run_st.font.color.rgb = m_col

        p = tf.add_paragraph()
        p.text = m_text
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDES 25–32: SCREENSHOT SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
    # ==============================================================================
    screenshot_titles = [
        "Employee Dashboard",
        "Inspection Queue",
        "Case Details and SHAP",
        "Inspection Map",
        "Field Outcome Recording",
        "Reports",
        "Consumer Portal (In Progress)",
        "Board Communication Portal (In Progress)"
    ]
    for sc_title in screenshot_titles:
        s = prs.slides.add_slide(blank_layout)
        add_blank_canvas_slide(s, "08 | Current Implementation", sc_title)

    # ==============================================================================
    # SLIDE 33: PENDING DELIVERABLES — PHASES 5 TO 8 ROADMAP
    # ==============================================================================
    s33 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s33)
    add_slide_header(s33, "09 | Pending Deliverables", "Phases 5 to 8 Roadmap")
    add_slide_footer(s33, 33)

    pending_cards = [
        ("Phase 5: Portals (Underway)", COLOR_ACCENT_AMBER,
         "• Complete user-facing Consumer Portal UI\n• Implement Board Communication Portal UI\n• Consumer bill dispute filing workflows\n• Official board circular broadcasting APIs\n• Cross-role session & RBAC verification"),
        ("Phase 6: Model Feedback (Pending)", COLOR_ACCENT_CYAN,
         "• Deeper closed-loop feedback workflows\n• Model accuracy tracking against field audits\n• Governed periodic offline model evaluation\n• Foundation for future model calibration\n• Note: Not automated uncontrolled retraining"),
        ("Phase 7: Hardening (Pending)", COLOR_TEXT_MUTED,
         "• Security review of JWT & API endpoints\n• Final documentation & schema dictionary\n• Rate-limiting and production configs\n• Complete API swagger documentation\n• Deployment preparation"),
        ("Phase 8: Validation (Pending)", COLOR_TEXT_MUTED,
         "• System-wide end-to-end integration tests\n• Multi-role cross-workflow acceptance QA\n• Final defect resolution and stress testing\n• Academic viva demonstration preparation\n• Final university project submission")
    ]

    for i, (p_title, p_col, p_text) in enumerate(pending_cards):
        x = Inches(0.8 + i * 3.0)
        y = Inches(1.75)
        w = Inches(2.75)
        h = Inches(4.9)
        add_card(s33, x, y, w, h)

        tb = s33.shapes.add_textbox(x + Inches(0.2), y + Inches(0.25), w - Inches(0.4), h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = p_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = p_col
        p.space_after = Pt(12)

        p = tf.add_paragraph()
        p.text = p_text
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.35

    # ==============================================================================
    # SLIDE 34: CONCLUSION — SOFTWARE ENGINEERING ALIGNMENT
    # ==============================================================================
    s34 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s34)
    add_slide_header(s34, "10 | Conclusion", "Software Engineering Alignment")
    add_slide_footer(s34, 34)

    se_conclusions = [
        ("Requirements-Driven Engineering",
         "Defined clear functional and security boundaries for utility operations. Implemented server-side RBAC isolating flying squad officers from consumer private records and ensuring appropriate data governance."),
        ("Modular Decoupled Architecture",
         "Separated concerns across 4 distinct layers: ML inference, FastAPI REST service, MySQL 8.0 relational database, and React frontend, allowing independent maintenance and validation."),
        ("Iterative Quality Verification",
         "Enforced automated testing at each increment: 19 integration tests in pytest (100% pass), zero TypeScript compilation errors, and strict zero-leakage chronological validation."),
        ("Relational Integrity & Audit Logging",
         "Engineered 16 normalized database tables in 3NF with foreign key constraints, time-series indexing, and immutable audit logs capturing officer actions for traceability."),
        ("Responsible Human-in-the-Loop AI",
         "Reframed machine learning from an autonomous decider to explainable decision support (SHAP), mandating physical flying squad verification before legal or financial enforcement."),
        ("Traceable Closed-Loop Governance",
         "Connected model predictions with verified physical outcomes in the database, establishing the empirical feedback loop necessary for responsible future model evaluation.")
    ]

    for i, (se_head, se_body) in enumerate(se_conclusions):
        col = i % 3
        row = i // 3
        x = Inches(0.8 + col * 4.0)
        y = Inches(1.75 + row * 2.5)
        w = Inches(3.733)
        h = Inches(2.3)
        add_card(s34, x, y, w, h)

        tb = s34.shapes.add_textbox(x + Inches(0.25), y + Inches(0.2), w - Inches(0.5), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = se_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = se_body
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 35: CONCLUSION — SUMMARY OF TECHNICAL WORK
    # ==============================================================================
    s35 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s35)
    add_slide_header(s35, "10 | Conclusion", "Summary of Technical Work")
    add_slide_footer(s35, 35)

    add_card(s35, Inches(0.8), Inches(1.75), Inches(5.6), Inches(4.9))
    tb_l35 = s35.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(5.0), Inches(4.5))
    tf_l35 = tb_l35.text_frame
    tf_l35.word_wrap = True

    p = tf_l35.paragraphs[0]
    p.text = "BRIDGING THE OPERATIONAL GAP"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l35.add_paragraph()
    p.text = "From Model to Operational System"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(12)

    p = tf_l35.add_paragraph()
    p.text = "This project bridges the gap between academic machine learning and real-world electricity distribution operations.\n\nBy integrating smart-meter consumption data, class-weighted XGBoost detection, SHAP explainability, and an operational inspection portal, the platform transforms abstract anomaly scores into a disciplined, actionable, and transparent inspection workflow."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.35

    add_card(s35, Inches(6.8), Inches(1.75), Inches(5.733), Inches(4.9))
    tb_r35 = s35.shapes.add_textbox(Inches(7.1), Inches(1.95), Inches(5.133), Inches(4.5))
    tf_r35 = tb_r35.text_frame
    tf_r35.word_wrap = True

    p = tf_r35.paragraphs[0]
    p.text = "KEY ENGINEERING ACHIEVEMENTS"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN

    p = tf_r35.add_paragraph()
    p.text = "Documented Project Results"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(12)

    achieve_points = [
        ("4.9x Audit Efficiency:", "Discovers ~195 confirmed thefts per 500 dispatches compared to 40 via unprioritized audits."),
        ("Zero-Leakage ML Evaluation:", "Evaluated on held-out test split (PR-AUC: 0.3164, ROC-AUC: 0.7758) with class-weighting."),
        ("Explainable Attribution:", "SHAP TreeExplainer quantifies exact consumption drivers for every flagged candidate."),
        ("Production Architecture:", "FastAPI, MySQL 8.0, 19 passing automated integration tests, and 0 TypeScript errors.")
    ]
    for lbl, val in achieve_points:
        p = tf_r35.add_paragraph()
        p.text = f"• {lbl} {val}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    # ==============================================================================
    # SLIDE 36: CONCLUSION — SIGN-OFF SLIDE
    # ==============================================================================
    s36 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s36)

    t36_box = s36.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.933), Inches(0.4))
    tf36 = t36_box.text_frame
    p36 = tf36.paragraphs[0]
    p36.text = "B.TECH PROJECT EVALUATION — CONCLUSION"
    p36.font.name = FONT_PRIMARY
    p36.font.size = Pt(13)
    p36.font.bold = True
    p36.font.color.rgb = COLOR_ACCENT_CYAN

    title_box36 = s36.shapes.add_textbox(Inches(1.2), Inches(1.7), Inches(10.933), Inches(1.6))
    tf_t36 = title_box36.text_frame
    tf_t36.word_wrap = True
    p = tf_t36.paragraphs[0]
    p.text = "ELECTRICITY THEFT INTELLIGENCE &\nINSPECTION PLATFORM"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box36 = s36.shapes.add_textbox(Inches(1.2), Inches(3.45), Inches(10.933), Inches(0.6))
    tf_s36 = sub_box36.text_frame
    p = tf_s36.paragraphs[0]
    p.text = "Thank You — Questions & Academic Technical Review"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.color.rgb = COLOR_TEXT_MUTED

    rule36 = s36.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.3), Inches(10.933), Inches(0.02))
    rule36.fill.solid()
    rule36.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule36.line.fill.background()

    meta36_1 = s36.shapes.add_textbox(Inches(1.2), Inches(4.6), Inches(5.3), Inches(1.8))
    tf_36_1 = meta36_1.text_frame
    p = tf_36_1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_36_1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_36_1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta36_2 = s36.shapes.add_textbox(Inches(6.8), Inches(4.6), Inches(5.3), Inches(1.8))
    tf_36_2 = meta36_2.text_frame
    p = tf_36_2.paragraphs[0]
    p.text = "Programme & Institution:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_36_2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_36_2.add_paragraph()
    p.text = "Vellore Institute of Technology (VIT), Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    # -------------------------------------------------------------------------
    # Enforce Times New Roman Typography Across Every Run
    # -------------------------------------------------------------------------
    def enforce_times_new_roman(prs_obj):
        for slide_obj in prs_obj.slides:
            for shape_obj in slide_obj.shapes:
                if hasattr(shape_obj, "text_frame"):
                    for p_obj in shape_obj.text_frame.paragraphs:
                        p_obj.font.name = FONT_PRIMARY
                        for r_obj in p_obj.runs:
                            r_obj.font.name = FONT_PRIMARY
                elif hasattr(shape_obj, "table"):
                    for row_obj in shape_obj.table.rows:
                        for cell_obj in row_obj.cells:
                            for p_obj in cell_obj.text_frame.paragraphs:
                                p_obj.font.name = FONT_PRIMARY
                                for r_obj in p_obj.runs:
                                    r_obj.font.name = FONT_PRIMARY

    enforce_times_new_roman(prs)

    # -------------------------------------------------------------------------
    # Save Revised Presentation
    # -------------------------------------------------------------------------
    prs.save(output_path)
    print(f"Revised presentation successfully created with {len(prs.slides)} slides at: {output_path}")

if __name__ == "__main__":
    build_revised_presentation()
