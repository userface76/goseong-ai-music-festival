
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

async function handleSubmit(request, env) {
  try {
    const data = await request.json();

    if (!data.privacy_consent) {
      return json({ error: "개인정보 수집·이용 동의가 필요합니다." }, 400);
    }

    if (
      !clean(data.name, 80) ||
      !clean(data.phone, 30) ||
      !clean(data.theme, 80) ||
      !clean(data.story, 5000)
    ) {
      return json({ error: "필수 입력값을 확인해주세요." }, 400);
    }

    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const ymd = kst.toISOString().slice(2, 10).replaceAll("-", "");
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const receipt = `GS${ymd}-${suffix}`;

    await env.DB.prepare(`
      INSERT INTO submissions (
        receipt_no, name, phone, email, age_group, region,
        theme, story, keywords, desired_title,
        genre, mood, vocal_type, bpm, instruments,
        event_participation, aimion_nickname,
        privacy_consent, music_use_consent, notes, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      receipt,
      clean(data.name, 80),
      clean(data.phone, 30),
      clean(data.email, 120),
      clean(data.age_group, 30),
      clean(data.region, 80),
      clean(data.theme, 80),
      clean(data.story, 5000),
      clean(data.keywords, 500),
      clean(data.desired_title, 150),
      clean(data.genre, 50),
      clean(data.mood, 50),
      clean(data.vocal_type, 30),
      clean(data.bpm, 30),
      clean(data.instruments, 300),
      data.event_participation ? 1 : 0,
      clean(data.aimion_nickname, 80),
      data.privacy_consent ? 1 : 0,
      data.music_use_consent ? 1 : 0,
      clean(data.notes, 1000),
      "접수"
    ).run();

    return json({ success: true, receipt_no: receipt });
  } catch (error) {
    return json({ error: "서버 오류가 발생했습니다.", detail: String(error?.message || error) }, 500);
  }
}

async function listSubmissions(env) {
  const { results } = await env.DB.prepare(`
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

  return json({ results });
}

async function updateStatus(request, env) {
  const { receipt_no, status } = await request.json();
  const allowed = ["접수","가사제작","음원제작","에이미온업로드","전달완료","취소"];

  if (!allowed.includes(status)) {
    return json({ error: "잘못된 상태값입니다." }, 400);
  }

  await env.DB.prepare(`
    UPDATE submissions
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE receipt_no = ?
  `).bind(status, receipt_no).run();

  return json({ success: true });
}

async function exportCsv(env) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM submissions ORDER BY id DESC
  `).all();

  const headers = [
    "receipt_no","name","phone","email","age_group","region",
    "theme","story","keywords","desired_title",
    "genre","mood","vocal_type","bpm","instruments",
    "event_participation","aimion_nickname",
    "privacy_consent","music_use_consent",
    "notes","status","created_at","updated_at"
  ];

  const lines = [headers.join(",")];
  for (const row of results) {
    lines.push(headers.map(h => csvCell(row[h])).join(","));
  }

  return new Response("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="goseong-ai-music-submissions.csv"',
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/api/submit") {
      return handleSubmit(request, env);
    }

    if (request.method === "GET" && path === "/api/admin/submissions") {
      return listSubmissions(env);
    }

    if (request.method === "POST" && path === "/api/admin/status") {
      return updateStatus(request, env);
    }

    if (request.method === "GET" && path === "/api/admin/export") {
      return exportCsv(env);
    }

    // Everything else is served from /public via the ASSETS binding.
    return env.ASSETS.fetch(request);
  }
};
