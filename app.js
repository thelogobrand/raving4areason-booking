const SUPABASE_URL = "https://ejizwiegnxtwglihrxiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KJx1attn5Dbo_Zex4IBc6A_GZR3xytW";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "R4AR";
const MENTOR_PASSWORD = "Mentor";
const PARENT_USERNAME = "R4ARparent";
const DONATION_URL = "https://www.gofundme.com/f/buy-more-equipment-for-young-peoples-workshops-worksh?attribution_id=sl:e5544b21-38bf-4f5d-9b45-75d32cf8ef34&lang=en_GB&utm_campaign=fp_sharesheet&utm_medium=customer&utm_source=qr_code";
let currentManagedBooking = null;
let currentManagedMessages = [];

/* =========================
   HELPERS
========================= */

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function createBookingReference() {
  const year = new Date().getFullYear();
  const code = crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-6).padStart(6, "0");
  return `R4AR-${year}-${code}`;
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";

  const dateObj = new Date(dateString + "T00:00:00");

  return dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).replace(",", "");
}

function goHome() {
  window.location.href = "index.html";
}

function goBack() {
  window.history.back();
}

function goToCalendar() {
  window.location.href = "weekly-calendar.html";
}

function goToBooking() { window.location.href = "book.html"; }
function goToNewsletter() { window.location.href = "newsletter.html"; }
function goToContact() { window.location.href = "contact.html"; }
function openDonationPage() {
  if (!DONATION_URL || DONATION_URL === "PASTE_DONATION_LINK_HERE") {
    alert("The donation link has not been added yet.");
    return;
  }
  window.open(DONATION_URL, "_blank", "noopener,noreferrer");
}

function bookForParent() {
  window.location.href = "book.html?adminBooking=true";
}

function isAdminAssistedBooking() {
  return new URLSearchParams(window.location.search).get("adminBooking") === "true";
}

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.style.display =
    section.style.display === "none" || section.style.display === ""
      ? "block"
      : "none";
}


/* =========================
   SHARED PARENT ACCESS
========================= */
async function loginParent() {
  const username = (document.getElementById("parentUsername")?.value || "").trim();
  const password = document.getElementById("parentPassword")?.value || "";

  const result = await verifyPortalLogin("parent", username, password);
  if (!result.ok) {
    alert(result.message || "Wrong username or password");
    return;
  }

  localStorage.setItem("parentLoggedIn", "true");
  checkParentLogin();
}
function logoutParent() { localStorage.removeItem("parentLoggedIn"); checkParentLogin(); }
function checkParentLogin() {
  const login = document.getElementById("parentLoginBox");
  const menu = document.getElementById("parentMenu");
  if (!login || !menu) return;
  const ok = localStorage.getItem("parentLoggedIn") === "true";
  login.style.display = ok ? "none" : "block";
  menu.style.display = ok ? "block" : "none";
}

async function verifyPortalLogin(role, username, password) {
  try {
    const response = await fetch("/.netlify/functions/portal-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", role, username, password })
    });
    const data = await response.json();
    return { ok: response.ok && data.success, ...data };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Unable to contact the login service." };
  }
}

/* =========================
   ADMIN LOGIN
========================= */

async function loginAdmin() {
  const username = document.getElementById("adminUsername")?.value || "";
  const password = document.getElementById("adminPassword")?.value || "";

  const result = await verifyPortalLogin("admin", username, password);
  if (!result.ok) {
    alert(result.message || "Wrong username or password");
    return;
  }

  localStorage.setItem("adminLoggedIn", "true");
  sessionStorage.setItem("adminPasswordForChanges", password);
  showAdminPanel();
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  sessionStorage.removeItem("adminPasswordForChanges");
  showLoginBox();
}

