import supabase from "../../../server/api/supabase.js";

// =========================
// Login Elements
// =========================
const loginElements = {
  form: document.getElementById('login'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  formMessage: document.getElementById('formMessage')
};

// =========================
// Validator Module
// =========================
const validator = (() => {
  function getWrapper(el) { return el.closest('.label-and-input'); }
  function getErrorEl(el) { return getWrapper(el).querySelector('.error-msg'); }

  function showError(el, message) {
    const errorEl = getErrorEl(el);
    el.classList.add('error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }

  function clearError(el) {
    const errorEl = getErrorEl(el);
    el.classList.remove('error');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }

  function validatePassword(input, message) {
    if (!input) return true;
    const value = input.value.trim();
    if (!value) { showError(input, message); return false; }
    if (value.length < 8 || value.length > 16) { showError(input, 'Password should be 8-16 characters long'); return false; }
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must contain letters and numbers'); return false; }
    clearError(input); return true;
  }

  function validateEmail(input, message) {
    if (!input) return true;
    const value = input.value.trim();
    if (!value) { showError(input, message); return false; }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) { showError(input, 'Enter a valid email address'); return false; }
    clearError(input); return true;
  }

  return { password: validatePassword, email: validateEmail, clear: clearError };
})();

// =========================
// Validation Config
// =========================
const loginValidationConfig = [
  { el: loginElements.email, type: 'email', message: 'Email is required' },
  { el: loginElements.password, type: 'password', message: 'Please enter a password' }
];

// =========================
// Field Validation Helper
// =========================
function validateField(config) {
  const { el, type, message } = config;
  if (!el) return true;
  switch (type) {
    case 'email': return validator.email(el, message);
    case 'password': return validator.password(el, message);
  }
}

// =========================
// Validate Step
// =========================
function validateStep(fields) {
  return fields.map(f => validateField(loginValidationConfig.find(c => c.el === f))).every(v => v);
}

// =========================
// Attach Real-time Validation
// =========================
function setupRealtimeValidation() {
  loginValidationConfig.forEach(config => {
    const { el } = config;
    if (!el) return;
    el.addEventListener('blur', () => validateField(config));
    el.addEventListener('input', () => validator.clear(el));
  });
}

// =========================
// Form Submission
// =========================
async function handleLoginSubmit(e) {
  e.preventDefault();
  loginElements.formMessage.textContent = '';

  if (!validateStep([loginElements.email, loginElements.password])) return;

  // Check if account exists
  const existsResp = await fetch('/Banwa/server/api/shared/check_email.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginElements.email.value.trim() })
  });
  const existsResult = await existsResp.json();

  if (!existsResult.exists) {
    loginElements.formMessage.style.color = 'red';
    loginElements.formMessage.textContent = 'Account does not exist';
    return;
  }

  // Supabase signin
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginElements.email.value.trim(),
    password: loginElements.password.value.trim()
  });

  if (error) {
    loginElements.formMessage.style.color = 'red';
    if (error.message.toLowerCase().includes('not confirmed')) {
      loginElements.formMessage.textContent = 'Account not verified. Please check your email.';
    } else {
      loginElements.formMessage.textContent = 'Email or password is incorrect';
    }
    return;
  }

  // Server-side signin check (role & redirect)
  const resp = await fetch('/Banwa/server/api/shared/signin_user.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ supabase_user_id: data.user.id })
  });

  const result = await resp.json();

  if (!result.success) {
    loginElements.formMessage.style.color = 'red';
    loginElements.formMessage.textContent = result.message;
    return;
  }

  if (result.success && result.redirect) {
    loginElements.formMessage.style.color = 'green';
    loginElements.formMessage.textContent = 'Login successful! Redirecting...';
    setTimeout(() => window.location.href = result.redirect, 1000);
  }
}

// =========================
// Initialize all functionality
// =========================
function initializeLogin() {
  setupRealtimeValidation();
  if (loginElements.form) loginElements.form.addEventListener('submit', handleLoginSubmit);
}

// Call initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLogin);
