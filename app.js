const SUPABASE_URL = "https://ejizwiegnxtwglihrxiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KJx1attn5Dbo_Zex4IBc6A_GZR3xytW";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "R4AR";
const MENTOR_PASSWORD = "Mentor";

let members = JSON.parse(localStorage.getItem("members")) || [];

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

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.style.display =
    section.style.display === "none" || section.style.display === ""
      ? "block"
      : "none";
}

function saveMembers() {
  localStorage.setItem("members", JSON.stringify(members));
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

  if (password !== MENTOR_PASSWORD) {
    alert("Wrong password");
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

  localStorage.setItem("mentorLoggedIn", "true");
  localStorage.setItem("mentorName", data[0].name);

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

  const { data: mentorsData, error: mentorError } = await db
    .from("mentors")
    .select("*")
    .order("name", { ascending: true });

  const { data: locationsData, error: locationError } = await db
    .from("locations")
    .select("*")
    .order("name", { ascending: true });

  if (mentorError || locationError) {
    console.error(mentorError || locationError);
    return;
  }

  const selectedType = typeSelect.value;
  const currentMentor = mentorSelect.value;
  const currentLocation = locationSelect.value;

  mentorSelect.innerHTML = '<option value="">All Mentors</option>';
  locationSelect.innerHTML = '<option value="">All Locations</option>';

  const filteredMentors = selectedType
    ? mentorsData.filter(m => m.type === selectedType)
    : mentorsData;

  filteredMentors.forEach(mentor => {
    mentorSelect.innerHTML += `<option value="${mentor.name}">${mentor.name}</option>`;
  });

  locationsData.forEach(location => {
    locationSelect.innerHTML += `<option value="${location.name}">${location.name}</option>`;
  });

  mentorSelect.value = currentMentor;
  locationSelect.value = currentLocation;

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
      paid: false
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

  if (!name || !type || !location) {
    alert("Please fill all mentor fields");
    return;
  }

  const { error } = await db
    .from("mentors")
    .insert([{ name, type, location }]);

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
  loadSearchFilters();

  document.getElementById("newMentorName").value = "";
  document.getElementById("newMentorType").value = "";
  document.getElementById("newMentorLocation").value = "";
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
}

/* =========================
   MEMBERS
========================= */

function addMember() {
  const child = document.getElementById("memberChild")?.value.trim() || "";

  if (!child) {
    alert("Please enter member name");
    return;
  }

  members.push({ child });
  saveMembers();
  renderMembers();

  document.getElementById("memberChild").value = "";
}

function renderMembers() {
  const container = document.getElementById("adminMembers");
  if (!container) return;

  let html = "";

  members.forEach((m, index) => {
    html += `
      <div class="slot-card">
        <p><strong>${m.child}</strong></p>
        <button onclick="removeMember(${index})">REMOVE</button>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No members yet.</p>";
}

function removeMember(index) {
  members.splice(index, 1);
  saveMembers();
  renderMembers();
}

/* =========================
   PAGE LOAD
========================= */

window.onload = () => {
  loadCalendar();
  loadBookingPage();
  loadConfirmedPage();
  loadSearchFilters();
  checkAdminLogin();
  checkMentorLogin();

  const phoneInput = document.getElementById("parentPhone");

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
    });
  }
};