function showAdminPanel() {
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  if (loginBox) loginBox.style.display = "none";
  if (adminPanel) adminPanel.style.display = "block";

  loadAdminDropdowns();
  renderAdminSlots();
  renderBookedSessions();
  renderAdminMentors();
  renderAdminLocations();
  renderMembers();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

function showLoginBox() {
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  if (loginBox) loginBox.style.display = "block";
  if (adminPanel) adminPanel.style.display = "none";
}

function checkAdminLogin() {
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  if (!loginBox || !adminPanel) return;

  if (localStorage.getItem("adminLoggedIn") === "true") {
    showAdminPanel();
  } else {
    showLoginBox();
  }
}

/* =========================
   MENTOR LOGIN
========================= */

async function loginMentor() {
  const username = (document.getElementById("mentorUsername")?.value || "").trim();
  const password = document.getElementById("mentorPassword")?.value || "";

  if (!username || !password) {
    alert("Please enter your name and password");
    return;
  }

  const result = await verifyPortalLogin("mentor", username, password);
  if (!result.ok) {
    alert(result.message || "Wrong mentor name or password");
    return;
  }

  localStorage.setItem("mentorLoggedIn", "true");
  localStorage.setItem("mentorName", result.mentor_name || username);

  showMentorPanel();
}

function logoutMentor() {
  localStorage.removeItem("mentorLoggedIn");
  localStorage.removeItem("mentorName");
  showMentorLoginBox();
}

function getLoggedInMentorName() {
  return localStorage.getItem("mentorName") || "";
}

function showMentorPanel() {
  const mentorLoginBox = document.getElementById("mentorLoginBox");
  const mentorPanel = document.getElementById("mentorPanel");
  const mentorName = getLoggedInMentorName();

  if (mentorLoginBox) mentorLoginBox.style.display = "none";
  if (mentorPanel) mentorPanel.style.display = "block";

  const mentorWelcome = document.getElementById("mentorWelcome");
  if (mentorWelcome && mentorName) {
    mentorWelcome.textContent = `${mentorName} Portal`;
  }

  loadMentorLocations();
  renderMentorAvailability();
  renderMentorBookedSessions();
  updateMentorMessageBadge();
}

function showMentorLoginBox() {
  const mentorLoginBox = document.getElementById("mentorLoginBox");
  const mentorPanel = document.getElementById("mentorPanel");

  if (mentorLoginBox) mentorLoginBox.style.display = "block";
  if (mentorPanel) mentorPanel.style.display = "none";
}

function checkMentorLogin() {
  const mentorLoginBox = document.getElementById("mentorLoginBox");
  const mentorPanel = document.getElementById("mentorPanel");

  if (!mentorLoginBox || !mentorPanel) return;

  const isLoggedIn = localStorage.getItem("mentorLoggedIn") === "true";
  const mentorName = getLoggedInMentorName();

  if (isLoggedIn && mentorName) {
    showMentorPanel();
  } else {
    showMentorLoginBox();
  }
}

/* =========================
   ADMIN DASHBOARD
========================= */

async function loadDashboard() {
  const container = document.getElementById("dashboardSummary");
  if (!container) return;

  container.innerHTML = '<p class="loading-text">Loading dashboard…</p>';

  const today = getTodayDate();

  const [
    membersResult,
    mentorsResult,
    locationsResult,
    sessionsResult,
    bookingsResult
  ] = await Promise.all([
    db.from("members").select("type"),
    db.from("mentors").select("id", { count: "exact", head: true }),
    db.from("locations").select("id", { count: "exact", head: true }),
    db.from("sessions").select("id", { count: "exact", head: true }).gte("date", today),
    db.from("bookings").select("id", { count: "exact", head: true }).gte("date", today)
  ]);

  const firstError = [
    membersResult.error,
    mentorsResult.error,
    locationsResult.error,
    sessionsResult.error,
    bookingsResult.error
  ].find(Boolean);

  if (firstError) {
    console.error("Dashboard error:", firstError);
    container.innerHTML = '<p class="error-text">Unable to load dashboard totals.</p>';
    return;
  }

  const membersData = membersResult.data || [];
  const memberTypes = membersData.reduce((totals, member) => {
    const type = member.type || "Other";
    totals[type] = (totals[type] || 0) + 1;
    return totals;
  }, {});

  const cards = [
    { label: "Members", value: membersData.length, icon: "👥" },
    { label: "Mentors", value: mentorsResult.count || 0, icon: "🎧" },
    { label: "Available Sessions", value: sessionsResult.count || 0, icon: "📅" },
    { label: "Upcoming Bookings", value: bookingsResult.count || 0, icon: "📝" },
    { label: "Locations", value: locationsResult.count || 0, icon: "📍" },
    { label: "Lessons Paid", value: memberTypes["Lessons Paid"] || 0, icon: "💷", type: "Lessons Paid" },
    { label: "Lessons Funded", value: memberTypes["Lessons Funded"] || 0, icon: "💙", type: "Lessons Funded" },
    { label: "Membership", value: memberTypes.Membership || 0, icon: "⭐", type: "Membership" },
    { label: "Part Funded", value: memberTypes["Part Funded"] || 0, icon: "🟠", type: "Part Funded" },
    { label: "Other", value: memberTypes.Other || 0, icon: "⚪", type: "Other" }
  ].filter(card => card.value > 0);

  if (cards.length === 0) {
    container.innerHTML = '<p>No dashboard data yet.</p>';
    return;
  }

  container.innerHTML = cards.map(card => `
    <div class="dashboard-card${card.type ? " funding-card" : ""}">
      <span class="dashboard-icon">${card.icon}</span>
      <strong>${card.value}</strong>
      <span>${card.label}</span>
    </div>
  `).join("");
}

/* =========================
   LIVE SESSIONS
========================= */

async function loadCalendar() {
  const container = document.getElementById("calendar");
  if (!container) return;

  const { data, error } = await db
    .from("sessions")
    .select("*")
    .gte("date", getTodayDate())
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading sessions.</p>";
    return;
  }

  let html = "";
  let currentDate = "";

  (data || []).forEach(slot => {
    if (slot.date !== currentDate) {
      currentDate = slot.date;
      html += `<h2 class="day-heading">${formatDisplayDate(slot.date)}</h2>`;
    }

    html += `
      <div class="slot-card">
        <p><strong>${slot.mentor}</strong> — ${slot.type}</p>
        <p>${slot.location}</p>
        <p>${slot.time}</p>
        <button onclick="bookSlot('${slot.mentor}', '${slot.type}', '${slot.location}', '${slot.date}', '${slot.time}', '${slot.id}')">
          BOOK THIS SLOT
        </button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No available sessions yet.</p>";
}

async function searchSlots() {
  const mentor = document.getElementById("searchMentor")?.value || "";
  const location = document.getElementById("searchLocation")?.value || "";
  const type = document.getElementById("searchType")?.value || "";
  const date = document.getElementById("searchDate")?.value || "";
  const resultsContainer = document.getElementById("searchResults");

  if (!resultsContainer) return;

  let query = db
    .from("sessions")
    .select("*")
    .gte("date", getTodayDate())
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (mentor) query = query.eq("mentor", mentor);
  if (location) query = query.eq("location", location);
  if (type) query = query.eq("type", type);
  if (date) query = query.eq("date", date);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    resultsContainer.innerHTML = "<p>Error loading sessions.</p>";
    return;
  }

  if (!data || data.length === 0) {
    resultsContainer.innerHTML = "<p>No matching available sessions found.</p>";
    return;
  }

  let html = "<h2>Search Results</h2>";

  data.forEach(slot => {
    html += `
      <div class="slot-card">
        <p><strong>${slot.mentor}</strong> — ${slot.type}</p>
        <p>${slot.location}</p>
        <p>${formatDisplayDate(slot.date)}</p>
        <p>${slot.time}</p>
        <button onclick="bookSlot('${slot.mentor}', '${slot.type}', '${slot.location}', '${slot.date}', '${slot.time}', '${slot.id}')">
          BOOK THIS SLOT
        </button>
      </div>
    `;
  });

  resultsContainer.innerHTML = html;
}

async function renderAdminSlots() {
  const container = document.getElementById("adminSlots");
  if (!container) return;

  const { data, error } = await db
    .from("sessions")
    .select("*")
    .gte("date", getTodayDate())
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading sessions.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(slot => {
    html += `
      <div class="slot-card">
        <p><strong>${formatDisplayDate(slot.date)}</strong></p>
        <p>${slot.mentor} — ${slot.type}</p>
        <p>${slot.location}</p>
        <p>${slot.time}</p>
        <button onclick="removeSlot('${slot.id}')">REMOVE</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No sessions added yet.</p>";
}

async function addSlot() {
  const date = document.getElementById("date")?.value || "";
  const type = document.getElementById("type")?.value || "";
  const mentor = document.getElementById("mentor")?.value || "";
  const location = document.getElementById("location")?.value || "";
  const time = document.getElementById("time")?.value || "";

  if (!date || !type || !mentor || !location || !time) {
    alert("Please fill all fields");
    return;
  }

  const { error } = await db
    .from("sessions")
    .insert([{ date, type, mentor, location, time }]);

  if (error) {
    console.error(error);
    alert("Error adding session");
    return;
  }

  renderAdminSlots();
  loadCalendar();
  loadDashboard();

  document.getElementById("date").value = "";
  document.getElementById("type").value = "";
  document.getElementById("mentor").value = "";
  document.getElementById("location").value = "";
  document.getElementById("time").value = "";
}

async function removeSlot(id) {
  const confirmDelete = confirm("Remove this session?");
  if (!confirmDelete) return;

  const { error } = await db
    .from("sessions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error removing session");
    return;
  }

  renderAdminSlots();
  loadCalendar();
  renderMentorAvailability();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

async function removeBookedSlot(booking) {
  if (booking.session_id) {
    await db.from("sessions").delete().eq("id", booking.session_id);
    return;
  }

  await db
    .from("sessions")
    .delete()
    .eq("mentor", booking.mentor)
    .eq("type", booking.type)
    .eq("location", booking.location)
    .eq("date", booking.rawDate)
    .eq("time", booking.time);
}

/* =========================
   SEARCH FILTERS
========================= */

async function loadSearchFilters() {
  const mentorSelect = document.getElementById("searchMentor");
  const locationSelect = document.getElementById("searchLocation");
  const typeSelect = document.getElementById("searchType");

  if (!mentorSelect || !locationSelect || !typeSelect) return;

  const selectedType = typeSelect.value;
  const currentMentor = mentorSelect.value;
  const currentLocation = locationSelect.value;

  let query = db
    .from("sessions")
    .select("mentor, location, type")
    .gte("date", getTodayDate());

  if (selectedType) {
    query = query.eq("type", selectedType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading booking filters:", error);
    mentorSelect.innerHTML = '<option value="">Unable to load mentors</option>';
    locationSelect.innerHTML = '<option value="">Unable to load locations</option>';
    return;
  }

  const sessions = data || [];
  const mentors = [...new Set(sessions.map(item => item.mentor).filter(Boolean))].sort();
  const locations = [...new Set(sessions.map(item => item.location).filter(Boolean))].sort();

  mentorSelect.innerHTML = '<option value="">All Mentors</option>';
  locationSelect.innerHTML = '<option value="">All Locations</option>';

  mentors.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    mentorSelect.appendChild(option);
  });

  locations.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    locationSelect.appendChild(option);
  });

  if (mentors.includes(currentMentor)) mentorSelect.value = currentMentor;
  if (locations.includes(currentLocation)) locationSelect.value = currentLocation;

  typeSelect.onchange = loadSearchFilters;
}

