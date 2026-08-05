const SUPABASE_URL = "https://ejizwiegnxtwglihrxiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KJx1attn5Dbo_Zex4IBc6A_GZR3xytW";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "R4AR";
const MENTOR_PASSWORD = "Mentor";

const PARENT_USERNAME = "R4ARparent";
const PARENT_PASSWORD = "R4AR";
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
  if (mentorWelcome) mentorWelcome.textContent = `Welcome, ${displayName} 👋`;

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
      avatarImage.src = mentorProfileCache.profile_image_url;
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

  alert(`✅ ${newTimes.length} session${newTimes.length === 1 ? "" : "s"} added:\n${newTimes.join(", ")}`);
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
  const mileage = document.getElementById("mileageFields");
  const receipt = document.getElementById("receiptFields");
  if (mileage) mileage.style.display = type === "mileage" ? "block" : "none";
  if (receipt) receipt.style.display = type === "receipt" ? "block" : "none";
}

async function submitMentorExpense() {
  const mentor = getLoggedInMentorName();
  const expenseType = document.getElementById("expenseType")?.value || "";
  const expenseDate = document.getElementById("expenseDate")?.value || "";
  const reason = document.getElementById("expenseReason")?.value.trim() || "";
  const miles = Number(document.getElementById("expenseMiles")?.value || 0);
  const amount = Number(document.getElementById("expenseAmount")?.value || 0);
  const category = document.getElementById("expenseCategory")?.value || null;
  const receiptFile = document.getElementById("expenseReceipt")?.files?.[0] || null;

  if (!mentor || !expenseDate || !reason) {
    alert("Please enter the date and reason");
    return;
  }
  if (expenseType === "mileage" && miles <= 0) {
    alert("Please enter the mileage");
    return;
  }
  if (expenseType === "receipt" && amount <= 0) {
    alert("Please enter the expense amount");
    return;
  }

  let receiptUrl = null;
  if (receiptFile) {
    const safeName = `${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `${mentor.replace(/[^a-zA-Z0-9_-]/g, "_")}/${safeName}`;
    const upload = await db.storage.from("expense-receipts").upload(path, receiptFile);
    if (upload.error) {
      console.error(upload.error);
      alert("Could not upload receipt");
      return;
    }
    receiptUrl = db.storage.from("expense-receipts").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db.from("expenses").insert([{
    mentor,
    expense_type: expenseType,
    expense_date: expenseDate,
    miles: expenseType === "mileage" ? miles : null,
    amount: expenseType === "receipt" ? amount : null,
    category: expenseType === "receipt" ? category : "Mileage",
    reason,
    receipt_url: receiptUrl,
    status: "Pending"
  }]);

  if (error) {
    console.error(error);
    alert("Error submitting expense");
    return;
  }

  document.getElementById("expenseMiles").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseReason").value = "";
  document.getElementById("expenseReceipt").value = "";
  await renderMentorExpenses();
  alert("Expense submitted");
}

async function renderMentorExpenses() {
  const container = document.getElementById("mentorExpenseList");
  const mentor = getLoggedInMentorName();
  if (!container || !mentor) return;

  const { data, error } = await db
    .from("expenses")
    .select("*")
    .eq("mentor", mentor)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Expenses are not available yet.</p>";
    return;
  }

  container.innerHTML = (data || []).map(item => `
    <div class="slot-card">
      <p><strong>${escapeHtml(item.category || item.expense_type)}</strong></p>
      <p>${formatDisplayDate(item.expense_date)}</p>
      ${item.miles ? `<p>${item.miles} miles</p>` : ""}
      ${item.amount ? `<p>£${Number(item.amount).toFixed(2)}</p>` : ""}
      <p>${escapeHtml(item.reason || "")}</p>
      <p>Status: <strong>${escapeHtml(item.status || "Pending")}</strong></p>
      ${item.receipt_url ? `<a class="download-link" href="${escapeHtml(item.receipt_url)}" target="_blank" rel="noopener">VIEW RECEIPT</a>` : ""}
    </div>
  `).join("") || "<p>No expense claims submitted.</p>";
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