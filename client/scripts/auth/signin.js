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
    formMessage.textContent = '';

    const emailValid = validateInput(email, emailErr, 'Email is required');
    const passValid = validateInput(password, passwordErr, 'Password is required');
    if (!emailValid || !passValid) return;

    // 1️⃣ Check if user exists in custom DB
    const checkResp = await fetch('/Banwa/server/api/resident/check_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() })
    });

    const checkResult = await checkResp.json();

    if (!checkResult.success) {
      formMessage.style.color = 'red';
      formMessage.textContent = "User not found";
      return;
    }

    // 2️⃣ User exists → verify password with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value.trim(),
    });

    if (error || !data.user) {
      formMessage.style.color = 'red';
      formMessage.textContent = "Incorrect password";
      return;
    }

    // 3️⃣ Create PHP session
    const resp = await fetch('/Banwa/server/api/resident/signin_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabase_user_id: data.user.id }),
      credentials: "include"
    });

    const result = await resp.json();

    if (!result.success) {
      formMessage.style.color = 'red';
      formMessage.textContent = result.message;
      return;
    }

    // 4️⃣ Success
    formMessage.style.color = 'green';
    formMessage.textContent = "Login successful! Redirecting...";
    setTimeout(() => {
      window.location.href = '/Banwa/client/pages/resident/home.php';
    }, 1000);
  });
}

showValidation();
