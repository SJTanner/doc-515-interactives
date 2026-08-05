# Filmability Test: Is There a Film Here?

An accessible, static learning activity that helps documentary filmmaking students distinguish among a broad topic, an interesting subject, and a specific filmable situation. It uses narrative guidance rather than scores, grades, points, badges, or right/wrong gamification.

## Course context

- DOC 515 — Foundations of Documentary Filmmaking
- Module 1 — Finding the Film
- Week 1 — From Topic to Filmable Story
- Intended project: a first 3–5-minute documentary

The activity does not submit work to Canvas. Students can copy or download a plain-text summary and submit it separately if their instructor requests it.

## Local preview

The activity loads its teaching content with `fetch()`, so preview it through a small local web server rather than opening `index.html` directly as a `file://` URL.

From the `filmability-test` folder, run any one of these options:

```sh
ruby -run -e httpd . -p 8000
```

or, if Python is available:

```sh
python3 -m http.server 8000
```

or, if PHP is available:

```sh
php -S localhost:8000
```

Then open `http://localhost:8000/`. No package installation or build command is required.

## Project structure

```text
filmability-test/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── filmability-data.json
├── images/
│   ├── loneliness-dance-class.jpg
│   ├── climate-garden.jpg
│   ├── potter-workshop.jpg
│   ├── food-pantry.jpg
│   ├── musician-rehearsal.jpg
│   ├── ai-instructor.jpg
│   └── fallback-documentary-frame.jpg
└── README.md
```

`index.html` contains the semantic page shell. `styles.css` controls layout and presentation. `app.js` controls flow, feedback display, local persistence, guidance, and export. All teaching content is stored separately in `data/filmability-data.json`.

## Replacing scenario images

1. Prepare a web-optimized JPEG in a 16:9 ratio. A consistent size of 1280 × 720 pixels is recommended.
2. Replace the corresponding file in `images/` while keeping the filename unchanged, or update the scenario’s `image` value in `filmability-data.json`.
3. Update the scenario’s `alt` value so it describes the instructional image accurately.
4. Keep `fallback-documentary-frame.jpg`; the application substitutes it when a scenario image cannot load.

The included scenario images are AI-generated, simulated teaching illustrations. Keep the visible simulation disclosure while these images are in use.

## Editing scenarios and feedback

Open `data/filmability-data.json` in a plain-text editor.

Each item in `scenarios` contains:

- `id`: a unique, stable identifier;
- `topic`, `initialIdea`, `image`, and `alt`;
- `questions`: the prompts and choices;
- optional `supplements`: a filmability profile or access note shown after feedback.

A question uses `type: "single"` for radio buttons or `type: "multiple"` for checkboxes. Its `options` contain stable IDs and visible text. The `preferred` array contains the option ID or IDs used to choose feedback. Keep option IDs unique within each question.

Use `preferredFeedback` and `otherFeedback` when the brief supplies different responses for the preferred and alternative selections. Use `feedback` when the same supplied narrative response should appear after any selection. This avoids adding score-like answer states while still allowing students to reconsider and update their responses.

## Adding a scenario

1. Add a new object to the `scenarios` array, following an existing scenario’s structure.
2. Give the scenario and each question a new unique ID.
3. Add the image to `images/` and use a relative path such as `images/example.jpg`.
4. Add accurate alt text.
5. Add each prompt, option, preferred response, and supplied feedback.
6. If needed, add a `supplements` item whose `afterQuestion` value matches a question ID.
7. Update any visible wording that states the number of scenarios.
8. Preview the complete flow and test forward and backward navigation.

## Rule-based guidance

The guidance content and ethical keywords are editable in the `guidance` object in `filmability-data.json`. The decision logic is in `generateGuidance()` in `app.js`.

Because the brief requires one principal category but does not define precedence when several rules match, this implementation uses:

1. access concern;
2. scale concern;
3. promising but underdeveloped;
4. strong initial possibility.

The brief also does not define “very short.” This implementation treats activity or development responses shorter than 20 non-whitespace characters as very short. If no supplied rule matches because an essential field such as contributor or place is blank, the app uses “Promising but underdeveloped” as a fallback. These thresholds and precedence are implementation rules, not scores shown to students.

Ethical keyword guidance is an additional note. It is explicitly labeled as a prompt for further consideration rather than an ethical determination.

## Accessibility features

- Semantic headings, landmarks, lists, forms, fieldsets, legends, and labels
- Native radio buttons, checkboxes, selects, inputs, text areas, and buttons
- Keyboard-operable navigation and interaction throughout
- Visible focus outlines
- Logical focus movement after stage changes and dynamic feedback
- `aria-live` status and feedback regions
- Gentle required-field validation with focus moved to the first missing response
- Descriptive image alt text loaded from JSON
- Sufficient color contrast without red/green answer states
- Responsive layouts usable at a 320-pixel viewport and at 200% zoom
- Reduced-motion preference support
- Selectable and copyable text
- No drag-and-drop requirement

## Privacy

This exercise does not transmit or store responses on a server. Responses remain in the browser unless the student copies or downloads them. The application collects no name, email address, student ID, grade, analytics, or personal identifier.

Progress is stored only in browser `localStorage`. If local storage is unavailable or blocked, the current session remains usable and the summary can still be exported, but progress will not survive a refresh. “Clear Saved Progress” and “Start Again” require confirmation before removing locally saved responses.

## GitHub Pages deployment

1. Commit the complete `filmability-test` folder to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch and folder that contain the site, then save.
5. If the repository contains this activity as a subfolder, link to the full project-subdirectory URL ending in `/filmability-test/`.
6. Test that `data/filmability-data.json` and every image load from the published URL.

All runtime paths are relative, there is no server-side routing, and no build output is needed. This allows the activity to work under a GitHub Pages project subdirectory.

## Canvas linking and iframe notes

The preferred Canvas integration is an External URL module item that opens the published GitHub Pages address. Select “Load in a new tab” if institutional iframe settings block external content.

An instructor may also use an iframe where institutional policy permits it. Use the published HTTPS address as the iframe source, provide a descriptive iframe title, use a responsive container, and avoid a fixed height that clips the activity. The page includes its own “Open this activity in a new tab” fallback link.

Do not paste the application JavaScript directly into a Canvas content page; Canvas may sanitize or block it.

## Known limitations

- Saved progress is tied to one browser and device and can be removed by clearing site data.
- Copy-to-clipboard behavior depends on browser permissions; a readable text-file download is always available as an alternative.
- A direct `file://` opening cannot reliably load JSON because of browser security restrictions; use a local or static web server.
- Canvas iframe behavior depends on institutional security settings outside this project.
- The application offers rule-based prompts, not a prediction of whether a documentary will succeed or an ethical determination.
- The current scenario images are simulated teaching illustrations rather than real documentary contributors or events; the activity discloses this to students.

## Content-editing cautions

Keep the JSON valid: use double quotes, preserve commas between items, and do not add comments inside the JSON file. After editing, preview all affected stages. Educational wording should be changed only by the course content owner.
