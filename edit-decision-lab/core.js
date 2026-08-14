(function (root) {
  "use strict";

  function createClipState(clip) {
    return { id: clip.id, included: true, function: clip.suggestedFunction || "", note: "" };
  }

  function createState(data) {
    var clips = data.example.clips.map(createClipState);
    return {
      contentRevision: data.revision || "",
      currentStep: 0,
      checklist: data.mediaChecklist.reduce(function (out, item) { out[item.id] = false; return out; }, {}),
      selectedPrinciple: data.principles[0].id,
      clips: clips,
      sceneOrder: data.example.sceneOrder.slice(),
      roughCutOrder: data.example.modelRoughCutOrder.slice(),
      gaps: data.gapFields.reduce(function (out, item) { out[item.id] = ""; return out; }, {}),
      reflections: data.reflectionPrompts.reduce(function (out, item) { out[item.id] = ""; return out; }, {})
    };
  }

  function normalizeOrder(saved, valid, fallback) {
    var order = Array.isArray(saved) ? saved.filter(function (id) { return valid.includes(id); }) : [];
    valid.forEach(function (id) { if (!order.includes(id)) order.push(id); });
    return order.length === valid.length ? order : fallback.slice();
  }

  function normalizeState(data, saved) {
    var fresh = createState(data);
    if (!saved || typeof saved !== "object" || saved.contentRevision !== data.revision) return fresh;
    var clipIds = data.example.clips.map(function (clip) { return clip.id; });
    var sceneIds = data.example.roughCutScenes.map(function (scene) { return scene.id; });
    var savedClips = Array.isArray(saved.clips) ? saved.clips : [];
    fresh.currentStep = Math.max(0, Math.min(Number(saved.currentStep) || 0, data.navigation.length - 1));
    fresh.checklist = Object.assign(fresh.checklist, saved.checklist || {});
    fresh.selectedPrinciple = data.principles.some(function (item) { return item.id === saved.selectedPrinciple; }) ? saved.selectedPrinciple : fresh.selectedPrinciple;
    fresh.clips = data.example.clips.map(function (clip) {
      return Object.assign(createClipState(clip), savedClips.find(function (item) { return item.id === clip.id; }) || {}, { id: clip.id });
    });
    fresh.sceneOrder = normalizeOrder(saved.sceneOrder, clipIds, data.example.sceneOrder);
    fresh.roughCutOrder = normalizeOrder(saved.roughCutOrder, sceneIds, data.example.modelRoughCutOrder);
    fresh.gaps = Object.assign(fresh.gaps, saved.gaps || {});
    fresh.reflections = Object.assign(fresh.reflections, saved.reflections || {});
    return fresh;
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

  function setClipIncluded(state, id, included) {
    var clip = state.clips.find(function (item) { return item.id === id; });
    if (clip) clip.included = Boolean(included);
    return state;
  }

  function sceneFeedback(data, state) {
    var included = state.sceneOrder.filter(function (id) {
      var clip = state.clips.find(function (item) { return item.id === id; });
      return clip && clip.included;
    });
    if (included.length < 3) return "The scene is very compressed. Check whether the audience can still experience orientation, developing action, and a consequence—not merely understand the topic.";
    var first = included[0];
    var last = included[included.length - 1];
    var turnIndex = included.indexOf("weather-turn");
    var decisionIndex = included.indexOf("mara-decision");
    var hasTurn = turnIndex >= 0 && decisionIndex > turnIndex;
    var openingWorks = ["shore-dawn", "mara-arrives", "safety-briefing"].includes(first);
    var endingWorks = ["final-weigh", "mara-reflects", "shore-after"].includes(last);
    if (openingWorks && hasTurn && endingWorks) return "This construction gives the audience a point of entry, lets the weather interrupt the process, follows Mara's decision, and reaches evidence or consequence. It is one plausible scene—not a single correct order.";
    if (!hasTurn) return "The material contains an obstacle and a response, but their relationship is unclear or incomplete. Decide whether the cut should show the weather turn before Mara changes the operation.";
    return "The action remains intelligible. Reconsider how the first and last shots shape the scene's dramatic question, emotional emphasis, and degree of closure.";
  }

  function valueOrBlank(value) {
    return String(value || "").trim() || "Not yet drafted";
  }

  function buildExport(data, state) {
    var clipMap = data.example.clips.reduce(function (out, clip) { out[clip.id] = clip; return out; }, {});
    var sceneMap = data.example.roughCutScenes.reduce(function (out, scene) { out[scene.id] = scene; return out; }, {});
    var lines = [data.title, data.courseLabel, "", "MEDIA PROTECTION CHECK"];
    data.mediaChecklist.forEach(function (item) { lines.push((state.checklist[item.id] ? "[x] " : "[ ] ") + item.label); });
    lines.push("", "SELECTS AND SCENE ORDER");
    var selectNumber = 0;
    state.sceneOrder.forEach(function (id, index) {
      var clipState = state.clips.find(function (item) { return item.id === id; });
      var clip = clipMap[id];
      if (!clip || !clipState || !clipState.included) return;
      selectNumber += 1;
      lines.push(selectNumber + ". " + clip.label + " (" + clip.timecode + ")");
      lines.push("Function: " + valueOrBlank(clipState.function));
      lines.push("Editor note: " + valueOrBlank(clipState.note));
    });
    lines.push("", "ROUGH-CUT STRUCTURE");
    state.roughCutOrder.forEach(function (id, index) {
      var scene = sceneMap[id];
      if (scene) lines.push((index + 1) + ". " + scene.title + " — " + scene.summary);
    });
    lines.push("", "GAPS AND PICKUPS");
    data.gapFields.forEach(function (field) { lines.push(field.label + " " + valueOrBlank(state.gaps[field.id])); });
    lines.push("", "EDIT MEMO");
    data.reflectionPrompts.forEach(function (field) { lines.push(field.label + " " + valueOrBlank(state.reflections[field.id])); });
    lines.push("", "This activity provides prompts, not a score or automated verdict. Student work remains in the local browser unless copied or downloaded.");
    return lines.join("\n");
  }

  root.EditLabCore = { createState: createState, normalizeState: normalizeState, move: move, setClipIncluded: setClipIncluded, sceneFeedback: sceneFeedback, buildExport: buildExport };
})(typeof window !== "undefined" ? window : globalThis);
