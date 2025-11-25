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

  const emailErr = email.parentElement.querySelector('.error-msg');
  const passwordErr = password.parentElement.querySelector('.error-msg');

  function validateInput(input, errorEl, message) {
    if (input.value.trim() === '') {
      input.classList.add('error');
      errorEl.textContent = message;
      return false;
    } else {
      input.classList.remove('error');
      errorEl.textContent = '';
      return true;
    }
  }

  email.addEventListener('input', () =>
    validateInput(email, emailErr, 'Email is required')
  );

  password.addEventListener('input', () =>
    validateInput(password, passwordErr, 'Password is required')
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValid = validateInput(email, emailErr, 'Email is required');
    const passValid = validateInput(password, passwordErr, 'Password is required');

    if (!emailValid || !passValid) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value.trim(),
    });

    if (error) {
      passwordErr.textContent = "Invalid email or password";
      return;
    }

    window.location.href = '/Banwa/client/pages/resident/home.php';
  });
}

showValidation();
