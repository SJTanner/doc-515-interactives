# Edit Decision Lab

Activity 1 for DOC 515 Lesson 7, **The Edit**.

The lab guides students from protected, organized media through selects, scene construction, rough-cut structure, gap analysis, ethical review, and a concise edit memo. It uses a fictional coastal-cleanup example that continues the teaching world of the Shoot Plan and The Shoot presentations. The example is illustrative and must not be presented as documentary evidence.

## Run locally

Serve the repository root:

```sh
ruby -run -e httpd . -p 8022
```

Open:

- `http://127.0.0.1:8022/edit-decision-lab/`
- `http://127.0.0.1:8022/edit-decision-lab/tests.html`

Opening `index.html` directly with a `file://` URL will usually prevent the browser from loading the JSON file.

## Edit teaching content

Edit `data/edit-lab-data.json`. It contains:

- the five activity stages;
- the media-protection checklist;
- four editorial principles;
- the fictional clip log and sound notes;
- the working scene order and rough-cut scene cards;
- gap, pickup, sound, context, and reflection prompts.

Keep IDs stable after students begin using the lab so saved browser work remains connected to the intended prompts. Increase `revision` when a content change should start a fresh local state.

## Privacy, accessibility, and export

- No login, backend, submission, analytics, tracking, numerical score, or automated creative verdict.
- Work is stored only in the current browser under `doc515-edit-decision-lab-v1`.
- Students can copy, download, print, or permanently reset their edit memo.
- Semantic headings, labels, native controls, keyboard-operable ordering buttons, visible focus, status announcements, responsive layouts, and reduced-motion support are included.
- Essential teaching information is text, never color alone.

## Deployment and Canvas

Publish the repository with GitHub Pages, then embed `https://sjtanner.github.io/doc-515-interactives/edit-decision-lab/` in the Lesson 7 Activity 1 tab. Include a normal external link beneath the iframe as a fallback.
