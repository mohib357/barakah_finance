// C: \Project\Barakah_Finance\js\notice.js

// ════════ Notice Bar & Badge Section ════════
function initNoticeBar() {
    renderNoticeBar();
}

function renderNoticeBar() {
    const notices = DB.getNotices().filter(n => n.active);
    const track = document.getElementById('notice-track');
    if (!track || !notices.length) return;

    const speed = DB.getSettings().noticeSpeed || 30; // px/s
    const items = notices.map(n => {
        const styles = {
            bold: 'font-weight:700;',
            italic: 'font-style:italic;',
            normal: '',
        };
        return `<span style="color:${n.color || '#fff'};${styles[n.style || 'normal']}margin-right:80px;">
      ${n.text}
    </span>`;
    }).join('');
    track.innerHTML = items + items;
    const totalWidth = track.scrollWidth / 2;
    const duration = totalWidth / speed;
    track.style.animation = `noticeScroll ${duration}s linear infinite`;
}

// ════════ BADGE SECTION ════════
function updateBadgeSection() {
    const badges = DB.getBadges().filter(b => b.show);
    const users = DB.getUsers();
    const savings = DB.getSavings();
    const loans = DB.getLoans();
    const stats = {
        members: users.filter(u => u.verified && u.role !== 'admin').length,
        savingsTotal: savings.reduce((a, s) => a + (s.amount || 0), 0),
        loansTotal: loans.filter(l => l.status === 'active').reduce((a, l) => a + (l.amount || 0), 0),
        loansCount: loans.filter(l => l.status === 'active').length,
    };

    const container = document.getElementById('badges-container');
    if (!container) return;

    container.innerHTML = badges.map(b => {
        let value = '';
        let sub = '';
        switch (b.key) {
            case 'members':
                value = toBengaliNum(stats.members);
                sub = 'সক্রিয় সদস্য';
                break;
            case 'savings':
                value = '৳' + toBengaliNum(stats.savingsTotal.toLocaleString());
                sub = 'মোট সঞ্চয়';
                break;
            case 'loans':
                value = '৳' + toBengaliNum(stats.loansTotal.toLocaleString());
                sub = toBengaliNum(stats.loansCount) + ' টি চলমান করজ';
                break;
            case 'services':
                value = '৪';
                sub = 'ধরনের হালাল সেবা';
                break;
            default:
                value = '—';
                sub = b.label;
        }

        return `
            <div class="badge-card ${b.clickable ? 'clickable' : ''}"
                 onclick="${b.clickable ? `openBadgeDetail('${b.key}')` : ''}">
                <div class="badge-icon">${b.icon}</div>
                <div class="badge-info">
                    <div class="badge-value">${value}</div>
                    <div class="badge-label">${b.label}</div>
                    <div class="badge-sub">${sub}</div>
                </div>
            </div>`;
    }).join('');
}

// ════════ BADGE DETAIL MODAL ════════
function openBadgeDetail(key) {
    const modal = document.getElementById('badgeDetailModal');
    const content = document.getElementById('badgeDetailContent');
    if (!modal || !content) return;

    const users = DB.getUsers().filter(u => u.verified && u.role !== 'admin');
    const savings = DB.getSavings();
    const loans = DB.getLoans().filter(l => l.status === 'active');

    let html = '';
    switch (key) {
        case 'members':
            html = `<h3 class="bd-title">👥 সদস্যবৃন্দ</h3>
        <table class="bd-table">
          <tr><th>নাম</th><th>আইডি</th><th>মোবাইল</th><th>ভূমিকা</th></tr>
          ${users.map(u => `<tr>
            <td><a href="#" onclick="viewMemberProfile('${u.id}')" class="bd-link">${u.name}</a></td>
            <td>${u.memberID || '—'}</td><td>${u.phone}</td><td>${u.role}</td>
          </tr>`).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সদস্য নেই</td></tr>'}
        </table>`;
            break;

        case 'savings':
            html = `<h3 class="bd-title">💰 সঞ্চয় বিবরণ</h3>
        <table class="bd-table">
          <tr><th>সদস্য</th><th>মাস</th><th>পরিমাণ</th><th>তারিখ</th></tr>
          ${savings.map(s => `<tr>
            <td>${getUserName(s.userId)}</td><td>${s.month || '—'}</td>
            <td>৳${(s.amount || 0).toLocaleString('bn')}</td><td>${formatDate(s.date)}</td>
          </tr>`).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সঞ্চয় নেই</td></tr>'}
        </table>`;
            break;

        case 'loans':
            html = `<h3 class="bd-title">🤝 করজে হাসানা বিবরণ</h3>
        <table class="bd-table">
          <tr><th>সদস্য</th><th>পরিমাণ</th><th>বাকি</th><th>মাস</th></tr>
          ${loans.map(l => `<tr>
            <td>${getUserName(l.userId)}</td>
            <td>৳${(l.amount || 0).toLocaleString('bn')}</td>
            <td>৳${(l.remaining || l.amount || 0).toLocaleString('bn')}</td>
            <td>${l.months || 3} মাস</td>
          </tr>`).join('') || '<tr><td colspan="4" class="bd-empty">কোনো সক্রিয় করজ নেই</td></tr>'}
        </table>`;
            break;

        case 'services':
            html = `<h3 class="bd-title">🌟 আমাদের সেবাসমূহ</h3>
        <div class="services-grid">
          ${[
                    { icon: '🤝', name: 'করজে হাসানা', desc: 'বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা আপদকালীন ঋণ', link: '#apply' },
                    { icon: '💰', name: 'সঞ্চয় ও বিনিয়োগ', desc: 'মাসিক ২,০০০ টাকা সঞ্চয়, হালাল বিনিয়োগে মুনাফা', link: '#calculator' },
                    { icon: '🕌', name: 'সুদমুক্ত অর্থনীতি', desc: 'শরিয়াহসম্মত সকল লেনদেন ও আর্থিক সেবা', link: '#about' },
                    { icon: '📊', name: 'মোট সম্পদ', desc: `মোট সঞ্চয়: ৳${DB.getSavings().reduce((a, s) => a + (s.amount || 0), 0).toLocaleString('bn')}`, link: '#' },
                ].map(s => `<div class="svc-card" onclick="window.location.href='${s.link}'; closeBadgeDetail();">
            <div class="svc-icon">${s.icon}</div>
            <div class="svc-name">${s.name}</div>
            <div class="svc-desc">${s.desc}</div>
          </div>`).join('')}
        </div>`;
            break;
    }

    content.innerHTML = html;
    modal.classList.remove('hidden');
}

function closeBadgeDetail() {
    document.getElementById('badgeDetailModal')?.classList.add('hidden');
}

// ════════ HELPERS ════════
function getUserName(id) {
    const u = DB.getUsers().find(x => x.id === id);
    return u ? u.name : '—';
}
function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('bn-BD');
}
function toBengaliNum(num) {
    return String(num).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

// ════════ TOAST NOTIFICATION ════════
function showToastGlobal(msg, color = '#065F46') {
    const ex = document.querySelector('.g-toast');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'g-toast';
    t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${color};color:#fff;padding:14px 22px;border-radius:10px;font-family:'Noto Serif Bengali',serif;font-size:0.9rem;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,0.25);animation:slideUp 0.3s ease;max-width:320px;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    initNoticeBar();
    updateBadgeSection();
});