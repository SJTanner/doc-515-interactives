# Interview Direction Lab

Activity 1 for Lesson 4, **Static and Dynamic Interviews**.

The lab helps a student create a contributor-centered interview direction plan. It contains no login, backend, analytics, student-data collection, or numerical score. Work is stored only in the student’s browser through `localStorage` and can be copied, downloaded as text, or printed.

## Edit the teaching content

Edit `data/interview-lab-data.json` to revise:

- section titles and introductions;
- field labels, help text, and cautions;
- static/dynamic choice descriptions;
- preparation checklist items;
- the fictional community-choir example; and
- export labels.

Keep field `id` values stable after students begin using the activity so previously saved browser work remains connected to the correct prompts.

## Run locally

From the repository root:

```sh
ruby -run -e httpd . -p 8019
```

Open `http://127.0.0.1:8019/interview-direction-lab/`.

Run the browser tests at `http://127.0.0.1:8019/interview-direction-lab/tests.html`.

## Accessibility and privacy

- semantic headings, fieldsets, legends, labels, status messages, and navigation;
- keyboard-operable controls and visible focus;
- responsive layouts and reduced-motion support;
- descriptive alternative text for the fictional teaching images;
- no required fields, scoring, ranking, or automated judgment;
- no network requests except the local editable JSON and bundled teaching images;
- reset requires confirmation before deleting locally saved work.

The fictional community-choir scenario is a structural teaching example, not documentary evidence.
