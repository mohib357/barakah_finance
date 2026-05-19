// C:\Project\Barakah_Finance\js\auth.js
// ════════ AUTH SYSTEM — FIXED VERSION ════════

// ════════ NAV / SCROLL / DARK MODE UTILS ════════
function smScroll(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const nav = document.querySelector('nav');
    const nH = nav ? nav.offsetHeight : 80;
    window.scrollTo({ top: el.offsetTop - nH - 20, behavior: 'smooth' });
    toggleMob(false);
}

function toggleMob(force) {
    const m = document.getElementById('mobileMenu');
    const h = document.getElementById('hamburger');
    if (!m) return;
    if (force === false) {
        m.classList.remove('active');
        if (h) h.classList.remove('active');
    } else {
        m.classList.toggle('active');
        if (h) h.classList.toggle('active');
    }
}

function toggleDark() {
    document.body.classList.toggle('dark-mode');
    const tog = document.getElementById('dkTog');
    if (tog) tog.classList.toggle('on');
    localStorage.setItem('bf_dark', document.body.classList.contains('dark-mode') ? '1' : '0');
}

// Apply saved dark mode on load
(function () {
    if (localStorage.getItem('bf_dark') === '1') {
        document.body.classList.add('dark-mode');
        const tog = document.getElementById('dkTog');
        if (tog) tog.classList.add('on');
    }
})();

// Fix nav-mobile: support both 'active' and 'open' class
const _mobileMenuStyle = document.createElement('style');
_mobileMenuStyle.textContent = '.nav-mobile.active { left: 0 !important; display: flex !important; }';
document.head.appendChild(_mobileMenuStyle);

// ════════ MODAL CONTROL ════════
let _authMode = 'login';
let _pendingUser = null;
let _otpPhone = null;
let _otpInterval = null;

function openAuthModal(mode, role) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    setPanel(mode || 'login');
    const headTxt = document.getElementById('auth-head-txt');
    if (role && headTxt) {
        const labels = { admin: 'অ্যাডমিন', member: 'সদস্য', customer: 'গ্রাহক' };
        headTxt.textContent = (labels[role] || 'বারাকাহ') + ' লগইন';
    }
}

function closeAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
    clearAAlerts();
}

function setAtab(t) {
    ['login', 'signup'].forEach(x => {
        const el = document.getElementById('atab-' + x);
        if (el) el.classList.toggle('on', x === t);
    });
    setPanel(t);
}

function setPanel(p) {
    ['login', 'signup', 'otp', 'forgot'].forEach(x => {
        const el = document.getElementById('ap-' + x);
        if (el) el.classList.toggle('hidden', x !== p);
    });
    clearAAlerts();
}

