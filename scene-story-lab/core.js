(function (root) {
  "use strict";

  function defaultOrder(data) {
    return data.example.scenes.map(function (scene) { return scene.id; });
  }

  function createState(data) {
    return { currentStep: 0, scale: "shot", revealed: [], sceneOrder: defaultOrder(data), answers: {} };
  }

  function normalizeState(data, saved) {
    var fresh = createState(data);
    if (!saved || typeof saved !== "object") return fresh;
    var validIds = defaultOrder(data);
    var order = Array.isArray(saved.sceneOrder) && saved.sceneOrder.length === validIds.length && saved.sceneOrder.every(function (id) { return validIds.includes(id); })
      ? saved.sceneOrder.slice() : fresh.sceneOrder;
    return {
      currentStep: Math.max(0, Math.min(Number(saved.currentStep) || 0, 4)),
      scale: data.scale.some(function (item) { return item.id === saved.scale; }) ? saved.scale : fresh.scale,
      revealed: Array.isArray(saved.revealed) ? saved.revealed.filter(function (id) { return data.example.anatomy.some(function (item) { return item.id === id; }); }) : [],
      sceneOrder: order,
      answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {}
    };
  }

  function orderMessage(data, order) {
    var canonical = defaultOrder(data);
    if (order.join("|") === canonical.join("|")) return data.example.orderFeedback.canonical;
    var first = data.example.scenes.find(function (scene) { return scene.id === order[0]; });
    var last = data.example.scenes.find(function (scene) { return scene.id === order[order.length - 1]; });
    return data.example.orderFeedback.alternate.replace("{first}", first.shortTitle).replace("{last}", last.shortTitle);
  }

  function fieldValue(answer) {
    return String(answer == null || answer === "" ? "Not yet drafted" : answer);
  }

  function buildPlan(data, answers) {
    var lines = [data.export.title, "", data.export.disclosure, ""];
    data.planSections.forEach(function (section) {
      lines.push(section.title.toUpperCase());
      section.fields.forEach(function (field) {
        lines.push(field.label);
        lines.push(fieldValue(answers[field.id]));
        lines.push("");
      });
    });
    return lines.join("\n").trim() + "\n";
  }

  root.DOC515SceneStoryCore = {
    createState: createState,
    normalizeState: normalizeState,
    orderMessage: orderMessage,
    buildPlan: buildPlan
  };
})(window);
