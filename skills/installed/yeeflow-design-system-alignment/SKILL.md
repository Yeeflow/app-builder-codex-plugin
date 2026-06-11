---
name: yeeflow-design-system-alignment
description: apply yeeflow's branded design system, official logo asset rules, event booth artwork, event product slide decks, event brochures/booklets, blog images, linkedin featured-image standards, and service-deliverable standards when creating or reviewing yeeflow-branded outputs. use for product ui, website ui, marketing visuals, blog feature images, linkedin featured images and post series, sales one-pagers, service proposals, service slide decks, service workload estimation workbooks, event visuals, printable brochures, design reviews, and related copy. use when outputs must follow yeeflow brand colors, exact logo files, enterprise ai positioning, roadmap realism, structure-first prompt workflows, or yeeflow prompt standards bundled in this skill.
---

# Yeeflow Design System Alignment

Apply Yeeflow's bundled standards whenever the task is about **Yeeflow-branded outputs**. This skill covers visual direction, copy alignment, material-type selection, blog and LinkedIn visual workflows, event asset workflows, service-team deliverables, review logic, and official logo asset usage.

## Workflow decision guide

1. Read `references/master-design-standard.md` first.
2. Choose the best-fit path:
   - **Design / visual asset workflow**
     - Read `references/product-ui-module.md` for product UI, website UI, dashboards, portals, mockups, and UI reviews.
     - Read `references/marketing-visual-module.md` for campaign visuals, blog images, launch graphics, social graphics, and website hero art.
     - Read `references/sales-enablement-module.md` for one-pagers, sales decks, solution briefs, pitch materials, and customer-facing summaries.
     - Read `references/event-editorial-module.md` for booth graphics, signage, event walls, stage visuals, and editorial-style brand posters.
   - **Blog image workflow**
     - Read `references/blog-image-size-and-aspect-ratio-standard.md` for blog featured-image and in-article image sizing.
     - Read `references/blog-featured-image-style-standard.md` for the approved Yeeflow blog featured-image background, logo-safe, and simplicity rules.
     - Distinguish blog featured images from in-article images and LinkedIn featured images.
     - Use a clean, professional, article-led visual style; do not overcomplicate backgrounds.
     - If exact logo fidelity is uncertain, leave a clean logo area instead of generating a substitute logo.
   - **LinkedIn workflow**
     - Read `references/linkedin-featured-image-standard.md`.
     - Read `references/linkedin-post-workflow.md`.
     - Use `references/linkedin-post-prompt-templates.md` when reusable prompt patterns would help.
     - Default to LinkedIn corporate-page featured images at **1080 x 1350 px, 4:5**.
     - Distinguish LinkedIn featured images from blog hero images.
     - For multi-post documents, work **one post at a time** unless the user explicitly asks for the full set.
     - Keep copy generation or review secondary to the visual workflow.
   - **Event booth artwork workflow**
     - Read `references/event-booth-artwork-standard.md`.
     - Use for event booth walls, table fronts, banners, and large-format event graphics.
     - Assign one clear job per surface and prioritize distance readability.
     - Respect production requirements such as bleed, safe areas, print resolution, and exact booth/table dimensions.
     - Use official logos only; when image generation cannot preserve logo fidelity, leave clean logo-safe space for manual logo placement.
   - **Event product slide deck workflow**
     - Read `references/event-product-slide-deck-standard.md`.
     - Use for event-facing product introduction decks, booth display decks, and presentation loops.
     - Default to a **deck plan -> slide-by-slide outline -> wait for approval -> generate slides one by one or create final .pptx** workflow.
     - Keep event decks aligned with the booth system and Yeeflow's 2026 enterprise AI application and execution platform positioning.
     - For generated slide images, use 16:9 high-resolution outputs and preserve approved content exactly when packaging into PPT.
   - **Event brochure / booklet workflow**
     - Read `references/event-brochure-standard.md`.
     - Use for event brochures, product-introduction booklets, printable leave-behinds, and customer-facing handouts.
     - Default to an **A5 4-page booklet** unless the user specifies another format.
     - Use a **copy plan -> wait for approval -> page-by-page artwork generation -> final print production** workflow.
     - Keep brochure pages print-readable, customer-facing, and free of internal roadmap wording.
     - Use clean logo areas for manual placement when exact logo fidelity is uncertain.
   - **Service proposal workflow**
     - Read `references/service_proposal_standard.md`.
     - Default to a **structure first -> wait for approval -> generate final .docx** workflow.
     - Keep proposal tone operational, executive-readable, enterprise-ready, and aligned with Yeeflow's 2026 strategy.
   - **Service slide deck workflow**
     - Read `references/service_slide_deck_standard.md`.
     - Default to a **slide narrative first -> wait for approval -> generate final .pptx** workflow.
     - Apply the content-slide layout rule: normal content slides use bottom-right logo, bottom-left page number, and top area for title/subtitle; opener or divider slides may use a top-left logo when appropriate.
   - **Service workload estimation workflow**
     - Read `references/service_workload_estimation_excel_standard.md`.
     - Default to a **scope/assumption structure first -> wait for approval -> generate final .xlsx** workflow.
     - Workload estimation defaults to **Excel (.xlsx), not Word**.
     - Use **one sheet only** named **Workload Estimation**.
     - Use these 4 main sections:
       1. Section 1: Initiation and Management
       2. Section 2: System Implementation
       3. Section 3: Testing and Verification
       4. Section 4: Documentation and Go Live
     - Section 2 may include sub-sections only when complexity justifies them.
     - Table columns only:
       - Task / Item
       - Description
       - Owner / Role
       - Effort (man-days)
     - Include a subtotal for each section and a final total man-days row.
     - Optimize the workbook so all columns fit within one printed page width for PDF export and printing.
   - **Review workflow**
     - Read `references/service_output_review_checklist.md` for service deliverables.
     - For branded visuals, decks, booth assets, brochures, and blog/LinkedIn images, review against the relevant material-specific standard plus the master standard.
     - Check brand/design consistency, Yeeflow strategy alignment, roadmap realism, executive readability, structure completeness, logo fidelity, production readiness, and customer-facing wording.
