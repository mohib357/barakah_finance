// C: \Project\Barakah_Finance\js\main.js

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

// Render members
const grid = document.getElementById('membersGrid');
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

// Calculator
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

function updateProductCalc() {
    const price = parseFloat(document.getElementById('p-price').value) || 0;
    if (price > 0) {
        const total = price * 1.10;
        const monthly = total / 6;
        document.getElementById('p-calc-preview').style.display = 'block';
        document.getElementById('pv-total').textContent = '৳' + Math.round(total).toLocaleString('bn');
        document.getElementById('pv-down').textContent = '৳' + Math.round(monthly).toLocaleString('bn');
        document.getElementById('pv-monthly').textContent = '৳' + Math.round(monthly).toLocaleString('bn') + ' × ৫';
    } else {
        document.getElementById('p-calc-preview').style.display = 'none';
    }
}

// Form submit
function submitForm(type) {
    const alertIds = { member: 'alert-member', product: 'alert-product', qard: 'alert-qard' };
    const al = document.getElementById(alertIds[type]);
    al.className = 'alert'; al.style.display = 'none';

    let valid = true;
    if (type === 'member') {
        if (!document.getElementById('m-name').value || !document.getElementById('m-phone').value || !document.getElementById('m-nid').value) valid = false;
    } else if (type === 'product') {
        if (!document.getElementById('p-name').value || !document.getElementById('p-product').value || !document.getElementById('p-price').value) valid = false;
    } else if (type === 'qard') {
        const amt = parseFloat(document.getElementById('q-amount').value);
        if (!document.getElementById('q-name').value || !amt || amt > 15000) {
            valid = false;
            al.className = 'alert alert-error';
            al.textContent = 'সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত আবেদন করা যাবে।';
            al.style.display = 'block'; return;
        }
    }

    if (!valid) {
        al.className = 'alert alert-error';
        al.textContent = 'অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন।';
        al.style.display = 'block'; return;
    }

    al.className = 'alert alert-success';
    const msgs = { member: 'সদস্যপদ আবেদন সফলভাবে জমা হয়েছে! কমিটি শীঘ্রই যোগাযোগ করবেন।', product: 'পণ্য রিকোয়েস্ট জমা হয়েছে! অনুমোদন পেলে SMS পাবেন।', qard: 'করজে হাসানা আবেদন জমা হয়েছে! কমিটির সিদ্ধান্ত শীঘ্রই জানানো হবে।' };
    al.textContent = msgs[type];
    al.style.display = 'block';
    showToast('✓ আবেদন সফলভাবে জমা হয়েছে!');
}

// Login modal
let currentRole = '';
function openLoginModal(role) {
    currentRole = role || '';
    const titles = { admin: 'অ্যাডমিন লগইন', member: 'সদস্য লগইন', customer: 'গ্রাহক লগইন' };
    document.getElementById('modalTitle').textContent = titles[role] || 'লগইন করুন';
    document.getElementById('loginModal').classList.add('open');
}

function closeModal() {
    document.getElementById('loginModal').classList.remove('open');
}

function doLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const al = document.getElementById('alert-login');
    if (!user || !pass) {
        al.className = 'alert alert-error'; al.style.display = 'block';
        al.textContent = 'অনুগ্রহ করে মোবাইল নম্বর ও পাসওয়ার্ড দিন।'; return;
    }
    al.className = 'alert alert-success'; al.style.display = 'block';
    al.textContent = 'লগইন সফল! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...';
    setTimeout(() => closeModal(), 1500);
}

// Nav scroll
function scrollTo(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Hamburger
function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

// Toast
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Close modal on overlay click
document.getElementById('loginModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));