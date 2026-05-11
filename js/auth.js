// ============================================================
// C:\Project\Barakah_Finance\js\auth.js
// Login / Signup / OTP / Profile system
// ============================================================

/* ── Modal state ── */
let authMode = 'login'; // 'login' | 'signup' | 'otp' | 'forgot'
let pendingUser = null;  // user being registered (waiting OTP)
let otpTarget = null;   // phone/email for OTP

/* ──────────────────────────────────────────
   OPEN / CLOSE MODAL
────────────────────────────────────────── */
function openAuthModal(mode = 'login', role = '') {
    authMode = mode;
    document.getElementById('authModal').classList.remove('hidden');
    switchAuthMode(mode);
    if (role) document.getElementById('auth-role-hint').textContent =
        ({ admin: 'অ্যাডমিন', member: 'সদস্য', customer: 'গ্রাহক' }[role] || '') + ' লগইন';
}
function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    clearAuthAlerts();
}

/* ──────────────────────────────────────────
   SWITCH MODE
────────────────────────────────────────── */
function switchAuthMode(mode) {
    authMode = mode;
    ['login', 'signup', 'otp', 'forgot'].forEach(m => {
        document.getElementById('auth-panel-' + m)?.classList.add('hidden');
    });
    document.getElementById('auth-panel-' + mode)?.classList.remove('hidden');
    clearAuthAlerts();
}

/* ──────────────────────────────────────────
   LOGIN
────────────────────────────────────────── */
function doAuthLogin() {
    const raw = document.getElementById('login-identifier').value.trim();
    const pass = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember')?.checked;

    if (!raw || !pass) return authAlert('সকল তথ্য পূরণ করুন।', 'error');

    const user = DB.findUser(raw);
    if (!user) return authAlert('ব্যবহারকারী খুঁজে পাওয়া যায়নি।', 'error');
    if (user.password !== pass) return authAlert('পাসওয়ার্ড ভুল!', 'error');
    if (!user.verified) return authAlert('অ্যাকাউন্ট যাচাই করা হয়নি। OTP পুনরায় পাঠান।', 'error');

    DB.setSession(user);
    if (remember) localStorage.setItem('bf_remember', user.id);
    onLoginSuccess(user);
}

/* ──────────────────────────────────────────
   SIGNUP — Step 1: form fill
────────────────────────────────────────── */
function doAuthSignup() {
    const name = document.getElementById('su-name').value.trim();
    const surname = document.getElementById('su-surname').value.trim();
    const dob = document.getElementById('su-dob').value;
    const phone = document.getElementById('su-phone').value.replace(/\D/g, '');
    const email = document.getElementById('su-email').value.trim();
    const username = document.getElementById('su-username').value.trim();
    const pass = document.getElementById('su-password').value;
    const pass2 = document.getElementById('su-password2').value;
    const terms = document.getElementById('su-terms').checked;
    const referral = document.getElementById('su-referral-val').value.trim();

    // Validation
    if (!name || !dob || !phone || !username || !pass || !pass2)
        return authAlert('তারকা চিহ্নিত সকল তথ্য পূরণ করুন।', 'error');
    if (pass.length < 8) return authAlert('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', 'error');
    if (!/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass))
        return authAlert('পাসওয়ার্ডে অবশ্যই অক্ষর ও সংখ্যা উভয়ই থাকতে হবে।', 'error');
    if (pass !== pass2) return authAlert('পাসওয়ার্ড মিলছে না।', 'error');
    if (!terms) return authAlert('শর্তাবলীতে সম্মতি দিন।', 'error');
    if (!DB.checkUsername(username)) return authAlert('এই ইউজারনেম ইতিমধ্যে নেওয়া হয়েছে।', 'error');
    if (DB.findUser(phone)) return authAlert('এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে।', 'error');
    if (phone.length < 10) return authAlert('সঠিক মোবাইল নম্বর দিন।', 'error');

    pendingUser = {
        id: DB.genID('USR'),
        name: name + (surname ? ' ' + surname : ''),
        surname,
        dob,
        phone,
        email: email || null,
        username,
        password: pass,
        referral: referral || null,
        role: 'user',
        verified: false,
        profileComplete: 40,
        createdAt: new Date().toISOString(),
        memberID: null,
        avatar: null,
    };

    // Generate & "send" OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(phone, otp);
    otpTarget = phone;

    console.log(`[DEMO OTP] Phone: ${phone} → Code: ${otp}`); // in real: SMS API

    document.getElementById('otp-target-display').textContent = phone;
    document.getElementById('otp-input').value = '';
    startOTPTimer();
    switchAuthMode('otp');
    authAlert(`OTP পাঠানো হয়েছে ${phone} নম্বরে (ডেমো: কনসোলে দেখুন)`, 'success', 'otp');
}

/* ──────────────────────────────────────────
   OTP VERIFY
────────────────────────────────────────── */
let otpTimerInterval = null;
function startOTPTimer(secs = 300) {
    clearInterval(otpTimerInterval);
    let remaining = secs;
    const el = document.getElementById('otp-timer');
    if (!el) return;
    otpTimerInterval = setInterval(() => {
        remaining--;
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        el.textContent = `${m}:${s}`;
        if (remaining <= 0) {
            clearInterval(otpTimerInterval);
            el.textContent = '০০:০০';
        }
    }, 1000);
}

