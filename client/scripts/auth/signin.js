import supabase from "../../../server/api/supabase.js";

/**
 * UI Element Selectors
 */
const loginElements = {
  form: document.getElementById('login'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  formMessage: document.getElementById('formMessage')
};

/**
 * Validator Module
 * Encapsulates logic for credential format validation.
 * Note: These constraints should match the rules defined in your registration flow.
 */
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
    // Enforcing complexity locally to reduce unnecessary network load to Supabase
    if (value.length < 8 || value.length > 16) { showError(input, 'Password should be 8-16 characters long'); return false; }
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) { showError(input, 'Password must contain letters and numbers'); return false; }
    clearError(input); 
    return true;
  }

  function validateEmail(input, message) {
    if (!input) return true;
    const value = input.value.trim();
    if (!value) { showError(input, message); return false; }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) { showError(input, 'Enter a valid email address'); return false; }
    clearError(input); 
    return true;
  }

  return { password: validatePassword, email: validateEmail, clear: clearError };
})();

/**
 * Validation Mapping
 */
const loginValidationConfig = [
  { el: loginElements.email, type: 'email', message: 'Email is required' },
  { el: loginValidationConfig.password, type: 'password', message: 'Please enter a password' }
];

/**
 * Helper: Run validation for a single field configuration
 */
function validateField(config) {
  const { el, type, message } = config;
  if (!el) return true;
  switch (type) {
    case 'email': return validator.email(el, message);
    case 'password': return validator.password(el, message);
  }
}

/**
 * Helper: Validate an array of fields (usually used on submit)
 */
function validateStep(fields) {
  return fields.map(f => validateField(loginValidationConfig.find(c => c.el === f))).every(v => v);
}

/**
 * Attach UI event listeners for interactive feedback
 */
function setupRealtimeValidation() {
  loginValidationConfig.forEach(config => {
    const { el } = config;
    if (!el) return;
    el.addEventListener('blur', () => validateField(config)); // Validate when user leaves field
    el.addEventListener('input', () => validator.clear(el));    // Clear error while typing
  });
}

/**
 * Main Authentication Orchestrator
 * This function coordinates three distinct systems: 
 * 1. Frontend Validation 
 * 2. Local Database (Check Existence)
 * 3. Supabase Auth (Identity Verification)
 * 4. Local Session/Role Management (PHP)
 */
async function handleLoginSubmit(e) {
  e.preventDefault();
  loginElements.formMessage.textContent = '';

  // 1. Initial Frontend Guard
  if (!validateStep([loginElements.email, loginElements.password])) return;

  try {
    // 2. Pre-flight Check: Does this account exist in our local system?
    // This helps differentiate between 'User not found' and 'Wrong password' if desired.
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

    // 3. Identity Verification: Authenticate against Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginElements.email.value.trim(),
      password: loginElements.password.value.trim()
    });

    if (error) {
      loginElements.formMessage.style.color = 'red';
      // Specific check for Supabase's 'email not confirmed' error
      if (error.message.toLowerCase().includes('not confirmed')) {
        loginElements.formMessage.textContent = 'Account not verified. Please check your email.';
      } else {
        loginElements.formMessage.textContent = 'Email or password is incorrect';
      }
      return;
    }

    // 4. Session Synchronization: 
    // Now that Supabase has verified identity, we notify our PHP server to 
    // handle Role-Based Access Control (RBAC) and establish a PHP session.
    const resp = await fetch('/Banwa/server/api/shared/signin_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: Ensures PHP can set session cookies
      body: JSON.stringify({ supabase_user_id: data.user.id })
    });

    const result = await resp.json();

    if (!result.success) {
      loginElements.formMessage.style.color = 'red';
      loginElements.formMessage.textContent = result.message;
      return;
    }

    // 5. Success Flow: Final Redirect
    if (result.success && result.redirect) {
      loginElements.formMessage.style.color = 'green';
      loginElements.formMessage.textContent = 'Login successful! Redirecting...';
      // Short delay for better UX/transition
      setTimeout(() => window.location.href = result.redirect, 1000);
    }
  } catch (err) {
    console.error("Auth Exception:", err);
    loginElements.formMessage.style.color = 'red';
    loginElements.formMessage.textContent = 'An unexpected error occurred.';
  }
}

/**
 * Entry Point
 */
function initializeLogin() {
  setupRealtimeValidation();
  if (loginElements.form) {
    loginElements.form.addEventListener('submit', handleLoginSubmit);
  }
}

document.addEventListener('DOMContentLoaded', initializeLogin);