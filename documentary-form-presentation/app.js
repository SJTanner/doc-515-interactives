(function () {
  "use strict";

  const STORAGE_KEY = "doc515-lesson2-presentation-slide";
  const stage = document.getElementById("slide-stage");
  const transcript = document.getElementById("slide-transcript");
  const count = document.getElementById("slide-count");
  const status = document.getElementById("status");
  const select = document.getElementById("slide-select");
  const previous = document.getElementById("previous-slide");
  const next = document.getElementById("next-slide");
  let content;
  let index = 0;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function announce(message) {
    status.textContent = "";
    window.requestAnimationFrame(() => { status.textContent = message; });
  }

  function renderViewingLinks(slide) {
    if (!Array.isArray(slide.links) || slide.links.length === 0) return "";
    const items = slide.links.map((link) => `
      <li>
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(link.label)} — official viewing page <span aria-hidden="true">↗</span>
        </a>
      </li>`).join("");
    return `<nav class="viewing-links" aria-label="Official viewing pages"><h2>Official viewing pages</h2><ul>${items}</ul></nav>`;
  }

  function render(shouldAnnounce = true) {
    const slide = content.slides[index];
    stage.innerHTML = `<figure><img src="${escapeHtml(slide.image)}" alt="Slide ${index + 1} of ${content.slides.length}: ${escapeHtml(slide.title)}"><figcaption>${escapeHtml(slide.title)}</figcaption></figure>${renderViewingLinks(slide)}`;
    transcript.innerHTML = `<h2>Slide ${index + 1}: ${escapeHtml(slide.title)}</h2><p>${escapeHtml(slide.transcript)}</p>`;
    count.textContent = `Slide ${index + 1} of ${content.slides.length}`;
    select.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === content.slides.length - 1;
    stage.setAttribute("aria-busy", "false");
    try { window.localStorage.setItem(STORAGE_KEY, String(index)); } catch (error) { /* Presentation remains usable without persistence. */ }
    if (shouldAnnounce) announce(`${count.textContent}: ${slide.title}`);
  }

  function goTo(nextIndex) {
    index = Math.max(0, Math.min(nextIndex, content.slides.length - 1));
    render();
  }

  async function initialize() {
    try {
      const response = await fetch("data/slides.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Slide data request failed: ${response.status}`);
      content = await response.json();
      select.innerHTML = content.slides.map((slide, slideIndex) => `<option value="${slideIndex}">${slideIndex + 1}. ${escapeHtml(slide.title)}</option>`).join("");
      try {
        const saved = Number(window.localStorage.getItem(STORAGE_KEY));
        if (Number.isInteger(saved) && saved >= 0 && saved < content.slides.length) index = saved;
      } catch (error) { /* Use slide one. */ }
      previous.addEventListener("click", () => goTo(index - 1));
      next.addEventListener("click", () => goTo(index + 1));
      select.addEventListener("change", () => goTo(Number(select.value)));
      document.addEventListener("keydown", (event) => {
        if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
        if (event.key === "ArrowLeft") goTo(index - 1);
        if (event.key === "ArrowRight") goTo(index + 1);
        if (event.key === "Home") goTo(0);
        if (event.key === "End") goTo(content.slides.length - 1);
      });
      render(false);
    } catch (error) {
      stage.setAttribute("aria-busy", "false");
      stage.innerHTML = `<div role="alert"><h2>Unable to load the presentation</h2><p>Run this folder through a local web server and confirm that data/slides.json is available.</p></div>`;
    }
  }

  initialize();
})();
