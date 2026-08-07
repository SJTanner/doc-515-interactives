# Documentary Proposal Builder — Activity 1

A static, private, non-scored writing activity for DOC 515 Module 2, Lesson 3. Students progressively assemble a documentary development pack: story, central question, contributors, access, likely scenes, form, production vision, present-tense treatment, feasibility, risks, contingencies, and reflection.

## Edit prompts and teaching content

Edit `data/proposal-builder-data.json`. Each field has an ID, label, help text, optional caution, and control type. Keep field IDs stable if students may already have locally saved work. Increase the top-level `version` only when an incompatible content change should start a fresh local state.

The teacher example is a user-approved fictional community bicycle-workshop project. The application organizes student writing; it does not generate proposal text.

## Local preview and tests

From the repository root, run `ruby -run -e httpd . -p 8015`. Open:

- `http://127.0.0.1:8015/documentary-proposal-builder/`
- `http://127.0.0.1:8015/documentary-proposal-builder/tests.html`

The browser tests cover data initialization, state serialization/restoration, reset, proposal export, and question-list export.

## Accessibility and privacy

The activity uses semantic headings, labeled native form controls, keyboard-operable section navigation, visible focus, status announcements, responsive layout, reduced-motion preferences, and print CSS. Work autosaves only to `localStorage` in the current browser. Reset visibly and permanently deletes this activity’s local data. No login, backend, analytics, numerical scoring, or student-data collection is used.

## Export

Students can copy or download a clean plain-text development pack and a separate development-question list. Print / Save PDF uses the browser print dialog.

## Deployment and Canvas

Publish with GitHub Pages, then link Canvas to `https://sjtanner.github.io/doc-515-interactives/documentary-proposal-builder/` in a new tab. Clearing browser site data also removes locally saved work.