function clearSearchFilters() {
  const mentor = document.getElementById("searchMentor");
  const location = document.getElementById("searchLocation");
  const type = document.getElementById("searchType");
  const date = document.getElementById("searchDate");
  const results = document.getElementById("searchResults");

  if (mentor) mentor.value = "";
  if (location) location.value = "";
  if (type) type.value = "";
  if (date) date.value = "";
  if (results) results.innerHTML = "";

  loadSearchFilters();
}

/* =========================
   BOOKING FLOW
========================= */

function bookSlot(mentor, type, location, date, time, session_id = "") {
  const params = new URLSearchParams({
    mentor,
    type,
    location,
    date,
    time,
    session_id
  });

  if (isAdminAssistedBooking()) {
    params.set("adminBooking", "true");
  }

  window.location.href = `booking.html?${params.toString()}`;
}

function loadBookingPage() {
  const container = document.getElementById("bookingDetails");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);

  const mentor = params.get("mentor");
  const type = params.get("type");
  const location = params.get("location");
  const date = params.get("date");
  const time = params.get("time");
  const adminBooking = params.get("adminBooking") === "true";

  const title = document.getElementById("confirmBookingTitle");
  const notice = document.getElementById("adminBookingNotice");

  if (adminBooking) {
    if (title) title.textContent = "Book Session for Parent";
    if (notice) notice.style.display = "block";
  }

  if (!mentor || !type || !location || !date || !time) {
    container.innerHTML = "<p>No booking details found. Please go back and select a session.</p>";
    return;
  }

  container.innerHTML = `
    <p><strong>${mentor}</strong> — ${type}</p>
    <p>${location}</p>
    <p>${formatDisplayDate(date)}</p>
    <p>${time}</p>
  `;
}

function getBookingData() {
  const params = new URLSearchParams(window.location.search);

  const child = document.getElementById("childName")?.value.trim() || "";
  const parent = document.getElementById("parentName")?.value.trim() || "";
  const phone = document.getElementById("parentPhone")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const rawDate = params.get("date") || "";

  return {
    child,
    parent,
    phone,
    email,
    mentor: params.get("mentor") || "",
    type: params.get("type") || "",
    location: params.get("location") || "",
    rawDate,
    date: rawDate ? formatDisplayDate(rawDate) : "",
    time: params.get("time") || "",
    session_id: params.get("session_id") || "",
    adminBooking: params.get("adminBooking") === "true"
  };
}

async function confirmBooking() {
  const booking = getBookingData();
  const consent = document.getElementById("gdprConsent")?.checked;
  if (!consent) return alert("Please confirm consent to continue");
  if (!booking.child || !booking.parent || !booking.phone || !booking.email) return alert("Please fill all details");
  const phone = booking.phone.replace(/\s/g, "");
  if (!/^\d{10,13}$/.test(phone)) return alert("Please enter a valid phone number");

  const bookingReference = createBookingReference();

  const { data: savedBooking, error } = await db.from("bookings").insert([{
    child: booking.child, parent: booking.parent, phone, email: booking.email,
    booking_reference: bookingReference,
    mentor: booking.mentor, type: booking.type, location: booking.location,
    date: booking.rawDate, time: booking.time, paid: false
  }]).select("id, manage_token, booking_reference").single();
  if (error) { console.error(error); return alert("Error saving booking"); }

  await removeBookedSlot(booking);
  const { data: mentorRows } = await db.from("mentors").select("email").eq("name", booking.mentor).limit(1);
  const mentorEmail = mentorRows?.[0]?.email || "";
  const manageUrl = `${window.location.origin}/manage-booking.html?token=${encodeURIComponent(savedBooking.manage_token)}`;

  try {
    await fetch("/.netlify/functions/send-booking-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking: {
        child: booking.child, parent: booking.parent, phone, mentor: booking.mentor,
        date: booking.date, time: booking.time, location: booking.location, type: booking.type,
        parent_email: booking.email, mentor_email: mentorEmail, manage_url: manageUrl,
        booking_reference: savedBooking.booking_reference
      }})
    });
  } catch (emailError) { console.error("Email error:", emailError); }

  const params = new URLSearchParams({
    child: booking.child, parent: booking.parent, phone, email: booking.email,
    mentor: booking.mentor, type: booking.type, location: booking.location,
    date: booking.rawDate, time: booking.time, manage_token: savedBooking.manage_token,
    booking_reference: savedBooking.booking_reference,
    adminBooking: booking.adminBooking ? "true" : "false"
  });
  window.location.href = `confirmed.html?${params.toString()}`;
}

