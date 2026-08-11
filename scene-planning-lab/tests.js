(async function () {
  "use strict";
  var results = document.getElementById("results");
  var summary = document.getElementById("summary");
  var failures = 0;

  function test(name, assertion) {
    var item = document.createElement("li");
    try {
      if (!assertion()) throw new Error("Assertion returned false");
      item.textContent = "PASS — " + name;
    } catch (error) {
      failures += 1; item.className = "fail"; item.textContent = "FAIL — " + name + ": " + error.message;
    }
    results.appendChild(item);
  }

  try {
    var response = await fetch("data/scene-planning-data.json", { cache: "no-store" });
    var data = await response.json();
    var core = window.DOC515ScenePlanningCore;
    test("Editable JSON loads and contains five navigation sections", function () { return response.ok && data.navigation.length === 5; });
    test("A new plan starts with three scenes", function () { return core.createState(data).scenes.length === 3; });
    test("A scene can be added to the plan and sequence", function () { var state = core.createState(data); core.addScene(state); return state.scenes.length === 4 && state.sequenceOrder.length === 4; });
    test("The scene list is capped at eight", function () { var state = core.createState(data); for (var i = 0; i < 10; i += 1) core.addScene(state); return state.scenes.length === 8; });
    test("At least one scene is retained", function () { var state = core.createState(data); core.removeScene(state, "scene-3"); core.removeScene(state, "scene-2"); core.removeScene(state, "scene-1"); return state.scenes.length === 1; });
    test("Accessible earlier/later movement returns a new order", function () { var order = ["a", "b", "c"]; return core.move(order, "b", -1).join("") === "bac" && order.join("") === "abc"; });
    test("Saved data is normalized with valid scene IDs and sequence entries", function () { var saved = { scenes: [{ title: "A" }, { title: "B" }], sequenceOrder: ["missing"] }; var state = core.normalizeState(data, saved); return state.scenes[0].id === "scene-1" && state.sequenceOrder.join("|") === "scene-1|scene-2"; });
    test("An older example order is replaced with the current story scene IDs", function () { var state = core.normalizeState(data, { exampleOrder: ["old-1", "old-2", "old-3", "old-4"] }); return state.exampleOrder.join("|") === data.example.canonicalOrder.join("|"); });
    test("Text export contains project, scene, static, dynamic, and reflection sections", function () { var text = core.buildExport(data, core.createState(data)); return ["PROJECT", "SCENE LIST", "STATIC INTERVIEW", "DYNAMIC INTERVIEW", "SEQUENCE REFLECTION"].every(function (heading) { return text.includes(heading); }); });
    test("Text export explicitly reports private, non-scored use", function () { var text = core.buildExport(data, core.createState(data)); return text.includes("No score was calculated") && text.includes("no data was submitted"); });
    summary.textContent = failures ? failures + " test(s) failed." : "All 10 tests passed.";
  } catch (error) {
    failures += 1; summary.textContent = "Tests could not run: " + error.message; summary.className = "fail";
  }
})();
