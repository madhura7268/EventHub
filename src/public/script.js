/* ─────────────────────────────────────────────────────────────
   EventHub — SPA JavaScript
   Uses fetch() only. No jQuery, no frameworks.
   ───────────────────────────────────────────────────────────── */

"use strict";

const API_BASE = window.location.origin;

// ─────────────────────────────────────────────────────────────
// SPA VIEW SWITCHING
// ─────────────────────────────────────────────────────────────

// Show one view, hide all others. Update sidebar active state.
function showView(viewId) {
  // Hide all views
  document.querySelectorAll(".content-section").forEach(function (sec) {
    sec.classList.remove("active");
  });

  // Show the requested view
  var target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  // Update sidebar active highlight
  // (sidebar only links to the first 3 views; reg-form has no nav item)
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.classList.toggle("active", item.getAttribute("data-view") === viewId);
  });
}

function initSidebarNav() {
  document.querySelectorAll(".nav-item").forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      var viewId = item.getAttribute("data-view");
      if (viewId) showView(viewId);
    });
  });
}

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-message " + (type === "success" ? "msg-success" : "msg-error");
}

function clearMsg(el) {
  if (!el) return;
  el.textContent = "";
  el.className = "form-message";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
// SECTION 1 — CREATE EVENT
// ─────────────────────────────────────────────────────────────

async function handleCreateEvent(e) {
  e.preventDefault();

  const title       = document.getElementById("event-title").value.trim();
  const description = document.getElementById("event-description").value.trim();
  const venue       = document.getElementById("event-venue").value.trim();
  const date        = document.getElementById("event-date").value;
  const capacity    = document.getElementById("event-capacity").value;
  const msgEl       = document.getElementById("create-event-message");
  const btn         = document.getElementById("create-event-btn");

  clearMsg(msgEl);

  if (!title || !description || !venue || !date || !capacity) {
    showMsg(msgEl, "Please fill in all required fields.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating…";

  try {
    const res = await fetch(API_BASE + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        venue,
        date,
        capacity: parseInt(capacity, 10),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      showMsg(msgEl, "✓ Event created successfully!", "success");
      document.getElementById("create-event-form").reset();
      // Auto-refresh event list
      loadEvents();
    } else {
      showMsg(msgEl, data.message || "Failed to create event.", "error");
    }
  } catch (err) {
    showMsg(msgEl, "Network error. Is the server running?", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon" aria-hidden="true">+</span> Create Event';
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION 2 — EVENT LIST
// ─────────────────────────────────────────────────────────────

async function loadEvents() {
  const container = document.getElementById("events-container");

  // Show loading state
  container.innerHTML =
    '<div class="loading-state"><div class="loading-spinner"></div><p>Loading events…</p></div>';

  try {
    const res = await fetch(API_BASE + "/events");
    const events = await res.json();

    if (!res.ok) {
      container.innerHTML =
        '<div class="empty-state"><p>Could not load events.</p></div>';
      return;
    }

    renderEvents(events);
  } catch (err) {
    container.innerHTML =
      '<div class="empty-state"><p>Network error. Is the server running?</p></div>';
  }
}

function renderEvents(events) {
  const container = document.getElementById("events-container");

  if (!events || events.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p>No events available yet. Create one above!</p></div>';
    return;
  }

  container.innerHTML = events
    .map(function (event) {
      return buildEventCard(event);
    })
    .join("");
}

function buildEventCard(event) {
  const date = formatDate(event.date);
  const safeTitle = escapeHtml(event.title);
  const safeDesc  = escapeHtml(event.description);
  const safeVenue = escapeHtml(event.venue);

  return (
    '<div class="event-card-wrapper" id="wrapper-' + event.id + '" role="listitem">' +
      '<div class="event-card">' +
        '<h3 class="event-card-title">' + safeTitle + '</h3>' +
        '<p class="event-card-desc">' + safeDesc + '</p>' +
        '<div class="event-card-meta">' +
          '<div class="event-card-meta-row">' +
            '<span class="meta-label">Venue</span>' +
            '<span>' + safeVenue + '</span>' +
          '</div>' +
          '<div class="event-card-meta-row">' +
            '<span class="meta-label">Date</span>' +
            '<span>' + date + '</span>' +
          '</div>' +
          '<div class="event-card-meta-row">' +
            '<span class="meta-label">Capacity</span>' +
            '<span>' + event.capacity + ' seats</span>' +
          '</div>' +
        '</div>' +
        '<div class="event-card-footer">' +
          '<button class="btn btn-primary" ' +
            'onclick="selectEvent(' + event.id + ', \'' + safeTitle.replace(/'/g, "\\'") + '\')">' +
            'Register' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// ─────────────────────────────────────────────────────────────
// SINGLE REGISTRATION PANEL
// ─────────────────────────────────────────────────────────────

// Holds the currently selected event object { id, title }
var selectedEvent = null;

// Auto-hide timer handle
var panelHideTimer = null;

function selectEvent(eventId, eventTitle) {
  // Store selected event
  selectedEvent = { id: eventId, title: eventTitle };

  // Cancel any pending auto-return timer
  if (panelHideTimer) {
    clearTimeout(panelHideTimer);
    panelHideTimer = null;
  }

  // Update registration form heading
  var titleEl = document.getElementById("reg-panel-title");
  if (titleEl) {
    titleEl.textContent = "Register for: " + eventTitle;
  }

  // Clear previous inputs and messages
  document.getElementById("reg-panel-name").value = "";
  document.getElementById("reg-panel-email").value = "";
  clearMsg(document.getElementById("reg-panel-message"));

  // Switch to the registration form view
  showView("section-reg-form");
}

function hideRegistrationPanel() {
  // Cancel is clicked — return to Event List
  selectedEvent = null;

  if (panelHideTimer) {
    clearTimeout(panelHideTimer);
    panelHideTimer = null;
  }

  showView("section-events");
}

async function submitRegistration() {
  if (!selectedEvent) return;

  var nameInput  = document.getElementById("reg-panel-name");
  var emailInput = document.getElementById("reg-panel-email");
  var msgEl      = document.getElementById("reg-panel-message");
  var submitBtn  = document.getElementById("reg-panel-submit-btn");

  var name  = nameInput.value.trim();
  var email = emailInput.value.trim();

  clearMsg(msgEl);

  // Validate
  if (!name || !email) {
    showMsg(msgEl, "Please enter your name and email.", "error");
    return;
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMsg(msgEl, "Please enter a valid email address.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering\u2026";

  try {
    // Step 1: Create or fetch user
    var userRes = await fetch(API_BASE + "/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email }),
    });
    var userData = await userRes.json();

    if (!userRes.ok) {
      showMsg(msgEl, userData.message || "Could not create user.", "error");
      return;
    }

    // Step 2: Register for the selected event
    var regRes = await fetch(API_BASE + "/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userData.id, eventId: selectedEvent.id }),
    });
    var regData = await regRes.json();

    if (regRes.status === 409) {
      showMsg(msgEl, "You are already registered for this event.", "error");
      return;
    }

    if (regRes.ok) {
      // Show success
      showMsg(msgEl, "\u2713 Registered successfully!", "success");

      // Clear inputs and reset selected event
      nameInput.value  = "";
      emailInput.value = "";
      selectedEvent = null;

      // Refresh My Registrations if same email is loaded
      maybeRefreshMyRegistrations(email);

      // Return to Event List after 1.5 seconds
      panelHideTimer = setTimeout(function () {
        panelHideTimer = null;
        loadEvents();
        showView("section-events");
      }, 1500);
    } else {
      showMsg(msgEl, regData.message || "Registration failed.", "error");
    }
  } catch (err) {
    showMsg(msgEl, "Network error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — MY REGISTRATIONS
// ─────────────────────────────────────────────────────────────

// Track the last email used for the lookup so we can auto-refresh
let lastLookedUpEmail = null;

function maybeRefreshMyRegistrations(email) {
  if (lastLookedUpEmail && lastLookedUpEmail.toLowerCase() === email.toLowerCase()) {
    loadMyRegistrations(email);
  }
}

async function handleViewRegistrations() {
  const emailInput = document.getElementById("lookup-email");
  const email = emailInput ? emailInput.value.trim() : "";
  const msgEl = document.getElementById("lookup-message");
  const container = document.getElementById("my-registrations-container");

  clearMsg(msgEl);
  container.innerHTML = "";

  if (!email) {
    showMsg(msgEl, "Please enter your email address.", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMsg(msgEl, "Please enter a valid email address.", "error");
    return;
  }

  lastLookedUpEmail = email;
  await loadMyRegistrations(email);
}

async function loadMyRegistrations(email) {
  const container = document.getElementById("my-registrations-container");
  const msgEl     = document.getElementById("lookup-message");

  container.innerHTML =
    '<div class="loading-state"><div class="loading-spinner"></div><p>Fetching registrations…</p></div>';

  try {
    const res = await fetch(API_BASE + "/registrations/" + encodeURIComponent(email));
    const data = await res.json();

    if (res.status === 404) {
      container.innerHTML = "";
      showMsg(msgEl, "No registrations found for this email.", "error");
      return;
    }

    if (!res.ok) {
      container.innerHTML = "";
      showMsg(msgEl, data.message || "Could not fetch registrations.", "error");
      return;
    }

    clearMsg(msgEl);
    renderMyRegistrations(data);
  } catch (err) {
    container.innerHTML = "";
    showMsg(msgEl, "Network error. Please try again.", "error");
  }
}

function renderMyRegistrations(registrations) {
  const container = document.getElementById("my-registrations-container");

  if (!registrations || registrations.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p>No registrations found.</p></div>';
    return;
  }

  container.innerHTML = registrations
    .map(function (reg) {
      return buildRegCard(reg);
    })
    .join("");
}

function buildRegCard(reg) {
  const eventName   = escapeHtml(reg.event.title);
  const venue       = escapeHtml(reg.event.venue);
  const eventDate   = formatDate(reg.event.date);
  const regDate     = formatDateTime(reg.createdAt);

  return (
    '<div class="reg-card" role="listitem">' +
      '<p class="reg-card-title">' + eventName + '</p>' +
      '<div class="reg-card-meta">' +
        '<div class="reg-card-meta-row">' +
          '<span class="meta-label">Venue</span>' +
          '<span>' + venue + '</span>' +
        '</div>' +
        '<div class="reg-card-meta-row">' +
          '<span class="meta-label">Date</span>' +
          '<span>' + eventDate + '</span>' +
        '</div>' +
        '<div class="reg-card-meta-row">' +
          '<span class="meta-label">Registered</span>' +
          '<span>' + regDate + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="reg-badge">Confirmed</span>' +
    '</div>'
  );
}

// ─────────────────────────────────────────────────────────────
// XSS PROTECTION
// ─────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  // Init sidebar navigation (view switching)
  initSidebarNav();

  // Create event form
  var createForm = document.getElementById("create-event-form");
  if (createForm) {
    createForm.addEventListener("submit", handleCreateEvent);
  }

  // Registration form — Submit button
  var regSubmitBtn = document.getElementById("reg-panel-submit-btn");
  if (regSubmitBtn) {
    regSubmitBtn.addEventListener("click", submitRegistration);
  }

  // Registration form — Cancel button
  var regCancelBtn = document.getElementById("reg-panel-cancel-btn");
  if (regCancelBtn) {
    regCancelBtn.addEventListener("click", hideRegistrationPanel);
  }

  // My Registrations button
  var viewBtn = document.getElementById("view-registrations-btn");
  if (viewBtn) {
    viewBtn.addEventListener("click", handleViewRegistrations);
  }

  // Allow pressing Enter in lookup email input
  var lookupInput = document.getElementById("lookup-email");
  if (lookupInput) {
    lookupInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleViewRegistrations();
    });
  }

  // Load events and show Event List as the default view
  loadEvents();
  showView("section-events");
});
