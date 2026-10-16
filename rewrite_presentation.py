"""
Academic Presentation Rewriter:
ELECTRICITY THEFT INTELLIGENCE & INSPECTION PLATFORM
Author: Swanand Siknis (24BRS1358)
Degree: B.Tech CSE (AI & Robotics) — VIT Chennai

Substantially rewrites the presentation to sound like natural speaking notes:
- Direct, simple, natural English that the student can explain in their own words.
- Pointwise content wherever possible; no nested explanations below every bullet.
- No unnecessary cards or decorative card grids; clean, readable typography-driven text layouts.
- Exact research gaps specified by user (Smart meters in India, Disorganized inspection workflows, No single connected platform).
- Concise Software Engineering methodology and simple ML flow.
- Exact 8 phases status (Phase 4 Complete, Phase 5 Underway).
- 16 Blank-canvas UML (8) and Screenshot (8) slides with only small titles.
- No GitHub links.
- 100% Times New Roman throughout.
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

# Dark Editorial Palette
COLOR_BG = RGBColor(16, 18, 22)              # Near-black charcoal #101216
COLOR_DIVIDER = RGBColor(45, 55, 72)         # Understated divider #2D3748
COLOR_TEXT_PRIMARY = RGBColor(240, 242, 245) # Off-white primary text #F0F2F5
COLOR_TEXT_MUTED = RGBColor(160, 168, 180)   # Muted secondary text #A0A8B4
COLOR_ACCENT_CYAN = RGBColor(34, 211, 238)   # Restrained Cyan accent #22D3EE
COLOR_ACCENT_GREEN = RGBColor(52, 211, 153)  # Complete status #34D399
COLOR_ACCENT_AMBER = RGBColor(251, 191, 36)  # Underway status #FBBF24

TOTAL_SLIDES = 30

def build_presentation(output_path="Electricity_Theft_Intelligence_Project_Presentation_Revised.pptx"):
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
        p_tag.font.size = Pt(11.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = COLOR_ACCENT_CYAN

        title_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.72), Inches(11.533), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = FONT_PRIMARY
        p_title.font.size = Pt(25)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_PRIMARY

        divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(1.38), Inches(11.533), Inches(0.015))
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
        p_fl.font.size = Pt(10)
        p_fl.font.color.rgb = COLOR_TEXT_MUTED

        foot_right = slide.shapes.add_textbox(Inches(7.5), Inches(7.0), Inches(4.933), Inches(0.3))
        tf_right = foot_right.text_frame
        tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
        p_fr = tf_right.paragraphs[0]
        p_fr.alignment = PP_ALIGN.RIGHT
        p_fr.text = f"Swanand Siknis (24BRS1358) | Slide {slide_num} of {TOTAL_SLIDES}"
        p_fr.font.name = FONT_PRIMARY
        p_fr.font.size = Pt(10)
        p_fr.font.color.rgb = COLOR_TEXT_MUTED

    def add_blank_canvas_slide(slide, section_tag, title_text):
        """
        Creates a completely blank canvas slide with ONLY a small top header.
        Leaves the entire slide below y=1.35 completely empty for user diagrams/screenshots.
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
    # SLIDE 1: TITLE SLIDE
    # ==============================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s1)

    t1_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.933), Inches(0.4))
    tf1 = t1_box.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "B.TECH SOFTWARE ENGINEERING PROJECT REVIEW"
    p1.font.name = FONT_PRIMARY
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_ACCENT_CYAN

    title_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(1.65), Inches(10.933), Inches(1.7))
    tf_title1 = title_box1.text_frame
    tf_title1.word_wrap = True
    p_t1 = tf_title1.paragraphs[0]
    p_t1.text = "Electricity Theft Intelligence &\nInspection Platform"
    p_t1.font.name = FONT_PRIMARY
    p_t1.font.size = Pt(36)
    p_t1.font.bold = True
    p_t1.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box1 = s1.shapes.add_textbox(Inches(1.2), Inches(3.55), Inches(10.933), Inches(0.8))
    tf_sub1 = sub_box1.text_frame
    tf_sub1.word_wrap = True
    p_s1 = tf_sub1.paragraphs[0]
    p_s1.text = "Machine Learning-Based Electricity Theft Detection and Inspection Management"
    p_s1.font.name = FONT_PRIMARY
    p_s1.font.size = Pt(18)
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

    meta_box2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.85), Inches(5.3), Inches(1.8))
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
    p.text = "VIT Chennai"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    # ==============================================================================
    # SLIDE 2: PROBLEM STATEMENT (Pointwise, simple text layout)
    # ==============================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s2)
    add_slide_header(s2, "02 | Problem Statement", "Problem Statement")
    add_slide_footer(s2, 2)

    tb2 = s2.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.533), Inches(3.9))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    pts2 = [
        "Smart meters are a relatively new development in India's electricity sector, and their adoption is creating more opportunities to use detailed consumption data.",
        "Traditional meter-reading methods provide less detailed information about daily electricity usage.",
        "Smart-meter data can help identify unusual consumption patterns that may indicate electricity theft.",
        "Distribution companies need a more organized way to review suspicious cases and manage inspections.",
        "ML predictions alone cannot confirm theft; physical inspection is still necessary.",
        "Consumer services, inspection work and official communication should be easier to manage through one connected system."
    ]

    for idx, pt in enumerate(pts2):
        p = tf2.paragraphs[0] if idx == 0 else tf2.add_paragraph()
        p.text = f"•  {pt}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(10)

    # Core problem statement highlighted at bottom
    tb2_sub = s2.shapes.add_textbox(Inches(0.9), Inches(5.75), Inches(11.533), Inches(0.95))
    tf2_s = tb2_sub.text_frame
    tf2_s.word_wrap = True
    p = tf2_s.paragraphs[0]
    p.text = "Central Problem Statement:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf2_s.add_paragraph()
    p.text = '"How can we use smart-meter data to identify possible electricity theft and manage the inspection process through one organized system?"'
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY
    p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 3: PAST WORK IN THIS AREA — LITERATURE REVIEW (3 short paragraphs)
    # ==============================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s3)
    add_slide_header(s3, "03 | Past Work in This Area", "Past Work in This Area")
    add_slide_footer(s3, 3)

    tb3 = s3.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.533), Inches(5.1))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    paras3 = [
        ("Existing ML Approaches",
         "Researchers have widely applied machine learning algorithms to identify potential electricity theft from smart-meter consumption data. Studies show that customer daily usage patterns can reveal consumption anomalies, bypass behavior, and sudden drops in load that indicate unauthorized use."),
        ("Model Selection and Benchmarking",
         "A published benchmark study by Petrlik et al. (2022) evaluated five machine learning models on real smart-meter consumption data. The study demonstrated that tree-based algorithms significantly outperform linear models for tabular consumption data. Based on these verified findings and our own test evaluations, XGBoost was selected as the champion model for its superior detection capability and robustness against missing readings."),
        ("Existing Systems and the Operational Gap",
         "Existing research and software tools focus primarily on offline classification accuracy. However, there is a clear operational gap between detecting suspicious consumption and managing the subsequent inspection process. An isolated risk prediction does not schedule field visits, assign officers, or record physical inspection findings.")
    ]

    for idx, (head, body) in enumerate(paras3):
        p = tf3.paragraphs[0] if idx == 0 else tf3.add_paragraph()
        p.text = f"{idx+1}. {head}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(4)

        p = tf3.add_paragraph()
        p.text = body
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(14)

    # ==============================================================================
    # SLIDE 4: PAST WORK IN THIS AREA — RESEARCH GAPS
    # ==============================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s4)
    add_slide_header(s4, "03 | Past Work in This Area", "Research Gaps")
    add_slide_footer(s4, 4)

    tb4 = s4.shapes.add_textbox(Inches(0.9), Inches(1.7), Inches(11.533), Inches(5.0))
    tf4 = tb4.text_frame
    tf4.word_wrap = True

    gaps4 = [
        ("Gap 1 — Growing Use of Smart Meters in India",
         "Smart meters provide detailed consumption data, creating an opportunity to use daily electricity usage patterns to help identify possible theft. As smart metering expands, utilities need practical tools to make use of this data."),
        ("Gap 2 — Disorganized Inspection Workflows",
         "Electricity distribution companies need a more organized way to review suspicious cases, assign inspection staff, schedule visits and record inspection results. Manual scheduling and unprioritized audits lead to inefficient field operations."),
        ("Gap 3 — No Single Connected Workflow in Existing Systems",
         "The project aims to bring smart-meter-based risk detection and inspection management together, with consumer services and board communication in the same platform. Existing tools rarely connect model predictions with verified field outcomes.")
    ]

    for idx, (head, desc) in enumerate(gaps4):
        p = tf4.paragraphs[0] if idx == 0 else tf4.add_paragraph()
        p.text = head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(6)

        p = tf4.add_paragraph()
        p.text = desc
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.35
        p.space_after = Pt(18)

    # ==============================================================================
    # SLIDE 5: METHODOLOGY — SE WORKFLOW & OPERATIONAL PIPELINE
    # ==============================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s5)
    add_slide_header(s5, "04 | Methodology", "Methodology")
    add_slide_footer(s5, 5)

    # Left: Software Engineering Process (6 points)
    tb5_l = s5.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(6.5), Inches(5.1))
    tf5_l = tb5_l.text_frame
    tf5_l.word_wrap = True

    p = tf5_l.paragraphs[0]
    p.text = "Software Engineering Process"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(10)

    se_steps = [
        "1. Requirements Analysis — Identify the users, their needs and the system requirements.",
        "2. System Design — Plan the architecture, database, user roles and workflows.",
        "3. UML Modelling — Use UML and other diagrams to represent the system before implementation.",
        "4. Incremental Development — Build the system in separate modules and integrate them.",
        "5. Testing — Test the APIs, access permissions and main workflows.",
        "6. Final Integration — Validate the complete system across all user roles."
    ]
    for step in se_steps:
        p = tf5_l.add_paragraph()
        p.text = step
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(8)

    # Right: Operational ML Flow & Key Results
    tb5_r = s5.shapes.add_textbox(Inches(7.7), Inches(1.65), Inches(4.733), Inches(5.1))
    tf5_r = tb5_r.text_frame
    tf5_r.word_wrap = True

    p = tf5_r.paragraphs[0]
    p.text = "Operational ML Flow"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(10)

    ml_flow_lines = [
        "Smart-Meter Data (SGCC Dataset)",
        "        ↓",
        "Data Preprocessing & Cleaning",
        "        ↓",
        "XGBoost Risk Prediction",
        "        ↓",
        "Inspection Prioritization & SHAP",
        "        ↓",
        "Physical On-Site Verification"
    ]
    for line in ml_flow_lines:
        p = tf5_r.add_paragraph()
        p.text = line
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY if "↓" not in line else COLOR_ACCENT_CYAN
        if "↓" not in line:
            p.font.bold = True
        p.space_after = Pt(2)

    p = tf5_r.add_paragraph()
    p.text = "\nKey Model Result on Held-Out Test Data:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(3)

    p = tf5_r.add_paragraph()
    p.text = "• Model: XGBoost Classifier (Threshold: 0.65)\n• Test PR-AUC: 0.3164  |  Test F1: 0.3748\n• 4.9x efficiency improvement over random audits."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.25

    # ==============================================================================
    # SLIDE 6: NOVELTY OF OUR PROJECT
    # ==============================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s6)
    add_slide_header(s6, "05 | Novelty of Our Project", "Novelty of Our Project")
    add_slide_footer(s6, 6)

    tb6 = s6.shapes.add_textbox(Inches(0.9), Inches(1.7), Inches(11.533), Inches(5.0))
    tf6 = tb6.text_frame
    tf6.word_wrap = True

    novelty_pts = [
        ("Identify Suspicious Consumption",
         "Use smart-meter consumption patterns to identify possible electricity theft rather than relying solely on random manual checks."),
        ("Prioritize Field Inspections",
         "Help utility employees prioritize which consumers to inspect first, maximizing the use of limited inspection personnel."),
        ("Explain Predictions with SHAP",
         "Show why a consumer was flagged using SHAP explanations, giving officers clear evidence before visiting a location."),
        ("Manage the Complete Inspection Workflow",
         "Manage case review, officer assignment, visit scheduling, map views and recorded inspection outcomes in one system."),
        ("Unified Utility Platform Vision",
         "Bring inspection operations, consumer services (billing telemetry, dispute filing) and board communications into one planned platform.")
    ]

    for idx, (title, text) in enumerate(novelty_pts):
        p = tf6.paragraphs[0] if idx == 0 else tf6.add_paragraph()
        p.text = f"•  {title}:"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(15.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(2)

        p2 = tf6.add_paragraph()
        p2.text = f"    {text}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(13.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(10)

    # ==============================================================================
    # SLIDE 7: SDLC MODEL — THE INCREMENTAL MODEL
    # ==============================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s7)
    add_slide_header(s7, "06 | SDLC Model", "SDLC Model: The Incremental Model")
    add_slide_footer(s7, 7)

    tb7 = s7.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.533), Inches(2.5))
    tf7 = tb7.text_frame
    tf7.word_wrap = True

    p = tf7.paragraphs[0]
    p.text = "Why We Selected the Incremental Model:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(10)

    sdlc_points = [
        "•  The project has several separate modules: the data/ML pipeline, backend APIs, inspection portal, and consumer/board portals.",
        "•  Each module can be developed and tested in stages before moving to the next part of the system.",
        "•  New modules can be integrated into the existing system with lower risk of breaking working functionality."
    ]
    for pt in sdlc_points:
        p = tf7.add_paragraph()
        p.text = pt
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(8)

    # Simple incremental timeline diagram below
    tb7_diag = s7.shapes.add_textbox(Inches(0.9), Inches(4.3), Inches(11.533), Inches(2.4))
    tf7_d = tb7_diag.text_frame
    tf7_d.word_wrap = True

    p = tf7_d.paragraphs[0]
    p.text = "Incremental Development Progression:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(10)

    increments = [
        ("Increment 1", "Data & ML Engine", "Data cleaning, feature extraction, XGBoost model, SHAP", "COMPLETE"),
        ("Increment 2", "Backend & Database", "MySQL 8.0 schema (16 tables), FastAPI REST APIs, JWT Auth", "COMPLETE"),
        ("Increment 3", "Inspection Portal", "Dashboard, queue, case details, map, field outcome modal", "COMPLETE"),
        ("Increment 4", "Consumer & Board", "Consumer telemetry & dispute UI, board communications", "UNDERWAY")
    ]
    for inc_num, inc_title, inc_desc, inc_stat in increments:
        p = tf7_d.add_paragraph()
        col = COLOR_ACCENT_GREEN if inc_stat == "COMPLETE" else COLOR_ACCENT_AMBER
        p.text = f"•  {inc_num} ({inc_title}): {inc_desc}  —  [{inc_stat}]"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.25
        p.space_after = Pt(4)

    # ==============================================================================
    # SLIDE 8: PROJECT PHASES — DEVELOPMENT PROCESS
    # ==============================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s8)
    add_slide_header(s8, "07 | Project Phases", "Development Process")
    add_slide_footer(s8, 8)

    tb8 = s8.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.533), Inches(5.1))
    tf8 = tb8.text_frame
    tf8.word_wrap = True

    sections8 = [
        ("Requirements Analysis",
         [
             "Requirements were identified for consumers, employees and board communication staff.",
             "A detailed Software Requirements Specification (SRS) was prepared and submitted earlier.",
             "Role-based access boundaries were established to keep consumer private data isolated."
         ]),
        ("System Design",
         [
             "UML diagrams were used to plan the system, its interactions and component boundaries.",
             "Database structure and relationships were designed using a normalized MySQL schema (16 tables).",
             "User roles, state-driven inspection lifecycles and REST API contracts were defined."
         ]),
        ("Implementation",
         [
             "The project was divided into eight working phases to manage complexity.",
             "Each phase covers a distinct part of the system and builds on earlier deliverables.",
             "Testing and final integration are planned as dedicated milestones before completion."
         ])
    ]

    for idx, (head, bullets) in enumerate(sections8):
        p = tf8.paragraphs[0] if idx == 0 else tf8.add_paragraph()
        p.text = f"{idx+1}. {head}"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(4)

        for b in bullets:
            p = tf8.add_paragraph()
            p.text = f"    •  {b}"
            p.font.name = FONT_PRIMARY
            p.font.size = Pt(13)
            p.font.color.rgb = COLOR_TEXT_PRIMARY
            p.line_spacing = 1.3
            p.space_after = Pt(2)
        p.space_after = Pt(10)

    # ==============================================================================
    # SLIDE 9: PROJECT PHASES — THE EIGHT WORKING PHASES (Timeline / List)
    # ==============================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s9)
    add_slide_header(s9, "07 | Project Phases", "The Eight Working Phases")
    add_slide_footer(s9, 9)

    tb9 = s9.shapes.add_textbox(Inches(0.9), Inches(1.6), Inches(11.533), Inches(5.2))
    tf9 = tb9.text_frame
    tf9.word_wrap = True

    phases_list = [
        ("Phase 1 — Requirements and Data Audit", "Identify system requirements; inspect the dataset and plan preprocessing.", "COMPLETE"),
        ("Phase 2 — Data and ML Engine", "Clean and prepare the data; build consumption features and train/evaluate the model.", "COMPLETE"),
        ("Phase 3 — Backend and Database", "Create the database (16 tables) and backend APIs; implement authentication and RBAC.", "COMPLETE"),
        ("Phase 4 — Inspection Portal", "Build the employee dashboard, inspection queue, SHAP details, map, outcomes and reports.", "COMPLETE"),
        ("Phase 5 — Consumer and Board Portals", "Build Consumer Portal and Board Communication Portal; connect workflows to backend.", "UNDERWAY"),
        ("Phase 6 — Feedback and Model Lifecycle", "Extend the use of verified inspection results; improve future model evaluation.", "PENDING"),
        ("Phase 7 — Security and Documentation", "Improve security and integration; complete documentation and deployment preparation.", "PENDING"),
        ("Phase 8 — Final Testing", "Test all user roles and major workflows; resolve issues and validate complete system.", "PENDING")
    ]

    for idx, (p_title, p_desc, p_stat) in enumerate(phases_list):
        p = tf9.paragraphs[0] if idx == 0 else tf9.add_paragraph()
        col = COLOR_ACCENT_GREEN if p_stat == "COMPLETE" else (COLOR_ACCENT_AMBER if p_stat == "UNDERWAY" else COLOR_TEXT_MUTED)
        p.text = f"{p_title}  [{p_stat}]"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf9.add_paragraph()
        p2.text = f"    {p_desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.space_after = Pt(4)

    # ==============================================================================
    # SLIDES 10–17: UML DIAGRAM SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
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
    # SLIDE 18: CURRENT IMPLEMENTATION — PROGRESS OVERVIEW
    # ==============================================================================
    s18 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s18)
    add_slide_header(s18, "08 | Current Implementation", "Current Implementation: Progress Overview")
    add_slide_footer(s18, 18)

    tb18 = s18.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.533), Inches(5.1))
    tf18 = tb18.text_frame
    tf18.word_wrap = True

    p = tf18.paragraphs[0]
    p.text = "Completed Work (Phases 1 to 4):"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_GREEN
    p.space_after = Pt(6)

    comp_items = [
        "•  Phase 1: Requirements analysis and smart-meter dataset audit (SGCC data, 42,372 consumers).",
        "•  Phase 2: Data preprocessing, feature engineering, XGBoost champion model, and SHAP explainability.",
        "•  Phase 3: MySQL relational database (16 tables), FastAPI backend, JWT authentication, and role restrictions.",
        "•  Phase 4: Inspection Intelligence Portal, including: Employee dashboard, inspection queue, case details, SHAP explanations, inspection map, assignment/scheduling, field outcome recording, and reports."
    ]
    for ci in comp_items:
        p = tf18.add_paragraph()
        p.text = ci
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.25
        p.space_after = Pt(4)

    p = tf18.add_paragraph()
    p.text = "\nWork Underway (Phase 5):"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(6)

    underway_items = [
        "•  Phase 5: Consumer Portal and Board Communication Portal.",
        "•  Backend models and API foundations are established; user-facing screens and workflows are in active development."
    ]
    for ui in underway_items:
        p = tf18.add_paragraph()
        p.text = ui
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.25
        p.space_after = Pt(4)

    p = tf18.add_paragraph()
    p.text = "\nTesting Status Note:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(2)

    p = tf18.add_paragraph()
    p.text = "•  All 19 automated backend integration tests pass. Local production build succeeds with zero TypeScript errors.\n•  Browser end-to-end automation had an external Playwright driver/CDN limitation; workflows verified via integration tests."
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.line_spacing = 1.25

    # ==============================================================================
    # SLIDES 19–26: SCREENSHOT SLIDES (COMPLETELY BLANK CANVAS EXCEPT TITLE)
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
    # SLIDE 27: PENDING DELIVERABLES AND CURRENT ISSUES
    # ==============================================================================
    s27 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s27)
    add_slide_header(s27, "09 | Pending Deliverables", "Pending Deliverables and Current Issues")
    add_slide_footer(s27, 27)

    # Left: Pending Deliverables
    tb27_l = s27.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(5.8), Inches(5.1))
    tf27_l = tb27_l.text_frame
    tf27_l.word_wrap = True

    p = tf27_l.paragraphs[0]
    p.text = "Pending Deliverables"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_CYAN
    p.space_after = Pt(10)

    pending_items = [
        "•  Complete the user-facing Consumer Portal.",
        "•  Complete the Board Communication Portal.",
        "•  Integrate and validate all user-facing workflows across roles.",
        "•  Extend feedback and model lifecycle functionality.",
        "•  Complete security hardening, documentation and deployment preparation.",
        "•  Perform final system-wide integration testing."
    ]
    for pi in pending_items:
        p = tf27_l.add_paragraph()
        p.text = pi
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.line_spacing = 1.3
        p.space_after = Pt(8)

    # Right: Current Issues and Limitations
    tb27_r = s27.shapes.add_textbox(Inches(7.1), Inches(1.65), Inches(5.333), Inches(5.1))
    tf27_r = tb27_r.text_frame
    tf27_r.word_wrap = True

    p = tf27_r.paragraphs[0]
    p.text = "Current Issues and Limitations"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT_AMBER
    p.space_after = Pt(10)

    issues_items = [
        ("Browser Automation Driver Limitation",
         "Automated browser-level testing encountered an upstream CDN network failure while downloading Playwright driver binaries. Full browser E2E test runs remain incomplete."),
        ("Verification Workaround",
         "System workflows and data contracts were verified through 19 passing pytest backend integration tests, TypeScript build validation, and manual interface verification."),
        ("Deployment Scope",
         "The platform is currently validated in local development and production-build environments; real utility distribution deployment is not claimed.")
    ]
    for i_title, i_desc in issues_items:
        p = tf27_r.add_paragraph()
        p.text = f"•  {i_title}:"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(12.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_TEXT_PRIMARY
        p.space_after = Pt(2)

        p2 = tf27_r.add_paragraph()
        p2.text = f"    {i_desc}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.line_spacing = 1.25
        p2.space_after = Pt(8)

    # ==============================================================================
    # SLIDE 28: CONCLUSION
    # ==============================================================================
    s28 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s28)
    add_slide_header(s28, "10 | Conclusion", "Conclusion")
    add_slide_footer(s28, 28)

    tb28 = s28.shapes.add_textbox(Inches(0.9), Inches(1.7), Inches(11.533), Inches(5.0))
    tf28 = tb28.text_frame
    tf28.word_wrap = True

    conclusion_points = [
        ("Integrated Operational System",
         "The project combines smart-meter-based risk detection with inspection management, connecting machine learning predictions with verified field outcomes."),
        ("Structured Software Engineering Approach",
         "The Incremental Model supports development in separate modules, ensuring that database, backend security, and inspection workflows are proven before adding further portals."),
        ("Current Delivery Status",
         "The first four phases are complete and verified (ML engine, MySQL database, FastAPI backend, and Inspection Intelligence Portal)."),
        ("Active Development",
         "Phase 5 is underway, focusing on the Consumer Portal and Board Communication Portal."),
        ("Remaining Work",
         "Remaining work includes finishing user-facing portals, deeper feedback integration, documentation, and comprehensive system-wide testing.")
    ]

    for idx, (c_head, c_body) in enumerate(conclusion_points):
        p = tf28.paragraphs[0] if idx == 0 else tf28.add_paragraph()
        p.text = f"•  {c_head}:"
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(15.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(2)

        p2 = tf28.add_paragraph()
        p2.text = f"    {c_body}"
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(13.5)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(10)

    # ==============================================================================
    # SLIDE 29: REFERENCES (Verified publications & data sources)
    # ==============================================================================
    s29 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s29)
    add_slide_header(s29, "10 | References", "References")
    add_slide_footer(s29, 29)

    tb29 = s29.shapes.add_textbox(Inches(0.9), Inches(1.7), Inches(11.533), Inches(5.0))
    tf29 = tb29.text_frame
    tf29.word_wrap = True

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
        p = tf29.paragraphs[0] if idx == 0 else tf29.add_paragraph()
        p.text = ref_head
        p.font.name = FONT_PRIMARY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_ACCENT_CYAN
        p.space_after = Pt(2)

        p2 = tf29.add_paragraph()
        p2.text = ref_text
        p2.font.name = FONT_PRIMARY
        p2.font.size = Pt(12)
        p2.font.color.rgb = COLOR_TEXT_PRIMARY
        p2.line_spacing = 1.3
        p2.space_after = Pt(10)

    # ==============================================================================
    # SLIDE 30: CONCLUSION — REVIEW SIGN-OFF / THANK YOU SLIDE
    # ==============================================================================
    s30 = prs.slides.add_slide(blank_layout)
    add_slide_bg(s30)

    t30_box = s30.shapes.add_textbox(Inches(1.2), Inches(1.2), Inches(10.933), Inches(0.4))
    tf30 = t30_box.text_frame
    p30 = tf30.paragraphs[0]
    p30.text = "B.TECH PROJECT EVALUATION — CONCLUSION"
    p30.font.name = FONT_PRIMARY
    p30.font.size = Pt(13)
    p30.font.bold = True
    p30.font.color.rgb = COLOR_ACCENT_CYAN

    title_box30 = s30.shapes.add_textbox(Inches(1.2), Inches(1.7), Inches(10.933), Inches(1.6))
    tf_t30 = title_box30.text_frame
    tf_t30.word_wrap = True
    p = tf_t30.paragraphs[0]
    p.text = "Electricity Theft Intelligence &\nInspection Platform"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    sub_box30 = s30.shapes.add_textbox(Inches(1.2), Inches(3.45), Inches(10.933), Inches(0.6))
    tf_s30 = sub_box30.text_frame
    p = tf_s30.paragraphs[0]
    p.text = "Thank You — Questions & Academic Technical Review"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(20)
    p.font.color.rgb = COLOR_TEXT_MUTED

    rule30 = s30.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.2), Inches(4.3), Inches(10.933), Inches(0.02))
    rule30.fill.solid()
    rule30.fill.fore_color.rgb = COLOR_DIVIDER
    rule30.line.fill.background()

    meta30_1 = s30.shapes.add_textbox(Inches(1.2), Inches(4.6), Inches(5.3), Inches(1.8))
    tf_30_1 = meta30_1.text_frame
    p = tf_30_1.paragraphs[0]
    p.text = "Student Investigator:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_30_1.add_paragraph()
    p.text = "Swanand Siknis"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_30_1.add_paragraph()
    p.text = "Registration Number: 24BRS1358"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_MUTED

    meta30_2 = s30.shapes.add_textbox(Inches(6.8), Inches(4.6), Inches(5.3), Inches(1.8))
    tf_30_2 = meta30_2.text_frame
    p = tf_30_2.paragraphs[0]
    p.text = "Programme & Institution:"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(11)
    p.font.color.rgb = COLOR_ACCENT_CYAN

    p = tf_30_2.add_paragraph()
    p.text = "B.Tech CSE — Artificial Intelligence & Robotics"
    p.font.name = FONT_PRIMARY
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_TEXT_PRIMARY

    p = tf_30_2.add_paragraph()
    p.text = "VIT Chennai"
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
    print(f"Substantially rewritten presentation successfully created with {len(prs.slides)} slides at: {output_path}")

if __name__ == "__main__":
    build_presentation()
