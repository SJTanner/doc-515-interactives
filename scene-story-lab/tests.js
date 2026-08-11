(async function () {
  "use strict";
  var output = document.getElementById("results");
  var core = window.DOC515SceneStoryCore;
  var passed = 0;
  var failed = 0;
  var lines = [];

  function test(name, condition) {
    if (condition) { passed += 1; lines.push("PASS  " + name); }
    else { failed += 1; lines.push("FAIL  " + name); }
  }

  try {
    var response = await fetch("data/scene-story-data.json", { cache: "no-store" });
    var data = await response.json();
    var fresh = core.createState(data);
    test("creates five-part starting state", fresh.currentStep === 0 && fresh.sceneOrder.length === 4);
    test("uses canonical example order", fresh.sceneOrder.join(",") === "preparation,complication,response,aftermath");
    var normalized = core.normalizeState(data, { currentStep: 99, scale: "bad", sceneOrder: ["bad"], answers: { workingTitle: "Test" } });
    test("clamps invalid navigation state", normalized.currentStep === 4);
    test("repairs invalid scale and order", normalized.scale === "shot" && normalized.sceneOrder.join(",") === fresh.sceneOrder.join(","));
    test("preserves saved writing", normalized.answers.workingTitle === "Test");
    test("canonical order receives narrative feedback", core.orderMessage(data, fresh.sceneOrder).includes("causal progression"));
    test("alternate order receives non-scored reflection", core.orderMessage(data, fresh.sceneOrder.slice().reverse()).includes("different story proposal"));
    var exportText = core.buildPlan(data, { workingTitle: "My Film", scene1Action: "A person attempts a task." });
    test("text export includes title and answer", exportText.includes("SCENE-TO-STORY PLAN") && exportText.includes("My Film") && exportText.includes("A person attempts a task."));
    test("text export marks blank fields", exportText.includes("Not yet drafted"));
  } catch (error) {
    failed += 1; lines.push("ERROR " + error.message);
  }

  lines.push("", passed + " passed, " + failed + " failed");
  output.textContent = lines.join("\n");
  document.title = failed ? "FAIL — Scene to Story Lab tests" : "PASS — Scene to Story Lab tests";
})();
