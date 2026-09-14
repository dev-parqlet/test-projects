"use strict";

/* ── BACKEND URL ── */
var BACKEND_URL = window.BACKEND_URL || "https://api.parqlet.com";

/* ── State ── */
var showDemoModal = false;
var showConfirmPopup = false;
var heroEmail = "";
var heroSubmitting = false;
var heroError = "";

var demoForm = {
  fullName: "",
  email: "",
  company: "",
  building: "",
  city: "",
  role: "",
  details: "",
  website: ""
};
var demoSubmitting = false;
var demoStatus = "idle";

/* ── Init ── */
document.addEventListener("DOMContentLoaded", function () {
  initScrollReveal();
  initEscapeHandler();
  initBodyScrollLock();
  initSkylineScroll();
  initNavDemoBtn();
  initCtaBtn();
  initHeroForm();
  initDemoForm();
});

/* ── Scroll Reveal ── */
function initScrollReveal() {
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".scroll-reveal").forEach(function (el) {
    observer.observe(el);
  });
}

/* ── Escape key handler ── */
function initEscapeHandler() {
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDemoModal();
      closeConfirmPopup();
    }
  });
}

/* ── Body scroll lock ── */
function initBodyScroll() {
  document.body.style.overflow = showDemoModal || showConfirmPopup ? "hidden" : "";
}

function initBodyScrollLock() {
  Object.defineProperty(document.body, "scrollLock", {
    get: function () {
      return document.body.style.overflow === "hidden";
    },
    set: function (val) {
      document.body.style.overflow = val ? "hidden" : "";
    }
  });
}

/* ── Skyline scroll hint ── */
function initSkylineScroll() {
  var hint = document.querySelector(".skkyline-scroll-hint");
  if (hint) {
    hint.addEventListener("click", function () {
      var target = document.getElementById("next-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
}

/* ── Nav Book Demo btn ── */
function initNavDemoBtn() {
  var btn = document.querySelector(".nav .nav-btn:not(.nav-btn-outline)");
  if (btn) {
    btn.addEventListener("click", openDemoModal);
  }
}

/* ── CTA Book Demo btn ── */
function initCtaBtn() {
  var ctaBtn = document.querySelector(".cta-btn");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", openDemoModal);
  }
}

/* ── Hero form ── */
function initHeroForm() {
  var form = document.querySelector(".hero-form");
  var input = document.querySelector(".hero-input");
  var submitBtn = document.querySelector(".hero-submit-btn");

  if (submitBtn) {
    submitBtn.addEventListener("click", handleHeroSubmit);
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleHeroSubmit();
      }
    });
  }
}

function handleHeroSubmit() {
  var input = document.querySelector(".hero-input");
  if (!input) return;

  var email = input.value.trim();
  if (!email || !input.checkValidity()) {
    input.style.borderColor = "#e53935";
    input.focus();
    setTimeout(function () {
      input.style.borderColor = "";
    }, 1500);
    return;
  }

  heroSubmitting = true;
  heroError = "";
  updateHeroError();
  updateHeroSubmitBtn();

  fetch(BACKEND_URL + "/api/leads/early-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email })
  })
    .then(function (res) {
      if (!res.ok) throw new Error();
      showConfirmPopup = true;
      input.value = "";
      renderConfirmPopup();
    })
    .catch(function () {
      heroError = "Something went wrong. Please try again.";
      updateHeroError();
    })
    .finally(function () {
      heroSubmitting = false;
      updateHeroSubmitBtn();
    });
}

function updateHeroSubmitBtn() {
  var btn = document.querySelector(".hero-submit-btn");
  if (btn) {
    btn.disabled = heroSubmitting;
    btn.textContent = heroSubmitting ? "Sending..." : "Request Early Access";
    // restore arrow
    if (!heroSubmitting) {
      btn.innerHTML =
        'Request Early Access <span class="arrow-icon">\
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">\
            <path d="M7.5 1L12 5M12 5L7.5 9M12 5H1" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\
          </svg>\
        </span>';
    }
  }
}

function updateHeroError() {
  var el = document.querySelector(".hero-error");
  if (el) {
    el.textContent = heroError;
  }
}

