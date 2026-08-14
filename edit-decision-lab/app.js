(function () {
  "use strict";

  var DATA_URL = "data/edit-lab-data.json";
  var STORAGE_KEY = "doc515-edit-decision-lab-v1";
  var data;
  var state;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (error) { return null; }
  }

  function setStatus(message) { byId("save-status").textContent = message; }

  function saveState(message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStatus(message || "Saved locally");
    } catch (error) {
      setStatus("Progress cannot be saved on this device");
    }
  }

  function renderNavigation() {
    byId("step-list").innerHTML = data.navigation.map(function (item, index) {
      return '<li><button type="button" data-step="' + index + '"' + (state.currentStep === index ? ' aria-current="step"' : "") + '><span>' + (index + 1) + '</span>' + escapeHtml(item.label) + '</button></li>';
    }).join("");
    data.navigation.forEach(function (item, index) { byId(item.id + "-panel").hidden = index !== state.currentStep; });
    byId("previous-step").disabled = state.currentStep === 0;
    byId("next-step").disabled = state.currentStep === data.navigation.length - 1;
  }

  function goToStep(index, announce) {
    state.currentStep = Math.max(0, Math.min(index, data.navigation.length - 1));
    renderNavigation();
    saveState(announce || "Part " + (state.currentStep + 1) + " opened");
    var heading = byId(data.navigation[state.currentStep].id + "-title");
    if (heading) { heading.focus(); heading.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  function renderChecklist() {
    byId("media-checklist").innerHTML = data.mediaChecklist.map(function (item) {
      return '<label class="check-item"><input type="checkbox" data-check="' + escapeHtml(item.id) + '"' + (state.checklist[item.id] ? " checked" : "") + '><span>' + escapeHtml(item.label) + '</span></label>';
    }).join("");
  }

  function renderPrinciples() {
    byId("principle-controls").innerHTML = data.principles.map(function (item) {
      return '<button type="button" data-principle="' + escapeHtml(item.id) + '" aria-pressed="' + (state.selectedPrinciple === item.id) + '">' + escapeHtml(item.title) + '</button>';
    }).join("");
    var selected = data.principles.find(function (item) { return item.id === state.selectedPrinciple; }) || data.principles[0];
    byId("principle-detail").innerHTML = '<h4>' + escapeHtml(selected.title) + '</h4><p>' + escapeHtml(selected.text) + '</p>';
  }

  function renderExampleFrame() {
    byId("example-frame").innerHTML = '<h3>' + escapeHtml(data.example.title) + '</h3><p><strong>Story question:</strong> ' + escapeHtml(data.example.question) + '</p><p><em>' + escapeHtml(data.example.disclosure) + '</em></p>';
  }

  function functionOptions(selected) {
    return data.clipFunctions.map(function (item) { return '<option value="' + escapeHtml(item.value) + '"' + (selected === item.value ? " selected" : "") + '>' + escapeHtml(item.label) + '</option>'; }).join("");
  }

  function renderClips() {
    byId("clip-list").innerHTML = data.example.clips.map(function (clip) {
      var clipState = state.clips.find(function (item) { return item.id === clip.id; });
      return '<article class="clip-card' + (clipState.included ? "" : " excluded") + '"><header><h3>' + escapeHtml(clip.label) + '</h3><span class="timecode">' + escapeHtml(clip.timecode) + '</span></header><p>' + escapeHtml(clip.description) + '</p><p class="clip-sound"><strong>Sound:</strong> ' + escapeHtml(clip.sound) + '</p><label class="include-control"><input type="checkbox" data-include="' + escapeHtml(clip.id) + '"' + (clipState.included ? " checked" : "") + '> Include in the working scene</label><div class="field"><label for="function-' + escapeHtml(clip.id) + '">Possible function</label><select id="function-' + escapeHtml(clip.id) + '" data-clip-function="' + escapeHtml(clip.id) + '">' + functionOptions(clipState.function) + '</select></div><div class="field"><label for="note-' + escapeHtml(clip.id) + '">Editor note</label><textarea id="note-' + escapeHtml(clip.id) + '" data-clip-note="' + escapeHtml(clip.id) + '" placeholder="What does this material reveal, connect, or complicate?">' + escapeHtml(clipState.note) + '</textarea></div></article>';
    }).join("");
  }

  function orderButtons(id, index, length) {
    return '<div class="move-controls"><button type="button" data-move-id="' + escapeHtml(id) + '" data-direction="-1"' + (index === 0 ? " disabled" : "") + '>← Earlier</button><button type="button" data-move-id="' + escapeHtml(id) + '" data-direction="1"' + (index === length - 1 ? " disabled" : "") + '>Later →</button></div>';
  }

  function renderSceneOrder() {
    var includedIds = state.sceneOrder.filter(function (id) {
      var item = state.clips.find(function (clip) { return clip.id === id; });
      return item && item.included;
    });
    var cards = includedIds.map(function (id, index) {
      var clip = data.example.clips.find(function (item) { return item.id === id; });
      var clipState = state.clips.find(function (item) { return item.id === id; });
      return '<article class="order-card"><div class="order-number">' + (index + 1) + '</div><div><h3>' + escapeHtml(clip.label) + '</h3><p>' + escapeHtml(clip.description) + '</p><p><strong>Function:</strong> ' + escapeHtml(clipState.function || "Not yet chosen") + '</p></div>' + orderButtons(id, index, includedIds.length) + '</article>';
    }).join("");
    byId("scene-order").innerHTML = cards || '<p class="narrative-feedback">No clips are currently included. Return to Part 2 and select the material the scene needs.</p>';
    byId("scene-feedback").textContent = window.EditLabCore.sceneFeedback(data, state);
  }

  function renderRoughCut() {
    byId("rough-cut-order").innerHTML = state.roughCutOrder.map(function (id, index) {
      var scene = data.example.roughCutScenes.find(function (item) { return item.id === id; });
      return '<article class="order-card"><div class="order-number">' + (index + 1) + '</div><div><h3>' + escapeHtml(scene.title) + '</h3><p>' + escapeHtml(scene.summary) + '</p></div><div class="move-controls"><button type="button" data-rough-id="' + escapeHtml(id) + '" data-direction="-1"' + (index === 0 ? " disabled" : "") + '>← Earlier</button><button type="button" data-rough-id="' + escapeHtml(id) + '" data-direction="1"' + (index === state.roughCutOrder.length - 1 ? " disabled" : "") + '>Later →</button></div></article>';
    }).join("");
  }

  function renderFields(containerId, fields, values, attribute) {
    byId(containerId).innerHTML = fields.map(function (field) {
      return '<div class="field"><label for="' + attribute + '-' + escapeHtml(field.id) + '">' + escapeHtml(field.label) + '</label><textarea id="' + attribute + '-' + escapeHtml(field.id) + '" data-' + attribute + '="' + escapeHtml(field.id) + '">' + escapeHtml(values[field.id]) + '</textarea></div>';
    }).join("");
  }

  function updateMemo() { byId("memo-preview").textContent = window.EditLabCore.buildExport(data, state); }

  function renderAll() {
    renderNavigation();
    renderChecklist();
    renderPrinciples();
    renderExampleFrame();
    renderClips();
    renderSceneOrder();
    renderRoughCut();
    renderFields("gap-form", data.gapFields, state.gaps, "gap");
    renderFields("reflection-form", data.reflectionPrompts, state.reflections, "reflection");
    updateMemo();
  }

  function handleChange(event) {
    var target = event.target;
    if (target.matches("[data-check]")) state.checklist[target.dataset.check] = target.checked;
    if (target.matches("[data-include]")) {
      window.EditLabCore.setClipIncluded(state, target.dataset.include, target.checked);
      renderClips(); renderSceneOrder();
    }
    if (target.matches("[data-clip-function]")) {
      state.clips.find(function (item) { return item.id === target.dataset.clipFunction; }).function = target.value;
      renderSceneOrder();
    }
    saveState(); updateMemo();
  }

  function handleInput(event) {
    var target = event.target;
    if (target.matches("[data-clip-note]")) state.clips.find(function (item) { return item.id === target.dataset.clipNote; }).note = target.value;
    if (target.matches("[data-gap]")) state.gaps[target.dataset.gap] = target.value;
    if (target.matches("[data-reflection]")) state.reflections[target.dataset.reflection] = target.value;
    saveState(); updateMemo();
  }

  function handleClick(event) {
    var button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.step != null) goToStep(Number(button.dataset.step));
    if (button.dataset.principle) { state.selectedPrinciple = button.dataset.principle; renderPrinciples(); saveState(); }
    if (button.dataset.moveId) { state.sceneOrder = window.EditLabCore.move(state.sceneOrder, button.dataset.moveId, Number(button.dataset.direction)); renderSceneOrder(); saveState("Scene order updated"); updateMemo(); }
    if (button.dataset.roughId) { state.roughCutOrder = window.EditLabCore.move(state.roughCutOrder, button.dataset.roughId, Number(button.dataset.direction)); renderRoughCut(); saveState("Rough-cut order updated"); updateMemo(); }
  }

  async function copyMemo() {
    var text = window.EditLabCore.buildExport(data, state);
    try { await navigator.clipboard.writeText(text); setStatus("Edit memo copied"); }
    catch (error) {
      var range = document.createRange(); range.selectNodeContents(byId("memo-preview"));
      var selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      setStatus("Memo selected — use the browser's copy command");
    }
  }

  function downloadMemo() {
    var blob = new Blob([window.EditLabCore.buildExport(data, state)], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob); var link = document.createElement("a");
    link.href = url; link.download = "DOC-515-edit-decision-memo.txt"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setStatus("Edit memo downloaded");
  }

  function resetActivity() {
    if (!window.confirm("Delete all locally saved work for this activity? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE_KEY); state = window.EditLabCore.createState(data); renderAll(); setStatus("Saved work deleted"); goToStep(0, "Activity reset");
  }

  function bindEvents() {
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
    document.addEventListener("click", handleClick);
    byId("previous-step").addEventListener("click", function () { goToStep(state.currentStep - 1); });
    byId("next-step").addEventListener("click", function () { goToStep(state.currentStep + 1); });
    byId("copy-memo").addEventListener("click", copyMemo);
    byId("download-memo").addEventListener("click", downloadMemo);
    byId("print-memo").addEventListener("click", function () { window.print(); });
    byId("reset-activity").addEventListener("click", resetActivity);
  }

  fetch(DATA_URL).then(function (response) {
    if (!response.ok) throw new Error("The activity content could not be loaded.");
    return response.json();
  }).then(function (loaded) {
    data = loaded; state = window.EditLabCore.normalizeState(data, readSaved());
    renderAll(); bindEvents(); byId("lab").hidden = false; setStatus(readSaved() ? "Saved progress restored" : "Ready");
  }).catch(function (error) {
    byId("load-error").hidden = false;
    byId("load-error").textContent = "The Edit Decision Lab could not load its editable content. Open the activity through the course website or a local web server, then try again.";
  });
})();
