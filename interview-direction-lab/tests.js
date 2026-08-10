(async function () {
  "use strict";
  var output = document.getElementById("results");
  var results = [];
  function test(name, condition) {
    if (!condition) throw new Error(name);
    results.push("PASS: " + name);
  }
  try {
    var response = await fetch("data/interview-lab-data.json");
    var data = await response.json();
    var core = window.DOC515InterviewLabCore;
    var state = core.createState(data);
    test("JSON contains seven activity sections", data.steps.length === 7);
    test("New state includes every field", Object.keys(state.answers).length === core.allFields(data).length);
    state.answers.workingTitle = "Test Film";
    state.answers.interviewForm = "static";
    state.answers.preflight = ["consent", "sound"];
    var plan = core.buildPlan(data, state.answers);
    test("Text export includes entered title", plan.includes("Test Film"));
    test("Text export resolves radio labels", plan.includes("Static"));
    test("Text export resolves checklist labels", plan.includes("The contributor understands"));
    var normalized = core.normalizeState(data, { currentStep: 99, answers: { interviewForm: "dynamic", preflight: ["sound", "invalid"] } });
    test("Saved step is clamped", normalized.currentStep === 6);
    test("Invalid checklist values are removed", normalized.answers.preflight.length === 1 && normalized.answers.preflight[0] === "sound");
    output.textContent = results.join("\n") + "\n\nAll tests passed.";
    document.body.dataset.tests = "passed";
  } catch (error) {
    output.textContent = results.join("\n") + "\nFAIL: " + error.message;
    document.body.dataset.tests = "failed";
    throw error;
  }
})();
