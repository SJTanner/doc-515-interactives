(function () {
  "use strict";
  var STORAGE_KEY = "doc515-scene-story-lab-v1";
  var core = window.DOC515SceneStoryCore;
  var data;
  var state;
  var saveTimer;

  var panels = ["learn-panel", "anatomy-panel", "story-panel", "plan-panel", "reflection-panel"];
  var els = {
    lab: document.getElementById("lab"), error: document.getElementById("load-error"), save: document.getElementById("save-status"),
    stepList: document.getElementById("step-list"), scale: document.getElementById("scale-explorer"), scaleDetail: document.getElementById("scale-detail"),
    anatomyControls: document.getElementById("anatomy-controls"), anatomyDetail: document.getElementById("anatomy-detail"), anatomyStatus: document.getElementById("anatomy-status"),
    scenes: document.getElementById("story-scenes"), orderFeedback: document.getElementById("order-feedback"), sceneTest: document.getElementById("scene-test-list"),
    fields: document.getElementById("fields"), preview: document.getElementById("plan-preview"), previous: document.getElementById("previous-step"), next: document.getElementById("next-step"),
    copy: document.getElementById("copy-plan"), download: document.getElementById("download-plan"), print: document.getElementById("print-plan"), reset: document.getElementById("reset-activity")
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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

  function renderNav() {
    els.stepList.innerHTML = data.navigation.map(function (item, index) {
      return '<li><button type="button" data-step="' + index + '"' + (index === state.currentStep ? ' aria-current="step"' : "") + '><span>' + (index + 1) + "</span>" + escapeHtml(item) + "</button></li>";
    }).join("");
    els.stepList.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { goTo(Number(button.dataset.step)); });
    });
  }

  function renderScale() {
    els.scale.innerHTML = data.scale.map(function (item, index) {
      return '<button type="button" data-scale="' + item.id + '"' + (state.scale === item.id ? ' aria-pressed="true"' : ' aria-pressed="false"') + '><span class="scale-number">0' + (index + 1) + '</span><strong>' + escapeHtml(item.label) + '</strong><small>' + escapeHtml(item.short) + "</small></button>";
    }).join('<span class="scale-arrow" aria-hidden="true">→</span>');
    els.scale.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { state.scale = button.dataset.scale; saveNow(); renderScale(); });
    });
    var selected = data.scale.find(function (item) { return item.id === state.scale; });
    els.scaleDetail.innerHTML = '<p class="eyebrow">' + escapeHtml(selected.label) + '</p><h3>' + escapeHtml(selected.definition) + '</h3><p>' + escapeHtml(selected.example) + '</p><p class="key-question"><strong>Key question:</strong> ' + escapeHtml(selected.question) + "</p>";
  }

  function renderAnatomy() {
    els.anatomyControls.innerHTML = data.example.anatomy.map(function (item) {
      var open = state.revealed.includes(item.id);
      return '<button type="button" data-anatomy="' + item.id + '" aria-pressed="' + open + '"><span>' + escapeHtml(item.label) + '</span><small>' + (open ? "Revealed" : "Reveal") + "</small></button>";
    }).join("");
    els.anatomyControls.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        var id = button.dataset.anatomy;
        if (!state.revealed.includes(id)) state.revealed.push(id);
        var item = data.example.anatomy.find(function (entry) { return entry.id === id; });
        els.anatomyDetail.innerHTML = '<p class="eyebrow">' + escapeHtml(item.label) + '</p><h3>' + escapeHtml(item.question) + '</h3><p>' + escapeHtml(item.answer) + "</p>";
        saveNow(); renderAnatomyControlsOnly();
      });
    });
    renderAnatomyControlsOnly();
  }

  function renderAnatomyControlsOnly() {
    els.anatomyControls.querySelectorAll("button").forEach(function (button) {
      var open = state.revealed.includes(button.dataset.anatomy);
      button.setAttribute("aria-pressed", String(open));
      button.querySelector("small").textContent = open ? "Revealed" : "Reveal";
    });
    els.anatomyStatus.textContent = state.revealed.length === data.example.anatomy.length
      ? "Together, these elements create movement: a prepared broadcast becomes a problem that requires a decision. That change is the scene’s story work."
      : "Reveal each element. Notice that camera coverage alone does not create a scene.";
  }

  function moveScene(id, direction) {
    var index = state.sceneOrder.indexOf(id);
    var target = index + direction;
    if (target < 0 || target >= state.sceneOrder.length) return;
    var next = state.sceneOrder.slice();
    next[index] = next[target]; next[target] = id; state.sceneOrder = next;
    saveNow(); renderStory();
  }

  function renderStory() {
    els.scenes.innerHTML = state.sceneOrder.map(function (id, index) {
      var scene = data.example.scenes.find(function (item) { return item.id === id; });
      return '<article class="scene-card"><img src="' + escapeHtml(scene.image) + '" alt="' + escapeHtml(scene.alt) + '"><div class="scene-copy"><p class="scene-position">Story position ' + (index + 1) + '</p><h3>' + escapeHtml(scene.shortTitle) + '</h3><p>' + escapeHtml(scene.summary) + '</p><dl><dt>Scene turn</dt><dd>' + escapeHtml(scene.turn) + '</dd><dt>Story work</dt><dd>' + escapeHtml(scene.storyWork) + '</dd></dl><div class="move-controls" aria-label="Move ' + escapeHtml(scene.shortTitle) + '"><button type="button" data-id="' + id + '" data-direction="-1"' + (index === 0 ? " disabled" : "") + '>← Earlier</button><button type="button" data-id="' + id + '" data-direction="1"' + (index === state.sceneOrder.length - 1 ? " disabled" : "") + ">Later →</button></div></div></article>";
    }).join("");
    els.scenes.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { moveScene(button.dataset.id, Number(button.dataset.direction)); });
    });
    els.orderFeedback.textContent = core.orderMessage(data, state.sceneOrder);
    els.sceneTest.innerHTML = data.sceneTest.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("");
  }

  function fieldHtml(field) {
    var value = state.answers[field.id] || "";
    return '<div class="field"><label for="' + field.id + '">' + escapeHtml(field.label) + '</label><p id="' + field.id + '-help">' + escapeHtml(field.help) + '</p><textarea id="' + field.id + '" name="' + field.id + '" aria-describedby="' + field.id + '-help">' + escapeHtml(value) + "</textarea></div>";
  }

  function renderFields() {
    els.fields.innerHTML = data.planSections.map(function (section) {
      return '<fieldset class="plan-section"><legend><span>' + escapeHtml(section.kicker) + "</span>" + escapeHtml(section.title) + '</legend><p class="section-intro">' + escapeHtml(section.introduction) + "</p>" + section.fields.map(fieldHtml).join("") + "</fieldset>";
    }).join("");
    els.fields.querySelectorAll("textarea").forEach(function (control) {
      control.addEventListener("input", function () { state.answers[control.name] = control.value; scheduleSave(); renderSummary(); });
    });
  }

  function renderSummary() {
    els.preview.innerHTML = data.planSections.map(function (section) {
      return '<section><h3>' + escapeHtml(section.title) + "</h3>" + section.fields.map(function (field) {
        var value = state.answers[field.id] || "Not yet drafted";
        return '<div><h4>' + escapeHtml(field.label) + '</h4><p>' + escapeHtml(value).replaceAll("\n", "<br>") + "</p></div>";
      }).join("") + "</section>";
    }).join("");
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
    try { await navigator.clipboard.writeText(core.buildPlan(data, state.answers)); els.save.textContent = "Plan copied"; }
    catch (error) { els.save.textContent = "Copy unavailable; use download instead"; }
  }

  function downloadPlan() {
    var url = URL.createObjectURL(new Blob([core.buildPlan(data, state.answers)], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a"); link.href = url; link.download = "scene-to-story-plan.txt";
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    els.save.textContent = "Text plan downloaded";
  }

  async function initialize() {
    try {
      var response = await fetch("data/scene-story-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Content request failed: " + response.status);
      data = await response.json(); state = core.normalizeState(data, loadSaved());
      els.lab.hidden = false; renderNav(); renderScale(); renderAnatomy(); renderStory(); renderFields(); renderSummary(); renderPanels();
      els.previous.addEventListener("click", function () { goTo(state.currentStep - 1); });
      els.next.addEventListener("click", function () { goTo(state.currentStep === panels.length - 1 ? 0 : state.currentStep + 1); });
      els.copy.addEventListener("click", copyPlan); els.download.addEventListener("click", downloadPlan); els.print.addEventListener("click", function () { window.print(); });
      els.reset.addEventListener("click", function () {
        if (!window.confirm("Delete all writing and choices saved by this activity in this browser? This cannot be undone.")) return;
        window.localStorage.removeItem(STORAGE_KEY); state = core.createState(data); renderNav(); renderScale(); renderAnatomy(); renderStory(); renderFields(); renderSummary(); renderPanels(); saveNow("Work reset and deleted");
      });
    } catch (error) {
      els.error.hidden = false;
      els.error.innerHTML = "<h2>Unable to load the activity</h2><p>Run this folder through a local web server and confirm that <code>data/scene-story-data.json</code> is available.</p>";
    }
  }

  initialize();
})();
