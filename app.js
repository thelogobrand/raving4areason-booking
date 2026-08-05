const SUPABASE_URL = "https://ejizwiegnxtwglihrxiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KJx1attn5Dbo_Zex4IBc6A_GZR3xytW";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = "admin";
let ADMIN_PASSWORD = localStorage.getItem("r4arAdminPassword") || "R4AR";
const MENTOR_PASSWORD = "Mentor";

const PARENT_USERNAME = "R4ARparent";
let PARENT_PASSWORD = localStorage.getItem("r4arParentPassword") || "R4AR";
const DONATION_URL = "https://www.gofundme.com/f/buy-more-equipment-for-young-peoples-workshops-worksh?attribution_id=sl:e5544b21-38bf-4f5d-9b45-75d32cf8ef34&lang=en_GB&utm_campaign=fp_sharesheet&utm_medium=customer&utm_source=qr_code";

async function hashPassword(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================
   HELPERS
========================= */

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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

function goToBooking() {
  window.location.href = "book.html";
}

function loginParent() {
  const username = (document.getElementById("parentUsername")?.value || "").trim();
  const password = document.getElementById("parentPassword")?.value || "";

  if (username === PARENT_USERNAME && password === PARENT_PASSWORD) {
    localStorage.setItem("parentLoggedIn", "true");
    showParentMenu();
  } else {
    alert("Wrong parent password");
  }
}

function logoutParent() {
  localStorage.removeItem("parentLoggedIn");
  window.location.href = "index.html";
}

function showParentMenu() {
  const loginBox = document.getElementById("parentLoginBox");
  const parentMenu = document.getElementById("parentMenu");
  if (loginBox) loginBox.style.display = "none";
  if (parentMenu) parentMenu.style.display = "block";
}

function checkParentLogin() {
  const loginBox = document.getElementById("parentLoginBox");
  const parentMenu = document.getElementById("parentMenu");
  if (!loginBox || !parentMenu) return;

  if (localStorage.getItem("parentLoggedIn") === "true") {
    showParentMenu();
  } else {
    loginBox.style.display = "block";
    parentMenu.style.display = "none";
  }
}

function requireParentLogin() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  const protectedPages = ["book.html", "weekly-calendar.html", "newsletter.html", "contact.html"];
  if (protectedPages.includes(page) && localStorage.getItem("parentLoggedIn") !== "true") {
    window.location.replace("index.html");
    return false;
  }
  return true;
}

function goToNewsletter() {
  window.location.href = "newsletter.html";
}

function goToContact() {
  window.location.href = "contact.html";
}

function openDonationPage() {
  window.open(DONATION_URL, "_blank", "noopener,noreferrer");
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
   ADMIN LOGIN
========================= */

function loginAdmin() {
  const username = document.getElementById("adminUsername")?.value || "";
  const password = document.getElementById("adminPassword")?.value || "";

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("adminLoggedIn", "true");
    showAdminPanel();
  } else {
    alert("Wrong username or password");
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "admin.html";
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

  const { data, error } = await db
    .from("mentors")
    .select("*")
    .ilike("name", username)
    .limit(1);

  if (error) {
    console.error(error);
    alert("Error checking mentor");
    return;
  }

  if (!data || data.length === 0) {
    alert("Mentor name not found");
    return;
  }

  const mentor = data[0];
  const suppliedHash = await hashPassword(password);
  const validPassword = mentor.password_hash
    ? suppliedHash === mentor.password_hash
    : password === MENTOR_PASSWORD;

  if (!validPassword) {
    alert("Wrong password");
    return;
  }

  localStorage.setItem("mentorLoggedIn", "true");
  localStorage.setItem("mentorName", mentor.name);
  localStorage.setItem("mentorId", mentor.id || "");

  showMentorPanel();
}

function logoutMentor() {
  localStorage.removeItem("mentorLoggedIn");
  localStorage.removeItem("mentorName");
  localStorage.removeItem("mentorId");
  showMentorLoginBox();
}

function getLoggedInMentorName() {
  return localStorage.getItem("mentorName") || "";
}

async function showMentorPanel() {
  const mentorLoginBox = document.getElementById("mentorLoginBox");
  const mentorPanel = document.getElementById("mentorPanel");
  const mentorName = getLoggedInMentorName();

  if (mentorLoginBox) mentorLoginBox.style.display = "none";
  if (mentorPanel) mentorPanel.style.display = "block";

  const mentorWelcome = document.getElementById("mentorWelcome");
  if (mentorWelcome && mentorName) {
    mentorWelcome.textContent = `Welcome, ${mentorName} 👋`;
  }

  const mentorToday = document.getElementById("mentorToday");
  if (mentorToday) {
    mentorToday.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  await initialiseMentorPortal();
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

    mentorSelect.innerHTML =
      '<option value="">Unable to load mentors</option>';

    locationSelect.innerHTML =
      '<option value="">Unable to load locations</option>';

    return;
  }

  const sessions = data || [];

  const mentors = [
    ...new Set(
      sessions
        .map(session => session.mentor)
        .filter(Boolean)
    )
  ].sort();

  const locations = [
    ...new Set(
      sessions
        .map(session => session.location)
        .filter(Boolean)
    )
  ].sort();

  mentorSelect.innerHTML =
    '<option value="">All Mentors</option>';

  locationSelect.innerHTML =
    '<option value="">All Locations</option>';

  mentors.forEach(mentor => {
    const option = document.createElement("option");
    option.value = mentor;
    option.textContent = mentor;
    mentorSelect.appendChild(option);
  });

  locations.forEach(location => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationSelect.appendChild(option);
  });

  if (mentors.includes(currentMentor)) {
    mentorSelect.value = currentMentor;
  }

  if (locations.includes(currentLocation)) {
    locationSelect.value = currentLocation;
  }

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
  const notes = document.getElementById("bookingNotes")?.value.trim() || "";
  const rawDate = params.get("date") || "";

  return {
    child,
    parent,
    phone,
    email,
    notes,
    mentor: params.get("mentor") || "",
    type: params.get("type") || "",
    location: params.get("location") || "",
    rawDate,
    date: rawDate ? formatDisplayDate(rawDate) : "",
    time: params.get("time") || "",
    session_id: params.get("session_id") || ""
  };
}