/* =========================
   CONFIRMED PAGE
========================= */

function loadConfirmedPage() {
  const container = document.getElementById("confirmedDetails");
  if (!container) return;

  const booking = getConfirmedData();

  const title = document.getElementById("confirmedPageTitle");
  const backButton = document.getElementById("confirmedBackButton");

  if (booking.adminBooking) {
    if (title) title.textContent = "Parent Booking Confirmed";
    if (backButton) {
      backButton.textContent = "RETURN TO ADMIN";
      backButton.onclick = () => { window.location.href = "admin.html"; };
    }
  }

  if (!booking.mentor || !booking.type || !booking.location || !booking.rawDate || !booking.time) return;

  const manageButton = document.getElementById("manageBookingButton");
  if (manageButton && booking.manage_token) manageButton.style.display = "block";

  container.innerHTML = `
    ${booking.booking_reference ? `<p><strong>Reference:</strong> ${escapeHtml(booking.booking_reference)}</p>` : ""}
    <p><strong>${booking.mentor}</strong> — ${booking.type}</p>
    <p>${booking.location}</p>
    <p>${booking.date}</p>
    <p>${booking.time}</p>
    <p>Child: ${booking.child}</p>
    <p>Parent: ${booking.parent}</p>
  `;
}

function getConfirmedData() {
  const params = new URLSearchParams(window.location.search);
  const rawDate = params.get("date") || "";

  return {
    child: params.get("child") || "",
    parent: params.get("parent") || "",
    phone: params.get("phone") || "",
    email: params.get("email") || "",
    mentor: params.get("mentor") || "",
    type: params.get("type") || "",
    location: params.get("location") || "",
    rawDate,
    date: rawDate ? formatDisplayDate(rawDate) : "",
    time: params.get("time") || "",
    manage_token: params.get("manage_token") || "",
    booking_reference: params.get("booking_reference") || "",
    adminBooking: params.get("adminBooking") === "true"
  };
}

function openManageBooking() {
  const token = getConfirmedData().manage_token;
  if (token) window.location.href = `manage-booking.html?token=${encodeURIComponent(token)}`;
}

function sendWhatsAppNow() {
  const booking = getConfirmedData();

  const message = `Booking Request:

Child: ${booking.child}
Parent: ${booking.parent}
Phone: ${booking.phone}
Email: ${booking.email}

Session: ${booking.type}
Mentor: ${booking.mentor}
Location: ${booking.location}
Date: ${booking.date}
Time: ${booking.time}
`;

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/447702570699?text=${encoded}`, "_blank");
}

function sendEmailNow() {
  const booking = getConfirmedData();

  const subject = encodeURIComponent("Raving 4 A Reason Booking Request");
  const body = encodeURIComponent(`Booking Request:

Child: ${booking.child}
Parent: ${booking.parent}
Phone: ${booking.phone}
Email: ${booking.email}

Session: ${booking.type}
Mentor: ${booking.mentor}
Location: ${booking.location}
Date: ${booking.date}
Time: ${booking.time}
`);

  window.location.href = `mailto:Raving4areason1@outlook.com?subject=${subject}&body=${body}`;
}

function getCalendarBooking() {
  return document.getElementById("confirmedDetails") ? getConfirmedData() : getBookingData();
}

function getCalendarDates(booking) {
  if (!booking.rawDate || !booking.time) return null;
  const [hour, minute] = booking.time.split(":").map(Number);
  const start = new Date(`${booking.rawDate}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const compact = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { start, end, startCompact: compact(start), endCompact: compact(end) };
}

function addToGoogleCalendar() {
  const booking = getCalendarBooking();
  const dates = getCalendarDates(booking);
  if (!dates) return;
  const title = encodeURIComponent(`Raving 4 A Reason – ${booking.type} Session`);
  const details = encodeURIComponent(`Mentor: ${booking.mentor}`);
  const location = encodeURIComponent(booking.location);
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates.startCompact}/${dates.endCompact}&details=${details}&location=${location}`, "_blank", "noopener,noreferrer");
}

function addToOutlookCalendar() {
  const booking = getCalendarBooking();
  const dates = getCalendarDates(booking);
  if (!dates) return;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: `Raving 4 A Reason – ${booking.type} Session`,
    startdt: dates.start.toISOString(),
    enddt: dates.end.toISOString(),
    body: `Mentor: ${booking.mentor}`,
    location: booking.location
  });
  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function downloadCalendarFile() {
  const booking = getCalendarBooking();
  const dates = getCalendarDates(booking);
  if (!dates) return;
  const safe = value => String(value || "").replace(/[\n\r,;]/g, " ");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Raving 4 A Reason//Booking//EN",
    "BEGIN:VEVENT", `UID:${Date.now()}@raving4areason`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${dates.startCompact}`, `DTEND:${dates.endCompact}`,
    `SUMMARY:${safe(`Raving 4 A Reason – ${booking.type} Session`)}`,
    `DESCRIPTION:${safe(`Mentor: ${booking.mentor}`)}`,
    `LOCATION:${safe(booking.location)}`, "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `r4ar-${booking.rawDate}-${booking.time.replace(":", "")}.ics`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function addToCalendar() { addToGoogleCalendar(); }

/* =========================
   SECURITY SETTINGS
========================= */
async function changePortalPassword(targetRole, mentorId = "") {
  const adminPassword = sessionStorage.getItem("adminPasswordForChanges") || prompt("Enter the current admin password");
  if (!adminPassword) return;
  const newPassword = prompt("Enter the new password (minimum 8 characters)");
  if (!newPassword) return;
  if (newPassword.length < 8) return alert("Password must be at least 8 characters.");
  const confirmPassword = prompt("Enter the new password again");
  if (newPassword !== confirmPassword) return alert("The passwords do not match.");

  const response = await fetch("/.netlify/functions/portal-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "change-password", admin_password: adminPassword, target_role: targetRole, mentor_id: mentorId, new_password: newPassword })
  });
  const data = await response.json();
  if (!response.ok || !data.success) return alert(data.message || "Password could not be changed.");
  if (targetRole === "admin") sessionStorage.setItem("adminPasswordForChanges", newPassword);
  alert("Password updated successfully.");
}

async function renderSecurityMentors() {
  const container = document.getElementById("securityMentorList");
  if (!container) return;
  const { data, error } = await db.from("mentors").select("id,name").order("name");
  if (error) { container.innerHTML = "<p>Error loading mentors.</p>"; return; }
  container.innerHTML = (data || []).map(m => `<div class="security-row"><span>${escapeHtml(m.name)}</span><button class="small-action-btn" onclick="changePortalPassword('mentor','${m.id}')">RESET PASSWORD</button></div>`).join("") || "<p>No mentors added.</p>";
}


