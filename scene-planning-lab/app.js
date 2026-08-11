(function () {
  "use strict";

  var STORAGE_KEY = "doc515-scene-planning-lab-v1";
  var core = window.DOC515ScenePlanningCore;
  var data;
  var state;
  var saveTimer;
  var panels = ["essentials-panel", "example-panel", "scenes-panel", "interviews-panel", "sequence-panel"];

  var els = {
    lab: document.getElementById("lab"), error: document.getElementById("load-error"), save: document.getElementById("save-status"), stepList: document.getElementById("step-list"),
    essentials: document.getElementById("essential-controls"), essentialDetail: document.getElementById("essential-detail"), tests: document.getElementById("test-controls"), testFeedback: document.getElementById("test-feedback"),
    exampleFrame: document.getElementById("example-frame"), exampleScenes: document.getElementById("example-scenes"), exampleFeedback: document.getElementById("example-order-feedback"),
    sceneForm: document.getElementById("scene-form"), sceneFields: document.getElementById("scene-fields"), addScene: document.getElementById("add-scene"), sceneCount: document.getElementById("scene-count-status"),
    interviewForm: document.getElementById("interview-form"), interviewSummary: document.getElementById("scene-interview-summary"), sequence: document.getElementById("student-sequence"), reflectionForm: document.getElementById("reflection-form"),
    preview: document.getElementById("preview-content"), previous: document.getElementById("previous-step"), next: document.getElementById("next-step"), copy: document.getElementById("copy-plan"), download: document.getElementById("download-plan"), print: document.getElementById("print-plan"), reset: document.getElementById("reset-activity")
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function withBreaks(value, fallback) {
    return escapeHtml(String(value || "").trim() || fallback || "Not yet drafted").replaceAll("\n", "<br>");
  }

  function loadSaved() {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)); } catch (error) { return null; }
  }

  function saveNow(message) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      els.save.textContent = message || "Saved locally";
    } catch (error) { els.save.textContent = "Local saving unavailable"; }
  }

  function scheduleSave() {
    els.save.textContent = "Saving…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () { saveNow(); }, 300);
  }

  function sceneById(id) {
    return state.scenes.find(function (scene) { return scene.id === id; });
  }

  function exampleById(id) {
    return data.example.scenes.find(function (scene) { return scene.id === id; });
  }

  function renderNav() {
    els.stepList.innerHTML = data.navigation.map(function (item, index) {
      return '<li><button type="button" data-step="' + index + '"' + (index === state.currentStep ? ' aria-current="step"' : "") + '><span>' + (index + 1) + "</span>" + escapeHtml(item) + "</button></li>";
    }).join("");
    els.stepList.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { goTo(Number(button.dataset.step)); });
    });
  }

  function renderEssentials() {
    els.essentials.innerHTML = data.sceneEssentials.map(function (item, index) {
      return '<button type="button" data-essential="' + item.id + '" aria-pressed="' + (item.id === state.selectedEssential) + '"><span>0' + (index + 1) + '</span><strong>' + escapeHtml(item.label) + "</strong></button>";
    }).join("");
    els.essentials.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { state.selectedEssential = button.dataset.essential; saveNow(); renderEssentials(); });
    });
    var selected = data.sceneEssentials.find(function (item) { return item.id === state.selectedEssential; });
    els.essentialDetail.innerHTML = '<p class="eyebrow">Ask this</p><h3>' + escapeHtml(selected.question) + "</h3><p>" + escapeHtml(selected.explanation) + "</p>";

    els.tests.innerHTML = data.sceneTests.map(function (item) {
      return '<button type="button" data-test="' + item.id + '" aria-pressed="' + (item.id === state.selectedExampleTest) + '">' + escapeHtml(item.label) + "</button>";
    }).join("");
    els.tests.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { state.selectedExampleTest = button.dataset.test; saveNow(); renderEssentials(); });
    });
    var test = data.sceneTests.find(function (item) { return item.id === state.selectedExampleTest; });
    els.testFeedback.innerHTML = "<strong>" + escapeHtml(test.status) + ".</strong> " + escapeHtml(test.explanation);
  }

  function moveExample(id, direction) {
    state.exampleOrder = core.move(state.exampleOrder, id, direction);
    saveNow(); renderExample();
  }

  function renderExample() {
    els.exampleFrame.innerHTML = "<div><dt>Subject</dt><dd>" + escapeHtml(data.example.subject) + "</dd></div><div><dt>Central contributor</dt><dd>" + escapeHtml(data.example.contributor) + "</dd></div><div><dt>Story question</dt><dd>" + escapeHtml(data.example.storyQuestion) + "</dd></div>";
    els.exampleScenes.innerHTML = state.exampleOrder.map(function (id, index) {
      var scene = exampleById(id);
      return '<article class="example-card"><img src="' + escapeHtml(scene.image) + '" alt="' + escapeHtml(scene.alt) + '"><div class="example-copy"><p class="position">Scene position ' + (index + 1) + "</p><h3>" + escapeHtml(scene.title) + "</h3><p>" + escapeHtml(scene.summary) + "</p><dl><dt>Story role</dt><dd>" + escapeHtml(scene.role) + "</dd><dt>Plot point</dt><dd>" + escapeHtml(scene.turn) + "</dd><dt>Interview</dt><dd>" + escapeHtml(scene.interview) + '</dd></dl><div class="move-controls"><button type="button" data-example-id="' + scene.id + '" data-direction="-1"' + (index === 0 ? " disabled" : "") + '>← Earlier</button><button type="button" data-example-id="' + scene.id + '" data-direction="1"' + (index === state.exampleOrder.length - 1 ? " disabled" : "") + ">Later →</button></div></div></article>";
    }).join("");
    els.exampleScenes.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { moveExample(button.dataset.exampleId, Number(button.dataset.direction)); });
    });
    var canonical = state.exampleOrder.join("|") === data.example.canonicalOrder.join("|");
    els.exampleFeedback.textContent = canonical
      ? "This order establishes Nia, the mission, and the deadline; blocks the expected route; escalates the reroute; and ends with a consequential handoff."
      : "This order creates a different viewing experience. Ask what the audience now knows first, where uncertainty enters, and whether consequence arrives before its cause.";
  }

  function sceneFieldsHtml(scene, index) {
    var prefix = scene.id;
    var roleOptions = ['<option value="">Choose a story role</option>'].concat(data.sceneRoles.map(function (role) {
      return '<option value="' + escapeHtml(role) + '"' + (scene.role === role ? " selected" : "") + ">" + escapeHtml(role) + "</option>";
    })).join("");
    var modeOptions = data.interviewModes.map(function (mode) {
      return '<option value="' + mode.value + '"' + (scene.interviewMode === mode.value ? " selected" : "") + ">" + escapeHtml(mode.label) + "</option>";
    }).join("");
    function field(name, label, help, tall) {
      return '<div class="field"><label for="' + prefix + "-" + name + '">' + escapeHtml(label) + '</label><p id="' + prefix + "-" + name + '-help">' + escapeHtml(help) + '</p><textarea id="' + prefix + "-" + name + '" data-scene-id="' + prefix + '" data-scene-field="' + name + '" aria-describedby="' + prefix + "-" + name + '-help"' + (tall ? ' class="tall"' : "") + ">" + escapeHtml(scene[name]) + "</textarea></div>";
    }
    return '<fieldset class="scene-planner"><legend><span>Scene ' + (index + 1) + "</span>" + escapeHtml(scene.title || "Untitled scene") + '</legend><button class="remove-scene" type="button" data-remove-scene="' + prefix + '"' + (state.scenes.length === 1 ? " disabled" : "") + '>Remove scene</button><div class="scene-grid">' + field("title", "Scene title", "Name the event, not only the topic or location.") + '<div class="field"><label for="' + prefix + '-role">Story role</label><p id="' + prefix + '-role-help">Why does the film need this scene?</p><select id="' + prefix + '-role" data-scene-id="' + prefix + '" data-scene-field="role" aria-describedby="' + prefix + '-role-help">' + roleOptions + "</select></div>" + field("action", "Present-time action", "What will happen that the audience can witness?", true) + field("place", "Specific place and time", "Where, when, and under what conditions will you film?") + field("contributor", "Contributor in the scene", "Who is present, and what do they want or need?") + field("tension", "Pressure, decision, or change", "What could shift, fail, be learned, or be decided?", true) + field("evidence", "Visual and sound evidence", "What images, behavior, objects, reactions, voices, and location sound will tell us what is happening?", true) + '<div class="field"><label for="' + prefix + '-interview-mode">Interview mode</label><p id="' + prefix + '-interview-mode-help">Will an interview be part of this scene?</p><select id="' + prefix + '-interview-mode" data-scene-id="' + prefix + '" data-scene-field="interviewMode" aria-describedby="' + prefix + '-interview-mode-help">' + modeOptions + "</select></div>" + field("interviewPlan", "Interview placement", "What will you ask, where, and why? Leave blank if no interview is needed.", true) + "</div></fieldset>";
  }

  function renderProjectValues() {
    document.querySelectorAll("[data-project]").forEach(function (control) { control.value = state.project[control.dataset.project] || ""; });
  }

  function renderSceneFields(message) {
    els.sceneFields.innerHTML = state.scenes.map(sceneFieldsHtml).join("");
    els.addScene.disabled = state.scenes.length >= 8;
    els.sceneCount.textContent = message || state.scenes.length + " scene" + (state.scenes.length === 1 ? "" : "s") + " planned. Maximum: 8.";
    renderSequence(); renderInterviewSummary(); renderPreview();
  }

  function renderInterviewValues() {
    document.querySelectorAll("[data-interview]").forEach(function (control) { control.value = state.interviews[control.dataset.interview] || ""; });
  }

  function interviewLabel(value) {
    var match = data.interviewModes.find(function (mode) { return mode.value === value; });
    return match ? match.label : "No interview in this scene";
  }

  function renderInterviewSummary() {
    els.interviewSummary.innerHTML = state.scenes.map(function (scene, index) {
      return '<article><p class="position">Scene ' + (index + 1) + "</p><h4>" + escapeHtml(scene.title || "Untitled scene") + "</h4><p><strong>" + escapeHtml(interviewLabel(scene.interviewMode)) + ":</strong> " + withBreaks(scene.interviewPlan, "Placement not yet drafted") + "</p></article>";
    }).join("");
  }

  function moveStudentScene(id, direction) {
    state.sequenceOrder = core.move(state.sequenceOrder, id, direction);
    saveNow(); renderSequence(); renderPreview();
  }

  function renderSequence() {
    els.sequence.innerHTML = state.sequenceOrder.map(function (id, index) {
      var scene = sceneById(id);
      if (!scene) return "";
      return '<article class="sequence-card"><div class="sequence-number">' + (index + 1) + '</div><div><p class="position">Story position ' + (index + 1) + "</p><h3>" + escapeHtml(scene.title || "Untitled scene") + "</h3><p>" + withBreaks(scene.action, "Present-time action not yet drafted") + '</p><p class="sequence-role"><strong>Story role:</strong> ' + escapeHtml(scene.role || "Not yet chosen") + '</p></div><div class="move-controls"><button type="button" data-sequence-id="' + id + '" data-direction="-1"' + (index === 0 ? " disabled" : "") + '>← Earlier</button><button type="button" data-sequence-id="' + id + '" data-direction="1"' + (index === state.sequenceOrder.length - 1 ? " disabled" : "") + ">Later →</button></div></article>";
    }).join("");
    els.sequence.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { moveStudentScene(button.dataset.sequenceId, Number(button.dataset.direction)); });
    });
  }

  function renderReflections() {
    els.reflectionForm.innerHTML = data.reflectionPrompts.map(function (prompt) {
      return '<div class="field"><label for="reflection-' + prompt.id + '">' + escapeHtml(prompt.label) + '</label><textarea id="reflection-' + prompt.id + '" data-reflection="' + prompt.id + '">' + escapeHtml(state.reflections[prompt.id] || "") + "</textarea></div>";
    }).join("");
  }

  function renderPreview() {
    var orderedScenes = state.sequenceOrder.map(sceneById).filter(Boolean);
    els.preview.innerHTML = '<section><h4>Project</h4><dl><dt>Subject</dt><dd>' + withBreaks(state.project.subject) + "</dd><dt>Central contributor</dt><dd>" + withBreaks(state.project.contributor) + "</dd><dt>Story question</dt><dd>" + withBreaks(state.project.storyQuestion) + "</dd><dt>Stakes or possible change</dt><dd>" + withBreaks(state.project.stakes) + "</dd></dl></section><section><h4>Scene sequence</h4>" + orderedScenes.map(function (scene, index) {
      return '<article><h5>' + (index + 1) + ". " + escapeHtml(scene.title || "Untitled scene") + "</h5><p>" + withBreaks(scene.action) + '</p><p><strong>Story role:</strong> ' + escapeHtml(scene.role || "Not yet chosen") + '</p><p><strong>Interview:</strong> ' + escapeHtml(interviewLabel(scene.interviewMode)) + " — " + withBreaks(scene.interviewPlan, "Placement not yet drafted") + "</p></article>";
    }).join("") + '</section><section><h4>Interview plan</h4><p><strong>Static:</strong> ' + withBreaks(state.interviews.staticWhat) + " · <strong>Where:</strong> " + withBreaks(state.interviews.staticWhere) + "</p><p><strong>Dynamic:</strong> " + withBreaks(state.interviews.dynamicWhat) + " · <strong>Where/action:</strong> " + withBreaks(state.interviews.dynamicWhere) + "</p></section><section><h4>Sequence reflection</h4>" + data.reflectionPrompts.map(function (prompt) { return "<h5>" + escapeHtml(prompt.label) + "</h5><p>" + withBreaks(state.reflections[prompt.id]) + "</p>"; }).join("") + "</section>";
  }

  function renderPanels() {
    panels.forEach(function (id, index) { document.getElementById(id).hidden = index !== state.currentStep; });
    els.previous.disabled = state.currentStep === 0;
    els.next.textContent = state.currentStep === panels.length - 1 ? "Return to start ↺" : "Next part →";
  }

  function goTo(index) {
    state.currentStep = Math.max(0, Math.min(index, panels.length - 1));
    saveNow(); renderNav(); renderPanels();
    var panel = document.getElementById(panels[state.currentStep]);
    panel.querySelector("h2").focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copyPlan() {
    try { await navigator.clipboard.writeText(core.buildExport(data, state)); els.save.textContent = "Plan copied"; }
    catch (error) { els.save.textContent = "Copy unavailable; use download instead"; }
  }

  function downloadPlan() {
    var url = URL.createObjectURL(new Blob([core.buildExport(data, state)], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a"); link.href = url; link.download = "scene-planning-lab.txt";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    els.save.textContent = "Text plan downloaded";
  }

  function bindForms() {
    document.querySelectorAll("[data-project]").forEach(function (control) {
      control.addEventListener("input", function () { state.project[control.dataset.project] = control.value; scheduleSave(); renderPreview(); });
    });
    els.sceneFields.addEventListener("input", function (event) {
      var control = event.target.closest("[data-scene-field]"); if (!control) return;
      var scene = sceneById(control.dataset.sceneId); if (!scene) return;
      scene[control.dataset.sceneField] = control.value; scheduleSave();
      if (control.dataset.sceneField === "title") control.closest("fieldset").querySelector("legend").lastChild.textContent = control.value || "Untitled scene";
      renderSequence(); renderInterviewSummary(); renderPreview();
    });
    els.sceneFields.addEventListener("change", function (event) {
      var control = event.target.closest("[data-scene-field]"); if (!control) return;
      var scene = sceneById(control.dataset.sceneId); if (!scene) return;
      scene[control.dataset.sceneField] = control.value; saveNow(); renderSequence(); renderInterviewSummary(); renderPreview();
    });
    els.sceneFields.addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-scene]"); if (!button) return;
      core.removeScene(state, button.dataset.removeScene); saveNow("Scene removed and saved"); renderSceneFields();
    });
    document.querySelectorAll("[data-interview]").forEach(function (control) {
      control.addEventListener("input", function () { state.interviews[control.dataset.interview] = control.value; scheduleSave(); renderPreview(); });
    });
    els.reflectionForm.addEventListener("input", function (event) {
      var control = event.target.closest("[data-reflection]"); if (!control) return;
      state.reflections[control.dataset.reflection] = control.value; scheduleSave(); renderPreview();
    });
  }

  function renderAll() {
    renderNav(); renderEssentials(); renderExample(); renderProjectValues(); renderSceneFields(); renderInterviewValues(); renderReflections(); renderSequence(); renderInterviewSummary(); renderPreview(); renderPanels();
  }

  async function initialize() {
    try {
      var response = await fetch("data/scene-planning-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Content request failed: " + response.status);
      data = await response.json(); state = core.normalizeState(data, loadSaved());
      els.lab.hidden = false; renderAll(); bindForms();
      els.addScene.addEventListener("click", function () { core.addScene(state); saveNow("Scene added and saved"); renderSceneFields("A new scene was added. " + state.scenes.length + " scenes planned."); });
      els.previous.addEventListener("click", function () { goTo(state.currentStep - 1); });
      els.next.addEventListener("click", function () { goTo(state.currentStep === panels.length - 1 ? 0 : state.currentStep + 1); });
      els.copy.addEventListener("click", copyPlan); els.download.addEventListener("click", downloadPlan); els.print.addEventListener("click", function () { window.print(); });
      els.reset.addEventListener("click", function () {
        if (!window.confirm("Delete all writing and choices saved by this activity in this browser? This cannot be undone.")) return;
        window.localStorage.removeItem(STORAGE_KEY); state = core.createState(data); renderAll(); renderProjectValues(); renderInterviewValues(); saveNow("Work reset and deleted");
      });
    } catch (error) {
      els.error.hidden = false;
      els.error.innerHTML = "<h2>Unable to load the activity</h2><p>Run this folder through a local web server and confirm that <code>data/scene-planning-data.json</code> is available.</p>";
    }
  }

  initialize();
})();