async function confirmBooking() {
  const booking = getBookingData();
  const consent = document.getElementById("gdprConsent")?.checked;

  if (!consent) {
    alert("Please confirm consent to continue");
    return;
  }

  if (!booking.child || !booking.parent || !booking.phone || !booking.email) {
    alert("Please fill all details");
    return;
  }

  const phone = booking.phone.replace(/\s/g, "");

  if (!/^\d{10,13}$/.test(phone)) {
    alert("Please enter a valid phone number");
    return;
  }

  const { error } = await db
    .from("bookings")
    .insert([{
      child: booking.child,
      parent: booking.parent,
      phone: phone,
      email: booking.email,
      mentor: booking.mentor,
      type: booking.type,
      location: booking.location,
      date: booking.rawDate,
      time: booking.time,
      paid: false,
      notes: booking.notes || null
    }]);

  if (error) {
    console.error(error);
    alert("Error saving booking");
    return;
  }

  await removeBookedSlot(booking);
await fetch("/.netlify/functions/send-booking-email", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
booking: {
child: booking.child,
parent: booking.parent,
phone: phone,
date: booking.date,
time: booking.time,
location: booking.location,
type: booking.type,
parent_email: booking.email
}
})
});

  const params = new URLSearchParams({
    child: booking.child,
    parent: booking.parent,
    phone: phone,
    email: booking.email,
    mentor: booking.mentor,
    type: booking.type,
    location: booking.location,
    date: booking.rawDate,
    time: booking.time
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

  if (!booking.mentor || !booking.type || !booking.location || !booking.rawDate || !booking.time) return;

  container.innerHTML = `
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
    time: params.get("time") || ""
  };
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

function addToCalendar() {
  const booking = document.getElementById("confirmedDetails")
    ? getConfirmedData()
    : getBookingData();

  if (!booking.rawDate || !booking.time) return;

  const startDate = booking.rawDate.replace(/-/g, "");
  const endDate = booking.rawDate.replace(/-/g, "");

  const [hour, minute] = booking.time.split(":");
  const start = `${startDate}T${hour}${minute}00`;
  const endHour = String(parseInt(hour, 10) + 1).padStart(2, "0");
  const end = `${endDate}T${endHour}${minute}00`;

  const title = encodeURIComponent(`Raving 4 A Reason – ${booking.type} Session`);
  const details = encodeURIComponent(`Mentor: ${booking.mentor}`);
  const location = encodeURIComponent(booking.location);

  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
    "_blank"
  );
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
  const artistName = document.getElementById("newMentorArtistName")?.value.trim() || "";
  const email = document.getElementById("newMentorEmail")?.value.trim() || "";
  const phone = document.getElementById("newMentorPhone")?.value.trim() || "";
  const type = document.getElementById("newMentorType")?.value || "";
  const location = document.getElementById("newMentorLocation")?.value.trim() || "";
  const adminNotes = document.getElementById("newMentorAdminNotes")?.value.trim() || "";
  const dbsChecked = Boolean(document.getElementById("newMentorDbsChecked")?.checked);

  if (!name || !email || !type || !location) {
    alert("Please complete name, email, type and location");
    return;
  }

  const { error } = await db.from("mentors").insert([{
    name, artist_name: artistName || null, email, phone: phone || null,
    type, location, admin_notes: adminNotes || null, dbs_checked: dbsChecked
  }]);
  if (error) { console.error(error); alert("Error adding mentor"); return; }

  const { data: existingLocation } = await db.from("locations").select("id").eq("name", location).limit(1);
  if (!existingLocation?.length) await db.from("locations").insert([{ name: location }]);

  ["newMentorName","newMentorArtistName","newMentorEmail","newMentorPhone","newMentorLocation","newMentorAdminNotes"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  const typeEl=document.getElementById("newMentorType"); if(typeEl) typeEl.value="";
  const dbsEl=document.getElementById("newMentorDbsChecked"); if(dbsEl) dbsEl.checked=false;
  alert("Mentor created. Temporary password: Mentor");
  await Promise.all([renderAdminMentors(), loadAdminDropdowns(), loadDashboard()]);
}

async function renderAdminMentors() {
  const container = document.getElementById("adminMentors");
  if (!container) return;
  const { data, error } = await db.from("mentors").select("*").order("name", { ascending: true });
  if (error) { console.error(error); container.innerHTML="<p>Error loading mentors.</p>"; return; }
  const q=(document.getElementById("mentorAdminSearch")?.value||"").toLowerCase();
  const rows=(data||[]).filter(m => [m.name,m.artist_name,m.email,m.type,m.location].join(" ").toLowerCase().includes(q));
  container.innerHTML=rows.map(m=>`<div class="slot-card mentor-admin-card"><p><strong>${escapeHtml(m.artist_name||m.name)}</strong></p><p>${escapeHtml(m.name)}</p><p>${escapeHtml(m.email||"")}${m.phone?` · ${escapeHtml(m.phone)}`:""}</p><p>${escapeHtml(m.type||"")} · ${escapeHtml(m.location||"")}</p>${m.dbs_checked?'<p class="dbs-badge">DBS Checked ✓</p>':''}${m.admin_notes?`<p class="muted">${escapeHtml(m.admin_notes)}</p>`:""}<div class="inline-actions"><button class="secondary" onclick="editMentor('${m.id}')">EDIT</button><button onclick="resetMentorPassword('${m.id}','${escapeHtml((m.artist_name||m.name).replace(/'/g,"&#39;"))}')">RESET PASSWORD</button><button class="danger-btn" onclick="removeMentor('${m.id}')">DELETE</button></div></div>`).join("")||"<p>No mentors added yet.</p>";
}

async function editMentor(id) {
  const { data, error } = await db.from("mentors").select("*").eq("id", id).single();
  if (error || !data) { alert("Could not load mentor"); return; }
  const name=prompt("Name", data.name||""); if(name===null) return;
  const artist_name=prompt("Artist Name (optional)", data.artist_name||""); if(artist_name===null) return;
  const email=prompt("Email", data.email||""); if(email===null) return;
  const phone=prompt("Phone (optional)", data.phone||""); if(phone===null) return;
  const type=prompt("Default Type: DJ, MC or Production", data.type||"DJ"); if(type===null) return;
  const location=prompt("Default Location", data.location||""); if(location===null) return;
  const admin_notes=prompt("Admin Notes (optional)", data.admin_notes||""); if(admin_notes===null) return;
  const dbs_checked=confirm("Is DBS checked? Press OK for Yes, Cancel for No.");
  const { error:updateError }=await db.from("mentors").update({name:name.trim(),artist_name:artist_name.trim()||null,email:email.trim(),phone:phone.trim()||null,type:type.trim(),location:location.trim(),admin_notes:admin_notes.trim()||null,dbs_checked}).eq("id",id);
  if(updateError){console.error(updateError);alert("Error updating mentor");return;} await renderAdminMentors();
}

async function resetMentorPassword(id, displayName) {
  if(!confirm(`Reset ${displayName}'s password to Mentor?`)) return;
  const { error }=await db.from("mentors").update({password_hash:null}).eq("id",id);
  if(error){console.error(error);alert("Error resetting password");return;} alert("Password reset to Mentor");
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
}

async function renderMentorBookedSessions() {
  const container = document.getElementById("mentorBookedSessions");
  const mentorName = getLoggedInMentorName();
  if (!container || !mentorName) return;

  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("mentor", mentorName)
    .gte("date", getTodayDate())
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading bookings.</p>";
    return;
  }

  const bookings = data || [];
  container.innerHTML = bookings.map(booking => `
    <div class="slot-card">
      <p><strong>${escapeHtml(booking.child)}</strong></p>
      <p>Parent: ${escapeHtml(booking.parent || "")}</p>
      <p>${escapeHtml(booking.type || "")}</p>
      <p>${escapeHtml(booking.location || "")}</p>
      <p>${formatDisplayDate(booking.date)}</p>
      <p>${escapeHtml(booking.time || "")}</p>
      ${booking.notes ? `
        <div class="booking-note">
          <strong>Parent notes</strong>
          <p>${escapeHtml(booking.notes)}</p>
        </div>` : ""}
    </div>
  `).join("") || "<p>No upcoming booked sessions.</p>";
}

