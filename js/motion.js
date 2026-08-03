// js/motion.js —— GSAP 探测/降级、字符拆分、打字机、count-up、滚动浮现

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitChars(el) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const spans = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "hero-char";
    span.textContent = ch === " " ? " " : ch;
    span.setAttribute("aria-hidden", "true");
    el.appendChild(span);
    spans.push(span);
  }
  return spans;
}

function animateHeroTitle(el) {
  const spans = splitChars(el);
  if (prefersReducedMotion()) return;

  spans.forEach((s) => s.classList.add("pre-anim"));

  if (window.gsap) {
    window.gsap.to(spans, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: spans.length > 20 ? 0.03 : 0.04,
      ease: "power3.out",
    });
  } else {
    spans.forEach((s, idx) => {
      setTimeout(() => {
        s.style.transition = `opacity 0.4s var(--ease-out), transform 0.4s var(--ease-out)`;
        s.classList.remove("pre-anim");
      }, idx * 40);
    });
  }
}

function typewriter(el, text, charDelay) {
  el.setAttribute("aria-label", text);
  const visible = document.createElement("span");
  visible.setAttribute("aria-hidden", "true");
  const cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";
  el.textContent = "";
  el.appendChild(visible);
  el.appendChild(cursor);

  if (prefersReducedMotion()) {
    visible.textContent = text;
    cursor.style.display = "none";
    return;
  }

  let i = 0;
  function step() {
    if (i <= text.length) {
      visible.textContent = text.slice(0, i);
      i++;
      setTimeout(step, charDelay);
    } else {
      cursor.style.display = "none";
    }
  }
  step();
}

function countUp(el, target, duration) {
  if (prefersReducedMotion()) {
    el.textContent = target;
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(2, -10 * t);
    el.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = target;
  }
  requestAnimationFrame(frame);
}

function observeReveal(root) {
  const targets = Array.from((root || document).querySelectorAll(".reveal:not([data-revealed])"));
  if (targets.length === 0) return;
  targets.forEach((t) => t.setAttribute("data-revealed", "pending"));

  if (prefersReducedMotion()) {
    targets.forEach((t) => t.classList.add("revealed"));
    return;
  }
  targets.forEach((t) => t.classList.add("pre-anim"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          const delay = idx * 80;
          setTimeout(() => {
            entry.target.classList.remove("pre-anim");
            entry.target.classList.add("revealed");
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  targets.forEach((t) => observer.observe(t));
}

function loadGSAP(timeoutMs) {
  return new Promise((resolve) => {
    if (window.gsap) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    const timer = setTimeout(() => resolve(false), timeoutMs);
    script.onload = () => { clearTimeout(timer); resolve(!!window.gsap); };
    script.onerror = () => { clearTimeout(timer); resolve(false); };
    document.head.appendChild(script);
  });
}

window.Motion = { animateHeroTitle, typewriter, countUp, observeReveal, loadGSAP, prefersReducedMotion };
