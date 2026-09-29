export async function onRequestGet({env}) {
  const {results} = await env.DB.prepare(`
    SELECT
      receipt_no, name, phone, email, age_group, region,
      theme, story, keywords, desired_title,
      genre, mood, vocal_type, bpm, instruments,
      event_participation, aimion_nickname,
      privacy_consent, music_use_consent,
      notes, status, created_at, updated_at
    FROM submissions
    ORDER BY id DESC
    LIMIT 3000
  `).all();

  return Response.json({results});
}