/* ── Demo Modal ── */
function openDemoModal() {
  showDemoModal = true;
  demoStatus = "idle";
  renderDemoModal();
  document.body.style.overflow = "hidden";
}

function closeDemoModal() {
  showDemoModal = false;
  document.body.style.overflow = "";
  renderDemoModal();
}

/* ── Confirm Popup ── */
function openConfirmPopup() {
  showConfirmPopup = true;
  renderConfirmPopup();
  document.body.style.overflow = "hidden";
}

function closeConfirmPopup() {
  showConfirmPopup = false;
  document.body.style.overflow = "";
  renderConfirmPopup();
}

/* ── Demo Form ── */
function initDemoForm() {
  // Delegated submit handler on form
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (form && form.classList.contains("demo-form")) {
      e.preventDefault();
      handleDemoSubmit();
    }
  });

  // Input change handlers
  document.addEventListener("input", function (e) {
    var target = e.target;
    if (target.name === "fullName") demoForm.fullName = target.value;
    else if (target.name === "email") demoForm.email = target.value;
    else if (target.name === "company") demoForm.company = target.value;
    else if (target.name === "building") demoForm.building = target.value;
    else if (target.name === "city") demoForm.city = target.value;
    else if (target.name === "role") demoForm.role = target.value;
    else if (target.name === "details") demoForm.details = target.value;
    else if (target.name === "website") demoForm.website = target.value;
  });
}

function handleDemoSubmit() {
  demoSubmitting = true;
  demoStatus = "idle";
  renderDemoModal();

  fetch(BACKEND_URL + "/api/leads/book-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(demoForm)
  })
    .then(function (res) {
      if (!res.ok) throw new Error();
      demoStatus = "success";
      demoForm = {
        fullName: "",
        email: "",
        company: "",
        building: "",
        city: "",
        role: "",
        details: "",
        website: ""
      };
    })
    .catch(function () {
      demoStatus = "error";
    })
    .finally(function () {
      demoSubmitting = false;
      renderDemoModal();
    });
}

/* ── Render: Confirm Popup ── */
function renderConfirmPopup() {
  var existing = document.querySelector(".confirm-backdrop");
  if (existing) existing.remove();

  if (!showConfirmPopup) return;

  var backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop modal-backdrop-light confirm-backdrop";
  backdrop.setAttribute("id", "confirm-backdrop");
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) {
      closeConfirmPopup();
    }
  });

  backdrop.innerHTML =
    '<div class="confirm-popup">\
      <div class="confirm-check">\
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none">\
          <path d="M2 11L10 19L26 3" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\
        </svg>\
      </div>\
      <h3 class="confirm-title">You\'re on the list!</h3>\
      <p class="confirm-msg">Your email was sent to us. We will reach back to you shortly.</p>\
      <button class="confirm-btn" id="confirm-got-it">Got it</button>\
    </div>';

  document.body.appendChild(backdrop);

  document.getElementById("confirm-got-it").addEventListener("click", function () {
    closeConfirmPopup();
  });
}

/* ── Render: Demo Modal ── */
function renderDemoModal() {
  var existing = document.querySelector(".demo-backdrop");
  if (existing) existing.remove();

  if (!showDemoModal) return;

  var backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop demo-backdrop";
  backdrop.setAttribute("id", "demo-backdrop");
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) {
      closeDemoModal();
    }
  });

  backdrop.appendChild(buildDemoModalContent());
  document.body.appendChild(backdrop);
}

