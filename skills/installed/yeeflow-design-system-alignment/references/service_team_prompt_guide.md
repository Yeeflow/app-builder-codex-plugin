Yeeflow Service Team Standard Prompt Guide

Purpose
Use this guide when the service team needs to create Yeeflow service deliverables in a consistent way.
These prompts are designed to work inside the Yeeflow 2026 Strategy & Design System Alignment project together with:
- the installed yeeflow-design-system-alignment skill
- the uploaded service standard TXT files
- the uploaded Yeeflow logo and design resources

How to use this guide
1. Copy the relevant prompt template.
2. Replace the bracketed placeholders with your real project details.
3. Paste the prompt into the Yeeflow project chat.
4. Review the proposed structure first.
5. After approval, ask ChatGPT to generate the actual deliverable file.

Core rules for all service deliverables
- Keep outputs modern, calm, structured, enterprise-ready, and operational.
- Keep them aligned with Yeeflow’s 2026 strategy and roadmap realism.
- Avoid generic AI hype or unrealistic claims.
- Use the uploaded service standard files and review checklist.
- When a file is needed, explicitly request the file format:
  - Word document (.docx)
  - PowerPoint file (.pptx)
  - Excel workbook (.xlsx)

Prompt 1 — Proposal structure first
Use when you want ChatGPT to propose the structure before generating the proposal file.

Use the uploaded service delivery standards and the installed yeeflow-design-system-alignment skill.

Create a first draft structure for a Yeeflow service proposal for [customer / opportunity / project].

Apply:
- Service_Proposal_Standard.txt
- Service_Output_Review_Checklist.txt

Requirements:
- keep the proposal aligned with Yeeflow branding, design, and messaging standards
- keep the proposal realistic, structured, and executive-readable
- keep the proposal aligned with Yeeflow’s 2026 strategy and roadmap maturity

Before generating the final file, first provide:
1. the proposed proposal structure
2. the key messaging angle
3. the scope framing
4. the assumptions that should be made explicit
5. the likely risks or dependencies

Then wait for my approval.

Prompt 2 — Proposal file generation
Use after Prompt 1 is approved.

Proceed and generate the proposal as a Word document (.docx).

Requirements:
- apply Service_Proposal_Standard.txt
- apply Service_Output_Review_Checklist.txt
- use a clean, structured, enterprise-ready Yeeflow style
- include proper headings and section structure
- keep the content editable for later refinement
- keep branding and layout consistent with Yeeflow standards

Prompt 3 — Service slide deck structure first
Use when you want the slide narrative before generating the deck file.

Use the uploaded service delivery standards and the installed yeeflow-design-system-alignment skill.

Create a first draft structure for a Yeeflow customer solution deck for [customer / opportunity / project].

Apply:
- Service_Slide_Deck_Standard.txt
- Service_Output_Review_Checklist.txt

Requirements:
- keep the deck aligned with Yeeflow branding and design system
- keep the narrative clear, structured, and customer-friendly
- keep the deck realistic to Yeeflow’s actual roadmap maturity

Before generating the final deck, first provide:
1. the recommended slide narrative
2. the slide-by-slide structure
3. the key customer message
4. the visual / diagram needs
5. the main assumptions or constraints

Then wait for my approval.

Prompt 4 — Service slide deck file generation
Use after Prompt 3 is approved.

Proceed and generate the slide deck as a PowerPoint file (.pptx).

Requirements:
- apply Service_Slide_Deck_Standard.txt
- apply Service_Output_Review_Checklist.txt
- keep the deck visually aligned with Yeeflow branding and design system
- make it suitable for customer presentation and later editing
- use bottom-right logo placement for normal content slides
- keep section divider or opening slides flexible if a top-left logo is useful there

Prompt 5 — Workload estimation structure first
Use when you want ChatGPT to propose the scope and estimation logic before generating the workbook.

Use the uploaded service delivery standards and the installed yeeflow-design-system-alignment skill.

Create a workload estimation structure for [project / scope / customer].

Apply:
- Service_Workload_Estimation_Excel_Standard_v2.txt
- Service_Output_Review_Checklist.txt

Requirements:
- this deliverable must be created as an Excel file (.xlsx), not a Word document
- keep the estimation realistic, reviewable, and easy to export to PDF
- keep it aligned with Yeeflow branding and structure rules

Before generating the final workbook, first provide:
1. the scope breakdown
2. the key assumptions
3. the workstream or section logic
4. the likely risk / dependency areas
5. whether Section 2 needs sub-sections based on complexity

Then wait for my approval.

Prompt 6 — Workload estimation file generation
Use after Prompt 5 is approved.

Proceed and generate the workload estimation as an Excel file (.xlsx).

Requirements:
- apply Service_Workload_Estimation_Excel_Standard_v2.txt
- apply Service_Output_Review_Checklist.txt
- use only one sheet called Workload Estimation
- use these 4 main sections:
  1. Section 1: Initiation and Management
  2. Section 2: System Implementation
  3. Section 3: Testing and Verification
  4. Section 4: Documentation and Go Live
- Section 2 may include sub-sections only when complexity justifies them
- the main table should contain only:
  - Task / Item
  - Description
  - Owner / Role
  - Effort (man-days)
- include a subtotal for each section
- include a final total man-days row at the end
- optimize the workbook so all columns fit within one printed page width for PDF export and printing
- keep the styling aligned with Yeeflow’s design and branding system

Prompt 7 — Review an existing proposal
Use when reviewing an existing deliverable instead of creating from scratch.

Review this proposal using:
- Service_Proposal_Standard.txt
- Service_Output_Review_Checklist.txt
- the installed yeeflow-design-system-alignment skill

Please tell me:
1. what is strong
2. what is weak
3. what is inconsistent with Yeeflow standards
4. what is unclear for customer readers
5. the exact fixes to make before sharing

Prompt 8 — Review an existing slide deck
Review this deck using:
- Service_Slide_Deck_Standard.txt
- Service_Output_Review_Checklist.txt
- the installed yeeflow-design-system-alignment skill

Please tell me:
1. what works well
2. what is visually off-standard
3. what is weak in narrative flow
4. which slides need restructuring
5. the exact fixes before customer use

Prompt 9 — Review an existing workload estimation
Review this workload estimation using:
- Service_Workload_Estimation_Excel_Standard_v2.txt
- Service_Output_Review_Checklist.txt
- the installed yeeflow-design-system-alignment skill

Please tell me:
1. whether the structure is correct
2. whether the section logic is clear
3. whether assumptions are missing
4. whether the effort breakdown is reviewable
5. the exact fixes needed before sharing

Prompt 10 — Turn meeting notes into a proposal or deck
Use when the service team has raw notes only.

I will provide raw customer notes.

Please do the following:
1. extract the likely customer problem
2. identify the likely Yeeflow solution angle
3. propose either:
   - a proposal structure, or
   - a service deck structure
4. list the assumptions that need validation
5. wait for my approval before generating the final deliverable file

Apply:
- the uploaded service standards
- Service_Output_Review_Checklist.txt
- the installed yeeflow-design-system-alignment skill

Recommended workflow for the service team
- Start with a structure-first prompt.
- Approve the structure.
- Then ask for the actual file.
- After the file is created, run a review prompt.
- Revise only after the review.

Quick selector
- Need a proposal? Use Prompts 1 and 2.
- Need a slide deck? Use Prompts 3 and 4.
- Need a workload estimation? Use Prompts 5 and 6.
- Need to review an existing output? Use Prompts 7, 8, or 9.
- Only have rough notes? Use Prompt 10.
