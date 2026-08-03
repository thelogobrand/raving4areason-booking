import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ejizwiegnxtwglihrxiz.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, original] = stored.split(":");
  const calculated = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(original, "hex");
  return calculated.length === originalBuffer.length && timingSafeEqual(calculated, originalBuffer);
}

async function supabase(path, options = {}) {
  if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in Netlify");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase request failed (${response.status})`);
  return data;
}

async function getCredential(key) {
  const rows = await supabase(`portal_credentials?credential_key=eq.${encodeURIComponent(key)}&select=password_hash&limit=1`, { method: "GET" });
  return rows?.[0]?.password_hash || "";
}

async function setCredential(key, password) {
  await supabase("portal_credentials?on_conflict=credential_key", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({ credential_key: key, password_hash: hashPassword(password), updated_at: new Date().toISOString() })
  });
}

async function validAdminPassword(password) {
  const stored = await getCredential("admin");
  if (stored) return verifyPassword(password, stored);
  return password === (process.env.ADMIN_BOOTSTRAP_PASSWORD || "R4AR");
}

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { success: false, message: "Method not allowed" });

  try {
    const body = JSON.parse(event.body || "{}");

    if (body.action === "login") {
      const role = String(body.role || "");
      const username = String(body.username || "").trim();
      const password = String(body.password || "");

      if (!username || !password) return json(400, { success: false, message: "Enter a username and password" });

      if (role === "admin") {
        if (username.toLowerCase() !== "admin") return json(401, { success: false, message: "Wrong username or password" });
        return (await validAdminPassword(password))
          ? json(200, { success: true })
          : json(401, { success: false, message: "Wrong username or password" });
      }

      if (role === "parent") {
        if (username.toLowerCase() !== "r4arparent") return json(401, { success: false, message: "Wrong username or password" });
        const stored = await getCredential("parent");
        const valid = stored ? verifyPassword(password, stored) : password === (process.env.PARENT_BOOTSTRAP_PASSWORD || "R4AR");
        return valid ? json(200, { success: true }) : json(401, { success: false, message: "Wrong username or password" });
      }

      if (role === "mentor") {
        const rows = await supabase(`mentors?name=ilike.${encodeURIComponent(username)}&select=id,name&limit=1`, { method: "GET" });
        const mentor = rows?.[0];
        if (!mentor) return json(401, { success: false, message: "Mentor name not found" });
        const stored = await getCredential(`mentor:${mentor.id}`);
        const valid = stored ? verifyPassword(password, stored) : password === (process.env.MENTOR_BOOTSTRAP_PASSWORD || "Mentor");
        return valid
          ? json(200, { success: true, mentor_name: mentor.name })
          : json(401, { success: false, message: "Wrong password" });
      }

      return json(400, { success: false, message: "Unknown login type" });
    }

    if (body.action === "change-password") {
      const adminPassword = String(body.admin_password || "");
      if (!(await validAdminPassword(adminPassword))) return json(401, { success: false, message: "Current admin password is incorrect" });

      const newPassword = String(body.new_password || "");
      if (newPassword.length < 8) return json(400, { success: false, message: "New password must be at least 8 characters" });

      const targetRole = String(body.target_role || "");
      let key;
      if (targetRole === "admin") key = "admin";
      else if (targetRole === "parent") key = "parent";
      else if (targetRole === "mentor" && body.mentor_id) key = `mentor:${body.mentor_id}`;
      else return json(400, { success: false, message: "Invalid password target" });

      await setCredential(key, newPassword);
      return json(200, { success: true });
    }

    return json(400, { success: false, message: "Unknown action" });
  } catch (error) {
    console.error(error);
    return json(500, { success: false, message: error.message });
  }
}
