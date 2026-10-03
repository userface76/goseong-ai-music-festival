const tbody=document.getElementById('tbody');
const search=document.getElementById('search');
const statusFilter=document.getElementById('statusFilter');
const summary=document.getElementById('summary');
let rows=[];
const langNames={ko:"🇰🇷 KO",en:"🇺🇸 EN",zh:"🇨🇳 ZH",ja:"🇯🇵 JA",vi:"🇻🇳 VI",id:"🇮🇩 ID"};
function esc(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));}
function maskPhone(v=''){if(!v)return '';return v.replace(/(\d{2,4})[- ]?(\d{2,4})[- ]?(\d{4})/,(m,a,b,c)=>a+'-****-'+c);}
function maskEmail(v=''){if(!v)return '';const [u,d]=v.split('@');return (u?u.slice(0,2)+'***':'')+(d?'@'+d:'');}
async function load(){
  summary.textContent='불러오는 중...';
  const response=await fetch('/api/admin/submissions');
  if(!response.ok){summary.textContent='불러오기 실패: Cloudflare Access 또는 API 설정을 확인하세요.';return;}
  const body=await response.json(); rows=body.results||[];
  summary.textContent=`총 접수 ${rows.length}건 · 음원 공개동의 ${rows.filter(r=>r.music_use_consent).length}건 · 이벤트 참여희망 ${rows.filter(r=>r.event_participation).length}건`;
  render();
}
function render(){
  const q=search.value.trim().toLowerCase(),status=statusFilter.value;
  const filtered=rows.filter(row=>{
    const hay=[row.receipt_no,row.name,row.phone,row.email,row.country,row.region,row.theme,row.story_original,row.story_ko,row.desired_title_original,row.desired_title_ko].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!status||row.status===status);
  });
  tbody.innerHTML=filtered.map(row=>`
    <tr>
      <td><b>${esc(row.receipt_no)}</b><br><small>${langNames[row.language]||esc(row.language||'KO')} · ${esc(row.country||'')}</small></td>
      <td>${esc(row.name)}<br><small>${esc(row.region||'')} / ${esc(row.age_group||'')}</small></td>
      <td>${esc(maskPhone(row.phone))}<br><small>${esc(maskEmail(row.email))}</small></td>
      <td>
        <b>${esc(row.desired_title_original||'(AI 제목 추천)')}</b>
        ${row.desired_title_ko&&row.desired_title_ko!==row.desired_title_original?`<br><small>🇰🇷 ${esc(row.desired_title_ko)}</small>`:''}
        <hr>
        <small><b>원문:</b> ${esc((row.story_original||row.story||'').slice(0,180))}</small>
        ${row.story_ko?`<br><small><b>한국어:</b> ${esc(row.story_ko.slice(0,180))}</small>`:''}
        ${row.lyrics_request_original?`<br><small><b>꼭 넣을 문장:</b> ${esc(row.lyrics_request_original)}</small>`:''}
        ${row.lyrics_request_ko&&row.lyrics_request_ko!==row.lyrics_request_original?`<br><small><b>한국어:</b> ${esc(row.lyrics_request_ko)}</small>`:''}
      </td>
      <td>${esc(row.genre||'')} / ${esc(row.mood||'')}<br><small>${esc(row.vocal_type||'')} · 번역:${esc(row.translation_status||'')}</small></td>
      <td>${row.music_use_consent?'동의':'미동의'}</td>
      <td><select onchange="updateStatus('${esc(row.receipt_no)}',this.value)">${['접수','가사제작','음원제작','에이미온업로드','전달완료','취소'].map(s=>`<option ${row.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
      <td>${esc(row.created_at||'')}</td>
    </tr>`).join('');
}
async function updateStatus(receipt_no,status){
  const response=await fetch('/api/admin/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({receipt_no,status})});
  if(!response.ok){alert('상태 변경에 실패했습니다.');return;} await load();
}
search.addEventListener('input',render);statusFilter.addEventListener('change',render);
document.getElementById('refresh').addEventListener('click',load);
document.getElementById('download').addEventListener('click',()=>{location.href='/api/admin/export';});
load();