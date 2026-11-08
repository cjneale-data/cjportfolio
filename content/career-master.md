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
- Portfolio: https://cjneale.xyz
- Hobbies: golf (former high-school #1 player; builds his own data-tracking dashboards to analyze his game and built TensorFit, a club-fitting analytics platform), fantasy football analytics, American Civil War history (avid reader; deep knowledge of battles, generals, and outcomes)
<!-- PRIVATE (not confirmed OK for the chat to say): not open to relocation; open to travel incl. 25–50%. -->
<!-- TODO(Chris): work authorization (US citizen?) — recruiters ask; add only what you're happy for the chat to say. -->

## Career Summary
- About 6 years across marketing and data roles (Oct 2020 – present): lifecycle and email marketing, then CRM data analytics, then leading marketing insights, CRM analytics, and marketing data infrastructure.
- Through-line: connecting marketing activity to revenue. That means attribution, conversion tracking, CRM data quality, experimentation, and the pipelines that move data between the website, the CRM, the warehouse, and ad and email platforms.
- Builds things himself in Python and SQL, and since 2025 has built LLM-powered and agentic systems in production and in projects.
- M.S. in Data Science (Eastern University, completed Dec 2025); B.A. in Psychology (NC State, 2018).
- Works heavily with AI coding tools (Claude Code, with MCP servers), usually with several terminals running at once; describes himself as a "vibe coder."

## Experience: flyExclusive (Nov 2025 – present)

### flyExclusive — role overview
- Title: Senior Manager, Marketing Insights & CRM Analytics, flyExclusive, Raleigh, NC (Nov 2025 – present).
- flyExclusive is a fast-growing private aviation company (jet charter, fractional, and jet-card programs) with a retail sales team selling to high-value individual customers.
- Owns marketing data operations: CRM (HubSpot) architecture and governance, website tracking and conversion infrastructure, attribution and performance reporting, and AI tools for the sales organization.
- Also interim manager of the retail sales team (about 20 reps, about $10M in monthly sales revenue) since about May 2026.
- Reports to the Chief Commercial Officer.
- HubSpot Enterprise: has used every hub included in the HubSpot Enterprise package.
- Budget: manages a marketing tools budget of about $500K a year and digital ad spend of about $300K a month.
<!-- TODO(Chris): confirm both budgets are at flyExclusive (assumed). -->

### flyExclusive — interim leadership of the retail sales team
- Since about May 2026 (roughly six months as of Nov 2026), has also served as interim manager of flyExclusive's retail sales team, about 20 people, which does roughly $10M in sales revenue per month.
- This is in addition to his marketing insights and CRM analytics role, so he runs the sales team on the same systems and data he builds for it.
- Also works with the flyExclusive team that sells through charter brokers (the broker channel).

### flyExclusive — sales forecasting and pricing concessions
- At the start of H2 2026, revised flyExclusive's financial plan with new sales projections for the rest of 2026. So far, actual results have tracked much closer to his revised projections than to the original plan.
- Manages decision analytics on sales concessions in contracts (analyzing the discounts and concessions reps give, to inform approval decisions).
<!-- TODO(Chris): you wrote "80% closer to my forecast" — what exactly is 80%? (e.g. forecast error cut by 80% vs. original plan, or actuals within X% of forecast). Any result from the concessions analysis (margin recovered, concession rate change)? -->

### flyExclusive — sales and marketing onboarding
- Onboarded 10 new sales reps and 5 new marketing team members to HubSpot: CRM process, data standards, and the tools the team uses day to day.
- Runs biweekly office hours for the sales team: a planned lesson, then an open forum for questions on the CRM and the other tools he owns. This is how he drives adoption of new systems and AI tools.
<!-- TODO(Chris): any ramp numbers (time to first deal, time to productivity) or adoption metrics? -->

### flyExclusive — how he runs projects and sets priorities
- Writes a PRD (product requirements document) before every build and gets sign-off before building.
- Customer-facing marketing builds go through an initial build, then an iterative internal review process.
- Manages tasks in Microsoft Planner, assigning reviewers and deadlines.
- Presents the most pressing build needs and priorities to the Chief Commercial Officer monthly.
- Manages the outside marketing agency that handles all of flyExclusive's digital ad buying.

### flyExclusive — email deliverability turnaround (change management)
- flyExclusive's sending domain reputation was rated "Bad" in Google Postmaster Tools, so marketing email was landing in spam. Sales leadership wanted to send as many emails as possible to the largest possible list.
- He made the case for trimming the list to engaged contacts with a saved subscription preference, and won the argument.
- Result: the channel became much more effective, and email open rates doubled (2x).

### flyExclusive — privacy, consent, and compliant marketing lists
- Manages the website's cookie consent and privacy policy updates.
- Cleaned a CRM list of about 500,000 contacts down to about 85,000 that could be sent marketing email compliantly.

### flyExclusive — GTM tool consolidation and replacement
- Replaced Tableau and Airtable at flyExclusive with tools he built himself using agentic coding (AI coding tools). The new systems cost little beyond cloud hosting, so the license costs went away.
- Currently leading the replacement of HubSpot with an internal tool built in-house.
<!-- TODO(Chris): license dollars saved from dropping Tableau and Airtable? why the move off HubSpot (cost, flexibility)? Check you're OK with the chat saying the HubSpot replacement publicly. -->

### flyExclusive — billing and payments integrations
- Hands-on experience with Stripe Billing.
- Currently building a Plaid integration (bank-account connectivity for payments).
- Currently building a billing integration into the CRM and the flyExclusive mobile app.
<!-- TODO(Chris): was Stripe Billing at flyExclusive or elsewhere? what is the Plaid integration for? -->

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
- Consolidated about 300 contact properties down to about 100 governed properties that act as the sources of truth in the CRM.
- Built lead routing: leads for certain products go to the reps with the most experience selling that product; other new leads go to a round robin.
<!-- TODO(Chris): record counts (contacts deduped, % duplicates removed), time saved for reps. -->

### flyExclusive — attribution and performance dashboards
- Built new measurement and attribution frameworks connecting marketing activity to customer acquisition, retention, and high-value audience segments.
- Redesigned retail performance dashboards so leadership can see marketing's contribution through the funnel.
- Architected integrated marketing data operations and conversational reporting interfaces (ask-a-question style access to data), giving cross-functional teams on-demand data and insights. The conversational reporting is used by the entire executive leadership team (ELT) and the whole sales team.
- Data platform: Azure at flyExclusive; he builds and runs the ETL and daily data jobs.
<!-- TODO(Chris): which BI tool at flyExclusive? attribution model used? channels covered? -->

### flyExclusive — LLM enrichment pipeline and lead scoring
- Engineered an autonomous data enrichment pipeline that connects LLM APIs directly to the CRM database.
- It generates hyper-personalized outreach content, such as dynamic subject lines and cold openers, for sales outreach.
- It powers an intelligent lead-scoring model that prioritizes high-value accounts for the sales team.
- Scale and results: enriched about 500,000 CRM records. Personalized emails got a 150% better response rate than non-personalized ones, and reps spend much less time personalizing cold outreach by hand.
<!-- TODO(Chris): which LLM/API, how the scoring model works (rules vs ML, features). -->

### flyExclusive — pricing tool and sales AI tools
- Shipped a Python-based competitive pricing web app for the retail sales team that analyzes competitor and market pricing. It directly informed the 2026 pricing tables and strategy.
- Developed AI proposal and agreement tools that let the sales team build company-approved proposals and agreements quickly and consistently at scale. They save the sales team 1 to 2 hours per lead.

## Experience: TRANZACT (May 2022 – Nov 2025)

### TRANZACT — role overview
- Title: Sr. Data Analyst, CRM, TRANZACT, Raleigh, NC (May 2022 – Nov 2025, about 3.5 years).
- TRANZACT is a direct-to-consumer insurance marketing company.
- Partnered with commercial and finance leadership on sales performance, marketing attribution, and forecasting analytics that guided strategic investment and field-activity planning.
- Client-facing work: delivered analytics and reports to the insurance carriers TRANZACT partners with.
- Data platform: Databricks; built and ran ETL and daily data jobs.

### TRANZACT — HIPAA and protected health data
- TRANZACT sells health and Medicare insurance, so CRM data included protected health information (PHI).
- Worked under HIPAA rules in the CRM data: decided what could be used for analytics and marketing and what had to be anonymized.

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

### International nonprofit internship
- Interned for an international nonprofit and lived outside the US for two years, working closely with international colleagues.
<!-- TODO(Chris): organization, country, years, and what you did there. -->

### Golf industry — Professional Golf Management internships (college)
- At NC State, initially studied Professional Golf Management, including industry internships, before switching to a statistically focused psychology major.
<!-- TODO(Chris): where/when were the internships? relevant for golf-industry applications (e.g. PGA). -->

## Projects

### From Attribution to Ad Spend — worked framework on the portfolio site (2026)
- A case study showing how he connects marketing attribution to budget decisions, worked through on an illustrative example (a hypothetical subscription brand spending $100k a month across five paid channels). The numbers are made up; the method is how he works.
- Five steps: define one conversion and its value (revenue or predicted LTV, not sign-ups); unify the data so conversions are counted once with one channel definition built on a UTM taxonomy; compare first-touch, last-touch, linear, and position-based attribution side by side; calibrate with lift tests (geo holdouts, conversion-lift studies, ghost-ad holdouts) to measure each channel's incremental effect; reallocate budget toward the lowest marginal cost per incremental customer using diminishing-returns curves, in capped monthly steps.
- Shows why platform dashboards over-count (each platform claims every conversion it touched), and how last-touch over-credits brand search and retargeting while under-crediting demand-creating channels like paid social.
- Includes an interactive budget model: pick an attribution model and see the budget it recommends and how many incremental customers that plan gains or loses.
- Case study: "From Attribution to Ad Spend" under Projects on the portfolio.

### UTM Journey Tracker — live on the portfolio site (2026)
- A UTM taxonomy written as code: controlled lists of sources and mediums, allowed source/medium pairs, a campaign naming pattern ({year}{quarter}_{objective}_{descriptor}), a campaign registry, and a creative list for utm_content.
- A first-party tracker captures UTMs, ad click IDs, and referrer on landing and keeps the touch for the session. A server-side endpoint validates event names, filters bots, and dedupes on a client-generated event_id before writing to Postgres (Neon).
- Every landing is checked against the taxonomy at read time; bad tags are flagged and counted by rule rather than dropped. One channel grouping (click ID, then utm_medium, then referrer) is used by every view.
- A public real-time dashboard shows sessions stitched into visitor journeys (landing touch, pages, conversion), channel and source/medium breakdowns, and a tag-quality report. Visitors can build a tagged link and watch their own session appear.
- Privacy: honors Global Privacy Control and Do Not Track; no cookies, IP addresses, or fingerprinting; the public dashboard shows only taxonomy values and hashed visitor IDs.
- Live dashboard: the "Live Journeys" link in the site nav.

### PodFlow — content intelligence pipeline (M.S. capstone, Eastern University, 2025)
- Full audio-to-insight pipeline built solo: RSS ingestion into Postgres, transcription with faster-Whisper, and automatic chapter segmentation via a CNN-BiLSTM model he trained (benchmarked against XGBoost, focal loss for class imbalance).
- LLM-based chapter enrichment (titles, descriptions, tags) with a local quantized LLM (Qwen2.5 via llama.cpp) and a rules-based fallback when the model can't load.
- Served through a REST API to a web player.
- Offline evaluation framework scoring precision/recall/F1 against 16 hand-labeled episodes. The eval surfaced that the model over-segments long-form talk content at its default threshold (aggregate F1 0.11), so the next step is per-content-type threshold tuning.
- The working app currently runs on his machine only; there is no public demo. The write-up is the "PodFlow" case study under Projects on the portfolio.

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
- M.S. in Data Science, Eastern University: completed and graduated in December 2025 (degree earned, not in progress). Coursework in Machine Learning, Cloud Computing, and Data Analysis.
- B.A. in Psychology, North Carolina State University (May 2018): research methods and statistical analysis. Started in Professional Golf Management before switching to a statistically focused major.

## Skills and Tools

### Skills — marketing measurement and growth data
- Multi-touch attribution (first-touch, last-touch, linear, model building), conversion tracking, UTM and click-ID strategy, event taxonomy design
- Google Tag Manager, Meta Pixel and Conversions API, Google Ads conversion tracking, offline conversion uploads
- GA4, funnel analysis, A/B testing and experimentation programs, segmentation, forecasting
- Privacy-aware tracking: consent gating, Global Privacy Control

### Skills — data engineering and systems
- SQL (daily for years; window functions), Python (pandas, scikit-learn), Databricks, Azure, BigQuery, PostgreSQL (Neon), ETL and scheduled daily jobs, REST APIs (JSON; Flask), data pipelines and integrations
- CRM/CDP architecture (has used a CDP), HubSpot Enterprise (every hub in the Enterprise package; governance, architecture, user onboarding), Marketo, Iterable, Master Data Management, identity resolution, deduplication, data hygiene
- Billing and payments: Stripe Billing; Plaid integration (in progress)
- GTM tool consolidation: replaced Tableau and Airtable; leading a HubSpot-to-internal-tool replacement

### Skills — AI and machine learning
- LLM application development: RAG/retrieval, agentic workflows (LangGraph), structured extraction, prompt design, LLM APIs (OpenRouter), local LLM deployment (llama.cpp)
- PyTorch, TensorFlow/Keras, scikit-learn, XGBoost, speech recognition (faster-Whisper), offline model evaluation (precision/recall/F1)
- AI-assisted development: Claude Code with MCP servers, AI agent workflows, Gen AI production automation

### Skills — analytics, BI, and delivery
- Tableau, Power BI, executive dashboards, executive stakeholder communication, sales team leadership (interim manager, retail sales), cross-functional partnership with sales, finance, and commercial leadership
- Web: Vercel serverless (Node), Streamlit, FastAPI, React/TypeScript (projects)