function doVerifyOTP() {
    const code = document.getElementById('otp-input').value.trim();
    if (!code) return authAlert('OTP লিখুন।', 'error', 'otp');

    if (!DB.verifyOTP(otpTarget, code))
        return authAlert('OTP ভুল অথবা মেয়াদ শেষ। পুনরায় পাঠান।', 'error', 'otp');

    // Register user
    pendingUser.verified = true;
    DB.addUser(pendingUser);
    DB.setSession(pendingUser);
    clearInterval(otpTimerInterval);
    onLoginSuccess(pendingUser);
}

function resendOTP() {
    if (!otpTarget) return;
    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(otpTarget, otp);
    console.log(`[DEMO OTP RESEND] Phone: ${otpTarget} → Code: ${otp}`);
    startOTPTimer();
    authAlert('OTP পুনরায় পাঠানো হয়েছে।', 'success', 'otp');
}

/* ──────────────────────────────────────────
   FORGOT PASSWORD
────────────────────────────────────────── */
function doForgotPassword() {
    const identifier = document.getElementById('forgot-identifier').value.trim();
    if (!identifier) return authAlert('নম্বর বা ইমেইল দিন।', 'error', 'forgot');
    const user = DB.findUser(identifier);
    if (!user) return authAlert('কোনো অ্যাকাউন্ট পাওয়া যায়নি।', 'error', 'forgot');

    // Demo: just show password (in real: send OTP)
    authAlert(`ডেমো: পাসওয়ার্ড হলো "${user.password}" (বাস্তবে OTP যাবে)`, 'success', 'forgot');
}

/* ──────────────────────────────────────────
   AFTER LOGIN
────────────────────────────────────────── */
function onLoginSuccess(user) {
    closeAuthModal();
    updateNavForUser(user);
    showToastGlobal(`স্বাগতম ${user.name}! 🎉`, '#065F46');

    // Redirect by role
    if (user.role === 'admin') {
        setTimeout(() => window.location.href = 'admin/admin.html', 800);
    } else {
        updateBadgeSection();
    }
}

function updateNavForUser(user) {
    const loginBtn = document.getElementById('nav-login-btn');
    const userMenu = document.getElementById('nav-user-menu');
    const userName = document.getElementById('nav-user-name');
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = user.name;
    // Also update mobile
    const mLoginBtn = document.getElementById('mnav-login-btn');
    const mUserItem = document.getElementById('mnav-user-item');
    if (mLoginBtn) mLoginBtn.classList.add('hidden');
    if (mUserItem) mUserItem.classList.remove('hidden');
}

function doLogout() {
    DB.clearSession();
    localStorage.removeItem('bf_remember');
    location.reload();
}

/* ──────────────────────────────────────────
   USERNAME AVAILABILITY CHECK
────────────────────────────────────────── */
function checkUsernameAvailability() {
    const u = document.getElementById('su-username').value.trim();
    const hint = document.getElementById('username-hint');
    if (!u || u.length < 3) { hint.textContent = ''; return; }
    if (DB.checkUsername(u)) {
        hint.textContent = '✅ পাওয়া গেছে!';
        hint.style.color = '#059669';
    } else {
        hint.textContent = '❌ নেওয়া হয়েছে';
        hint.style.color = '#e53e3e';
    }
}

function autoGenerateUsername() {
    const name = document.getElementById('su-name').value.trim();
    if (!name) return;
    const generated = DB.genUsername(name);
    document.getElementById('su-username').value = generated;
    checkUsernameAvailability();
}

/* ──────────────────────────────────────────
   REFERRAL SEARCH
────────────────────────────────────────── */
function searchReferral() {
    const q = document.getElementById('su-referral').value.trim();
    const resultBox = document.getElementById('referral-results');
    resultBox.innerHTML = '';
    if (q.length < 2) return;

    const users = DB.getUsers().filter(u =>
        u.verified && (u.name?.includes(q) || u.phone?.includes(q) || u.memberID?.includes(q))
    );
    if (!users.length) {
        resultBox.innerHTML = '<div class="ref-item">পাওয়া যায়নি</div>';
        return;
    }
    users.slice(0, 5).forEach(u => {
        const d = document.createElement('div');
        d.className = 'ref-item';
        d.textContent = `${u.name} | ${u.phone} | ${u.memberID || '—'}`;
        d.onclick = () => {
            document.getElementById('su-referral').value = u.name;
            document.getElementById('su-referral-val').value = u.id;
            resultBox.innerHTML = '';
        };
        resultBox.appendChild(d);
    });
}

/* ──────────────────────────────────────────
   ALERT HELPER
────────────────────────────────────────── */
function authAlert(msg, type = 'error', panel = '') {
    const id = panel ? 'auth-alert-' + panel : 'auth-alert-login';
    const el = document.getElementById(id) || document.getElementById('auth-alert-login');
    if (!el) return;
    el.className = 'auth-alert ' + (type === 'error' ? 'auth-alert-error' : 'auth-alert-success');
    el.textContent = msg;
    el.classList.remove('hidden');
}
function clearAuthAlerts() {
    document.querySelectorAll('.auth-alert').forEach(el => el.classList.add('hidden'));
}

/* ──────────────────────────────────────────
   TERMS MODAL
────────────────────────────────────────── */
function openTermsModal() {
    document.getElementById('termsModal')?.classList.remove('hidden');
}
function closeTermsModal() {
    document.getElementById('termsModal')?.classList.add('hidden');
}

/* ──────────────────────────────────────────
   INIT on page load
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Restore session
    const session = DB.getSession();
    if (session && session.verified) {
        updateNavForUser(session);
        updateBadgeSection && updateBadgeSection();
    }
    // Remember me
    const remId = localStorage.getItem('bf_remember');
    if (remId && !session) {
        const user = DB.getUsers().find(u => u.id === remId);
        if (user) { DB.setSession(user); updateNavForUser(user); }
    }
});