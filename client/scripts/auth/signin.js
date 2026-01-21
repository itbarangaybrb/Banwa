// Placeholder for login-specific JavaScript.
// Currently the login page uses a simple anchor/button navigation for Sign Up.
// Add any client-side logic (form validation, ajax login) here in future.

// document.addEventListener('DOMContentLoaded', ()=>{
//   // Example: focus email on load
//   const u = document.getElementById('email');
//   if(u) u.focus();
// });

import supabase from "../../../server/api/supabase.js";

function showValidation() {
  const form = document.getElementById('login');
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  function validateInput(input, message) {
    const wrapper = input.closest('.label-and-input');
    const errorEl = wrapper?.querySelector('.error-msg');
    if (!errorEl) return true;

    const value = input.value.trim();

    const setError = (msg) => {
      input.classList.add('error');
      errorEl.classList.add('show');
      errorEl.textContent = msg;
    };

    const clearError = () => {
      input.classList.remove('error');
      errorEl.classList.remove('show');
      errorEl.textContent = '';
    };

    if (!value) {
      setError(message);
      return false;
    }

    if (input.type === 'password') {
      if (value.length < 8 || value.length > 16) {
        setError('Password should be 8-16 characters long');
        return false;
      }
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        setError('Password must contain letters and numbers');
        return false;
      }
    }

    if (input.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        setError('Enter a valid email');
        return false;
      }
    }

    clearError();
    return true;
  }

  // =========================
  // Attach events (IIFE)
  // =========================
  (() => {
    const fields = [email, password]; // add other fields here if needed

    fields.forEach(input => {
      if (!input) return;

      const wrapper = input.closest('.label-and-input');
      const errorEl = wrapper?.querySelector('.error-msg');
      if (!errorEl) return;

      const clearError = () => {
        input.classList.remove('error');
        errorEl.classList.remove('show');
        errorEl.textContent = '';
      };

      // Clear error on input
      input.addEventListener('input', clearError);

      // Validate on blur
      input.addEventListener('blur', () => {
        const msg = input.type === 'password' ? 'Password is required' :
          input.type === 'email' ? 'Email is required' :
            'This field is required';
        validateInput(input, msg);
      });
    });
  })();



  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = '';

    const validations = [
      validateInput(email, 'Email is required'),
      validateInput(password, 'Password is required')
    ];

    if (!validations.every(Boolean)) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value.trim(),
    });

    if (error) {
      formMessage.style.color = 'red';

      if (error.message.toLowerCase().includes('not confirmed')) {
        formMessage.textContent =
          'Account not verified. Please check your email.';
      } else {
        formMessage.textContent =
          'Account does not exist';
      }
      return;
    }

    const resp = await fetch('/server/api/resident/signin_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        supabase_user_id: data.user.id
      })
    });

    const result = await resp.json();

    if (!result.success) {
      formMessage.style.color = 'red';
      formMessage.textContent = result.message;
      return;
    }

    formMessage.style.color = 'green';
    formMessage.textContent = 'Login successful! Redirecting...';

    setTimeout(() => {
      window.location.href = '/client/pages/resident/home.php';
    }, 1000);
  });
}

showValidation();
