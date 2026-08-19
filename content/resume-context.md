# Skill Context: Christopher Neale Background & Employment

## 🎯 Skill Overview
This document provides foundational context regarding Christopher Neale's background, education, and professional history. It is designed to be ingested by an AI system to enable context-aware, two-way chat functionalities regarding his career trajectory and technical capabilities.

**Note:** this file is a human-authored reference/staging doc. The live, actually-served copy of this context lives inline in `api/chat.js` (`RESUME_CONTEXT`) — if you edit facts here, mirror the change there too. Source of truth for professional facts: `ChristopherNeale_Resume_LexisNexis.docx`.

---

## 👤 Personal Profile
* **Name:** Christopher Neale
* **Title:** Data Science & Applied AI Leader
* **Current Location:** Raleigh, North Carolina (since 2014)
* **Hometown:** Landenberg, Pennsylvania (Chester County)
* **Family:** Married; has a young daughter (Louisa) and local extended family.
* **Contact:** cjneale.analyst@gmail.com · 984-382-3980 · linkedin.com/in/christophernealeanalyst · https://cjportfolio-inky.vercel.app
* **Hobbies & Interests:**
  * **Golf:** Highly skilled former high-school #1 player; currently builds custom data-tracking dashboards to analyze and improve his game.
  * **History:** Avid reader and American Civil War enthusiast with extensive knowledge of battles, generals, and historical outcomes.

---

## 📝 Summary
Data science practitioner with 5 years building production data and AI systems, most recently as Senior Manager at flyExclusive. M.S. in Data Science. Builds agentic and LLM-powered systems end to end, from LangGraph state machines to production pipelines, and moves fast from prototype to decisions executives can act on. Self-described "vibe coder" who works with AI coding tools like Claude Code as a core part of his workflow.

---

## 🎓 Education
* **Master of Science (M.S.) in Data Science** | *Eastern University* (Dec 2025)
  * Classes in Machine Learning, Cloud Computing, and Data Analysis.
* **Bachelor of Arts (B.A.) in Psychology** | *North Carolina State University* (May 2018)
  * Research methods and statistical analysis.
  * **Note:** Initially pursued Professional Golf Management (including industry internships) before transitioning to a statistically focused major.

---

## 🛠️ Technical Expertise
* **Applied AI / ML:** PyTorch, scikit-learn, XGBoost, local LLM deployment, speech recognition, prompt design, offline model evaluation (precision/recall/F1)
* **Data & Systems:** Python, SQL, Databricks, REST APIs (Flask), CRM/CDP architecture, Master Data Management, data pipelines
* **Analytics & Delivery:** Tableau, Power BI, GA4, multi-touch attribution, A/B testing, AI-assisted development (Claude Code), executive stakeholder communication

---

## 💼 Employment History

### flyExclusive
**Role:** Senior Manager, Marketing Insights & CRM Analytics (Nov 2025 – Present)
* Built an autonomous data enrichment pipeline connecting LLM APIs to the CRM database, generating personalized outreach content and powering a lead-scoring model that prioritizes high-value accounts.
* Led a CRM systems transformation (HubSpot governance, scalable data architecture, deduplication workflows, Master Data Management), then redesigned performance dashboards and attribution frameworks connecting marketing activity to acquisition, retention, and high-value segments.
* Shipped a Python pricing tool for the retail sales team that analyzed competitor pricing and directly shaped 2026 pricing strategy.
* Migrated and redesigned the company website off its legacy CMS platform onto a custom-built site with rich data pipelines for active quoting.
* Developed AI proposal and agreement tools enabling the sales team to build company-approved assets quickly at scale.

### TRANZACT
**Role:** Sr. Data Analyst, CRM (May 2022 – Nov 2025)
* Partnered with commercial and finance leadership on sales performance, attribution, and forecasting analytics.
* Built CRM/ESP integrations (SQL, JSON REST APIs) syncing behavioral data into Iterable for 10+ lifecycle campaigns.
* Ran multi-touch attribution modeling and a structured A/B testing program (50% win rate), improving CTR by 30%.

### Additional Experience
* **American Kennel Club** — Email Marketing Associate (2021–2022)
* **OnPoint** — Marketing Manager (2020–2021): lifecycle marketing, Tableau-driven audience insights, GTM execution with C-suite alignment.

---

## 🚀 Featured Applied AI Projects

### PodFlow — M.S. Data Science Capstone, Eastern University, 2025
* Full audio-to-insight pipeline built solo: transcription (faster-Whisper), automatic content segmentation via a trained CNN-BiLSTM model (benchmarked against XGBoost, focal loss for class imbalance), and LLM-based metadata enrichment, served through a REST API to a working web app.
* Built an offline evaluation framework scoring precision/recall/F1 against hand-labeled ground truth, and deployed a local quantized LLM (Qwen2.5 via llama.cpp) with a rules-based fallback for resilience.
* Demo: linked from this site's nav ("Pod Flow App").

### ChefAI — Agentic Meal-Planning Assistant (LangGraph)
* Conversational meal-planning agent on a LangGraph state machine, with a conditional router that inspects state each turn and dispatches to whichever slot (allergies, diet, dislikes, craving, prep time, budget) still needs filling; LLM-based extraction pulls structured fields from free text.
* Deliberate agent-autonomy-versus-structure tradeoff: accepted added latency/cost from LLM-based slot extraction for a materially better conversational experience than a rigid form.
* Live demo: https://chefai-noemgucqmarbfwe2euwdsl.streamlit.app/

### Resume Chat — this site's "Ask about Chris" widget
* Chunks this resume context by section, ranks chunks against the visitor's question with TF-IDF cosine similarity, and only sends the top-matching chunks to the model — real retrieval, not the whole document stuffed into every prompt.
* Backed by an automated eval harness (`eval/testset.json` + `eval/run-eval.js`) checking factual-grounding and out-of-scope refusal behavior.
