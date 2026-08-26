// C:\Project\barakah_finance\js\lang.js
// ═══════════════════════════════════════════════════════════════
//  BARAKAH FINANCE — BILINGUAL i18n ENGINE
//  Website.txt requirement: Full Bangla ↔ English support
//  Architecture supports future Urdu/Arabic addition
//  Usage: data-i18n="key" on any element
//         data-i18n-placeholder="key" on inputs
//         data-i18n-title="key" on elements with title attr
// ═══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // TRANSLATION STRINGS
    // ─────────────────────────────────────────────
    const TRANSLATIONS = {

        // ── Bengali (default) ──
        bn: {
            // NAV
            'nav.about':        'আমাদের সম্পর্কে',
            'nav.calculator':   'ক্যালকুলেটর',
            'nav.timeline':     'টাইমলাইন',
            'nav.gallery':      'গ্যালারি',
            'nav.apply':        'আবেদন ফরম',
            'nav.account':      'অ্যাকাউন্ট',
            'nav.login':        'লগইন করুন',
            'nav.signup':       'নিবন্ধন করুন',
            'nav.profile':      'প্রোফাইল',
            'nav.dashboard':    'ড্যাশবোর্ড',
            'nav.logout':       'লগআউট',
            'nav.admin':        'অ্যাডমিন প্যানেল',
            'nav.lang':         'ভাষা',
            'nav.notices':      'নোটিশ',
            // HERO
            'hero.badge':       '🕌 শরিয়াহসম্মত আর্থিক প্রতিষ্ঠান',
            'hero.title':       'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার',
            'hero.subtitle':    'ইসলামী অর্থনীতির আলোকে সমাজ থেকে সুদের অভিশাপ দূর করে হালাল উপায়ে আর্থিক সহায়তা ও সমৃদ্ধি নিশ্চিত করা আমাদের অঙ্গীকার।',
            'hero.btn.member':  '📝 সদস্য হতে আবেদন করুন',
            'hero.btn.shop':    '🛒 কেনাকাটা করুন',
            'hero.btn.learn':   '📚 আরও জানুন',
            // ABOUT SECTION
            'about.eyebrow':    'আমাদের লক্ষ্য ও উদ্দেশ্য',
            'about.title':      'কেন বারাকাহ ফাইন্যান্স?',
            'about.subtitle':   'শরিয়াহ মোতাবেক পরিচালিত এই প্রতিষ্ঠান আপনার আর্থিক প্রয়োজন পূরণ করবে সম্পূর্ণ হালাল পথে।',
            'feature.shariah':  'সুদমুক্ত অর্থনীতি',
            'feature.shariah.desc': 'শরিয়াহসম্মত ও হালাল উপায়ে সকল আর্থিক লেনদেন নিশ্চিত করা।',
            'feature.qard':     'করজে হাসানা',
            'feature.qard.desc': 'আপদকালীন প্রয়োজনে বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা পর্যন্ত করজে হাসানা।',
            'feature.installment': 'সহজ কিস্তি সুবিধা',
            'feature.installment.desc': 'মাত্র ১০% লাভে ৬ কিস্তিতে যেকোনো পণ্য ক্রয়ের সুবিধা।',
            'feature.savings':  'সঞ্চয় ও বিনিয়োগ',
            'feature.savings.desc': 'মাসিক মাত্র ২,০০০ টাকা সঞ্চয়ে হালাল বিনিয়োগের সুযোগ।',
            'feature.security': 'স্বচ্ছতা ও নিরাপত্তা',
            // CALCULATOR
            'calc.title':       'কিস্তি ক্যালকুলেটর',
            'calc.subtitle':    'পণ্যের মূল্য দিন, কিস্তির পরিমাণ হিসাব করুন',
            'calc.mode1':       'পদ্ধতি ১: সম্পূর্ণ মূল্য ভিত্তিক',
            'calc.mode2':       'পদ্ধতি ২: অর্থায়িত মূল্য ভিত্তিক (শরিয়াহ)',
            'calc.price':       'পণ্যের ক্রয়মূল্য (৳)',
            'calc.downpayment': 'ডাউনপেমেন্ট (৳)',
            'calc.profit':      'লাভের হার (%)',
            'calc.months':      'কিস্তির সংখ্যা',
            'calc.btn':         '📊 হিসাব করুন',
            'calc.total':       'মোট মূল্য',
            'calc.per_install': 'প্রতি কিস্তি',
            'calc.financed':    'অর্থায়িত পরিমাণ',
            'calc.profit_amt':  'লাভের পরিমাণ',
            'calc.remaining':   'বাকি পরিমাণ',
            // AUTH
            'auth.login.title':  'লগইন করুন',
            'auth.signup.title': 'নিবন্ধন করুন',
            'auth.otp.title':    'OTP যাচাই',
            'auth.forgot.title': 'পাসওয়ার্ড পুনরুদ্ধার',
            'auth.id.label':     'মোবাইল / ইমেইল / ইউজারনেম',
            'auth.id.ph':        '01XXXXXXXXX বা username',
            'auth.pw.label':     'পাসওয়ার্ড',
            'auth.pw.ph':        '••••••••',
            'auth.remember':     'মনে রাখুন',
            'auth.forgot':       'পাসওয়ার্ড ভুলে গেছেন?',
            'auth.btn.login':    '🔑 লগইন করুন',
            'auth.btn.signup':   '📩 OTP পাঠান ও নিবন্ধন করুন',
            'auth.btn.verify':   '✅ যাচাই করুন ও অ্যাকাউন্ট খুলুন',
            'auth.btn.recover':  '🔑 পাসওয়ার্ড পুনরুদ্ধার',
            'auth.name.label':   'নাম',
            'auth.name.ph':      'প্রথম নাম',
            'auth.sname.label':  'উপনাম',
            'auth.sname.ph':     'শেষ নাম (ঐচ্ছিক)',
            'auth.dob.label':    'জন্ম তারিখ (NID অনুযায়ী)',
            'auth.uname.label':  'ইউজারনেম',
            'auth.uname.ph':     'username',
            'auth.phone.label':  'মোবাইল নম্বর',
            'auth.phone.ph':     '01XXXXXXXXX',
            'auth.email.label':  'ইমেইল (ঐচ্ছিক)',
            'auth.email.ph':     'email@example.com',
            'auth.ref.label':    'রেফারেল — ঐচ্ছিক (সদস্যের নাম/মোবাইল/আইডি)',
            'auth.ref.ph':       'অনুসন্ধান করুন...',
            'auth.pw2.label':    'পাসওয়ার্ড নিশ্চিতকরণ',
            'auth.terms':        'আমি শর্তাবলী পড়েছি ও সম্মত আছি',
            'auth.otp.resend':   '🔄 পুনরায় পাঠান',
            'auth.otp.back':     '← পেছনে যান',
            'auth.login.back':   '← লগইনে ফিরুন',
            // NOTICE BAR
            'notice.label':      'নোটিশ',
            // REVIEWS
            'review.title':      'সদস্যদের মতামত',
            'review.subtitle':   'আমাদের সদস্য ও গ্রাহকরা যা বলেন',
            'review.add.title':  'আপনার মতামত জানান',
            'review.name.ph':    'আপনার নাম',
            'review.mobile.ph':  'মোবাইল নম্বর',
            'review.text.ph':    'আপনার অভিজ্ঞতা লিখুন...',
            'review.btn':        '📤 মতামত পাঠান',
            'review.note':       '✅ আপনার মতামত অনুমোদনের পর প্রকাশিত হবে।',
            // FOOTER
            'footer.tagline':    'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।',
            'footer.links':      'দ্রুত লিঙ্ক',
            'footer.services':   'আমাদের সেবা',
            'footer.contact':    'যোগাযোগ',
            'footer.installment':'কিস্তিতে পণ্য ক্রয়',
            'footer.qard':       'করজে হাসানা',
            'footer.savings':    'মাসিক সঞ্চয়',
            'footer.invest':     'হালাল বিনিয়োগ',
            'footer.charity':    'চ্যারিটি সহযোগিতা',
            'footer.copyright':  '© ২০২৬ বারাকাহ ফাইন্যান্স। সর্বস্বত্ব সংরক্ষিত।',
            // DASHBOARD
            'dash.welcome':      'স্বাগতম',
            'dash.overview':     '📊 ওভারভিউ',
            'dash.profile':      '👤 প্রোফাইল',
            'dash.orders':       '🛒 আমার অর্ডার',
            'dash.notifications':'🔔 বিজ্ঞপ্তি',
            'dash.savings':      '💰 সঞ্চয় বিবরণ',
            'dash.loans':        '🤝 করজে হাসানা',
            'dash.ledger':       '📋 লেজার',
            'dash.withdrawal':   '💸 উত্তোলন আবেদন',
            'dash.profit':       '📈 মুনাফা বিবরণ',
            'dash.kyc':          '🪪 KYC অবস্থা',
            'dash.membership':   '🎫 সদস্যপদ',
            'dash.admin.panel':  '🛡️ অ্যাডমিন প্যানেল',
            'dash.all.users':    '👥 সকল ব্যবহারকারী',
            'dash.profile.complete': 'প্রোফাইল সম্পূর্ণতা',
            // COMMON
            'common.loading':    'লোড হচ্ছে...',
            'common.error':      'সমস্যা হয়েছে',
            'common.save':       'সংরক্ষণ করুন',
            'common.cancel':     'বাতিল করুন',
            'common.edit':       'সম্পাদনা',
            'common.delete':     'মুছুন',
            'common.print':      'প্রিন্ট',
            'common.export':     'রপ্তানি',
            'common.search':     'অনুসন্ধান...',
            'common.filter':     'ফিল্টার',
            'common.submit':     'জমা দিন',
            'common.approve':    'অনুমোদন করুন',
            'common.reject':     'বাতিল করুন',
            'common.pending':    'অপেক্ষারত',
            'common.approved':   'অনুমোদিত',
            'common.rejected':   'বাতিলকৃত',
            'common.active':     'সক্রিয়',
            'common.inactive':   'নিষ্ক্রিয়',
            'common.yes':        'হ্যাঁ',
            'common.no':         'না',
            'common.close':      'বন্ধ করুন',
            'common.back':       '← পিছনে',
            'common.next':       'পরবর্তী →',
            'common.view':       'দেখুন',
            'common.details':    'বিস্তারিত',
            'common.total':      'মোট',
            'common.amount':     'পরিমাণ',
            'common.date':       'তারিখ',
            'common.status':     'অবস্থা',
            'common.name':       'নাম',
            'common.phone':      'মোবাইল',
            'common.email':      'ইমেইল',
            'common.address':    'ঠিকানা',
            'common.nid':        'NID নম্বর',
            'common.id':         'আইডি',
            'common.actions':    'কার্যক্রম',
            'common.receipt':    'রসিদ',
            'common.currency':   '৳',
            // MEMBER
            'member.title':      'সদস্য',
            'member.list':       'সদস্য তালিকা',
            'member.add':        'নতুন সদস্য',
            'member.applications': 'আবেদনসমূহ',
            'member.payment':    'পেমেন্ট সংগ্রহ',
            'member.due':        'বাকি তালিকা',
            'member.id':         'সদস্য আইডি',
            'member.join.date':  'যোগদানের তারিখ',
            'member.units':      'ইউনিট সংখ্যা',
            'member.savings':    'মোট জমা',
            'member.profit':     'মোট লাভ',
            // CLIENT
            'client.title':      'গ্রাহক',
            'client.list':       'গ্রাহক তালিকা',
            'client.add':        'নতুন গ্রাহক',
            'client.payment':    'কিস্তি সংগ্রহ',
            'client.due':        'বাকি তালিকা',
            'client.paid':       'পরিশোধিত তালিকা',
            'client.fund':       'গ্রাহক ফান্ড',
            'client.purchase':   'ক্রয়মূল্য',
            'client.sale':       'বিক্রয়মূল্য',
            'client.profit':     'লাভের পরিমাণ',
            'client.down':       'ডাউনপেমেন্ট',
            'client.installments': 'কিস্তি সংখ্যা',
            'client.guarantor':  'জামিনদার',
            'client.witness':    'সাক্ষী',
            // ACCOUNTS
            'acc.title':         'হিসাব',
            'acc.income':        'আয়',
            'acc.expense':       'ব্যয়',
            'acc.summary':       'সারসংক্ষেপ',
            'acc.log':           'লেনদেন লগ',
            'acc.balance':       'ব্যালেন্স',
            'acc.reconciliation': 'হিসাব মিলানো',
            // QARD
            'qard.title':        'করজে হাসানা',
            'qard.list':         'করজের তালিকা',
            'qard.fund':         'করজ ফান্ড',
            'qard.collection':   'করজ সংগ্রহ',
            'qard.invest':       'করজ ফান্ড বিনিয়োগ',
            'qard.add':          'নতুন করজ',
            'qard.ledger':       'করজ লেজার',
            'qard.amount':       'করজের পরিমাণ',
            'qard.repay.date':   'পরিশোধের তারিখ',
            // CHARITY
            'charity.title':     'চ্যারিটি',
            'charity.income':    'চ্যারিটি আয়',
            'charity.expense':   'চ্যারিটি ব্যয়',
            'charity.ledger':    'চ্যারিটি লেজার',
            // PROJECT
            'project.title':     'প্রজেক্ট',
            'project.list':      'প্রজেক্ট তালিকা',
            'project.running':   'চলমান প্রজেক্ট',
            'project.closed':    'বন্ধ প্রজেক্ট',
            'project.add':       'নতুন প্রজেক্ট',
            'project.ledger':    'প্রজেক্ট লেজার',
            // SMS
            'sms.title':         'SMS',
            'sms.records':       'SMS রেকর্ড',
            'sms.send':          'SMS পাঠান',
            'sms.recharge':      'SMS রিচার্জ',
            'sms.balance':       'SMS ব্যালেন্স',
            'sms.templates':     'SMS টেমপ্লেট',
            // COMMITTEE
            'committee.title':   'কমিটি',
            'committee.running': 'চলতি কমিটি',
            'committee.old':     'পুরাতন কমিটি',
            'committee.add':     'কমিটি সদস্য যোগ',
            'committee.rules':   'কমিটি নিয়মাবলী',
            // ADMIN
            'admin.title':       'অ্যাডমিন',
            'admin.management':  'অ্যাডমিন ম্যানেজমেন্ট',
            'admin.permissions': 'পেজ এক্সেস',
            'admin.settings':    'সাইট সেটিংস',
            'admin.backup':      'ব্যাকআপ',
            'admin.audit':       'অডিট লগ',
            'admin.activity':    'লাইভ একটিভিটি',
            // KYC
            'kyc.title':         'KYC যাচাই',
            'kyc.status.not_submitted': 'জমা দেওয়া হয়নি',
            'kyc.status.submitted': 'জমা দেওয়া হয়েছে',
            'kyc.status.under_review': 'পর্যালোচনাধীন',
            'kyc.status.verified': 'যাচাইকৃত',
            'kyc.status.rejected': 'বাতিলকৃত',
            'kyc.status.resubmit': 'পুনরায় জমা দিন',
            // PROFIT
            'profit.title':      'মুনাফা',
            'profit.net':        'নিট মুনাফা',
            'profit.member.share': 'সদস্যদের অংশ (৬০%)',
            'profit.charity.share': 'চ্যারিটি অংশ (৫%)',
            'profit.org.share':  'সংগঠন অংশ (৩৫%)',
            'profit.distribution': 'মুনাফা বিতরণ',
            'profit.history':    'মুনাফার ইতিহাস',
            // WITHDRAWAL
            'withdrawal.title':  'উত্তোলন আবেদন',
            'withdrawal.amount': 'উত্তোলনের পরিমাণ',
            'withdrawal.reason': 'কারণ',
            'withdrawal.type':   'উত্তোলনের ধরন',
            'withdrawal.full':   'সম্পূর্ণ উত্তোলন',
            'withdrawal.partial': 'আংশিক উত্তোলন',
            'withdrawal.btn':    'আবেদন করুন',
            'withdrawal.history': 'আবেদনের ইতিহাস',
            // SITE
            'site.name':         'বারাকাহ ফাইন্যান্স',
            'site.slogan':       'সুদমুক্ত লেনদেনে সমৃদ্ধি সবার',
            'site.tagline':      'শরিয়াহসম্মত আর্থিক প্রতিষ্ঠান',
        },

        // ── English ──
        en: {
            // NAV
            'nav.about':        'About Us',
            'nav.calculator':   'Calculator',
            'nav.timeline':     'Timeline',
            'nav.gallery':      'Gallery',
            'nav.apply':        'Apply Form',
            'nav.account':      'Account',
            'nav.login':        'Log In',
            'nav.signup':       'Sign Up',
            'nav.profile':      'Profile',
            'nav.dashboard':    'Dashboard',
            'nav.logout':       'Log Out',
            'nav.admin':        'Admin Panel',
            'nav.lang':         'Language',
            'nav.notices':      'Notices',
            // HERO
            'hero.badge':       '🕌 Shariah-Compliant Financial Institution',
            'hero.title':       'Prosperity for All Through Interest-Free Transactions',
            'hero.subtitle':    'Our commitment is to eliminate usury from society through Islamic finance, ensuring halal financial assistance and prosperity for all.',
            'hero.btn.member':  '📝 Apply for Membership',
            'hero.btn.shop':    '🛒 Shop Now',
            'hero.btn.learn':   '📚 Learn More',
            // ABOUT
            'about.eyebrow':    'Our Goals & Objectives',
            'about.title':      'Why Barakah Finance?',
            'about.subtitle':   'This Shariah-compliant institution will fulfill your financial needs through completely halal means.',
            'feature.shariah':  'Interest-Free Economy',
            'feature.shariah.desc': 'All financial transactions conducted in a Shariah-compliant and halal manner.',
            'feature.qard':     'Qard-e-Hasana',
            'feature.qard.desc': 'Up to ৳15,000 in interest-free loans for emergency needs.',
            'feature.installment': 'Easy Installment Service',
            'feature.installment.desc': 'Purchase any product in 6 installments with only 10% profit.',
            'feature.savings':  'Savings & Investment',
            'feature.savings.desc': 'Opportunity for halal investment with just ৳2,000 monthly savings.',
            'feature.security': 'Transparency & Security',
            // CALCULATOR
            'calc.title':       'Installment Calculator',
            'calc.subtitle':    'Enter the product price and calculate the installment amount',
            'calc.mode1':       'Method 1: Full Cost Based',
            'calc.mode2':       'Method 2: Financed Amount Based (Shariah)',
            'calc.price':       'Product Purchase Price (৳)',
            'calc.downpayment': 'Down Payment (৳)',
            'calc.profit':      'Profit Rate (%)',
            'calc.months':      'Number of Installments',
            'calc.btn':         '📊 Calculate',
            'calc.total':       'Total Price',
            'calc.per_install': 'Per Installment',
            'calc.financed':    'Financed Amount',
            'calc.profit_amt':  'Profit Amount',
            'calc.remaining':   'Remaining Amount',
            // AUTH
            'auth.login.title':  'Log In',
            'auth.signup.title': 'Sign Up',
            'auth.otp.title':    'OTP Verification',
            'auth.forgot.title': 'Password Recovery',
            'auth.id.label':     'Mobile / Email / Username',
            'auth.id.ph':        '01XXXXXXXXX or username',
            'auth.pw.label':     'Password',
            'auth.pw.ph':        '••••••••',
            'auth.remember':     'Remember me',
            'auth.forgot':       'Forgot password?',
            'auth.btn.login':    '🔑 Log In',
            'auth.btn.signup':   '📩 Send OTP & Register',
            'auth.btn.verify':   '✅ Verify & Open Account',
            'auth.btn.recover':  '🔑 Recover Password',
            'auth.name.label':   'First Name',
            'auth.name.ph':      'First name',
            'auth.sname.label':  'Last Name',
            'auth.sname.ph':     'Last name (optional)',
            'auth.dob.label':    'Date of Birth (as per NID)',
            'auth.uname.label':  'Username',
            'auth.uname.ph':     'username',
            'auth.phone.label':  'Mobile Number',
            'auth.phone.ph':     '01XXXXXXXXX',
            'auth.email.label':  'Email (optional)',
            'auth.email.ph':     'email@example.com',
            'auth.ref.label':    'Referral — optional (member name/mobile/ID)',
            'auth.ref.ph':       'Search...',
            'auth.pw2.label':    'Confirm Password',
            'auth.terms':        'I have read and agree to the Terms & Conditions',
            'auth.otp.resend':   '🔄 Resend OTP',
            'auth.otp.back':     '← Go Back',
            'auth.login.back':   '← Back to Login',
            // NOTICE BAR
            'notice.label':      'Notice',
            // REVIEWS
            'review.title':      'Member Reviews',
            'review.subtitle':   'What our members and customers say',
            'review.add.title':  'Share Your Review',
            'review.name.ph':    'Your Name',
            'review.mobile.ph':  'Mobile Number',
            'review.text.ph':    'Write your experience...',
            'review.btn':        '📤 Submit Review',
            'review.note':       '✅ Your review will be published after approval.',
            // FOOTER
            'footer.tagline':    'Prosperity for all through interest-free transactions.',
            'footer.links':      'Quick Links',
            'footer.services':   'Our Services',
            'footer.contact':    'Contact',
            'footer.installment':'Product Installment',
            'footer.qard':       'Qard-e-Hasana',
            'footer.savings':    'Monthly Savings',
            'footer.invest':     'Halal Investment',
            'footer.charity':    'Charity Support',
            'footer.copyright':  '© 2026 Barakah Finance. All rights reserved.',
            // DASHBOARD
            'dash.welcome':      'Welcome',
            'dash.overview':     '📊 Overview',
            'dash.profile':      '👤 Profile',
            'dash.orders':       '🛒 My Orders',
            'dash.notifications':'🔔 Notifications',
            'dash.savings':      '💰 Savings Details',
            'dash.loans':        '🤝 Qard-e-Hasana',
            'dash.ledger':       '📋 Ledger',
            'dash.withdrawal':   '💸 Withdrawal Request',
            'dash.profit':       '📈 Profit Details',
            'dash.kyc':          '🪪 KYC Status',
            'dash.membership':   '🎫 Membership',
            'dash.admin.panel':  '🛡️ Admin Panel',
            'dash.all.users':    '👥 All Users',
            'dash.profile.complete': 'Profile Completion',
            // COMMON
            'common.loading':    'Loading...',
            'common.error':      'An error occurred',
            'common.save':       'Save',
            'common.cancel':     'Cancel',
            'common.edit':       'Edit',
            'common.delete':     'Delete',
            'common.print':      'Print',
            'common.export':     'Export',
            'common.search':     'Search...',
            'common.filter':     'Filter',
            'common.submit':     'Submit',
            'common.approve':    'Approve',
            'common.reject':     'Reject',
            'common.pending':    'Pending',
            'common.approved':   'Approved',
            'common.rejected':   'Rejected',
            'common.active':     'Active',
            'common.inactive':   'Inactive',
            'common.yes':        'Yes',
            'common.no':         'No',
            'common.close':      'Close',
            'common.back':       '← Back',
            'common.next':       'Next →',
            'common.view':       'View',
            'common.details':    'Details',
            'common.total':      'Total',
            'common.amount':     'Amount',
            'common.date':       'Date',
            'common.status':     'Status',
            'common.name':       'Name',
            'common.phone':      'Phone',
            'common.email':      'Email',
            'common.address':    'Address',
            'common.nid':        'NID Number',
            'common.id':         'ID',
            'common.actions':    'Actions',
            'common.receipt':    'Receipt',
            'common.currency':   '৳',
            // MEMBER
            'member.title':      'Member',
            'member.list':       'Member List',
            'member.add':        'Add New Member',
            'member.applications': 'Applications',
            'member.payment':    'Payment Collection',
            'member.due':        'Due List',
            'member.id':         'Member ID',
            'member.join.date':  'Join Date',
            'member.units':      'Units',
            'member.savings':    'Total Savings',
            'member.profit':     'Total Profit',
            // CLIENT
            'client.title':      'Client',
            'client.list':       'Client List',
            'client.add':        'Add New Client',
            'client.payment':    'Installment Collection',
            'client.due':        'Due List',
            'client.paid':       'Paid List',
            'client.fund':       'Client Fund',
            'client.purchase':   'Purchase Price',
            'client.sale':       'Sale Price',
            'client.profit':     'Profit Amount',
            'client.down':       'Down Payment',
            'client.installments': 'Number of Installments',
            'client.guarantor':  'Guarantor',
            'client.witness':    'Witness',
            // ACCOUNTS
            'acc.title':         'Accounts',
            'acc.income':        'Income',
            'acc.expense':       'Expense',
            'acc.summary':       'Account Summary',
            'acc.log':           'Transaction Log',
            'acc.balance':       'Balance',
            'acc.reconciliation': 'Reconciliation',
            // QARD
            'qard.title':        'Qard-e-Hasana',
            'qard.list':         'Qard List',
            'qard.fund':         'Qard Fund',
            'qard.collection':   'Qard Collection',
            'qard.invest':       'Qard Fund Investment',
            'qard.add':          'New Qard',
            'qard.ledger':       'Qard Ledger',
            'qard.amount':       'Qard Amount',
            'qard.repay.date':   'Repayment Date',
            // CHARITY
            'charity.title':     'Charity',
            'charity.income':    'Charity Income',
            'charity.expense':   'Charity Expense',
            'charity.ledger':    'Charity Ledger',
            // PROJECT
            'project.title':     'Project',
            'project.list':      'Project List',
            'project.running':   'Running Projects',
            'project.closed':    'Closed Projects',
            'project.add':       'New Project',
            'project.ledger':    'Project Ledger',
            // SMS
            'sms.title':         'SMS',
            'sms.records':       'SMS Records',
            'sms.send':          'Send SMS',
            'sms.recharge':      'SMS Recharge',
            'sms.balance':       'SMS Balance',
            'sms.templates':     'SMS Templates',
            // COMMITTEE
            'committee.title':   'Committee',
            'committee.running': 'Running Committee',
            'committee.old':     'Old Committee',
            'committee.add':     'Add Committee Member',
            'committee.rules':   'Committee Rules',
            // ADMIN
            'admin.title':       'Admin',
            'admin.management':  'Admin Management',
            'admin.permissions': 'Page Access',
            'admin.settings':    'Site Settings',
            'admin.backup':      'Backup',
            'admin.audit':       'Audit Log',
            'admin.activity':    'Live Activity',
            // KYC
            'kyc.title':         'KYC Verification',
            'kyc.status.not_submitted': 'Not Submitted',
            'kyc.status.submitted': 'Submitted',
            'kyc.status.under_review': 'Under Review',
            'kyc.status.verified': 'Verified',
            'kyc.status.rejected': 'Rejected',
            'kyc.status.resubmit': 'Resubmission Required',
            // PROFIT
            'profit.title':      'Profit',
            'profit.net':        'Net Profit',
            'profit.member.share': 'Member Share (60%)',
            'profit.charity.share': 'Charity Share (5%)',
            'profit.org.share':  'Organization Share (35%)',
            'profit.distribution': 'Profit Distribution',
            'profit.history':    'Profit History',
            // WITHDRAWAL
            'withdrawal.title':  'Withdrawal Request',
            'withdrawal.amount': 'Withdrawal Amount',
            'withdrawal.reason': 'Reason',
            'withdrawal.type':   'Withdrawal Type',
            'withdrawal.full':   'Full Withdrawal',
            'withdrawal.partial': 'Partial Withdrawal',
            'withdrawal.btn':    'Submit Request',
            'withdrawal.history': 'Request History',
            // SITE
            'site.name':         'Barakah Finance',
            'site.slogan':       'Prosperity for All Through Interest-Free Transactions',
            'site.tagline':      'Shariah-Compliant Financial Institution',
        },

        // ── Arabic (partial — framework ready for future completion) ──
        ar: {
            'nav.account':      'الحساب',
            'nav.login':        'تسجيل الدخول',
            'nav.signup':       'إنشاء حساب',
            'nav.logout':       'تسجيل الخروج',
            'nav.profile':      'الملف الشخصي',
            'nav.dashboard':    'لوحة التحكم',
            'nav.about':        'من نحن',
            'nav.calculator':   'الحاسبة',
            'nav.gallery':      'المعرض',
            'nav.notices':      'الإشعارات',
            'hero.title':       'الازدهار للجميع من خلال المعاملات الخالية من الفوائد',
            'common.loading':   'جارٍ التحميل...',
            'common.save':      'حفظ',
            'common.cancel':    'إلغاء',
            'common.search':    'بحث...',
            'common.submit':    'إرسال',
            'site.name':        'بركة فاينانس',
            'site.slogan':      'ازدهار الجميع بمعاملات خالية من الربا',
        },
    };

    // ─────────────────────────────────────────────
    // RTL LANGUAGES
    // ─────────────────────────────────────────────
    const RTL_LANGS = ['ar', 'ur', 'fa', 'he'];

    // ─────────────────────────────────────────────
    // CURRENT LANGUAGE STATE
    // ─────────────────────────────────────────────
    let _currentLang = 'bn';

    // ─────────────────────────────────────────────
    // CORE TRANSLATE FUNCTION
    // ─────────────────────────────────────────────
    function t(key, lang) {
        lang = lang || _currentLang;
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.bn;
        if (dict[key] !== undefined) return dict[key];
        // Fallback: try Bangla, then return key
        if (lang !== 'bn' && TRANSLATIONS.bn[key] !== undefined) return TRANSLATIONS.bn[key];
        return key;
    }

    // ─────────────────────────────────────────────
    // APPLY LANGUAGE TO DOM
    // ─────────────────────────────────────────────
    function applyLang(lang) {
        if (!TRANSLATIONS[lang]) {
            console.warn(`[lang.js] Language '${lang}' not found. Falling back to 'bn'.`);
            lang = 'bn';
        }
        _currentLang = lang;
        localStorage.setItem('bf_lang', lang);

        // Update html lang attribute
        document.documentElement.lang = lang;

        // RTL support
        if (RTL_LANGS.includes(lang)) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl');
        }

        // Translate all [data-i18n] elements
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            const text = t(key, lang);
            // Preserve child elements (icons etc.) — only replace text nodes
            const childNodes = Array.from(el.childNodes);
            const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);
            if (textNodes.length > 0) {
                // Update the last (or only) text node
                textNodes[textNodes.length - 1].textContent = ' ' + text;
            } else if (el.children.length === 0) {
                el.textContent = text;
            } else {
                // Has children (icons) — prepend text after icons
                // Find existing i18n text node
                const existingI18n = childNodes.find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                if (existingI18n) {
                    existingI18n.textContent = ' ' + text;
                } else {
                    el.appendChild(document.createTextNode(' ' + text));
                }
            }
        });

        // Translate placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key, lang);
        });

        // Translate title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key, lang);
        });

        // Translate aria-label attributes
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', t(key, lang));
        });

        // Update language switcher UI
        const flags = { bn: '🇧🇩', en: '🇬🇧', ar: '🇸🇦', ur: '🇵🇰' };
        const names = { bn: 'বাংলা', en: 'English', ar: 'عربي', ur: 'اردو' };
        const flagEl = document.getElementById('langFlag');
        const codeEl = document.getElementById('langCode');
        if (flagEl) flagEl.textContent = flags[lang] || '🌐';
        if (codeEl) codeEl.textContent = names[lang] || lang.toUpperCase();

        // Fire custom event for other JS to listen (e.g. dashboard, admin panel)
        document.dispatchEvent(new CustomEvent('bf:langChanged', { detail: { lang } }));
    }

    // ─────────────────────────────────────────────
    // LANGUAGE MENU TOGGLE (global helper)
    // ─────────────────────────────────────────────
    window.toggleLangMenu = function () {
        const drop = document.getElementById('langDrop');
        if (!drop) return;
        drop.classList.toggle('open');
    };

    // Close on outside click
    document.addEventListener('click', function (e) {
        const wrap = document.querySelector('.nav-lang-wrap');
        if (wrap && !wrap.contains(e.target)) {
            const drop = document.getElementById('langDrop');
            if (drop) drop.classList.remove('open');
        }
    });

    // ─────────────────────────────────────────────
    // setLang — called from navbar UI
    // ─────────────────────────────────────────────
    window.setLang = function (lang) {
        applyLang(lang);
        // Close dropdown
        const drop = document.getElementById('langDrop');
        if (drop) drop.classList.remove('open');
    };

    // ─────────────────────────────────────────────
    // EXPOSE PUBLIC API
    // ─────────────────────────────────────────────
    window.BF_i18n = {
        t: t,
        applyLang: applyLang,
        getCurrentLang: function () { return _currentLang; },
        getLangs: function () { return Object.keys(TRANSLATIONS); },
        addTranslations: function (lang, strings) {
            // Admin panel can extend translations without editing this file
            if (!TRANSLATIONS[lang]) TRANSLATIONS[lang] = {};
            Object.assign(TRANSLATIONS[lang], strings);
        },
    };

    // For backwards compat
    window.applyLang = applyLang;

    // ─────────────────────────────────────────────
    // AUTO-INIT
    // ─────────────────────────────────────────────
    function init() {
        // 1. Check localStorage saved preference
        let saved = localStorage.getItem('bf_lang');

        // 2. If no preference, detect browser/device language
        if (!saved) {
            const browserLang = (navigator.language || navigator.userLanguage || 'bn').slice(0, 2).toLowerCase();
            // Map browser codes to supported languages
            const langMap = { bn: 'bn', en: 'en', ar: 'ar', ur: 'ur' };
            saved = langMap[browserLang] || 'bn'; // Default to Bangla
        }

        applyLang(saved);
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
