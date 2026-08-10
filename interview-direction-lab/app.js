(function () {
  "use strict";
  var STORAGE_KEY = "doc515-interview-direction-lab-v1";
  var core = window.DOC515InterviewLabCore;
  var data;
  var state;
  var saveTimer;

  var els = {
    builder: document.getElementById("builder"),
    error: document.getElementById("load-error"),
    stepList: document.getElementById("step-list"),
    stepCount: document.getElementById("step-count"),
    stepTitle: document.getElementById("step-title"),
    stepIntro: document.getElementById("step-introduction"),
    fields: document.getElementById("fields"),
    previous: document.getElementById("previous-step"),
    next: document.getElementById("next-step"),
    save: document.getElementById("save-status"),
    exampleToggle: document.getElementById("example-toggle"),
    teacher: document.getElementById("teacher-example"),
    example: document.getElementById("example-content"),
    summary: document.getElementById("summary"),
    preview: document.getElementById("plan-preview"),
    copy: document.getElementById("copy-plan"),
    download: document.getElementById("download-plan"),
    print: document.getElementById("print-plan"),
    reset: document.getElementById("reset-activity")
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function loadSaved() {
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)); }
    catch (error) { return null; }
  }

  function saveNow() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      els.save.textContent = "Saved locally";
    } catch (error) {
      els.save.textContent = "Local saving unavailable";
    }
  }

  function scheduleSave() {
    els.save.textContent = "Saving…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 300);
  }

  function textField(field) {
    var value = state.answers[field.id] || "";
    var describedBy = field.id + "-help" + (field.caution ? " " + field.id + "-caution" : "");
    var control = field.type === "input"
      ? '<input id="' + field.id + '" name="' + field.id + '" type="text" value="' + escapeHtml(value) + '" aria-describedby="' + describedBy + '">'
      : '<textarea id="' + field.id + '" name="' + field.id + '" aria-describedby="' + describedBy + '">' + escapeHtml(value) + "</textarea>";
    return '<div class="field" data-size="' + escapeHtml(field.size || "long") + '"><label for="' + field.id + '">' + escapeHtml(field.label) + '</label><p class="definition" id="' + field.id + '-help">' + escapeHtml(field.help) + "</p>" + (field.caution ? '<p class="caution" id="' + field.id + '-caution"><strong>Watch for:</strong> ' + escapeHtml(field.caution) + "</p>" : "") + control + "</div>";
  }

  function radioField(field) {
    return '<fieldset class="field choice-field"><legend>' + escapeHtml(field.label) + '</legend><p class="definition" id="' + field.id + '-help">' + escapeHtml(field.help) + '</p><div class="choice-grid">' + field.options.map(function (option) {
      var checked = state.answers[field.id] === option.value ? " checked" : "";
      return '<label class="choice-card"><input type="radio" name="' + field.id + '" value="' + escapeHtml(option.value) + '" aria-describedby="' + field.id + '-help"' + checked + '><span><strong>' + escapeHtml(option.label) + "</strong><small>" + escapeHtml(option.description) + "</small></span></label>";
    }).join("") + "</div></fieldset>";
  }

  function checkboxField(field) {
    var selected = state.answers[field.id] || [];
    return '<fieldset class="field checklist-field"><legend>' + escapeHtml(field.label) + '</legend><p class="definition" id="' + field.id + '-help">' + escapeHtml(field.help) + '</p><div class="checklist">' + field.options.map(function (option) {
      var checked = selected.includes(option.value) ? " checked" : "";
      return '<label><input type="checkbox" name="' + field.id + '" value="' + escapeHtml(option.value) + '" aria-describedby="' + field.id + '-help"' + checked + '><span>' + escapeHtml(option.label) + "</span></label>";
    }).join("") + "</div></fieldset>";
  }

  function fieldHtml(field) {
    if (field.type === "radio") return radioField(field);
    if (field.type === "checkboxes") return checkboxField(field);
    return textField(field);
  }

  function renderNav() {
    els.stepList.innerHTML = data.steps.map(function (step, index) {
      return '<li><button type="button" data-step="' + index + '"' + (index === state.currentStep ? ' aria-current="step"' : "") + '><span>' + (index + 1) + '</span>' + escapeHtml(step.shortTitle) + "</button></li>";
    }).join("");
    els.stepList.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () { goTo(Number(button.dataset.step)); });
    });
  }

  function bindFields(step) {
    step.fields.forEach(function (field) {
      var controls = els.fields.querySelectorAll('[name="' + field.id + '"]');
      controls.forEach(function (control) {
        control.addEventListener("input", function () {
          if (field.type === "checkboxes") {
            state.answers[field.id] = Array.from(controls).filter(function (item) { return item.checked; }).map(function (item) { return item.value; });
          } else {
            state.answers[field.id] = control.value;
          }
          scheduleSave();
          renderSummary();
        });
      });
    });
  }

  function renderExample(step) {
    els.teacher.hidden = !state.exampleMode;
    els.exampleToggle.setAttribute("aria-pressed", String(state.exampleMode));
    els.exampleToggle.textContent = "Choir example: " + (state.exampleMode ? "on" : "off");
    if (!state.exampleMode) return;
    var values = step.fields.map(function (field) {
      var value = data.teacherExample[field.id];
      if (Array.isArray(value)) value = value.join("; ");
      return value ? '<dt>' + escapeHtml(field.label) + '</dt><dd>' + escapeHtml(value) + "</dd>" : "";
    }).join("");
    els.example.innerHTML = "<dl>" + values + "</dl>";
  }

  function renderSummary() {
    els.preview.innerHTML = data.steps.map(function (step) {
      var fields = step.fields.map(function (field) {
        return '<div><h4>' + escapeHtml(field.label) + '</h4><p>' + escapeHtml(core.displayValue(field, state.answers[field.id])).replaceAll("\n", "<br>") + "</p></div>";
      }).join("");
      return '<section><h3>' + escapeHtml(step.title) + "</h3>" + fields + "</section>";
    }).join("");
    els.summary.hidden = false;
  }

  function render() {
    var step = data.steps[state.currentStep];
    renderNav();
    els.stepCount.textContent = "Section " + (state.currentStep + 1) + " of " + data.steps.length;
    els.stepTitle.textContent = step.title;
    els.stepIntro.textContent = step.introduction;
    els.fields.innerHTML = step.fields.map(fieldHtml).join("");
    bindFields(step);
    els.previous.disabled = state.currentStep === 0;
    els.next.textContent = state.currentStep === data.steps.length - 1 ? "Review interview plan ↓" : "Next section →";
    renderExample(step);
    renderSummary();
  }

  function goTo(index) {
    state.currentStep = Math.max(0, Math.min(index, data.steps.length - 1));
    saveNow();
    render();
    els.stepTitle.focus();
    window.scrollTo({ top: els.builder.offsetTop - 12, behavior: "smooth" });
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(core.buildPlan(data, state.answers));
      els.save.textContent = "Plan copied";
    } catch (error) {
      els.save.textContent = "Copy unavailable; use download instead";
    }
  }

  function downloadPlan() {
    var url = URL.createObjectURL(new Blob([core.buildPlan(data, state.answers)], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "interview-direction-plan.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function initialize() {
    try {
      var response = await fetch("data/interview-lab-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Content request failed: " + response.status);
      data = await response.json();
      state = core.normalizeState(data, loadSaved());
      els.builder.hidden = false;
      render();

      els.previous.addEventListener("click", function () { goTo(state.currentStep - 1); });
      els.next.addEventListener("click", function () {
        if (state.currentStep === data.steps.length - 1) els.summary.scrollIntoView({ behavior: "smooth" });
        else goTo(state.currentStep + 1);
      });
      els.exampleToggle.addEventListener("click", function () {
        state.exampleMode = !state.exampleMode;
        saveNow();
        renderExample(data.steps[state.currentStep]);
      });
      els.copy.addEventListener("click", copyPlan);
      els.download.addEventListener("click", downloadPlan);
      els.print.addEventListener("click", function () { window.print(); });
      els.reset.addEventListener("click", function () {
        if (!window.confirm("Delete all writing saved by this activity in this browser? This cannot be undone.")) return;
        window.localStorage.removeItem(STORAGE_KEY);
        state = core.createState(data);
        render();
        saveNow();
        els.save.textContent = "Work reset and deleted";
      });
    } catch (error) {
      els.error.hidden = false;
      els.error.innerHTML = "<h2>Unable to load the activity</h2><p>Run this folder through a local web server and confirm that the editable JSON file is available.</p>";
    }
  }

  initialize();
})();
