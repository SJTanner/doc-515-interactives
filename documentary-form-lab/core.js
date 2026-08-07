(function (root) {
  "use strict";

  const VERSION = 1;

  function createInitialState(formIds) {
    const treatments = {};
    (formIds || []).forEach((id) => {
      treatments[id] = {
        ingredients: [],
        sceneStrategy: "",
        filmmakerPresence: "",
        evidence: "",
        imageSound: "",
        ethicalPressure: ""
      };
    });

    return {
      version: VERSION,
      stageIndex: 0,
      maxStage: 0,
      activeFormId: formIds?.[0] || "",
      teacherMode: false,
      treatments,
      comparison: {
        leftForm: formIds?.[0] || "",
        rightForm: formIds?.[1] || "",
        authority: "",
        emotion: "",
        ethics: "",
        presence: "",
        scenes: ""
      },
      ownProject: {
        workingTitle: "",
        story: "",
        access: "",
        firstForm: formIds?.[0] || "",
        secondForm: formIds?.[1] || "",
        firstReveals: "",
        firstRisks: "",
        secondContributes: "",
        nextTest: ""
      },
      reflection: {
        provisionalForm: formIds?.[0] || "",
        provisionalReason: "",
        secondContribution: "",
        hiddenRisk: ""
      }
    };
  }

  function normalizeState(saved, formIds) {
    const fresh = createInitialState(formIds);
    if (!saved || saved.version !== VERSION) return fresh;

    const normalized = Object.assign(fresh, saved);
    normalized.treatments = {};
    formIds.forEach((id) => {
      normalized.treatments[id] = Object.assign({}, fresh.treatments[id], saved.treatments?.[id] || {});
      if (!Array.isArray(normalized.treatments[id].ingredients)) normalized.treatments[id].ingredients = [];
    });
    normalized.comparison = Object.assign({}, fresh.comparison, saved.comparison || {});
    normalized.ownProject = Object.assign({}, fresh.ownProject, saved.ownProject || {});
    normalized.reflection = Object.assign({}, fresh.reflection, saved.reflection || {});
    return normalized;
  }

  function moveItem(items, fromIndex, toIndex) {
    const next = Array.isArray(items) ? items.slice() : [];
    if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length || fromIndex === toIndex) return next;
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    return next;
  }

  function treatmentStatus(treatment) {
    if (!treatment) return "Not started";
    const fields = [
      treatment.sceneStrategy,
      treatment.filmmakerPresence,
      treatment.evidence,
      treatment.imageSound,
      treatment.ethicalPressure
    ].filter((value) => String(value || "").trim());
    if ((treatment.ingredients || []).length >= 2 && fields.length === 5) return "Drafted";
    if ((treatment.ingredients || []).length || fields.length) return "In progress";
    return "Not started";
  }

  function allTreatmentsDrafted(treatments, formIds) {
    return formIds.every((id) => treatmentStatus(treatments[id]) === "Drafted");
  }

  function formTitle(content, id) {
    return content.forms.find((form) => form.id === id)?.title || id || "Not selected";
  }

  function ingredientText(content, id) {
    for (const group of content.storyWorld.assetGroups) {
      const item = group.items.find((candidate) => candidate.id === id);
      if (item) return `${group.title}: ${item.text}`;
    }
    return id;
  }

  function buildSummary(content, state) {
    const lines = [
      content.export.title,
      content.export.course,
      "",
      "COMMUNITY-GARDEN FORM TREATMENTS"
    ];

    content.forms.forEach((form) => {
      const treatment = state.treatments[form.id];
      lines.push("", form.title.toUpperCase());
      lines.push(`Selected story material: ${(treatment.ingredients || []).map((id) => ingredientText(content, id)).join("; ") || "Not yet entered"}`);
      lines.push(`Likely scene strategy: ${treatment.sceneStrategy || "Not yet entered"}`);
      lines.push(`Filmmaker presence: ${treatment.filmmakerPresence || "Not yet entered"}`);
      lines.push(`Evidence: ${treatment.evidence || "Not yet entered"}`);
      lines.push(`Image and sound: ${treatment.imageSound || "Not yet entered"}`);
      lines.push(`Ethical pressure: ${treatment.ethicalPressure || "Not yet entered"}`);
    });

    const comparison = state.comparison;
    lines.push(
      "",
      "TWO-FORM COMPARISON",
      `${formTitle(content, comparison.leftForm)} compared with ${formTitle(content, comparison.rightForm)}`,
      `Authority: ${comparison.authority || "Not yet entered"}`,
      `Emotion: ${comparison.emotion || "Not yet entered"}`,
      `Ethics: ${comparison.ethics || "Not yet entered"}`,
      `Filmmaker presence: ${comparison.presence || "Not yet entered"}`,
      `Likely scenes: ${comparison.scenes || "Not yet entered"}`
    );

    const own = state.ownProject;
    lines.push(
      "",
      "MY DOCUMENTARY IDEA",
      `Working title: ${own.workingTitle || "Not yet entered"}`,
      `Specific story: ${own.story || "Not yet entered"}`,
      `Access and filmable situation: ${own.access || "Not yet entered"}`,
      `First form tested: ${formTitle(content, own.firstForm)}`,
      `What it reveals: ${own.firstReveals || "Not yet entered"}`,
      `What it risks hiding: ${own.firstRisks || "Not yet entered"}`,
      `Second form tested: ${formTitle(content, own.secondForm)}`,
      `What it could contribute: ${own.secondContributes || "Not yet entered"}`,
      `Next access or scene test: ${own.nextTest || "Not yet entered"}`
    );

    const reflection = state.reflection;
    lines.push(
      "",
      "PROVISIONAL FORM STATEMENT",
      `Provisional dominant form: ${formTitle(content, reflection.provisionalForm)}`,
      `Why this form currently serves the story: ${reflection.provisionalReason || "Not yet entered"}`,
      `What a second form could contribute: ${reflection.secondContribution || "Not yet entered"}`,
      `What the provisional form may risk hiding: ${reflection.hiddenRisk || "Not yet entered"}`,
      "",
      content.export.footer
    );

    return lines.join("\n");
  }

  root.DocFormCore = {
    VERSION,
    createInitialState,
    normalizeState,
    moveItem,
    treatmentStatus,
    allTreatmentsDrafted,
    buildSummary
  };
})(window);
