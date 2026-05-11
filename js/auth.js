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

/* ── NAV & DARK ── */
function smScroll(id) { const el = document.getElementById(id); if (!el) return; const nH = document.querySelector('nav').offsetHeight; window.scrollTo({ top: el.offsetTop - nH - 40, behavior: 'smooth' }); toggleMob(false); }
function toggleMob(force) { const m = document.getElementById('mobileMenu'); const h = document.getElementById('hamburger'); if (force === false) { m.classList.remove('active'); h.classList.remove('active'); } else { m.classList.toggle('active'); h.classList.toggle('active'); } }
function toggleDark() { document.body.classList.toggle('dark-mode'); document.getElementById('dkTog').classList.toggle('on'); localStorage.setItem('bf_dark', document.body.classList.contains('dark-mode') ? '1' : '0'); }
if (localStorage.getItem('bf_dark') === '1') { document.body.classList.add('dark-mode'); document.getElementById('dkTog')?.classList.add('on'); }

/* ── AUTH ── */
let _authMode = 'login', _pendingUser = null, _otpPhone = null, _otpInterval = null;

function openAuthModal(mode, role) {
    document.getElementById('authModal').classList.remove('hidden');
    setPanel(mode || 'login');
    if (role) document.getElementById('auth-head-txt').textContent = ({ admin: 'অ্যাডমিন', member: 'সদস্য', customer: 'গ্রাহক' }[role] || 'বারাকাহ') + ' লগইন';
}
function closeAuth() { document.getElementById('authModal').classList.add('hidden'); clearAAlerts(); }
function setAtab(t) { ['login', 'signup'].forEach(x => { document.getElementById('atab-' + x)?.classList.toggle('on', x === t); }); setPanel(t); }
function setPanel(p) { ['login', 'signup', 'otp', 'forgot'].forEach(x => { document.getElementById('ap-' + x)?.classList.toggle('hidden', x !== p) }); clearAAlerts(); }
function aAlert(msg, type, panel) { const el = document.getElementById('al-' + (panel || 'login')); if (!el) return; el.className = 'aalert aalert-' + (type === 'ok' ? 'ok' : 'err'); el.textContent = msg; el.classList.remove('hidden'); }
function clearAAlerts() { document.querySelectorAll('.aalert').forEach(e => e.classList.add('hidden')); }

function doLogin() {
    const id = document.getElementById('li-id').value.trim();
    const pw = document.getElementById('li-pw').value;
    if (!id || !pw) return aAlert('সকল তথ্য পূরণ করুন।', 'err', 'login');
    const u = DB.findUser(id);
    if (!u) return aAlert('ব্যবহারকারী খুঁজে পাওয়া যায়নি।', 'err', 'login');
    if (u.password !== pw) return aAlert('পাসওয়ার্ড ভুল!', 'err', 'login');
    if (!u.verified) return aAlert('অ্যাকাউন্ট যাচাই হয়নি।', 'err', 'login');
    DB.setSession(u);
    if (document.getElementById('li-rem')?.checked) localStorage.setItem('bf_remember', u.id);
    onLoginOk(u);
}

function doSignup() {
    const name = document.getElementById('su-name').value.trim();
    const phone = document.getElementById('su-phone').value.replace(/\D/g, '');
    const uname = document.getElementById('su-uname').value.trim();
    const pw = document.getElementById('su-pw').value;
    const pw2 = document.getElementById('su-pw2').value;
    const terms = document.getElementById('su-terms').checked;
    if (!name || !phone || !uname || !pw || !pw2) return aAlert('তারকা চিহ্নিত সকল তথ্য পূরণ করুন।', 'err', 'signup');
    if (pw.length < 8) return aAlert('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', 'err', 'signup');
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return aAlert('পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে।', 'err', 'signup');
    if (pw !== pw2) return aAlert('পাসওয়ার্ড মিলছে না।', 'err', 'signup');
    if (!terms) return aAlert('শর্তাবলীতে সম্মতি দিন।', 'err', 'signup');
    if (!DB.checkUsername(uname)) return aAlert('এই ইউজারনেম নেওয়া হয়েছে।', 'err', 'signup');
    if (DB.findUser(phone)) return aAlert('এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে।', 'err', 'signup');
    if (phone.length < 10) return aAlert('সঠিক মোবাইল নম্বর দিন।', 'err', 'signup');
    _pendingUser = { id: DB.genID('USR'), name: name + (document.getElementById('su-sname').value ? ' ' + document.getElementById('su-sname').value : ''), dob: document.getElementById('su-dob').value, phone, email: document.getElementById('su-email').value.trim() || null, username: uname, password: pw, referral: document.getElementById('su-ref-val').value || null, role: 'user', verified: false, profileComplete: 40, createdAt: new Date().toISOString(), memberID: null, avatar: null };
    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(phone, otp); _otpPhone = phone;
    console.log('[DEMO OTP]', phone, '→', otp);
    document.getElementById('otp-phone-display').textContent = phone;
    document.getElementById('otp-val').value = '';
    startOtpTimer(); setPanel('otp');
    aAlert('OTP পাঠানো হয়েছে (ডেমো: কনসোলে দেখুন)', 'ok', 'otp');
}

