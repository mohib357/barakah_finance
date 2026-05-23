// C:\Project\Barakah_Finance\js\main.js

const members = [
    { name: 'জনাব সাইফুল্লাহ', phone: '০১৭৩৭১৩১০৯৫', role: 'সভাপতি' },
    { name: 'মাওলানা ইমরান হোসাইন কাসেমী', phone: '০১৩১৭১২১৮২৬', role: 'সহ-সভাপতি' },
    { name: 'জনাব মুহিব্বুল্লাহ আজাদ', phone: '০১৭১৭২৬৭০০৫', role: 'সাধারণ সম্পাদক' },
    { name: 'জনাব মাসুম বিল্লাহ', phone: '০১৭৫০৮২৭৭৬০', role: 'যুগ্ম সম্পাদক' },
    { name: 'জনাব আনোয়ার হোসেন সেলিম', phone: '০১৬৪৮২৪৮০০৬', role: 'কোষাধ্যক্ষ' },
    { name: 'জনাব আবু সুফিয়ান', phone: '০১৭৪৩০৬৮০৬৩', role: 'সহকারী কোষাধ্যক্ষ' },
    { name: 'মাওলানা রাকিবুল ইসলাম', phone: '০১৯১৯২৭২৫৯৬', role: 'অপারেশন ম্যানেজার' },
    { name: 'হাফেজ সাইফুল ইসলাম', phone: '০১৭৯৮৯৭১০৫২', role: 'অপারেশন ম্যানেজার' },
    { name: 'জনাব আমিনুল ইসলাম', phone: '০১৭৭৩২৫৫৪৩৫', role: 'অপারেশন ম্যানেজার' },
    { name: 'মাওলানা আব্দুল হান্নান', phone: '০১৩০৮৭৫৭৬৯২', role: 'শরিয়াহ পরামর্শক' },
    { name: 'জনাব শেখ তামজিদ আহমাদ-১', phone: '০১৩৩৮৩১৬৭১১', role: 'আইটি ও মিডিয়া' },
    { name: 'জনাব শেখ তামজিদ আহমাদ-২', phone: '০১৩৩৮৩১৬৭১১', role: 'সদস্য সমন্বয়ক' },
    { name: 'হা. মাহমুদুল হাসান', phone: '০১৩১১৮৫৬৩০৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'হা. মুশফিকুর রহমান নাঈম', phone: '০১৩১০১১৩১০৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'ক্বারী এমদাদুল্লাহ', phone: '০১৭৮৪৮৭০০৩৮', role: 'সদস্য সমন্বয়ক' },
    { name: 'জনাব মিজানুর রহমান', phone: '০১৮১৬৩৩৮৮৯০', role: 'সদস্য সমন্বয়ক' },
    { name: 'জনাব শাহ আলম', phone: '০১৭১৬২২৫৯২৫', role: 'সদস্য সমন্বয়ক' },
    { name: 'মাওলানা আবু রায়হান মাহফুজ', phone: '০১৭০৩২১১৫৮৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'মাওলানা আব্দুস সামাদ কাসেমী-১', phone: '০১৭২৩৭৯১৮৭৬', role: 'সদস্য সমন্বয়ক' },
    { name: 'মাওলানা আব্দুস সামাদ কাসেমী-২', phone: '০১৭২৩৭৯১৮৭৬', role: 'সদস্য সমন্বয়ক' },
];

const colors = ['#1D9E75', '#639922', '#BA7517', '#185FA5', '#3B6D11', '#0F6E56', '#854F0B', '#3C3489', '#993C1D', '#972B56'];

function getInitials(name) {
    const parts = name.replace(/জনাব|মাওলানা|হাফেজ|মাও\.|হা\.|ক্বারী/g, '').trim().split(' ');
    return parts.filter(p => p).slice(0, 1).map(p => p[0]).join('') || 'ব';
}

// ── Members Grid ──
const grid = document.getElementById('membersGrid');
if (grid) {
    members.forEach((m, i) => {
        const color = colors[i % colors.length];
        grid.innerHTML += `
        <div class="member-card reveal">
          <div class="member-avatar" style="background:${color}">${getInitials(m.name)}</div>
          <h4>${m.name}</h4>
          <span class="role">${m.role}</span>
          <div class="phone">${m.phone}</div>
        </div>`;
    });
}

// ── Calculator ──
function calculate() {
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const travel = parseFloat(document.getElementById('travelCost').value) || 0;
    if (price <= 0) { document.getElementById('calcResult').style.display = 'none'; return; }
    const cost = price + travel;
    const profit = cost * 0.10;
    const total = cost + profit;
    const perInstall = total / 6;
    document.getElementById('calcResult').style.display = 'block';
    document.getElementById('totalPrice').textContent = '৳' + Math.round(total).toLocaleString('bn');
    document.getElementById('downPayment').textContent = '৳' + Math.round(perInstall).toLocaleString('bn');
    document.getElementById('monthlyInstall').textContent = '৳' + Math.round(perInstall).toLocaleString('bn');
    document.getElementById('profit').textContent = '৳' + Math.round(profit).toLocaleString('bn');
}

// ── Quick Form Tabs (Home page apply section) ──
function switchTab(btn, id) {
    document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(id).classList.add('active');
}

// ── Nav scroll ──
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

// ── Dark mode ──
function toggleDark() {
    document.body.classList.toggle('dark-mode');
    const tog = document.getElementById('dkTog');
    if (tog) tog.classList.toggle('on');
    localStorage.setItem('bf_dark', document.body.classList.contains('dark-mode') ? '1' : '0');
}

// Apply saved dark mode
(function () {
    if (localStorage.getItem('bf_dark') === '1') {
        document.body.classList.add('dark-mode');
        const tog = document.getElementById('dkTog');
        if (tog) tog.classList.add('on');
    }
})();

// ── Product calc (home page) ──
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

// ── Quick submit (home page forms) ──
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
    showToastG('✓ আবেদন সফলভাবে জমা হয়েছে!');
}

// ── Toast ──
function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
}

// ── Reveal animation ──
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));