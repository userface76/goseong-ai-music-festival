function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function clean(value,max=5000){return typeof value==="string"?value.trim().slice(0,max):"";}
function csvCell(value){const text=value==null?"":String(value);return `"${text.replaceAll('"','""')}"`;}

async function ensureSchema(env){
  const cols=[
    ["language","TEXT DEFAULT 'ko'"],["country","TEXT"],["story_original","TEXT"],["story_ko","TEXT"],
    ["desired_title_original","TEXT"],["desired_title_ko","TEXT"],["keywords_original","TEXT"],["keywords_ko","TEXT"],
    ["lyrics_request_original","TEXT"],["lyrics_request_ko","TEXT"],["translation_status","TEXT DEFAULT 'pending'"]
  ];
  for(const [name,type] of cols){try{await env.DB.prepare(`ALTER TABLE submissions ADD COLUMN ${name} ${type}`).run();}catch(e){}}
}

async function translateToKorean(env,data){
  const lang=clean(data.language,8)||"ko";
  const original={title:clean(data.desired_title,150),story:clean(data.story,5000),keywords:clean(data.keywords,500),lyrics_request:clean(data.lyrics_request,1500)};
  if(lang==="ko")return {...original,status:"native"};
  try{
    if(!env.AI) throw new Error("AI binding unavailable");
    const prompt=`Translate the following participant input into natural Korean. Preserve names, brands, song titles when appropriate. Return ONLY valid JSON with keys title, story, keywords, lyrics_request. Source language code: ${lang}. Input JSON: ${JSON.stringify(original)}`;
    const out=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{prompt});
    const raw=out?.response||"";
    const match=raw.match(/\{[\s\S]*\}/);
    const parsed=match?JSON.parse(match[0]):{};
    return {title:clean(parsed.title,300)||original.title,story:clean(parsed.story,6000)||original.story,keywords:clean(parsed.keywords,700)||original.keywords,lyrics_request:clean(parsed.lyrics_request,2000)||original.lyrics_request,status:"translated"};
  }catch(e){
    return {...original,status:"pending"};
  }
}

