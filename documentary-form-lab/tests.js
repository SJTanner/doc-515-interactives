(async function () {
  "use strict";

  const results = document.getElementById("results");
  const summary = document.getElementById("summary");
  let failures = 0;

  function test(name, condition, details = "") {
    const item = document.createElement("li");
    item.className = condition ? "pass" : "fail";
    item.textContent = `${condition ? "PASS" : "FAIL"}: ${name}${details ? ` — ${details}` : ""}`;
    results.appendChild(item);
    if (!condition) failures += 1;
  }

  try {
    const response = await fetch("data/form-lab-data.json", { cache: "no-store" });
    test("Editable JSON loads", response.ok, `HTTP ${response.status}`);
    const content = await response.json();
    const ids = content.forms.map((form) => form.id);
    test("Six required documentary forms are present", ids.length === 6);
    test("Community-garden story assets are present", content.storyWorld.assetGroups.length === 3 && content.storyWorld.assetGroups.every((group) => group.items.length > 0));

    const initial = window.DocFormCore.createInitialState(ids);
    test("Initial state creates one treatment per form", Object.keys(initial.treatments).length === 6);
    test("Reset state is empty", ids.every((id) => window.DocFormCore.treatmentStatus(initial.treatments[id]) === "Not started"));

    const moved = window.DocFormCore.moveItem(["a", "b", "c"], 2, 0);
    test("Keyboard ordering helper changes item order", moved.join(",") === "c,a,b");

    initial.treatments[ids[0]] = {
      ingredients: ["final-weekend", "gardeners-work"],
      sceneStrategy: "Sustained action",
      filmmakerPresence: "Present but not foregrounded",
      evidence: "Observed behavior",
      imageSound: "Work rhythms and location sound",
      ethicalPressure: "Access and representation"
    };
    test("Treatment changes reach Drafted state", window.DocFormCore.treatmentStatus(initial.treatments[ids[0]]) === "Drafted");

    const storageKey = "doc515-form-lab-test";
    window.localStorage.setItem(storageKey, JSON.stringify(initial));
    const restored = window.DocFormCore.normalizeState(JSON.parse(window.localStorage.getItem(storageKey)), ids);
    test("Local persistence restores treatment choices", restored.treatments[ids[0]].ingredients[0] === "final-weekend");
    window.localStorage.removeItem(storageKey);
    test("Saved test data can be deleted", window.localStorage.getItem(storageKey) === null);

    const exportText = window.DocFormCore.buildSummary(content, restored);
    test("Plain-text export contains the course and treatment", exportText.includes("DOC 515") && exportText.includes("Sustained action"));
    test("Export contains no numerical score label", !/\b(score|points?|grade)\s*[:=]\s*\d/i.test(exportText));
  } catch (error) {
    test("Test suite completed", false, error.message);
  }

  summary.textContent = failures ? `${failures} check${failures === 1 ? "" : "s"} failed.` : "All automated checks passed.";
  summary.className = failures ? "fail" : "pass";
})();
