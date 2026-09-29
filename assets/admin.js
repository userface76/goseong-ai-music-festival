const tbody = document.getElementById('tbody');
const search = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');
const summary = document.getElementById('summary');

let rows = [];

function esc(value=''){
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
}

async function load(){
  summary.textContent = '불러오는 중...';
  const response = await fetch('/api/admin/submissions');

  if(!response.ok){
    summary.textContent = '불러오기 실패: Cloudflare Access 또는 API 설정을 확인하세요.';
    return;
  }

  const body = await response.json();
  rows = body.results || [];

  summary.textContent =
    `총 접수 ${rows.length}건 · 음원 공개동의 ${rows.filter(r => r.music_use_consent).length}건 · ` +
    `이벤트 참여희망 ${rows.filter(r => r.event_participation).length}건`;

  render();
}

function render(){
  const q = search.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = rows.filter(row => {
    const haystack = [row.receipt_no,row.name,row.phone,row.theme,row.story]
      .join(' ').toLowerCase();

    return (!q || haystack.includes(q)) && (!status || row.status === status);
  });

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td><b>${esc(row.receipt_no)}</b></td>
      <td>
        ${esc(row.name)}
        <br><small>${esc(row.region || '')} / ${esc(row.age_group || '')}</small>
      </td>
      <td>
        ${esc(row.phone)}
        <br><small>${esc(row.email || '')}</small>
      </td>
      <td>
        <b>${esc(row.theme || '')}</b>
        <br><small>${esc((row.story || '').slice(0,130))}</small>
      </td>
      <td>
        ${esc(row.genre || '')} / ${esc(row.mood || '')}
        <br><small>${esc(row.vocal_type || '')}</small>
      </td>
      <td>${row.music_use_consent ? '동의' : '미동의'}</td>
      <td>
        <select onchange="updateStatus('${esc(row.receipt_no)}', this.value)">
          ${['접수','가사제작','음원제작','에이미온업로드','전달완료','취소']
            .map(s => `<option ${row.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${esc(row.created_at || '')}</td>
    </tr>
  `).join('');
}

async function updateStatus(receipt_no, status){
  const response = await fetch('/api/admin/status', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({receipt_no,status})
  });

  if(!response.ok){
    alert('상태 변경에 실패했습니다.');
    return;
  }

  await load();
}

search.addEventListener('input', render);
statusFilter.addEventListener('change', render);
document.getElementById('refresh').addEventListener('click', load);
document.getElementById('download').addEventListener('click', () => {
  location.href = '/api/admin/export';
});

load();