function startOtpTimer(s = 300) { clearInterval(_otpInterval); let r = s; const el = document.getElementById('otp-timer-el'); _otpInterval = setInterval(() => { r--; const m = String(Math.floor(r / 60)).padStart(2, '0'), sec = String(r % 60).padStart(2, '0'); el.textContent = `${m}:${sec}`; if (r <= 0) { clearInterval(_otpInterval); el.textContent = '০০:০০'; } }, 1000); }

function verifyOtp() {
    const code = document.getElementById('otp-val').value.trim();
    if (!code) return aAlert('OTP লিখুন।', 'err', 'otp');
    if (!DB.verifyOTP(_otpPhone, code)) return aAlert('OTP ভুল অথবা মেয়াদ শেষ।', 'err', 'otp');
    _pendingUser.verified = true; DB.addUser(_pendingUser); DB.setSession(_pendingUser);
    clearInterval(_otpInterval); onLoginOk(_pendingUser);
}
function resendOtp() { if (!_otpPhone) return; const otp = Math.floor(100000 + Math.random() * 900000); DB.setOTP(_otpPhone, otp); console.log('[DEMO OTP RESEND]', _otpPhone, '→', otp); startOtpTimer(); aAlert('OTP পুনরায় পাঠানো হয়েছে।', 'ok', 'otp'); }

function doForgot() { const id = document.getElementById('fg-id').value.trim(); if (!id) return aAlert('নম্বর বা ইমেইল দিন।', 'err', 'forgot'); const u = DB.findUser(id); if (!u) return aAlert('অ্যাকাউন্ট পাওয়া যায়নি।', 'err', 'forgot'); aAlert('ডেমো: পাসওয়ার্ড "' + u.password + '" (বাস্তবে OTP যাবে)', 'ok', 'forgot'); }

function onLoginOk(u) { closeAuth(); updateNavUI(u); showToastG('স্বাগতম ' + u.name + '! 🎉', '#065F46'); if (u.role === 'admin') setTimeout(() => location.href = 'admin/admin.html', 700); }

function updateNavUI(u) {
    document.getElementById('nav-login-btn')?.classList.add('hidden');
    const um = document.getElementById('nav-user-menu'); if (um) um.style.display = '';
    const un = document.getElementById('nav-user-name'); if (un) un.textContent = u.name;
    document.getElementById('mnav-login')?.classList.add('hidden');
    document.getElementById('mnav-user')?.classList.remove('hidden');
}
function doLogout() { DB.clearSession(); localStorage.removeItem('bf_remember'); location.reload(); }

function autoUname() { const n = document.getElementById('su-name').value.trim(); if (!n) return; document.getElementById('su-uname').value = DB.genUsername(n); checkUname(); }
function checkUname() { const u = document.getElementById('su-uname').value.trim(); const h = document.getElementById('uname-hint'); if (!u || u.length < 3) { h.textContent = ''; return; } if (DB.checkUsername(u)) { h.textContent = '✅ পাওয়া গেছে!'; h.style.color = '#059669'; } else { h.textContent = '❌ নেওয়া হয়েছে'; h.style.color = '#e53e3e'; } }

function refSearch() { const q = document.getElementById('su-ref').value.trim(); const box = document.getElementById('ref-results'); box.innerHTML = ''; if (q.length < 2) return; const res = DB.getUsers().filter(u => u.verified && (u.name?.includes(q) || u.phone?.includes(q) || u.memberID?.includes(q))).slice(0, 5); if (!res.length) { box.innerHTML = '<div class="ref-item">পাওয়া যায়নি</div>'; return; } res.forEach(u => { const d = document.createElement('div'); d.className = 'ref-item'; d.textContent = `${u.name} | ${u.phone}`; d.onclick = () => { document.getElementById('su-ref').value = u.name; document.getElementById('su-ref-val').value = u.id; box.innerHTML = ''; }; box.appendChild(d); }); }

function openTerms() { document.getElementById('termsModal').classList.remove('hidden'); }
function closeTerms() { document.getElementById('termsModal').classList.add('hidden'); }

