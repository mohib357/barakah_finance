// C:\Project\Barakah_Finance\js\form-patch.js
// ════════ PATCH: form.js এ যোগ করুন অথবা এই ফাইলটি form.js এর পরে <script> দিয়ে লোড করুন ════════

// ════════ UNION LEVEL (বাংলাদেশ ইউনিয়ন) ════════
// BD_DATA তে union level না থাকলে post office সরাসরি দেখাবে
function populateUnions() {
    const div = document.getElementById('addrDivision')?.value;
    const dist = document.getElementById('addrDistrict')?.value;
    const thana = document.getElementById('addrThana')?.value;
    const unionSel = document.getElementById('addrUnion');
    const postSel = document.getElementById('addrPost');

    if (!unionSel) { populatePostOffices(); return; }

    unionSel.innerHTML = '<option value="">-- ইউনিয়ন --</option>';
    postSel.innerHTML = '<option value="">-- পোস্ট অফিস --</option>';
    document.getElementById('addrPostCode').value = '';

    // Check if BD_DATA has union level for this thana
    const thanaData = BD_DATA[div]?.[dist]?.[thana];
    if (!thanaData) return;

    // If thanaData is Array → old format (post offices directly), skip union
    if (Array.isArray(thanaData)) {
        unionSel.innerHTML = '<option value="" selected>-- ইউনিয়ন (প্রযোজ্য নয়) --</option>';
        unionSel.disabled = true;
        populatePostOffices();
        return;
    }

    // If thanaData is Object → union level available
    unionSel.disabled = false;
    Object.keys(thanaData).forEach(union => {
        const o = document.createElement('option');
        o.value = union;
        o.textContent = union;
        unionSel.appendChild(o);
    });

    // default to first if Aditmari thana
    if (thana === 'আদিতমারী') {
        unionSel.value = Object.keys(thanaData)[0] || '';
        populatePostOffices();
    }
}

// ════════ POST OFFICE (updated to handle union level) ════════
// Override existing populatePostOffices to support union level
const _origPopulatePostOffices = window.populatePostOffices;
window.populatePostOffices = function () {
    const div = document.getElementById('addrDivision')?.value;
    const dist = document.getElementById('addrDistrict')?.value;
    const thana = document.getElementById('addrThana')?.value;
    const unionSel = document.getElementById('addrUnion');
    const union = unionSel?.value;
    const postSel = document.getElementById('addrPost');
    if (!postSel) return;

    postSel.innerHTML = '<option value="">-- পোস্ট অফিস --</option>';
    document.getElementById('addrPostCode').value = '';

    const thanaData = BD_DATA[div]?.[dist]?.[thana];
    let posts;

    if (Array.isArray(thanaData)) {
        // Old format: array of {name, code}
        posts = thanaData;
    } else if (thanaData && union) {
        // New format with union level
        posts = thanaData[union];
    } else {
        return;
    }

    if (!posts) return;
    posts.forEach(p => {
        const o = document.createElement('option');
        o.value = p.code;
        o.textContent = p.name;
        o.dataset.code = p.code;
        postSel.appendChild(o);
    });
};

// ════════ COLLECT ALL PHONES (updated for new picker) ════════
function collectAllPhones() {
    const phones = [];
    document.querySelectorAll('#phoneContainer .phone-picker-wrap').forEach(wrap => {
        const code = wrap.querySelector('.picker-code')?.textContent || '+880';
        const num = wrap.querySelector('input[type="tel"]')?.value || '';
        if (num.trim()) phones.push(code + num.trim());
    });
    // Also collect old-style .phone-row if any remain
    document.querySelectorAll('#phoneContainer .phone-row').forEach(row => {
        const code = row.querySelector('.country-code-sel')?.value || '';
        const num = row.querySelector('input[type="tel"]')?.value || '';
        if (num.trim()) phones.push(code + num.trim());
    });
    return phones;
}

// ════════ PATCH submitForm to use collectAllPhones ════════
// Wrap the original submitForm — override phones collection
const _origSubmitForm = window.submitForm;
window.submitForm = function () {
    // Override phones in submittedFormData after original runs
    const origSet = window._patchPhones;
    window._patchPhones = true;
    _origSubmitForm && _origSubmitForm();
    // patch phones after submit built the object
    if (window.submittedFormData) {
        window.submittedFormData.phones = collectAllPhones();
        // also update in localStorage
        try {
            const apps = JSON.parse(localStorage.getItem('bf_applications') || '[]');
            if (apps.length > 0) {
                apps[apps.length - 1].phones = window.submittedFormData.phones;
                localStorage.setItem('bf_applications', JSON.stringify(apps));
            }
        } catch (e) { }
    }
};

// ════════ NEW PHONE FIELD (with picker) ════════
window.addPhoneField = function () {
    if (window.phoneRowCount >= 3) {
        showToast('সর্বোচ্চ ৩টি নম্বর দেওয়া যাবে', '#C9A227');
        return;
    }
    window.phoneRowCount = (window.phoneRowCount || 1) + 1;
    const id = window.phoneRowCount;
    const container = document.getElementById('phoneContainer');

    const outer = document.createElement('div');
    outer.className = 'phone-row-outer';
    outer.id = 'phone-field-' + id;

    // picker wrap
    const pickerWrap = document.createElement('div');
    pickerWrap.className = 'phone-picker-wrap';
    pickerWrap.style.flex = '1';
    pickerWrap.innerHTML = `
    <div class="phone-picker-trigger" onclick="togglePhonePicker(this)">
      <span class="picker-flag">🇧🇩</span>
      <span class="picker-code">+880</span>
      <span class="picker-arrow">▾</span>
    </div>
    <div class="phone-picker-dropdown hidden">
      <div class="picker-search-wrap">
        <input type="text" class="picker-search" placeholder="BD, IN, US, +880..."
          oninput="filterPhonePicker(this)" onclick="event.stopPropagation()" />
      </div>
      <div class="picker-list" id="pickerList${id}"></div>
    </div>
    <input type="tel" class="form-input flex-1" id="phoneNum${id}"
      placeholder="মোবাইল নম্বর (ইংরেজিতে)"
      inputmode="numeric" data-max-digits="11"
      oninput="validatePhoneInput(this)" />
  `;

    // Populate this picker's list
    const list = pickerWrap.querySelector('.picker-list');
    WORLD_COUNTRIES.forEach(c => {
        const div = document.createElement('div');
        div.className = 'picker-item';
        div.dataset.code = c.phone;
        div.dataset.digits = c.digits || 10;
        div.dataset.iso = c.code.toLowerCase();
        div.dataset.name = c.name.toLowerCase();
        div.onclick = function () { selectPhoneCode(this); };
        div.innerHTML = `<span>${c.flag}</span><span class="picker-item-name">${c.name}</span><span class="picker-item-code">${c.phone}</span>`;
        list.appendChild(div);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'phone-remove-btn';
    removeBtn.title = 'সরান';
    removeBtn.textContent = '✕';
    removeBtn.onclick = function () {
        outer.remove();
        window.phoneRowCount = Math.max(1, (window.phoneRowCount || 2) - 1);
    };

    outer.appendChild(pickerWrap);
    outer.appendChild(removeBtn);
    container.appendChild(outer);
};