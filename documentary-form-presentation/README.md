# The Same Story, Different Film — Slide Presentation

A static, accessible 28-slide presentation viewer for DOC 515, Module 1, Lesson 2.

## Features

- Previous/Next controls and a slide picker
- Left Arrow, Right Arrow, Home, and End keyboard navigation
- An accessible text transcript for every slide
- Browser-local memory of the last viewed slide
- Downloadable PowerPoint source
- No login, backend, analytics, or student-data collection

## Local preview

Run a local server from this folder:

```sh
ruby -run -e httpd . -p 8002
```

Open `http://localhost:8002/`.

## Editing slides

- Replace slide images in `images/` while preserving their numbered filenames, or update paths in `data/slides.json`.
- Edit each slide title and transcript in `data/slides.json` whenever visible slide text changes.
- Keep images at a 16:9 ratio. The current images are 1600 × 900 pixels.
- Replace `the-same-story-different-film.pptx` when the source deck changes.

The community-garden visuals are fictional educational images and must not be presented as frames from a real documentary.

## GitHub Pages and Canvas

Expected published URL:

`https://sjtanner.github.io/doc-515-interactives/documentary-form-presentation/`

Link this URL from the Lesson 2 Presentation tab and open it in a new browser tab. The downloadable PowerPoint remains available for instructors and students who prefer it.
