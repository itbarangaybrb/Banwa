document.addEventListener('DOMContentLoaded', () => {
  const numberInput = document.getElementById('forgotNumber');
  if (numberInput) numberInput.focus();

  const form = document.getElementById('forgotForm');
  const btn = document.getElementById('sendOtpBtn');
  const numberErr = document.getElementById('errMsg');

  function validateNumber(input, errorEl) {
    const val = input.value.trim();
    // Valid Philippine mobile format: 10 digits (ex: 9123456789)
    const isValid = /^(\d{10})$/.test(val);
    if (val === '') {
      input.classList.add('error');
      errorEl.textContent = 'Mobile number is required';
      return false;
    }
    if (!isValid) {
      input.classList.add('error');
      errorEl.textContent = 'Enter a valid 10-digit mobile number';
      return false;
    }
    input.classList.remove('error');
    errorEl.textContent = '';
    return true;
  }

  numberInput.addEventListener('input', () => {
    const valid = validateNumber(numberInput, numberErr);
    btn.disabled = !valid;
  });

  if (form && btn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = validateNumber(numberInput, numberErr);
      if (!valid) {
        numberInput.focus();
        return;
      }
      btn.disabled = true;
      btn.innerText = 'SENT';
      // Simulate OTP send, then go to verification page
      setTimeout(() => {
        location.href = '/Banwa/client/pages/auth/forgot_pass_verification.php';
      }, 600);
    });
  }
});