function buildDemoModalContent() {
  var modal = document.createElement("div");
  modal.className = "demo-modal";

  // Close button
  var closeBtn = document.createElement("button");
  closeBtn.className = "demo-close";
  closeBtn.textContent = "\u2715";
  closeBtn.addEventListener("click", closeDemoModal);
  modal.appendChild(closeBtn);

  if (demoStatus === "success") {
    modal.innerHTML +=
      '<div class="demo-success">\
        <div class="demo-success-check">\
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">\
            <path d="M2 11L10 19L26 3" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\
          </svg>\
        </div>\
        <h3 class="demo-success-title">Request sent!</h3>\
        <p class="demo-success-msg">We\'ll get back to you within 24 hours.</p>\
        <button class="confirm-btn" id="demo-success-got-it">Got it</button>\
      </div>';
    var gotItBtn = modal.querySelector("#demo-success-got-it");
    gotItBtn.addEventListener("click", function () {
      demoStatus = "idle";
      closeDemoModal();
    });
    return modal;
  }

  modal.innerHTML +=
    '<h2 class="demo-title">Book a Demo</h2>\
    <p class="demo-subtitle">Tell us a bit about your building and we\'ll show you how ParQlet can work for your community.</p>\
    <p class="demo-demo-info">\
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">\
        <circle cx="7" cy="7" r="6.5" stroke="#a7a7a7"/>\
        <path d="M7 4v3.5l2 1.5" stroke="#a7a7a7" stroke-linecap="round"/>\
      </svg>\
      Typical demo: 30 minutes.\
    </p>\
    <!-- Honeypot -->\
    <input type="text" name="website" class="honeypot" tabindex="-1" autocomplete="off"/>';

  var form = document.createElement("form");
  form.className = "demo-form";
  form.setAttribute("novalidate", "novalidate");

  form.innerHTML =
    '<div class="demo-form-row">\
      <div class="form-field">\
        <label class="form-label">Full name <span class="form-label-required">*</span></label>\
        <input type="text" name="fullName" class="form-input" placeholder="Jane Smith" required value="' + escHtml(demoForm.fullName) + '"/>\
      </div>\
      <div class="form-field">\
        <label class="form-label">Work email <span class="form-label-required">*</span></label>\
        <input type="email" name="email" class="form-input" placeholder="jane@company.com" required value="' + escHtml(demoForm.email) + '"/>\
      </div>\
    </div>\
    <div class="form-field">\
      <label class="form-label">Company / HOA management company <span class="form-label-required">*</span></label>\
      <input type="text" name="company" class="form-input" placeholder="FirstService Residential" required value="' + escHtml(demoForm.company) + '"/>\
    </div>\
    <div class="demo-form-row">\
      <div class="form-field">\
        <label class="form-label">Building or community name</label>\
        <input type="text" name="building" class="form-input" placeholder="Your building name" value="' + escHtml(demoForm.building) + '"/>\
      </div>\
      <div class="form-field">\
        <label class="form-label">City <span class="form-label-required">*</span></label>\
        <input type="text" name="city" class="form-input" placeholder="Your city" required value="' + escHtml(demoForm.city) + '"/>\
      </div>\
    </div>\
    <div class="form-field">\
      <label class="form-label">Role <span class="form-label-required">*</span></label>\
      <select name="role" class="form-select" required>\
        <option value="" disabled ' + (demoForm.role === "" ? "selected" : "") + '>Select your role</option>\
        <option ' + (demoForm.role === "HOA Board Member" ? "selected" : "") + '>HOA Board Member</option>\
        <option ' + (demoForm.role === "Property Manager" ? "selected" : "") + '>Property Manager</option>\
        <option ' + (demoForm.role === "Building Manager" ? "selected" : "") + '>Building Manager</option>\
        <option ' + (demoForm.role === "Resident" ? "selected" : "") + '>Resident</option>\
        <option ' + (demoForm.role === "Other" ? "selected" : "") + '>Other</option>\
      </select>\
    </div>\
    <div class="form-field">\
      <label class="form-label">Any details we should know about your community?</label>\
      <textarea name="details" class="form-textarea" rows="4" placeholder="Number of units, parking capacity, current parking challenges, or anything you\'d like us to know.">' + escHtml(demoForm.details) + '</textarea>\
    </div>\
    ' + (demoStatus === "error" ? '<p class="demo-error">Something went wrong. Please try again.</p>' : "") + '\
    <button type="submit" class="demo-submit-btn" ' + (demoSubmitting ? "disabled" : "") + '>' + (demoSubmitting ? "Sending..." : "Book a Demo") + '</button>\
    <p class="demo-footnote">We\'ll respond within 24 hours.</p>';

  modal.appendChild(form);
  return modal;
}

/* ── Helpers ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}