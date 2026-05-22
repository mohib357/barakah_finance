// C:\Project\Barakah_Finance\js\geo-address.js
// ════════ GEO ADDRESS & COUNTRY CODE MODULE ════════
// Handles: auto geo-detect, world country list, BD cascade (Bangla), foreign address fields, searchable phone code picker

// ════════ WORLD COUNTRIES (ISO 3166-1) ════════
// Format: { code, name (English), nameBn (Bangla), phone, flag }
const WORLD_COUNTRIES = [
    { code: "AF", name: "Afghanistan", nameBn: "আফগানিস্তান", phone: "+93", flag: "🇦🇫" },
    { code: "AL", name: "Albania", nameBn: "আলবেনিয়া", phone: "+355", flag: "🇦🇱" },
    { code: "DZ", name: "Algeria", nameBn: "আলজেরিয়া", phone: "+213", flag: "🇩🇿" },
    { code: "AR", name: "Argentina", nameBn: "আর্জেন্টিনা", phone: "+54", flag: "🇦🇷" },
    { code: "AM", name: "Armenia", nameBn: "আর্মেনিয়া", phone: "+374", flag: "🇦🇲" },
    { code: "AU", name: "Australia", nameBn: "অস্ট্রেলিয়া", phone: "+61", flag: "🇦🇺", digits: 9 },
    { code: "AT", name: "Austria", nameBn: "অস্ট্রিয়া", phone: "+43", flag: "🇦🇹" },
    { code: "AZ", name: "Azerbaijan", nameBn: "আজারবাইজান", phone: "+994", flag: "🇦🇿" },
    { code: "BH", name: "Bahrain", nameBn: "বাহরাইন", phone: "+973", flag: "🇧🇭", digits: 8 },
    { code: "BD", name: "Bangladesh", nameBn: "বাংলাদেশ", phone: "+880", flag: "🇧🇩", digits: 11 },
    { code: "BE", name: "Belgium", nameBn: "বেলজিয়াম", phone: "+32", flag: "🇧🇪" },
    { code: "BZ", name: "Belize", nameBn: "বেলিজ", phone: "+501", flag: "🇧🇿" },
    { code: "BJ", name: "Benin", nameBn: "বেনিন", phone: "+229", flag: "🇧🇯" },
    { code: "BT", name: "Bhutan", nameBn: "ভুটান", phone: "+975", flag: "🇧🇹" },
    { code: "BO", name: "Bolivia", nameBn: "বলিভিয়া", phone: "+591", flag: "🇧🇴" },
    { code: "BA", name: "Bosnia", nameBn: "বসনিয়া", phone: "+387", flag: "🇧🇦" },
    { code: "BR", name: "Brazil", nameBn: "ব্রাজিল", phone: "+55", flag: "🇧🇷" },
    { code: "BN", name: "Brunei", nameBn: "ব্রুনেই", phone: "+673", flag: "🇧🇳" },
    { code: "BG", name: "Bulgaria", nameBn: "বুলগেরিয়া", phone: "+359", flag: "🇧🇬" },
    { code: "BF", name: "Burkina Faso", nameBn: "বুর্কিনা ফাসো", phone: "+226", flag: "🇧🇫" },
    { code: "KH", name: "Cambodia", nameBn: "কম্বোডিয়া", phone: "+855", flag: "🇰🇭" },
    { code: "CM", name: "Cameroon", nameBn: "ক্যামেরুন", phone: "+237", flag: "🇨🇲" },
    { code: "CA", name: "Canada", nameBn: "কানাডা", phone: "+1", flag: "🇨🇦", digits: 10 },
    { code: "CL", name: "Chile", nameBn: "চিলি", phone: "+56", flag: "🇨🇱" },
    { code: "CN", name: "China", nameBn: "চীন", phone: "+86", flag: "🇨🇳", digits: 11 },
    { code: "CO", name: "Colombia", nameBn: "কলম্বিয়া", phone: "+57", flag: "🇨🇴" },
    { code: "CD", name: "Congo (DRC)", nameBn: "কঙ্গো", phone: "+243", flag: "🇨🇩" },
    { code: "HR", name: "Croatia", nameBn: "ক্রোয়েশিয়া", phone: "+385", flag: "🇭🇷" },
    { code: "CU", name: "Cuba", nameBn: "কিউবা", phone: "+53", flag: "🇨🇺" },
    { code: "CY", name: "Cyprus", nameBn: "সাইপ্রাস", phone: "+357", flag: "🇨🇾" },
    { code: "CZ", name: "Czech Republic", nameBn: "চেক প্রজাতন্ত্র", phone: "+420", flag: "🇨🇿" },
    { code: "DK", name: "Denmark", nameBn: "ডেনমার্ক", phone: "+45", flag: "🇩🇰" },
    { code: "EC", name: "Ecuador", nameBn: "ইকুয়েডর", phone: "+593", flag: "🇪🇨" },
    { code: "EG", name: "Egypt", nameBn: "মিশর", phone: "+20", flag: "🇪🇬", digits: 10 },
    { code: "ET", name: "Ethiopia", nameBn: "ইথিওপিয়া", phone: "+251", flag: "🇪🇹" },
    { code: "FI", name: "Finland", nameBn: "ফিনল্যান্ড", phone: "+358", flag: "🇫🇮" },
    { code: "FR", name: "France", nameBn: "ফ্রান্স", phone: "+33", flag: "🇫🇷", digits: 9 },
    { code: "GA", name: "Gabon", nameBn: "গ্যাবন", phone: "+241", flag: "🇬🇦" },
    { code: "GH", name: "Ghana", nameBn: "ঘানা", phone: "+233", flag: "🇬🇭" },
    { code: "GR", name: "Greece", nameBn: "গ্রিস", phone: "+30", flag: "🇬🇷" },
    { code: "GT", name: "Guatemala", nameBn: "গুয়াতেমালা", phone: "+502", flag: "🇬🇹" },
    { code: "GN", name: "Guinea", nameBn: "গিনি", phone: "+224", flag: "🇬🇳" },
    { code: "HT", name: "Haiti", nameBn: "হাইতি", phone: "+509", flag: "🇭🇹" },
    { code: "HN", name: "Honduras", nameBn: "হন্ডুরাস", phone: "+504", flag: "🇭🇳" },
    { code: "HK", name: "Hong Kong", nameBn: "হংকং", phone: "+852", flag: "🇭🇰", digits: 8 },
    { code: "HU", name: "Hungary", nameBn: "হাঙ্গেরি", phone: "+36", flag: "🇭🇺" },
    { code: "IS", name: "Iceland", nameBn: "আইসল্যান্ড", phone: "+354", flag: "🇮🇸" },
    { code: "IN", name: "India", nameBn: "ভারত", phone: "+91", flag: "🇮🇳", digits: 10 },
    { code: "ID", name: "Indonesia", nameBn: "ইন্দোনেশিয়া", phone: "+62", flag: "🇮🇩" },
    { code: "IR", name: "Iran", nameBn: "ইরান", phone: "+98", flag: "🇮🇷" },
    { code: "IQ", name: "Iraq", nameBn: "ইরাক", phone: "+964", flag: "🇮🇶" },
    { code: "IE", name: "Ireland", nameBn: "আয়ারল্যান্ড", phone: "+353", flag: "🇮🇪" },
    { code: "IL", name: "Israel", nameBn: "ইসরাইল", phone: "+972", flag: "🇮🇱" },
    { code: "IT", name: "Italy", nameBn: "ইতালি", phone: "+39", flag: "🇮🇹" },
    { code: "CI", name: "Ivory Coast", nameBn: "আইভরি কোস্ট", phone: "+225", flag: "🇨🇮" },
    { code: "JM", name: "Jamaica", nameBn: "জ্যামাইকা", phone: "+1876", flag: "🇯🇲" },
    { code: "JP", name: "Japan", nameBn: "জাপান", phone: "+81", flag: "🇯🇵" },
    { code: "JO", name: "Jordan", nameBn: "জর্দান", phone: "+962", flag: "🇯🇴" },
    { code: "KZ", name: "Kazakhstan", nameBn: "কাজাখস্তান", phone: "+7", flag: "🇰🇿" },
    { code: "KE", name: "Kenya", nameBn: "কেনিয়া", phone: "+254", flag: "🇰🇪" },
    { code: "KW", name: "Kuwait", nameBn: "কুয়েত", phone: "+965", flag: "🇰🇼", digits: 8 },
    { code: "KG", name: "Kyrgyzstan", nameBn: "কিরগিজস্তান", phone: "+996", flag: "🇰🇬" },
    { code: "LA", name: "Laos", nameBn: "লাওস", phone: "+856", flag: "🇱🇦" },
    { code: "LB", name: "Lebanon", nameBn: "লেবানন", phone: "+961", flag: "🇱🇧" },
    { code: "LY", name: "Libya", nameBn: "লিবিয়া", phone: "+218", flag: "🇱🇾" },
    { code: "LT", name: "Lithuania", nameBn: "লিথুয়ানিয়া", phone: "+370", flag: "🇱🇹" },
    { code: "MK", name: "Macedonia", nameBn: "মেসিডোনিয়া", phone: "+389", flag: "🇲🇰" },
    { code: "MG", name: "Madagascar", nameBn: "মাদাগাস্কার", phone: "+261", flag: "🇲🇬" },
    { code: "MW", name: "Malawi", nameBn: "মালাউই", phone: "+265", flag: "🇲🇼" },
    { code: "MY", name: "Malaysia", nameBn: "মালয়েশিয়া", phone: "+60", flag: "🇲🇾", digits: 9 },
    { code: "MV", name: "Maldives", nameBn: "মালদ্বীপ", phone: "+960", flag: "🇲🇻" },
    { code: "ML", name: "Mali", nameBn: "মালি", phone: "+223", flag: "🇲🇱" },
    { code: "MT", name: "Malta", nameBn: "মাল্টা", phone: "+356", flag: "🇲🇹" },
    { code: "MR", name: "Mauritania", nameBn: "মৌরিতানিয়া", phone: "+222", flag: "🇲🇷" },
    { code: "MX", name: "Mexico", nameBn: "মেক্সিকো", phone: "+52", flag: "🇲🇽" },
    { code: "MD", name: "Moldova", nameBn: "মলদোভা", phone: "+373", flag: "🇲🇩" },
    { code: "MN", name: "Mongolia", nameBn: "মঙ্গোলিয়া", phone: "+976", flag: "🇲🇳" },
    { code: "MA", name: "Morocco", nameBn: "মরক্কো", phone: "+212", flag: "🇲🇦" },
    { code: "MZ", name: "Mozambique", nameBn: "মোজাম্বিক", phone: "+258", flag: "🇲🇿" },
    { code: "MM", name: "Myanmar", nameBn: "মিয়ানমার", phone: "+95", flag: "🇲🇲" },
    { code: "NA", name: "Namibia", nameBn: "নামিবিয়া", phone: "+264", flag: "🇳🇦" },
    { code: "NP", name: "Nepal", nameBn: "নেপাল", phone: "+977", flag: "🇳🇵" },
    { code: "NL", name: "Netherlands", nameBn: "নেদারল্যান্ডস", phone: "+31", flag: "🇳🇱" },
    { code: "NZ", name: "New Zealand", nameBn: "নিউজিল্যান্ড", phone: "+64", flag: "🇳🇿" },
    { code: "NI", name: "Nicaragua", nameBn: "নিকারাগুয়া", phone: "+505", flag: "🇳🇮" },
    { code: "NE", name: "Niger", nameBn: "নাইজার", phone: "+227", flag: "🇳🇪" },
    { code: "NG", name: "Nigeria", nameBn: "নাইজেরিয়া", phone: "+234", flag: "🇳🇬" },
    { code: "NO", name: "Norway", nameBn: "নরওয়ে", phone: "+47", flag: "🇳🇴" },
    { code: "OM", name: "Oman", nameBn: "ওমান", phone: "+968", flag: "🇴🇲", digits: 8 },
    { code: "PK", name: "Pakistan", nameBn: "পাকিস্তান", phone: "+92", flag: "🇵🇰", digits: 10 },
    { code: "PS", name: "Palestine", nameBn: "ফিলিস্তিন", phone: "+970", flag: "🇵🇸" },
    { code: "PA", name: "Panama", nameBn: "পানামা", phone: "+507", flag: "🇵🇦" },
    { code: "PG", name: "Papua New Guinea", nameBn: "পাপুয়া নিউ গিনি", phone: "+675", flag: "🇵🇬" },
    { code: "PY", name: "Paraguay", nameBn: "প্যারাগুয়ে", phone: "+595", flag: "🇵🇾" },
    { code: "PE", name: "Peru", nameBn: "পেরু", phone: "+51", flag: "🇵🇪" },
    { code: "PH", name: "Philippines", nameBn: "ফিলিপাইন", phone: "+63", flag: "🇵🇭" },
    { code: "PL", name: "Poland", nameBn: "পোল্যান্ড", phone: "+48", flag: "🇵🇱" },
    { code: "PT", name: "Portugal", nameBn: "পর্তুগাল", phone: "+351", flag: "🇵🇹" },
    { code: "QA", name: "Qatar", nameBn: "কাতার", phone: "+974", flag: "🇶🇦", digits: 8 },
    { code: "RO", name: "Romania", nameBn: "রোমানিয়া", phone: "+40", flag: "🇷🇴" },
    { code: "RU", name: "Russia", nameBn: "রাশিয়া", phone: "+7", flag: "🇷🇺", digits: 10 },
    { code: "RW", name: "Rwanda", nameBn: "রুয়ান্ডা", phone: "+250", flag: "🇷🇼" },
    { code: "SA", name: "Saudi Arabia", nameBn: "সৌদি আরব", phone: "+966", flag: "🇸🇦", digits: 9 },
    { code: "SN", name: "Senegal", nameBn: "সেনেগাল", phone: "+221", flag: "🇸🇳" },
    { code: "RS", name: "Serbia", nameBn: "সার্বিয়া", phone: "+381", flag: "🇷🇸" },
    { code: "SL", name: "Sierra Leone", nameBn: "সিয়েরা লিওন", phone: "+232", flag: "🇸🇱" },
    { code: "SG", name: "Singapore", nameBn: "সিঙ্গাপুর", phone: "+65", flag: "🇸🇬", digits: 8 },
    { code: "SK", name: "Slovakia", nameBn: "স্লোভাকিয়া", phone: "+421", flag: "🇸🇰" },
    { code: "SO", name: "Somalia", nameBn: "সোমালিয়া", phone: "+252", flag: "🇸🇴" },
    { code: "ZA", name: "South Africa", nameBn: "দক্ষিণ আফ্রিকা", phone: "+27", flag: "🇿🇦" },
    { code: "KR", name: "South Korea", nameBn: "দক্ষিণ কোরিয়া", phone: "+82", flag: "🇰🇷" },
    { code: "SS", name: "South Sudan", nameBn: "দক্ষিণ সুদান", phone: "+211", flag: "🇸🇸" },
    { code: "ES", name: "Spain", nameBn: "স্পেন", phone: "+34", flag: "🇪🇸" },
    { code: "LK", name: "Sri Lanka", nameBn: "শ্রীলঙ্কা", phone: "+94", flag: "🇱🇰" },
    { code: "SD", name: "Sudan", nameBn: "সুদান", phone: "+249", flag: "🇸🇩" },
    { code: "SE", name: "Sweden", nameBn: "সুইডেন", phone: "+46", flag: "🇸🇪" },
    { code: "CH", name: "Switzerland", nameBn: "সুইজারল্যান্ড", phone: "+41", flag: "🇨🇭" },
    { code: "SY", name: "Syria", nameBn: "সিরিয়া", phone: "+963", flag: "🇸🇾" },
    { code: "TW", name: "Taiwan", nameBn: "তাইওয়ান", phone: "+886", flag: "🇹🇼" },
    { code: "TJ", name: "Tajikistan", nameBn: "তাজিকিস্তান", phone: "+992", flag: "🇹🇯" },
    { code: "TZ", name: "Tanzania", nameBn: "তানজানিয়া", phone: "+255", flag: "🇹🇿" },
    { code: "TH", name: "Thailand", nameBn: "থাইল্যান্ড", phone: "+66", flag: "🇹🇭" },
    { code: "TG", name: "Togo", nameBn: "টোগো", phone: "+228", flag: "🇹🇬" },
    { code: "TN", name: "Tunisia", nameBn: "তিউনিসিয়া", phone: "+216", flag: "🇹🇳" },
    { code: "TR", name: "Turkey", nameBn: "তুরস্ক", phone: "+90", flag: "🇹🇷" },
    { code: "TM", name: "Turkmenistan", nameBn: "তুর্কমেনিস্তান", phone: "+993", flag: "🇹🇲" },
    { code: "UG", name: "Uganda", nameBn: "উগান্ডা", phone: "+256", flag: "🇺🇬" },
    { code: "UA", name: "Ukraine", nameBn: "ইউক্রেন", phone: "+380", flag: "🇺🇦" },
    { code: "AE", name: "UAE", nameBn: "সংযুক্ত আরব আমিরাত", phone: "+971", flag: "🇦🇪", digits: 9 },
    { code: "GB", name: "United Kingdom", nameBn: "যুক্তরাজ্য", phone: "+44", flag: "🇬🇧", digits: 10 },
    { code: "US", name: "United States", nameBn: "যুক্তরাষ্ট্র", phone: "+1", flag: "🇺🇸", digits: 10 },
    { code: "UY", name: "Uruguay", nameBn: "উরুগুয়ে", phone: "+598", flag: "🇺🇾" },
    { code: "UZ", name: "Uzbekistan", nameBn: "উজবেকিস্তান", phone: "+998", flag: "🇺🇿" },
    { code: "VE", name: "Venezuela", nameBn: "ভেনেজুয়েলা", phone: "+58", flag: "🇻🇪" },
    { code: "VN", name: "Vietnam", nameBn: "ভিয়েতনাম", phone: "+84", flag: "🇻🇳" },
    { code: "YE", name: "Yemen", nameBn: "ইয়েমেন", phone: "+967", flag: "🇾🇪" },
    { code: "ZM", name: "Zambia", nameBn: "জাম্বিয়া", phone: "+260", flag: "🇿🇲" },
    { code: "ZW", name: "Zimbabwe", nameBn: "জিম্বাবুয়ে", phone: "+263", flag: "🇿🇼" },
];