3. If the user asks how to create a proposal, deck, estimation, event brochure, event slide deck, booth artwork, blog image, or LinkedIn visual, guide them to the right structure-first prompt pattern and material-specific standard.
4. If the request spans multiple asset types, combine only the relevant standards and keep the output coherent and restrained.
5. Keep all outputs aligned with Yeeflow's 2026 positioning and roadmap maturity. Do not imply capabilities beyond the realistic stage.
6. Use the official logo asset rules below.

## Official logo asset rules

Bundled assets:
- `assets/Yeeflow_logo_only_blue.png`
- `assets/Yeeflow_logo_Standardx25.png`
- `assets/Yeeflow_logo_only_white_2.png`
- `assets/Yeeflow_logo_Whitex25.png`

Selection:
- Use `Yeeflow_logo_Standardx25.png` by default on light backgrounds.
- Use `Yeeflow_logo_Whitex25.png` by default on dark backgrounds.
- Use `Yeeflow_logo_only_blue.png` only for symbol-only treatment on light backgrounds.
- Use `Yeeflow_logo_only_white_2.png` only for symbol-only treatment on dark backgrounds.

Fidelity:
- Treat bundled logo files as exact assets, not inspiration.
- Do not redraw, restyle, simplify, recolor, distort, outline, stretch, crop, rotate, or substitute the logo.
- If a request involves image generation and exact logo fidelity is unlikely, prefer one clear main logo placement and avoid tiny repeated logos in mock UI.
- If exact fidelity inside a small embedded UI area cannot be preserved, omit that secondary logo rather than generating an inaccurate substitute.
- If exact logo fidelity cannot be preserved in a generated visual, leave a clean logo-safe area instead of generating a substitute logo.

## Logo-safe image guidance

- For brand-critical visuals, prioritize exact logo fidelity over one-pass generation convenience.
- Use the relevant material standard for overall art direction, then keep logo placement simple and prominent.
- Avoid repeated tiny logos inside mock UI, architecture boxes, diagrams, or product illustrations.
- For generated brochure, event, booth, slide, or blog artwork, remove inaccurate generated logos and leave a clean area so the official asset can be placed manually.

## Output expectations

- Keep Yeeflow outputs modern, calm, structured, trustworthy, polished, scalable, and enterprise-ready.
- Avoid generic template styling, excessive gradients, decorative noise, fake futuristic claims, and hype-heavy AI language.
- Use realistic product behavior, realistic labels, practical business use cases, and executive-readable structure.
- For generated Yeeflow app UI surfaces, defer to the local Yeeflow Application Design System docs when present. In particular, keep `Main` as a structural parent, place visible content in `Content`, use page-level backgrounds instead of `Main` backgrounds, use meaningful `nv_label`, and align colors/spacing to Yeeflow tokens.
- For file-based service deliverables, generate the requested output format explicitly (.docx, .pptx, .xlsx) rather than leaving the result only in chat.
- For design reviews, evaluate whether the asset follows the bundled standards and state concrete fixes.
- For print outputs, call out size, bleed, safe margin, logo placement, QR placement, and print-readability risks.

## References

- Master standard: `references/master-design-standard.md`
- Project-level orchestration rules: `references/project-instruction.md`
- Product UI module: `references/product-ui-module.md`
- Marketing visual module: `references/marketing-visual-module.md`
- Sales enablement module: `references/sales-enablement-module.md`
- Event and editorial module: `references/event-editorial-module.md`
- Event booth artwork standard: `references/event-booth-artwork-standard.md`
- Event product slide deck standard: `references/event-product-slide-deck-standard.md`
- Event brochure standard: `references/event-brochure-standard.md`
- Blog image size and aspect-ratio standard: `references/blog-image-size-and-aspect-ratio-standard.md`
- Blog featured image style standard: `references/blog-featured-image-style-standard.md`
- LinkedIn featured image standard: `references/linkedin-featured-image-standard.md`
- LinkedIn post workflow: `references/linkedin-post-workflow.md`
- LinkedIn prompt templates: `references/linkedin-post-prompt-templates.md`
- Service proposal standard: `references/service_proposal_standard.md`
- Service slide deck standard: `references/service_slide_deck_standard.md`
- Service workload estimation Excel standard: `references/service_workload_estimation_excel_standard.md`
- Service output review checklist: `references/service_output_review_checklist.md`
- Service team prompt guide: `references/service_team_prompt_guide.md`