/* =========================
   ADMIN MENTORS / LOCATIONS
========================= */

async function loadAdminDropdowns() {
  const typeSelect = document.getElementById("type");
  const mentorInput = document.getElementById("mentor");
  const mentorList = document.getElementById("mentorList");
  const locationList = document.getElementById("locationList");
  const newMentorLocationInput = document.getElementById("newMentorLocation");

  if (!typeSelect || !mentorInput || !mentorList || !locationList) return;

  const { data: locations } = await db
    .from("locations")
    .select("*")
    .order("name", { ascending: true });

  locationList.innerHTML = "";
  (locations || []).forEach(location => {
    locationList.innerHTML += `<option value="${location.name}">`;
  });

  if (newMentorLocationInput) {
    newMentorLocationInput.setAttribute("list", "locationList");
  }

  async function loadMentorsByType() {
    const selectedType = typeSelect.value;
    mentorInput.value = "";
    mentorList.innerHTML = "";

    if (!selectedType) return;

    const { data: mentors } = await db
      .from("mentors")
      .select("*")
      .eq("type", selectedType)
      .order("name", { ascending: true });

    (mentors || []).forEach(mentor => {
      mentorList.innerHTML += `<option value="${mentor.name}">`;
    });
  }

  typeSelect.onchange = loadMentorsByType;
}

async function addMentor() {
  const name = document.getElementById("newMentorName")?.value.trim() || "";
  const type = document.getElementById("newMentorType")?.value || "";
  const location = document.getElementById("newMentorLocation")?.value.trim() || "";
  const email = document.getElementById("newMentorEmail")?.value.trim() || "";

  if (!name || !email || !type || !location) {
  alert("Please fill all mentor fields");
  return;
  }

  const { error } = await db
    .from("mentors")
    .insert([{ name, email, type, location }]);

  if (error) {
    console.error(error);
    alert("Error adding mentor");
    return;
  }

  const { data: existingLocation } = await db
    .from("locations")
    .select("*")
    .eq("name", location)
    .limit(1);

  if (!existingLocation || existingLocation.length === 0) {
    await db.from("locations").insert([{ name: location }]);
  }

  renderAdminMentors();
  renderAdminLocations();
  loadAdminDropdowns();
  loadDashboard();
  loadSearchFilters();

  document.getElementById("newMentorName").value = "";
  document.getElementById("newMentorType").value = "";
  document.getElementById("newMentorLocation").value = "";
  document.getElementById("newMentorEmail").value = "";
}

