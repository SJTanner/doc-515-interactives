(async function () {
  "use strict";
  const results = document.getElementById("results");
  function test(name, condition) { const item = document.createElement("li"); item.className = condition ? "pass" : "fail"; item.textContent = `${condition ? "PASS" : "FAIL"}: ${name}`; results.appendChild(item); if (!condition) throw new Error(name); }
  const data = await (await fetch("data/proposal-builder-data.json", { cache:"no-store" })).json();
  const core = window.DOC515ProposalCore;
  const fresh = core.createState(data);
  test("initial state contains every editable field", Object.keys(fresh.answers).length === data.steps.flatMap((step) => step.fields).length);
  fresh.answers.workingTitle = "Test Film"; fresh.answers.treatment = "A test scene unfolds."; fresh.answers.unknowns = "Access date is unknown.";
  const restored = core.normalizeState(data, JSON.parse(JSON.stringify(fresh)));
  test("state survives serialization and restoration", restored.answers.workingTitle === "Test Film");
  test("proposal export contains student title and treatment", core.buildProposal(data, restored.answers).includes("Test Film") && core.buildProposal(data, restored.answers).includes("A test scene unfolds."));
  test("question export contains named unknowns", core.buildQuestions(data, restored.answers).includes("Access date is unknown."));
  const reset = core.createState(data);
  test("reset state removes entered writing", reset.answers.workingTitle === "" && reset.answers.treatment === "");
})();
