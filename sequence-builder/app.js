(() => {
  "use strict";

  const STORAGE_KEY = "doc515.sequenceBuilder.v1";
  const VALID_STAGES = new Set([
    "intro",
    "arrange",
    "sequence-feedback",
    "remove",
    "choose",
    "reflect",
    "summary"
  ]);

  const app = document.querySelector("#app");
  const stageNav = document.querySelector(".stage-nav");
  const stageList = document.querySelector("#stage-list");
  const clearButton = document.querySelector("#clear-progress");
  const clearDialog = document.querySelector("#clear-dialog");
  const clearDialogCopy = document.querySelector("#clear-dialog-copy");
  const clearCancel = document.querySelector("#clear-cancel");
  const clearConfirm = document.querySelector("#clear-confirm");
  const toast = document.querySelector("#toast");
  const liveRegion = document.querySelector("#live-region");

  let content;
  let frameMap;
  let state;
  let storageAvailable = testStorage();
  let dragId = null;
  let uiError = null;
  let toastTimer = null;
  let dialogReturnFocus = null;

  function testStorage() {
    try {
      const key = `${STORAGE_KEY}.test`;
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fillTemplate(template, values) {
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
      template
    );
  }

  function createDefaultState() {
    const reflection = Object.fromEntries(content.reflection.prompts.map((prompt) => [prompt.id, ""]));
    return {
      version: 1,
      stage: "intro",
      order: [...content.scrambledOrder],
      sequenceCategory: null,
      showComparison: false,
      selectedRemovalId: null,
      removedId: null,
      removalResponse: "",
      removalFeedbackShown: false,
      selectedIndispensableId: null,
      indispensableResponse: "",
      indispensableFeedbackShown: false,
      reflection
    };
  }

  function sanitizeState(saved) {
    const defaults = createDefaultState();
    if (!saved || typeof saved !== "object") return defaults;

    const expectedIds = new Set(content.frames.map((frame) => frame.id));
    const savedOrder = Array.isArray(saved.order) ? saved.order : [];
    const orderIsValid =
      savedOrder.length === expectedIds.size &&
      new Set(savedOrder).size === expectedIds.size &&
      savedOrder.every((id) => expectedIds.has(id));

    const clean = {
      ...defaults,
      ...saved,
      stage: VALID_STAGES.has(saved.stage) ? saved.stage : defaults.stage,
      order: orderIsValid ? [...savedOrder] : defaults.order,
      sequenceCategory: ["intelligible", "partial", "unclear"].includes(saved.sequenceCategory)
        ? saved.sequenceCategory
        : null,
      selectedRemovalId: expectedIds.has(saved.selectedRemovalId) ? saved.selectedRemovalId : null,
      removedId: expectedIds.has(saved.removedId) ? saved.removedId : null,
      selectedIndispensableId: expectedIds.has(saved.selectedIndispensableId)
        ? saved.selectedIndispensableId
        : null,
      removalResponse: typeof saved.removalResponse === "string" ? saved.removalResponse : "",
      indispensableResponse:
        typeof saved.indispensableResponse === "string" ? saved.indispensableResponse : "",
      reflection: { ...defaults.reflection }
    };

    content.reflection.prompts.forEach((prompt) => {
      if (saved.reflection && typeof saved.reflection[prompt.id] === "string") {
        clean.reflection[prompt.id] = saved.reflection[prompt.id];
      }
    });

    clean.showComparison = Boolean(saved.showComparison);
    clean.removalFeedbackShown = Boolean(saved.removalFeedbackShown && clean.removedId);
    clean.indispensableFeedbackShown = Boolean(
      saved.indispensableFeedbackShown && clean.selectedIndispensableId
    );

    if (clean.stage === "sequence-feedback" && !clean.sequenceCategory) {
      clean.sequenceCategory = classifySequence(clean.order);
    }

    return clean;
  }

  function loadState() {
    if (!storageAvailable) return createDefaultState();
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      return sanitizeState(saved);
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      storageAvailable = false;
    }
  }

  function clearSavedState() {
    if (!storageAvailable) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
    }
  }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 20);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function stageIndex() {
    if (state.stage === "arrange" || state.stage === "sequence-feedback") return 0;
    if (state.stage === "remove") return 1;
    if (state.stage === "choose") return 2;
    if (state.stage === "reflect" || state.stage === "summary") return 3;
    return -1;
  }

  function renderStageNavigation() {
    const currentIndex = stageIndex();
    stageNav.hidden = state.stage === "intro";
    if (state.stage === "intro") return;

    stageList.innerHTML = content.stages
      .map((stage, index) => {
        const statusClass = index < currentIndex ? "is-complete" : index === currentIndex ? "is-current" : "";
        const current = index === currentIndex ? ' aria-current="step"' : "";
        return `
          <li class="stage-item ${statusClass}"${current}>
            <span class="stage-number">${stage.number}</span>
            <span class="stage-label">${escapeHtml(stage.label)}</span>
          </li>`;
      })
      .join("");
  }

  function storageNotice() {
    if (storageAvailable) return "";
    return `<p class="storage-notice" role="status">${escapeHtml(content.utility.storageUnavailable)}</p>`;
  }

  function stageHeader(eyebrow, heading, instruction) {
    return `
      <header class="stage-header">
        <div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1 tabindex="-1">${escapeHtml(heading)}</h1>
        </div>
        <p class="stage-instruction">${escapeHtml(instruction)}</p>
      </header>`;
  }

  function renderIntro() {
    const heroFrame = frameMap.get(content.intro.heroFrameId);
    return `
      ${storageNotice()}
      <section class="intro-grid intro-hero">
        <div class="intro-copy">
          <p class="eyebrow">${escapeHtml(content.intro.eyebrow)}</p>
          <h1 tabindex="-1">${escapeHtml(content.intro.heading)}</h1>
          <p class="intro-lead">${escapeHtml(content.intro.body)}</p>
          <div class="intro-index" aria-label="Lesson premise">
            <span>Observe</span><span>Connect</span><span>Transform</span>
          </div>
        </div>
        <figure class="intro-visual">
          <div class="intro-image-wrap">
            <img src="${escapeHtml(heroFrame.file)}" alt="${escapeHtml(heroFrame.alt)}">
            <span class="gfx-corner gfx-corner-a" aria-hidden="true"></span>
            <span class="gfx-corner gfx-corner-b" aria-hidden="true"></span>
            <div class="intro-frame-data" aria-hidden="true">
              <span>${escapeHtml(heroFrame.id)} / 10</span>
              <span>DOC · OBS</span>
            </div>
          </div>
          <figcaption>
            <strong>${escapeHtml(content.intro.heroLabel)}</strong>
            <span>${escapeHtml(content.intro.heroNote)}</span>
          </figcaption>
        </figure>
      </section>

      <section class="grammar-section" aria-labelledby="grammar-heading">
        <header class="grammar-header">
          <div>
            <p class="eyebrow">${escapeHtml(content.intro.grammarEyebrow)}</p>
            <h2 id="grammar-heading">${escapeHtml(content.intro.grammarHeading)}</h2>
          </div>
          <p>${escapeHtml(content.intro.grammarBody)}</p>
        </header>
        <ol class="grammar-ladder">
          ${content.intro.grammarUnits
            .map(
              (unit) => `
                <li class="grammar-card">
                  <div class="grammar-card-head">
                    <span class="grammar-number" aria-hidden="true">${escapeHtml(unit.number)}</span>
                    <p>${escapeHtml(unit.tagline)}</p>
                  </div>
                  <h3>${escapeHtml(unit.term)}</h3>
                  <p class="grammar-definition">${escapeHtml(unit.definition)}</p>
                  <div class="potter-example">
                    <span>Potter study</span>
                    <p>${escapeHtml(unit.potterExample)}</p>
                  </div>
                  <p class="grammar-question">${escapeHtml(unit.question)}</p>
                </li>`
            )
            .join("")}
        </ol>
        <div class="grammar-formula" aria-label="Shot provides evidence; sequence creates relation; scene creates experience">
          ${content.intro.grammarFormula
            .map(
              (item, index) => `
                ${index ? '<span class="formula-link" aria-hidden="true">→</span>' : ""}
                <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.value)}</span></div>`
            )
            .join("")}
        </div>
      </section>

      <section class="intro-lower">
        <aside class="field-note" aria-labelledby="field-note-heading">
          <p class="field-note-label">Field note / 01</p>
          <h2 id="field-note-heading">${escapeHtml(content.intro.fieldNoteHeading)}</h2>
          <p>${escapeHtml(content.intro.fieldNoteBody)}</p>
        </aside>
        <aside class="brief-card" aria-labelledby="construction-heading">
          <h2 id="construction-heading">${escapeHtml(content.intro.instructionsHeading)}</h2>
          <ol>
            ${content.intro.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("")}
          </ol>
        </aside>
      </section>

      <section class="intro-start" aria-label="Begin activity">
        <p>${escapeHtml(content.intro.beginPrompt)}</p>
        <button class="button" type="button" data-action="begin">${escapeHtml(content.intro.beginLabel)}</button>
      </section>`;
  }

  function arrangeCard(frame, position) {
    const first = position === 0;
    const last = position === state.order.length - 1;
    const arrange = content.arrange;
    return `
      <li class="frame-card" draggable="true" data-frame-id="${frame.id}" aria-label="${escapeHtml(
        `${frame.label}, ${arrange.positionLabel} ${position + 1} of ${state.order.length}`
      )}">
        <div class="frame-media">
          <span class="position-chip" aria-hidden="true">${position + 1}</span>
          <span class="frame-id" aria-hidden="true">${frame.id}</span>
          <img src="${escapeHtml(frame.file)}" alt="${escapeHtml(frame.alt)}" draggable="false">
        </div>
        <div class="frame-copy">
          <h3>${escapeHtml(frame.label)}</h3>
          <p>${escapeHtml(frame.caption)}</p>
        </div>
        <div class="frame-controls" aria-label="Move ${escapeHtml(frame.label)}">
          <button class="move-button" type="button" data-action="move-start" data-id="${frame.id}" aria-label="${escapeHtml(
            `${arrange.moveStartLabel}: ${frame.label}`
          )}" ${first ? "disabled" : ""}>|← Start</button>
          <button class="move-button" type="button" data-action="move-left" data-id="${frame.id}" aria-label="${escapeHtml(
            `${arrange.moveLeftLabel}: ${frame.label}`
          )}" ${first ? "disabled" : ""}>← Left</button>
          <button class="move-button" type="button" data-action="move-right" data-id="${frame.id}" aria-label="${escapeHtml(
            `${arrange.moveRightLabel}: ${frame.label}`
          )}" ${last ? "disabled" : ""}>Right →</button>
          <button class="move-button" type="button" data-action="move-end" data-id="${frame.id}" aria-label="${escapeHtml(
            `${arrange.moveEndLabel}: ${frame.label}`
          )}" ${last ? "disabled" : ""}>End →|</button>
        </div>
      </li>`;
  }

  function renderArrange() {
    return `
      ${storageNotice()}
      ${stageHeader(content.arrange.eyebrow, content.arrange.heading, content.arrange.instruction)}
      <ol class="sequence-grid" aria-label="Sequence frames in current order">
        ${state.order.map((id, position) => arrangeCard(frameMap.get(id), position)).join("")}
      </ol>
      <div class="action-bar">
        <button class="button button-secondary" type="button" data-action="reset-order">${escapeHtml(
          content.arrange.resetLabel
        )}</button>
        <button class="button" type="button" data-action="check-sequence">${escapeHtml(
          content.arrange.checkLabel
        )}</button>
      </div>`;
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function longestIncreasingSubsequenceLength(values) {
    const tails = [];
    values.forEach((value) => {
      let low = 0;
      let high = tails.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (tails[middle] < value) low = middle + 1;
        else high = middle;
      }
      tails[low] = value;
    });
    return tails.length;
  }

  function classifySequence(order) {
    if (content.coherentOrders.some((coherent) => arraysEqual(order, coherent))) return "intelligible";

    const coreSequence = order.filter((id) => content.coreOrder.includes(id));
    const coreIsOrdered = arraysEqual(coreSequence, content.coreOrder);
    const laterBoundary = order.indexOf("F5");
    const cutawaysAreLater = ["F7", "F9"].every((id) => order.indexOf(id) > laterBoundary);
    if (coreIsOrdered && cutawaysAreLater) return "intelligible";

    const modelIndices = coreSequence.map((id) => content.coreOrder.indexOf(id));
    return longestIncreasingSubsequenceLength(modelIndices) >= 6 ? "partial" : "unclear";
  }

  function orderText(order) {
    return order.map((id) => `${id} ${frameMap.get(id).label}`).join(" → ");
  }

  function compareStrip(order, label) {
    return `
      <section class="compare-column">
        <h3>${escapeHtml(label)}</h3>
        <ol class="compare-strip">
          ${order
            .map((id) => {
              const frame = frameMap.get(id);
              return `<li class="compare-frame"><img src="${escapeHtml(frame.file)}" alt=""><span>${id}</span></li>`;
            })
            .join("")}
        </ol>
      </section>`;
  }

  function renderSequenceFeedback() {
    const feedback = content.sequenceFeedback;
    const category = feedback.categories[state.sequenceCategory];
    return `
      ${storageNotice()}
      ${stageHeader(feedback.eyebrow, feedback.heading, category.body)}
      <div class="feedback-panel">
        <section class="feedback-category" aria-live="polite">
          <p class="feedback-label">${escapeHtml(category.label)}</p>
          <p>${escapeHtml(category.body)}</p>
        </section>
        <div class="order-readout">
          <section class="order-line">
            <h3>${escapeHtml(feedback.studentOrderLabel)}</h3>
            <p>${escapeHtml(orderText(state.order))}</p>
          </section>
          <section class="order-line">
            <h3>${escapeHtml(feedback.modelOrderLabel)}</h3>
            <p>${escapeHtml(orderText(content.modelOrder))}</p>
          </section>
        </div>
      </div>
      <div class="button-row">
        <button class="button button-secondary" type="button" data-action="toggle-comparison" aria-expanded="${state.showComparison}">${escapeHtml(
          state.showComparison ? feedback.hideCompareLabel : feedback.compareLabel
        )}</button>
        <button class="button" type="button" data-action="continue-remove">${escapeHtml(
          feedback.continueLabel
        )}</button>
      </div>
      ${
        state.showComparison
          ? `<div class="visual-compare">${compareStrip(state.order, feedback.studentOrderLabel)}${compareStrip(
              content.modelOrder,
              feedback.modelOrderLabel
            )}</div>`
          : ""
      }`;
  }

  function selectableCard(frame, selected, action, buttonLabel) {
    return `
      <li class="frame-card ${selected ? "is-selected" : ""}" data-frame-id="${frame.id}">
        <div class="frame-media">
          <span class="frame-id" aria-hidden="true">${frame.id}</span>
          <img src="${escapeHtml(frame.file)}" alt="${escapeHtml(frame.alt)}">
        </div>
        <div class="frame-copy">
          <h3>${escapeHtml(frame.label)}</h3>
          <p>${escapeHtml(frame.caption)}</p>
        </div>
        <button class="card-select" type="button" data-action="${action}" data-id="${frame.id}" aria-pressed="${selected}">${escapeHtml(
          selected ? content.utility.selectedLabel : buttonLabel
        )}</button>
      </li>`;
  }

  function removedCard(frame) {
    return `
      <article class="frame-card">
        <div class="frame-media">
          <span class="frame-id" aria-hidden="true">${frame.id}</span>
          <img src="${escapeHtml(frame.file)}" alt="${escapeHtml(frame.alt)}">
        </div>
        <div class="frame-copy">
          <h3>${escapeHtml(frame.label)}</h3>
          <p>${escapeHtml(frame.caption)}</p>
        </div>
        <button class="card-select" type="button" data-action="restore-shot">${escapeHtml(
          content.removal.restoreLabel
        )}</button>
      </article>`;
  }

  function removalResponsePanel() {
    if (!state.removedId) return "";
    const removal = content.removal;
    const error = uiError?.scope === "removal" ? `<p class="field-error" id="removal-error">${escapeHtml(uiError.message)}</p>` : "";
    const feedback = state.removalFeedbackShown
      ? `<section class="narrative-feedback" aria-live="polite"><h3>What the cut reveals</h3><p>${escapeHtml(
          removal.feedback[state.removedId]
        )}</p></section>`
      : "";
    return `
      <section class="response-panel">
        <label for="removal-response">${escapeHtml(removal.prompt)}</label>
        <textarea id="removal-response" data-field="removalResponse" minlength="${removal.minimumCharacters}" aria-describedby="removal-hint${
          error ? " removal-error" : ""
        }">${escapeHtml(state.removalResponse)}</textarea>
        <p class="field-meta"><span id="removal-hint">${escapeHtml(removal.minimumHint)}</span><span id="removal-count">${
          state.removalResponse.length
        } characters</span></p>
        ${error}
        <div class="action-bar">
          <button class="button button-secondary" type="button" data-action="show-removal-feedback">${escapeHtml(
            removal.showFeedbackLabel
          )}</button>
          ${
            state.removalFeedbackShown
              ? `<button class="button" type="button" data-action="continue-choose">${escapeHtml(
                  removal.continueLabel
                )}</button>`
              : ""
          }
        </div>
        ${feedback}
      </section>`;
  }

  function renderRemoval() {
    const removal = content.removal;
    const visibleIds = state.order.filter((id) => id !== state.removedId);
    const selectedFrame = state.selectedRemovalId ? frameMap.get(state.selectedRemovalId) : null;
    const error = uiError?.scope === "remove-select" ? `<p class="field-error" role="alert">${escapeHtml(uiError.message)}</p>` : "";
    return `
      ${storageNotice()}
      ${stageHeader(removal.eyebrow, removal.heading, removal.instruction)}
      <div class="removal-layout">
        <div>
          <p>${escapeHtml(removal.selectInstruction)}</p>
          <ol class="selection-grid" aria-label="Current sequence">
            ${visibleIds
              .map((id) => {
                const frame = frameMap.get(id);
                const label = fillTemplate(content.utility.selectShotLabel, { label: frame.label });
                return selectableCard(frame, state.selectedRemovalId === id, "select-removal", label);
              })
              .join("")}
          </ol>
          ${error}
          ${
            state.removedId
              ? ""
              : `<div class="action-bar"><button class="button" type="button" data-action="remove-shot">${escapeHtml(
                  removal.removeLabel
                )}${selectedFrame ? `: ${escapeHtml(selectedFrame.label)}` : ""}</button></div>`
          }
        </div>
        <aside class="removed-zone" aria-labelledby="removed-heading">
          <h2 id="removed-heading">${escapeHtml(removal.removedAreaLabel)}</h2>
          ${
            state.removedId
              ? removedCard(frameMap.get(state.removedId))
              : `<div class="empty-zone">The frame you remove will appear here.</div>`
          }
        </aside>
      </div>
      ${removalResponsePanel()}`;
  }

  function renderChoose() {
    const choose = content.indispensable;
    const error = uiError?.scope === "indispensable" ? `<p class="field-error" id="indispensable-error">${escapeHtml(
      uiError.message
    )}</p>` : "";
    const feedback = state.indispensableFeedbackShown
      ? `<section class="narrative-feedback" aria-live="polite"><h3>Why the shot matters</h3><p>${escapeHtml(
          choose.feedback[state.selectedIndispensableId]
        )}</p></section>`
      : "";
    return `
      ${storageNotice()}
      ${stageHeader(choose.eyebrow, choose.heading, choose.instruction)}
      <ol class="selection-grid" aria-label="Choose an indispensable shot">
        ${state.order
          .map((id) => {
            const frame = frameMap.get(id);
            const label = fillTemplate(content.utility.selectShotLabel, { label: frame.label });
            return selectableCard(frame, state.selectedIndispensableId === id, "select-indispensable", label);
          })
          .join("")}
      </ol>
      <section class="response-panel">
        <label for="indispensable-response">${escapeHtml(choose.prompt)}</label>
        <textarea id="indispensable-response" data-field="indispensableResponse" minlength="${choose.minimumCharacters}" aria-describedby="indispensable-hint${
          error ? " indispensable-error" : ""
        }">${escapeHtml(state.indispensableResponse)}</textarea>
        <p class="field-meta"><span id="indispensable-hint">${escapeHtml(
          choose.minimumHint
        )}</span><span id="indispensable-count">${state.indispensableResponse.length} characters</span></p>
        ${error}
        <div class="action-bar">
          <button class="button button-secondary" type="button" data-action="show-indispensable-feedback">${escapeHtml(
            choose.showFeedbackLabel
          )}</button>
          ${
            state.indispensableFeedbackShown
              ? `<button class="button" type="button" data-action="continue-reflection">${escapeHtml(
                  choose.continueLabel
                )}</button>`
              : ""
          }
        </div>
        ${feedback}
      </section>`;
  }

  function renderReflection() {
    const reflection = content.reflection;
    return `
      ${storageNotice()}
      ${stageHeader(reflection.eyebrow, reflection.heading, reflection.instruction)}
      <div class="reflection-grid">
        ${reflection.prompts
          .map(
            (prompt, index) => `
              <section class="reflection-field">
                <label for="reflection-${escapeHtml(prompt.id)}">${index + 1}. ${escapeHtml(prompt.label)}</label>
                <textarea id="reflection-${escapeHtml(prompt.id)}" data-reflection-id="${escapeHtml(prompt.id)}">${escapeHtml(
                  state.reflection[prompt.id]
                )}</textarea>
              </section>`
          )
          .join("")}
      </div>
      <div class="action-bar">
        <button class="button" type="button" data-action="create-summary">${escapeHtml(
          reflection.createSummaryLabel
        )}</button>
      </div>`;
  }

  function summaryText() {
    const labels = content.summary.labels;
    const missing = content.utility.notProvided;
    const removedFrame = frameMap.get(state.removedId);
    const indispensableFrame = frameMap.get(state.selectedIndispensableId);
    const value = (text) => text.trim() || missing;
    return [
      content.summary.documentHeading,
      "",
      `${labels.order}:`,
      orderText(state.order),
      "",
      `${labels.removed}:`,
      removedFrame ? `${removedFrame.id} — ${removedFrame.label}` : missing,
      "",
      `${labels.changed}:`,
      value(state.removalResponse),
      "",
      `${labels.indispensable}:`,
      indispensableFrame ? `${indispensableFrame.id} — ${indispensableFrame.label}` : missing,
      "",
      `${labels.why}:`,
      value(state.indispensableResponse),
      "",
      `${labels.makesSequence}:`,
      value(state.reflection.makesSequence),
      "",
      `${labels.leastDamage}:`,
      value(state.reflection.leastDamage),
      "",
      `${labels.cutawaysAdd}:`,
      value(state.reflection.cutawaysAdd),
      "",
      `${labels.futureAttention}:`,
      value(state.reflection.futureAttention)
    ].join("\n");
  }

  function renderSummary() {
    const summary = content.summary;
    const conclusion = content.conclusion;
    return `
      ${storageNotice()}
      ${stageHeader(summary.eyebrow, summary.heading, summary.instruction)}
      <div class="summary-layout">
        <pre class="summary-output" id="summary-output" tabindex="0">${escapeHtml(summaryText())}</pre>
        <div class="summary-actions">
          <button class="button" type="button" data-action="copy-summary">${escapeHtml(summary.copyLabel)}</button>
          <button class="button button-secondary" type="button" data-action="download-summary">${escapeHtml(
            summary.downloadLabel
          )}</button>
          <button class="button button-secondary" type="button" data-action="start-again">${escapeHtml(
            summary.startAgainLabel
          )}</button>
          <p class="privacy-note">No response is sent to Canvas or any outside service.</p>
        </div>
      </div>

      <section class="conclusion-section" aria-labelledby="conclusion-heading">
        <header class="conclusion-header">
          <p class="eyebrow">${escapeHtml(conclusion.eyebrow)}</p>
          <h2 id="conclusion-heading">${escapeHtml(conclusion.heading)}</h2>
          <p>${escapeHtml(conclusion.body)}</p>
        </header>
        <ol class="conclusion-principles">
          ${conclusion.principles
            .map(
              (principle) => `
                <li>
                  <span class="principle-number" aria-hidden="true">${escapeHtml(principle.number)}</span>
                  <h3>${escapeHtml(principle.title)}</h3>
                  <p>${escapeHtml(principle.body)}</p>
                </li>`
            )
            .join("")}
        </ol>
        <div class="conclusion-field-card">
          <div>
            <p class="field-note-label">Field note / final</p>
            <h3>${escapeHtml(conclusion.fieldHeading)}</h3>
          </div>
          <ul>
            ${conclusion.fieldNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
          </ul>
        </div>
        <blockquote class="closing-line">${escapeHtml(conclusion.closingLine)}</blockquote>
      </section>`;
  }

  function render(options = {}) {
    const { focusHeading = false, focusSelector = null } = options;
    renderStageNavigation();
    clearButton.disabled = false;
    clearButton.textContent = content.utility.clearProgressLabel;
    clearDialogCopy.textContent = content.utility.clearConfirm;
    clearCancel.textContent = content.utility.clearCancelLabel;
    clearConfirm.textContent = content.utility.clearConfirmLabel;

    const views = {
      intro: renderIntro,
      arrange: renderArrange,
      "sequence-feedback": renderSequenceFeedback,
      remove: renderRemoval,
      choose: renderChoose,
      reflect: renderReflection,
      summary: renderSummary
    };

    app.innerHTML = views[state.stage]();
    app.setAttribute("aria-busy", "false");

    window.requestAnimationFrame(() => {
      if (focusSelector) {
        app.querySelector(focusSelector)?.focus();
      } else if (focusHeading) {
        app.querySelector("h1")?.focus();
        document.querySelector("#activity-main")?.scrollIntoView({ block: "start" });
      }
    });
  }

  function goToStage(stage) {
    uiError = null;
    state.stage = stage;
    saveState();
    render({ focusHeading: true });
  }

  function moveFrame(id, action) {
    const from = state.order.indexOf(id);
    if (from < 0) return;
    let to = from;
    if (action === "move-start") to = 0;
    if (action === "move-left") to = Math.max(0, from - 1);
    if (action === "move-right") to = Math.min(state.order.length - 1, from + 1);
    if (action === "move-end") to = state.order.length - 1;
    if (to === from) return;

    const [moved] = state.order.splice(from, 1);
    state.order.splice(to, 0, moved);
    state.sequenceCategory = null;
    saveState();
    const message = fillTemplate(content.arrange.movedMessage, {
      label: frameMap.get(id).label,
      position: to + 1
    });
    render({ focusSelector: `[data-action="${action}"][data-id="${id}"]` });
    announce(message);
  }

  function resetActivity() {
    clearSavedState();
    state = createDefaultState();
    uiError = null;
    render({ focusHeading: true });
  }

  function openClearDialog() {
    dialogReturnFocus = document.activeElement;
    clearDialog.hidden = false;
    clearCancel.focus();
  }

  function closeClearDialog() {
    clearDialog.hidden = true;
    dialogReturnFocus?.focus();
  }

  async function copySummary() {
    const text = summaryText();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      showToast(content.summary.copiedLabel);
    } catch (error) {
      const output = document.querySelector("#summary-output");
      const range = document.createRange();
      range.selectNodeContents(output);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      showToast("The summary is selected. Use your browser’s copy command.");
    }
  }

  function downloadSummary() {
    const blob = new Blob([summaryText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "DOC-515-sequence-builder-reflection.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  app.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "begin") goToStage("arrange");
    else if (["move-start", "move-left", "move-right", "move-end"].includes(action)) moveFrame(id, action);
    else if (action === "reset-order") {
      state.order = [...content.scrambledOrder];
      state.sequenceCategory = null;
      state.showComparison = false;
      saveState();
      render({ focusSelector: '[data-action="reset-order"]' });
      announce(content.arrange.resetMessage);
    } else if (action === "check-sequence") {
      state.sequenceCategory = classifySequence(state.order);
      state.showComparison = false;
      state.stage = "sequence-feedback";
      saveState();
      const feedback = content.sequenceFeedback.categories[state.sequenceCategory];
      render({ focusHeading: true });
      announce(`${feedback.label}. ${feedback.body}`);
    } else if (action === "toggle-comparison") {
      state.showComparison = !state.showComparison;
      saveState();
      render({ focusSelector: '[data-action="toggle-comparison"]' });
    } else if (action === "continue-remove") {
      goToStage("remove");
    } else if (action === "select-removal") {
      state.selectedRemovalId = id;
      uiError = null;
      saveState();
      render({ focusSelector: `[data-action="select-removal"][data-id="${id}"]` });
    } else if (action === "remove-shot") {
      if (!state.selectedRemovalId) {
        uiError = { scope: "remove-select", message: content.removal.selectionRequired };
        render({ focusSelector: '[data-action="remove-shot"]' });
        announce(content.removal.selectionRequired);
        return;
      }
      state.removedId = state.selectedRemovalId;
      state.selectedRemovalId = null;
      state.removalResponse = "";
      state.removalFeedbackShown = false;
      uiError = null;
      saveState();
      const removed = frameMap.get(state.removedId);
      render({ focusSelector: '[data-action="restore-shot"]' });
      announce(`${removed.label} removed from the sequence.`);
    } else if (action === "restore-shot") {
      const restored = frameMap.get(state.removedId);
      state.removedId = null;
      state.removalResponse = "";
      state.removalFeedbackShown = false;
      uiError = null;
      saveState();
      render();
      announce(`${restored.label} restored to the sequence.`);
    } else if (action === "show-removal-feedback") {
      if (state.removalResponse.trim().length < content.removal.minimumCharacters) {
        uiError = { scope: "removal", message: content.removal.responseRequired };
        render({ focusSelector: "#removal-response" });
        announce(content.removal.responseRequired);
        return;
      }
      uiError = null;
      state.removalFeedbackShown = true;
      saveState();
      render({ focusSelector: '[data-action="continue-choose"]' });
      announce(content.removal.feedback[state.removedId]);
    } else if (action === "continue-choose") {
      goToStage("choose");
    } else if (action === "select-indispensable") {
      state.selectedIndispensableId = id;
      state.indispensableFeedbackShown = false;
      uiError = null;
      saveState();
      render({ focusSelector: `[data-action="select-indispensable"][data-id="${id}"]` });
    } else if (action === "show-indispensable-feedback") {
      if (!state.selectedIndispensableId) {
        uiError = { scope: "indispensable", message: content.indispensable.selectionRequired };
        render({ focusSelector: `[data-action="show-indispensable-feedback"]` });
        announce(content.indispensable.selectionRequired);
        return;
      }
      if (state.indispensableResponse.trim().length < content.indispensable.minimumCharacters) {
        uiError = { scope: "indispensable", message: content.indispensable.responseRequired };
        render({ focusSelector: "#indispensable-response" });
        announce(content.indispensable.responseRequired);
        return;
      }
      uiError = null;
      state.indispensableFeedbackShown = true;
      saveState();
      render({ focusSelector: '[data-action="continue-reflection"]' });
      announce(content.indispensable.feedback[state.selectedIndispensableId]);
    } else if (action === "continue-reflection") {
      goToStage("reflect");
    } else if (action === "create-summary") {
      goToStage("summary");
    } else if (action === "copy-summary") {
      copySummary();
    } else if (action === "download-summary") {
      downloadSummary();
    } else if (action === "start-again") {
      resetActivity();
    }
  });

  app.addEventListener("input", (event) => {
    const field = event.target;
    if (field.matches('[data-field="removalResponse"]')) {
      state.removalResponse = field.value;
      document.querySelector("#removal-count").textContent = `${field.value.length} characters`;
      saveState();
    } else if (field.matches('[data-field="indispensableResponse"]')) {
      state.indispensableResponse = field.value;
      document.querySelector("#indispensable-count").textContent = `${field.value.length} characters`;
      saveState();
    } else if (field.matches("[data-reflection-id]")) {
      state.reflection[field.dataset.reflectionId] = field.value;
      saveState();
    }
  });

  app.addEventListener("dragstart", (event) => {
    const card = event.target.closest('.frame-card[draggable="true"]');
    if (!card) return;
    dragId = card.dataset.frameId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragId);
  });

  app.addEventListener("dragover", (event) => {
    const card = event.target.closest('.frame-card[draggable="true"]');
    if (!card || card.dataset.frameId === dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    app.querySelectorAll(".is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
    card.classList.add("is-drop-target");
  });

  app.addEventListener("drop", (event) => {
    const targetCard = event.target.closest('.frame-card[draggable="true"]');
    if (!targetCard || !dragId || targetCard.dataset.frameId === dragId) return;
    event.preventDefault();
    const targetId = targetCard.dataset.frameId;
    const grid = targetCard.parentElement;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const rect = targetCard.getBoundingClientRect();
    const after = columns === 1 ? event.clientY > rect.top + rect.height / 2 : event.clientX > rect.left + rect.width / 2;
    const from = state.order.indexOf(dragId);
    const [moved] = state.order.splice(from, 1);
    let insertAt = state.order.indexOf(targetId);
    if (after) insertAt += 1;
    state.order.splice(insertAt, 0, moved);
    state.sequenceCategory = null;
    saveState();
    const movedFrame = frameMap.get(moved);
    const message = fillTemplate(content.arrange.movedMessage, {
      label: movedFrame.label,
      position: insertAt + 1
    });
    dragId = null;
    render();
    announce(message);
  });

  app.addEventListener("dragend", () => {
    dragId = null;
    app.querySelectorAll(".is-dragging, .is-drop-target").forEach((item) => {
      item.classList.remove("is-dragging", "is-drop-target");
    });
  });

  clearButton.addEventListener("click", openClearDialog);
  clearCancel.addEventListener("click", closeClearDialog);
  clearConfirm.addEventListener("click", () => {
    clearDialog.hidden = true;
    resetActivity();
  });
  clearDialog.addEventListener("click", (event) => {
    if (event.target === clearDialog) closeClearDialog();
  });
  clearDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeClearDialog();
    }
    if (event.key === "Tab") {
      const buttons = [clearCancel, clearConfirm];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  async function initialize() {
    try {
      const response = await fetch("data/sequence-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Content request failed with ${response.status}`);
      content = await response.json();
      frameMap = new Map(content.frames.map((frame) => [frame.id, frame]));
      state = loadState();
      document.title = content.title;
      render();
    } catch (error) {
      app.setAttribute("aria-busy", "false");
      app.innerHTML = `
        <section class="error-panel" role="alert">
          <p class="eyebrow">DOC 515 · Sequence Builder</p>
          <h1>The sequence could not load.</h1>
          <p>Make sure the activity is opened from a local or hosted web server and that <code>data/sequence-data.json</code> is available.</p>
        </section>`;
    }
  }

  initialize();
})();
