# Scene to Story Lab

Lesson 5, Activity 2 for DOC 515: Foundations of Documentary Filmmaking.

This private, non-scored lab teaches the progression **shot → sequence → scene → story**, demonstrates how scenes create documentary story movement, and helps students plan three scenes for their own short films.

## Run locally

Serve the repository root rather than opening the HTML file directly:

```sh
ruby -run -e httpd . -p 8019
```

Then open `http://127.0.0.1:8019/scene-story-lab/`.

## Edit the teaching content

Edit `data/scene-story-data.json`. It contains:

- definitions for shot, sequence, scene, and story;
- the fictional radio-story example and scene anatomy;
- narrative order feedback and the documentary scene test;
- student planning prompts; and
- text-export headings and disclosure.

Keep field `id` values stable after students begin using the activity so locally saved responses still map to the intended prompts.

## Replace the images

Replace files in `images/` while preserving their filenames, or update each `image` path and `alt` description in the JSON/HTML. Use 16:9 images. Current images are AI-generated fictional teaching illustrations and do not depict real documentary contributors or events.

## Privacy and accessibility

- No login, backend, analytics, tracking, student-data collection, or numerical scoring.
- Responses autosave only to browser `localStorage` under `doc515-scene-story-lab-v1`.
- Students can copy, download a plain-text plan, print/save PDF, or permanently reset local work.
- All functions are keyboard operable; controls have visible focus states, status messages use live regions, images have alternative text, layouts reflow, and reduced-motion preferences are honored.
- Students should not enter private contact details.

## Files

- `index.html` — semantic structure and static explanatory text
- `styles.css` — responsive visual design and print rules
- `app.js` — interaction, rendering, local persistence, and exports
- `core.js` — testable state and text-export helpers
- `data/scene-story-data.json` — editable educational content
- `tests.html`, `tests.js` — browser-based core checks
- `images/` — four 16:9 fictional teaching images
