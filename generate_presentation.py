"""
Complete Academic Presentation Generator for:
ELECTRICITY THEFT INTELLIGENCE & INSPECTION PLATFORM
Author: Swanand Siknis (24BRS1358)
Degree: B.Tech CSE (AI & Robotics) — VIT Chennai

Generates a 38-slide formal academic PowerPoint presentation (.pptx)
following strict editorial design principles:
- 16:9 Widescreen layout (13.333" x 7.5")
- Dark charcoal / near-black background (#101216)
- White / off-white primary text (#F0F2F5)
- Restrained cyan accent (#22D3EE)
- 100% Times New Roman typography throughout
- Fully editable native shapes, textframes, tables, diagrams, and placeholders
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ==============================================================================
# DESIGN SYSTEM CONSTANTS
# ==============================================================================
FONT_PRIMARY = 'Times New Roman'

# Color Palette: Dark Editorial Academic Palette
COLOR_BG = RGBColor(16, 18, 22)             # Near-black charcoal #101216
COLOR_CARD_BG = RGBColor(24, 28, 36)        # Dark Slate Card #181C24
COLOR_CARD_BORDER = RGBColor(45, 55, 72)    # Understated border #2D3748
COLOR_BORDER_LIGHT = RGBColor(75, 85, 105)  # Subtle highlight border #4B5569
COLOR_TEXT_PRIMARY = RGBColor(240, 242, 245)# Off-white primary text #F0F2F5
COLOR_TEXT_MUTED = RGBColor(156, 163, 175)  # Muted secondary text #9CA3AF
COLOR_ACCENT_CYAN = RGBColor(34, 211, 238)  # Restrained Cyan accent #22D3EE
COLOR_ACCENT_GREEN = RGBColor(52, 211, 153) # Complete status #34D399
COLOR_ACCENT_AMBER = RGBColor(251, 191, 36) # Underway status #FBBF24
COLOR_ACCENT_RED = RGBColor(248, 113, 113)   # High risk / alert #F87171

TOTAL_SLIDES = 38

def build_presentation(output_path="Electricity_Theft_Intelligence_Project_Presentation.pptx"):
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
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.35))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_PRIMARY
        p_tag.font.size = Pt(11.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.733), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(25)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.42), Inches(11.733), Inches(0.015))
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

    def add_diagram_placeholder(slide, slide_num, category, title, scope_desc, instructions):
        add_slide_bg(slide)
        add_slide_header(slide, category, title)
        add_slide_footer(slide, slide_num)

        # Main Placeholder Box (Generous space matching editorial style)
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.65), Inches(11.733), Inches(4.7))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_CARD_BG
        box.line.color.rgb = COLOR_CARD_BORDER
        box.line.width = Pt(1.5)

        # Inner text instruction
        tb = slide.shapes.add_textbox(Inches(1.5), Inches(2.6), Inches(10.333), Inches(2.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = f"[{title.upper()} — INSERTION PLACEHOLDER]"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(10)

        p = tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.text = scope_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.space_after = Pt(14)

        p = tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.text = instructions
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_TEXT_MUTED

        # Bottom Caption / Scope Tag
        capt_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.45), Inches(11.733), Inches(0.45))
        tf_c = capt_box.text_frame
        p_c = tf_c.paragraphs[0]
        p_c.text = f"Technical Artifact: {title} | Formatted for Academic Review"
        p_c.font.name = FONT_PRIMARY
        p_c.font.size = Pt(11)
        p_c.font.color.rgb = COLOR_TEXT_MUTED

    def add_screenshot_placeholder(slide, slide_num, title, status_text, status_color, caption_text):
        add_slide_bg(slide)
        add_slide_header(slide, "08 | Implementation Artifacts & Interface", title)
        add_slide_footer(slide, slide_num)

        # Status badge line
        st_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.52), Inches(11.733), Inches(0.3))
        tf_st = st_box.text_frame
        p_st = tf_st.paragraphs[0]
        p_st.text = f"MODULE STATUS: {status_text.upper()}"
        p_st.font.name = FONT_PRIMARY
        p_st.font.size = Pt(11)
        p_st.font.bold = True
        p_st.font.color.rgb = status_color

        # Generous Screenshot Area
        frame = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.85), Inches(11.733), Inches(4.5))
        frame.fill.solid()
        frame.fill.fore_color.rgb = COLOR_CARD_BG
        frame.line.color.rgb = COLOR_CARD_BORDER
        frame.line.width = Pt(1.5)

        tb = slide.shapes.add_textbox(Inches(1.5), Inches(3.2), Inches(10.333), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = f"[USER INTERFACE SCREENSHOT — {title.upper()}]"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        p.text = "Paste active application screenshot into this bordered frame. Native aspect ratio fits widescreen 16:9 standard."
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MUTED

        # Bottom Caption Area
        capt_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.45), Inches(11.733), Inches(0.45))
        tf_c = capt_box.text_frame
        tf_c.word_wrap = True
        p_c = tf_c.paragraphs[0]
        p_c.text = f"Figure Demonstration: {caption_text}"
        p_c.font.name = FONT_PRIMARY
        p_c.font.size = Pt(11)
        p_c.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 1: COVER
    # ==============================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    t1_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.0), Inches(10.933), Inches(0.4))
    tf1 = t1_box.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "B.TECH SOFTWARE ENGINEERING PROJECT REVIEW"
    p1.font.name = FONT_PRIMARY
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ACCENT_CYAN

    title_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.45), Inches(10.933), Inches(1.8))
    tf_title1 = title_box1.text_frame
    tf_title1.word_wrap = True
    p_t1 = tf_title1.paragraphs[0]
    p_t1.text = "ELECTRICITY THEFT INTELLIGENCE &\nINSPECTION PLATFORM"
    p_t1.font.name = FONT_PRIMARY
    p_t1.font.size = Pt(36)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(3.35), Inches(10.933), Inches(0.9))
    tf_sub1 = sub_box1.text_frame
    tf_sub1.word_wrap = True
    p_s1 = tf_sub1.paragraphs[0]
    p_s1.text = "Machine Learning-Based Risk Detection, Explainable Inspection Prioritization and Utility Operations"
    p_s1.font.name = FONT_PRIMARY
    p_s1.font.size = Pt(18)
    p_s1.font.color.rgb = COLOR_TEXT_MUTED

    rule1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.35), Inches(10.933), Inches(0.02))
    rule1.fill.solid()
    rule1.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule1.line.fill.background()

    meta_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(4.6), Inches(5.3), Inches(1.9))
    tf_m1 = meta_box1.text_frame
    p = tf_m1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta_box2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.6), Inches(5.3), Inches(1.9))
    tf_m2 = meta_box2.text_frame
    p = tf_m2.paragraphs[0]
    p.text = "Academic Affiliation:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m2.add_paragraph()
    p.text = "Vellore Institute of Technology (VIT), Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    repo_box = s1.shapes.add_textbox(Inches(1.2), Inches(6.75), Inches(10.933), Inches(0.4))
    tf_repo = repo_box.text_frame
    p_repo = tf_repo.paragraphs[0]
    p_repo.text = "Project Code Repository: https://github.com/swanand70/grid-guard-ai.git"
    p_repo.font.name = FONT_PRIMARY
    p_repo.font.size = Pt(11)
    p_repo.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 2: PROBLEM STATEMENT — OPERATIONAL REALITIES
    # ==============================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_slide_header(s2, "02 | Problem Statement", "Operational Realities in Utility Distribution")
    add_slide_footer(s2, 2)

    cards_s2 = [
        ("Limited Granular Visibility",
         "Conventional electromechanical and periodic billing meters record only aggregate monthly consumption figures. This monthly granularity conceals fraudulent consumption anomalies, night-time meter bypasses, and artificial zero-load periods, preventing utilities from detecting suspicious load divergence in near-real-time."),
        ("Scale & Non-Technical Losses",
         "Modern electricity distribution companies serve hundreds of thousands of diverse consumers across commercial, industrial, and residential sectors. Non-technical losses (NTL)—primarily caused by illegal meter tampering, phase tapping, and billing fraud—inflict severe revenue haemorrhaging and grid load instability."),
        ("Limitations of Manual Audits",
         "Physical field audits conducted by utility flying squads are labour-intensive, dangerous, and resource-constrained. Unprioritized or complaint-driven manual dispatch results in dismal audit hit rates (~8%), excessive officer transit times, and immense operational waste across unflagged normal consumers.")
    ]

    for i, (head, text) in enumerate(cards_s2):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.8)
        w = Inches(3.733)
        h = Inches(4.8)
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
        p3.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 3: PROBLEM STATEMENT — THE OPERATIONAL GAP
    # ==============================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_slide_header(s3, "02 | Problem Statement", "The Technical and Operational Disconnect")
    add_slide_footer(s3, 3)

    add_card(s3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l3 = s3.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.4))
    tf_l3 = tb_l3.text_frame
    tf_l3.word_wrap = True

    p = tf_l3.paragraphs[0]
    p.text = "CRITICAL DISTINCTION"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l3.add_paragraph()
    p.text = "Prediction Is Not Legal Verification"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_l3.add_paragraph()
    p.text = "A statistical risk percentage or ML classification label indicates suspicious consumption behaviour—it does not legally constitute verified electricity theft. Legitimate causes such as solar net-metering, extended factory vacations, seasonal agricultural demand, or faulty current transformers can trigger high model theft scores."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY
    p.space_after = Pt(10)

    p = tf_l3.add_paragraph()
    p.text = "Therefore, physical inspection by authorized vigilance officers remains the only legally admissible verification mechanism before penalties or disconnections can be levied."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY

    add_card(s3, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8))
    tb_r3 = s3.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.133), Inches(4.4))
    tf_r3 = tb_r3.text_frame
    tf_r3.word_wrap = True

    p = tf_r3.paragraphs[0]
    p.text = "THE OPERATIONAL GAP"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    p = tf_r3.add_paragraph()
    p.text = "Isolated Models vs Usable Systems"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_r3.add_paragraph()
    p.text = "Existing academic research frequently treats theft detection as an isolated classification competition, stopping once an algorithm outputs probability arrays. An isolated score does not dispatch field officers, schedule inspections, record tamper evidence, track fines, or feed verified field outcomes back to the model."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY
    p.space_after = Pt(14)

    p = tf_r3.add_paragraph()
    p.text = "Central Research & Engineering Question:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_r3.add_paragraph()
    p.text = '"How can smart-meter consumption data and machine learning be integrated into an explainable, risk-prioritized inspection workflow that connects model predictions with verified field outcomes?"'
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 4: LITERATURE REVIEW — STATE OF THE ART
    # ==============================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_slide_header(s4, "03 | Literature Review & Related Work", "State of the Art in ML Electricity Theft Detection")
    add_slide_footer(s4, 4)

    lit_cards = [
        ("Petrlik, Lezama, et al. (2022)",
         "Electricity Theft Detection using Machine Learning (IJACSA, Vol. 13, No. 12, DOI: 10.14569/IJACSA.2022.0131251)",
         "Evaluated five classic ML algorithms on the SGCC dataset (~42,000 consumers). Demonstrated that tree-based models and SVMs outperform linear classifiers. Results reported: SVM (81% accuracy), Random Forest (80%), KNN (79%), Logistic Regression (69%), Naive Bayes (68%). Established 3-sigma outlier handling and missing-value interpolation benchmarks on raw smart-meter time-series."),
        ("Tsao, Rahmalia, & Lu (2024)",
         "Machine-Learning Techniques for Enhancing Electricity Theft Detection (Energy Reports, Vol. 12, pp. 3048–3064)",
         "Investigated Decision Trees and Support Vector Machines combined with aggregate transformer parameters and distribution network reliability metrics. Highlighted the importance of integrating macroscopic substation parameters with consumer-level time-series consumption anomalies."),
        ("Ensemble & Tree-Based State of the Art",
         "Literature Consensus on Tabular Time-Series Consumption Data",
         "Recent studies consistently demonstrate that gradient boosted decision trees (XGBoost, LightGBM) yield superior operational performance on tabular smart-meter data compared to unregularized deep neural networks, due to robust handling of high missingness, scale insensitivity, and interpretability.")
    ]

    for i, (auth, pub, desc) in enumerate(lit_cards):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.8)
        w = Inches(3.733)
        h = Inches(4.8)
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
        p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 5: RESEARCH GAP ANALYSIS & NOVELTY
    # ==============================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_slide_header(s5, "03 | Literature Review & Related Work", "Identified Research Gaps and Project Novelty")
    add_slide_footer(s5, 5)

    gaps = [
        ("Gap 1: Black-Box Predictions",
         "Prior works output raw anomaly scores without explaining which consumption features drove the prediction, preventing utility field officers from justifying search warrants or audit actions.",
         "Project Contribution: Local SHAP TreeExplainer feature attributions for every flagged consumer, displaying direction and magnitude of risk factors."),
        ("Gap 2: Class Imbalance Ignored",
         "Many benchmarks evaluate standard accuracy on datasets where theft represents <10% of records, masking severe false-negative rates in real-world deployments.",
         "Project Contribution: Class-weighted cost-sensitive training, precision-recall optimization (PR-AUC), and threshold calibration on held-out validation sets."),
        ("Gap 3: Disconnected Operations",
         "Academic models stop at offline evaluations. No workflow exists to assign flying squads, schedule visits, record physical tamper evidence, or issue penalties.",
         "Project Contribution: Full-lifecycle operational software with role-based access control, GIS mapping, officer assignment, and outcome logging."),
        ("Gap 4: Absence of Model Feedback",
         "Existing systems treat ML models as static one-off artifacts, discarding valuable ground-truth verification outcomes recorded by field inspectors.",
         "Project Contribution: Relational feedback architecture recording verified physical findings (theft confirmed / clean) to support governed future model calibration.")
    ]

    for i, (g_title, g_desc, p_contrib) in enumerate(gaps):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(1.8 + row * 2.5)
        w = Inches(5.733)
        h = Inches(2.3)
        add_card(s5, x, y, w, h)

        tb = s5.shapes.add_textbox(x + Inches(0.25), y + Inches(0.2), w - Inches(0.5), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = g_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_AMBER

        p = tf.add_paragraph()
        p.text = g_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = p_contrib
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

    # ==============================================================================
    # SLIDE 6: METHODOLOGY — 8-STAGE WORKFLOW
    # ==============================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_slide_header(s6, "04 | Methodology & Machine Learning Pipeline", "The 8-Stage End-to-End Operational Workflow")
    add_slide_footer(s6, 6)

    stages = [
        ("1. Data Acquisition", "SGCC Smart Meter Dataset\n42,372 consumers\n1,034 daily readings"),
        ("2. Preprocessing", "Chronological sorting\nMissing data interpolation\nWinsorization (99.9th pct)"),
        ("3. Feature Eng.", "15 domain features:\nVolatility, trend slope,\nlag autocorrelations"),
        ("4. Imbalance Train", "Class-weighted loss\n70/15/15 chronological\nZero-leakage split"),
        ("5. Model Tuning", "PR-AUC optimization\nThreshold tuning (0.65)\nHeld-out test evaluation"),
        ("6. Explainability", "SHAP TreeExplainer\nLocal waterfall drivers\nEvidentiary reporting"),
        ("7. Field Dispatch", "Operational priority queue\nFlying squad assignment\nGIS spatial routing"),
        ("8. Closed Feedback", "Physical outcome logging\nTamper verification\nFuture model retraining")
    ]

    for i, (s_title, s_desc) in enumerate(stages):
        col = i % 4
        row = i // 4
        x = Inches(0.8 + col * 3.0)
        y = Inches(1.85 + row * 2.45)
        w = Inches(2.75)
        h = Inches(2.25)
        add_card(s6, x, y, w, h)

        tb = s6.shapes.add_textbox(x + Inches(0.2), y + Inches(0.2), w - Inches(0.4), h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = s_title
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = s_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 7: DATASET AUDIT & CLASS IMBALANCE
    # ==============================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_slide_header(s7, "04 | Methodology & Machine Learning Pipeline", "SGCC Dataset Characteristics and Class Imbalance")
    add_slide_footer(s7, 7)

    # Left: Dataset Dimensions
    add_card(s7, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l7 = s7.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.4))
    tf_l7 = tb_l7.text_frame
    tf_l7.word_wrap = True

    p = tf_l7.paragraphs[0]
    p.text = "DATASET AUDIT & SCALE"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l7.add_paragraph()
    p.text = "State Grid Corp. of China (SGCC)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    dim_points = [
        ("Total Consumers:", "42,372 unique consumer records (167.1 MB CSV)"),
        ("Temporal Dimension:", "1,034 daily readings (2014-01-01 to 2016-10-31)"),
        ("Total Meter Cells:", "43,812,648 individual daily consumption measurements"),
        ("Missing Readings:", "11,233,528 cells (25.64%) due to network & telemetry dropouts"),
        ("Zero Readings:", "5,788,603 cells (17.77%) representing zero-load or outages"),
        ("Outlier Treatment:", "99.9th percentile winsorization applied to cap physical surges")
    ]
    for lbl, val in dim_points:
        p = tf_l7.add_paragraph()
        p.text = f"• {lbl} {val}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    # Right: Severe Imbalance & Metrics
    add_card(s7, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8))
    tb_r7 = s7.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.133), Inches(4.4))
    tf_r7 = tb_r7.text_frame
    tf_r7.word_wrap = True

    p = tf_r7.paragraphs[0]
    p.text = "CLASS DISTRIBUTION REALITY"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    p = tf_r7.add_paragraph()
    p.text = "Severe 1:10.7 Imbalance (8.53% Theft)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_r7.add_paragraph()
    p.text = "• Normal Consumers (FLAG = 0): 38,757 records (91.47%)\n• Verified Theft Suspects (FLAG = 1): 3,615 records (8.53%)\n• Imbalance Ratio: Exactly 1 theft record for every 10.7 normal consumers."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

    p = tf_r7.add_paragraph()
    p.text = "Why Standard Accuracy is Fraudulent:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_RED

    p = tf_r7.add_paragraph()
    p.text = "A trivial majority classifier predicting 0 for all consumers achieves 91.47% accuracy while detecting exactly zero cases of theft! Therefore, Precision-Recall AUC (PR-AUC) and F1-score are the mandatory scientific metrics for evaluation."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 8: MODEL BASELINE COMPARISON & EXPERIMENTS
    # ==============================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_slide_header(s8, "04 | Methodology & Machine Learning Pipeline", "Model Comparison and Class Imbalance Experiments")
    add_slide_footer(s8, 8)

    # Table 1: Model Baseline Comparison
    t_card1 = add_card(s8, Inches(0.8), Inches(1.8), Inches(11.733), Inches(2.3))
    tb_t1 = s8.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.333), Inches(0.4))
    p = tb_t1.text_frame.paragraphs[0]
    p.text = "ALGORITHM BENCHMARK (VALIDATION SET EVALUATION)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    # Table 1 shape
    tbl1 = s8.shapes.add_table(5, 6, Inches(1.0), Inches(2.25), Inches(11.333), Inches(1.7)).table
    headers1 = ["Model Architecture", "Val PR-AUC", "Val F1-Score", "Val Precision", "Val Recall", "Top-500 Precision"]
    data1 = [
        ["Model A: Majority Baseline", "0.0853", "0.0000", "0.0000", "0.0000", "9.0%"],
        ["Model B: Logistic Regression", "0.2687", "0.2807", "0.1790", "0.6494", "31.0%"],
        ["Model C: Random Forest", "0.3320", "0.3524", "0.2830", "0.4668", "36.2%"],
        ["Model D: XGBoost Balanced (Selected)", "0.3605", "0.3395", "0.2507", "0.5258", "39.2%"]
    ]
    for c_idx, h in enumerate(headers1):
        cell = tbl1.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_CARD_BORDER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

    for r_idx, row in enumerate(data1):
        for c_idx, val in enumerate(row):
            cell = tbl1.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BG if r_idx % 2 == 0 else COLOR_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_TEXT_PRIMARY if c_idx == 0 else COLOR_TEXT_MUTED
            if "XGBoost" in row[0]:
                p.font.bold = True
                p.font.color.rgb = COLOR_ACCENT_CYAN

    # Table 2: Imbalance Handling
    t_card2 = add_card(s8, Inches(0.8), Inches(4.3), Inches(11.733), Inches(2.3))
    tb_t2 = s8.shapes.add_textbox(Inches(1.0), Inches(4.4), Inches(11.333), Inches(0.4))
    p = tb_t2.text_frame.paragraphs[0]
    p.text = "CLASS IMBALANCE HANDLING EXPERIMENTATION (XGBOOST)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    tbl2 = s8.shapes.add_table(4, 6, Inches(1.0), Inches(4.75), Inches(11.333), Inches(1.7)).table
    headers2 = ["Imbalance Strategy", "Precision", "Recall", "F1-Score", "PR-AUC", "Operational Assessment"]
    data2 = [
        ["Experiment A: No Balancing", "0.6961", "0.1310", "0.2205", "0.3746", "High precision but misses 87% of theft cases."],
        ["Experiment B: Class Weighting (Selected)", "0.2507", "0.5258", "0.3395", "0.3605", "Optimal operational balance for squad capacity."],
        ["Experiment C: SMOTE (Train Only)", "0.2797", "0.3948", "0.3275", "0.3146", "Synthetic interpolation distorted boundary curves."]
    ]
    for c_idx, h in enumerate(headers2):
        cell = tbl2.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_CARD_BORDER
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

    for r_idx, row in enumerate(data2):
        for c_idx, val in enumerate(row):
            cell = tbl2.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BG if r_idx % 2 == 0 else COLOR_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(11)
            p.font.color.rgb = COLOR_TEXT_PRIMARY if c_idx == 0 else COLOR_TEXT_MUTED
            if "Class Weighting" in row[0]:
                p.font.bold = True
                p.font.color.rgb = COLOR_ACCENT_GREEN

    # ==============================================================================
    # SLIDE 9: CHAMPION MODEL EVALUATION (HELD-OUT TEST SET)
    # ==============================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_slide_header(s9, "04 | Methodology & Machine Learning Pipeline", "Champion Model Evaluation on Held-Out Test Set")
    add_slide_footer(s9, 9)

    # 4 Metric Cards
    metrics_s9 = [
        ("PR-AUC (Primary)", "0.3164", "Baseline: 0.0853 (3.7x improvement)", COLOR_ACCENT_CYAN),
        ("ROC-AUC", "0.7758", "Discriminative separation capability", COLOR_TEXT_PRIMARY),
        ("Test F1-Score", "0.3748", "At calibrated threshold 0.65", COLOR_ACCENT_GREEN),
        ("Precision / Recall", "38.9% / 36.2%", "Balanced operational trade-off", COLOR_ACCENT_AMBER)
    ]
    for i, (m_title, m_val, m_sub, m_col) in enumerate(metrics_s9):
        x = Inches(0.8 + i * 3.0)
        y = Inches(1.8)
        w = Inches(2.75)
        h = Inches(1.8)
        add_card(s9, x, y, w, h)

        tb = s9.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15), w - Inches(0.4), h - Inches(0.3))
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
    add_card(s9, Inches(0.8), Inches(3.8), Inches(5.6), Inches(2.8))
    tb_cm = s9.shapes.add_textbox(Inches(1.0), Inches(3.95), Inches(5.2), Inches(2.5))
    tf_cm = tb_cm.text_frame
    p = tf_cm.paragraphs[0]
    p.text = "UNBIASED TEST CONFUSION MATRIX (6,356 CONSUMERS)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    tbl_cm = s9.shapes.add_table(3, 3, Inches(1.0), Inches(4.35), Inches(5.2), Inches(1.4)).table
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

    # Bottom Right: Inspection Strategy Multiplier
    add_card(s9, Inches(6.8), Inches(3.8), Inches(5.733), Inches(2.8))
    tb_strat = s9.shapes.add_textbox(Inches(7.1), Inches(3.95), Inches(5.133), Inches(2.5))
    tf_strat = tb_strat.text_frame
    tf_strat.word_wrap = True

    p = tf_strat.paragraphs[0]
    p.text = "FIELD EFFICIENCY MULTIPLIER (TOP 500 CAPACITY)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN

    p = tf_strat.add_paragraph()
    p.text = "• Strategy 1 (Random Audit): 8.00% hit rate (40 confirmed thefts)\n• Strategy 2 (Operational Priority): 37.20% hit rate (186 confirmed thefts)\n• Strategy 3 (Highest ML Risk): 39.00% hit rate (195 confirmed thefts)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

    p = tf_strat.add_paragraph()
    p.text = "Impact: The ML prioritization engine delivers a 4.9x efficiency multiplier over status-quo manual auditing, discovering 155 additional theft cases per 500 field dispatches."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 10: SHAP EXPLAINABILITY
    # ==============================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s10)
    add_slide_header(s10, "04 | Methodology & Machine Learning Pipeline", "Explainability Framework Using SHAP TreeExplainer")
    add_slide_footer(s10, 10)

    # Left: Why SHAP matters
    add_card(s10, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l10 = s10.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.4))
    tf_l10 = tb_l10.text_frame
    tf_l10.word_wrap = True

    p = tf_l10.paragraphs[0]
    p.text = "OPERATIONAL DECISION SUPPORT"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l10.add_paragraph()
    p.text = "Bridging Machine Learning & Field Law"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_l10.add_paragraph()
    p.text = "A black-box prediction is unacceptable for utility enforcement. Utility officers cannot obtain physical audit authorization without demonstrable cause. SHAP (SHapley Additive exPlanations) provides mathematically sound, game-theoretic local feature attributions."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY
    p.space_after = Pt(10)

    p = tf_l10.add_paragraph()
    p.text = "In the inspection portal, each flagged candidate includes an interactive SHAP waterfall breakdown showing exactly which temporal drop, zero-reading anomaly, or quarterly volatility drove their theft probability above the 0.65 threshold."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY

    # Right: Top Features Table
    add_card(s10, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8))
    tb_r10 = s10.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.133), Inches(4.4))
    tf_r10 = tb_r10.text_frame
    tf_r10.word_wrap = True

    p = tf_r10.paragraphs[0]
    p.text = "GLOBAL SHAP FEATURE IMPORTANCE (VERIFIED)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN

    tbl_shap = s10.shapes.add_table(6, 3, Inches(7.1), Inches(2.35), Inches(5.133), Inches(2.8)).table
    shap_data = [
        ["Feature Name", "Mean |SHAP|", "Operational Significance"],
        ["quarterly_variance_ratio", "0.4553", "Quarter-over-quarter abrupt drop"],
        ["missing_reading_ratio", "0.2433", "Meter communication dropouts"],
        ["autocorr_lag1", "0.2225", "Disrupted day-to-day rhythm"],
        ["data_quality_score", "0.2014", "Telemetry packet reliability"],
        ["trend_slope", "0.1864", "Downward consumption slope"]
    ]
    for r_idx, row in enumerate(shap_data):
        for c_idx, val in enumerate(row):
            cell = tbl_shap.cell(r_idx, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = COLOR_CARD_BORDER if r_idx == 0 else COLOR_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(10.5)
            p.font.color.rgb = COLOR_ACCENT_CYAN if r_idx == 0 else COLOR_TEXT_PRIMARY

    # Bottom explanation text
    tb_exp = s10.shapes.add_textbox(Inches(7.1), Inches(5.3), Inches(5.133), Inches(1.1))
    tf_e = tb_exp.text_frame
    tf_e.word_wrap = True
    p = tf_e.paragraphs[0]
    p.text = "Physical Interpretation: Legitimate consumers exhibit stable cyclical auto-correlation. Theft suspects exhibit artificial zero-load bursts and severe quarterly variance collapse."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 11: PROPOSED SYSTEM & NOVELTY
    # ==============================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s11)
    add_slide_header(s11, "05 | Proposed System & Novelty", "Four Core Architectural Differentiators")
    add_slide_footer(s11, 11)

    pillars = [
        ("01", "Risk-Based Prioritization",
         "Rather than treating all consumers as equal or relying on sporadic complaints, the system continuously ranks the entire consumer population using XGBoost theft probability combined with historical consumption volume, generating daily actionable flying squad queues."),
        ("02", "Explainable Evidentiary Support",
         "Every candidate case is accompanied by a transparent SHAP factor breakdown and 60-day historical consumption visualization. Inspectors review tamper indicators before field dispatch, converting abstract ML probabilities into actionable audit leads."),
        ("03", "Operational Inspection Lifecycle",
         "The platform manages the complete operational lifecycle: supervisor case review, squad officer assignment, scheduled calendar routing, mobile-compatible field outcome recording, penalty calculation, and audit trail maintenance."),
        ("04", "Unified Multi-Portal Architecture",
         "The system extends beyond internal vigilance squads to incorporate a planned Consumer Portal (transparency, usage optimization, billing dispute reporting) and Board Portal (policy circular broadcasts, macroscopic loss analytics).")
    ]

    for i, (num, p_title, p_desc) in enumerate(pillars):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(1.8 + row * 2.5)
        w = Inches(5.733)
        h = Inches(2.3)
        add_card(s11, x, y, w, h)

        tb = s11.shapes.add_textbox(x + Inches(0.3), y + Inches(0.25), w - Inches(0.6), h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{num} | {p_title}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(8)

        p = tf.add_paragraph()
        p.text = p_desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.line_spacing = 1.3
        p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 12: LAYERED SYSTEM ARCHITECTURE
    # ==============================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s12)
    add_slide_header(s12, "05 | Proposed System & Novelty", "Layered System Architecture & Implementation Boundaries")
    add_slide_footer(s12, 12)

    arch_layers = [
        ("Layer 1: Data & Machine Learning Layer",
         "IMPLEMENTED", COLOR_ACCENT_GREEN,
         "• SGCC Dataset ingestion (42k consumers)\n• Automated data cleaning & chronological sorting\n• 15 engineered volatility/temporal features\n• Class-weighted XGBoost inference engine\n• SHAP TreeExplainer feature attribution generator"),
        ("Layer 2: Backend & Security Layer",
         "IMPLEMENTED", COLOR_ACCENT_GREEN,
         "• FastAPI RESTful service framework (Python 3.13)\n• JWT token authentication & Bcrypt password hashing\n• Server-side Role-Based Access Control (RBAC)\n• MySQL 8.0 relational schema (16 normalized tables)\n• Idempotent inspection, audit log & feedback APIs"),
        ("Layer 3: User Application Layer",
         "PHASED DELIVERY", COLOR_ACCENT_AMBER,
         "• Inspection / Flying Squad Portal [IMPLEMENTED — Phase 4]\n  (Operational dashboard, priority queue, case detail, GIS map, outcome modal, reports)\n• Consumer Self-Service Portal [UNDERWAY — Phase 5]\n• Board Communication & Executive Portal [UNDERWAY — Phase 5]"),
        ("Layer 4: Feedback & Model Governance Layer",
         "INTEGRATED", COLOR_ACCENT_CYAN,
         "• Verified field audit recording (Theft Confirmed, Verified Clean, Inconclusive)\n• Traceable evidence storage (meter seal status, drop wire tampering, penalty INR)\n• Model feedback log linking physical outcomes to original model predictions\n• Foundation for future governed model calibration and drift detection")
    ]

    for i, (l_title, l_stat, l_col, l_content) in enumerate(arch_layers):
        col = i % 2
        row = i // 2
        x = Inches(0.8 + col * 6.0)
        y = Inches(1.8 + row * 2.5)
        w = Inches(5.733)
        h = Inches(2.3)
        add_card(s12, x, y, w, h)

        tb = s12.shapes.add_textbox(x + Inches(0.3), y + Inches(0.2), w - Inches(0.6), h - Inches(0.4))
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
    # SLIDE 13: SDLC — INCREMENTAL MODEL JUSTIFICATION
    # ==============================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s13)
    add_slide_header(s13, "06 | SDLC: Incremental Model", "SDLC Model Selection and Engineering Justification")
    add_slide_footer(s13, 13)

    sdlc_reasons = [
        ("Modular Decoupling",
         "The platform contains fundamentally distinct sub-systems: an offline machine-learning engine, a high-throughput relational backend, an operational field inspection portal, and external consumer portals. The Incremental Model allows each functional subsystem to be architected, implemented, and refined independently without blocking cross-functional progress."),
        ("Iterative Verification & QA",
         "Each development increment concludes with automated verification (unit tests, integration test suites, schema validation, and production build checks). For example, the backend and database (Phase 3) were validated with 10 integration tests before Phase 4 frontend engineering began, preventing downstream architectural refactoring."),
        ("Operational Risk Mitigation",
         "Electricity distribution operations carry high compliance and legal standards. Staging the release—first proving field inspection capabilities before opening consumer and board communication interfaces—ensures vigilance workflows, data security, and RBAC boundaries are hardened before broader exposure.")
    ]

    for i, (r_head, r_body) in enumerate(sdlc_reasons):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.8)
        w = Inches(3.733)
        h = Inches(4.8)
        add_card(s13, x, y, w, h)

        tb = s13.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"ARGUMENT 0{i+1}"
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
        p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 14: 8-PHASE DEVELOPMENT ROADMAP
    # ==============================================================================
    s14 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s14)
    add_slide_header(s14, "06 | SDLC: Incremental Model", "8-Phase Development Roadmap & Status Matrix")
    add_slide_footer(s14, 14)

    phases_data = [
        ("Phase 1", "Requirements Analysis & Dataset Audit", "SGCC audit, missingness strategy, zero-leakage protocol", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 2", "Data Preprocessing & ML Engine", "15 engineered features, XGBoost training, SHAP explanations", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 3", "Database & Backend API Foundation", "FastAPI, MySQL 8.0 (16 tables), JWT Auth, RBAC middleware", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 4", "Inspection Intelligence Portal", "Employee dashboard, priority queue, details, map, reports", "COMPLETE", COLOR_ACCENT_GREEN),
        ("Phase 5", "Consumer & Board Portals", "Consumer usage, bill dispute UI, board circulars & macros", "UNDERWAY", COLOR_ACCENT_AMBER),
        ("Phase 6", "Closed-Loop Model Governance", "Verified outcome calibration, drift tracking, model lifecycle", "PENDING", COLOR_TEXT_MUTED),
        ("Phase 7", "Hardening & Deployment Preparation", "Docker containerization, security audit, API documentation", "PENDING", COLOR_TEXT_MUTED),
        ("Phase 8", "System-Wide Validation & Testing", "Cross-role acceptance testing, final university submission", "PENDING", COLOR_TEXT_MUTED)
    ]

    tbl_ph = s14.shapes.add_table(9, 4, Inches(0.8), Inches(1.75), Inches(11.733), Inches(4.8)).table
    ph_headers = ["Phase", "Functional Scope", "Key Deliverables & Technology", "Execution Status"]
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
    # SLIDE 15: REQUIREMENTS & RBAC BOUNDARIES
    # ==============================================================================
    s15 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s15)
    add_slide_header(s15, "07 | Software Engineering Process", "Requirements Analysis and RBAC Boundaries")
    add_slide_footer(s15, 15)

    roles = [
        ("INSPECTION_EMPLOYEE",
         "Field & Vigilance Flying Squads", COLOR_ACCENT_CYAN,
         "• Operational dashboard with high-urgency action cards\n• Prioritized candidate inspection queue\n• Case details with SHAP waterfall explanations\n• Daily kWh consumption series & anomaly charts\n• GIS spatial mapping with zone clusters\n• Field audit outcome recording & penalty calculation"),
        ("CONSUMER",
         "Electricity End-Users (Phase 5)", COLOR_ACCENT_AMBER,
         "• Strict isolation: Cannot access inspection queues or other consumers' data\n• Personal historical daily consumption telemetry\n• Billing transparency and tariff tier breakdowns\n• Proactive consumption surge alerts\n• Formal dispute filing for faulty metering"),
        ("BOARD_COMMUNICATION_ADMIN",
         "Utility Executive Leadership (Phase 5)", COLOR_ACCENT_GREEN,
         "• Macro non-technical loss analytics across distribution zones\n• Enforcement outcome summaries & penalty recovery reports\n• Official circular broadcasting to consumers & employees\n• Model governance and verification oversight")
    ]

    for i, (r_name, r_sub, r_col, r_perm) in enumerate(roles):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.8)
        w = Inches(3.733)
        h = Inches(4.8)
        add_card(s15, x, y, w, h)

        tb = s15.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
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
    # SLIDE 16: SYSTEM MODELLING & DATABASE DESIGN
    # ==============================================================================
    s16 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s16)
    add_slide_header(s16, "07 | Software Engineering Process", "System Modelling and Relational Database Architecture")
    add_slide_footer(s16, 16)

    # Left: Database Architecture
    add_card(s16, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l16 = s16.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.4))
    tf_l16 = tb_l16.text_frame
    tf_l16.word_wrap = True

    p = tf_l16.paragraphs[0]
    p.text = "RELATIONAL SCHEMA DESIGN"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l16.add_paragraph()
    p.text = "MySQL 8.0 Normalized Schema (16 Tables)"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    db_points = [
        ("Authentication & Users:", "users, user_roles, audit_logs"),
        ("Consumer & Metering:", "consumers, meters, daily_readings (time-series)"),
        ("Intelligence & ML:", "model_registry, predictions, shap_factors"),
        ("Operational Inspection:", "inspection_cases, case_assignments, inspection_results"),
        ("Feedback & Governance:", "model_feedback, model_evaluations"),
        ("Portals & Alerts:", "billing_records, consumer_issues, board_posts, notifications")
    ]
    for lbl, val in db_points:
        p = tf_l16.add_paragraph()
        p.text = f"• {lbl} {val}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(4)

    # Right: Modelling Artifacts
    add_card(s16, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8))
    tb_r16 = s16.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.133), Inches(4.4))
    tf_r16 = tb_r16.text_frame
    tf_r16.word_wrap = True

    p = tf_r16.paragraphs[0]
    p.text = "STRUCTURED SYSTEM MODELLING"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER

    p = tf_r16.add_paragraph()
    p.text = "UML & Data Flow Models Prepared"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(10)

    p = tf_r16.add_paragraph()
    p.text = "To ensure rigorous software engineering specification, the platform was modeled using standard UML and structured analysis artifacts:\n\n• Use Case Diagram: Actor boundaries across 3 distinct user roles.\n• Structural Models: Class Diagram & Entity-Relationship Diagram.\n• Behavioural Models: Sequence Diagram & Activity Diagram for case lifecycle.\n• Process Models: DFD Level 0 (Context), Level 1, and Level 2 decompositions.\n\nAll diagrams are formatted in dedicated presentation placeholders following this slide."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.3
    p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 17: TESTING, VERIFICATION & QUALITY ASSURANCE
    # ==============================================================================
    s17 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s17)
    add_slide_header(s17, "07 | Software Engineering Process", "Testing, Verification and System Quality Assurance")
    add_slide_footer(s17, 17)

    test_cards = [
        ("Backend Automated Test Suite",
         "21 Automated Integration Tests (100% Passing)", COLOR_ACCENT_GREEN,
         "• Executed using pytest against live MySQL 8.0 instance (23.37s).\n• Validates database schema integrity and foreign keys.\n• Verifies authentication, JWT expiration, and password hashing.\n• Confirms strict role authorization: consumers blocked from vigilance APIs.\n• Validates XGBoost inference, threshold calculation, and SHAP factors.\n• Confirms full case lifecycle: creation → assignment → outcome recording."),
        ("Frontend Production Verification",
         "0 TypeScript Errors | Vite Production Bundle", COLOR_ACCENT_CYAN,
         "• Compiled with strict TypeScript configuration (tsc -b && vite build in 1.43s).\n• Zero compilation errors, zero broken imports, and zero typing bypasses.\n• CSS optimized with Tailwind CSS and Inter typography.\n• Single-row responsive header with integrated workspace navigation.\n• Production bundle: 60.05 kB CSS, 881.50 kB JS (minified + gzip compatible)."),
        ("Automated Testing Audit & Boundary Note",
         "Documented QA Environment Assessment", COLOR_ACCENT_AMBER,
         "• Automated HTTP & API integration tests have 100% passing coverage.\n• Browser-level automated driver execution (Playwright) encountered an external upstream CDN 404 response for win32_x64 driver binaries.\n• Verified through manual interactive testing and automated API contract testing.\n• Local production build succeeds cleanly without requiring remote driver dependencies.")
    ]

    for i, (t_head, t_sub, t_col, t_desc) in enumerate(test_cards):
        x = Inches(0.8 + i * 4.0)
        y = Inches(1.8)
        w = Inches(3.733)
        h = Inches(4.8)
        add_card(s17, x, y, w, h)

        tb = s17.shapes.add_textbox(x + Inches(0.3), y + Inches(0.3), w - Inches(0.6), h - Inches(0.6))
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
    # SLIDES 18–25: UML & DIAGRAM PLACEHOLDERS
    # ==============================================================================
    uml_diagrams = [
        ("System Use Case Diagram",
         "Scope: Elicits functional boundaries and primary interactions between Inspection Officers, Consumers, and Utility Board Administrators with system subroutines.",
         "Paste high-resolution System Use Case diagram here. Ensure actor stick-figures, use case ovals, and include/extend dependencies remain cleanly readable."),
        ("Class Diagram",
         "Scope: Documents static object-oriented structure including Consumer, Meter, PredictionModel, InspectionCase, FlyingSquadOfficer, and ModelFeedback entities.",
         "Paste high-resolution Class Diagram here. Entity attributes, methods, visibility indicators (+/-/#), and multiplicity associations (1..*, 0..1) should be visible."),
        ("Sequence Diagram",
         "Scope: Models dynamic message exchange during the core workflow: Ingestion → Prediction → Priority Queue → Squad Assignment → Field Verification → Model Feedback.",
         "Paste high-resolution Sequence Diagram here. Lifelines, synchronous/asynchronous messages, activation bars, and return values should be legible."),
        ("Activity Diagram",
         "Scope: Captures operational control flow of the physical inspection decision process, including decision diamonds, parallel branches, and outcome recording paths.",
         "Paste high-resolution Activity Diagram here. Swimlanes (System, Supervisor, Field Squad), fork/join nodes, and decision paths should be displayed."),
        ("Entity Relationship Diagram (ERD)",
         "Scope: Represents the 16 normalized relational tables in MySQL 8.0 with primary keys, foreign key constraints, and 1:N cardinality relationships.",
         "Paste high-resolution ER Diagram here. Tables, column datatypes, primary keys (PK), foreign keys (FK), and Crow's Foot cardinality notations should be legible."),
        ("Data Flow Diagram — Level 0 (Context Diagram)",
         "Scope: High-level context diagram modeling external entity boundaries (Consumers, Smart Meters, Flying Squad Officers, Utility Board) around the central system.",
         "Paste high-resolution Level-0 DFD here. Context process bubble, external entities, and primary input/output data flows should be clearly distinguishable."),
        ("Data Flow Diagram — Level 1",
         "Scope: Decomposes central system into primary sub-processes: 1.0 Telemetry Ingestion, 2.0 ML Risk Inference, 3.0 Inspection Management, 4.0 Closed-Loop Feedback.",
         "Paste high-resolution Level-1 DFD here. Sub-process circles, data stores (D1 Consumers, D2 Predictions, D3 Inspections), and data flows should be visible."),
        ("Data Flow Diagram — Level 2",
         "Scope: Detailed operational decomposition of Process 3.0 (Inspection Management): 3.1 Case Prioritization, 3.2 Officer Assignment, 3.3 Field Verification Recording.",
         "Paste high-resolution Level-2 DFD here. Fine-grained subprocesses, input validation checks, and data store read/write flows should be legibly presented.")
    ]

    for idx, (diag_title, diag_scope, diag_inst) in enumerate(uml_diagrams):
        slide_num = 18 + idx
        s = prs.slides.add_slide(blank_layout)
        add_diagram_placeholder(s, slide_num, "07 | System Modelling & Design Artifacts", diag_title, diag_scope, diag_inst)

    # ==============================================================================
    # SLIDE 26: IMPLEMENTATION STATUS OVERVIEW
    # ==============================================================================
    s26 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s26)
    add_slide_header(s26, "08 | Implementation Artifacts & Interface", "Implementation Status Across Project Modules")
    add_slide_footer(s26, 26)

    impl_modules = [
        ("Phase 1: Dataset Audit & Ingestion", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "100% completed. Audited 42,372 SGCC consumers, implemented missingness handling, chronological sorting, and zero-leakage splitting."),
        ("Phase 2: Feature & ML Pipeline", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "100% completed. Extracted 15 engineered features, trained class-weighted XGBoost champion model, tuned 0.65 threshold, generated SHAP explanations."),
        ("Phase 3: Database & Backend APIs", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "100% completed. Normalized 16 MySQL tables, built FastAPI REST endpoints, implemented JWT auth, server-side RBAC, and 21 passing automated tests."),
        ("Phase 4: Inspection Intelligence Portal", "COMPLETE & VERIFIED", COLOR_ACCENT_GREEN,
         "100% completed. Single-row unified header, dominant Action Required card, 2x2 symmetrical grid, Leaflet GIS map, case detail, and outcome recording."),
        ("Phase 5: Consumer & Board Portals", "UNDERWAY (IN PROGRESS)", COLOR_ACCENT_AMBER,
         "Backend foundations and database schemas established. User-facing frontend workflows and portal screens are currently in active development.")
    ]

    for i, (m_name, m_st, m_col, m_text) in enumerate(impl_modules):
        y = Inches(1.8 + i * 0.98)
        add_card(s26, Inches(0.8), y, Inches(11.733), Inches(0.85))

        tb = s26.shapes.add_textbox(Inches(1.1), y + Inches(0.12), Inches(11.133), Inches(0.6))
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
    # SLIDES 27–34: SCREENSHOT PLACEHOLDERS
    # ==============================================================================
    screenshots_meta = [
        ("Employee Inspection Dashboard",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Displays the single-row command header, visually dominant Action Required card (Murugan Textiles, 74.9% risk), 4 compact KPI indicators, and balanced 2x2 operational grid."),
        ("Prioritized Inspection Queue",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Demonstrates the operational candidate queue ranked by XGBoost theft risk and priority score, with risk pills, status badges, and direct review navigation."),
        ("Case Details and SHAP Explanations",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Highlights local explainability: interactive SHAP waterfall attribution chart showing feature contributions, 60-day kWh daily consumption series, and assignment actions."),
        ("Geographic Inspection Map",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Shows spatial Leaflet GIS visualization rendering real consumer coordinates, multi-criteria zone filtering, and risk-coded clusters for flying squad routing."),
        ("Field Outcome Recording & Feedback",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Demonstrates closed-loop verification: modal recording physical audit outcomes (theft confirmed / clean), meter tamper evidence, penalty amounts, and model feedback logging."),
        ("Operational Verification Reports",
         "Phase 4 Complete", COLOR_ACCENT_GREEN,
         "Presents macro operational analytics: theft strike rate (50%), audit progress (40%), zone distribution progress bars, and closed-loop model calibration tracking."),
        ("Consumer Portal — Implementation in Progress",
         "Phase 5 Underway", COLOR_ACCENT_AMBER,
         "Phase 5 active development: Consumer self-service interface showing personalized daily usage telemetry, tariff breakdowns, surge notifications, and dispute submission."),
        ("Board Communication Portal — Implementation in Progress",
         "Phase 5 Underway", COLOR_ACCENT_AMBER,
         "Phase 5 active development: Executive board interface for loss monitoring across administrative divisions, circular broadcasts, and compliance oversight.")
    ]

    for idx, (sc_title, sc_stat, sc_col, sc_capt) in enumerate(screenshots_meta):
        slide_num = 27 + idx
        s = prs.slides.add_slide(blank_layout)
        add_screenshot_placeholder(s, slide_num, sc_title, sc_stat, sc_col, sc_capt)

    # ==============================================================================
    # SLIDE 35: PENDING DELIVERABLES & ROADMAP
    # ==============================================================================
    s35 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s35)
    add_slide_header(s35, "09 | Pending Deliverables & Future Work", "Phases 5 to 8 Execution Roadmap")
    add_slide_footer(s35, 35)

    pending_cards = [
        ("Phase 5: Portals (Underway)", COLOR_ACCENT_AMBER,
         "• Complete user-facing Consumer Portal UI\n• Implement Board Communication Portal\n• Consumer bill dispute filing workflows\n• Official board circular broadcasting APIs\n• Cross-role session & RBAC verification"),
        ("Phase 6: Model Governance (Pending)", COLOR_ACCENT_CYAN,
         "• Deeper closed-loop feedback workflows\n• Model drift & performance degradation monitoring\n• Governed periodic offline model retraining\n• Calibration tracking against physical audits\n• Note: Not automated uncontrolled retraining"),
        ("Phase 7: Hardening (Pending)", COLOR_ACCENT_TEXT := COLOR_TEXT_MUTED,
         "• Docker containerization of backend & DB\n• Security audit on JWT & API endpoints\n• Final documentation & schema dictionary\n• Rate-limiting and production WSGI configs\n• Complete API swagger documentation"),
        ("Phase 8: Validation (Pending)", COLOR_TEXT_MUTED,
         "• System-wide end-to-end integration tests\n• Multi-role cross-workflow acceptance QA\n• Final defect resolution and stress testing\n• Academic viva demonstration preparation\n• Final university project submission")
    ]

    for i, (p_title, p_col, p_text) in enumerate(pending_cards):
        x = Inches(0.8 + i * 3.0)
        y = Inches(1.8)
        w = Inches(2.75)
        h = Inches(4.8)
        add_card(s35, x, y, w, h)

        tb = s35.shapes.add_textbox(x + Inches(0.2), y + Inches(0.25), w - Inches(0.4), h - Inches(0.5))
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
    # SLIDE 36: SE PRINCIPLES ALIGNMENT
    # ==============================================================================
    s36 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s36)
    add_slide_header(s36, "10 | Conclusion & SE Alignment", "Rigorous Application of Software Engineering Principles")
    add_slide_footer(s36, 36)

    se_principles = [
        ("Requirements-Driven Engineering",
         "Defined distinct functional, non-functional, and legal boundaries for utility field auditing. Implemented strict server-side RBAC isolating flying squad officers from consumer private records."),
        ("Modular Decoupled Architecture",
         "Separated concerns across 4 distinct architectural layers: machine-learning inference, FastAPI REST service, MySQL 8.0 relational persistence, and React TypeScript frontend."),
        ("Iterative Quality Verification",
         "Enforced automated testing at every increment: 21 integration tests in pytest (100% pass), zero TypeScript compilation errors, and strict zero-leakage chronological ML validation."),
        ("Relational Integrity & Audit Logging",
         "Engineered 16 normalized database tables with foreign key constraints, indexing on time-series telemetry, and immutable audit logs capturing officer actions for evidentiary traceability."),
        ("Responsible Human-in-the-Loop AI",
         "Reframed machine learning from an autonomous black-box decider to explainable decision support (SHAP), mandating physical flying squad verification before legal or financial enforcement."),
        ("Traceable Closed-Loop Governance",
         "Connected model predictions with verified physical outcomes in the database, establishing the empirical feedback loop necessary for responsible future model calibration.")
    ]

    for i, (se_head, se_body) in enumerate(se_principles):
        col = i % 3
        row = i // 3
        x = Inches(0.8 + col * 4.0)
        y = Inches(1.8 + row * 2.5)
        w = Inches(3.733)
        h = Inches(2.3)
        add_card(s36, x, y, w, h)

        tb = s36.shapes.add_textbox(x + Inches(0.25), y + Inches(0.2), w - Inches(0.5), h - Inches(0.4))
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
        p.alignment = PP_ALIGN.JUSTIFY

    # ==============================================================================
    # SLIDE 37: CONCLUSION & OPERATIONAL VALUE
    # ==============================================================================
    s37 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s37)
    add_slide_header(s37, "10 | Conclusion & SE Alignment", "Project Conclusion & Operational Value")
    add_slide_footer(s37, 37)

    add_card(s37, Inches(0.8), Inches(1.8), Inches(5.6), Inches(4.8))
    tb_l37 = s37.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.4))
    tf_l37 = tb_l37.text_frame
    tf_l37.word_wrap = True

    p = tf_l37.paragraphs[0]
    p.text = "SUMMARY OF ACHIEVEMENTS"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_l37.add_paragraph()
    p.text = "From Research to Practical System"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(12)

    p = tf_l37.add_paragraph()
    p.text = "This project bridges the longstanding chasm between academic machine-learning algorithms and real-world utility distribution operations.\n\nBy uniting raw smart-meter consumption data, class-weighted XGBoost detection, SHAP explainability, and an operational flying squad portal, the platform transforms abstract anomaly scores into a disciplined, actionable, and legally sound inspection workflow."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.35
    p.alignment = PP_ALIGN.JUSTIFY

    add_card(s37, Inches(6.8), Inches(1.8), Inches(5.733), Inches(4.8))
    tb_r37 = s37.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.133), Inches(4.4))
    tf_r37 = tb_r37.text_frame
    tf_r37.word_wrap = True

    p = tf_r37.paragraphs[0]
    p.text = "EMPIRICAL HIGHLIGHTS"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN

    p = tf_r37.add_paragraph()
    p.text = "Documented Engineering Evidence"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.space_after = Pt(12)

    emp_points = [
        ("4.9x Audit Efficiency:", "Discovers 195 confirmed thefts per 500 dispatches compared to 40 via status-quo random audits."),
        ("Strict Zero Leakage:", "Evaluated on held-out test split (PR-AUC: 0.3164, ROC-AUC: 0.7758) with class-weighting."),
        ("Explainable Attribution:", "SHAP TreeExplainer quantifies exact consumption drivers for every flagged candidate."),
        ("Production Architecture:", "FastAPI, MySQL 8.0, 21 passing automated integration tests, and 0 TypeScript errors.")
    ]
    for lbl, val in emp_points:
        p = tf_r37.add_paragraph()
        p.text = f"• {lbl} {val}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_MUTED
        p.space_after = Pt(6)

    # ==============================================================================
    # SLIDE 38: FORMAL CLOSING SLIDE
    # ==============================================================================
    s38 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s38)

    t38_box = s38.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.933), Inches(0.4))
    tf38 = t38_box.text_frame
    p38 = tf38.paragraphs[0]
    p38.text = "B.TECH PROJECT EVALUATION — CONCLUSION"
    p38.font.name = FONT_PRIMARY
    p38.font.size = Pt(13)
    p38.font.bold = True
    p38.font.color.rgb = COLOR_ACCENT_CYAN

    title_box38 = s38.shapes.add_textbox(Inches(1.2), Inches(1.7), Inches(10.933), Inches(1.6))
    tf_t38 = title_box38.text_frame
    tf_t38.word_wrap = True
    p = tf_t38.paragraphs[0]
    p.text = "ELECTRICITY THEFT INTELLIGENCE &\nINSPECTION PLATFORM"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box38 = s38.shapes.add_textbox(Inches(1.2), Inches(3.4), Inches(10.933), Inches(0.6))
    tf_s38 = sub_box38.text_frame
    p = tf_s38.paragraphs[0]
    p.text = "Thank You — Questions & Academic Technical Review"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.color.rgb = COLOR_TEXT_MUTED

    rule38 = s38.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.2), Inches(10.933), Inches(0.02))
    rule38.fill.solid()
    rule38.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule38.line.fill.background()

    meta38_1 = s38.shapes.add_textbox(Inches(1.2), Inches(4.5), Inches(5.3), Inches(1.8))
    tf_38_1 = meta38_1.text_frame
    p = tf_38_1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_38_1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_38_1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta38_2 = s38.shapes.add_textbox(Inches(6.8), Inches(4.5), Inches(5.3), Inches(1.8))
    tf_38_2 = meta38_2.text_frame
    p = tf_38_2.paragraphs[0]
    p.text = "Degree & Department:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_38_2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_38_2.add_paragraph()
    p.text = "Vellore Institute of Technology (VIT), Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    repo38 = s38.shapes.add_textbox(Inches(1.2), Inches(6.6), Inches(10.933), Inches(0.4))
    tf_r38 = repo38.text_frame
    p = tf_r38.paragraphs[0]
    p.text = "Project Code Repository: https://github.com/swanand70/grid-guard-ai.git"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_TEXT_MUTED

    # -------------------------------------------------------------------------
    # Save Presentation
    # -------------------------------------------------------------------------
    prs.save(output_path)
    print(f"Presentation successfully created with {len(prs.slides)} slides at: {output_path}")

if __name__ == "__main__":
    build_presentation()
