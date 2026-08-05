(function () {
  "use strict";

  const STORAGE_KEY = "doc515-filmability-test-v1";
  const app = document.getElementById("app");
  const statusRegion = document.getElementById("status-region");
  const privacyStatement = document.getElementById("privacy-statement");
  const clearProgressButton = document.getElementById("clear-progress");

  let content;
  let storageAvailable = true;
  let state = createInitialState();

  function createInitialState() {
    return {
      version: 1,
      stageIndex: 0,
      maxStage: 0,
      scenarioIndex: 0,
      scenarioAnswers: {},
      scenarioReviewed: {},
      comparisonAnswers: {},
      comparisonReviewed: false,
      ownIdea: { scale: [], sentenceEdited: false },
      ownPromptIndex: 0,
      ownReviewed: false,
      guidance: null,
      reflection: {}
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function testStorage() {
    try {
      const testKey = `${STORAGE_KEY}-test`;
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadState() {
    storageAvailable = testStorage();
    if (!storageAvailable) return;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.version === 1) {
        state = Object.assign(createInitialState(), parsed);
        state.ownIdea = Object.assign({ scale: [], sentenceEdited: false }, parsed.ownIdea || {});
        state.reflection = parsed.reflection || {};
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  function progressMarkup() {
    return `
      <nav class="stage-progress" aria-label="Activity stages">
        <ol class="progress-list">
          ${content.stages.map((stage, index) => {
            const classes = ["progress-item"];
            if (index === state.stageIndex) classes.push("is-current");
            if (index < state.stageIndex || index < state.maxStage) classes.push("is-complete");
            const current = index === state.stageIndex ? ' aria-current="step"' : "";
            return `<li class="${classes.join(" ")}"${current}><span class="progress-label" aria-label="${escapeHtml(stage.long)}"><span class="long-label" aria-hidden="true">${escapeHtml(stage.long)}</span><span class="short-label" aria-hidden="true">${escapeHtml(stage.short)}</span></span></li>`;
          }).join("")}
        </ol>
      </nav>`;
  }

  function render(options = {}) {
    const stageId = content.stages[state.stageIndex].id;
    let stageMarkup = "";

    if (stageId === "intro") stageMarkup = renderIntroduction();
    if (stageId === "framework") stageMarkup = renderFramework();
    if (stageId === "scenarios") stageMarkup = renderScenario();
    if (stageId === "compare") stageMarkup = renderComparison();
    if (stageId === "own") stageMarkup = renderOwnIdea();
    if (stageId === "reflect") stageMarkup = renderReflection();
    if (stageId === "summary") stageMarkup = renderSummary();

    app.innerHTML = progressMarkup() + stageMarkup;
    app.setAttribute("aria-busy", "false");
    bindCurrentStage(stageId);

    if (options.focusHeading) {
      const heading = app.querySelector("h1, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }

  function renderIntroduction() {
    return `
      <article class="panel intro-panel">
        <p class="eyebrow">${escapeHtml(content.courseContext)}</p>
        <h1>${escapeHtml(content.introduction.heading)}</h1>
        <div class="intro-copy lead">
          ${content.introduction.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        <h2 class="h3-style">${escapeHtml(content.introduction.instructionsHeading)}</h2>
        <ol class="instruction-list">
          ${content.introduction.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("")}
        </ol>
        <p class="disclosure">${escapeHtml(content.introduction.imageDisclosure)}</p>
        <div class="button-row">
          <button class="button" type="button" data-action="begin">${escapeHtml(content.introduction.button)}</button>
        </div>
      </article>`;
  }

  function renderFramework() {
    return `
      <article class="panel">
        <p class="eyebrow">Stage 2</p>
        <h1>${escapeHtml(content.frameworkHeading)}</h1>
        <div class="framework-grid">
          ${content.framework.map((item) => `
            <section class="framework-card">
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item.text)}</p>
            </section>`).join("")}
        </div>
        <blockquote class="framework-note">${escapeHtml(content.frameworkNote)}</blockquote>
        <div class="button-row">
          <button class="button secondary" type="button" data-action="back-intro">${escapeHtml(content.ui.back)}</button>
          <button class="button" type="button" data-action="start-scenarios">${escapeHtml(content.frameworkButton)}</button>
        </div>
      </article>`;
  }

  function selectedForQuestion(scenarioId, questionId) {
    return state.scenarioAnswers[scenarioId]?.[questionId] || [];
  }

  function questionMarkup(scenario, question) {
    const selected = selectedForQuestion(scenario.id, question.id);
    const reviewed = Boolean(state.scenarioReviewed[scenario.id]);
    const type = question.type === "multiple" ? "checkbox" : "radio";
    const intro = question.introQuote
      ? `<div class="question-intro"><p class="section-label">${escapeHtml(question.introLabel)}</p><blockquote>${escapeHtml(question.introQuote)}</blockquote></div>`
      : "";
    const promptLabel = question.promptLabel ? `<p class="section-label">${escapeHtml(question.promptLabel)}</p>` : "";
    const feedback = question.feedback || (sameSelections(selected, question.preferred) ? question.preferredFeedback : question.otherFeedback);

    return `
      <section class="question-block" data-question="${escapeHtml(question.id)}">
        ${intro}
        ${promptLabel}
        <fieldset>
          <legend>${escapeHtml(question.prompt)}</legend>
          <div class="option-list">
            ${question.options.map((option) => {
              const checked = selected.includes(option.id) ? " checked" : "";
              return `
                <label class="option">
                  <input type="${type}" name="${escapeHtml(question.id)}" value="${escapeHtml(option.id)}"${checked}>
                  <span>${option.label ? `<span class="option-label">${escapeHtml(option.label)}</span>` : ""}${escapeHtml(option.text)}</span>
                </label>`;
            }).join("")}
          </div>
        </fieldset>
        ${reviewed ? `<div class="feedback" tabindex="-1" aria-live="polite"><p>${escapeHtml(feedback)}</p></div>` : ""}
        ${supplementMarkup(scenario, question.id, reviewed)}
      </section>`;
  }

  function supplementMarkup(scenario, questionId, reviewed) {
    if (!reviewed || !scenario.supplements) return "";
    return scenario.supplements
      .filter((item) => item.afterQuestion === questionId)
      .map((item) => {
        if (item.type === "profile") {
          return `
            <aside class="profile">
              <h3>${escapeHtml(item.title)}</h3>
              <dl>${item.items.map((entry) => `<div class="profile-row"><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`).join("")}</dl>
            </aside>`;
        }
        return `<aside class="supplement-note"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></aside>`;
      }).join("");
  }

  function renderScenario() {
    const scenario = content.scenarios[state.scenarioIndex];
    const reviewed = Boolean(state.scenarioReviewed[scenario.id]);
    const isLast = state.scenarioIndex === content.scenarios.length - 1;
    return `
      <article class="panel">
        <div class="scenario-layout">
          <div class="scenario-media">
            <p class="scenario-count">Scenario ${state.scenarioIndex + 1} of ${content.scenarios.length}</p>
            <div class="frame">
              <img src="${escapeHtml(scenario.image)}" alt="${escapeHtml(scenario.alt)}" data-fallback="images/fallback-documentary-frame.jpg">
            </div>
            <div class="topic-block">
              <p class="section-label">Broad topic</p>
              <p>${escapeHtml(scenario.topic)}</p>
              <p class="section-label">Initial idea</p>
              <blockquote>${escapeHtml(scenario.initialIdea)}</blockquote>
            </div>
          </div>
          <div class="scenario-questions">
            <h1>${escapeHtml(content.scenariosHeading)}</h1>
            <form id="scenario-form" novalidate>
              ${scenario.questions.map((question) => questionMarkup(scenario, question)).join("")}
              <p id="scenario-validation" class="validation" role="alert" hidden></p>
              <div class="button-row">
                <button class="button secondary" type="button" data-action="scenario-back">${escapeHtml(content.ui.back)}</button>
                <button class="button" type="submit">${escapeHtml(reviewed ? content.ui.updateFeedback : content.ui.reviewResponses)}</button>
                ${reviewed ? `<button class="button" type="button" data-action="scenario-next">${escapeHtml(isLast ? content.ui.continueComparison : content.ui.nextScenario)}</button>` : ""}
              </div>
            </form>
          </div>
        </div>
      </article>`;
  }

  function sameSelections(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return [...a].sort().every((value, index) => value === [...b].sort()[index]);
  }

  function renderComparison() {
    return `
      <article class="panel">
        <p class="eyebrow">Stage 4</p>
        <h1>${escapeHtml(content.comparison.heading)}</h1>
        <p class="lead">${escapeHtml(content.comparison.instructions)}</p>
        <form id="comparison-form" novalidate>
          <div class="comparison-grid">
            ${content.comparison.ideas.map((idea) => {
              const current = state.comparisonAnswers[idea.id] || "";
              return `
                <section class="idea-card">
                  <h2>${escapeHtml(idea.label)}</h2>
                  <blockquote>${escapeHtml(idea.text)}</blockquote>
                  <label for="comparison-${escapeHtml(idea.id)}">Category for ${escapeHtml(idea.label)}</label>
                  <select id="comparison-${escapeHtml(idea.id)}" name="${escapeHtml(idea.id)}">
                    <option value="">${escapeHtml(content.ui.selectCategory)}</option>
                    ${content.comparison.categories.map((category) => `<option value="${escapeHtml(category)}"${current === category ? " selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                  </select>
                  ${state.comparisonReviewed ? `
                    <div class="feedback" aria-live="polite">
                      <p><strong>Suggested category:</strong> ${escapeHtml(idea.suggested)}</p>
                      <p>${escapeHtml(idea.feedback)}</p>
                    </div>` : ""}
                </section>`;
            }).join("")}
          </div>
          <p id="comparison-validation" class="validation" role="alert" hidden></p>
          <div class="button-row">
            <button class="button secondary" type="button" data-action="comparison-back">${escapeHtml(content.ui.back)}</button>
            <button class="button" type="submit">${escapeHtml(state.comparisonReviewed ? content.ui.updateFeedback : content.ui.reviewResponses)}</button>
            ${state.comparisonReviewed ? `<button class="button" type="button" data-action="own-start">${escapeHtml(content.comparison.button)}</button>` : ""}
          </div>
        </form>
      </article>`;
  }

  function composeSentence() {
    const prompt = content.ownIdea.prompts.find((item) => item.id === "sentence");
    return prompt.template
      .replace("[contributor]", state.ownIdea.contributor?.trim() || "[contributor]")
      .replace("[activity or attempt]", state.ownIdea.activity?.trim() || "[activity or attempt]")
      .replace("[place]", state.ownIdea.place?.trim() || "[place]")
      .replace("[possible development or change]", state.ownIdea.development?.trim() || "[possible development or change]");
  }

  function ownFieldMarkup(prompt) {
    const value = state.ownIdea[prompt.id] || "";
    if (prompt.type === "text") {
      return `<input id="own-${prompt.id}" name="${prompt.id}" type="text" value="${escapeHtml(value)}" autocomplete="off">`;
    }
    if (prompt.type === "textarea") {
      return `<textarea id="own-${prompt.id}" name="${prompt.id}">${escapeHtml(value)}</textarea>`;
    }
    if (prompt.type === "select") {
      return `
        <select id="own-${prompt.id}" name="${prompt.id}">
          <option value="">Select an access status</option>
          ${prompt.options.map((option) => `<option value="${escapeHtml(option)}"${value === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>`;
    }
    if (prompt.type === "checkboxes") {
      const selected = Array.isArray(value) ? value : [];
      return `
        <fieldset>
          <legend class="field-label">${escapeHtml(prompt.label)}</legend>
          <div class="option-list">
            ${prompt.options.map((option, index) => `
              <label class="option">
                <input type="checkbox" name="scale" value="${escapeHtml(option)}"${selected.includes(option) ? " checked" : ""}>
                <span>${escapeHtml(option)}</span>
              </label>`).join("")}
          </div>
        </fieldset>`;
    }
    return "";
  }

  function renderOwnIdea() {
    const prompts = content.ownIdea.prompts;
    const prompt = prompts[state.ownPromptIndex];
    if (prompt.id === "sentence" && !state.ownIdea.sentenceEdited) {
      const composedSentence = composeSentence();
      if (state.ownIdea.sentence !== composedSentence) {
        state.ownIdea.sentence = composedSentence;
        saveState();
      }
    }
    const atLast = state.ownPromptIndex === prompts.length - 1;
    return `
      <article class="panel prompt-shell">
        <p class="prompt-count">Prompt ${state.ownPromptIndex + 1} of ${prompts.length}</p>
        <div class="prompt-marker" aria-hidden="true"><span style="width: ${((state.ownPromptIndex + 1) / prompts.length) * 100}%"></span></div>
        <h1>${escapeHtml(content.ownIdea.heading)}</h1>
        <p class="quiet-note">${escapeHtml(content.ownIdea.intro)}</p>
        <form id="own-form" novalidate>
          <div class="own-field">
            ${prompt.type === "checkboxes" ? "" : `<label class="field-label" for="own-${escapeHtml(prompt.id)}">${escapeHtml(prompt.label)}</label>`}
            ${prompt.id === "sentence" ? `<blockquote>${escapeHtml(prompt.template)}</blockquote>` : ""}
            ${ownFieldMarkup(prompt)}
          </div>
          ${state.ownReviewed && state.guidance ? guidanceMarkup() : ""}
          <div class="button-row">
            <button class="button secondary" type="button" data-action="own-back">${escapeHtml(content.ui.back)}</button>
            ${!atLast ? `<button class="button" type="button" data-action="own-next">${escapeHtml(content.ui.next)}</button>` : `<button class="button" type="submit">${escapeHtml(content.ownIdea.reviewButton)}</button>`}
            ${atLast && state.ownReviewed ? `<button class="button" type="button" data-action="reflection-start">Continue to reflection</button>` : ""}
          </div>
        </form>
      </article>`;
  }

  function guidanceMarkup() {
    const guidance = state.guidance;
    if (!guidance) return "";
    const ethical = guidance.ethical ? `
      <div class="guidance-card">
        <h3>${escapeHtml(content.guidance.ethics.label)}</h3>
        <p>${escapeHtml(content.guidance.ethics.feedback)}</p>
        <p><strong>${escapeHtml(content.guidance.ethics.disclaimer)}</strong></p>
      </div>` : "";
    return `
      <div id="guidance-result" class="guidance-card" tabindex="-1" aria-live="polite">
        <h2>${escapeHtml(guidance.label)}</h2>
        <p>${escapeHtml(guidance.feedback)}</p>
      </div>
      ${ethical}`;
  }

  function generateGuidance() {
    const idea = state.ownIdea;
    const contributor = (idea.contributor || "").trim();
    const activity = (idea.activity || "").trim();
    const place = (idea.place || "").trim();
    const development = (idea.development || "").trim();
    const access = idea.access || "";
    const scaleCount = Array.isArray(idea.scale) ? idea.scale.length : 0;
    const accessConcern = access === "Access uncertain" || access === "Complex institutional approval likely";
    const allowedAccess = ["Access confirmed", "Initial contact made", "Contributor identified but not contacted"].includes(access);
    const underdeveloped = !contributor || !place || !activity || !development || activity.length < 20 || development.length < 20;
    let key;

    if (accessConcern) key = "access";
    else if (scaleCount < 4) key = "scale";
    else if (underdeveloped) key = "underdeveloped";
    else if (allowedAccess && contributor && activity && place && development) key = "strong";
    else key = "underdeveloped";

    const ethicsText = (idea.ethics || "").toLocaleLowerCase();
    const ethical = content.guidance.ethics.keywords.some((keyword) => ethicsText.includes(keyword.toLocaleLowerCase()));
    return {
      key,
      label: content.guidance[key].label,
      feedback: content.guidance[key].feedback,
      ethical
    };
  }

  function renderReflection() {
    return `
      <article class="panel">
        <p class="eyebrow">Stage 6</p>
        <h1>${escapeHtml(content.reflection.heading)}</h1>
        <p class="lead">${escapeHtml(content.reflection.intro)}</p>
        <form id="reflection-form" novalidate>
          <div class="reflection-grid">
            ${content.reflection.prompts.map((prompt) => `
              <div>
                <label class="field-label" for="reflection-${escapeHtml(prompt.id)}">${escapeHtml(prompt.label)}${prompt.required ? "" : ` <span class="hint">${escapeHtml(prompt.hint)}</span>`}</label>
                <textarea id="reflection-${escapeHtml(prompt.id)}" name="${escapeHtml(prompt.id)}"${prompt.required ? ' aria-required="true"' : ""}>${escapeHtml(state.reflection[prompt.id] || "")}</textarea>
              </div>`).join("")}
          </div>
          <p id="reflection-validation" class="validation" role="alert" hidden></p>
          <div class="button-row">
            <button class="button secondary" type="button" data-action="reflection-back">${escapeHtml(content.ui.back)}</button>
            <button class="button" type="submit">${escapeHtml(content.reflection.button)}</button>
          </div>
        </form>
      </article>`;
  }

  function summaryEntries() {
    const labels = content.summary.labels;
    const guidance = state.guidance || generateGuidance();
    const guidanceText = `${guidance.label}: ${guidance.feedback}${guidance.ethical ? `\n\n${content.guidance.ethics.label}: ${content.guidance.ethics.feedback}\n${content.guidance.ethics.disclaimer}` : ""}`;
    return [
      [labels.topic, state.ownIdea.topic],
      [labels.contributor, state.ownIdea.contributor],
      [labels.activity, state.ownIdea.activity],
      [labels.place, state.ownIdea.place],
      [labels.development, state.ownIdea.development],
      [labels.access, state.ownIdea.access],
      [labels.scale, (state.ownIdea.scale || []).join("\n")],
      [labels.ethics, state.ownIdea.ethics],
      [labels.sentence, state.ownIdea.sentence],
      [labels.guidance, guidanceText],
      [labels.topicVsFilm, state.reflection.topicVsFilm],
      [labels.filmableElement, state.reflection.filmableElement],
      [labels.uncertain, state.reflection.uncertain],
      [labels.firstAction, state.reflection.firstAction],
      [labels.backup, state.reflection.backup]
    ];
  }

  function summaryText() {
    return [content.summary.heading, "", ...summaryEntries().flatMap(([label, value]) => [`${label}:`, value || "", ""]), content.privacy].join("\n");
  }

  function renderSummary() {
    return `
      <article class="panel">
        <p class="eyebrow">Stage 7</p>
        <h1>${escapeHtml(content.summary.heading)}</h1>
        <dl id="summary-content" class="summary-list">
          ${summaryEntries().map(([label, value]) => `
            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value || "—")}</dd>
            </div>`).join("")}
        </dl>
        <div class="button-row">
          <button class="button" type="button" data-action="copy-summary">${escapeHtml(content.summary.buttons.copy)}</button>
          <button class="button" type="button" data-action="download-summary">${escapeHtml(content.summary.buttons.download)}</button>
          <button class="button secondary" type="button" data-action="revise">${escapeHtml(content.summary.buttons.revise)}</button>
          <button class="button secondary" type="button" data-action="restart">${escapeHtml(content.summary.buttons.restart)}</button>
        </div>
        <p class="disclosure">${escapeHtml(content.privacy)}</p>
      </article>`;
  }

  function bindCurrentStage(stageId) {
    app.querySelectorAll("img[data-fallback]").forEach((image) => {
      image.addEventListener("error", () => {
        const fallback = image.dataset.fallback;
        image.removeAttribute("data-fallback");
        image.src = fallback;
      }, { once: true });
    });

    app.querySelector('[data-action="begin"]')?.addEventListener("click", () => setStage(1));
    app.querySelector('[data-action="back-intro"]')?.addEventListener("click", () => setStage(0));
    app.querySelector('[data-action="start-scenarios"]')?.addEventListener("click", () => {
      state.scenarioIndex = 0;
      setStage(2);
    });

    if (stageId === "scenarios") bindScenario();
    if (stageId === "compare") bindComparison();
    if (stageId === "own") bindOwnIdea();
    if (stageId === "reflect") bindReflection();
    if (stageId === "summary") bindSummary();
  }

  function bindScenario() {
    const scenario = content.scenarios[state.scenarioIndex];
    const form = document.getElementById("scenario-form");

    form.addEventListener("change", (event) => {
      const question = scenario.questions.find((item) => item.id === event.target.name);
      if (!question) return;
      state.scenarioAnswers[scenario.id] ||= {};
      if (question.type === "multiple") {
        state.scenarioAnswers[scenario.id][question.id] = [...form.querySelectorAll(`input[name="${question.id}"]:checked`)].map((input) => input.value);
      } else {
        state.scenarioAnswers[scenario.id][question.id] = [event.target.value];
      }
      saveState();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const missing = scenario.questions.find((question) => selectedForQuestion(scenario.id, question.id).length === 0);
      const validation = document.getElementById("scenario-validation");
      if (missing) {
        validation.hidden = false;
        validation.textContent = content.ui.questionsRequiredMessage;
        form.querySelector(`[name="${missing.id}"]`)?.focus();
        return;
      }
      state.scenarioReviewed[scenario.id] = true;
      saveState();
      render();
      announce("Narrative feedback is available below each response.");
      app.querySelector(".feedback")?.focus();
    });

    app.querySelector('[data-action="scenario-back"]')?.addEventListener("click", () => {
      if (state.scenarioIndex > 0) {
        state.scenarioIndex -= 1;
        saveState();
        render({ focusHeading: true });
      } else {
        setStage(1);
      }
    });

    app.querySelector('[data-action="scenario-next"]')?.addEventListener("click", () => {
      if (state.scenarioIndex < content.scenarios.length - 1) {
        state.scenarioIndex += 1;
        saveState();
        render({ focusHeading: true });
        window.scrollTo({ top: 0, behavior: "auto" });
      } else {
        setStage(3);
      }
    });
  }

  function bindComparison() {
    const form = document.getElementById("comparison-form");
    form.addEventListener("change", (event) => {
      if (event.target.tagName !== "SELECT") return;
      state.comparisonAnswers[event.target.name] = event.target.value;
      saveState();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const missing = content.comparison.ideas.find((idea) => !state.comparisonAnswers[idea.id]);
      const validation = document.getElementById("comparison-validation");
      if (missing) {
        validation.hidden = false;
        validation.textContent = content.ui.comparisonRequiredMessage;
        document.getElementById(`comparison-${missing.id}`)?.focus();
        return;
      }
      state.comparisonReviewed = true;
      saveState();
      render();
      announce("Narrative feedback is available for all four ideas.");
      app.querySelector(".feedback")?.setAttribute("tabindex", "-1");
      app.querySelector(".feedback")?.focus();
    });
    app.querySelector('[data-action="comparison-back"]')?.addEventListener("click", () => {
      state.scenarioIndex = content.scenarios.length - 1;
      setStage(2);
    });
    app.querySelector('[data-action="own-start"]')?.addEventListener("click", () => {
      state.ownPromptIndex = 0;
      setStage(4);
    });
  }

  function bindOwnIdea() {
    const form = document.getElementById("own-form");
    const prompt = content.ownIdea.prompts[state.ownPromptIndex];
    const inputs = [...form.querySelectorAll("input, textarea, select")];

    inputs.forEach((input) => {
      const eventName = input.matches("select, input[type='checkbox']") ? "change" : "input";
      input.addEventListener(eventName, () => {
        if (prompt.type === "checkboxes") {
          state.ownIdea.scale = [...form.querySelectorAll('input[name="scale"]:checked')].map((item) => item.value);
        } else {
          state.ownIdea[prompt.id] = input.value;
          if (prompt.id === "sentence") state.ownIdea.sentenceEdited = true;
        }
        state.ownReviewed = false;
        state.guidance = null;
        saveState();
        app.querySelectorAll(".guidance-card").forEach((card) => card.remove());
        app.querySelector('[data-action="reflection-start"]')?.remove();
      });
    });

    app.querySelector('[data-action="own-back"]')?.addEventListener("click", () => {
      if (state.ownPromptIndex > 0) {
        state.ownPromptIndex -= 1;
        saveState();
        render({ focusHeading: true });
      } else {
        setStage(3);
      }
    });
    app.querySelector('[data-action="own-next"]')?.addEventListener("click", () => {
      state.ownPromptIndex += 1;
      saveState();
      render({ focusHeading: true });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      state.guidance = generateGuidance();
      state.ownReviewed = true;
      saveState();
      render();
      document.getElementById("guidance-result")?.focus();
    });
    app.querySelector('[data-action="reflection-start"]')?.addEventListener("click", () => setStage(5));
  }

  function bindReflection() {
    const form = document.getElementById("reflection-form");
    form.querySelectorAll("textarea").forEach((field) => {
      field.addEventListener("input", () => {
        state.reflection[field.name] = field.value;
        field.removeAttribute("aria-invalid");
        saveState();
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const missing = content.reflection.prompts.find((prompt) => prompt.required && !(state.reflection[prompt.id] || "").trim());
      const validation = document.getElementById("reflection-validation");
      if (missing) {
        const field = document.getElementById(`reflection-${missing.id}`);
        validation.hidden = false;
        validation.textContent = content.ui.requiredMessage;
        field?.setAttribute("aria-invalid", "true");
        field?.focus();
        return;
      }
      setStage(6);
    });
    app.querySelector('[data-action="reflection-back"]')?.addEventListener("click", () => {
      state.ownPromptIndex = content.ownIdea.prompts.length - 1;
      setStage(4);
    });
  }

  function bindSummary() {
    app.querySelector('[data-action="copy-summary"]')?.addEventListener("click", async () => {
      const text = summaryText();
      try {
        await navigator.clipboard.writeText(text);
        announce(content.ui.copySuccess);
      } catch (error) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        announce(copied ? content.ui.copySuccess : content.ui.copyFallback);
      }
    });
    app.querySelector('[data-action="download-summary"]')?.addEventListener("click", () => {
      const blob = new Blob([summaryText()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "filmability-check.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    app.querySelector('[data-action="revise"]')?.addEventListener("click", () => {
      state.ownPromptIndex = 0;
      setStage(4);
    });
    app.querySelector('[data-action="restart"]')?.addEventListener("click", clearSavedProgress);
  }

  function clearSavedProgress() {
    const confirmed = window.confirm("Start again and clear all locally saved responses?");
    if (!confirmed) return;
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        storageAvailable = false;
      }
    }
    state = createInitialState();
    render({ focusHeading: true });
    announce("Saved progress has been cleared.");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function initialize() {
    try {
      const response = await fetch("data/filmability-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
      content = await response.json();
      loadState();
      privacyStatement.textContent = content.privacy;
      clearProgressButton.textContent = content.ui.clearProgress;
      clearProgressButton.addEventListener("click", clearSavedProgress);
      document.querySelector(".new-tab-link").textContent = content.ui.openNewTab;
      render();
      if (!storageAvailable) announce(content.ui.storageUnavailable);
    } catch (error) {
      app.setAttribute("aria-busy", "false");
      app.innerHTML = `<div class="error-panel" role="alert"><h1>Unable to load the activity</h1><p>${escapeHtml(content?.ui?.loadError || "The activity content could not be loaded. Preview this folder through a local web server and confirm that data/filmability-data.json is available.")}</p></div>`;
    }
  }

  initialize();
})();