const MENTOR_TIME_OPTIONS = [
  "09:00","10:00","11:00","12:00","13:00","14:00",
  "15:00","16:00","17:00","18:00","19:00","20:00"
];
let selectedMentorTimes = new Set();
let mentorProfileCache = null;

async function initialiseMentorPortal() {
  selectedMentorTimes.clear();
  renderMentorTimeButtons();

  const dateInput = document.getElementById("mentorDate");
  if (dateInput) {
    dateInput.min = getTodayDate();
    dateInput.onchange = clearSelectedMentorTimes;
  }

  const expenseDate = document.getElementById("expenseDate");
  if (expenseDate && !expenseDate.value) expenseDate.value = getTodayDate();

  await Promise.all([
    loadMentorProfileAndDefaults(),
    renderMentorAvailability(),
    renderMentorBookedSessions(),
    renderMentorMessages(),
    renderMentorNewsletter(),
    renderMentorExpenses(),
    loadMentorDashboard()
  ]);
  updateExpenseFields();
}

function renderMentorTimeButtons() {
  const container = document.getElementById("mentorTimeButtons");
  if (!container) return;

  container.innerHTML = MENTOR_TIME_OPTIONS.map(time => `
    <button type="button"
      class="time-choice ${selectedMentorTimes.has(time) ? "selected" : ""}"
      onclick="toggleMentorTime('${time}')">${time}</button>
  `).join("");
  updateAddSessionsButton();
}

function toggleMentorTime(time) {
  if (selectedMentorTimes.has(time)) selectedMentorTimes.delete(time);
  else selectedMentorTimes.add(time);
  renderMentorTimeButtons();
}

function clearSelectedMentorTimes() {
  selectedMentorTimes.clear();
  renderMentorTimeButtons();
}

function updateAddSessionsButton() {
  const button = document.getElementById("addMentorSessionsBtn");
  if (!button) return;
  const count = selectedMentorTimes.size;
  button.textContent = count > 0
    ? `ADD ${count} SESSION${count === 1 ? "" : "S"}`
    : "ADD SESSIONS";
}

