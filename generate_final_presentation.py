"""
Final Academic Presentation Generator:
ELECTRICITY THEFT INTELLIGENCE & INSPECTION PLATFORM
Author: Swanand Siknis (24BRS1358)
Degree: B.Tech CSE (AI & Robotics) — VIT Chennai

Final formatting pass:
- High readability across every slide (main bullets 20-24 pt, titles 30-36 pt, references 14-16 pt).
- Content rearranged proportionally into clean slides with no text shrinking.
- Removed the separate 'Thank You' slide; presentation concludes with actual Conclusion section.
- Exactly 16 blank-canvas UML (8) and Screenshot (8) slides with only small titles.
- Zero GitHub links.
- 100% Times New Roman typography throughout.
- Consistent 0.9" margins, 16:9 widescreen layout, and accurate footer numbering.
"""

import sys
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
COLOR_BG = RGBColor(16, 18, 22)              # Charcoal #101216
COLOR_DIVIDER = RGBColor(45, 55, 72)         # Understated divider #2D3748
COLOR_TEXT_PRIMARY = RGBColor(240, 242, 245) # Off-white primary text #F0F2F5
COLOR_TEXT_MUTED = RGBColor(160, 168, 180)   # Muted secondary text #A0A8B4
COLOR_ACCENT_CYAN = RGBColor(34, 211, 238)   # Restrained Cyan accent #22D3EE
COLOR_ACCENT_GREEN = RGBColor(52, 211, 153)  # Complete status #34D399
COLOR_ACCENT_AMBER = RGBColor(251, 191, 36)  # Underway status #FBBF24

TOTAL_SLIDES = 35

