# POWERCONNECT — KNOWN SYSTEM LIMITATIONS & ARCHITECTURAL BOUNDARIES

**Project**: PowerConnect — Electricity Theft Intelligence & Inspection Platform  
**Document**: Architectural Constraints, Domain Boundaries & Known Limitations  
**Phase**: Phase 8 Final Acceptance  
**Date**: October 15, 2026  

---

## 1. Purpose of this Document

In rigorous software engineering and applied data science, explicitly articulating what an application does *not* do is as vital as documenting its capabilities. 

This document provides a factual, transparent catalog of all architectural, operational, and data limitations present in the **PowerConnect** platform as validated at Phase 8 completion. These boundaries are documented to ensure that academic evaluators, reviewers, and future maintainers maintain an accurate understanding of the system's intended operational envelope.

---

## 2. Telemetry & Data Provenance Boundaries

### 2.1 SGCC-Derived Benchmark Dataset
- **Limitation**: The daily interval consumption series (1,035 days per consumer) utilized for model training, feature extraction, and consumer portal visualization is derived from the State Grid Corporation of China (SGCC) open benchmark dataset (2016).
- **Engineering Context**: The dataset was cleaned, imputed, winsorized, and mapped to realistic Indian DISCOM consumer metadata (feeder locations in Chennai, sanctioned loads in kW, domestic and commercial tariff schedules).
- **Implication**: While the mathematical variance, drop patterns, and daily trends reflect genuine smart meter readings from real electrical grids, they do not originate from authentic smart meter installations within an Indian state electricity board (e.g. TANGEDCO, BESCOM, MSEDCL). Feeder-level voltage fluctuations and Indian seasonal holiday load profiles (e.g. Diwali, Pongal) are simulated rather than recorded from local feeder telemetry.

### 2.2 Cold-Start & Incomplete Meter Histories
- **Limitation**: The XGBoost feature extractor assumes a minimum time-series history of at least 30 consecutive days to reliably compute statistical moments, entropy, and night-to-day consumption ratios.
- **Implication**: For brand new consumer connections with fewer than 30 daily readings, the system falls back to default population baseline features with a reduced data quality score (`data_quality_score < 0.6`). Physical inspections for newly energized meters should rely on administrative field audits rather than ML risk scores.

---

## 3. Financial & Billing Workflow Boundaries

### 3.1 Simulated Demonstration Billing (Exclusion of Stripe / Gateways)
- **Limitation**: The billing and payment workflow is purely demonstrative and contains **zero integration with real financial payment gateways** (such as Stripe, Razorpay, BillDesk, or UPI).
- **Engineering Context**: In strict compliance with project specifications, Stripe was explicitly excluded from Phase 8. The payment button triggers an atomic database state transition from `PENDING` to `PAID`, generating a mock transaction reference (`TXN-...`) and an immutable audit log entry.
- **Implication**: No financial transactions, card processing, webhook verification, or monetary settlement occur. The platform cannot be deployed as a commercial payment collection portal without a dedicated financial gateway integration phase.

---

## 4. Machine Learning & Statistical Governance Boundaries

### 4.1 Sample-Size Gating on Continuous Model Retraining
- **Limitation**: Automated production model retraining cannot be triggered continuously from day-to-day operations due to the small volume of verified ground-truth labels.
- **Engineering Context**: The closed-loop governance engine enforces a strict safety threshold requiring a minimum of 50 verified, eligible field inspection results before recalculating production metrics or permitting candidate model promotion.
- **Implication**: In the current demonstration database, the flying squad has completed a small set of demonstration cases (<50). Consequently, Tier 3 live performance metrics remain in `INSUFFICIENT_DATA` status, and the platform preserves the immutable offline holdout benchmark (Champion `v1.0.0`, evaluated on 6,356 test profiles). This is an intended safety feature to prevent model degradation from small-sample statistical distortion.

### 4.2 Selection Bias in Vigilance Inspection Outcomes
- **Limitation**: Field inspection outcomes are inherently biased toward suspect meters.
- **Engineering Context**: Flying squads are dispatched specifically to meters with elevated risk scores ($\ge 0.65$) or community whistle-blower tips. Consequently, clean meters in low-risk zones are rarely inspected.
- **Implication**: The empirical confirmation hit rate observed in Tier 2 (operational inspections) reflects precision among investigated suspects, not the overall prevalence of electricity theft across the entire population. The platform explicitly presents this limitation warning to prevent operators from misinterpreting operational hit rates as unbiased population metrics.

### 4.3 Decision Support vs Legal Proof
- **Limitation**: An ML prediction score is an operational decision-support metric, not legal or evidentiary proof of theft.
- **Implication**: A high theft probability (e.g. 92%) indicates a statistical deviation in consumption telemetry consistent with historical bypass patterns. It warrants dispatching an inspection team to verify the physical meter seal, terminal block, and CT/PT wiring. The platform structurally forbids automated punitive actions, billing penalties, or service disconnections based solely on an algorithmic score.

---

## 5. Security & Deployment Topology Boundaries

### 5.1 Local Single-Node Execution
- **Limitation**: The current system is configured and validated for execution on a single local host (Windows 11 / localhost loopback).
- **Implication**: Features required for multi-tenant, cloud-scale enterprise deployment—such as Kubernetes horizontal pod autoscaling, Redis distributed caching, multi-region database replication, hardware security module (HSM) key management, and automated Let's Encrypt SSL/TLS termination—are not part of this local project phase and must be configured during enterprise infrastructure staging.

### 5.2 Browser Environment Automation Limitations
- **Limitation**: Automated browser testing in this evaluation was conducted using headless HTTP protocol integration and static asset validation rather than multi-browser physical hardware testing (e.g. cross-testing on Safari on iOS or Samsung Internet).
- **Implication**: While modern desktop viewports (1440×900, 1366×768), tablet layouts (768×1024), and mobile viewports (390×844) were verified with zero horizontal overflow, subtle rendering differences in proprietary mobile webviews or legacy Internet Explorer/Edge engines were not evaluated.

---

## 6. Summary Matrix of System Boundaries

| Functional Domain | Demonstrated Capability | Acknowledged Operational Boundary |
|---|---|---|
| **Consumer Usage** | 30-day interactive daily consumption charts | Sourced from SGCC benchmark telemetry, not live Indian smart meters. |
| **Billing & Payments** | Atomic state transition and audit logging | Simulated demonstration only; Stripe and external gateways strictly excluded. |
| **Field Inspections** | Priority-ranked queue with TreeSHAP explainability | Decision-support triage; physical on-site inspection remains legally required. |
| **Model Lifecycle** | 3-tier metrics, PSI drift, safe rollback | Retraining gated until $\ge 50$ ground-truth feedback labels are collected. |
| **Security & RBAC** | Strict JWT role isolation across all 3 portals | Single-node deployment; distributed token revocation (Redis) not configured. |
| **Demonstration** | Reproducible single-script local launch | Localhost evaluation; enterprise HTTPS staging requires cloud infra setup. |
