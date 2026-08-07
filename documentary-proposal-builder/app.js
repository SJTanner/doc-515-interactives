(function () {
  "use strict";
  const STORAGE_KEY = "doc515-documentary-proposal-builder-v1";
  const core = window.DOC515ProposalCore;
  const els = {
    builder: document.getElementById("builder"), error: document.getElementById("load-error"), stepList: document.getElementById("step-list"), stepCount: document.getElementById("step-count"), stepTitle: document.getElementById("step-title"), stepIntro: document.getElementById("step-introduction"), fields: document.getElementById("fields"), form: document.getElementById("proposal-form"), previous: document.getElementById("previous-step"), next: document.getElementById("next-step"), save: document.getElementById("save-status"), teacherToggle: document.getElementById("teacher-toggle"), teacher: document.getElementById("teacher-example"), example: document.getElementById("example-content"), summary: document.getElementById("summary"), preview: document.getElementById("proposal-preview"), reset: document.getElementById("reset-activity"), copyProposal: document.getElementById("copy-proposal"), downloadProposal: document.getElementById("download-proposal"), copyQuestions: document.getElementById("copy-questions"), downloadQuestions: document.getElementById("download-questions"), print: document.getElementById("print-summary")
  };
  let data, state, saveTimer;
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function loadSaved() { try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)); } catch (error) { return null; } }
  function saveNow() { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); els.save.textContent = "Saved locally"; } catch (error) { els.save.textContent = "Local saving unavailable"; } }
  function scheduleSave() { els.save.textContent = "Saving…"; window.clearTimeout(saveTimer); saveTimer = window.setTimeout(saveNow, 350); }
  function fieldHtml(field) {
    const describedBy = `${field.id}-help${field.caution ? ` ${field.id}-caution` : ""}`;
    let control;
    if (field.type === "select") control = `<select id="${field.id}" name="${field.id}" aria-describedby="${describedBy}"><option value="">Choose an access status</option>${field.options.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;
    else if (field.type === "input") control = `<input id="${field.id}" name="${field.id}" type="text" value="${escapeHtml(state.answers[field.id])}" aria-describedby="${describedBy}">`;
    else control = `<textarea id="${field.id}" name="${field.id}" aria-describedby="${describedBy}">${escapeHtml(state.answers[field.id])}</textarea>`;
    return `<div class="field" data-size="${field.size || "long"}"><label for="${field.id}">${escapeHtml(field.label)}</label><p class="definition" id="${field.id}-help">${escapeHtml(field.help)}</p>${field.caution ? `<p class="caution" id="${field.id}-caution">Watch for: ${escapeHtml(field.caution)}</p>` : ""}${control}</div>`;
  }
  function renderNav() { els.stepList.innerHTML = data.steps.map((step, i) => `<li><button type="button" data-step="${i}" ${i === state.currentStep ? 'aria-current="step"' : ""}>${i + 1}. ${escapeHtml(step.shortTitle)}</button></li>`).join(""); els.stepList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => goTo(Number(button.dataset.step)))); }
  function renderExample(step) { const values = step.fields.map((field) => { const value = data.teacherExample[field.id]; return value ? `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(value)}</dd>` : ""; }).join(""); els.example.innerHTML = `<dl>${values || "<p>No model is provided for this section.</p>"}</dl>`; els.teacher.hidden = !state.teacherMode; els.teacherToggle.setAttribute("aria-pressed", String(state.teacherMode)); els.teacherToggle.textContent = `Teacher example: ${state.teacherMode ? "on" : "off"}`; }
  function renderSummary() {
    const proposal = core.buildProposal(data, state.answers);
    const blocks = proposal.split("\n\n").slice(1).map((block) => { const [heading, ...body] = block.split("\n"); return `<section><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body.join("\n")) || "Not yet entered."}</p></section>`; }).join("");
    els.preview.innerHTML = blocks;
    els.summary.hidden = false;
  }
  function render() {
    const step = data.steps[state.currentStep]; renderNav(); els.stepCount.textContent = `Section ${state.currentStep + 1} of ${data.steps.length}`; els.stepTitle.textContent = step.title; els.stepIntro.textContent = step.introduction; els.fields.innerHTML = step.fields.map(fieldHtml).join("");
    step.fields.forEach((field) => { const control = document.getElementById(field.id); if (field.type === "select") control.value = state.answers[field.id] || ""; control.addEventListener("input", () => { state.answers[field.id] = control.value; scheduleSave(); renderSummary(); }); control.addEventListener("change", () => { state.answers[field.id] = control.value; scheduleSave(); renderSummary(); }); });
    els.previous.disabled = state.currentStep === 0; els.next.textContent = state.currentStep === data.steps.length - 1 ? "Review development pack ↓" : "Next section →"; renderExample(step); renderSummary();
  }
  function goTo(index) { state.currentStep = Math.max(0, Math.min(index, data.steps.length - 1)); saveNow(); render(); document.getElementById("step-title").focus?.(); window.scrollTo({ top: els.builder.offsetTop - 16, behavior: "smooth" }); }
  async function copyText(text, message) { try { await navigator.clipboard.writeText(text); els.save.textContent = message; } catch (error) { els.save.textContent = "Copy unavailable; use download instead"; } }
  function download(text, name) { const url = URL.createObjectURL(new Blob([text], { type:"text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  async function initialize() {
    try {
      const response = await fetch("data/proposal-builder-data.json", { cache:"no-store" }); if (!response.ok) throw new Error(`Content request failed: ${response.status}`); data = await response.json(); state = core.normalizeState(data, loadSaved());
      els.builder.hidden = false; render();
      els.previous.addEventListener("click", () => goTo(state.currentStep - 1)); els.next.addEventListener("click", () => { if (state.currentStep === data.steps.length - 1) els.summary.scrollIntoView({ behavior:"smooth" }); else goTo(state.currentStep + 1); });
      els.teacherToggle.addEventListener("click", () => { state.teacherMode = !state.teacherMode; saveNow(); renderExample(data.steps[state.currentStep]); });
      els.copyProposal.addEventListener("click", () => copyText(core.buildProposal(data, state.answers), "Proposal copied")); els.downloadProposal.addEventListener("click", () => download(core.buildProposal(data, state.answers), "documentary-proposal.txt"));
      els.copyQuestions.addEventListener("click", () => copyText(core.buildQuestions(data, state.answers), "Development questions copied")); els.downloadQuestions.addEventListener("click", () => download(core.buildQuestions(data, state.answers), "development-questions.txt")); els.print.addEventListener("click", () => window.print());
      els.reset.addEventListener("click", () => { if (!window.confirm("Delete all writing saved by this activity in this browser? This cannot be undone.")) return; window.localStorage.removeItem(STORAGE_KEY); state = core.createState(data); render(); saveNow(); els.save.textContent = "Work reset and deleted"; });
    } catch (error) { els.error.hidden = false; els.error.innerHTML = "<h2>Unable to load the activity</h2><p>Run this folder through a local web server and confirm that the editable JSON file is available.</p>"; }
  }
  initialize();
})();