// ════════ GEO-DETECT & ADDRESS INIT ════════
let detectedCountryCode = "BD"; // default

async function geoDetectAndInit() {
    try {
        // Free, no-key API — returns JSON with country_code
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        if (data && data.country_code) detectedCountryCode = data.country_code;
    } catch {
        // silently fallback to BD
    }
    buildCountryDropdown("addrCountry", detectedCountryCode);
    handleCountryChange(detectedCountryCode);
}

// ════════ BUILD COUNTRY DROPDOWN ════════
function buildCountryDropdown(selectId, selectedCode) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = "";
    WORLD_COUNTRIES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.code;
        o.textContent = `${c.flag} ${c.name}`;
        if (c.code === selectedCode) o.selected = true;
        sel.appendChild(o);
    });
}

// ════════ COUNTRY CHANGE HANDLER ════════
function handleCountryChange(code) {
    const isBD = code === "BD";
    const bdBlock = document.getElementById("bdAddressBlock");
    const foreignBlock = document.getElementById("foreignAddressBlock");

    if (bdBlock) bdBlock.style.display = isBD ? "" : "none";
    if (foreignBlock) foreignBlock.style.display = isBD ? "none" : "";

    if (isBD) {
        populateDivisions();
    } else {
        renderForeignAddressFields(code);
    }
}

