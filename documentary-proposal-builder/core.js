(function (root) {
  "use strict";
  function createState(data) {
    const answers = {};
    data.steps.forEach((step) => step.fields.forEach((field) => { answers[field.id] = ""; }));
    return { version: data.version, currentStep: 0, teacherMode: false, answers };
  }
  function normalizeState(data, saved) {
    const base = createState(data);
    if (!saved || saved.version !== data.version) return base;
    return { ...base, currentStep: Math.max(0, Math.min(Number(saved.currentStep) || 0, data.steps.length - 1)), teacherMode: Boolean(saved.teacherMode), answers: { ...base.answers, ...(saved.answers || {}) } };
  }
  function sectionText(step, answers) {
    const lines = [step.title.toUpperCase()];
    step.fields.forEach((field) => { const value = String(answers[field.id] || "").trim(); if (value) lines.push(`\n${field.label}\n${value}`); });
    return lines.join("\n");
  }
  function buildProposal(data, answers) {
    const sections = data.steps.filter((step) => step.includeInProposal !== false).map((step) => sectionText(step, answers));
    return `${data.export.proposalTitle}\n${"=".repeat(data.export.proposalTitle.length)}\n\n${sections.join("\n\n")}`;
  }
  function buildQuestions(data, answers) {
    const selected = data.export.questionFields.map((id) => {
      const field = data.steps.flatMap((step) => step.fields).find((item) => item.id === id);
      const value = String(answers[id] || "").trim();
      return value ? `${field?.label || id}\n${value}` : "";
    }).filter(Boolean);
    return `${data.export.questionsTitle}\n${"=".repeat(data.export.questionsTitle.length)}\n\n${selected.join("\n\n") || "No development questions have been entered yet."}`;
  }
  root.DOC515ProposalCore = { createState, normalizeState, buildProposal, buildQuestions };
})(window);
