// Placeholder for login-specific JavaScript.
// Currently the login page uses a simple anchor/button navigation for Sign Up.
// Add any client-side logic (form validation, ajax login) here in future.

// document.addEventListener('DOMContentLoaded', ()=>{
//   // Example: focus username on load
//   const u = document.getElementById('username');
//   if(u) u.focus();
// });

import supabase from '../../configs/auth/supabase.js'

function showValidation() {
  const form = document.getElementById('login');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const usernameErr = username.parentElement.querySelector('.err-msg');
  const passwordErr = password.parentElement.querySelector('.err-msg');
  let isValid = false;

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

  username.addEventListener('input', () =>
    validateInput(username, usernameErr, 'Username is required')
  );
  password.addEventListener('input', () =>
    validateInput(password, passwordErr, 'Password is required')
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userValid = validateInput(username, usernameErr, 'Username is required');
    const passValid = validateInput(password, passwordErr, 'Password is required');

    isValid = userValid && passValid;

    if (!isValid) return;

   const { data, error } = await supabase.auth.signInWithPassword({
      email: username.value.trim(),
      password: password.value.trim(),
    });

    if (error) {
      console.error('Login failed:', error.message);
      passwordErr.textContent = 'Invalid email or password';
      return;
    }
    
    // Success
    console.log('Login success:', data);
    window.location.href = '/Banwa/client/pages/resident/home.php';
  });
}

showValidation();


