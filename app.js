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
  const protectedPages = ["book.html", "weekly-calendar.html", "newsletter.html", "contact.html", "parent-admin-chat.html"];
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

function goToParentAdminChat() {
  window.location.href = "parent-admin-chat.html";
}

function goToBookingChat() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("chat_token") || "";
  if (!token) {
    alert("No chat link is available for this booking.");
    return;
  }
  window.location.href = `booking-chat.html?token=${encodeURIComponent(token)}`;
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
  renderAdminExpenses();
  renderAdminNewsEvents();
  renderMailingList();
  renderAdminMessages();
  loadAdminMessageMentors();
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
  sessionStorage.setItem("mentorAuthProof", suppliedHash);

  showMentorPanel();
}

function logoutMentor() {
  localStorage.removeItem("mentorLoggedIn");
  localStorage.removeItem("mentorName");
  localStorage.removeItem("mentorId");
  sessionStorage.removeItem("mentorAuthProof");
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
  const [members, mentors, sessions, bookings, unread, expenses] = await Promise.all([
    db.from("members").select("id", {count:"exact", head:true}),
    db.from("mentors").select("id", {count:"exact", head:true}),
    db.from("sessions").select("id", {count:"exact", head:true}).gte("date", today),
    db.from("bookings").select("id", {count:"exact", head:true}).gte("date", today),
    db.from("messages").select("id", {count:"exact", head:true}).eq("recipient","admin").eq("is_read",false),
    db.from("expenses").select("id", {count:"exact", head:true}).in("status",["Pending","Submitted"])
  ]);
  const cards=[
    ["Members",members.count||0,"👥"],["Mentors",mentors.count||0,"🎧"],
    ["Available Sessions",sessions.count||0,"📅"],["Booked Sessions",bookings.count||0,"📝"],
    ["Unread Messages",unread.count||0,"✉️"],["Submitted Expenses",expenses.count||0,"💷"]
  ];
  container.innerHTML=cards.map(c=>`<div class="dashboard-card"><span class="dashboard-icon">${c[2]}</span><strong>${c[1]}</strong><span>${c[0]}</span></div>`).join("");
  const badge=document.getElementById("adminMessageBadge"); if(badge) badge.textContent=(unread.count||0)>0?String(unread.count):"";
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

  const chatToken = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`) + "-" + Math.random().toString(36).slice(2);

  const { data: savedBooking, error } = await db
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
      notes: booking.notes || null,
      chat_token: chatToken
    }])
    .select("id,chat_token")
    .single();

  if (error) {
    console.error(error);
    alert("Error saving booking");
    return;
  }

  await removeBookedSlot(booking);
  const chatUrl = `${window.location.origin}/booking-chat.html?token=${encodeURIComponent(chatToken)}`;
  try {
    await fetch("/.netlify/functions/send-booking-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking: {
          child: booking.child,
          parent: booking.parent,
          phone: phone,
          date: booking.date,
          time: booking.time,
          location: booking.location,
          type: booking.type,
          mentor: booking.mentor,
          parent_email: booking.email,
          chat_url: chatUrl
        }
      })
    });
  } catch (emailError) {
    console.warn("Booking saved but confirmation email failed", emailError);
  }

  const params = new URLSearchParams({
    child: booking.child,
    parent: booking.parent,
    phone: phone,
    email: booking.email,
    mentor: booking.mentor,
    type: booking.type,
    location: booking.location,
    date: booking.rawDate,
    time: booking.time,
    booking_id: savedBooking?.id || "",
    chat_token: chatToken
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
    time: params.get("time") || "",
    booking_id: params.get("booking_id") || "",
    chat_token: params.get("chat_token") || ""
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
  const mentorControl = document.getElementById("mentor");
  const locationControl = document.getElementById("location");
  const newMentorLocation = document.getElementById("newMentorLocation");
  if (!typeSelect || !mentorControl) return;

  const [{ data: locations }, { data: mentors }] = await Promise.all([
    db.from("locations").select("*").order("name", { ascending: true }),
    db.from("mentors").select("*").order("name", { ascending: true })
  ]);

  const locationOptions = '<option value="">Select Location</option>' + (locations || [])
    .map(l => `<option value="${escapeHtml(l.name)}">${escapeHtml(l.name)}</option>`).join("");
  if (locationControl?.tagName === "SELECT") locationControl.innerHTML = locationOptions;
  if (newMentorLocation?.tagName === "SELECT") newMentorLocation.innerHTML = locationOptions;

  function mentorSupportsType(mentor, selectedType) {
    if (!selectedType) return true;
    const raw = mentor.type || mentor.default_type || "";
    if (Array.isArray(raw)) return raw.includes(selectedType);
    return String(raw).split(",").map(v => v.trim()).includes(selectedType) || String(raw) === selectedType;
  }

  function populateMentors() {
    const selectedType = typeSelect.value;
    const current = mentorControl.value;
    const filtered = (mentors || []).filter(m => mentorSupportsType(m, selectedType));
    if (mentorControl.tagName === "SELECT") {
      mentorControl.innerHTML = '<option value="">Select Mentor</option>' + filtered
        .map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.artist_name || m.name)}</option>`).join("");
      if (filtered.some(m => m.name === current)) mentorControl.value = current;
    }
  }

  populateMentors();
  typeSelect.onchange = populateMentors;
}

