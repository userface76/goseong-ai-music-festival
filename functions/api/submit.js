function json(data, status = 200){
  return new Response(JSON.stringify(data), {
    status,
    headers:{'Content-Type':'application/json; charset=utf-8'}
  });
}

function clean(value, max = 5000){
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function onRequestPost({request, env}) {
  try{
    const data = await request.json();

    if(!data.privacy_consent){
      return json({error:'개인정보 수집·이용 동의가 필요합니다.'}, 400);
    }

    if(
      !clean(data.name, 80) ||
      !clean(data.phone, 30) ||
      !clean(data.theme, 80) ||
      !clean(data.story, 5000)
    ){
      return json({error:'필수 입력값을 확인해주세요.'}, 400);
    }

    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const ymd = kst.toISOString().slice(2, 10).replaceAll('-', '');
    const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
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
      '접수'
    ).run();

    return json({success:true, receipt_no:receipt});
  }catch(error){
    return json({error:'서버 오류가 발생했습니다.'}, 500);
  }
}
