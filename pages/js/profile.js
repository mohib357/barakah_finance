// C: \Project\Barakah_Finance\pages\js\profile.js

// localStorage থেকে DB helpers
const DB = {
    get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    getUsers: () => JSON.parse(localStorage.getItem('bf_users') || '[]'),
    saveUsers: u => localStorage.setItem('bf_users', JSON.stringify(u)),
    getSession: () => { try { return JSON.parse(localStorage.getItem('bf_session')); } catch { return null; } },
    setSession: u => localStorage.setItem('bf_session', JSON.stringify(u)),
    clearSession: () => localStorage.removeItem('bf_session'),
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = DB.getSession();
    if (!currentUser || !currentUser.verified) {
        alert('দয়া করে প্রথমে লগইন করুন।');
        window.location.href = '../index.html';
        return;
    }
    loadProfile();
});

function calcPct(u) {
    const fields = [u.name, u.phone, u.email, u.dob, u.job, u.address, u.nid, u.username];
    return Math.round((fields.filter(f => f && f.length > 0).length / fields.length) * 100);
}

function loadProfile() {
    const u = currentUser;
    document.getElementById('prof-avatar').textContent = (u.name || 'ব')[0];
    document.getElementById('prof-name').textContent = u.name || '—';
    document.getElementById('prof-id').textContent = u.memberID ? 'সদস্য আইডি: ' + u.memberID : 'ID: ' + u.id.slice(0, 12);

    const roleMap = { admin: 'অ্যাডমিন', member: 'সদস্য', user: 'ব্যবহারকারী', customer: 'গ্রাহক' };
    const roleClass = { admin: 'badge-admin', member: 'badge-member', user: 'badge-user', customer: 'badge-user' };
    const rb = document.getElementById('prof-role-badge');
    rb.textContent = roleMap[u.role] || u.role;
    rb.className = 'badge ' + (roleClass[u.role] || 'badge-user');

    const pct = calcPct(u);
    document.getElementById('prof-pct').textContent = pct + '%';
    document.getElementById('prof-progress').style.width = pct + '%';

    // ফর্ম ফিল
    const map = { 'pf-name': u.name, 'pf-uname': u.username, 'pf-phone': u.phone, 'pf-email': u.email, 'pf-dob': u.dob, 'pf-job': u.job, 'pf-address': u.address, 'pf-nid': u.nid };
    Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val || ''; });

    if (u.referral) {
        const ref = DB.getUsers().find(x => x.id === u.referral);
        document.getElementById('pf-referral').value = ref ? ref.name : u.referral;
    } else {
        document.getElementById('pf-referral').value = 'নেই';
    }
}

function saveProfile() {
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx < 0) { toast('ব্যবহারকারী পাওয়া যায়নি।', '#e53e3e'); return; }
    const newPass = document.getElementById('pf-pass').value;
    if (newPass) {
        if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            toast('পাসওয়ার্ড ৮+ অক্ষর এবং সংখ্যা ও লেটার থাকতে হবে।', '#e53e3e'); return;
        }
        users[idx].password = newPass;
    }
    users[idx].name = document.getElementById('pf-name').value.trim() || users[idx].name;
    users[idx].email = document.getElementById('pf-email').value.trim() || users[idx].email;
    users[idx].dob = document.getElementById('pf-dob').value;
    users[idx].job = document.getElementById('pf-job').value.trim();
    users[idx].address = document.getElementById('pf-address').value.trim();
    users[idx].nid = document.getElementById('pf-nid').value.trim();
    users[idx].profileComplete = calcPct(users[idx]);
    DB.saveUsers(users);
    currentUser = users[idx];
    DB.setSession(currentUser);
    loadProfile();
    toast('প্রোফাইল সংরক্ষিত হয়েছে ✅');
    document.getElementById('pf-pass').value = '';
}

function doLogout() {
    DB.clearSession();
    localStorage.removeItem('bf_remember');
    window.location.href = '../index.html';
}

function toast(msg, color = '#065F46') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.background = color; t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3500);
}