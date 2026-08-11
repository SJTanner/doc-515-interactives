(function (root) {
  "use strict";

  function makeScene(index) {
    return {
      id: "scene-" + (index + 1),
      title: "",
      role: "",
      action: "",
      place: "",
      contributor: "",
      tension: "",
      evidence: "",
      interviewMode: "none",
      interviewPlan: ""
    };
  }

  function createState(data) {
    return {
      currentStep: 0,
      selectedEssential: data.sceneEssentials[0].id,
      selectedExampleTest: data.sceneTests[0].id,
      exampleOrder: data.example.scenes.map(function (scene) { return scene.id; }),
      project: { subject: "", contributor: "", storyQuestion: "", stakes: "" },
      scenes: [makeScene(0), makeScene(1), makeScene(2)],
      interviews: {
        staticWhat: "", staticWhere: "", staticPurpose: "",
        dynamicWhat: "", dynamicWhere: "", dynamicPurpose: "",
        relationship: ""
      },
      sequenceOrder: ["scene-1", "scene-2", "scene-3"],
      reflections: { orderReason: "", crucialScene: "", missingEvidence: "" }
    };
  }

  function normalizeState(data, saved) {
    var fresh = createState(data);
    if (!saved || typeof saved !== "object") return fresh;
    var scenes = Array.isArray(saved.scenes) && saved.scenes.length
      ? saved.scenes.slice(0, 8).map(function (scene, index) { return Object.assign(makeScene(index), scene, { id: "scene-" + (index + 1) }); })
      : fresh.scenes;
    var validIds = scenes.map(function (scene) { return scene.id; });
    var order = Array.isArray(saved.sequenceOrder)
      ? saved.sequenceOrder.filter(function (id) { return validIds.includes(id); })
      : [];
    validIds.forEach(function (id) { if (!order.includes(id)) order.push(id); });
    return {
      currentStep: Math.max(0, Math.min(Number(saved.currentStep) || 0, data.navigation.length - 1)),
      selectedEssential: data.sceneEssentials.some(function (item) { return item.id === saved.selectedEssential; }) ? saved.selectedEssential : fresh.selectedEssential,
      selectedExampleTest: data.sceneTests.some(function (item) { return item.id === saved.selectedExampleTest; }) ? saved.selectedExampleTest : fresh.selectedExampleTest,
      exampleOrder: Array.isArray(saved.exampleOrder) && saved.exampleOrder.length === data.example.scenes.length ? saved.exampleOrder : fresh.exampleOrder,
      project: Object.assign(fresh.project, saved.project || {}),
      scenes: scenes,
      interviews: Object.assign(fresh.interviews, saved.interviews || {}),
      sequenceOrder: order,
      reflections: Object.assign(fresh.reflections, saved.reflections || {})
    };
  }

  function addScene(state) {
    if (state.scenes.length >= 8) return state;
    var next = makeScene(state.scenes.length);
    state.scenes.push(next);
    state.sequenceOrder.push(next.id);
    return state;
  }

  function removeScene(state, id) {
    if (state.scenes.length <= 1) return state;
    state.scenes = state.scenes.filter(function (scene) { return scene.id !== id; });
    state.scenes = state.scenes.map(function (scene, index) { return Object.assign({}, scene, { id: "scene-" + (index + 1) }); });
    state.sequenceOrder = state.scenes.map(function (scene) { return scene.id; });
    return state;
  }

  function move(order, id, direction) {
    var index = order.indexOf(id);
    var target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return order.slice();
    var next = order.slice();
    next[index] = next[target];
    next[target] = id;
    return next;
  }

  function valueOrBlank(value) {
    return String(value || "").trim() || "Not yet drafted";
  }

  function buildExport(data, state) {
    var lines = [
      data.title,
      "DOC 515 · Lesson 6",
      "",
      "PROJECT",
      "Subject: " + valueOrBlank(state.project.subject),
      "Central contributor: " + valueOrBlank(state.project.contributor),
      "Story question: " + valueOrBlank(state.project.storyQuestion),
      "Stakes or possible change: " + valueOrBlank(state.project.stakes),
      "",
      "SCENE LIST"
    ];
    state.sequenceOrder.forEach(function (id, index) {
      var scene = state.scenes.find(function (item) { return item.id === id; });
      if (!scene) return;
      lines.push("", (index + 1) + ". " + valueOrBlank(scene.title));
      lines.push("Story role: " + valueOrBlank(scene.role));
      lines.push("Present-time action: " + valueOrBlank(scene.action));
      lines.push("Place and time: " + valueOrBlank(scene.place));
      lines.push("Contributor: " + valueOrBlank(scene.contributor));
      lines.push("Tension, decision, or change: " + valueOrBlank(scene.tension));
      lines.push("Visual and sound evidence: " + valueOrBlank(scene.evidence));
      lines.push("Interview mode: " + valueOrBlank(scene.interviewMode));
      lines.push("Interview placement: " + valueOrBlank(scene.interviewPlan));
    });
    lines.push("", "STATIC INTERVIEW", "What/who: " + valueOrBlank(state.interviews.staticWhat));
    lines.push("Where: " + valueOrBlank(state.interviews.staticWhere));
    lines.push("Story purpose: " + valueOrBlank(state.interviews.staticPurpose));
    lines.push("", "DYNAMIC INTERVIEW", "What/who: " + valueOrBlank(state.interviews.dynamicWhat));
    lines.push("Where/action: " + valueOrBlank(state.interviews.dynamicWhere));
    lines.push("Story purpose: " + valueOrBlank(state.interviews.dynamicPurpose));
    lines.push("", "RELATIONSHIP BETWEEN INTERVIEWS AND SCENES", valueOrBlank(state.interviews.relationship));
    lines.push("", "SEQUENCE REFLECTION", "Why this order: " + valueOrBlank(state.reflections.orderReason));
    lines.push("Crucial scene: " + valueOrBlank(state.reflections.crucialScene));
    lines.push("Missing evidence or pickup: " + valueOrBlank(state.reflections.missingEvidence));
    lines.push("", "This plan was created privately in the browser. No score was calculated and no data was submitted.");
    return lines.join("\n");
  }

  root.DOC515ScenePlanningCore = {
    createState: createState,
    normalizeState: normalizeState,
    addScene: addScene,
    removeScene: removeScene,
    move: move,
    buildExport: buildExport
  };
})(window);