async function handleSubmit(request,env){
  try{
    await ensureSchema(env);
    const data=await request.json();
    if(!data.privacy_consent)return json({error:"Privacy consent is required."},400);
    if(!clean(data.name,80)||!clean(data.email,120)||!clean(data.country,80)||!clean(data.theme,80)||!clean(data.story,5000))return json({error:"Please check the required fields."},400);

    const tr=await translateToKorean(env,data);
    const now=new Date(); const kst=new Date(now.getTime()+9*60*60*1000);
    const ymd=kst.toISOString().slice(2,10).replaceAll("-","");
    const suffix=crypto.randomUUID().replaceAll("-","").slice(0,6).toUpperCase();
    const receipt=`GS${ymd}-${suffix}`;

    await env.DB.prepare(`
      INSERT INTO submissions(
        receipt_no,name,phone,email,age_group,region,theme,story,keywords,desired_title,
        genre,mood,vocal_type,bpm,instruments,event_participation,aimion_nickname,
        privacy_consent,music_use_consent,notes,status,
        language,country,story_original,story_ko,desired_title_original,desired_title_ko,
        keywords_original,keywords_ko,lyrics_request_original,lyrics_request_ko,translation_status
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      receipt,clean(data.name,80),clean(data.phone,30),clean(data.email,120),clean(data.age_group,30),clean(data.region,80),
      clean(data.theme,80),clean(data.story,5000),clean(data.keywords,500),clean(data.desired_title,150),
      clean(data.genre,50),clean(data.mood,50),clean(data.vocal_type,30),clean(data.bpm,30),clean(data.instruments,300),
      data.event_participation?1:0,clean(data.aimion_nickname,80),data.privacy_consent?1:0,data.music_use_consent?1:0,
      clean(data.notes,1000),"접수",clean(data.language,8)||"ko",clean(data.country,80),
      clean(data.story,5000),tr.story,clean(data.desired_title,150),tr.title,clean(data.keywords,500),tr.keywords,
      clean(data.lyrics_request,1500),tr.lyrics_request,tr.status
    ).run();
    return json({success:true,receipt_no:receipt,translation_status:tr.status});
  }catch(error){return json({error:"Server error.",detail:String(error?.message||error)},500);}
}

async function listSubmissions(env){
  await ensureSchema(env);
  const {results}=await env.DB.prepare(`
    SELECT receipt_no,name,phone,email,age_group,region,theme,story,keywords,desired_title,
    genre,mood,vocal_type,bpm,instruments,event_participation,aimion_nickname,
    privacy_consent,music_use_consent,notes,status,created_at,updated_at,
    language,country,story_original,story_ko,desired_title_original,desired_title_ko,
    keywords_original,keywords_ko,lyrics_request_original,lyrics_request_ko,translation_status
    FROM submissions ORDER BY id DESC LIMIT 3000
  `).all();
  return json({results});
}
async function updateStatus(request,env){
  const {receipt_no,status}=await request.json(); const allowed=["접수","가사제작","음원제작","에이미온업로드","전달완료","취소"];
  if(!allowed.includes(status))return json({error:"잘못된 상태값입니다."},400);
  await env.DB.prepare("UPDATE submissions SET status=?, updated_at=CURRENT_TIMESTAMP WHERE receipt_no=?").bind(status,receipt_no).run();
  return json({success:true});
}
async function exportCsv(env){
  await ensureSchema(env);
  const {results}=await env.DB.prepare(`
    SELECT
      receipt_no,name,phone,email,country,region,language,age_group,
      desired_title_original,desired_title_ko,
      theme,story_original,story_ko,
      keywords_original,keywords_ko,
      lyrics_request_original,lyrics_request_ko,
      genre,mood,vocal_type,bpm,instruments,
      event_participation,aimion_nickname,
      privacy_consent,music_use_consent,
      notes,status,translation_status,created_at,updated_at
    FROM submissions
    ORDER BY id DESC
  `).all();

  const columns=[
    ["receipt_no","접수번호"],
    ["name","이름"],
    ["phone","전화번호"],
    ["email","이메일"],
    ["country","국가"],
    ["region","지역"],
    ["language","선택언어"],
    ["age_group","연령대"],
    ["desired_title_original","노래제목_원문"],
    ["desired_title_ko","노래제목_한국어"],
    ["theme","주제"],
    ["story_original","사연_원문"],
    ["story_ko","사연_한국어"],
    ["keywords_original","키워드_원문"],
    ["keywords_ko","키워드_한국어"],
    ["lyrics_request_original","꼭넣을가사_원문"],
    ["lyrics_request_ko","꼭넣을가사_한국어"],
    ["genre","장르"],
    ["mood","분위기"],
    ["vocal_type","보컬"],
    ["bpm","BPM"],
    ["instruments","악기"],
    ["event_participation","이벤트참여"],
    ["aimion_nickname","에이미온닉네임"],
    ["privacy_consent","개인정보동의"],
    ["music_use_consent","음원활용동의"],
    ["notes","추가요청"],
    ["status","진행상태"],
    ["translation_status","번역상태"],
    ["created_at","접수일"],
    ["updated_at","수정일"]
  ];

  const lines=[columns.map(([,label])=>csvCell(label)).join(",")];
  for(const row of results){
    lines.push(columns.map(([key])=>csvCell(row[key])).join(","));
  }

  return new Response("\uFEFF"+lines.join("\n"),{
    headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":'attachment; filename="goseong-ai-music-submissions-full.csv"',
      "Cache-Control":"no-store"
    }
  });
}
export default{async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(request.method==="POST"&&path==="/api/submit")return handleSubmit(request,env);
  if(request.method==="GET"&&path==="/api/admin/submissions")return listSubmissions(env);
  if(request.method==="POST"&&path==="/api/admin/status")return updateStatus(request,env);
  if(request.method==="GET"&&path==="/api/admin/export")return exportCsv(env);
  return env.ASSETS.fetch(request);
}};