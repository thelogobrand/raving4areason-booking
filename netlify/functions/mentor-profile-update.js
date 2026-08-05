const crypto = require('crypto');

const SUPABASE_URL = 'https://ejizwiegnxtwglihrxiz.supabase.co';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server profile key is not configured' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const mentorId = String(body.mentor_id || '').trim();
    const mentorName = String(body.mentor_name || '').trim();
    const authProof = String(body.auth_proof || '').trim();
    const action = String(body.action || '').trim();

    if ((!mentorId && !mentorName) || !authProof || !action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing profile request details' }) };
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };

    const query = mentorId
      ? `id=eq.${encodeURIComponent(mentorId)}`
      : `name=eq.${encodeURIComponent(mentorName)}`;

    const mentorResponse = await fetch(`${SUPABASE_URL}/rest/v1/mentors?select=*&${query}&limit=1`, { headers });
    const mentorRows = await mentorResponse.json();
    const mentor = Array.isArray(mentorRows) ? mentorRows[0] : null;

    if (!mentor) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Mentor profile not found' }) };
    }

    const expectedProof = mentor.password_hash || sha256('Mentor');
    if (authProof !== expectedProof) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Mentor session has expired. Please log in again.' }) };
    }

    const updates = {};
    if (action === 'set_photo') {
      const url = String(body.profile_image_url || '').trim();
      if (!url.startsWith('https://')) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid profile image URL' }) };
      }
      updates.profile_image_url = url;
    } else if (action === 'remove_photo') {
      updates.profile_image_url = null;
    } else if (action === 'save_profile') {
      updates.email = body.email ? String(body.email).trim() : null;
      if (body.new_password_hash) {
        updates.password_hash = String(body.new_password_hash);
      }
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown profile action' }) };
    }

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/mentors?id=eq.${encodeURIComponent(mentor.id)}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(updates)
    });

    const updated = await updateResponse.json().catch(() => []);
    if (!updateResponse.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: updated?.message || 'Could not update mentor profile' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, mentor: updated?.[0] || null }) };
  } catch (error) {
    console.error('mentor-profile-update error', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Profile update failed' }) };
  }
};
