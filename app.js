const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar_menu');

menu.addEventListener('click', function() {
  menu.classList.toggle('is-active');
  menuLinks.classList.toggle('active');
});


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup');
  const submitBtn = document.getElementById('signup_button');

  // Create a message area (appears below button)
  const messageDiv = document.createElement('div');
  messageDiv.id = 'form-message';
  messageDiv.style.marginTop = '1.2rem';
  messageDiv.style.fontSize = '0.95rem';
  messageDiv.style.minHeight = '1.4rem';
  submitBtn.parentNode.insertBefore(messageDiv, submitBtn.nextSibling);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous message
    messageDiv.textContent = '';
    messageDiv.style.color = '';

    // ─── 1. Get values ───────────────────────────────────────
    const username   = document.getElementById('userName').value.trim();
    const email      = document.getElementById('email').value.trim();
    const password   = document.getElementById('passWord').value;
    const repassword = document.getElementById('rePassword').value;

    // ─── 2. Basic client-side validation ─────────────────────
    if (!username) {
        showMessage(messageDiv, 'Please enter a username', 'error');
        return;
    }
    if (username.length < 3) {
        showMessage(messageDiv, 'Username must be at least 3 characters', 'error');
        return;
    }

    if (!email) {
        showMessage(messageDiv, 'Please enter your email', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showMessage(messageDiv, 'Please enter a valid email address', 'error');
        return;
    }

    if (!password) {
        showMessage(messageDiv, 'Please enter a password', 'error');
        return;
    }
    if (password.length < 8) {
        showMessage(messageDiv, 'Password must be at least 8 characters', 'error');
        return;
    }

    if (password !== repassword) {
        showMessage(messageDiv, 'Passwords do not match', 'error');
        return;
    }

    const payload = {
        username,
        email,
        password    // ← will be hashed **on the server** — never store plain text!
    };

    // Disable button & show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const response = await fetch('http://localhost:5000/api/signup', {     // ← CHANGE THIS to your real endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'same-origin'   // if using sessions/cookies
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(messageDiv, result.message || 'Account created successfully!', 'success');
            // Optional: redirect after delay
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1800);
        } else {
            showMessage(messageDiv, result.error || 'Registration failed. Please try again.', 'error');
        }

    } catch (err) {
        console.error('Signup error:', err);
        showMessage(messageDiv, 'Cannot connect to the server. Please try again later.', 'error');
    }
    finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
  });
});

function showMessage(element, text, type = 'info') {
  element.textContent = text;
  if (type === 'error') {
    element.style.color = '#d32f2f';
  } else if (type === 'success') {
    element.style.color = '#2e7d32';
  } else {
    element.style.color = '#424242';
  }
}

function isValidEmail(email) {
  // Very basic regex — good enough for most UX purposes
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup');
    const loginForm  = document.getElementById('loginForm');
    const messageEl  = document.getElementById('message') || document.getElementById('form-message');

    // ─── SIGNUP HANDLING ────────────────────────────────────────
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username   = document.getElementById('userName').value.trim();
            const email      = document.getElementById('email').value.trim();
            const password   = document.getElementById('passWord').value;
            const repassword = document.getElementById('rePassword').value;

            if (!validateSignup(username, email, password, repassword, messageEl)) return;

            await sendRequest('/api/signup', { username, email, password }, messageEl, 'Account created! Redirecting...', './login.html');
        });
    }

    // ─── LOGIN HANDLING ─────────────────────────────────────────
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showMessage(messageEl, 'Please fill in both fields', 'error');
                return;
            }

            await sendRequest('/api/login', { username, password }, messageEl, 'Login successful! Redirecting...', './index.html');
        });
    }
});

function showMessage(el, text, type = 'info') {
    if (!el) return;
    el.textContent = text;
    el.style.color = type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : '#424242';
}

function validateSignup(username, email, password, repassword, el) {
    if (!username)               return showMessage(el, 'Username is required', 'error'), false;
    if (username.length < 3)     return showMessage(el, 'Username too short (min 3)', 'error'), false;
    if (!email)                  return showMessage(el, 'Email is required', 'error'), false;
    if (!email.includes('@'))    return showMessage(el, 'Invalid email format', 'error'), false;
    if (!password)               return showMessage(el, 'Password is required', 'error'), false;
    if (password.length < 8)     return showMessage(el, 'Password too short (min 8)', 'error'), false;
    if (password !== repassword) return showMessage(el, 'Passwords do not match', 'error'), false;
    return true;
}

async function sendRequest(endpoint, data, messageEl, successText, redirectUrl) {
    const btn = endpoint.includes('signup') 
        ? document.getElementById('signup_button')
        : document.getElementById('login_button');

    btn.disabled = true;
    btn.textContent = endpoint.includes('signup') ? 'Creating...' : 'Logging in...';

    try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            showMessage(messageEl, successText, 'success');
            setTimeout(() => window.location.href = redirectUrl, 1400);
        } else {
            showMessage(messageEl, result.error || 'Something went wrong', 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage(messageEl, 'Cannot connect to server', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = endpoint.includes('signup') ? 'Sign Up' : 'Login';
    }
}