async function addMentor() {
  const artistName=document.getElementById("newMentorArtistName")?.value.trim()||"";
  const email=document.getElementById("newMentorEmail")?.value.trim()||"";
  const legalName=document.getElementById("newMentorName")?.value.trim()||"";
  const phone=document.getElementById("newMentorPhone")?.value.trim()||"";
  const type=document.getElementById("newMentorType")?.value||"";
  const location=document.getElementById("newMentorLocation")?.value.trim()||"";
  const notes=document.getElementById("newMentorAdminNotes")?.value.trim()||"";
  const dbs=!!document.getElementById("newMentorDbsChecked")?.checked;
  if(!artistName||!email) return alert("Artist Name and Email are required");
  const systemName=artistName;
  const {error}=await db.from("mentors").insert([{name:systemName,artist_name:artistName,email,phone:phone||null,type:type||null,location:location||null,admin_notes:notes||null,dbs_checked:dbs,legal_name:legalName||null}]);
  if(error){console.error(error);return alert("Error adding mentor: "+error.message)}
  ["newMentorName","newMentorArtistName","newMentorEmail","newMentorPhone","newMentorAdminNotes"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});
  if(document.getElementById("newMentorType"))document.getElementById("newMentorType").value="";
  if(document.getElementById("newMentorLocation"))document.getElementById("newMentorLocation").value="";
  if(document.getElementById("newMentorDbsChecked"))document.getElementById("newMentorDbsChecked").checked=false;
  await renderAdminMentors(); await loadAdminDropdowns(); await loadDashboard();
}