async function renderAdminMentors() {
  const container = document.getElementById("adminMentors");
  if (!container) return;

  const { data, error } = await db
    .from("mentors")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading mentors.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(mentor => {
    html += `
      <div class="slot-card">
        <p><strong>${mentor.name}</strong></p>
        <p>${mentor.type}</p>
        <p>${mentor.location}</p>
        <button onclick="removeMentor('${mentor.id}')">REMOVE MENTOR</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No mentors added yet.</p>";
}

async function removeMentor(id) {
  const confirmDelete = confirm("Remove this mentor?");
  if (!confirmDelete) return;

  const { error } = await db.from("mentors").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Error removing mentor");
    return;
  }

  renderAdminMentors();
  loadAdminDropdowns();
  loadSearchFilters();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

async function addLocation() {
  const name = document.getElementById("newLocationName")?.value.trim() || "";

  if (!name) {
    alert("Please enter a location");
    return;
  }

  const { data: existing } = await db
    .from("locations")
    .select("*")
    .eq("name", name)
    .limit(1);

  if (existing && existing.length > 0) {
    alert("That location already exists");
    return;
  }

  const { error } = await db.from("locations").insert([{ name }]);

  if (error) {
    console.error(error);
    alert("Error adding location");
    return;
  }

  renderAdminLocations();
  loadAdminDropdowns();
  loadSearchFilters();
  loadDashboard();

  document.getElementById("newLocationName").value = "";
}

async function renderAdminLocations() {
  const container = document.getElementById("adminLocations");
  if (!container) return;

  const { data, error } = await db
    .from("locations")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading locations.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(location => {
    html += `
      <div class="slot-card">
        <p><strong>${location.name}</strong></p>
        <button onclick="removeLocation('${location.id}')">REMOVE LOCATION</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No locations added yet.</p>";
}

async function removeLocation(id) {
  const confirmDelete = confirm("Remove this location?");
  if (!confirmDelete) return;

  const { error } = await db.from("locations").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Error removing location");
    return;
  }

  renderAdminLocations();
  loadAdminDropdowns();
  loadSearchFilters();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

/* =========================
   BOOKINGS ADMIN / MENTOR
========================= */

async function renderBookedSessions() {
  const container = document.getElementById("adminBookedSessions");
  if (!container) return;

  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading bookings.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(booking => {
    html += `
      <div class="slot-card">
        <p><strong>${booking.child}</strong></p>
        <p>Parent: ${booking.parent}</p>
        <p>${booking.mentor} — ${booking.type}</p>
        <p>${booking.location}</p>
        <p>${formatDisplayDate(booking.date)}</p>
        <p>${booking.time}</p>

        <label class="paid-box">
          <input type="checkbox" ${booking.paid ? "checked" : ""} onchange="togglePaid('${booking.id}', ${booking.paid})">
          Studio Booked / Paid
        </label>

        <button onclick="removeBookedSession('${booking.id}')">REMOVE BOOKING</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No booked sessions yet.</p>";
}

async function togglePaid(id, currentStatus) {
  const { error } = await db
    .from("bookings")
    .update({ paid: !currentStatus })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error updating paid status");
    return;
  }

  renderBookedSessions();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

async function removeBookedSession(id) {
  const confirmDelete = confirm("Remove this booking?");
  if (!confirmDelete) return;

  const { error } = await db.from("bookings").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Error removing booking");
    return;
  }

  renderBookedSessions();
  renderMentorBookedSessions();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

async function renderMentorBookedSessions() {
  const container = document.getElementById("mentorBookedSessions");
  const mentorName = getLoggedInMentorName();

  if (!container || !mentorName) return;

  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("mentor", mentorName)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading bookings.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(booking => {
    html += `
      <div class="slot-card">
        <p><strong>${booking.child}</strong></p>
        <p>${booking.location}</p>
        <p>${formatDisplayDate(booking.date)}</p>
        <p>${booking.time}</p>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No booked sessions yet.</p>";
}

/* =========================
   MENTOR AVAILABILITY
========================= */

async function loadMentorLocations() {
  const mentorLocationList = document.getElementById("mentorLocationList");
  if (!mentorLocationList) return;

  const { data, error } = await db
    .from("locations")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  mentorLocationList.innerHTML = "";
  (data || []).forEach(location => {
    mentorLocationList.innerHTML += `<option value="${location.name}">`;
  });
}

async function getMentorType(mentorName) {
  const { data, error } = await db
    .from("mentors")
    .select("*")
    .eq("name", mentorName)
    .limit(1);

  if (error || !data || data.length === 0) return "";

  return data[0].type;
}

async function addMentorAvailability() {
  const mentorName = getLoggedInMentorName();
  const date = document.getElementById("mentorDate")?.value || "";
  const location = document.getElementById("mentorLocation")?.value.trim() || "";
  const time = document.getElementById("mentorTime")?.value || "";

  if (!mentorName || !date || !location || !time) {
    alert("Please fill all fields");
    return;
  }

  const type = await getMentorType(mentorName);

  if (!type) {
    alert("Mentor type not found");
    return;
  }

  const { error } = await db
    .from("sessions")
    .insert([{ date, type, mentor: mentorName, location, time }]);

  if (error) {
    console.error(error);
    alert("Error adding availability");
    return;
  }

  renderMentorAvailability();
  renderAdminSlots();
  loadCalendar();
  loadDashboard();

  document.getElementById("mentorDate").value = "";
  document.getElementById("mentorLocation").value = "";
  document.getElementById("mentorTime").value = "";
}

async function renderMentorAvailability() {
  const container = document.getElementById("mentorAvailabilityList");
  const mentorName = getLoggedInMentorName();

  if (!container || !mentorName) return;

  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("mentor", mentorName)
    .gte("date", getTodayDate())
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading availability.</p>";
    return;
  }

  let html = "";

  (data || []).forEach(slot => {
    html += `
      <div class="slot-card">
        <p><strong>${formatDisplayDate(slot.date)}</strong></p>
        <p>${slot.location}</p>
        <p>${slot.time}</p>
        <button onclick="removeMentorAvailability('${slot.id}')">REMOVE</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No availability added yet.</p>";
}

async function removeMentorAvailability(id) {
  const confirmDelete = confirm("Remove this session?");
  if (!confirmDelete) return;

  const { error } = await db.from("sessions").delete().eq("id", id);

  if (error) {
    console.error(error);
    alert("Error removing session");
    return;
  }

  renderMentorAvailability();
  renderAdminSlots();
  loadCalendar();
  loadDashboard();
  updateAdminMessageBadge();
  renderSecurityMentors();
}

/* =========================
   MEMBERS
========================= */

let membersCache = [];

async function addMember() {
  const name = document.getElementById("memberName")?.value.trim() || "";
  const djMcName = document.getElementById("memberDjMcName")?.value.trim() || "";
  const type = document.getElementById("memberType")?.value || "";

  if (!name || !type) {
    alert("Please enter the member name and select a type");
    return;
  }

  const { error } = await db
    .from("members")
    .insert([{
      name,
      dj_mc_name: djMcName || null,
      type
    }]);

  if (error) {
    console.error("Error adding member:", error);
    alert("Error adding member");
    return;
  }

  document.getElementById("memberName").value = "";
  document.getElementById("memberDjMcName").value = "";
  document.getElementById("memberType").value = "";

  await renderMembers();
  await loadDashboard();
}

async function renderMembers() {
  const container = document.getElementById("adminMembers");
  if (!container) return;

  const { data, error } = await db
    .from("members")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading members:", error);
    container.innerHTML = '<p class="error-text">Error loading members.</p>';
    return;
  }

  membersCache = data || [];
  filterMembers();
}

function filterMembers() {
  const container = document.getElementById("adminMembers");
  if (!container) return;

  const search = (document.getElementById("memberSearch")?.value || "")
    .trim()
    .toLowerCase();
  const typeFilter = document.getElementById("memberTypeFilter")?.value || "";

  const filtered = membersCache.filter(member => {
    const name = (member.name || "").toLowerCase();
    const djMcName = (member.dj_mc_name || "").toLowerCase();
    const matchesSearch = !search || name.includes(search) || djMcName.includes(search);
    const matchesType = !typeFilter || member.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p>No matching members found.</p>';
    return;
  }

  container.innerHTML = filtered.map(member => `
    <div class="member-card">
      <div class="member-card-header">
        <div>
          <h3>${escapeHtml(member.name || "Unnamed member")}</h3>
          ${member.dj_mc_name
            ? `<p class="member-alias">DJ / MC Name: ${escapeHtml(member.dj_mc_name)}</p>`
            : ""}
        </div>
        <span class="member-type-badge ${getMemberTypeClass(member.type)}">
          ${escapeHtml(member.type || "Other")}
        </span>
      </div>
      <div class="member-card-footer">
        <span>Added ${formatShortDate(member.created_at)}</span>
        <button class="small-danger-btn" onclick="removeMember('${member.id}')">DELETE</button>
      </div>
    </div>
  `).join("");
}

async function removeMember(id) {
  const confirmDelete = confirm("Remove this member?");
  if (!confirmDelete) return;

  const { error } = await db
    .from("members")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error removing member:", error);
    alert("Error removing member");
    return;
  }

  await renderMembers();
  await loadDashboard();
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function getMemberTypeClass(type) {
  const classes = {
    "Lessons Paid": "type-paid",
    "Lessons Funded": "type-funded",
    "Membership": "type-membership",
    "Part Funded": "type-part-funded",
    "Other": "type-other"
  };
  return classes[type] || "type-other";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function loadBookPageMode() {
  const title = document.getElementById("bookPageTitle");
  const notice = document.getElementById("adminBookingNotice");

  if (isAdminAssistedBooking()) {
    if (title) title.textContent = "Book Session for Parent";
    if (notice) notice.style.display = "block";
  }
}


/* =========================
   NEWSLETTERS
========================= */
async function fetchNewsletters() {
  const { data, error } = await db.from("newsletters").select("*").order("published_date", { ascending: false }).order("created_at", { ascending: false }).limit(3);
  if (error) { console.error(error); return []; }
  return data || [];
}
async function loadNewsletterPage() {
  const container = document.getElementById("newsletterPublicList");
  if (!container) return;
  const rows = await fetchNewsletters();
  if (!rows.length) { container.innerHTML = '<p>No newsletters available yet.</p>'; return; }
  container.innerHTML = rows.map((n, i) => `<div class="slot-card newsletter-card"><h2>${i===0?'Latest Newsletter':'Previous Newsletter'}</h2><p><strong>${escapeHtml(n.title)}</strong></p><p>Published: ${formatDisplayDate(n.published_date)}</p><a class="button-link" href="${n.file_url}" target="_blank" rel="noopener">DOWNLOAD PDF</a></div>`).join("");
}
async function renderNewsletterAdmin() {
  const container = document.getElementById("adminNewsletterList");
  if (!container) return;
  const rows = await fetchNewsletters();
  container.innerHTML = rows.length ? rows.map(n => `<div class="slot-card"><p><strong>${escapeHtml(n.title)}</strong></p><p>${formatDisplayDate(n.published_date)}</p><a href="${n.file_url}" target="_blank">Open PDF</a><button onclick="deleteNewsletter('${n.id}','${encodeURIComponent(n.storage_path)}')" class="danger-btn">DELETE</button></div>`).join("") : '<p>No newsletters uploaded.</p>';
}
async function uploadNewsletter() {
  const title = document.getElementById("newsletterTitle")?.value.trim() || "";
  const publishedDate = document.getElementById("newsletterPublishedDate")?.value || "";
  const file = document.getElementById("newsletterFile")?.files?.[0];
  if (!title || !publishedDate || !file) return alert("Please enter a title, date and PDF file");
  if (file.type !== "application/pdf") return alert("Please choose a PDF file");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${Date.now()}-${safe}`;
  const { error: uploadError } = await db.storage.from("newsletters").upload(path, file, { contentType: "application/pdf" });
  if (uploadError) { console.error(uploadError); return alert("Newsletter upload failed"); }
  const { data: publicData } = db.storage.from("newsletters").getPublicUrl(path);
  const { error } = await db.from("newsletters").insert([{ title, published_date: publishedDate, storage_path: path, file_url: publicData.publicUrl }]);
  if (error) { console.error(error); return alert("Could not save newsletter"); }
  const { data: allRows } = await db.from("newsletters").select("id,storage_path").order("published_date", { ascending: false }).order("created_at", { ascending: false });
  for (const old of (allRows || []).slice(3)) {
    await db.storage.from("newsletters").remove([old.storage_path]);
    await db.from("newsletters").delete().eq("id", old.id);
  }
  document.getElementById("newsletterTitle").value = "";
  document.getElementById("newsletterPublishedDate").value = "";
  document.getElementById("newsletterFile").value = "";
  renderNewsletterAdmin(); loadNewsletterPage();
}
async function deleteNewsletter(id, encodedPath) {
  if (!confirm("Delete this newsletter?")) return;
  const path = decodeURIComponent(encodedPath);
  await db.storage.from("newsletters").remove([path]);
  const { error } = await db.from("newsletters").delete().eq("id", id);
  if (error) return alert("Could not delete newsletter");
  renderNewsletterAdmin();
}

/* =========================
   BOOKING-SPECIFIC MESSAGING
========================= */
function getManageToken() { return new URLSearchParams(window.location.search).get("token") || ""; }
async function loadManageBookingPage() {
  const details = document.getElementById("manageBookingDetails");
  if (!details) return;
  const token = getManageToken();
  if (!token) { details.innerHTML = '<p>Invalid booking link.</p>'; return; }
  const { data, error } = await db.from("bookings").select("*").eq("manage_token", token).limit(1);
  if (error || !data?.length) { details.innerHTML = '<p>This booking link is invalid or no longer available.</p>'; return; }
  currentManagedBooking = data[0];
  details.innerHTML = `${currentManagedBooking.booking_reference ? `<p><strong>Reference:</strong> ${escapeHtml(currentManagedBooking.booking_reference)}</p>` : ""}<p><strong>${escapeHtml(currentManagedBooking.child)}</strong></p><p>Parent: ${escapeHtml(currentManagedBooking.parent)}</p><p>${escapeHtml(currentManagedBooking.mentor)} — ${escapeHtml(currentManagedBooking.type)}</p><p>${escapeHtml(currentManagedBooking.location)}</p><p>${formatDisplayDate(currentManagedBooking.date)} at ${escapeHtml(currentManagedBooking.time)}</p>`;
  document.getElementById("parentMessageArea").style.display = "block";
  await renderParentMessages();
}
async function fetchMessagesForBooking(bookingId) {
  const { data, error } = await db.from("messages").select("*").eq("booking_id", bookingId).order("created_at", { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}
function messageBubble(m) {
  return `<div class="message-bubble ${m.sender_role}"><div class="message-meta"><strong>${escapeHtml(m.sender_name)}</strong> · ${new Date(m.created_at).toLocaleString('en-GB')}</div><div>${escapeHtml(m.body).replace(/\n/g,'<br>')}</div></div>`;
}
async function renderParentMessages() {
  if (!currentManagedBooking) return;
  currentManagedMessages = await fetchMessagesForBooking(currentManagedBooking.id);
  const box = document.getElementById("parentMessages");
  if (box) box.innerHTML = currentManagedMessages.length ? currentManagedMessages.map(messageBubble).join("") : '<p>No messages yet.</p>';
  await db.from("messages").update({ read_by_parent: true }).eq("booking_id", currentManagedBooking.id);
}
async function sendParentMessage() {
  if (!currentManagedBooking) return;
  const body = document.getElementById("parentMessageText")?.value.trim() || "";
  const recipientScope = document.getElementById("messageRecipient")?.value || "mentor";
  if (!body) return alert("Please type a message");
  const { error } = await db.from("messages").insert([{ booking_id: currentManagedBooking.id, sender_role: "parent", sender_name: currentManagedBooking.parent, recipient_scope: recipientScope, body, read_by_parent: true, read_by_admin: recipientScope === "mentor", read_by_mentor: recipientScope === "admin" }]);
  if (error) { console.error(error); return alert("Message could not be sent"); }
  document.getElementById("parentMessageText").value = "";
  renderParentMessages();
}
async function deleteConversationAsParent() {
  if (!currentManagedBooking || !confirm("Permanently delete this conversation?")) return;
  const { error } = await db.from("messages").delete().eq("booking_id", currentManagedBooking.id);
  if (error) return alert("Could not delete conversation");
  renderParentMessages();
}
async function getMessageThreads(role, mentorName="") {
  let bookingsQuery = db.from("bookings").select("id,booking_reference,child,parent,mentor,type,location,date,time").order("date", { ascending: true });
  if (role === "mentor") bookingsQuery = bookingsQuery.eq("mentor", mentorName);
  const { data: bookings } = await bookingsQuery;
  if (!bookings?.length) return [];
  const ids = bookings.map(b=>b.id);
  const { data: messages } = await db.from("messages").select("*").in("booking_id", ids).order("created_at", { ascending: true });
  const byId = Object.groupBy ? Object.groupBy(messages || [], m=>m.booking_id) : (messages||[]).reduce((a,m)=>((a[m.booking_id]??=[]).push(m),a),{});
  return bookings.map(b=>({ booking:b, messages:byId[b.id]||[] })).filter(t => role==='admin' ? t.messages.some(m=>m.recipient_scope==='admin'||m.recipient_scope==='both'||m.sender_role==='admin') : t.messages.some(m=>m.recipient_scope==='mentor'||m.recipient_scope==='both'||m.sender_role==='mentor'));
}
function threadHtml(thread, role) {
  const b=thread.booking;
  return `<div class="message-thread"><div class="slot-card">${b.booking_reference ? `<p><strong>Reference:</strong> ${escapeHtml(b.booking_reference)}</p>` : ""}<p><strong>${escapeHtml(b.child)}</strong> · Parent: ${escapeHtml(b.parent)}</p><p>${escapeHtml(b.mentor)} — ${escapeHtml(b.type)}</p><p>${formatDisplayDate(b.date)} ${escapeHtml(b.time)} · ${escapeHtml(b.location)}</p></div><div class="message-list">${thread.messages.map(messageBubble).join("")}</div><textarea id="reply-${role}-${b.id}" class="message-textarea" placeholder="Type reply"></textarea><button onclick="sendStaffReply('${role}','${b.id}')">REPLY TO PARENT</button><button onclick="downloadThreadPdf('${b.id}','${role}')" class="secondary">DOWNLOAD CHAT PDF</button><button onclick="deleteStaffConversation('${b.id}','${role}')" class="danger-btn">DELETE CHAT</button></div>`;
}
async function renderAdminMessages() {
  const container=document.getElementById("adminMessageThreads"); if(!container)return;
  const threads=await getMessageThreads("admin");
  container.innerHTML=threads.length?threads.map(t=>threadHtml(t,"admin")).join(""):'<p>No messages for admin.</p>';
  const ids = threads.map(t=>t.booking.id);
  if (ids.length) await db.from("messages").update({read_by_admin:true}).in("booking_id",ids);
  updateAdminMessageBadge();
  renderSecurityMentors();
}
async function renderMentorMessages() {
  const container=document.getElementById("mentorMessageThreads"); if(!container)return;
  const name=getLoggedInMentorName(); const threads=await getMessageThreads("mentor",name);
  container.innerHTML=threads.length?threads.map(t=>threadHtml(t,"mentor")).join(""):'<p>No mentor messages.</p>';
  const ids = threads.map(t=>t.booking.id);
  if (ids.length) await db.from("messages").update({read_by_mentor:true}).in("booking_id",ids);
  updateMentorMessageBadge();
}
async function sendStaffReply(role, bookingId) {
  const body=document.getElementById(`reply-${role}-${bookingId}`)?.value.trim()||""; if(!body)return alert("Please type a reply");
  const senderName=role==='admin'?'Raving 4 A Reason Admin':getLoggedInMentorName();
  const {error}=await db.from("messages").insert([{booking_id:bookingId,sender_role:role,sender_name:senderName,recipient_scope:"parent",body,read_by_parent:false,read_by_admin:role==='admin',read_by_mentor:role==='mentor'}]);
  if(error)return alert("Reply could not be sent");
  if(role==='admin')renderAdminMessages();else renderMentorMessages();
}
async function deleteStaffConversation(bookingId,role){if(!confirm("Permanently delete this conversation?"))return;await db.from("messages").delete().eq("booking_id",bookingId);if(role==='admin')renderAdminMessages();else renderMentorMessages();}
async function updateAdminMessageBadge(){const badge=document.getElementById("adminMessageBadge");if(!badge)return;const{count}=await db.from("messages").select("id",{count:"exact",head:true}).eq("read_by_admin",false).in("recipient_scope",["admin","both"]);badge.textContent=count||"";badge.style.display=count?"inline-flex":"none";}
async function updateMentorMessageBadge(){const badge=document.getElementById("mentorMessageBadge");if(!badge)return;const name=getLoggedInMentorName();if(!name)return;const{data:bookings}=await db.from("bookings").select("id").eq("mentor",name);const ids=(bookings||[]).map(b=>b.id);if(!ids.length){badge.style.display="none";return;}const{count}=await db.from("messages").select("id",{count:"exact",head:true}).in("booking_id",ids).eq("read_by_mentor",false).in("recipient_scope",["mentor","both"]);badge.textContent=count||"";badge.style.display=count?"inline-flex":"none";}
async function downloadThreadPdf(bookingId,role){const msgs=await fetchMessagesForBooking(bookingId);const {data:b}=await db.from("bookings").select("*").eq("id",bookingId).single();createConversationPdf(b,msgs);}
function downloadConversationPdf(){if(currentManagedBooking)createConversationPdf(currentManagedBooking,currentManagedMessages);}
function createConversationPdf(b,msgs){if(!window.jspdf)return alert("PDF library is not available");const{jsPDF}=window.jspdf;const doc=new jsPDF();let y=15;doc.setFontSize(16);doc.text("Raving 4 A Reason Conversation",15,y);y+=10;doc.setFontSize(10);[...(b.booking_reference ? [`Reference: ${b.booking_reference}`] : []),`Member: ${b.child}`,`Parent: ${b.parent}`,`Mentor: ${b.mentor}`,`Session: ${b.type}`,`Date: ${formatDisplayDate(b.date)} ${b.time}`,`Location: ${b.location}`].forEach(line=>{doc.text(line,15,y);y+=6;});y+=4;(msgs||[]).forEach(m=>{const lines=doc.splitTextToSize(`${m.sender_name} (${new Date(m.created_at).toLocaleString('en-GB')}): ${m.body}`,180);if(y+lines.length*5>280){doc.addPage();y=15;}doc.text(lines,15,y);y+=lines.length*5+4;});doc.save(`conversation-${b.child.replace(/[^a-z0-9]/gi,'-')}.pdf`);}

/* =========================
   PAGE LOAD
========================= */

window.onload = () => {
  checkParentLogin();
  loadBookPageMode();
  loadCalendar();
  loadBookingPage();
  loadConfirmedPage();
  loadSearchFilters();
  checkAdminLogin();
  checkMentorLogin();
  loadNewsletterPage();
  loadManageBookingPage();

  const memberSearch = document.getElementById("memberSearch");
  const memberTypeFilter = document.getElementById("memberTypeFilter");

  if (memberSearch) memberSearch.addEventListener("input", filterMembers);
  if (memberTypeFilter) memberTypeFilter.addEventListener("change", filterMembers);

  const phoneInput = document.getElementById("parentPhone");

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
    });
  }
};