// ════════ FOREIGN ADDRESS FIELDS ════════
function renderForeignAddressFields(code) {
    const wrap = document.getElementById("foreignAddressBlock");
    if (!wrap) return;
    const country = WORLD_COUNTRIES.find(c => c.code === code);
    const cname = country ? country.name : code;

    wrap.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
      <div>
        <label class="field-label">State / Province / Region</label>
        <input type="text" class="form-input" id="foreignState" placeholder="State or Province" />
      </div>
      <div>
        <label class="field-label">City / District</label>
        <input type="text" class="form-input" id="foreignCity" placeholder="City or District" />
      </div>
      <div>
        <label class="field-label">Postal / ZIP Code</label>
        <input type="text" class="form-input" id="foreignPostCode" placeholder="Postal Code" />
      </div>
      <div>
        <label class="field-label">Area / Neighborhood</label>
        <input type="text" class="form-input" id="foreignArea" placeholder="Area, Street, House No." />
      </div>
    </div>
  `;
}

// ════════ GET FULL CURRENT ADDRESS STRING ════════
function getCurrentAddressString() {
    const code = document.getElementById("addrCountry")?.value || "BD";
    if (code === "BD") {
        return buildAddress(); // existing function in form.js
    }
    const state = document.getElementById("foreignState")?.value || "";
    const city = document.getElementById("foreignCity")?.value || "";
    const post = document.getElementById("foreignPostCode")?.value || "";
    const area = document.getElementById("foreignArea")?.value || "";
    const country = WORLD_COUNTRIES.find(c => c.code === code);
    return [area, city, state, post, country?.name || code].filter(Boolean).join(", ");
}

// ════════ SEARCHABLE PHONE COUNTRY CODE PICKER ════════
// Replaces simple <select> with a custom searchable dropdown

function buildPhonePickerHTML(inputId, defaultCode = "+880") {
    const country = WORLD_COUNTRIES.find(c => c.phone === defaultCode) || WORLD_COUNTRIES.find(c => c.code === "BD");
    return `
    <div class="phone-picker-wrap" data-input="${inputId}">
      <div class="phone-picker-trigger" onclick="togglePhonePicker(this)">
        <span class="picker-flag">${country.flag}</span>
        <span class="picker-code">${country.phone}</span>
        <span class="picker-arrow">▾</span>
      </div>
      <div class="phone-picker-dropdown hidden">
        <div class="picker-search-wrap">
          <input type="text" class="picker-search" placeholder="BD, IN, US, +880..." oninput="filterPhonePicker(this)" onclick="event.stopPropagation()" />
        </div>
        <div class="picker-list">
          ${WORLD_COUNTRIES.map(c => `
            <div class="picker-item" data-code="${c.phone}" data-digits="${c.digits || 10}" data-iso="${c.code.toLowerCase()}" data-name="${c.name.toLowerCase()}"
              onclick="selectPhoneCode(this)">
              <span>${c.flag}</span>
              <span class="picker-item-name">${c.name}</span>
              <span class="picker-item-code">${c.phone}</span>
            </div>
          `).join("")}
        </div>
      </div>
      <input type="tel" class="form-input flex-1" id="${inputId}" placeholder="মোবাইল নম্বর (ইংরেজিতে)"
        inputmode="numeric" oninput="validatePhoneInput(this)" required />
    </div>
  `;
}

function togglePhonePicker(trigger) {
    const dropdown = trigger.nextElementSibling;
    const allDropdowns = document.querySelectorAll(".phone-picker-dropdown");
    allDropdowns.forEach(d => { if (d !== dropdown) d.classList.add("hidden"); });
    dropdown.classList.toggle("hidden");
    if (!dropdown.classList.contains("hidden")) {
        dropdown.querySelector(".picker-search")?.focus();
    }
}

function filterPhonePicker(input) {
    const q = input.value.toLowerCase().trim();
    const items = input.closest(".phone-picker-dropdown").querySelectorAll(".picker-item");
    items.forEach(item => {
        const iso = item.dataset.iso || "";
        const name = item.dataset.name || "";
        const code = (item.dataset.code || "").replace("+", "");
        const match = !q || iso.includes(q) || name.includes(q) || code.includes(q) || ('+' + code).includes(q);
        item.style.display = match ? "" : "none";
    });
}

function selectPhoneCode(item) {
    const wrap = item.closest(".phone-picker-wrap");
    const trigger = wrap.querySelector(".phone-picker-trigger");
    const dropdown = wrap.querySelector(".phone-picker-dropdown");
    const phoneInput = wrap.querySelector("input[type='tel']");

    const flag = item.querySelector("span:first-child").textContent;
    const code = item.dataset.code;
    const digits = parseInt(item.dataset.digits || "10");

    trigger.querySelector(".picker-flag").textContent = flag;
    trigger.querySelector(".picker-code").textContent = code;
    phoneInput.dataset.maxDigits = digits;
    phoneInput.maxLength = digits;
    dropdown.classList.add("hidden");

    // reset search
    dropdown.querySelector(".picker-search").value = "";
    dropdown.querySelectorAll(".picker-item").forEach(i => i.style.display = "");

    phoneInput.focus();
}

function validatePhoneInput(input) {
    input.value = input.value.replace(/[^\d]/g, "");
    const max = parseInt(input.dataset.maxDigits || input.getAttribute("maxlength") || "11");
    if (input.value.length > max) input.value = input.value.slice(0, max);
}

function getPhoneWithCode(wrap) {
    const code = wrap.querySelector(".picker-code")?.textContent || "+880";
    const num = wrap.querySelector("input[type='tel']")?.value || "";
    return num ? code + num : "";
}

// ════════ CLOSE PICKER ON OUTSIDE CLICK ════════
document.addEventListener("click", (e) => {
    if (!e.target.closest(".phone-picker-wrap")) {
        document.querySelectorAll(".phone-picker-dropdown").forEach(d => d.classList.add("hidden"));
    }
});

// ════════ ADD PHONE ROW (updated version) ════════
let phoneRowCount = 1;
function addPhoneField() {
    if (phoneRowCount >= 3) { showToast("সর্বোচ্চ ৩টি নম্বর দেওয়া যাবে", "#C9A227"); return; }
    phoneRowCount++;
    const container = document.getElementById("phoneContainer");
    const wrapper = document.createElement("div");
    wrapper.className = "phone-field-group mb-2";
    wrapper.id = "phone-field-" + phoneRowCount;
    wrapper.innerHTML = buildPhonePickerHTML("phoneNum" + phoneRowCount, "+880") +
        `<button type="button" onclick="this.closest('.phone-field-group').remove(); phoneRowCount--;"
      class="phone-remove-btn" title="সরান">✕</button>`;
    // adjust layout
    wrapper.style.cssText = "display:flex;gap:6px;align-items:center;";
    container.appendChild(wrapper);
}