async function loadMentorProfileAndDefaults() {
  const mentorName = getLoggedInMentorName();
  if (!mentorName) return;

  const [{ data: mentorRows, error: mentorError }, { data: locationRows, error: locationError }] =
    await Promise.all([
      db.from("mentors").select("*").eq("name", mentorName).limit(1),
      db.from("locations").select("*").order("name", { ascending: true })
    ]);

  if (mentorError) console.error(mentorError);
  if (locationError) console.error(locationError);

  mentorProfileCache = mentorRows?.[0] || null;
  if (!mentorProfileCache) return;

  localStorage.setItem("mentorId", mentorProfileCache.id || "");

  const displayName = mentorProfileCache.artist_name?.trim() || mentorProfileCache.name;
  const mentorWelcome = document.getElementById("mentorWelcome");
  if (mentorWelcome) mentorWelcome.textContent = `Welcome, ${displayName}`;

  const typeSelect = document.getElementById("mentorTypeSelect");
  if (typeSelect) {
    const defaultType = mentorProfileCache.type || "DJ";
    typeSelect.value = ["DJ","MC","Production"].includes(defaultType) ? defaultType : "DJ";
  }

  const locationSelect = document.getElementById("mentorLocationSelect");
  const profileLocationSelect = document.getElementById("profileDefaultLocation");
  const fillLocations = (select, includeBlank = true) => {
    if (!select) return;
    select.innerHTML = includeBlank ? '<option value="">Select location</option>' : '';
    (locationRows || []).forEach(item => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      select.appendChild(option);
    });
  };

  fillLocations(locationSelect);
  fillLocations(profileLocationSelect);
  if (locationSelect && mentorProfileCache.location) locationSelect.value = mentorProfileCache.location;
  if (profileLocationSelect && mentorProfileCache.location) profileLocationSelect.value = mentorProfileCache.location;

  const profileType = document.getElementById("profileDefaultType");
  if (profileType) profileType.value = mentorProfileCache.type || "DJ";

  const avatarButton = document.getElementById("mentorAvatarButton");
  const avatarImage = document.getElementById("mentorAvatarImage");
  const avatarInitials = document.getElementById("mentorAvatarInitials");
  const initials = (displayName || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");

  if (mentorProfileCache.profile_image_url) {
    if (avatarImage) {
      avatarImage.src = `${mentorProfileCache.profile_image_url}${mentorProfileCache.profile_image_url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      avatarImage.style.display = "block";
    }
    if (avatarInitials) avatarInitials.style.display = "none";
  } else {
    if (avatarImage) avatarImage.style.display = "none";
    if (avatarInitials) {
      avatarInitials.textContent = initials || "M";
      avatarInitials.style.display = "flex";
    }
  }
  if (avatarButton) avatarButton.title = `Open ${displayName}'s profile`;

  const fields = {
    profileName: mentorProfileCache.name || "",
    profileArtistName: mentorProfileCache.artist_name || "",
    profileEmail: mentorProfileCache.email || ""
  };
  Object.entries(fields).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function openMentorProfile() {
  const section = document.getElementById("mentorProfileSection");
  if (!section) return;
  section.style.display = section.style.display === "block" ? "none" : "block";
  if (section.style.display === "block") {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function saveMentorProfile() {
  if (!mentorProfileCache?.id) {
    alert("Mentor profile not loaded");
    return;
  }

  const oldName = mentorProfileCache.name;
  const name = document.getElementById("profileName")?.value.trim() || "";
  const artistName = document.getElementById("profileArtistName")?.value.trim() || "";
  const email = document.getElementById("profileEmail")?.value.trim() || "";
  const type = document.getElementById("profileDefaultType")?.value || "";
  const location = document.getElementById("profileDefaultLocation")?.value || "";

  if (!name || !type || !location) {
    alert("Please enter your name, default type and default location");
    return;
  }

  const { error } = await db
    .from("mentors")
    .update({
      name,
      artist_name: artistName || null,
      email: email || null,
      type,
      location
    })
    .eq("id", mentorProfileCache.id);

  if (error) {
    console.error(error);
    alert("Error saving profile");
    return;
  }

  if (oldName !== name) {
    const relatedUpdates = [
      db.from("sessions").update({ mentor: name }).eq("mentor", oldName),
      db.from("bookings").update({ mentor: name }).eq("mentor", oldName),
      db.from("messages").update({ mentor: name }).eq("mentor", oldName),
      db.from("expenses").update({ mentor: name }).eq("mentor", oldName)
    ];
    const results = await Promise.allSettled(relatedUpdates);
    results.forEach(result => {
      if (result.status === "rejected") console.error(result.reason);
    });
    localStorage.setItem("mentorName", name);
  }

  alert("Profile updated");
  await initialiseMentorPortal();
}

async function uploadMentorProfileImage() {
  if (!mentorProfileCache?.id) {
    alert("Mentor profile not loaded");
    return;
  }

  const input = document.getElementById("mentorProfileImageInput");
  const file = input?.files?.[0];
  if (!file) {
    alert("Please choose an image");
    return;
  }
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Profile image must be under 5MB");
    return;
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg","jpeg","png","webp","gif"].includes(ext) ? ext : "jpg";
  const path = `${mentorProfileCache.id}/profile-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await db.storage
    .from("mentor-profile-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error(uploadError);
    alert("Error uploading profile image");
    return;
  }

  const { data } = db.storage.from("mentor-profile-images").getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";
  const { error: updateError } = await db
    .from("mentors")
    .update({ profile_image_url: publicUrl })
    .eq("id", mentorProfileCache.id);

  if (updateError) {
    console.error(updateError);
    alert("Image uploaded but profile could not be updated");
    return;
  }

  mentorProfileCache.profile_image_url = publicUrl;
  const avatarImage = document.getElementById("mentorAvatarImage");
  const avatarInitials = document.getElementById("mentorAvatarInitials");
  if (avatarImage) {
    avatarImage.src = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
    avatarImage.style.display = "block";
  }
  if (avatarInitials) avatarInitials.style.display = "none";
  if (input) input.value = "";
  alert("Profile image updated");
  await loadMentorProfileAndDefaults();
}

async function changeMentorPassword() {
  if (!mentorProfileCache?.id) {
    alert("Mentor profile not loaded");
    return;
  }

  const currentPassword = document.getElementById("mentorCurrentPassword")?.value || "";
  const newPassword = document.getElementById("mentorNewPassword")?.value || "";
  const confirmPassword = document.getElementById("mentorConfirmPassword")?.value || "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please complete all password fields");
    return;
  }
  if (newPassword.length < 6) {
    alert("New password must be at least 6 characters");
    return;
  }
  if (newPassword !== confirmPassword) {
    alert("New passwords do not match");
    return;
  }

  const currentHash = await hashPassword(currentPassword);
  const currentValid = mentorProfileCache.password_hash
    ? currentHash === mentorProfileCache.password_hash
    : currentPassword === MENTOR_PASSWORD;

  if (!currentValid) {
    alert("Current password is incorrect");
    return;
  }

  const newHash = await hashPassword(newPassword);
  const { error } = await db
    .from("mentors")
    .update({ password_hash: newHash })
    .eq("id", mentorProfileCache.id);

  if (error) {
    console.error(error);
    alert("Error changing password");
    return;
  }

  ["mentorCurrentPassword","mentorNewPassword","mentorConfirmPassword"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  alert("Password changed successfully");
  await loadMentorProfileAndDefaults();
}

async function addMentorAvailability() {
  const mentorName = getLoggedInMentorName();
  const date = document.getElementById("mentorDate")?.value || "";
  const type = document.getElementById("mentorTypeSelect")?.value || "";
  const location = document.getElementById("mentorLocationSelect")?.value || "";
  const times = [...selectedMentorTimes].sort();

  if (!mentorName || !date || !type || !location || times.length === 0) {
    alert("Please select a date, type, location and at least one time");
    return;
  }

  const { data: existing, error: lookupError } = await db
    .from("sessions")
    .select("time")
    .eq("mentor", mentorName)
    .eq("date", date)
    .eq("type", type)
    .eq("location", location);

  if (lookupError) {
    console.error(lookupError);
    alert("Error checking existing sessions");
    return;
  }

  const existingTimes = new Set((existing || []).map(item => item.time));
  const newTimes = times.filter(time => !existingTimes.has(time));

  if (newTimes.length === 0) {
    alert("Those sessions have already been added");
    return;
  }

  const rows = newTimes.map(time => ({ date, type, mentor: mentorName, location, time }));
  const { error } = await db.from("sessions").insert(rows);

  if (error) {
    console.error(error);
    alert("Error adding sessions");
    return;
  }

  alert(`✅ ${newTimes.length} session${newTimes.length === 1 ? "" : "s"} added successfully\n\n${formatDisplayDate(date)}\n\n${newTimes.join("\n")}`);
  clearSelectedMentorTimes();

  await Promise.all([
    renderMentorAvailability(),
    renderAdminSlots(),
    loadCalendar(),
    loadDashboard(),
    loadMentorDashboard()
  ]);
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

  container.innerHTML = (data || []).map(slot => `
    <div class="slot-card">
      <p><strong>${formatDisplayDate(slot.date)}</strong></p>
      <p>${escapeHtml(slot.type || "")}</p>
      <p>${escapeHtml(slot.location || "")}</p>
      <p>${escapeHtml(slot.time || "")}</p>
      <button class="danger-btn" onclick="removeMentorAvailability('${slot.id}')">DELETE SESSION</button>
    </div>
  `).join("") || "<p>No future availability added.</p>";
}

async function removeMentorAvailability(id) {
  if (!confirm("Delete this available session?")) return;

  const { error } = await db.from("sessions").delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("Error deleting session");
    return;
  }

  await Promise.all([
    renderMentorAvailability(),
    renderAdminSlots(),
    loadCalendar(),
    loadDashboard(),
    loadMentorDashboard()
  ]);
}

async function loadMentorDashboard() {
  const mentorName = getLoggedInMentorName();
  const summary = document.getElementById("mentorSummary");
  if (!mentorName || !summary) return;

  const [{ count: availableCount }, { data: bookings }, { data: unreadMessages }] =
    await Promise.all([
      db.from("sessions").select("*", { count: "exact", head: true })
        .eq("mentor", mentorName).gte("date", getTodayDate()),
      db.from("bookings").select("*")
        .eq("mentor", mentorName).gte("date", getTodayDate())
        .order("date", { ascending: true }).order("time", { ascending: true }),
      db.from("messages").select("id")
        .eq("mentor", mentorName).eq("recipient", "mentor").eq("is_read", false)
    ]);

  const items = [];
  if ((availableCount || 0) > 0) {
    items.push(`<button class="summary-card" onclick="openMentorSection('mentorAvailabilitySection')">
      🟢 <strong>${availableCount}</strong> Available Session${availableCount === 1 ? "" : "s"}
    </button>`);
  }

  const bookedCount = bookings?.length || 0;
  if (bookedCount > 0) {
    items.push(`<button class="summary-card" onclick="openMentorSection('mentorBookedSection')">
      📅 <strong>${bookedCount}</strong> Booked Session${bookedCount === 1 ? "" : "s"}
    </button>`);
  }

  const messageCount = unreadMessages?.length || 0;
  if (messageCount > 0) {
    items.push(`<button class="summary-card" onclick="openMentorSection('mentorMessagesSection')">
      💬 <strong>${messageCount}</strong> New Message${messageCount === 1 ? "" : "s"}
    </button>`);
  }

  summary.innerHTML = items.join("") || "<p>You have nothing scheduled at the moment.</p>";

  const badge = document.getElementById("mentorMessageBadge");
  if (badge) badge.textContent = messageCount ? `(${messageCount})` : "";

  const next = document.getElementById("mentorNextBooking");
  const booking = bookings?.[0];
  if (next) {
    next.innerHTML = booking ? `
      <div class="next-booking-card">
        <h2>Next Booking</h2>
        <p><strong>${escapeHtml(booking.child)}</strong></p>
        <p>${formatDisplayDate(booking.date)} at ${escapeHtml(booking.time)}</p>
        <p>${escapeHtml(booking.type)} · ${escapeHtml(booking.location)}</p>
        ${booking.notes ? `<p class="booking-note">${escapeHtml(booking.notes)}</p>` : ""}
      </div>
    ` : "";
  }
}

function openMentorSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function renderMentorMessages() {
  const container = document.getElementById("mentorMessages");
  const mentorName = getLoggedInMentorName();
  if (!container || !mentorName) return;

  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("mentor", mentorName)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Messages are not available yet.</p>";
    return;
  }

  container.innerHTML = (data || []).map(message => `
    <div class="slot-card ${message.is_read ? "" : "unread-card"}">
      <p><strong>${escapeHtml(message.child_name || "Booking message")}</strong></p>
      <p>From: ${escapeHtml(message.sender_name || "Parent/Admin")}</p>
      <p>${escapeHtml(message.message || "")}</p>
      <p class="small-muted">${new Date(message.created_at).toLocaleString("en-GB")}</p>
      ${message.booking_id ? `
        <textarea id="reply-${message.id}" class="mentor-textarea" placeholder="Write a reply"></textarea>
        <button onclick="replyToMentorMessage('${message.id}', '${message.booking_id}')">REPLY</button>
      ` : ""}
    </div>
  `).join("") || "<p>No messages yet.</p>";
}

async function replyToMentorMessage(messageId, bookingId) {
  const input = document.getElementById(`reply-${messageId}`);
  const text = input?.value.trim() || "";
  if (!text) {
    alert("Please write a reply");
    return;
  }

  const original = await db.from("messages").select("*").eq("id", messageId).single();
  const row = original.data;
  if (!row) return;

  const { error } = await db.from("messages").insert([{
    booking_id: bookingId,
    mentor: getLoggedInMentorName(),
    child_name: row.child_name,
    sender_name: getLoggedInMentorName(),
    recipient: "parent",
    message: text,
    is_read: false
  }]);

  if (error) {
    console.error(error);
    alert("Error sending reply");
    return;
  }

  await db.from("messages").update({ is_read: true }).eq("id", messageId);
  input.value = "";
  await Promise.all([renderMentorMessages(), loadMentorDashboard()]);
  alert("Reply sent");
}

async function renderMentorNewsletter() {
  const container = document.getElementById("mentorNewsletter");
  if (!container) return;

  const { data, error } = await db
    .from("newsletters")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error(error);
    container.innerHTML = "<p>No newsletter has been uploaded yet.</p>";
    return;
  }

  container.innerHTML = (data || []).map((item, index) => `
    <div class="slot-card">
      <p><strong>${index === 0 ? "Latest: " : ""}${escapeHtml(item.title)}</strong></p>
      <p>${formatShortDate(item.published_at)}</p>
      <a class="download-link" href="${escapeHtml(item.file_url)}" target="_blank" rel="noopener">
        DOWNLOAD NEWSLETTER
      </a>
    </div>
  `).join("") || "<p>No newsletter has been uploaded yet.</p>";
}

function updateExpenseFields() {
  const type = document.getElementById("expenseType")?.value || "mileage";
  const mileageFields = document.getElementById("mileageFields");
  const receiptFields = document.getElementById("receiptFields");
  if (mileageFields) mileageFields.style.display = type === "mileage" ? "block" : "none";
  if (receiptFields) receiptFields.style.display = type === "receipt" ? "block" : "none";
}

async function submitMentorExpense() {
  const mentor = getLoggedInMentorName();
  const displayName = mentorProfileCache?.artist_name?.trim() || mentor;
  const expenseType = document.getElementById("expenseType")?.value || "";
  const expenseDate = document.getElementById("expenseDate")?.value || "";
  const reason = document.getElementById("expenseReason")?.value.trim() || "";
  const miles = Number(document.getElementById("expenseMiles")?.value || 0);
  const mileageAmount = Number(document.getElementById("expenseMileageAmount")?.value || 0);
  const receiptAmount = Number(document.getElementById("expenseAmount")?.value || 0);
  const category = document.getElementById("expenseCategory")?.value || null;
  const receiptFile = document.getElementById("expenseReceipt")?.files?.[0] || null;
  const amount = expenseType === "mileage" ? mileageAmount : receiptAmount;

  if (!mentor || !expenseDate || !reason) {
    alert("Please enter the date and reason");
    return;
  }
  if (expenseType === "mileage" && (miles <= 0 || amount <= 0)) {
    alert("Please enter the miles and claim amount");
    return;
  }
  if (expenseType === "receipt" && amount <= 0) {
    alert("Please enter the expense amount");
    return;
  }

  let receiptUrl = null;
  if (receiptFile) {
    const safeName = receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${mentor}/${Date.now()}-${safeName}`;
    const upload = await db.storage.from("expense-receipts").upload(path, receiptFile);
    if (upload.error) {
      console.error(upload.error);
      alert("Error uploading receipt");
      return;
    }
    receiptUrl = db.storage.from("expense-receipts").getPublicUrl(path).data.publicUrl;
  }

  const { data: inserted, error } = await db.from("expenses").insert([{
    mentor,
    mentor_display_name: displayName,
    expense_type: expenseType,
    expense_date: expenseDate,
    miles: expenseType === "mileage" ? miles : null,
    amount,
    category: expenseType === "receipt" ? category : "Mileage",
    reason,
    receipt_url: receiptUrl,
    status: "Submitted"
  }]).select().single();

  if (error) {
    console.error(error);
    alert("Error submitting expense");
    return;
  }

  let emailSent = true;
  try {
    const response = await fetch("/.netlify/functions/send-expense-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expense: inserted })
    });
    emailSent = response.ok;
    if (!response.ok) console.error("Expense email failed:", await response.text());
  } catch (emailError) {
    emailSent = false;
    console.error("Expense email failed:", emailError);
  }

  const ids = ["expenseMiles", "expenseMileageAmount", "expenseAmount", "expenseReason", "expenseReceipt"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const dateInput = document.getElementById("expenseDate");
  if (dateInput) dateInput.value = getTodayDate();

  alert(emailSent
    ? "Expense submitted and emailed to Raving 4 A Reason"
    : "Expense saved, but the notification email could not be sent");

  await Promise.all([renderMentorExpenses(), renderAdminExpenses()]);
}

async function renderMentorExpenses() {
  const container = document.getElementById("mentorExpenseList");
  const mentor = getLoggedInMentorName();
  if (!container || !mentor) return;

  const { data, error } = await db
    .from("expenses")
    .select("id,mentor_display_name,amount,status,expense_date,paid_at")
    .eq("mentor", mentor)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Expenses are not available yet.</p>";
    return;
  }

  container.innerHTML = (data || []).map(item => {
    const status = item.status === "Paid" ? "Paid" : "Submitted";
    const dateToShow = status === "Paid" && item.paid_at
      ? new Date(item.paid_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
      : formatDisplayDate(item.expense_date);
    return `
      <div class="expense-compact-card">
        <strong>${escapeHtml(item.mentor_display_name || mentor)}</strong>
        <span>£${Number(item.amount || 0).toFixed(2)}</span>
        <span class="expense-status ${status.toLowerCase()}">${status}</span>
        <small>${escapeHtml(dateToShow)}</small>
      </div>`;
  }).join("") || "<p>No expense claims submitted.</p>";
}

async function renderAdminExpenses() {
  const container = document.getElementById("adminExpenses");
  if (!container) return;

  const { data, error } = await db
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Error loading expenses.</p>";
    return;
  }

  const filteredExpenses = (data || []).filter(item => !currentExpenseFilter || (item.status || "Submitted") === currentExpenseFilter);

  container.innerHTML = filteredExpenses.map(item => {
    const status = item.status === "Paid" ? "Paid" : "Submitted";
    const dateToShow = status === "Paid" && item.paid_at
      ? new Date(item.paid_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
      : formatDisplayDate(item.expense_date);
    return `
      <div class="slot-card expense-admin-card">
        <p><strong>${escapeHtml(item.mentor_display_name || item.mentor || "Mentor")}</strong></p>
        <p>£${Number(item.amount || 0).toFixed(2)}</p>
        <p><span class="expense-status ${status.toLowerCase()}">${status}</span></p>
        <p>${escapeHtml(dateToShow)}</p>
        <details>
          <summary>VIEW DETAILS</summary>
          <p>${escapeHtml(item.category || item.expense_type || "Expense")}</p>
          ${item.miles ? `<p>${Number(item.miles)} miles</p>` : ""}
          <p>${escapeHtml(item.reason || "")}</p>
          ${item.receipt_url ? `<p><a href="${escapeHtml(item.receipt_url)}" target="_blank" rel="noopener">VIEW RECEIPT</a></p>` : ""}
        </details>
        ${status !== "Paid" ? `<button onclick="markExpensePaid('${item.id}')">MARK AS PAID</button>` : ""}
      </div>`;
  }).join("") || "<p>No expense claims submitted.</p>";
}

async function markExpensePaid(id) {
  if (!confirm("Mark this expense as paid?")) return;
  const { error } = await db
    .from("expenses")
    .update({ status: "Paid", paid_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error updating expense");
    return;
  }

  await Promise.all([renderAdminExpenses(), renderMentorExpenses()]);
}


let currentExpenseFilter = "Submitted";
function setExpenseFilter(value){ currentExpenseFilter=value; renderAdminExpenses(); }

async function adminPageGuard(){
  const protectedPage=document.getElementById("adminProtectedPage");
  if(!protectedPage) return;
  if(localStorage.getItem("adminLoggedIn")!=="true"){ window.location.replace("admin.html"); return; }
  protectedPage.style.display="block";
}

async function loadAdminHomeSummary(){
  const box=document.getElementById("adminActionSummary"); if(!box) return;
  const [{data:messages},{data:expenses},{data:bookings}] = await Promise.all([
    db.from("messages").select("id,is_read").eq("is_read",false),
    db.from("expenses").select("id,status").eq("status","Submitted"),
    db.from("bookings").select("id,date").eq("date",getTodayDate())
  ]);
  const items=[];
  if(messages?.length) items.push(`<a href="admin-messages.html">💬 ${messages.length} Unread Message${messages.length===1?"":"s"}</a>`);
  if(expenses?.length) items.push(`<a href="admin-expenses.html">💷 ${expenses.length} Pending Expense${expenses.length===1?"":"s"}</a>`);
  if(bookings?.length) items.push(`<a href="admin-sessions.html">📅 ${bookings.length} Booking${bookings.length===1?"":"s"} Today</a>`);
  box.innerHTML=items.length?items.join(""):'<p class="all-clear">Everything is up to date. ✅</p>';
}

async function renderAdminMessages(){
 const c=document.getElementById("adminMessages"); if(!c) return;
 const {data,error}=await db.from("messages").select("*").order("created_at",{ascending:false});
 if(error){c.innerHTML="<p>No messages available yet.</p>";return;}
 const q=(document.getElementById("adminMessageSearch")?.value||"").toLowerCase();
 const rows=(data||[]).filter(m=>JSON.stringify(m).toLowerCase().includes(q));
 c.innerHTML=rows.map(m=>`<div class="slot-card"><p><strong>${escapeHtml(m.parent_name||m.sender_name||"Message")}</strong></p><p>${escapeHtml(m.child_name||m.member_name||"")}</p><p>${escapeHtml(m.message||m.body||"")}</p><small>${m.created_at?new Date(m.created_at).toLocaleString("en-GB"):""}</small></div>`).join("")||"<p>No messages.</p>";
}

async function saveNewsletter(){
 const title=document.getElementById("newsletterTitle")?.value.trim()||""; const published_date=document.getElementById("newsletterDate")?.value||getTodayDate(); const file_url=document.getElementById("newsletterUrl")?.value.trim()||"";
 if(!title||!file_url){alert("Please add a title and PDF link");return;}
 const {error}=await db.from("newsletters").insert([{title,published_date,file_url}]); if(error){console.error(error);alert("Error saving newsletter");return;} alert("Newsletter saved"); renderAdminNewsletters();
}
async function renderAdminNewsletters(){
 const c=document.getElementById("adminNewsletters"); if(!c)return; const {data,error}=await db.from("newsletters").select("*").order("published_date",{ascending:false}); if(error){c.innerHTML="<p>No newsletters available.</p>";return;}
 c.innerHTML=(data||[]).map(n=>`<div class="slot-card"><p><strong>${escapeHtml(n.title)}</strong></p><p>${formatDisplayDate(n.published_date)}</p><a href="${escapeHtml(n.file_url)}" target="_blank">OPEN PDF</a><button class="danger-btn" onclick="deleteNewsletter('${n.id}')">DELETE</button></div>`).join("")||"<p>No newsletters yet.</p>";
}
async function deleteNewsletter(id){if(!confirm("Delete this newsletter?"))return;await db.from("newsletters").delete().eq("id",id);renderAdminNewsletters();}

async function upsertSetting(key,value){ const {error}=await db.from("app_settings").upsert({setting_key:key,setting_value:value,updated_at:new Date().toISOString()}); if(error) throw error; }
async function saveParentPasswordSetting(){const v=document.getElementById("settingParentPassword")?.value||"";if(!v){alert("Enter a password");return;}await upsertSetting("parent_password",v);localStorage.setItem("r4arParentPassword",v);PARENT_PASSWORD=v;alert("Parent password updated");}
async function saveAdminPasswordSetting(){const v=document.getElementById("settingAdminPassword")?.value||"";if(!v){alert("Enter a password");return;}await upsertSetting("admin_password",v);localStorage.setItem("r4arAdminPassword",v);ADMIN_PASSWORD=v;alert("Admin password updated");}
async function saveOrganisationSettings(){for(const [k,id] of [["contact_email","settingContactEmail"],["contact_phone","settingContactPhone"],["website","settingWebsite"],["donation_url","settingDonationUrl"]]) await upsertSetting(k,document.getElementById(id)?.value.trim()||"");alert("Organisation details saved");}
async function saveBookingSettings(){await upsertSetting("session_length",document.getElementById("settingSessionLength")?.value||"60");await upsertSetting("booking_window",document.getElementById("settingBookingWindow")?.value||"12");alert("Booking settings saved");}
async function loadSettingsPage(){
 const {data}=await db.from("app_settings").select("*"); const map=Object.fromEntries((data||[]).map(x=>[x.setting_key,x.setting_value]));
 const ids={contact_email:"settingContactEmail",contact_phone:"settingContactPhone",website:"settingWebsite",donation_url:"settingDonationUrl",session_length:"settingSessionLength",booking_window:"settingBookingWindow"}; Object.entries(ids).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.value=map[k]||"";});
 const c=document.getElementById("mentorPasswordResetList"); if(c){const {data:mentors}=await db.from("mentors").select("id,name,artist_name").order("name");c.innerHTML=(mentors||[]).map(m=>`<div class="reset-row"><span>${escapeHtml(m.artist_name||m.name)}</span><button onclick="resetMentorPassword('${m.id}','${escapeHtml((m.artist_name||m.name).replace(/'/g,"&#39;"))}')">RESET</button></div>`).join("");}
}

function downloadCsv(filename, rows){if(!rows?.length){alert("No data to export");return;}const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;const csv=[headers.map(esc).join(","),...rows.map(r=>headers.map(h=>esc(r[h])).join(","))].join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);}
async function exportAdminReport(type){const table={members:"members",mentors:"mentors",sessions:"sessions",bookings:"bookings",expenses:"expenses"}[type];if(!table)return;const {data,error}=await db.from(table).select("*");if(error){alert("Error exporting report");return;}downloadCsv(`r4ar-${type}-${getTodayDate()}.csv`,data||[]);}
/* =========================
   PAGE LOAD
========================= */

window.onload = () => {
  if (!requireParentLogin()) return;

  checkParentLogin();
  loadCalendar();
  loadBookingPage();
  loadConfirmedPage();
  loadSearchFilters();
  checkAdminLogin();
  checkMentorLogin();
  adminPageGuard();
  loadAdminHomeSummary();
  renderAdminExpenses();
  renderAdminMessages();
  renderAdminNewsletters();
  loadSettingsPage();

  const mentorAdminSearch = document.getElementById("mentorAdminSearch");
  if (mentorAdminSearch) mentorAdminSearch.addEventListener("input", renderAdminMentors);
  const adminMessageSearch = document.getElementById("adminMessageSearch");
  if (adminMessageSearch) adminMessageSearch.addEventListener("input", renderAdminMessages);

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