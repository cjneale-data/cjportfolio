<!--
MASTER CAREER CONTEXT — Christopher Neale

This is the single source of truth for two things:
  1. The "Ask about Chris" chat (api/chat.js loads this file, splits it on
     ## / ### headings, and retrieves the best-matching sections per question).
  2. Every tailored resume and /for/<slug> page. Tailoring = selecting and
     tightening facts from here, never adding facts that aren't here.

Rules for editing:
  - Everything outside HTML comments is PUBLIC: the chat can repeat it to
    anyone. Keep salary, reasons for leaving, references, and anything
    confidential out, or inside a comment.
  - Be exhaustive and plain. Put every tool, project, number, and outcome in.
    Resume polish happens later, per job.
  - Each ### section should make sense on its own (name the company in the
    heading); the chat retrieves sections one at a time.
  - Put a number on anything you can: volumes, %, $, time saved, team size.
  - Open questions for Chris are in comments marked TODO(Chris).
  - content/resume.json holds the resume's fixed structure (contact, titles,
    dates, education, project write-ups). Keep its facts consistent with this file.
-->

# Christopher Neale — Master Career Context

## Personal
- Name: Christopher Neale ("Chris")
- Positioning: marketing data and applied-AI practitioner. He builds measurement, CRM data, and attribution systems and the pipelines under them, and he builds LLM-powered tools end to end.
- Currently: Senior Manager, Marketing Insights & CRM Analytics at flyExclusive (Nov 2025 – present)
- Location: Raleigh, North Carolina (since 2014); grew up in Landenberg, Pennsylvania (Chester County)
- Family: married, one young daughter (Louisa), with extended family nearby
- Contact: cjneale.analyst@gmail.com · 984-382-3980
- LinkedIn: https://www.linkedin.com/in/christophernealeanalyst/
- Portfolio: https://cjportfolio-inky.vercel.app
- Hobbies: golf (former high-school #1 player; builds his own data-tracking dashboards to analyze his game and built TensorFit, a club-fitting analytics platform), fantasy football analytics, American Civil War history (avid reader; deep knowledge of battles, generals, and outcomes)
<!-- TODO(Chris): open to relocation? remote/hybrid preference? work authorization (US citizen?) — recruiters ask; add only what you're happy for the chat to say. -->

## Career Summary
- About 6 years across marketing and data roles (Oct 2020 – present): lifecycle and email marketing, then CRM data analytics, then leading marketing insights, CRM analytics, and marketing data infrastructure.
- Through-line: connecting marketing activity to revenue. That means attribution, conversion tracking, CRM data quality, experimentation, and the pipelines that move data between the website, the CRM, the warehouse, and ad and email platforms.
- Builds things himself in Python and SQL, and since 2025 has built LLM-powered and agentic systems in production and in projects.
- M.S. in Data Science (Eastern University, Dec 2025); B.A. in Psychology (NC State, 2018).
- Works heavily with AI coding tools (Claude Code, with MCP servers), usually with several terminals running at once; describes himself as a "vibe coder."

## Experience: flyExclusive (Nov 2025 – present)

### flyExclusive — role overview
- Title: Senior Manager, Marketing Insights & CRM Analytics, flyExclusive, Raleigh, NC (Nov 2025 – present).
- flyExclusive is a private aviation company (jet charter, fractional, and jet-card programs) with a retail sales team selling to high-value individual customers.
- Owns marketing data operations: CRM (HubSpot) architecture and governance, website tracking and conversion infrastructure, attribution and performance reporting, and AI tools for the sales organization.
<!-- TODO(Chris): team size / direct reports? who you report to (CMO? VP Marketing?) — "Senior Manager" reads stronger with scope. -->

### flyExclusive — website migration, conversion tracking, and ad-platform data
- Migrated and redesigned the company website off its legacy CMS onto a custom-built site, with data pipelines feeding active quoting (quote requests flow into the CRM).
- Implemented the website's tracking in Google Tag Manager (GTM) for conversion events.
- Implemented the Meta Pixel and the Meta Conversions API (CAPI) so conversions are captured both in the browser and server-side.
- Set up Google Ads conversion tracking for website conversions.
- Set up offline conversion uploads: sending downstream CRM outcomes (qualified leads and closed sales that happen after the website visit) back to the ad platforms so campaigns can optimize on real business results, not just form fills.
<!-- TODO(Chris): fill in specifics. Each one makes this section much stronger:
  - Which ad platforms received offline conversions (Google Ads, Meta, LinkedIn?) and from which CRM stages?
  - Google Ads Enhanced Conversions (for leads)? Server-side GTM? Consent Mode / a CMP (OneTrust, Cookiebot...)?
  - GA4 setup on the new site? BigQuery export?
  - Any before/after numbers: conversion volume recovered, CPA/ROAS change, lead-quality change, quote volume, page speed?
-->

### flyExclusive — CRM transformation and data governance
- Led a CRM systems transformation on HubSpot: designed and enforced governance (properties, required fields, ownership rules, lifecycle stages), built a scalable data architecture, created deduplication workflows, and set up Master Data Management (MDM).
- Goal and result: a single source of truth for the sales organization, with clean, deduplicated records that reporting, attribution, and lead scoring can rely on.
- Identity resolution and data hygiene: merging duplicate contacts and companies and standardizing records across sources.
<!-- TODO(Chris): record counts (contacts deduped, % duplicates removed), adoption numbers, time saved for reps. -->

### flyExclusive — attribution and performance dashboards
- Built new measurement and attribution frameworks connecting marketing activity to customer acquisition, retention, and high-value audience segments.
- Redesigned retail performance dashboards so leadership can see marketing's contribution through the funnel.
- Architected integrated marketing data operations and conversational reporting interfaces (ask-a-question style access to data), giving cross-functional teams on-demand data and insights.
<!-- TODO(Chris): which BI tool at flyExclusive? attribution model used? channels covered? -->

### flyExclusive — LLM enrichment pipeline and lead scoring
- Engineered an autonomous data enrichment pipeline that connects LLM APIs directly to the CRM database.
- It generates hyper-personalized outreach content, such as dynamic subject lines and cold openers, for sales outreach.
- It powers an intelligent lead-scoring model that prioritizes high-value accounts for the sales team.
<!-- TODO(Chris): which LLM/API, volume of records enriched, lift in reply/meeting rates, how the scoring model works (rules vs ML, features). -->

### flyExclusive — pricing tool and sales AI tools
- Shipped a Python-based competitive pricing web app for the retail sales team that analyzes competitor and market pricing. It directly informed the 2026 pricing tables and strategy.
- Developed AI proposal and agreement tools that let the sales team build company-approved proposals and agreements quickly and consistently at scale.

## Experience: TRANZACT (May 2022 – Nov 2025)

### TRANZACT — role overview
- Title: Sr. Data Analyst, CRM, TRANZACT, Raleigh, NC (May 2022 – Nov 2025, about 3.5 years).
- TRANZACT is a direct-to-consumer insurance marketing company.
- Partnered with commercial and finance leadership on sales performance, marketing attribution, and forecasting analytics that guided strategic investment and field-activity planning.

### TRANZACT — CRM/ESP integrations and lifecycle data
- Engineered CRM and ESP data integrations using SQL and JSON REST APIs, syncing behavioral data into Iterable.
- These integrations powered 10+ lifecycle campaigns and protected data integrity for accurate commercial reporting.
- This is the audience-sync pattern: modeled segments and behavioral data pushed from the data side into an activation platform.

### TRANZACT — attribution, paid-media measurement, and forecasting
- Ran multi-touch attribution modeling and turned campaign performance into recommendations that guided cross-functional digital investment decisions.
- Established measurement frameworks and forecasting models for higher-funnel paid media strategy, translating complex commercial data into executive recommendations on customer acquisition and pipeline growth.
<!-- TODO(Chris): attribution method (position-based? data-driven?), tools (SQL warehouse? Databricks?), paid channels covered, budget scale. -->

### TRANZACT — experimentation program
- Built and ran a structured A/B testing framework for segmentation and campaign optimization.
- 50% test win rate; improved CTR by 30%; set up continuous-improvement protocols.

## Earlier Experience

### American Kennel Club — Email Marketing Associate (Apr 2021 – May 2022)
- Raleigh, NC. Built audience insights with Tableau-driven performance analysis and optimization.
- Automated customer journeys with dynamic email content.

### OnPoint — Marketing Manager (Oct 2020 – Apr 2021)
- Raleigh, NC. Led lifecycle strategy and targeting across email and paid social.
- Championed data-driven marketing execution and built alignment with C-suite stakeholders.
<!-- TODO(Chris): older resumes say "GTM execution" here. Is that go-to-market or Google Tag Manager? Recruiters for growth-data roles will read it as Tag Manager. -->

### Golf industry — Professional Golf Management internships (college)
- At NC State, initially studied Professional Golf Management, including industry internships, before switching to a statistically focused psychology major.
<!-- TODO(Chris): where/when were the internships? relevant for golf-industry applications (e.g. PGA). -->

## Projects

### Attribution Lab — first-party growth tracking on this portfolio site (2026)
- Built this site's own marketing-measurement stack end to end.
- A first-party tracker captures UTM parameters and ad click IDs (gclid, gbraid, wbraid, fbclid, ttclid, li_fat_id, msclkid) and builds Meta's fbc value at landing.
- A server-side endpoint validates every event against one event taxonomy (snake_case object_action names), keeps only declared properties, filters bots, and dedupes on a client-generated event_id before writing to Postgres (Neon).
- Computes first-touch, last-touch, and linear attribution by channel in SQL with window functions over a 30-day lookback, plus per-campaign and data-quality views (orphan conversions, untagged traffic share, consent opt-out share, ingest lag).
- Builds consent-gated, dry-run offline-conversion payloads for Google Ads (click conversions), Meta CAPI, the TikTok Events API, and LinkedIn CAPI.
- Honors Global Privacy Control and Do Not Track; stores no IPs or cookies.
- Case study: the "Attribution Lab" page under Projects on the portfolio.

### PodFlow — content intelligence pipeline (M.S. capstone, Eastern University, 2025)
- Full audio-to-insight pipeline built solo: RSS ingestion into Postgres, transcription with faster-Whisper, and automatic chapter segmentation via a CNN-BiLSTM model he trained (benchmarked against XGBoost, focal loss for class imbalance).
- LLM-based chapter enrichment (titles, descriptions, tags) with a local quantized LLM (Qwen2.5 via llama.cpp) and a rules-based fallback when the model can't load.
- Served through a REST API (Flask originally; now Vercel functions on Neon Postgres) to a working web player.
- Offline evaluation framework scoring precision/recall/F1 against 16 hand-labeled episodes. The eval surfaced that the model over-segments long-form talk content at its default threshold (aggregate F1 0.11), so the next step is per-content-type threshold tuning.
- Demo: the "Pod Flow App" link in the site nav.

### ChefAI — agentic meal-planning assistant (LangGraph)
- Conversational meal-planning agent on a LangGraph state machine. A conditional router inspects state each turn and dispatches to whichever slot (allergies, diet, dislikes, craving, prep time, budget) still needs filling.
- LLM-based extraction pulls structured fields from free text, a deliberate tradeoff of some latency and cost for a much better experience than a rigid form.
- Recognizes follow-up intent ("more", "different") and regenerates without restarting the slot-filling flow.
- Streamlit app on OpenRouter, with Supabase for auth and saved recipes. Previously called "Recipe Wiz."
- Live demo: https://chefai-noemgucqmarbfwe2euwdsl.streamlit.app/

### Resume Chat — the "Ask about Chris" widget on this site
- Retrieval-augmented chat: this master career file is split by section, each section is ranked against the visitor's question with TF-IDF cosine similarity (plus query-side synonym expansion), and only the top sections go to the model.
- Grounded generation via OpenRouter, server-side only so the API key never reaches the browser.
- Automated eval harness that checks factual grounding and out-of-scope refusal behavior.

### TensorFit — golf club-fitting analytics platform (side project)
- Full-stack SaaS: dedicated parsers normalize shot data from 8 launch-monitor brands (Garmin R10, Rapsodo MLM2PRO, TrackMan, FlightScope, Foresight, SkyTrak, Uneekor, Full Swing) into one shot schema.
- Statistics module computes dispersion ellipses, a 0–100 consistency score, and Mahalanobis-style outlier detection.
- Physics-informed rules engine recommends shaft and head changes. An ML plan (three models, cold-start via a physics simulator, shadow-mode rollout) is designed but not yet trained.
- FastAPI/Python backend, React + TypeScript frontend, Supabase.

### Mushroom Toxicity Classifier (M.S. coursework)
- Keras binary classifier on 116 one-hot features from the UCI mushroom dataset, class-weighted for imbalance.
- Full-feature vs. PCA-reduced (40 components, 95% variance) ablation comparing accuracy, parameter count, and training time.

### Other M.S. coursework projects
- Face detection and recognition (MTCNN + transfer learning on a frozen VGGFace network), a class-imbalance classifier (COVID-19 diagnosis, before/after class weighting), a PCA-vs-t-SNE cluster visualization comparison, and end-to-end model deployment via Flask (train → pickle → serve).

## Education

### Education — degrees
- M.S. in Data Science, Eastern University (Dec 2025): coursework in Machine Learning, Cloud Computing, and Data Analysis.
- B.A. in Psychology, North Carolina State University (May 2018): research methods and statistical analysis. Started in Professional Golf Management before switching to a statistically focused major.

## Skills and Tools

### Skills — marketing measurement and growth data
- Multi-touch attribution (first-touch, last-touch, linear, model building), conversion tracking, UTM and click-ID strategy, event taxonomy design
- Google Tag Manager, Meta Pixel and Conversions API, Google Ads conversion tracking, offline conversion uploads
- GA4, funnel analysis, A/B testing and experimentation programs, segmentation, forecasting
- Privacy-aware tracking: consent gating, Global Privacy Control

### Skills — data engineering and systems
- SQL (daily for years; window functions), Python (pandas, scikit-learn), Databricks, PostgreSQL (Neon), REST APIs (JSON; Flask), data pipelines and integrations
- CRM/CDP architecture, HubSpot (governance, architecture), Iterable, Master Data Management, identity resolution, deduplication, data hygiene

### Skills — AI and machine learning
- LLM application development: RAG/retrieval, agentic workflows (LangGraph), structured extraction, prompt design, LLM APIs (OpenRouter), local LLM deployment (llama.cpp)
- PyTorch, TensorFlow/Keras, scikit-learn, XGBoost, speech recognition (faster-Whisper), offline model evaluation (precision/recall/F1)
- AI-assisted development: Claude Code with MCP servers, AI agent workflows, Gen AI production automation

### Skills — analytics, BI, and delivery
- Tableau, Power BI, executive dashboards, executive stakeholder communication, cross-functional partnership with sales, finance, and commercial leadership
- Web: Vercel serverless (Node), Streamlit, FastAPI, React/TypeScript (projects)
