(function () {
  "use strict";

  const STORAGE_KEY = "doc515-documentary-form-lab-v1";
  const app = document.getElementById("app");
  const statusRegion = document.getElementById("status-region");
  const privacyStatement = document.getElementById("privacy-statement");
  const clearProgressButton = document.getElementById("clear-progress");
  const teacherToggle = document.getElementById("teacher-toggle");
  const Core = window.DocFormCore;

  let content;
  let state;
  let storageAvailable = true;
  let draggedIngredientIndex = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formIds() {
    return content.forms.map((form) => form.id);
  }

  function testStorage() {
    try {
      const key = `${STORAGE_KEY}-test`;
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadState() {
    state = Core.createInitialState(formIds());
    storageAvailable = testStorage();
    if (!storageAvailable) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) state = Core.normalizeState(JSON.parse(saved), formIds());
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveState(announceSave) {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (announceSave) announce(content.ui.saveMessage);
    } catch (error) {
      storageAvailable = false;
      announce(content.ui.storageUnavailable);
    }
  }

  function announce(message) {
    statusRegion.textContent = "";
    window.requestAnimationFrame(() => {
      statusRegion.textContent = message;
    });
  }

  function setStage(index, options = {}) {
    state.stageIndex = Math.max(0, Math.min(index, content.stages.length - 1));
    state.maxStage = Math.max(state.maxStage, state.stageIndex);
    saveState();
    render({ focusHeading: options.focusHeading !== false });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function buttonRow(previous, nextLabel, nextAction, extra = "") {
    return `
      <div class="button-row">
        ${previous === null ? "" : `<button class="button secondary" type="button" data-action="go-stage" data-stage="${previous}">${escapeHtml(content.ui.back)}</button>`}
        ${extra}
        ${nextAction ? `<button class="button" type="${nextAction === "submit" ? "submit" : "button"}"${nextAction === "submit" ? "" : ` data-action="${nextAction}"`}>${escapeHtml(nextLabel)}</button>` : ""}
      </div>`;
  }

  function progressMarkup() {
    return `
      <nav class="stage-progress" aria-label="Lab stages">
        <ol>
          ${content.stages.map((stage, index) => {
            const current = index === state.stageIndex;
            const reached = index <= state.maxStage;
            const className = current ? "is-current" : index < state.stageIndex || index < state.maxStage ? "is-complete" : "";
            return `<li class="${className}"${current ? ' aria-current="step"' : ""}>${reached && !current ? `<button type="button" data-action="go-stage" data-stage="${index}" aria-label="Return to ${escapeHtml(stage.long)}">${escapeHtml(stage.short)}</button>` : `<span aria-label="${escapeHtml(stage.long)}">${escapeHtml(stage.short)}</span>`}</li>`;
          }).join("")}
        </ol>
      </nav>`;
  }

  function teacherMarkup(extra = "") {
    if (!state.teacherMode) return "";
    return `
      <aside class="teacher-notes" aria-labelledby="teacher-heading">
        <p class="eyebrow">Local teaching support</p>
        <h2 id="teacher-heading">${escapeHtml(content.teacherSupport.heading)}</h2>
        <p>${escapeHtml(content.teacherSupport.intro)}</p>
        <ul>${content.teacherSupport.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
        ${extra}
      </aside>`;
  }

  function render(options = {}) {
    const stage = content.stages[state.stageIndex].id;
    let markup = "";
    if (stage === "intro") markup = renderIntro();
    if (stage === "forms") markup = renderForms();
    if (stage === "story") markup = renderStoryWorld();
    if (stage === "build") markup = renderBuilder();
    if (stage === "compare") markup = renderComparison();
    if (stage === "own") markup = renderOwnProject();
    if (stage === "summary") markup = renderSummary();

    app.innerHTML = progressMarkup() + markup;
    app.setAttribute("aria-busy", "false");
    bindSharedActions();
    if (stage === "build") bindBuilder();
    if (stage === "compare") bindComparison();
    if (stage === "own") bindOwnProject();
    if (stage === "summary") bindSummary();

    if (options.focusHeading) {
      const heading = app.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }

  function renderIntro() {
    return `
      <article class="panel intro-panel">
        <div class="intro-grid">
          <div>
            <p class="eyebrow">${escapeHtml(content.introduction.eyebrow)}</p>
            <h1>${escapeHtml(content.introduction.heading)}</h1>
            <p class="lead">${escapeHtml(content.introduction.lead)}</p>
            ${content.introduction.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </div>
          <figure>
            <img src="${escapeHtml(content.storyWorld.image)}" alt="${escapeHtml(content.storyWorld.alt)}">
            <figcaption>${escapeHtml(content.introduction.disclosure)}</figcaption>
          </figure>
        </div>
        <h2>What you will do</h2>
        <ol class="instruction-list">${content.introduction.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        ${buttonRow(null, content.introduction.button, "begin")}
        ${teacherMarkup()}
      </article>`;
  }

  function renderForms() {
    return `
      <article class="panel">
        <p class="eyebrow">Working vocabulary</p>
        <h1>${escapeHtml(content.formsIntro.heading)}</h1>
        <p class="lead">${escapeHtml(content.formsIntro.lead)}</p>
        <div class="form-definition-grid">
          ${content.forms.map((form) => `
            <section class="form-definition">
              <h2>${escapeHtml(form.title)}</h2>
              <p class="definition">${escapeHtml(form.definition)}</p>
              <h3>Look for</h3>
              <ul>${form.lookFor.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <p class="key-question">${escapeHtml(form.question)}</p>
            </section>`).join("")}
        </div>
        <blockquote>${escapeHtml(content.formsIntro.hybridNote)}</blockquote>
        ${buttonRow(0, content.ui.continue, "continue-story")}
        ${teacherMarkup()}
      </article>`;
  }

  function renderStoryWorld() {
    return `
      <article class="panel">
        <p class="eyebrow">A shared story world</p>
        <h1>${escapeHtml(content.storyWorld.heading)}</h1>
        <div class="story-grid">
          <div>
            <h2>${escapeHtml(content.storyWorld.title)}</h2>
            <p class="lead">${escapeHtml(content.storyWorld.summary)}</p>
            <div class="stays-changes">
              <section>
                <h3>What stays</h3>
                <ul>${content.storyWorld.stays.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </section>
              <section>
                <h3>What changes</h3>
                <ul>${content.storyWorld.changes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </section>
            </div>
          </div>
          <figure>
            <img src="${escapeHtml(content.storyWorld.contactSheet)}" alt="${escapeHtml(content.storyWorld.contactSheetAlt)}">
            <figcaption>${escapeHtml(content.introduction.disclosure)}</figcaption>
          </figure>
        </div>
        <h2>Available story material</h2>
        <div class="asset-overview">
          ${content.storyWorld.assetGroups.map((group) => `<section><h3>${escapeHtml(group.title)}</h3><ul>${group.items.map((item) => `<li>${escapeHtml(item.text)}</li>`).join("")}</ul></section>`).join("")}
        </div>
        ${buttonRow(1, content.ui.continue, "continue-build")}
        ${teacherMarkup()}
      </article>`;
  }

  function activeForm() {
    return content.forms.find((form) => form.id === state.activeFormId) || content.forms[0];
  }

  function ingredientById(id) {
    for (const group of content.storyWorld.assetGroups) {
      const item = group.items.find((candidate) => candidate.id === id);
      if (item) return { group: group.title, item };
    }
    return null;
  }

  function renderBuilder() {
    const form = activeForm();
    const treatment = state.treatments[form.id];
    const selected = new Set(treatment.ingredients);
    const model = state.teacherMode ? `
      <div class="model-example">
        <h3>Model combination for discussion</h3>
        <p><strong>Treatment:</strong> ${escapeHtml(form.model.treatment)}</p>
        <p><strong>Camera:</strong> ${escapeHtml(form.model.camera)}</p>
        <p><strong>Story pressure:</strong> ${escapeHtml(form.model.pressure)}</p>
        <p>${escapeHtml(content.builder.teacherNote)}</p>
      </div>` : "";

    return `
      <article class="panel">
        <p class="eyebrow">One story, six possible films</p>
        <h1>${escapeHtml(content.builder.heading)}</h1>
        <p class="lead">${escapeHtml(content.builder.lead)}</p>
        <div class="form-switcher" role="group" aria-label="Choose a form treatment to edit">
          ${content.forms.map((item) => {
            const status = Core.treatmentStatus(state.treatments[item.id]);
            return `<button type="button" class="form-switch ${item.id === form.id ? "is-active" : ""}" data-form-id="${escapeHtml(item.id)}" aria-pressed="${item.id === form.id}"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(status)}</small></button>`;
          }).join("")}
        </div>

        <section class="treatment-editor" aria-labelledby="treatment-title">
          <div class="treatment-heading">
            <div>
              <p class="eyebrow">Current treatment</p>
              <h2 id="treatment-title" tabindex="-1">${escapeHtml(form.title)}</h2>
              <p>${escapeHtml(form.definition)}</p>
            </div>
            <blockquote>${escapeHtml(form.question)}</blockquote>
          </div>

          <div class="builder-grid">
            <section>
              <h3>${escapeHtml(content.builder.ingredientHeading)}</h3>
              ${content.storyWorld.assetGroups.map((group) => `
                <div class="ingredient-group">
                  <h4>${escapeHtml(group.title)}</h4>
                  <ul class="ingredient-list">
                    ${group.items.map((item) => `<li><span>${escapeHtml(item.text)}</span><button class="small-button" type="button" data-action="add-ingredient" data-ingredient-id="${escapeHtml(item.id)}"${selected.has(item.id) ? " disabled" : ""}>${selected.has(item.id) ? "Added" : "Add to Treatment"}</button></li>`).join("")}
                  </ul>
                </div>`).join("")}
            </section>
            <section>
              <h3>${escapeHtml(content.builder.trayHeading)}</h3>
              ${treatment.ingredients.length ? `
                <ol class="treatment-tray" aria-label="Ordered treatment material">
                  ${treatment.ingredients.map((id, index) => {
                    const ingredient = ingredientById(id);
                    return `<li draggable="true" data-ingredient-index="${index}"><span class="drag-label"><strong>${index + 1}.</strong> ${escapeHtml(ingredient?.item.text || id)} <small>${escapeHtml(ingredient?.group || "")}</small></span><span class="item-actions"><button type="button" class="icon-button" data-action="move-up" data-index="${index}" aria-label="Move ${escapeHtml(ingredient?.item.text || id)} up"${index === 0 ? " disabled" : ""}>↑</button><button type="button" class="icon-button" data-action="move-down" data-index="${index}" aria-label="Move ${escapeHtml(ingredient?.item.text || id)} down"${index === treatment.ingredients.length - 1 ? " disabled" : ""}>↓</button><button type="button" class="small-button danger" data-action="remove-ingredient" data-index="${index}">Remove</button></span></li>`;
                  }).join("")}
                </ol>` : `<p class="empty-state">${escapeHtml(content.builder.emptyTray)}</p>`}
              <p class="help-text">Drag items to reorder, or use the Move Up and Move Down buttons.</p>
            </section>
          </div>

          <form id="treatment-form">
            <div class="field-grid">
              ${content.builder.fields.map((field) => `<label class="field"><span>${escapeHtml(field.label)}</span><small>${escapeHtml(field.prompt)}</small><textarea name="${escapeHtml(field.id)}" rows="3">${escapeHtml(treatment[field.id])}</textarea></label>`).join("")}
            </div>
          </form>
          ${model}
        </section>
        <p id="builder-validation" class="validation" role="alert" tabindex="-1" hidden></p>
        ${buttonRow(2, "Compare Two Treatments", "validate-builder")}
        ${teacherMarkup()}
      </article>`;
  }

  function treatmentSummary(formId) {
    const form = content.forms.find((item) => item.id === formId);
    const treatment = state.treatments[formId];
    const ingredients = treatment.ingredients.map((id) => ingredientById(id)?.item.text || id);
    return `
      <section class="comparison-treatment">
        <h2>${escapeHtml(form?.title || "Choose a form")}</h2>
        <p>${escapeHtml(form?.definition || "")}</p>
        <dl>
          <div><dt>Story material</dt><dd>${escapeHtml(ingredients.join(" · ") || "Not yet entered")}</dd></div>
          <div><dt>Scene strategy</dt><dd>${escapeHtml(treatment.sceneStrategy || "Not yet entered")}</dd></div>
          <div><dt>Filmmaker presence</dt><dd>${escapeHtml(treatment.filmmakerPresence || "Not yet entered")}</dd></div>
          <div><dt>Evidence</dt><dd>${escapeHtml(treatment.evidence || "Not yet entered")}</dd></div>
          <div><dt>Image and sound</dt><dd>${escapeHtml(treatment.imageSound || "Not yet entered")}</dd></div>
          <div><dt>Ethical pressure</dt><dd>${escapeHtml(treatment.ethicalPressure || "Not yet entered")}</dd></div>
        </dl>
      </section>`;
  }

  function formOptions(selectedId) {
    return content.forms.map((form) => `<option value="${escapeHtml(form.id)}"${form.id === selectedId ? " selected" : ""}>${escapeHtml(form.title)}</option>`).join("");
  }

  function renderComparison() {
    return `
      <article class="panel">
        <p class="eyebrow">What stays—and what changes?</p>
        <h1>${escapeHtml(content.comparison.heading)}</h1>
        <p class="lead">${escapeHtml(content.comparison.lead)}</p>
        <form id="comparison-form" novalidate>
          <div class="comparison-selects">
            <label><span>First treatment</span><select name="leftForm">${formOptions(state.comparison.leftForm)}</select></label>
            <label><span>Second treatment</span><select name="rightForm">${formOptions(state.comparison.rightForm)}</select></label>
          </div>
          <div class="comparison-grid" aria-live="polite">
            ${treatmentSummary(state.comparison.leftForm)}
            ${treatmentSummary(state.comparison.rightForm)}
          </div>
          <div class="field-grid comparison-prompts">
            ${content.comparison.prompts.map((prompt) => `<label class="field"><span>${escapeHtml(prompt.label)}</span><small>${escapeHtml(prompt.text)}</small><textarea name="${escapeHtml(prompt.id)}" rows="4">${escapeHtml(state.comparison[prompt.id])}</textarea></label>`).join("")}
          </div>
          <p id="comparison-validation" class="validation" role="alert" tabindex="-1" hidden></p>
          ${buttonRow(3, "Test Your Own Documentary", "submit")}
        </form>
        ${teacherMarkup()}
      </article>`;
  }

  function renderOwnProject() {
    return `
      <article class="panel">
        <p class="eyebrow">Apply the learning</p>
        <h1>${escapeHtml(content.ownProject.heading)}</h1>
        <p class="lead">${escapeHtml(content.ownProject.lead)}</p>
        <form id="own-project-form" novalidate>
          <div class="field-grid">
            ${content.ownProject.fields.map((field) => `<label class="field"><span>${escapeHtml(field.label)}</span><small>${escapeHtml(field.prompt)}</small>${field.id === "workingTitle" ? `<input type="text" name="${escapeHtml(field.id)}" value="${escapeHtml(state.ownProject[field.id])}">` : `<textarea name="${escapeHtml(field.id)}" rows="4">${escapeHtml(state.ownProject[field.id])}</textarea>`}</label>`).join("")}
          </div>
          <div class="own-forms">
            <label><span>First form to test</span><select name="firstForm">${formOptions(state.ownProject.firstForm)}</select></label>
            <label><span>Second form to test</span><select name="secondForm">${formOptions(state.ownProject.secondForm)}</select></label>
          </div>
          <div class="field-grid">
            ${content.ownProject.formPrompts.map((prompt) => `<label class="field"><span>${escapeHtml(prompt.label)}</span><textarea name="${escapeHtml(prompt.id)}" rows="4">${escapeHtml(state.ownProject[prompt.id])}</textarea></label>`).join("")}
          </div>
          <p id="own-validation" class="validation" role="alert" tabindex="-1" hidden></p>
          ${buttonRow(4, "Make a Provisional Form Statement", "submit")}
        </form>
        ${teacherMarkup()}
      </article>`;
  }

  function renderSummary() {
    const summary = Core.buildSummary(content, state);
    return `
      <article class="panel summary-panel">
        <p class="eyebrow">Reflection and export</p>
        <h1>${escapeHtml(content.reflection.heading)}</h1>
        <p class="lead">${escapeHtml(content.reflection.lead)}</p>
        <form id="reflection-form" novalidate>
          <label class="field"><span>Provisional dominant form</span><select name="provisionalForm">${formOptions(state.reflection.provisionalForm)}</select></label>
          <div class="field-grid">
            ${content.reflection.prompts.map((prompt) => `<label class="field"><span>${escapeHtml(prompt.label)}</span><textarea name="${escapeHtml(prompt.id)}" rows="4">${escapeHtml(state.reflection[prompt.id])}</textarea></label>`).join("")}
          </div>
          <p id="reflection-validation" class="validation" role="alert" tabindex="-1" hidden></p>
        </form>
        <section class="export-section" aria-labelledby="export-heading">
          <h2 id="export-heading">Your Form Lab Summary</h2>
          <p>This non-scored summary is yours to revise, copy, download, print, or submit separately if your instructor requests it.</p>
          <pre id="summary-text" tabindex="0">${escapeHtml(summary)}</pre>
          <div class="button-row export-actions">
            <button class="button" type="button" data-action="copy-summary">${escapeHtml(content.ui.copy)}</button>
            <button class="button secondary" type="button" data-action="download-summary">${escapeHtml(content.ui.download)}</button>
            <button class="button secondary" type="button" data-action="print-summary">${escapeHtml(content.ui.print)}</button>
          </div>
        </section>
        <div class="button-row">
          <button class="button secondary" type="button" data-action="go-stage" data-stage="5">${escapeHtml(content.ui.revise)}</button>
          <button class="text-button danger-text" type="button" data-action="restart">${escapeHtml(content.ui.restart)}</button>
        </div>
        ${teacherMarkup()}
      </article>`;
  }

  function bindSharedActions() {
    app.querySelectorAll('[data-action="go-stage"]').forEach((button) => button.addEventListener("click", () => setStage(Number(button.dataset.stage))));
    app.querySelector('[data-action="begin"]')?.addEventListener("click", () => setStage(1));
    app.querySelector('[data-action="continue-story"]')?.addEventListener("click", () => setStage(2));
    app.querySelector('[data-action="continue-build"]')?.addEventListener("click", () => setStage(3));
  }

  function updateTreatmentField(field) {
    state.treatments[state.activeFormId][field.name] = field.value;
    saveState(true);
  }

  function bindBuilder() {
    app.querySelectorAll("[data-form-id]").forEach((button) => button.addEventListener("click", () => {
      state.activeFormId = button.dataset.formId;
      saveState();
      render({ focusHeading: false });
      document.getElementById("treatment-title")?.focus();
    }));

    app.querySelectorAll('[data-action="add-ingredient"]').forEach((button) => button.addEventListener("click", () => {
      const list = state.treatments[state.activeFormId].ingredients;
      if (!list.includes(button.dataset.ingredientId)) list.push(button.dataset.ingredientId);
      saveState(true);
      render({ focusHeading: false });
    }));

    app.querySelectorAll('[data-action="remove-ingredient"]').forEach((button) => button.addEventListener("click", () => {
      state.treatments[state.activeFormId].ingredients.splice(Number(button.dataset.index), 1);
      saveState(true);
      render({ focusHeading: false });
    }));

    app.querySelectorAll('[data-action="move-up"], [data-action="move-down"]').forEach((button) => button.addEventListener("click", () => {
      const from = Number(button.dataset.index);
      const to = button.dataset.action === "move-up" ? from - 1 : from + 1;
      const list = state.treatments[state.activeFormId].ingredients;
      state.treatments[state.activeFormId].ingredients = Core.moveItem(list, from, to);
      saveState(true);
      render({ focusHeading: false });
    }));

    app.querySelectorAll(".treatment-tray li").forEach((item) => {
      item.addEventListener("dragstart", (event) => {
        draggedIngredientIndex = Number(item.dataset.ingredientIndex);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedIngredientIndex));
      });
      item.addEventListener("dragover", (event) => event.preventDefault());
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        const to = Number(item.dataset.ingredientIndex);
        const from = draggedIngredientIndex ?? Number(event.dataTransfer.getData("text/plain"));
        state.treatments[state.activeFormId].ingredients = Core.moveItem(state.treatments[state.activeFormId].ingredients, from, to);
        draggedIngredientIndex = null;
        saveState(true);
        render({ focusHeading: false });
      });
    });

    document.querySelectorAll("#treatment-form textarea").forEach((field) => field.addEventListener("change", () => updateTreatmentField(field)));
    app.querySelector('[data-action="validate-builder"]')?.addEventListener("click", () => {
      const currentFields = document.querySelectorAll("#treatment-form textarea");
      currentFields.forEach(updateTreatmentField);
      if (!Core.allTreatmentsDrafted(state.treatments, formIds())) {
        const validation = document.getElementById("builder-validation");
        validation.hidden = false;
        validation.textContent = content.ui.requiredBuilder;
        validation.focus();
        return;
      }
      setStage(4);
    });
  }

  function bindComparison() {
    const form = document.getElementById("comparison-form");
    form.querySelectorAll("select, textarea").forEach((field) => field.addEventListener("change", () => {
      state.comparison[field.name] = field.value;
      saveState(true);
      if (field.tagName === "SELECT") render({ focusHeading: false });
    }));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.querySelectorAll("select, textarea").forEach((field) => { state.comparison[field.name] = field.value; });
      const complete = state.comparison.leftForm !== state.comparison.rightForm && content.comparison.prompts.every((prompt) => state.comparison[prompt.id].trim());
      if (!complete) {
        const validation = document.getElementById("comparison-validation");
        validation.hidden = false;
        validation.textContent = content.ui.requiredComparison;
        validation.focus();
        return;
      }
      saveState();
      setStage(5);
    });
  }

  function bindOwnProject() {
    const form = document.getElementById("own-project-form");
    form.querySelectorAll("input, select, textarea").forEach((field) => field.addEventListener("change", () => {
      state.ownProject[field.name] = field.value;
      saveState(true);
    }));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.querySelectorAll("input, select, textarea").forEach((field) => { state.ownProject[field.name] = field.value; });
      const textIds = [...content.ownProject.fields, ...content.ownProject.formPrompts].map((field) => field.id);
      const complete = state.ownProject.firstForm !== state.ownProject.secondForm && textIds.every((id) => state.ownProject[id].trim());
      if (!complete) {
        const validation = document.getElementById("own-validation");
        validation.hidden = false;
        validation.textContent = content.ui.requiredOwnProject;
        validation.focus();
        return;
      }
      state.reflection.provisionalForm = state.ownProject.firstForm;
      saveState();
      setStage(6);
    });
  }

  function reflectionComplete() {
    return content.reflection.prompts.every((prompt) => state.reflection[prompt.id].trim());
  }

  function refreshSummary() {
    const pre = document.getElementById("summary-text");
    if (pre) pre.textContent = Core.buildSummary(content, state);
  }

  function validateReflection() {
    if (reflectionComplete()) return true;
    const validation = document.getElementById("reflection-validation");
    validation.hidden = false;
    validation.textContent = content.ui.requiredReflection;
    const missing = content.reflection.prompts.find((prompt) => !state.reflection[prompt.id].trim());
    document.querySelector(`[name="${missing.id}"]`)?.focus();
    return false;
  }

  function bindSummary() {
    const form = document.getElementById("reflection-form");
    form.querySelectorAll("select, textarea").forEach((field) => field.addEventListener("input", () => {
      state.reflection[field.name] = field.value;
      saveState(true);
      refreshSummary();
    }));

    app.querySelector('[data-action="copy-summary"]')?.addEventListener("click", async () => {
      if (!validateReflection()) return;
      const text = Core.buildSummary(content, state);
      try {
        await navigator.clipboard.writeText(text);
        announce(content.ui.copySuccess);
      } catch (error) {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        announce(copied ? content.ui.copySuccess : content.ui.copyFallback);
      }
    });

    app.querySelector('[data-action="download-summary"]')?.addEventListener("click", () => {
      if (!validateReflection()) return;
      const blob = new Blob([Core.buildSummary(content, state)], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "documentary-form-lab-summary.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    app.querySelector('[data-action="print-summary"]')?.addEventListener("click", () => {
      if (validateReflection()) window.print();
    });
    app.querySelector('[data-action="restart"]')?.addEventListener("click", clearSavedProgress);
  }

  function clearSavedProgress() {
    if (!window.confirm("Start again and delete all locally saved Documentary Form Lab responses?")) return;
    if (storageAvailable) window.localStorage.removeItem(STORAGE_KEY);
    state = Core.createInitialState(formIds());
    teacherToggle.setAttribute("aria-pressed", "false");
    teacherToggle.textContent = content.ui.showTeacher;
    render({ focusHeading: true });
    announce("Saved progress has been cleared.");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function initialize() {
    try {
      const response = await fetch("data/form-lab-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
      content = await response.json();
      loadState();
      privacyStatement.textContent = content.privacy;
      clearProgressButton.textContent = content.ui.clearProgress;
      document.querySelector(".new-tab-link").textContent = content.ui.openNewTab;
      teacherToggle.textContent = state.teacherMode ? content.ui.hideTeacher : content.ui.showTeacher;
      teacherToggle.setAttribute("aria-pressed", String(state.teacherMode));
      clearProgressButton.addEventListener("click", clearSavedProgress);
      teacherToggle.addEventListener("click", () => {
        state.teacherMode = !state.teacherMode;
        teacherToggle.setAttribute("aria-pressed", String(state.teacherMode));
        teacherToggle.textContent = state.teacherMode ? content.ui.hideTeacher : content.ui.showTeacher;
        saveState();
        render({ focusHeading: false });
        announce(state.teacherMode ? "Teacher notes shown." : "Teacher notes hidden.");
      });
      render();
      if (!storageAvailable) announce(content.ui.storageUnavailable);
    } catch (error) {
      app.setAttribute("aria-busy", "false");
      app.innerHTML = `<div class="error-panel" role="alert"><h1>Unable to load the lab</h1><p>${escapeHtml(content?.ui?.loadError || "The activity content could not be loaded. Preview this folder through a local web server and confirm that data/form-lab-data.json is available.")}</p></div>`;
    }
  }

  initialize();
})();
