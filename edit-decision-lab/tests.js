(function () {
  "use strict";
  var results = document.getElementById("results");
  function report(name, passed, detail) {
    var item = document.createElement("li"); item.className = passed ? "pass" : "fail";
    item.textContent = (passed ? "PASS — " : "FAIL — ") + name + (detail ? ": " + detail : ""); results.appendChild(item);
  }
  function assert(name, condition, detail) { report(name, Boolean(condition), condition ? "" : detail); }

  fetch("data/edit-lab-data.json").then(function (response) { return response.json(); }).then(function (data) {
    var Core = window.EditLabCore;
    assert("Data contains five navigation stages", data.navigation.length === 5, "unexpected navigation length");
    assert("Example provides enough material for editing choices", data.example.clips.length >= 8, "fewer than eight clips");

    var state = Core.createState(data);
    assert("Initial state includes every checklist item", Object.keys(state.checklist).length === data.mediaChecklist.length, "checklist mismatch");
    assert("Initial scene order is independent from source data", state.sceneOrder !== data.example.sceneOrder && state.sceneOrder.length === data.example.sceneOrder.length, "order was not copied");

    var moved = Core.move(state.sceneOrder, state.sceneOrder[0], 1);
    assert("Move changes order without mutating the original", moved[1] === state.sceneOrder[0] && moved[0] !== state.sceneOrder[0], "move failed");
    assert("Boundary move leaves order unchanged", Core.move(state.sceneOrder, state.sceneOrder[0], -1).join("|") === state.sceneOrder.join("|"), "boundary changed");

    Core.setClipIncluded(state, "shore-dawn", false);
    assert("Clip inclusion can be revised", state.clips.find(function (clip) { return clip.id === "shore-dawn"; }).included === false, "clip remained included");

    var saved = JSON.parse(JSON.stringify(state)); saved.currentStep = 99; saved.sceneOrder.push("invalid-id");
    var normalized = Core.normalizeState(data, saved);
    assert("Saved state clamps stage and removes invalid IDs", normalized.currentStep === 4 && !normalized.sceneOrder.includes("invalid-id"), "normalization failed");

    var feedback = Core.sceneFeedback(data, Core.createState(data));
    assert("Scene feedback is narrative rather than numeric", feedback.length > 40 && !/\b\d+\s*(%|points?)\b/i.test(feedback), "score-like feedback found");

    normalized.gaps.missingEvidence = "A volunteer reaction after the weather change.";
    normalized.reflections.nextRevision = "Shorten the opening and preserve the safety decision in real time.";
    var exported = Core.buildExport(data, normalized);
    assert("Export contains student gap and revision writing", exported.includes("A volunteer reaction") && exported.includes("Shorten the opening"), "writing missing from export");
    assert("Export renumbers included selects sequentially", exported.includes("1. Mara arrives") && !exported.includes("2. Mara arrives"), "select numbering has a gap");
    assert("Export explicitly avoids scoring", /not a score/i.test(exported) && !/grade:\s*\d/i.test(exported), "scoring language problem");

    localStorage.setItem("doc515-edit-decision-lab-test", JSON.stringify(normalized));
    var restored = JSON.parse(localStorage.getItem("doc515-edit-decision-lab-test"));
    localStorage.removeItem("doc515-edit-decision-lab-test");
    assert("Local persistence round trip works", restored.reflections.nextRevision === normalized.reflections.nextRevision, "localStorage mismatch");
  }).catch(function (error) { report("Test setup", false, error.message); });
})();