let adminMentorsCache=[];
async function renderAdminMentors() {
 const container=document.getElementById("adminMentors"); if(!container)return;
 const {data,error}=await db.from("mentors").select("*").order("artist_name",{ascending:true});
 if(error){container.innerHTML="<p>Error loading mentors.</p>";return;} adminMentorsCache=data||[]; filterAdminMentors();
}
function filterAdminMentors(){
 const c=document.getElementById("adminMentors");if(!c)return; const q=(document.getElementById("mentorAdminSearch")?.value||"").toLowerCase();
 const rows=adminMentorsCache.filter(m=>[m.artist_name,m.legal_name,m.name,m.email,m.phone].some(v=>String(v||"").toLowerCase().includes(q)));
 c.innerHTML=rows.map(m=>`<div class="slot-card"><p><strong>${escapeHtml(m.artist_name||m.name)}</strong></p>${m.legal_name?`<p>Name: ${escapeHtml(m.legal_name)}</p>`:""}<p>${escapeHtml(m.email||"")}</p>${m.phone?`<p>${escapeHtml(m.phone)}</p>`:""}${m.type?`<p>${escapeHtml(m.type)}</p>`:""}${m.location?`<p>${escapeHtml(m.location)}</p>`:""}<button onclick="removeMentor('${m.id}')">REMOVE MENTOR</button></div>`).join("")||"<p>No mentors found.</p>";
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
      <p><strong>📅 ${formatDisplayDate(booking.date)}</strong></p>
      <p><strong>🕒 ${escapeHtml(booking.time || "")}</strong></p>
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

  setMentorAvatar(mentorProfileCache.profile_image_url || "", displayName);
  const profilePreview = document.getElementById("mentorProfilePreview");
  if (profilePreview) {
    if (mentorProfileCache.profile_image_url) {
      profilePreview.src = `${mentorProfileCache.profile_image_url}${mentorProfileCache.profile_image_url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      profilePreview.style.display = "block";
    } else {
      profilePreview.removeAttribute("src");
      profilePreview.style.display = "none";
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

async function callMentorProfileFunction(payload) {
  const response = await fetch("/.netlify/functions/mentor-profile-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mentor_id: mentorProfileCache?.id || localStorage.getItem("mentorId") || "",
      mentor_name: mentorProfileCache?.name || getLoggedInMentorName() || "",
      auth_proof: sessionStorage.getItem("mentorAuthProof") || "",
      ...payload
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Profile update failed");
  }
  return result;
}

function setMentorAvatar(url, displayName) {
  const avatarImage = document.getElementById("mentorAvatarImage");
  const avatarInitials = document.getElementById("mentorAvatarInitials");
  const initials = (displayName || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");

  if (url) {
    const freshUrl = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
    if (avatarImage) {
      avatarImage.onload = () => {
        avatarImage.style.display = "block";
        if (avatarInitials) avatarInitials.style.display = "none";
      };
      avatarImage.onerror = () => {
        avatarImage.style.display = "none";
        if (avatarInitials) {
          avatarInitials.textContent = initials || "M";
          avatarInitials.style.display = "flex";
        }
      };
      avatarImage.src = freshUrl;
    }
  } else {
    if (avatarImage) {
      avatarImage.removeAttribute("src");
      avatarImage.style.display = "none";
    }
    if (avatarInitials) {
      avatarInitials.textContent = initials || "M";
      avatarInitials.style.display = "flex";
    }
  }
}

function openProfilePhotoMenu() {
  const sheet = document.getElementById("profilePhotoSheet");
  if (sheet) sheet.classList.add("open");
}

function closeProfilePhotoMenu(event) {
  const sheet = document.getElementById("profilePhotoSheet");
  if (!sheet) return;
  if (!event || event.target === sheet) sheet.classList.remove("open");
}

function chooseMentorPhoto(source) {
  const input = document.getElementById(
    source === "camera" ? "mentorCameraInput" : "mentorGalleryInput"
  );
  closeProfilePhotoMenu();
  input?.click();
}

async function handleMentorPhotoSelected(input) {
  const file = input?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file");
    input.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Profile image must be under 5MB");
    input.value = "";
    return;
  }

  try {
    const mentorId = mentorProfileCache?.id || localStorage.getItem("mentorId");
    if (!mentorId) throw new Error("Mentor profile not loaded");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg","jpeg","png","webp"].includes(ext) ? ext : "jpg";
    const path = `${mentorId}/profile-${Date.now()}.${safeExt}`;

    const { error: uploadError } = await db.storage
      .from("mentor-profile-images")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "0"
      });

    if (uploadError) throw uploadError;

    const { data } = db.storage
      .from("mentor-profile-images")
      .getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";
    if (!publicUrl) throw new Error("Could not create image URL");

    await callMentorProfileFunction({
      action: "set_photo",
      profile_image_url: publicUrl
    });

    mentorProfileCache.profile_image_url = publicUrl;
    const displayName =
      mentorProfileCache.artist_name?.trim() || mentorProfileCache.name || "Mentor";
    setMentorAvatar(publicUrl, displayName);
    const preview = document.getElementById("mentorProfilePreview");
    if (preview) {
      preview.src = `${publicUrl}?v=${Date.now()}`;
      preview.style.display = "block";
    }
    alert("Profile photo updated successfully");
  } catch (error) {
    console.error(error);
    alert(error.message || "Error updating profile photo");
  } finally {
    input.value = "";
  }
}

async function removeMentorProfilePhoto() {
  closeProfilePhotoMenu();
  if (!mentorProfileCache?.profile_image_url) {
    alert("No profile photo to remove");
    return;
  }
  if (!confirm("Remove your profile photo?")) return;

  try {
    await callMentorProfileFunction({ action: "remove_photo" });
    mentorProfileCache.profile_image_url = null;
    const displayName =
      mentorProfileCache.artist_name?.trim() || mentorProfileCache.name || "Mentor";
    setMentorAvatar("", displayName);
    const preview = document.getElementById("mentorProfilePreview");
    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }
    alert("Profile photo removed");
  } catch (error) {
    console.error(error);
    alert(error.message || "Error removing profile photo");
  }
}

async function saveMentorProfile() {
  if (!mentorProfileCache?.id) {
    alert("Mentor profile not loaded");
    return;
  }

  const email = document.getElementById("profileEmail")?.value.trim() || "";
  const currentPassword = document.getElementById("mentorCurrentPassword")?.value || "";
  const newPassword = document.getElementById("mentorNewPassword")?.value || "";
  const confirmPassword = document.getElementById("mentorConfirmPassword")?.value || "";

  if (newPassword || confirmPassword) {
    if (!currentPassword) {
      alert("Please enter your current password");
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
  }

  try {
    const payload = { action: "save_profile", email: email || null };

    if (newPassword) {
      const currentProof = await hashPassword(currentPassword);
      if (currentProof !== sessionStorage.getItem("mentorAuthProof")) {
        alert("Current password is incorrect");
        return;
      }
      payload.new_password_hash = await hashPassword(newPassword);
    }

    await callMentorProfileFunction(payload);

    mentorProfileCache.email = email || null;
    if (payload.new_password_hash) {
      sessionStorage.setItem("mentorAuthProof", payload.new_password_hash);
      mentorProfileCache.password_hash = payload.new_password_hash;
    }

    ["mentorCurrentPassword","mentorNewPassword","mentorConfirmPassword"].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });

    alert("Profile updated successfully");
  } catch (error) {
    console.error(error);
    alert(error.message || "Error saving profile");
  }
}

async function uploadMentorProfileImage() {
  const input = document.getElementById("mentorGalleryInput");
  if (input) input.click();
}

async function changeMentorPassword() {
  return saveMentorProfile();
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

async function cleanupExpiredMessages() {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await db.from("messages").delete().lt("created_at", cutoff);
  } catch (error) {
    console.warn("Message cleanup skipped", error);
  }
}

function messageDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

async function renderMentorMessages(){
 const c=document.getElementById("mentorMessages"), mentor=getLoggedInMentorName(); if(!c||!mentor)return; await cleanupExpiredMessages();
 const {data,error}=await db.from("messages").select("*").eq("mentor",mentor).order("created_at",{ascending:true}); if(error){c.innerHTML="<p>Unable to load messages.</p>";return;}
 const msgs=data||[], groups={}; msgs.forEach(m=>{let key=m.thread_type==="booking"?`booking:${m.booking_id}`:"admin";(groups[key]??=[]).push(m)});
 let bookingMap={}; const ids=[...new Set(msgs.map(m=>m.booking_id).filter(Boolean))]; if(ids.length){const {data:b}=await db.from("bookings").select("*").in("id",ids);(b||[]).forEach(x=>bookingMap[x.id]=x)}
 c.innerHTML=`<div class="message-safety-note">Messages are kept for 14 days.</div><div class="message-compose-card"><h3>Message Admin</h3><textarea id="mentorAdminMessage" class="mentor-textarea" placeholder="Type your message to admin"></textarea><button onclick="sendMentorAdminMessage()">SEND TO ADMIN</button></div>`+Object.entries(groups).map(([key,arr])=>{
   const b=key.startsWith('booking:')?bookingMap[arr[0].booking_id]:null; const title=b?`${escapeHtml(b.parent||b.child||'Parent')} — ${formatDisplayDate(b.date)} at ${escapeHtml(b.time||'')}`:'Admin';
   return `<div class="chat-thread"><h3>${title}</h3>${b?`<p class="small-muted">${escapeHtml(b.type||'')} • ${escapeHtml(b.location||'')}</p>`:''}<div class="chat-list">${arr.map(m=>`<div class="chat-bubble ${m.sender_role==='mentor'?'chat-mine':'chat-other'}"><strong>${escapeHtml(m.sender_name||m.sender_role)}</strong><p>${escapeHtml(m.message||'')}</p><span>${messageDateTime(m.created_at)}</span></div>`).join('')}</div>${b?`<textarea id="threadReply-${b.id}" class="mentor-textarea" placeholder="Reply to parent"></textarea><button onclick="replyMentorThread('${b.id}')">SEND REPLY</button>`:''}</div>`;
 }).join('');
 const unread=msgs.filter(m=>!m.is_read&&(m.recipient==='mentor'||m.recipient==='both')).map(m=>m.id); if(unread.length)await db.from("messages").update({is_read:true}).in("id",unread);
}
async function replyMentorThread(bookingId){const input=document.getElementById(`threadReply-${bookingId}`),text=input?.value.trim()||'';if(!text)return;const {data:b}=await db.from('bookings').select('*').eq('id',bookingId).single();if(!b)return;const mentor=getLoggedInMentorName();const {error}=await db.from('messages').insert([{booking_id:bookingId,mentor,child_name:b.child,parent_email:b.email,sender_name:mentor,sender_role:'mentor',recipient:'parent',thread_type:'booking',message:text,is_read:false}]);if(error)return alert('Error sending reply: '+error.message);input.value='';await renderMentorMessages();}

async function sendMentorAdminMessage() {
  const input = document.getElementById("mentorAdminMessage");
  const text = input?.value.trim() || "";
  const mentor = getLoggedInMentorName();

  if (!text || !mentor) {
    return alert("Please write a message");
  }

  const { error } = await db.from("messages").insert([{
    mentor: mentor,
    sender_name: mentor,
    sender_role: "mentor",
    recipient: "admin",
    thread_type: "mentor_admin",
    message: text,
    is_read: false
  }]);

  if (error) {
    console.error("Mentor → Admin message error:", error);

    alert(
      "Message failed:\n\n" +
      (error.message || "Unknown error") +
      (error.details ? "\n\n" + error.details : "") +
      (error.hint ? "\n\nHint: " + error.hint : "")
    );

    return;
  }

  input.value = "";
  await renderMentorMessages();
  alert("Message sent to admin");
}

async function replyMentorToAdmin(messageId) {
  const input = document.getElementById(`admin-reply-${messageId}`);
  const text = input?.value.trim() || "";
  const mentor = getLoggedInMentorName();
  if (!text) return alert("Please write a reply");
  const { error } = await db.from("messages").insert([{
    mentor,
    sender_name: mentor,
    sender_role: "mentor",
    recipient: "admin",
    thread_type: "mentor_admin",
    message: text,
    is_read: false
  }]);
  if (error) return alert("Error sending reply");
  input.value = "";
  await renderMentorMessages();
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

const DEFAULT_MILEAGE_RATE = 0.45;

function updateMileageAmount() {
  const miles = Number(document.getElementById("expenseMiles")?.value || 0);
  const output = document.getElementById("mileageClaimAmount");
  if (output) output.textContent = `£${(miles * DEFAULT_MILEAGE_RATE).toFixed(2)}`;
}

function updateExpenseFields() {
  const type = document.getElementById("expenseType")?.value || "mileage";
  const mileage = document.getElementById("mileageFields");
  const receipt = document.getElementById("receiptFields");
  if (mileage) mileage.style.display = type === "mileage" ? "block" : "none";
  if (receipt) receipt.style.display = type === "receipt" ? "block" : "none";
  updateMileageAmount();
}

async function submitMentorExpense() {
  const mentor = getLoggedInMentorName();
  const expenseType = document.getElementById("expenseType")?.value || "";
  const expenseDate = document.getElementById("expenseDate")?.value || "";
  const reason = document.getElementById("expenseReason")?.value.trim() || "";
  const miles = Number(document.getElementById("expenseMiles")?.value || 0);
  const manualAmount = Number(document.getElementById("expenseAmount")?.value || 0);
  const amount = expenseType === "mileage"
    ? Number((miles * DEFAULT_MILEAGE_RATE).toFixed(2))
    : manualAmount;
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

  const expenseRecord = {
    mentor,
    expense_type: expenseType,
    expense_date: expenseDate,
    miles: expenseType === "mileage" ? miles : null,
    amount,
    mileage_rate: expenseType === "mileage" ? DEFAULT_MILEAGE_RATE : null,
    category: expenseType === "receipt" ? category : "Mileage",
    reason,
    receipt_url: receiptUrl,
    status: "Submitted"
  };

  const { error } = await db.from("expenses").insert([expenseRecord]);

  if (error) {
    console.error(error);
    alert("Error submitting expense");
    return;
  }

  document.getElementById("expenseMiles").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseReason").value = "";
  document.getElementById("expenseReceipt").value = "";
  updateMileageAmount();
  await renderMentorExpenses();

  try {
    await fetch("/.netlify/functions/send-expense-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expense: expenseRecord })
    });
  } catch (emailError) {
    console.warn("Expense saved but email notification failed", emailError);
  }

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
 const name=document.getElementById("memberName")?.value.trim()||""; const type=document.getElementById("memberType")?.value||"";
 if(!name||!type)return alert("Please enter the member name and select a type");
 const prefs=[...document.querySelectorAll('input[name="memberContactPref"]:checked')].map(x=>x.value);
 const row={name,dj_mc_name:document.getElementById("memberDjMcName")?.value.trim()||null,type,parent_guardian_name:document.getElementById("memberParentGuardian")?.value.trim()||null,email:document.getElementById("memberEmail")?.value.trim()||null,phone:document.getElementById("memberPhone")?.value.trim()||null,preferred_contact:prefs.join(",")||null,mailing_consent:!!document.getElementById("memberMailingConsent")?.checked};
 const {error}=await db.from("members").insert([row]); if(error){console.error(error);return alert("Error adding member: "+error.message)}
 document.querySelectorAll('#addMemberSection input').forEach(x=>{if(x.type==='checkbox')x.checked=false;else x.value=''}); document.getElementById("memberType").value=""; await renderMembers();await loadDashboard();
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
   MESSAGING V2
========================= */
let currentBookingChat = null;
let currentParentAdminIdentity = null;

async function loadBookingChatPage() {
  const details = document.getElementById("bookingChatDetails");
  if (!details) return;
  await cleanupExpiredMessages();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  if (!token) {
    details.innerHTML = "<p>Invalid booking chat link.</p>";
    return;
  }
  const { data: booking, error } = await db.from("bookings").select("*").eq("chat_token", token).single();
  if (error || !booking) {
    details.innerHTML = "<p>This booking chat link is invalid or unavailable.</p>";
    return;
  }
  currentBookingChat = booking;
  details.innerHTML = `
    <p><strong>${escapeHtml(booking.child || "")}</strong></p>
    <p>Mentor: ${escapeHtml(booking.mentor || "")}</p>
    <p>${formatDisplayDate(booking.date)} at ${escapeHtml(booking.time || "")}</p>
    <p>${escapeHtml(booking.type || "")} · ${escapeHtml(booking.location || "")}</p>`;
  await renderParentBookingChat();
}

async function renderParentBookingChat() {
  const container = document.getElementById("bookingChatMessages");
  if (!container || !currentBookingChat) return;
  const { data, error } = await db.from("messages").select("*")
    .eq("booking_id", currentBookingChat.id)
    .eq("thread_type", "booking")
    .order("created_at", { ascending: true });
  if (error) return container.innerHTML = "<p>Unable to load messages.</p>";
  container.innerHTML = (data || []).map(m => `
    <div class="chat-bubble ${m.sender_role === "parent" ? "chat-parent" : "chat-other"}">
      <strong>${escapeHtml(m.sender_name || (m.sender_role === "mentor" ? currentBookingChat.mentor : "Parent"))}</strong>
      <p>${escapeHtml(m.message || "")}</p>
      <span>${messageDateTime(m.created_at)}</span>
    </div>`).join("") || "<p>No messages yet. You can message your mentor below.</p>";
  const ids=(data||[]).filter(m=>m.recipient==="parent"&&!m.is_read).map(m=>m.id);
  if(ids.length) await db.from("messages").update({is_read:true}).in("id",ids);
}

async function sendParentBookingMessage() {
  const input = document.getElementById("bookingChatInput");
  const text = input?.value.trim() || "";
  if (!text || !currentBookingChat) return alert("Please write a message");
  const { error } = await db.from("messages").insert([{
    booking_id: currentBookingChat.id,
    mentor: currentBookingChat.mentor,
    child_name: currentBookingChat.child,
    parent_email: currentBookingChat.email,
    sender_name: currentBookingChat.parent,
    sender_role: "parent",
    recipient: "mentor",
    thread_type: "booking",
    message: text,
    is_read: false
  }]);
  if (error) return alert("Error sending message");
  input.value = "";
  await renderParentBookingChat();
}

async function copyBookingChat() {
  if (!currentBookingChat) return;
  const { data } = await db.from("messages").select("*").eq("booking_id", currentBookingChat.id).eq("thread_type", "booking").order("created_at", {ascending:true});
  const text=(data||[]).map(m=>`${messageDateTime(m.created_at)} - ${m.sender_name || m.sender_role}: ${m.message}`).join("\n");
  try { await navigator.clipboard.writeText(text || "No messages"); alert("Chat copied"); } catch { alert("Unable to copy chat on this device"); }
}

async function loadParentAdminChatPage() {
  if (!document.getElementById("parentAdminChat")) return;
  await cleanupExpiredMessages();
  const saved = JSON.parse(localStorage.getItem("r4arParentChatIdentity") || "null");
  if (saved?.name && saved?.email) {
    document.getElementById("parentChatName").value = saved.name;
    document.getElementById("parentChatEmail").value = saved.email;
    currentParentAdminIdentity = saved;
    await renderParentAdminChat();
  }
}

async function openParentAdminConversation() {
  const name = document.getElementById("parentChatName")?.value.trim() || "";
  const email = document.getElementById("parentChatEmail")?.value.trim().toLowerCase() || "";
  if (!name || !email || !email.includes("@")) return alert("Please enter your name and email");
  currentParentAdminIdentity = {name,email};
  localStorage.setItem("r4arParentChatIdentity", JSON.stringify(currentParentAdminIdentity));
  await renderParentAdminChat();
}

async function renderParentAdminChat() {
  const container = document.getElementById("parentAdminMessages");
  const compose = document.getElementById("parentAdminCompose");
  if (!container || !currentParentAdminIdentity) return;
  if (compose) compose.style.display = "block";
  const { data, error } = await db.from("messages").select("*")
    .eq("thread_type", "parent_admin")
    .eq("parent_email", currentParentAdminIdentity.email)
    .order("created_at", {ascending:true});
  if (error) return container.innerHTML="<p>Unable to load messages.</p>";
  container.innerHTML=(data||[]).map(m=>`<div class="chat-bubble ${m.sender_role === "parent" ? "chat-parent" : "chat-other"}"><strong>${escapeHtml(m.sender_name || m.sender_role)}</strong><p>${escapeHtml(m.message)}</p><span>${messageDateTime(m.created_at)}</span></div>`).join("") || "<p>No messages yet.</p>";
  const ids=(data||[]).filter(m=>m.recipient==="parent"&&!m.is_read).map(m=>m.id);
  if(ids.length) await db.from("messages").update({is_read:true}).in("id",ids);
}

async function sendParentAdminMessage() {
  const input = document.getElementById("parentAdminInput");
  const text = input?.value.trim() || "";

  if (!text || !currentParentAdminIdentity) {
    return alert("Please write a message");
  }

  const { error } = await db.from("messages").insert([{
    mentor: null,
    parent_email: currentParentAdminIdentity.email,
    sender_name: currentParentAdminIdentity.name,
    sender_role: "parent",
    recipient: "admin",
    thread_type: "parent_admin",
    message: text,
    is_read: false
  }]);

  if (error) {
    console.error("Parent → Admin message error:", error);

    alert(
      "Message failed:\n\n" +
      (error.message || "Unknown error") +
      (error.details ? "\n\n" + error.details : "") +
      (error.hint ? "\n\nHint: " + error.hint : "")
    );

    return;
  }

  input.value = "";
  await renderParentAdminChat();
}

async function copyParentAdminChat() {
  if(!currentParentAdminIdentity) return;
  const {data}=await db.from("messages").select("*").eq("thread_type","parent_admin").eq("parent_email",currentParentAdminIdentity.email).order("created_at",{ascending:true});
  const text=(data||[]).map(m=>`${messageDateTime(m.created_at)} - ${m.sender_name || m.sender_role}: ${m.message}`).join("\n");
  try { await navigator.clipboard.writeText(text||"No messages"); alert("Chat copied"); } catch { alert("Unable to copy chat on this device"); }
}

async function renderAdminMessages(){
 const c=document.getElementById("adminMessages");if(!c)return;await cleanupExpiredMessages();const {data,error}=await db.from("messages").select("*").order("created_at",{ascending:true});if(error){c.innerHTML="<p>Unable to load messages.</p>";return;}
 const relevant=(data||[]).filter(m=>m.thread_type==='parent_admin'||m.thread_type==='mentor_admin'||m.thread_type==='admin_mentor');const groups={};relevant.forEach(m=>{const key=m.parent_email?`parent:${m.parent_email}`:`mentor:${m.mentor}`;(groups[key]??=[]).push(m)});
 c.innerHTML=`<div class="message-safety-note">Messages are automatically removed after 14 days.</div>`+Object.entries(groups).map(([key,arr])=>{const last=arr[arr.length-1],label=key.startsWith('parent:')?(arr.find(x=>x.sender_role==='parent')?.sender_name||last.parent_email||'Parent'):(last.mentor||'Mentor');const unread=arr.some(x=>x.recipient==='admin'&&!x.is_read);return `<div class="chat-thread ${unread?'unread-card':''}"><h3>${escapeHtml(label)} ${unread?'<span class="unread-pill">UNREAD</span>':''}</h3><div class="chat-list">${arr.map(m=>`<div class="chat-bubble ${m.sender_role==='admin'?'chat-mine':'chat-other'}"><strong>${escapeHtml(m.sender_name||m.sender_role)}</strong><p>${escapeHtml(m.message||'')}</p><span>${messageDateTime(m.created_at)}</span></div>`).join('')}</div><textarea id="adminThread-${escapeHtml(last.id)}" class="mentor-textarea" placeholder="Reply"></textarea><button onclick="replyAdminThread('${last.id}')">SEND REPLY</button></div>`}).join('')||'<p>No messages for admin.</p>';
 const unreadIds=relevant.filter(m=>m.recipient==='admin'&&!m.is_read).map(m=>m.id);if(unreadIds.length)await db.from('messages').update({is_read:true}).in('id',unreadIds);await loadDashboard();
}
async function replyAdminThread(id){const input=document.getElementById(`adminThread-${id}`),text=input?.value.trim()||'';if(!text)return;const {data:m}=await db.from('messages').select('*').eq('id',id).single();if(!m)return;const recipient=m.mentor&&!m.parent_email?'mentor':'parent';const {error}=await db.from('messages').insert([{booking_id:null,mentor:m.mentor||null,parent_email:m.parent_email||null,sender_name:'Admin',sender_role:'admin',recipient,thread_type:recipient==='mentor'?'admin_mentor':'parent_admin',message:text,is_read:false}]);if(error)return alert('Error sending reply: '+error.message);input.value='';await renderAdminMessages();}

async function loadAdminMessageMentors() {
  const select=document.getElementById("adminMessageMentor"); if(!select) return;
  const {data}=await db.from("mentors").select("name,artist_name").order("name");
  select.innerHTML='<option value="">Select Mentor</option>'+(data||[]).map(m=>`<option value="${escapeHtml(m.name)}">${escapeHtml(m.artist_name||m.name)}</option>`).join("");
}

async function sendAdminMentorMessage(sendAll=false) {
  const text=document.getElementById("adminMentorMessage")?.value.trim()||""; if(!text) return alert("Please write a message");
  const {data:mentors}=await db.from("mentors").select("name");
  let targets=[];
  if(sendAll) targets=mentors||[]; else { const name=document.getElementById("adminMessageMentor")?.value||""; if(!name) return alert("Please select a mentor"); targets=[{name}]; }
  const rows=targets.map(m=>({mentor:m.name,sender_name:"Admin",sender_role:"admin",recipient:"mentor",thread_type:sendAll?"broadcast":"admin_mentor",message:text,is_read:false}));
  const {error}=await db.from("messages").insert(rows); if(error) return alert("Error sending message");
  document.getElementById("adminMentorMessage").value=""; alert(sendAll?"Message sent to all mentors":"Message sent"); await renderAdminMessages();
}

/* =========================
   FINAL ADMIN V2 HELPERS
========================= */
let adminExpenseFilter="Submitted";
async function renderAdminExpenses(){const c=document.getElementById("adminExpenses");if(!c)return;let q=db.from("expenses").select("*").order("created_at",{ascending:false});const {data,error}=await q;if(error){c.innerHTML="<p>Unable to load expenses.</p>";return;}let rows=data||[];if(adminExpenseFilter==='Submitted')rows=rows.filter(x=>['Pending','Submitted'].includes(x.status));else if(adminExpenseFilter)rows=rows.filter(x=>x.status===adminExpenseFilter);c.innerHTML=rows.map(x=>`<div class="slot-card"><p><strong>${escapeHtml(x.mentor||'')}</strong> — ${formatDisplayDate(x.expense_date)}</p><p>${x.miles?`${x.miles} miles • `:''}<strong>£${Number(x.amount||0).toFixed(2)}</strong></p><p>${escapeHtml(x.reason||'')}</p>${x.receipt_url?`<a href="${escapeHtml(x.receipt_url)}" target="_blank">VIEW RECEIPT</a>`:''}<p>Status: <strong>${escapeHtml(x.status||'Submitted')}</strong></p>${['Pending','Submitted'].includes(x.status)?`<button onclick="setExpenseStatus('${x.id}','Approved')">APPROVE</button>`:''}${x.status==='Approved'?`<button onclick="setExpenseStatus('${x.id}','Paid')">MARK PAID</button>`:''}</div>`).join('')||'<p>No expenses in this view.</p>'}
function setExpenseFilter(v){adminExpenseFilter=v;renderAdminExpenses()}
async function setExpenseStatus(id,status){const {error}=await db.from('expenses').update({status}).eq('id',id);if(error)return alert(error.message);await renderAdminExpenses();await loadDashboard()}

async function renderAdminNewsEvents(){const c=document.getElementById('adminNewsEvents');if(!c)return;const [{data:n},{data:e}]=await Promise.all([db.from('newsletters').select('*').order('created_at',{ascending:false}),db.from('events').select('*').order('event_date',{ascending:true})]);c.innerHTML=`<h3>Newsletters</h3>${(n||[]).map(x=>`<div class="slot-card"><strong>${escapeHtml(x.title)}</strong><p>${formatShortDate(x.published_date||x.published_at)}</p><a href="${escapeHtml(x.file_url)}" target="_blank">OPEN</a></div>`).join('')||'<p>No newsletters.</p>'}<h3>Upcoming Events</h3>${(e||[]).map(x=>`<div class="slot-card"><strong>${escapeHtml(x.title)}</strong><p>${formatDisplayDate(x.event_date)} ${escapeHtml(x.event_time||'')}</p><p>${escapeHtml(x.location||'')}</p><p>${escapeHtml(x.details||'')}</p></div>`).join('')||'<p>No upcoming events.</p>'}`}
async function saveNewsletterFinal(){const title=document.getElementById('newsTitle').value.trim(),url=document.getElementById('newsUrl').value.trim(),date=document.getElementById('newsDate').value;if(!title||!url)return alert('Title and PDF/link are required');const {error}=await db.from('newsletters').insert([{title,file_url:url,published_date:date||new Date().toISOString().slice(0,10)}]);if(error)return alert(error.message);await renderAdminNewsEvents()}
async function saveEvent(){const title=document.getElementById('eventTitle').value.trim(),date=document.getElementById('eventDate').value;if(!title||!date)return alert('Event title and date are required');const {error}=await db.from('events').insert([{title,event_date:date,event_time:document.getElementById('eventTime').value||null,location:document.getElementById('eventLocation').value.trim()||null,details:document.getElementById('eventDetails').value.trim()||null}]);if(error)return alert(error.message);await renderAdminNewsEvents()}

async function renderMailingList(){const c=document.getElementById('adminMailingList');if(!c)return;const [{data:m},{data:b}]=await Promise.all([db.from('members').select('*').eq('mailing_consent',true),db.from('bookings').select('parent,email').not('email','is',null)]);const rows=[];(m||[]).forEach(x=>x.email&&rows.push({name:x.parent_guardian_name||x.name,email:x.email,source:'Member consent'}));const seen=new Set(rows.map(x=>x.email.toLowerCase()));(b||[]).forEach(x=>{if(x.email&&!seen.has(x.email.toLowerCase())){/* booking email is not marketing consent: intentionally excluded */}});c.innerHTML=rows.map(x=>`<div class="slot-card"><strong>${escapeHtml(x.name||'Parent')}</strong><p>${escapeHtml(x.email)}</p><span class="small-muted">${x.source}</span></div>`).join('')||'<p>No opted-in mailing contacts yet.</p>'}

function printAdminList(kind){let html='';if(kind==='mentors')html=adminMentorsCache.map(x=>`<tr><td>${escapeHtml(x.artist_name||x.name)}</td><td>${escapeHtml(x.legal_name||'')}</td><td>${escapeHtml(x.email||'')}</td><td>${escapeHtml(x.phone||'')}</td></tr>`).join('');else html=membersCache.map(x=>`<tr><td>${escapeHtml(x.name||'')}</td><td>${escapeHtml(x.parent_guardian_name||'')}</td><td>${escapeHtml(x.email||'')}</td><td>${escapeHtml(x.phone||'')}</td></tr>`).join('');const w=window.open('','_blank');w.document.write(`<html><head><title>R4AR ${kind}</title></head><body><h1>Raving 4 A Reason — ${kind}</h1><table border="1" cellspacing="0" cellpadding="8" width="100%">${html}</table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}

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
  loadBookingChatPage();
  loadParentAdminChatPage();
  renderAdminMessages();
  loadAdminMessageMentors();

  const memberSearch = document.getElementById("memberSearch");
  const memberTypeFilter = document.getElementById("memberTypeFilter");

  if (memberSearch) memberSearch.addEventListener("input", filterMembers);
  if (memberTypeFilter) memberTypeFilter.addEventListener("change", filterMembers);
  const mentorSearch=document.getElementById("mentorAdminSearch"); if(mentorSearch) mentorSearch.addEventListener("input",filterAdminMentors);

  const phoneInput = document.getElementById("parentPhone");

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "");
    });
  }
};
