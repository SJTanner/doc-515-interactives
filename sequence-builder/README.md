# DOC 515 Sequence Builder

**Sequence Builder: From Shot to Sequence** is a single-page learning activity for MFA documentary filmmaking students. A visual primer first distinguishes the shot, sequence, and scene through a recurring potter example. Students then arrange ten stills of the potter making a bowl, compare their construction with a model sequence, test the sequence by removing a shot, identify an indispensable shot, and export a short reflection. A concluding field guide carries the exercise into documentary location work. The activity gives narrative feedback only; it never assigns a score.

The project uses plain HTML, CSS, and JavaScript. It has no backend, login, analytics, external font, cookie, or third-party runtime dependency.

## Local preview

The activity loads its editable teaching content from JSON, so preview it through a small local web server rather than opening `index.html` directly as a file.

From the `sequence-builder` folder, run either:

```sh
python3 -m http.server 8080
```

or:

```sh
npx serve .
```

Then open `http://localhost:8080` (or the address printed by the preview tool).

## File structure

```text
sequence-builder/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── sequence-data.json
├── images/
│   ├── 01_ESTABLISHING_WIDE.jpg
│   ├── 02_CLAY_ON_WHEEL.jpg
│   ├── 03_PEDAL_STARTS_WHEEL.jpg
│   ├── 04_CENTERING_CLAY.jpg
│   ├── 05_OPENING_CENTER.jpg
│   ├── 06_RAISING_WALLS.jpg
│   ├── 07_FACE_CUTAWAY.jpg
│   ├── 08_SHAPING_RIM.jpg
│   ├── 09_HAND_CUTAWAY_RIM.jpg
│   └── 10_COMPLETED_BOWL.jpg
└── README.md
```

## Replacing images

1. Prepare landscape images at a 16:9 aspect ratio. The included images are 1672 × 941 pixels.
2. Optimize them as JPEGs for the web.
3. Either replace an existing file while keeping its filename, or add the new file to `images/` and update that frame’s `file` value in `data/sequence-data.json`.
4. Update the frame’s `alt`, `label`, and `caption` values so they accurately describe the replacement.

Avoid placing teaching text inside the images. Keep essential information in HTML through the JSON content so it remains selectable, zoomable, and accessible.

## Editing teaching content

All captions, instructions, prompts, button labels, feedback, sequence definitions, and summary labels live in `data/sequence-data.json`.

- Edit a frame inside `frames` to change its image path, label, caption, alt text, role, or documentary function.
- Edit `scrambledOrder` to change the initial arrangement.
- Edit `modelOrder` to change the model sequence shown to students.
- Edit `coreOrder` to define the process shots whose relative order drives feedback.
- Edit `coherentOrders` to add or remove explicitly accepted constructions.
- Edit `intro.grammarUnits` to revise the shot, sequence, and scene primer or its potter examples.
- Edit `sequenceFeedback`, `removal.feedback`, or `indispensable.feedback` to revise narrative responses.
- Edit `conclusion` to revise the final principles and location checklist.
- Edit `minimumCharacters` in the removal or indispensable sections to change the short-response threshold.
- Edit `reflection.prompts` to revise the four final questions. Keep each prompt `id` unique and stable if students may already have saved browser progress.

Keep frame IDs unique. Every ID used in an order array must have a matching object in `frames`.

### Sequence feedback logic

The app first recognizes the listed `coherentOrders`. It also treats a construction as intelligible when the `coreOrder` remains intact and the two cutaways stay in the later part of the sequence. When the core order is disrupted, the app distinguishes between a partly intelligible construction and an unclear one by measuring how much of that process still runs forward. This calculation is never shown as a score.

## Static deployment

Upload the entire `sequence-builder` folder to a static web host without changing the relative paths. Confirm that the host serves JSON files with a normal JSON or text content type, then test the deployed `index.html` address.

Two practical Canvas options are:

1. **Host and link:** publish the folder on an approved institutional or static web host, then add the public or institution-restricted URL to Canvas as an External URL module item.
2. **Host and embed:** publish the folder on an approved institutional web host, then embed its HTTPS URL in a Canvas iframe where institutional policy permits. The host must allow Canvas to frame the page through its `Content-Security-Policy` and `X-Frame-Options` settings.

Do not assume Canvas will execute an uploaded JavaScript file inside a standard Canvas content page. Hosting the complete folder separately and linking or embedding it is the dependable approach.

The page has no fixed viewport height. If it is embedded, allow the iframe enough height for the current stage or use the institution’s approved responsive iframe method. The activity never opens a new window on its own.

## Accessibility features

- Every still has purpose-written alt text.
- Every frame has visible Move Left and Move Right controls, plus Move to Start and Move to End controls.
- The complete activity can be operated with a keyboard; drag-and-drop is optional.
- Focus indicators are high-contrast and remain visible on all controls.
- Dynamic movement, validation, and feedback are announced through an ARIA live region.
- Semantic buttons, headings, lists, labels, and a skip link establish a clear reading and focus order.
- Text and controls reflow into a single-column layout on narrow screens and at high browser zoom; the main activity does not require horizontal scrolling.
- Prompts, feedback, and the exported summary remain selectable text.
- The design respects increased-contrast and reduced-motion preferences.

## Progress, privacy, and data

Progress is stored only in the current browser’s local storage. Saved fields include the current stage, sequence order, removed shot, selected indispensable shot, and written responses. **No student data is collected, transmitted, or submitted to Canvas.** Copy and download happen on the student’s device.

If local storage is unavailable or blocked, the activity continues to work for the current visit and displays a short notice that progress cannot be saved. “Clear Saved Progress” removes this activity’s local record and returns to the introduction.

## Known limitations

- Progress does not sync between browsers or devices.
- Clearing browser site data removes saved activity progress.
- Clipboard copying depends on browser support and security permissions. If direct copying is unavailable, the summary is selected so the student can use the browser’s copy command.
- The text download is created in the browser and may be handled differently by institution-managed devices.
- HTML drag-and-drop behavior varies on touch devices. Every reordering action has a button-based alternative.
- A Canvas iframe may be restricted by institutional security settings or by the external host’s framing policy.
- The app does not submit to the Canvas gradebook and intentionally provides no numerical score.

## Suggested acceptance check

Starting from cleared progress, confirm that all ten frames load in the scrambled order. Reorder at least one frame with drag-and-drop and another with a move button; reset; check both an imperfect and a coherent sequence; compare the two orders; remove and restore a frame; complete the required removal response; choose and revise an indispensable shot; complete the reflections; copy and download the summary; refresh during several stages to confirm restoration; and finish once using only the keyboard. Repeat at a phone-width viewport and at 200 percent browser zoom.
