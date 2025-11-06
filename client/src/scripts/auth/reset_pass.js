document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  if (!form) return;

  const p = document.getElementById('newPassword');
  const c = document.getElementById('confirmPassword');
  const errP = document.getElementById('errMsgNew');
  const errC = document.getElementById('errMsgConfirm');

  // Password rule
  const rules = [
    /.{8,16}/,     // 8-16 chars
    /[A-Za-z]/,    // at least 1 letter
    /[0-9]/        // at least 1 number
  ];

  function validatePassword(val, errorEl, inputEl) {
    if (!val) {
      errorEl.textContent = 'Password is required';
      inputEl.classList.add('error');
      return false;
    }
    if (!rules.every(r => r.test(val))) {
      errorEl.textContent = 'Password must be 8-16 characters and contain both letters and numbers';
      inputEl.classList.add('error');
      return false;
    }
    errorEl.textContent = '';
    inputEl.classList.remove('error');
    return true;
  }

  function validateConfirmation(passwordVal, confirmVal, errorEl, inputEl) {
    if (!confirmVal) {
      errorEl.textContent = 'Please confirm your password';
      inputEl.classList.add('error');
      return false;
    }
    if (passwordVal !== confirmVal) {
      errorEl.textContent = 'Passwords do not match';
      inputEl.classList.add('error');
      return false;
    }
    errorEl.textContent = '';
    inputEl.classList.remove('error');
    return true;
  }

  p.addEventListener('input', () => validatePassword(p.value, errP, p));
  c.addEventListener('input', () => validateConfirmation(p.value, c.value, errC, c));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const passVal = p.value || '';
    const confirmVal = c.value || '';

    const validPassword = validatePassword(passVal, errP, p);
    const validConfirm = validateConfirmation(passVal, confirmVal, errC, c);

    if (!validPassword) {
      p.focus();
      return;
    }
    if (!validConfirm) {
      c.focus();
      return;
    }

    // Submission succeeded, replace right panel
    const right = document.querySelector('.right-panel');
    if (right) {
      right.innerHTML = `
        <div style="max-width:520px;margin:48px auto 0;text-align:center;">
          <h1 class="welcome-header" style="font-size:28px;color:#0b3a82">Password Updated!</h1>
          <div class="success-circle" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div style="margin-top:12px;color:#213a63;font-weight:700">Updated successfully.</div>
          <div style="margin-top:22px">
            <button id="backToLoginBtn" class="next-btn">Back to Login</button>
          </div>
        </div>
      `;
      setTimeout(() => {
        const btn = document.getElementById('backToLoginBtn');
        if (btn) btn.addEventListener('click', () => location.href = '/client/src/pages/auth/signin.php');
      }, 0);
    } else {
      location.href = '/Banwa/client/src/pages/auth/signin.php';
    }
  });
});