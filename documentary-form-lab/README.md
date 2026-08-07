# Documentary Form Lab: The Same Story, Different Film

An accessible, static interactive lab for DOC 515 — Foundations of Documentary Filmmaking, Module 1, Lesson 2.

Students rebuild one fictional community-garden story as observational, issue-led/expository, participatory, reflexive, poetic, and performative/personal treatments. They compare two treatments, test two forms against their own project, choose a provisional form, and export a non-scored plain-text reflection.

## Privacy and technical requirements

- HTML, CSS, vanilla JavaScript, and editable JSON only
- No login, backend, analytics, cookies, numerical score, or student-data collection
- Student work remains in browser `localStorage`
- Clear Saved Progress and Start Again delete the saved browser state after confirmation
- Copy, plain-text download, and print/save-as-PDF are available
- Teacher Notes is a local display toggle, not authentication

The lab does not submit work to Canvas. Students export and submit their reflection separately if the instructor requests it.

## Local preview

The lab loads `data/form-lab-data.json` with `fetch()`. Run a local web server from this folder:

```sh
ruby -run -e httpd . -p 8001
```

Then open `http://localhost:8001/`.

Do not rely on a direct `file://` opening; browsers commonly block JSON loading from local files.

## Project structure

```text
documentary-form-lab/
├── index.html
├── styles.css
├── core.js
├── app.js
├── tests.html
├── tests.js
├── data/
│   └── form-lab-data.json
└── images/
    ├── community-garden-hero.png
    └── community-garden-contact-sheet.png
```

## Editing educational content

Edit `data/form-lab-data.json` in a plain-text editor. Keep the JSON valid: use double quotes, preserve commas, and do not add comments.

The main editable sections are:

- `forms`: six definitions, “look for” notes, questions, and teacher-mode model combinations
- `storyWorld`: story framing, images, alt text, what stays/changes, and selectable material
- `builder.fields`: treatment prompts
- `comparison.prompts`: authority, emotion, ethics, presence, and scene questions
- `ownProject` and `reflection`: project-transfer and export prompts
- `teacherSupport`: local discussion prompts
- `export`: text-export title, course label, and footer
- `ui`: interface, validation, saved-state, and export labels

Keep each form `id` stable after students begin using the lab because saved browser state uses those IDs. Model combinations must remain examples rather than correct answers.

## Replacing images

1. Prepare a web-optimized 16:9 image, ideally 1280 × 720 pixels or larger.
2. Replace the file while keeping the existing filename, or update the corresponding JSON path.
3. Update the JSON alt text to describe the instructional image accurately.
4. Keep the fictional-teaching-visual disclosure unless the images are replaced with fully cleared documentary material.

The current hero and contact sheet are fictional educational visuals and must not be presented as frames from a real documentary.

## Automated checks

With the local server running, open:

`http://localhost:8001/tests.html`

The browser test page checks:

- JSON loading and required form/story records
- initial and reset state
- ordering changes
- treatment state changes
- local persistence and deletion
- plain-text export
- absence of numerical scoring language in the export

## Manual accessibility test checklist

- Complete every stage using Tab, Shift+Tab, Enter, Space, and arrow keys only.
- In the treatment tray, confirm Move Up, Move Down, and Remove work without dragging.
- Confirm visible focus at 100% and 200% zoom.
- Confirm the layout reflows at 320 CSS pixels without horizontal page scrolling.
- Confirm status announcements for saving, clearing progress, teacher notes, and copying.
- Confirm headings, fieldsets, labels, lists, form controls, and image alternatives in a screen reader.
- Confirm reduced-motion preference removes smooth scrolling.
- Confirm print preview shows only the reflection summary without clipped text.

## GitHub Pages deployment

Commit the complete `documentary-form-lab` folder to the same repository as the other DOC 515 activities. With repository Pages enabled, the expected project URL is:

`https://sjtanner.github.io/doc-515-interactives/documentary-form-lab/`

Test the published JSON and both image paths directly before linking from Canvas.

## Canvas linking

Use the published HTTPS address as an External URL that opens in a new tab, or add a descriptive link inside the Lesson 2 Activity tab. Suggested link wording:

**Open Activity 1: Documentary Form Lab — The Same Story, Different Film**

Do not paste the JavaScript into a Canvas page. Canvas may sanitize it, and institutional iframe rules vary.
