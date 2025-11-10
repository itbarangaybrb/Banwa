document.addEventListener('DOMContentLoaded', ()=>{
  // match the signup OTP behavior: select inputs inside #codeInputs
  const inputs = () => Array.from(document.querySelectorAll('#codeInputs input'));
  const confirmBtn = document.getElementById('confirmBtn');
  const resendLink = document.getElementById('resendLink');

  // focus first input when visible
  setTimeout(()=>{ const f = document.querySelector('#codeInputs input'); if(f) f.focus(); }, 60);

  // delegated input handling (works even if inputs were added dynamically)
  function updateConfirm(){
    const filled = inputs().every(i => i.value.trim() !== '');
    if(confirmBtn){
      confirmBtn.disabled = !filled;
      confirmBtn.style.opacity = filled ? '1' : '0.7';
    }
  }

  document.addEventListener('input', (e)=>{
    if(!e.target.matches('#codeInputs input')) return;
    e.target.value = e.target.value.replace(/[^0-9]/g,'').slice(0,1);
    const all = inputs();
    const idx = all.indexOf(e.target);
    if(e.target.value && idx < all.length - 1) all[idx+1].focus();
    updateConfirm();
  });

  document.addEventListener('keydown', (e)=>{
    if(!e.target.matches('#codeInputs input')) return;
    const all = inputs();
    const idx = all.indexOf(e.target);
    if(e.key === 'Backspace' && !e.target.value && idx>0){ all[idx-1].focus(); }
    if(e.key === 'ArrowLeft' && idx>0){ all[idx-1].focus(); }
    if(e.key === 'ArrowRight' && idx < all.length-1){ all[idx+1].focus(); }
  });

  // handle paste into any input
  document.addEventListener('paste', (e)=>{
    if(!e.target.matches('#codeInputs input')) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0,6).split('');
    const all = inputs();
    digits.forEach((d,i)=>{ if(all[i]) all[i].value = d; });
    const nextIdx = Math.min(digits.length, all.length-1);
    if(all[nextIdx]) all[nextIdx].focus();
    updateConfirm();
  });

  // confirm button handling
  if(confirmBtn){
    confirmBtn.addEventListener('click', ()=>{
      if(confirmBtn.disabled) return;
      const code = inputs().map(i=>i.value).join('');
      if(code.length !== inputs().length) return;
      confirmBtn.disabled = true;
      confirmBtn.innerText = 'Verifying...';
      // demo verify — replace with real API call
      setTimeout(()=>{
        alert('OTP verified (demo)');
        // after successful OTP, proceed to reset password page
        location.href = '/Banwa/client/pages/auth/reset_pass.php';
      }, 700);
    });
  }

  // simple resend demo
  if(resendLink){
    let timer = 30; let intervalId = null;
    const startTimer = ()=>{
      timer = 30; resendLink.classList.add('disabled'); resendLink.setAttribute('aria-disabled','true');
      intervalId = setInterval(()=>{ timer--; if(timer<=0){ clearInterval(intervalId); resendLink.classList.remove('disabled'); resendLink.removeAttribute('aria-disabled'); } }, 1000);
    };
    startTimer();
    resendLink.addEventListener('click', (e)=>{ e.preventDefault(); if(resendLink.classList.contains('disabled')) return; alert('OTP resent (demo)'); startTimer(); });
  }

  // initialize state
  updateConfirm();
});