def build_final_presentation(output_path="Electricity_Theft_Intelligence_Project_Presentation_Final.pptx"):
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
        tag_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.4), Inches(11.533), Inches(0.32))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_PRIMARY
        p_tag.font.size = Pt(12)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        title_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.72), Inches(11.533), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(30)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(1.42), Inches(11.533), Inches(0.015))
        divider.fill.solid()
        divider.fill.fore_color.rgb = COLOR_DIVIDER
        divider.line.fill.background()

    def add_slide_footer(slide, slide_num):
        foot_left = slide.shapes.add_textbox(Inches(0.9), Inches(7.0), Inches(6.5), Inches(0.3))
        tf_left = foot_left.text_frame
        tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
        p_fl = tf_left.paragraphs[0]
        p_fl.text = "Electricity Theft Intelligence & Inspection Platform | VIT Chennai"
        p_fl.font.name = FONT_PRIMARY
        p_fl.font.size = Pt(10.5)
        p_fl.font.color.rgb = COLOR_TEXT_MUTED

        foot_right = slide.shapes.add_textbox(Inches(7.5), Inches(7.0), Inches(4.933), Inches(0.3))
        tf_right = foot_right.text_frame
        tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
        p_fr = tf_right.paragraphs[0]
        p_fr.alignment = PP_ALIGN.RIGHT
        p_fr.text = f"Swanand Siknis (24BRS1358) | Slide {slide_num} of {TOTAL_SLIDES}"
        p_fr.font.name = FONT_PRIMARY
        p_fr.font.size = Pt(10.5)
        p_fr.font.color.rgb = COLOR_TEXT_MUTED

    def add_blank_canvas_slide(slide, section_tag, title_text):
        """
        Creates a completely blank canvas slide with ONLY a small top header.
        Leaves the entire slide area below y=1.35 completely empty for user diagrams/screenshots.
        """
        add_slide_bg(slide)
        
        tag_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.4), Inches(11.533), Inches(0.3))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = section_tag.upper()
        p_tag.font.name = FONT_PRIMARY
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        title_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.7), Inches(11.533), Inches(0.5))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(1.25), Inches(11.533), Inches(0.015))
        divider.fill.solid()
        divider.fill.fore_color.rgb = COLOR_DIVIDER
        divider.line.fill.background()

    # ==============================================================================
    # SLIDE 1: TITLE SLIDE (COVER)
    # ==============================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    t1_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.933), Inches(0.4))
    tf1 = t1_box.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "B.TECH SOFTWARE ENGINEERING PROJECT REVIEW"
    p1.font.name = FONT_PRIMARY
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ACCENT_CYAN

    title_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.65), Inches(10.933), Inches(1.7))
    tf_title1 = title_box1.text_frame
    tf_title1.word_wrap = True
    p_t1 = tf_title1.paragraphs[0]
    p_t1.text = "Electricity Theft Intelligence &\nInspection Platform"
    p_t1.font.name = FONT_PRIMARY
    p_t1.font.size = Pt(38)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(3.6), Inches(10.933), Inches(0.8))
    tf_sub1 = sub_box1.text_frame
    tf_sub1.word_wrap = True
    p_s1 = tf_sub1.paragraphs[0]
    p_s1.text = "Machine Learning-Based Electricity Theft Detection and Inspection Management"
    p_s1.font.name = FONT_PRIMARY
    p_s1.font.size = Pt(19)
    p_s1.font.color.rgb = COLOR_TEXT_MUTED

    rule1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.55), Inches(10.933), Inches(0.02))
    rule1.fill.solid()
    rule1.fill.fore_color.rgb = COLOR_DIVIDER
    rule1.line.fill.background()

    meta_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(4.85), Inches(5.3), Inches(1.8))
    tf_m1 = meta_box1.text_frame
    p = tf_m1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta_box2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.85), Inches(5.3), Inches(1.8))
    tf_m2 = meta_box2.text_frame
    p = tf_m2.paragraphs[0]
    p.text = "Programme & Institution:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_m2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_m2.add_paragraph()
    p.text = "VIT Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(14)
    p.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 2: PROBLEM STATEMENT — CHALLENGES IN ELECTRICITY DISTRIBUTION
    # ==============================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_slide_header(s2, "02 | Problem Statement", "Challenges in Electricity Distribution")
    add_slide_footer(s2, 2)

    tb2 = s2.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts2 = [
        "Smart meters are a relatively new development in India's electricity sector, and their adoption is creating more opportunities to use detailed consumption data.",
        "Traditional meter-reading methods provide less detailed information about daily electricity usage.",
        "Smart-meter data can help identify unusual consumption patterns that may indicate electricity theft.",
        "Distribution companies need a more organized way to review suspicious cases and manage inspections."
    ]
    for idx, pt in enumerate(pts2):
        p = tf2.paragraphs[0] if idx == 0 else tf2.add_paragraph()
        p.text = f"•   {pt}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(22)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(20)

    # ==============================================================================
    # SLIDE 3: PROBLEM STATEMENT — FROM PREDICTION TO VERIFICATION
    # ==============================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_slide_header(s3, "02 | Problem Statement", "From Prediction to Verification")
    add_slide_footer(s3, 3)

    tb3 = s3.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    pts3 = [
        "ML predictions alone cannot confirm theft; physical on-site inspection is still necessary.",
        "Consumer services, inspection work and official communication should be easier to manage through one connected system."
    ]
    for idx, pt in enumerate(pts3):
        p = tf3.paragraphs[0] if idx == 0 else tf3.add_paragraph()
        p.text = f"•   {pt}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(22)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(22)

    # Central Problem Statement Highlight
    p = tf3.add_paragraph()
    p.text = "Central Problem Statement:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(6)

    p = tf3.add_paragraph()
    p.text = '"How can we use smart-meter data to identify possible electricity theft and manage the inspection process through one organized system?"'
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(23)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.3

    # ==============================================================================
    # SLIDE 4: PAST WORK IN THIS AREA — LITERATURE REVIEW
    # ==============================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_slide_header(s4, "03 | Past Work in This Area", "Past Work in This Area")
    add_slide_footer(s4, 4)

    tb4 = s4.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf4 = tb4.text_frame
    tf4.word_wrap = True

    paras4 = [
        ("Existing ML Approaches",
         "Researchers have widely applied machine learning algorithms to identify potential electricity theft from smart-meter consumption data. Studies show that customer daily usage patterns can reveal consumption anomalies, bypass behavior, and sudden drops in load that indicate unauthorized use."),
        ("Model Selection and Benchmarking",
         "A published benchmark study by Petrlik et al. (2022) evaluated five machine learning models on real smart-meter consumption data. The study demonstrated that tree-based algorithms significantly outperform linear models for tabular consumption data. Based on these verified findings and our own test evaluations, XGBoost was selected as the champion model for its superior detection capability and robustness against missing readings."),
        ("Existing Systems and the Operational Gap",
         "Existing research and software tools focus primarily on offline classification accuracy. However, there is a clear operational gap between detecting suspicious consumption and managing the subsequent inspection process. An isolated risk prediction does not schedule field visits, assign officers, or record physical inspection findings.")
    ]
    for idx, (head, body) in enumerate(paras4):
        p = tf4.paragraphs[0] if idx == 0 else tf4.add_paragraph()
        p.text = f"{idx+1}. {head}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(19)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(3)

        p = tf4.add_paragraph()
        p.text = body
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(15.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(14)

    # ==============================================================================
    # SLIDE 5: PAST WORK IN THIS AREA — RESEARCH GAPS
    # ==============================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_slide_header(s5, "03 | Past Work in This Area", "Research Gaps")
    add_slide_footer(s5, 5)

    tb5 = s5.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(5.0))
    tf5 = tb5.text_frame
    tf5.word_wrap = True

    gaps5 = [
        ("Gap 1 — Growing Use of Smart Meters in India",
         "Smart meters provide detailed consumption data, creating an opportunity to use daily electricity usage patterns to help identify possible theft. As smart metering expands, utilities need practical tools to make use of this data."),
        ("Gap 2 — Disorganized Inspection Workflows",
         "Electricity distribution companies need a more organized way to review suspicious cases, assign inspection staff, schedule visits and record inspection results. Manual scheduling and unprioritized audits lead to inefficient field operations."),
        ("Gap 3 — No Single Connected Workflow in Existing Systems",
         "The project aims to bring smart-meter-based risk detection and inspection management together, with consumer services and board communication in the same platform. Existing tools rarely connect model predictions with verified field outcomes.")
    ]
    for idx, (head, desc) in enumerate(gaps5):
        p = tf5.paragraphs[0] if idx == 0 else tf5.add_paragraph()
        p.text = head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(5)

        p = tf5.add_paragraph()
        p.text = desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.32
        p.space_after = Pt(18)

    # ==============================================================================
    # SLIDE 6: METHODOLOGY — SOFTWARE ENGINEERING PROCESS
    # ==============================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_slide_header(s6, "04 | Methodology", "Software Engineering Process")
    add_slide_footer(s6, 6)

    tb6 = s6.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf6 = tb6.text_frame
    tf6.word_wrap = True

    se_steps = [
        ("1. Requirements Analysis", "Identify the users, their needs and the system requirements."),
        ("2. System Design", "Plan the architecture, database, user roles and workflows."),
        ("3. UML Modelling", "Use UML and other diagrams to represent the system before implementation."),
        ("4. Incremental Development", "Build the system in separate modules and integrate them."),
        ("5. Testing", "Test the APIs, access permissions and main workflows."),
        ("6. Final Integration", "Validate the complete system across all user roles.")
    ]
    for idx, (step_head, step_desc) in enumerate(se_steps):
        p = tf6.paragraphs[0] if idx == 0 else tf6.add_paragraph()
        p.text = f"•   {step_head}:  "
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

        run = p.add_run()
        run.text = step_desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(12)

    # ==============================================================================
    # SLIDE 7: METHODOLOGY — OPERATIONAL ML & INSPECTION FLOW
    # ==============================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_slide_header(s7, "04 | Methodology", "Operational ML and Inspection Flow")
    add_slide_footer(s7, 7)

    tb7 = s7.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf7 = tb7.text_frame
    tf7.word_wrap = True

    p = tf7.paragraphs[0]
    p.text = "End-to-End Operational Flow:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(8)

    p = tf7.add_paragraph()
    p.text = "Smart-Meter Data   →   Data Preprocessing   →   XGBoost Risk Prediction   →   Inspection Prioritization   →   Physical Verification"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.3
    p.space_after = Pt(24)

    p = tf7.add_paragraph()
    p.text = "Model Evaluation Results (Held-Out Test Data):"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(8)

    ml_points = [
        "Champion Model: XGBoost Classifier (Class-Weighted, Operating Threshold: 0.65)",
        "Held-Out Test PR-AUC: 0.3164 (3.7x improvement over baseline on rare 8.53% theft class)",
        "Held-Out Test Metrics: ROC-AUC: 0.7758  |  F1-Score: 0.3748  |  Precision: 38.9%  |  Recall: 36.2%",
        "Field Inspection Impact: 4.9x efficiency improvement over random manual auditing."
    ]
    for pt in ml_points:
        p = tf7.add_paragraph()
        p.text = f"•   {pt}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(18)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(8)

    # ==============================================================================
    # SLIDE 8: NOVELTY OF OUR PROJECT
    # ==============================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_slide_header(s8, "05 | Novelty of Our Project", "Novelty of Our Project")
    add_slide_footer(s8, 8)

    tb8 = s8.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf8 = tb8.text_frame
    tf8.word_wrap = True

    novelty_pts = [
        ("Identify Suspicious Consumption", "Use smart-meter consumption patterns to identify possible electricity theft rather than relying solely on random manual checks."),
        ("Prioritize Field Inspections", "Help employees prioritize cases for physical inspection, focusing limited officer capacity on high-risk consumers first."),
        ("Explain Predictions with SHAP", "Show why a consumer was flagged using SHAP explanations, giving officers clear evidence before visiting a location."),
        ("Manage the Complete Inspection Workflow", "Manage case review, officer assignment, visit scheduling, map views and recorded inspection outcomes in one system."),
        ("Unified Utility Platform Vision", "Bring inspection operations, consumer services (billing telemetry, dispute filing) and board communications into one planned platform.")
    ]
    for idx, (title, text) in enumerate(novelty_pts):
        p = tf8.paragraphs[0] if idx == 0 else tf8.add_paragraph()
        p.text = f"•   {title}:  "
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(19)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

        run = p.add_run()
        run.text = text
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(12)

    # ==============================================================================
    # SLIDE 9: SDLC MODEL — THE INCREMENTAL MODEL
    # ==============================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_slide_header(s9, "06 | SDLC Model", "SDLC Model: The Incremental Model")
    add_slide_footer(s9, 9)

    tb9 = s9.shapes.add_textbox(Inches(0.9), Inches(1.85), Inches(11.533), Inches(4.9))
    tf9 = tb9.text_frame
    tf9.word_wrap = True

    p = tf9.paragraphs[0]
    p.text = "Why We Selected the Incremental Model:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(18)

    sdlc_points = [
        "The project has several separate modules: the data/ML pipeline, backend APIs, inspection portal, and consumer/board portals.",
        "Each module can be developed and tested in stages before moving to the next part of the system.",
        "New modules can be integrated into the existing system with lower risk of breaking working functionality."
    ]
    for pt in sdlc_points:
        p = tf9.add_paragraph()
        p.text = f"•   {pt}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(22)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(22)

    # ==============================================================================
    # SLIDE 10: SDLC MODEL — INCREMENTAL DEVELOPMENT PROGRESSION
    # ==============================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s10)
    add_slide_header(s10, "06 | SDLC Model", "Incremental Development Progression")
    add_slide_footer(s10, 10)

    tb10 = s10.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf10 = tb10.text_frame
    tf10.word_wrap = True

    increments = [
        ("Increment 1 — Data & ML Engine", "Data cleaning, feature extraction, XGBoost champion model, and SHAP explainability.", "COMPLETE"),
        ("Increment 2 — Backend & Database", "MySQL 8.0 schema (16 tables), FastAPI REST APIs, JWT authentication, and RBAC.", "COMPLETE"),
        ("Increment 3 — Inspection Portal", "Employee dashboard, priority queue, case details, map, and outcome recording modal.", "COMPLETE"),
        ("Increment 4 — Consumer & Board Portals", "Consumer usage telemetry, bill dispute filing, and board communications.", "UNDERWAY")
    ]
    for idx, (inc_title, inc_desc, inc_stat) in enumerate(increments):
        p = tf10.paragraphs[0] if idx == 0 else tf10.add_paragraph()
        col = COLOR_ACCENT_GREEN if inc_stat == "COMPLETE" else COLOR_ACCENT_AMBER
        p.text = f"•   {inc_title}  [{inc_stat}]"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(3)

        p2 = tf10.add_paragraph()
        p2.text = f"     {inc_desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(17.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(14)

    # ==============================================================================
    # SLIDE 11: PROJECT PHASES — DEVELOPMENT PROCESS
    # ==============================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s11)
    add_slide_header(s11, "07 | Project Phases", "Development Process")
    add_slide_footer(s11, 11)

    tb11 = s11.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf11 = tb11.text_frame
    tf11.word_wrap = True

    dev_phases = [
        ("1. Requirements Analysis", [
            "Requirements were identified for consumers, employees and board communication staff.",
            "A detailed Software Requirements Specification (SRS) was prepared and submitted earlier."
        ]),
        ("2. System Design", [
            "UML diagrams were used to plan the system, its interactions and component boundaries.",
            "Database structure and relationships were designed using a normalized MySQL schema (16 tables)."
        ]),
        ("3. Implementation", [
            "The project was divided into eight working phases to manage complexity.",
            "Each phase covers a distinct part of the system and builds on earlier deliverables."
        ])
    ]
    for idx, (head, bullets) in enumerate(dev_phases):
        p = tf11.paragraphs[0] if idx == 0 else tf11.add_paragraph()
        p.text = head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(4)

        for b in bullets:
            p = tf11.add_paragraph()
            p.text = f"    •   {b}"
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(17)
            p.font.color.rgb = COLOR_TEXT_PRIMARY
            p.line_spacing = 1.3
            p.space_after = Pt(3)
        p.space_after = Pt(12)

    # ==============================================================================
    # SLIDE 12: PROJECT PHASES — PHASES 1 TO 4 (COMPLETED)
    # ==============================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s12)
    add_slide_header(s12, "07 | Project Phases", "Phases 1 to 4: Completed Deliverables")
    add_slide_footer(s12, 12)

    tb12 = s12.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf12 = tb12.text_frame
    tf12.word_wrap = True

    phases_comp = [
        ("Phase 1 — Requirements and Data Audit [Complete]", "Identify system requirements; inspect the dataset and plan preprocessing."),
        ("Phase 2 — Data and ML Engine [Complete]", "Clean and prepare the data; build consumption features and train/evaluate the model."),
        ("Phase 3 — Backend and Database [Complete]", "Create the database (16 tables) and backend APIs; implement authentication and RBAC."),
        ("Phase 4 — Inspection Portal [Complete]", "Build the employee dashboard, inspection queue, SHAP details, map, outcomes and reports.")
    ]
    for idx, (p_title, p_desc) in enumerate(phases_comp):
        p = tf12.paragraphs[0] if idx == 0 else tf12.add_paragraph()
        p.text = f"•   {p_title}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_GREEN
        p.space_after = Pt(3)

        p2 = tf12.add_paragraph()
        p2.text = f"     {p_desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(17.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(14)

    # ==============================================================================
    # SLIDE 13: PROJECT PHASES — PHASES 5 TO 8 (UNDERWAY & PENDING)
    # ==============================================================================
    s13 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s13)
    add_slide_header(s13, "07 | Project Phases", "Phases 5 to 8: Underway & Pending Deliverables")
    add_slide_footer(s13, 13)

    tb13 = s13.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf13 = tb13.text_frame
    tf13.word_wrap = True

    phases_pend = [
        ("Phase 5 — Consumer and Board Portals [Underway]", "Build Consumer Portal and Board Communication Portal; connect workflows to backend.", COLOR_ACCENT_AMBER),
        ("Phase 6 — Feedback and Model Lifecycle [Pending]", "Extend the use of verified inspection results; improve future model evaluation.", COLOR_TEXT_MUTED),
        ("Phase 7 — Security and Documentation [Pending]", "Improve security and integration; complete documentation and deployment preparation.", COLOR_TEXT_MUTED),
        ("Phase 8 — Final Testing [Pending]", "Test all user roles and major workflows; resolve issues and validate complete system.", COLOR_TEXT_MUTED)
    ]
    for idx, (p_title, p_desc, col) in enumerate(phases_pend):
        p = tf13.paragraphs[0] if idx == 0 else tf13.add_paragraph()
        p.text = f"•   {p_title}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(3)

        p2 = tf13.add_paragraph()
        p2.text = f"     {p_desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(17.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(14)

    # ==============================================================================
    # SLIDES 14–21: UML DIAGRAM SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
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
    # SLIDE 22: CURRENT IMPLEMENTATION — PROGRESS OVERVIEW
    # ==============================================================================
    s22 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s22)
    add_slide_header(s22, "08 | Current Implementation", "Current Implementation: Progress Overview")
    add_slide_footer(s22, 22)

    tb22 = s22.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf22 = tb22.text_frame
    tf22.word_wrap = True

    p = tf22.paragraphs[0]
    p.text = "Completed Work (Phases 1 to 4):"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN
    p.space_after = Pt(6)

    comp_items = [
        "Phase 1: Requirements analysis and smart-meter dataset audit (SGCC data, 42,372 consumers).",
        "Phase 2: Data preprocessing, feature engineering, XGBoost champion model, and SHAP explainability.",
        "Phase 3: MySQL relational database (16 tables), FastAPI backend, JWT authentication, and role restrictions.",
        "Phase 4: Inspection Intelligence Portal (Employee dashboard, queue, details, SHAP, map, assignment, outcomes, reports)."
    ]
    for ci in comp_items:
        p = tf22.add_paragraph()
        p.text = f"•   {ci}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(17)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(5)

    p = tf22.add_paragraph()
    p.text = "\nWork Underway (Phase 5):"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(6)

    underway_items = [
        "Phase 5: Consumer Portal and Board Communication Portal.",
        "Backend models and API foundations are established; user-facing screens and workflows are in active development."
    ]
    for ui in underway_items:
        p = tf22.add_paragraph()
        p.text = f"•   {ui}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(17)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(5)

    # ==============================================================================
    # SLIDE 23: CURRENT IMPLEMENTATION — TESTING AND VERIFICATION STATUS
    # ==============================================================================
    s23 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s23)
    add_slide_header(s23, "08 | Current Implementation", "Testing and Verification Status")
    add_slide_footer(s23, 23)

    tb23 = s23.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf23 = tb23.text_frame
    tf23.word_wrap = True

    p = tf23.paragraphs[0]
    p.text = "Automated Test Verification:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(8)

    test_items = [
        "All 19 automated backend integration tests pass cleanly in pytest against the MySQL database.",
        "Tests verify JWT authentication, role-based restrictions, inspection state transitions, and database integrity.",
        "Frontend production build succeeds with zero TypeScript errors (tsc -b && vite build in 1.43s)."
    ]
    for ti in test_items:
        p = tf23.add_paragraph()
        p.text = f"•   {ti}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(19)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(10)

    p = tf23.add_paragraph()
    p.text = "\nTesting Scope & Boundary Note:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(8)

    boundary_items = [
        "Browser-level automated driver execution (Playwright) encountered an external upstream CDN network limitation for driver binaries.",
        "System workflows were verified through comprehensive automated API tests and manual interface testing."
    ]
    for bi in boundary_items:
        p = tf23.add_paragraph()
        p.text = f"•   {bi}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(19)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(10)

    # ==============================================================================
    # SLIDES 24–31: SCREENSHOT SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
    # ==============================================================================
    screenshot_titles = [
        "Employee Dashboard",
        "Inspection Queue",
        "Case Details and SHAP",
        "Inspection Map",
        "Field Outcome Recording",
        "Reports",
        "Consumer Portal",
        "Board Communication Portal"
    ]
    for sc_title in screenshot_titles:
        s = prs.slides.add_slide(blank_layout)
        add_blank_canvas_slide(s, "08 | Current Implementation", sc_title)

    # ==============================================================================
    # SLIDE 32: PENDING DELIVERABLES
    # ==============================================================================
    s32 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s32)
    add_slide_header(s32, "09 | Pending Deliverables", "Pending Deliverables")
    add_slide_footer(s32, 32)

    tb32 = s32.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf32 = tb32.text_frame
    tf32.word_wrap = True

    pending_items = [
        "Complete the user-facing Consumer Portal for personal usage telemetry and dispute filing.",
        "Complete the Board Communication Portal for official notices and policy broadcasts.",
        "Integrate and validate all user-facing workflows across user roles.",
        "Extend feedback and model lifecycle functionality with verified field outcomes.",
        "Complete security hardening, documentation and deployment preparation.",
        "Perform final system-wide integration testing."
    ]
    for idx, pi in enumerate(pending_items):
        p = tf32.paragraphs[0] if idx == 0 else tf32.add_paragraph()
        p.text = f"•   {pi}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(14)

    # ==============================================================================
    # SLIDE 33: CURRENT ISSUES AND LIMITATIONS
    # ==============================================================================
    s33 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s33)
    add_slide_header(s33, "09 | Pending Deliverables", "Current Issues and Limitations")
    add_slide_footer(s33, 33)

    tb33 = s33.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf33 = tb33.text_frame
    tf33.word_wrap = True

    issues = [
        ("Browser Automation Driver Limitation",
         "Automated browser testing encountered an upstream CDN network failure while downloading Playwright driver binaries. Full browser E2E test runs remain incomplete."),
        ("Verification Workaround",
         "System workflows and data contracts were verified through 19 passing pytest backend integration tests, TypeScript build validation, and manual interface verification."),
        ("Deployment Scope",
         "The platform is currently validated in local development and production-build environments; real utility distribution deployment is not claimed.")
    ]
    for idx, (head, desc) in enumerate(issues):
        p = tf33.paragraphs[0] if idx == 0 else tf33.add_paragraph()
        p.text = f"•   {head}:"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(21)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_AMBER
        p.space_after = Pt(4)

        p2 = tf33.add_paragraph()
        p2.text = f"     {desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(18)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(16)

    # ==============================================================================
    # SLIDE 34: REFERENCES (VERIFIED ACADEMIC PUBLICATIONS)
    # ==============================================================================
    s34 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s34)
    add_slide_header(s34, "10 | References", "References")
    add_slide_footer(s34, 34)

    tb34 = s34.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(11.533), Inches(5.0))
    tf34 = tb34.text_frame
    tf34.word_wrap = True

    references_list = [
        ("1. Model Benchmarking Study:",
         "Petrlik, J., Lezama, F., et al. (2022). \"Electricity Theft Detection using Machine Learning.\" International Journal of Advanced Computer Science and Applications (IJACSA), Vol. 13, No. 12.\nDOI: 10.14569/IJACSA.2022.0131251"),
        ("2. Smart-Meter Anomaly Detection:",
         "Tsao, Y.-C., Rahmalia, N., & Lu, J.-C. (2024). \"Machine-Learning Techniques for Enhancing Electricity Theft Detection.\" Energy Reports, Vol. 12, pp. 3048–3064.\nDOI: 10.1016/j.egyr.2024.08.067"),
        ("3. Benchmark Smart-Meter Dataset:",
         "State Grid Corporation of China (SGCC). Real-world smart-meter electricity consumption benchmark dataset comprising 42,372 consumers and 1,034 daily consumption readings."),
        ("4. Explainable Artificial Intelligence:",
         "Lundberg, S. M., & Lee, S.-I. (2017). \"A Unified Approach to Interpreting Model Predictions.\" Advances in Neural Information Processing Systems (NeurIPS 2017), Vol. 30.")
    ]
    for idx, (ref_head, ref_text) in enumerate(references_list):
        p = tf34.paragraphs[0] if idx == 0 else tf34.add_paragraph()
        p.text = ref_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(2)

        p2 = tf34.add_paragraph()
        p2.text = ref_text
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(14)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(12)

    # ==============================================================================
    # SLIDE 35: CONCLUSION (FINAL SLIDE — NO THANK YOU SLIDE)
    # ==============================================================================
    s35 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s35)
    add_slide_header(s35, "10 | Conclusion", "Conclusion")
    add_slide_footer(s35, 35)

    tb35 = s35.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(11.533), Inches(4.9))
    tf35 = tb35.text_frame
    tf35.word_wrap = True

    conclusion_points = [
        ("Integrated Operational System", "The project combines smart-meter-based risk detection with inspection management, connecting machine learning predictions with verified field outcomes."),
        ("Structured Software Engineering Approach", "The Incremental Model supports development in separate modules, ensuring that database, backend security, and inspection workflows are proven before adding further portals."),
        ("Delivery Status", "The first four phases are complete and verified (ML engine, MySQL database, FastAPI backend, and Inspection Intelligence Portal)."),
        ("Active Development", "Phase 5 is underway, focusing on the Consumer Portal and Board Communication Portal."),
        ("Remaining Roadmap", "Remaining work includes finishing user-facing portals, deeper feedback integration, documentation, and comprehensive system-wide testing.")
    ]
    for idx, (c_head, c_body) in enumerate(conclusion_points):
        p = tf35.paragraphs[0] if idx == 0 else tf35.add_paragraph()
        p.text = f"•   {c_head}:  "
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(19)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN

        run = p.add_run()
        run.text = c_body
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(14)

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
    # Save Final Presentation
    # -------------------------------------------------------------------------
    prs.save(output_path)
    print(f"Final presentation successfully created with {len(prs.slides)} slides at: {output_path}")

if __name__ == "__main__":
    build_final_presentation()
