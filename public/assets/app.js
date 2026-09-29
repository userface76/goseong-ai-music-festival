const form = document.getElementById('surveyForm');
const steps = [...document.querySelectorAll('.step')];
const progressBar = document.getElementById('progressBar');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const result = document.getElementById('result');
let current = 0;

function showStep(index){
  steps.forEach((step, i) => step.classList.toggle('active', i === index));
  prevBtn.hidden = index === 0;
  nextBtn.hidden = index === steps.length - 1;
  submitBtn.hidden = index !== steps.length - 1;
  progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
  window.scrollTo({top:0, behavior:'smooth'});
}

function validateCurrentStep(){
  const inputs = [...steps[current].querySelectorAll('input, select, textarea')];
  for(const el of inputs){
    if(!el.checkValidity()){
      el.reportValidity();
      return false;
    }
  }
  return true;
}

nextBtn.addEventListener('click', () => {
  if(validateCurrentStep() && current < steps.length - 1){
    current += 1;
    showStep(current);
  }
});

prevBtn.addEventListener('click', () => {
  if(current > 0){
    current -= 1;
    showStep(current);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if(!validateCurrentStep()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = '접수 중...';

  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  data.event_participation = fd.get('event_participation') === 'on';
  data.privacy_consent = fd.get('privacy_consent') === 'on';
  data.music_use_consent = fd.get('music_use_consent') === 'on';

  try{
    const response = await fetch('/api/submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(data)
    });

    const body = await response.json();
    if(!response.ok) throw new Error(body.error || '접수에 실패했습니다.');

    form.hidden = true;
    result.hidden = false;
    result.innerHTML = `
      <h2>🎉 신청이 완료되었습니다.</h2>
      <p>접수번호: <strong>${body.receipt_no}</strong></p>
      <p>운영진이 접수 내용을 확인한 뒤 AI 가사·음악 제작을 진행합니다.</p>
      <p>접수번호는 캡처해서 보관해 주세요.</p>
    `;
  }catch(error){
    alert(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'AI 음악 제작 신청하기';
  }
});

showStep(current);