/* ── BADGE DETAIL ── */
function openBD(key) {
    const modal = document.getElementById('bdModal'); const con = document.getElementById('bd-content');
    const u = DB.getUsers().filter(x => x.verified && x.role !== 'admin'), sv = DB.getSavings(), ln = DB.getLoans().filter(l => l.status === 'active');
    let h = '';
    if (key === 'members') { h = `<p class="bd-title">👥 সদস্যবৃন্দ</p><table class="bd-table"><tr><th>নাম</th><th>আইডি</th><th>মোবাইল</th><th>ভূমিকা</th></tr>${u.map(x => `<tr><td>${x.name}</td><td>${x.memberID || '—'}</td><td>${x.phone}</td><td>${x.role}</td></tr>`).join('') || '<tr><td colspan=4 class="bd-empty">কোনো সদস্য নেই</td></tr>'}</table>`; }
    else if (key === 'savings') { h = `<p class="bd-title">💰 সঞ্চয় বিবরণ</p><table class="bd-table"><tr><th>সদস্য</th><th>মাস</th><th>পরিমাণ</th><th>তারিখ</th></tr>${sv.map(s => `<tr><td>${DB.getUsers().find(x => x.id === s.userId)?.name || '—'}</td><td>${s.month || '—'}</td><td>৳${(s.amount || 0).toLocaleString()}</td><td>${s.date ? new Date(s.date).toLocaleDateString('bn-BD') : '—'}</td></tr>`).join('') || '<tr><td colspan=4 class="bd-empty">কোনো সঞ্চয় নেই</td></tr>'}</table>`; }
    else if (key === 'loans') { h = `<p class="bd-title">🤝 করজে হাসানা</p><table class="bd-table"><tr><th>সদস্য</th><th>পরিমাণ</th><th>বাকি</th><th>মাস</th></tr>${ln.map(l => `<tr><td>${DB.getUsers().find(x => x.id === l.userId)?.name || '—'}</td><td>৳${(l.amount || 0).toLocaleString()}</td><td>৳${(l.remaining || l.amount || 0).toLocaleString()}</td><td>${l.months || 3}</td></tr>`).join('') || '<tr><td colspan=4 class="bd-empty">কোনো সক্রিয় করজ নেই</td></tr>'}</table>`; }
    else if (key === 'services') { h = `<p class="bd-title">🌟 আমাদের সেবাসমূহ</p><div class="svc-grid">${[{ i: '🤝', n: 'করজে হাসানা', d: 'বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা' }, { i: '💰', n: 'সঞ্চয় ও বিনিয়োগ', d: 'মাসিক ২,০০০ টাকা সঞ্চয়' }, { i: '🕌', n: 'সুদমুক্ত অর্থনীতি', d: 'শরিয়াহসম্মত সকল লেনদেন' }, { i: '📊', n: 'মোট সম্পদ', d: 'সঞ্চয়: ৳' + sv.reduce((a, s) => a + (s.amount || 0), 0).toLocaleString('bn') }].map(s => `<div class="svc-card"><div style="font-size:1.5rem">${s.i}</div><div class="svc-name">${s.n}</div><div class="svc-desc">${s.d}</div></div>`).join('')}</div>`; }
    con.innerHTML = h; modal.classList.remove('hidden');
}
function closeBD() { document.getElementById('bdModal').classList.add('hidden'); }

/* ── QUICK FORMS ── */
function quickSubmit(type) {
    const al = document.getElementById('alert-' + type); al.className = 'alert'; al.style.display = 'none';
    let ok = true;
    if (type === 'member' && (!document.getElementById('m-name').value || !document.getElementById('m-phone').value)) ok = false;
    if (type === 'product' && (!document.getElementById('p-product').value || !document.getElementById('p-price').value)) ok = false;
    if (type === 'qard') { const a = parseFloat(document.getElementById('q-amount').value); if (!a || a > 15000) { al.className = 'alert alert-error'; al.textContent = 'সর্বোচ্চ ১৫,০০০ টাকা।'; al.style.display = 'block'; return; } if (!document.getElementById('q-name').value) ok = false; }
    if (!ok) { al.className = 'alert alert-error'; al.textContent = 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।'; al.style.display = 'block'; return; }
    al.className = 'alert alert-success'; al.textContent = { member: 'আবেদন জমা হয়েছে!', product: 'পণ্য রিকোয়েস্ট জমা হয়েছে!', qard: 'করজে হাসানা আবেদন জমা হয়েছে!' }[type]; al.style.display = 'block';
    showToastG('✓ আবেদন জমা হয়েছে!');
}
function pCalc() { const p = parseFloat(document.getElementById('p-price').value) || 0; if (p > 0) { const t = p * 1.1, m = t / 6; document.getElementById('p-calc-box').style.display = 'block'; document.getElementById('pv-t').textContent = '৳' + Math.round(t).toLocaleString('bn'); document.getElementById('pv-d').textContent = '৳' + Math.round(m).toLocaleString('bn'); document.getElementById('pv-m').textContent = '৳' + Math.round(m).toLocaleString('bn') + ' × ৫'; } else document.getElementById('p-calc-box').style.display = 'none'; }

/* ── GLOBAL TOAST ── */
function showToastG(msg, color = '#065F46') { const t = document.createElement('div'); t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${color};color:#fff;padding:12px 20px;border-radius:10px;font-family:'Noto Serif Bengali',serif;font-size:14px;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.25);animation:slideUp .3s ease;max-width:300px;`; t.textContent = msg; document.body.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3500); }
if (!document.querySelector('style[data-su]')) { const s = document.createElement('style'); s.dataset.su = '1'; s.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'; document.head.appendChild(s); }

/* ── NOTICE + BADGES INIT (override notice.js openBadgeDetail) ── */
function openBadgeDetail(key) { openBD(key); }

/* ── SESSION RESTORE ── */
(function () {
    const ses = DB.getSession();
    if (ses && ses.verified) { updateNavUI(ses); }
    else { const rid = localStorage.getItem('bf_remember'); if (rid) { const u = DB.getUsers().find(x => x.id === rid); if (u) { DB.setSession(u); updateNavUI(u); } } }
})();