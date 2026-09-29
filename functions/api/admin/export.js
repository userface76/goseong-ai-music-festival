function csvCell(value){
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function onRequestGet({env}) {
  const {results} = await env.DB.prepare(`
    SELECT * FROM submissions ORDER BY id DESC
  `).all();

  const headers = [
    'receipt_no','name','phone','email','age_group','region',
    'theme','story','keywords','desired_title',
    'genre','mood','vocal_type','bpm','instruments',
    'event_participation','aimion_nickname',
    'privacy_consent','music_use_consent',
    'notes','status','created_at','updated_at'
  ];

  const lines = [headers.join(',')];

  for(const row of results){
    lines.push(headers.map(h => csvCell(row[h])).join(','));
  }

  const csv = '\uFEFF' + lines.join('\n');

  return new Response(csv, {
    headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition':'attachment; filename="goseong-ai-music-submissions.csv"'
    }
  });
}
