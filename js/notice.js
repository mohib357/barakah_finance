// C:\Project\Barakah_Finance\js\notice.js
// ════════ Notice Bar & Badge Section ════════

// Default notices shown when no server data available
const DEFAULT_NOTICES = [
    { id: 'n1', text: '🌙 বারাকাহ ফাইন্যান্সে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।', color: '#fff', active: true, style: 'bold' },
    { id: 'n2', text: '📢 মাসিক সঞ্চয়ের শেষ তারিখ প্রতি মাসের ১৫ তারিখ।', color: '#F0D78A', active: true, style: 'normal' },
    { id: 'n3', text: '🤝 করজে হাসানা — বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা। যোগ্য সদস্যরা আবেদন করুন।', color: '#a7f3d0', active: true, style: 'normal' },
    { id: 'n4', text: '📦 কিস্তিতে পণ্য কিনুন — মাত্র ১০% লাভে ৬ মাসে পরিশোধ।', color: '#fde68a', active: true, style: 'normal' },
];

// ════════ NOTICE BAR ════════
function initNoticeBar() {
    _loadNoticesFromServer().then(renderNoticeBar);
}

async function _loadNoticesFromServer() {
    try {
        const res = await fetch('http://localhost:3001/api/notices', {
            signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) return;
        }
    } catch (e) { /* server offline — use defaults */ }
}

function renderNoticeBar() {
    let notices = [];

    // Try DB first
    try {
        if (typeof DB !== 'undefined' && DB.getNotices) {
            notices = DB.getNotices().filter(n => n.active);
        }
    } catch (e) {}

    // Fallback to defaults
    if (!notices || !notices.length) {
        notices = DEFAULT_NOTICES;
    }

    const track = document.getElementById('notice-track') || document.querySelector('.notice-track');
    if (!track) return;

    const styleMap = {
        bold:   'font-weight:700;',
        italic: 'font-style:italic;',
        normal: '',
    };

    const items = notices.map(n => {
        const style = styleMap[n.style || 'normal'] || '';
        const color = n.color || '#fff';
        return `<span style="color:${color};${style}">${n.text}</span>`;
    }).join('');

    // Duplicate for seamless loop
    track.innerHTML = items + items;

    // Calc animation speed based on content length
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const speed = settings.noticeSpeed || 40; // px per second
    // Let CSS animation handle it; set duration dynamically
    const totalWidth = track.scrollWidth / 2;
    const duration = Math.max(15, totalWidth / speed);
    track.style.animation = `noticeScroll ${duration}s linear infinite`;

    // Pause on hover
    track.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    track.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
}

// ════════ BADGE SECTION ════════
function updateBadgeSection() {
    const badges = _getActiveBadges();
    const container = document.getElementById('badges-container');
    if (!container) return;

    const stats = _getBadgeStats();

    if (!badges.length) {
        container.innerHTML = '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:40px;font-size:14px;">তথ্য লোড হচ্ছে...</div>';
        return;
    }

    container.innerHTML = badges.map(b => {
        const { value, sub } = _getBadgeValue(b, stats);
        const clickable = b.clickable !== false;
        return `
        <div class="badge-card${clickable ? ' clickable' : ''}"
             role="${clickable ? 'button' : 'presentation'}"
             tabindex="${clickable ? '0' : '-1'}"
             ${clickable ? `onclick="openBadgeDetail('${b.key}')" onkeydown="if(event.key==='Enter')openBadgeDetail('${b.key}')"` : ''}
             aria-label="${b.label}">
            <div class="badge-icon">${b.icon || '📊'}</div>
            <div class="badge-info">
                <div class="badge-value">${value}</div>
                <div class="badge-label">${b.label}</div>
                <div class="badge-sub">${sub}</div>
            </div>
        </div>`;
    }).join('');
}

function _getActiveBadges() {
    let badges = [];
    try {
        if (typeof DB !== 'undefined' && DB.getBadges) {
            badges = DB.getBadges().filter(b => b.show !== false);
        }
    } catch (e) {}

    if (!badges.length) {
        badges = [
            { key: 'members',  icon: '👥', label: 'সদস্য',          show: true, clickable: true },
            { key: 'savings',  icon: '💰', label: 'মোট সঞ্চয়',       show: true, clickable: true },
            { key: 'loans',    icon: '🤝', label: 'করজে হাসানা',     show: true, clickable: true },
            { key: 'services', icon: '🌟', label: 'আমাদের সেবা',     show: true, clickable: true },
        ];
    }
    return badges;
}

function _getBadgeStats() {
    let members = 0, savingsTotal = 0, loansTotal = 0, loansCount = 0;
    try {
        if (typeof DB !== 'undefined') {
            const users = DB.getUsers ? DB.getUsers() : [];
            const savings = DB.getSavings ? DB.getSavings() : [];
            const loans = DB.getLoans ? DB.getLoans() : [];
            members = users.filter(u => u.verified && u.role !== 'admin').length;
            savingsTotal = savings.reduce((a, s) => a + (s.amount || 0), 0);
            const activeLoans = loans.filter(l => l.status === 'active');
            loansTotal = activeLoans.reduce((a, l) => a + (l.amount || 0), 0);
            loansCount = activeLoans.length;
        }
    } catch (e) {}
    return { members, savingsTotal, loansTotal, loansCount };
}

function _getBadgeValue(badge, stats) {
    const bn = (n) => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    switch (badge.key) {
        case 'members':
            return { value: bn(stats.members || '৩০+'), sub: 'সক্রিয় সদস্য' };
        case 'savings':
            return { value: '৳' + bn((stats.savingsTotal || 0).toLocaleString()), sub: 'মোট সঞ্চয়' };
        case 'loans':
            return { value: '৳' + bn((stats.loansTotal || 0).toLocaleString()), sub: bn(stats.loansCount) + ' টি চলমান করজ' };
        case 'services':
            return { value: '৪', sub: 'ধরনের হালাল সেবা' };
        default:
            return { value: badge.defaultValue || '—', sub: badge.sub || badge.label };
    }
}

// ════════ TOAST ════════
function showToastGlobal(msg, color) {
    color = color || '#065F46';
    // Use showToastG from auth.js if available
    if (typeof showToastG === 'function') { showToastG(msg, color); return; }
    const ex = document.querySelector('.g-toast');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'g-toast';
    t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${color};color:#fff;padding:13px 22px;border-radius:10px;font-family:'Noto Serif Bengali',serif;font-size:.9rem;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.25);animation:slideUpG .3s ease;max-width:320px;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0'; t.style.transition = 'opacity .4s';
        setTimeout(() => t.remove(), 400);
    }, 3500);
}

// ════════ INIT ════════
document.addEventListener('DOMContentLoaded', function () {
    initNoticeBar();
    // Badge section update (with small delay to ensure DB is ready)
    setTimeout(updateBadgeSection, 150);
});
