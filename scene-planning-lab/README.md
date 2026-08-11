# Scene Planning Lab

Lesson 6, Activity 1 for DOC 515: Foundations of Documentary Filmmaking.

This static activity helps students distinguish a topic or setup from a filmable documentary scene, study an example scene sequence, plan three to eight scenes for a short documentary, place static and dynamic interviews, arrange scenes into story order, and export a reflection summary.

## Run locally

Serve the repository root so the lab can load its JSON and the shared teaching images:

```sh
ruby -run -e httpd . -p 8021
```

Open `http://127.0.0.1:8021/scene-planning-lab/`. Browser-based tests are at `http://127.0.0.1:8021/scene-planning-lab/tests.html`.

Opening `index.html` directly with a `file://` URL will usually prevent the browser from loading the JSON file.

## Edit teaching content

Edit `data/scene-planning-data.json`. It contains:

- the five navigation labels;
- the six scene essentials;
- the topic/setup/scene comparison;
- the fictional food-rescue story, plot points, interview choices, and image paths;
- selectable scene roles and interview modes;
- reflection prompts.

The four 16:9 images for the fictional teaching example are in `images/`. Replace those image files while keeping the filenames, or update the paths and alt text in the JSON.

## Privacy and persistence

- No login, backend, submission, analytics, or numerical scoring.
- Work is stored only in the current browser using `localStorage` under `doc515-scene-planning-lab-v1`.
- Students can copy, download, or print their plan.
- Reset permanently deletes this lab’s saved browser data.

## Accessibility

The lab includes semantic headings and fieldsets, a skip link, keyboard-operable controls, visible focus indicators, status announcements, descriptive image alt text, reduced-motion support, responsive layouts, and a print-focused summary. Earlier/later buttons provide a keyboard-accessible alternative to drag-and-drop.

## Files

- `index.html` — semantic application structure
- `styles.css` — responsive, high-contrast presentation
- `app.js` — rendering, interaction, persistence, and export controls
- `core.js` — state and text-export functions
- `data/scene-planning-data.json` — editable educational content
- `tests.html` / `tests.js` — browser-based functional checks