function aAlert(msg, type, panel) {
    const el = document.getElementById('al-' + (panel || 'login'));
    if (!el) return;
    el.className = 'aalert aalert-' + (type === 'ok' ? 'ok' : 'err');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function clearAAlerts() {
    document.querySelectorAll('.aalert').forEach(e => e.classList.add('hidden'));
}

// ════════ LOGIN ════════
function doLogin() {
    const idEl = document.getElementById('li-id');
    const pwEl = document.getElementById('li-pw');
    if (!idEl || !pwEl) return;
    const id = idEl.value.trim();
    const pw = pwEl.value;
    if (!id || !pw) return aAlert('সকল তথ্য পূরণ করুন।', 'err', 'login');
    const u = DB.findUser(id);
    if (!u) return aAlert('ব্যবহারকারী খুঁজে পাওয়া যায়নি।', 'err', 'login');
    if (u.password !== pw) return aAlert('পাসওয়ার্ড ভুল!', 'err', 'login');
    if (!u.verified) return aAlert('অ্যাকাউন্ট যাচাই হয়নি।', 'err', 'login');
    DB.setSession(u);
    const remEl = document.getElementById('li-rem');
    if (remEl && remEl.checked) localStorage.setItem('bf_remember', u.id);
    onLoginOk(u);
}

// ════════ SIGNUP ════════
function doSignup() {
    const name = document.getElementById('su-name')?.value.trim();
    const phone = document.getElementById('su-phone')?.value.replace(/\D/g, '');
    const uname = document.getElementById('su-uname')?.value.trim();
    const pw = document.getElementById('su-pw')?.value;
    const pw2 = document.getElementById('su-pw2')?.value;
    const terms = document.getElementById('su-terms')?.checked;
    const sname = document.getElementById('su-sname')?.value.trim() || '';
    const dob = document.getElementById('su-dob')?.value || '';
    const email = document.getElementById('su-email')?.value.trim() || '';
    const refVal = document.getElementById('su-ref-val')?.value || '';

    if (!name || !phone || !uname || !pw || !pw2) return aAlert('তারকা চিহ্নিত সকল তথ্য পূরণ করুন।', 'err', 'signup');
    if (pw.length < 8) return aAlert('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।', 'err', 'signup');
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return aAlert('পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে।', 'err', 'signup');
    if (pw !== pw2) return aAlert('পাসওয়ার্ড মিলছে না।', 'err', 'signup');
    if (!terms) return aAlert('শর্তাবলীতে সম্মতি দিন।', 'err', 'signup');
    if (!DB.checkUsername(uname)) return aAlert('এই ইউজারনেম নেওয়া হয়েছে।', 'err', 'signup');
    if (DB.findUser(phone)) return aAlert('এই নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে।', 'err', 'signup');
    if (phone.length < 10) return aAlert('সঠিক মোবাইল নম্বর দিন।', 'err', 'signup');

    _pendingUser = {
        id: DB.genID('USR'),
        name: name + (sname ? ' ' + sname : ''),
        surname: sname,
        dob, phone,
        email: email || null,
        username: uname,
        password: pw,
        referral: refVal || null,
        role: 'user',
        verified: false,
        profileComplete: 40,
        createdAt: new Date().toISOString(),
        memberID: null,
        avatar: null,
    };

    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(phone, otp);
    _otpPhone = phone;
    console.log('[DEMO OTP]', phone, '→', otp);

    const dispEl = document.getElementById('otp-phone-display');
    const valEl = document.getElementById('otp-val');
    if (dispEl) dispEl.textContent = phone;
    if (valEl) valEl.value = '';
    startOtpTimer();
    setPanel('otp');
    aAlert('OTP পাঠানো হয়েছে (ডেমো: কনসোলে দেখুন)', 'ok', 'otp');
}

// ════════ OTP ════════
function startOtpTimer(s) {
    s = s || 300;
    clearInterval(_otpInterval);
    let r = s;
    const el = document.getElementById('otp-timer-el');
    if (!el) return;
    _otpInterval = setInterval(function () {
        r--;
        const m = String(Math.floor(r / 60)).padStart(2, '0');
        const sec = String(r % 60).padStart(2, '0');
        el.textContent = m + ':' + sec;
        if (r <= 0) { clearInterval(_otpInterval); el.textContent = '০০:০০'; }
    }, 1000);
}

function verifyOtp() {
    const code = document.getElementById('otp-val')?.value.trim();
    if (!code) return aAlert('OTP লিখুন।', 'err', 'otp');
    if (!DB.verifyOTP(_otpPhone, code)) return aAlert('OTP ভুল অথবা মেয়াদ শেষ।', 'err', 'otp');
    _pendingUser.verified = true;
    DB.addUser(_pendingUser);
    DB.setSession(_pendingUser);
    clearInterval(_otpInterval);
    onLoginOk(_pendingUser);
}

function resendOtp() {
    if (!_otpPhone) return;
    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(_otpPhone, otp);
    console.log('[DEMO OTP RESEND]', _otpPhone, '→', otp);
    startOtpTimer();
    aAlert('OTP পুনরায় পাঠানো হয়েছে।', 'ok', 'otp');
}

// ════════ FORGOT PASSWORD ════════
function doForgot() {
    const id = document.getElementById('fg-id')?.value.trim();
    if (!id) return aAlert('নম্বর বা ইমেইল দিন।', 'err', 'forgot');
    const u = DB.findUser(id);
    if (!u) return aAlert('অ্যাকাউন্ট পাওয়া যায়নি।', 'err', 'forgot');
    aAlert('ডেমো: পাসওয়ার্ড "' + u.password + '" (বাস্তবে OTP যাবে)', 'ok', 'forgot');
}

// ════════ AFTER LOGIN ════════
function onLoginOk(u) {
    closeAuth();
    updateNavUI(u);
    showToastG('স্বাগতম ' + u.name + '! 🎉', '#065F46');
    if (u.role === 'admin') {
        setTimeout(function () { location.href = 'admin/admin.html'; }, 700);
    } else {
        if (typeof updateBadgeSection === 'function') updateBadgeSection();
    }
}

function updateNavUI(u) {
    const loginBtn = document.getElementById('nav-login-btn');
    const userMenu = document.getElementById('nav-user-menu');
    const userName = document.getElementById('nav-user-name');
    const mLogin = document.getElementById('mnav-login');
    const mUser = document.getElementById('mnav-user');

    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.style.display = '';
    if (userName) userName.textContent = u.name;
    if (mLogin) mLogin.classList.add('hidden');
    if (mUser) mUser.classList.remove('hidden');
}

function doLogout() {
    DB.clearSession();
    localStorage.removeItem('bf_remember');
    location.reload();
}

// ════════ USERNAME HELPERS ════════
function autoUname() {
    const n = document.getElementById('su-name')?.value.trim();
    if (!n) return;
    const el = document.getElementById('su-uname');
    if (el) { el.value = DB.genUsername(n); checkUname(); }
}

function checkUname() {
    const u = document.getElementById('su-uname')?.value.trim();
    const h = document.getElementById('uname-hint');
    if (!h) return;
    if (!u || u.length < 3) { h.textContent = ''; return; }
    if (DB.checkUsername(u)) { h.textContent = '✅ পাওয়া গেছে!'; h.style.color = '#059669'; }
    else { h.textContent = '❌ নেওয়া হয়েছে'; h.style.color = '#e53e3e'; }
}

// ════════ REFERRAL SEARCH ════════
function refSearch() {
    const q = document.getElementById('su-ref')?.value.trim();
    const box = document.getElementById('ref-results');
    if (!box) return;
    box.innerHTML = '';
    if (!q || q.length < 2) return;
    const res = DB.getUsers().filter(function (u) {
        return u.verified && (
            (u.name || '').includes(q) ||
            (u.phone || '').includes(q) ||
            (u.memberID || '').includes(q)
        );
    }).slice(0, 5);
    if (!res.length) { box.innerHTML = '<div class="ref-item">পাওয়া যায়নি</div>'; return; }
    res.forEach(function (u) {
        const d = document.createElement('div');
        d.className = 'ref-item';
        d.textContent = u.name + ' | ' + u.phone;
        d.onclick = function () {
            const refEl = document.getElementById('su-ref');
            const valEl = document.getElementById('su-ref-val');
            if (refEl) refEl.value = u.name;
            if (valEl) valEl.value = u.id;
            box.innerHTML = '';
        };
        box.appendChild(d);
    });
}

// ════════ TERMS MODAL ════════
function openTerms() {
    const m = document.getElementById('termsModal');
    if (m) m.classList.remove('hidden');
}
function closeTerms() {
    const m = document.getElementById('termsModal');
    if (m) m.classList.add('hidden');
}

// ════════ BADGE DETAIL MODAL (openBD) ════════
function openBD(key) {
    const modal = document.getElementById('bdModal');
    const con = document.getElementById('bd-content');
    if (!modal || !con) return;

    const users = DB.getUsers().filter(function (x) { return x.verified && x.role !== 'admin'; });
    const sv = DB.getSavings();
    const ln = DB.getLoans().filter(function (l) { return l.status === 'active'; });
    let h = '';

    if (key === 'members') {
        h = '<p class="bd-title">👥 সদস্যবৃন্দ</p><table class="bd-table"><tr><th>নাম</th><th>আইডি</th><th>মোবাইল</th><th>ভূমিকা</th></tr>' +
            (users.map(function (x) {
                return '<tr><td>' + x.name + '</td><td>' + (x.memberID || '—') + '</td><td>' + x.phone + '</td><td>' + x.role + '</td></tr>';
            }).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সদস্য নেই</td></tr>') + '</table>';
    } else if (key === 'savings') {
        h = '<p class="bd-title">💰 সঞ্চয় বিবরণ</p><table class="bd-table"><tr><th>সদস্য</th><th>মাস</th><th>পরিমাণ</th><th>তারিখ</th></tr>' +
            (sv.map(function (s) {
                const u = DB.getUsers().find(function (x) { return x.id === s.userId; });
                return '<tr><td>' + (u ? u.name : '—') + '</td><td>' + (s.month || '—') + '</td><td>৳' + (s.amount || 0).toLocaleString() + '</td><td>' + (s.date ? new Date(s.date).toLocaleDateString('bn-BD') : '—') + '</td></tr>';
            }).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সঞ্চয় নেই</td></tr>') + '</table>';
    } else if (key === 'loans') {
        h = '<p class="bd-title">🤝 করজে হাসানা</p><table class="bd-table"><tr><th>সদস্য</th><th>পরিমাণ</th><th>বাকি</th><th>মাস</th></tr>' +
            (ln.map(function (l) {
                const u = DB.getUsers().find(function (x) { return x.id === l.userId; });
                return '<tr><td>' + (u ? u.name : '—') + '</td><td>৳' + (l.amount || 0).toLocaleString() + '</td><td>৳' + (l.remaining || l.amount || 0).toLocaleString() + '</td><td>' + (l.months || 3) + '</td></tr>';
            }).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সক্রিয় করজ নেই</td></tr>') + '</table>';
    } else if (key === 'services') {
        const services = [
            { i: '🤝', n: 'করজে হাসানা', d: 'বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা' },
            { i: '💰', n: 'সঞ্চয় ও বিনিয়োগ', d: 'মাসিক ২,০০০ টাকা সঞ্চয়' },
            { i: '🕌', n: 'সুদমুক্ত অর্থনীতি', d: 'শরিয়াহসম্মত সকল লেনদেন' },
            { i: '📊', n: 'মোট সম্পদ', d: 'সঞ্চয়: ৳' + sv.reduce(function (a, s) { return a + (s.amount || 0); }, 0).toLocaleString('bn') },
        ];
        h = '<p class="bd-title">🌟 আমাদের সেবাসমূহ</p><div class="svc-grid">' +
            services.map(function (s) {
                return '<div class="svc-card"><div style="font-size:1.5rem">' + s.i + '</div><div class="svc-name">' + s.n + '</div><div class="svc-desc">' + s.d + '</div></div>';
            }).join('') + '</div>';
    }

    con.innerHTML = h;
    modal.classList.remove('hidden');
}

function closeBD() {
    const m = document.getElementById('bdModal');
    if (m) m.classList.add('hidden');
}

// openBadgeDetail maps to openBD
function openBadgeDetail(key) { openBD(key); }
function closeBadgeDetail() {
    closeBD();
    const m = document.getElementById('badgeDetailModal');
    if (m) m.classList.add('hidden');
}

// ════════ QUICK FORMS ════════
function quickSubmit(type) {
    const al = document.getElementById('alert-' + type);
    if (!al) return;
    al.className = 'alert';
    al.style.display = 'none';
    let ok = true;

    if (type === 'member') {
        if (!document.getElementById('m-name')?.value || !document.getElementById('m-phone')?.value) ok = false;
    } else if (type === 'product') {
        if (!document.getElementById('p-product')?.value || !document.getElementById('p-price')?.value) ok = false;
    } else if (type === 'qard') {
        const a = parseFloat(document.getElementById('q-amount')?.value || '0');
        if (!document.getElementById('q-name')?.value || !a || a > 15000) {
            al.className = 'alert alert-error';
            al.textContent = 'সর্বোচ্চ ১৫,০০০ টাকা।';
            al.style.display = 'block';
            return;
        }
    }

    if (!ok) {
        al.className = 'alert alert-error';
        al.textContent = 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।';
        al.style.display = 'block';
        return;
    }

    al.className = 'alert alert-success';
    const msgs = {
        member: 'আবেদন জমা হয়েছে! কমিটি শীঘ্রই যোগাযোগ করবেন।',
        product: 'পণ্য রিকোয়েস্ট জমা হয়েছে!',
        qard: 'করজে হাসানা আবেদন জমা হয়েছে!'
    };
    al.textContent = msgs[type] || 'জমা হয়েছে!';
    al.style.display = 'block';
    showToastG('✓ আবেদন জমা হয়েছে!');
}

function pCalc() {
    const p = parseFloat(document.getElementById('p-price')?.value) || 0;
    const box = document.getElementById('p-calc-box');
    if (!box) return;
    if (p > 0) {
        const t = p * 1.1, m = t / 6;
        box.style.display = 'block';
        const pvT = document.getElementById('pv-t');
        const pvD = document.getElementById('pv-d');
        const pvM = document.getElementById('pv-m');
        if (pvT) pvT.textContent = '৳' + Math.round(t).toLocaleString('bn');
        if (pvD) pvD.textContent = '৳' + Math.round(m).toLocaleString('bn');
        if (pvM) pvM.textContent = '৳' + Math.round(m).toLocaleString('bn') + ' × ৫';
    } else {
        box.style.display = 'none';
    }
}

// ════════ GLOBAL TOAST ════════
function showToastG(msg, color) {
    color = color || '#065F46';
    const ex = document.querySelector('.g-toast');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'g-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' + color + ';color:#fff;padding:12px 20px;border-radius:10px;font-family:\'Noto Serif Bengali\',serif;font-size:14px;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.25);animation:slideUpG .3s ease;max-width:300px;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
        t.style.opacity = '0';
        t.style.transition = 'opacity .4s';
        setTimeout(function () { t.remove(); }, 400);
    }, 3500);
}

// Ensure slideUpG animation exists
if (!document.querySelector('style[data-su]')) {
    const s = document.createElement('style');
    s.dataset.su = '1';
    s.textContent = '@keyframes slideUpG{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(s);
}

// ════════ SESSION RESTORE ON LOAD ════════
document.addEventListener('DOMContentLoaded', function () {
    const ses = DB.getSession();
    if (ses && ses.verified) {
        updateNavUI(ses);
        if (typeof updateBadgeSection === 'function') updateBadgeSection();
    } else {
        const rid = localStorage.getItem('bf_remember');
        if (rid) {
            const u = DB.getUsers().find(function (x) { return x.id === rid; });
            if (u) { DB.setSession(u); updateNavUI(u); }
        }
    }
});