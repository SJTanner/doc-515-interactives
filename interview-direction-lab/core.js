(function (root) {
  "use strict";

  function allFields(data) {
    return data.steps.flatMap(function (step) { return step.fields; });
  }

  function createState(data) {
    var answers = {};
    allFields(data).forEach(function (field) {
      answers[field.id] = field.type === "checkboxes" ? [] : "";
    });
    return { currentStep: 0, exampleMode: false, answers: answers };
  }

  function normalizeState(data, saved) {
    var clean = createState(data);
    if (!saved || typeof saved !== "object") return clean;
    clean.currentStep = Math.max(0, Math.min(Number(saved.currentStep) || 0, data.steps.length - 1));
    clean.exampleMode = Boolean(saved.exampleMode);
    allFields(data).forEach(function (field) {
      var value = saved.answers && saved.answers[field.id];
      if (field.type === "checkboxes") {
        var allowed = field.options.map(function (option) { return option.value; });
        clean.answers[field.id] = Array.isArray(value) ? value.filter(function (item) { return allowed.includes(item); }) : [];
      } else if (typeof value === "string") {
        clean.answers[field.id] = value;
      }
    });
    return clean;
  }

  function displayValue(field, value) {
    if (field.type === "checkboxes") {
      if (!Array.isArray(value) || !value.length) return "Not yet selected.";
      return field.options.filter(function (option) { return value.includes(option.value); }).map(function (option) { return option.label; }).join("; ");
    }
    if (field.type === "radio") {
      var match = field.options.find(function (option) { return option.value === value; });
      return match ? match.label : "Not yet entered.";
    }
    return value && value.trim() ? value.trim() : "Not yet entered.";
  }

  function buildPlan(data, answers) {
    var lines = [data.export.title, ""];
    data.steps.forEach(function (step) {
      lines.push(step.title.toUpperCase());
      step.fields.forEach(function (field) {
        lines.push(field.label);
        lines.push(displayValue(field, answers[field.id]));
        lines.push("");
      });
    });
    lines.push(data.export.disclosure);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  root.DOC515InterviewLabCore = {
    allFields: allFields,
    createState: createState,
    normalizeState: normalizeState,
    displayValue: displayValue,
    buildPlan: buildPlan
  };
})(window);
