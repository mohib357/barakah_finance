// ===== BARAKAH FINANCE - FORM.JS =====
// All form logic: theme, lang, address, upload, cropper, submit, PDF

// ─── STATE ───
let currentLang = 'bn';
let currentCropTarget = null; // 'photo' | 'sig'
let cropperInstance = null;
let cropW = 300, cropH = 280, cropMaxKB = 300;
let formData = {}; // collected on submit
let submittedFormData = null;

// NID files
let applicantNIDFiles = [];
let nomineeNIDFiles = [];

// ─── ON LOAD ───
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setDate();
  populateDivisions();
  updateStepBar(0);
  // auto-update progress as user fills form
  document.querySelectorAll('.form-input, input[type="checkbox"], input[type="file"]')
    .forEach(el => el.addEventListener('change', updateProgress));
});

// ─── THEME ───
function initTheme() {
  const saved = localStorage.getItem('bf_theme') || 'light';
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    document.getElementById('themeToggle').classList.add('active');
  }
}
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.documentElement.classList.toggle('dark', isDark);
  document.getElementById('themeToggle').classList.toggle('active', isDark);
  localStorage.setItem('bf_theme', isDark ? 'dark' : 'light');
}

// ─── LANGUAGE ───
function changeLang(lang) {
  currentLang = lang;
  const t = TRANSLATIONS[lang];
  document.getElementById('hdr-title').textContent = t.hdrTitle;
  document.getElementById('hdr-slogan').textContent = t.hdrSlogan;
  document.getElementById('hdr-address').textContent = t.hdrAddress;
  document.getElementById('form-title').textContent = t.formTitle;
  document.getElementById('form-subtitle').textContent = t.formSubtitle;
  document.getElementById('sec1-title').textContent = t.sec1Title;
  document.getElementById('sec2-title').textContent = t.sec2Title;
  document.getElementById('sec3-title').textContent = t.sec3Title;
  document.getElementById('sec4-title').textContent = t.sec4Title;
  document.getElementById('lbl-submit').textContent = t.lblSubmit;
  document.getElementById('admin-link').textContent = t.adminLink;

  // RTL for Arabic
  document.body.classList.toggle('lang-ar', lang === 'ar');
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// ─── DATE ───
function setDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateEl = document.getElementById('submitDate');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('bn-BD', options);
  }
}

// ─── STEP PROGRESS ───
function updateProgress() {
  const filled = [
    document.getElementById('applicantNameBn')?.value,
    document.getElementById('applicantNameEn')?.value,
    document.getElementById('nidNumber')?.value,
    document.getElementById('dob')?.value,
    document.getElementById('addrVillage')?.value,
    document.getElementById('nomineeName_bn')?.value,
    document.getElementById('termsAgree')?.checked ? '1' : '',
  ];
  const count = filled.filter(v => v && v.length > 0).length;
  const step = Math.min(3, Math.floor((count / 7) * 4));
  updateStepBar(step);
}
function updateStepBar(active) {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('sd' + (i + 1));
    if (!d) continue;
    d.className = 'step-dot';
    if (i < active) d.classList.add('done');
    else if (i === active) d.classList.add('active');
  }
}

// ─── OCCUPATION / INCOME CUSTOM ───
function handleOccChange(sel, customInputId) {
  const custom = document.getElementById(customInputId);
  if (sel.value === 'অন্যান্য' || sel.value === 'অন্যান্য') {
    custom.classList.remove('hidden');
    custom.required = true;
  } else {
    custom.classList.add('hidden');
    custom.required = false;
    custom.value = '';
  }
}

// ─── ADDRESS CASCADE ───
function populateDivisions() {
  const sel = document.getElementById('addrDivision');
  sel.innerHTML = '<option value="">-- বিভাগ --</option>';
  Object.keys(BD_DATA).forEach(div => {
    const o = document.createElement('option');
    o.value = div; o.textContent = div;
    sel.appendChild(o);
  });
  // default to Rangpur
  sel.value = 'রংপুর';
  populateDistricts();
}
function populateDistricts() {
  const div = document.getElementById('addrDivision').value;
  const sel = document.getElementById('addrDistrict');
  sel.innerHTML = '<option value="">-- জেলা --</option>';
  document.getElementById('addrThana').innerHTML = '<option value="">-- থানা/উপজেলা --</option>';
  document.getElementById('addrPost').innerHTML = '<option value="">-- পোস্ট অফিস --</option>';
  document.getElementById('addrPostCode').value = '';
  if (!BD_DATA[div]) return;
  Object.keys(BD_DATA[div]).forEach(dist => {
    const o = document.createElement('option');
    o.value = dist; o.textContent = dist;
    sel.appendChild(o);
  });
  // default Lalmonirhat
  if (div === 'রংপুর') { sel.value = 'লালমনিরহাট'; populateThanas(); }
}
function populateThanas() {
  const div = document.getElementById('addrDivision').value;
  const dist = document.getElementById('addrDistrict').value;
  const sel = document.getElementById('addrThana');
  sel.innerHTML = '<option value="">-- থানা/উপজেলা --</option>';
  document.getElementById('addrPost').innerHTML = '<option value="">-- পোস্ট অফিস --</option>';
  document.getElementById('addrPostCode').value = '';
  if (!BD_DATA[div] || !BD_DATA[div][dist]) return;
  Object.keys(BD_DATA[div][dist]).forEach(thana => {
    const o = document.createElement('option');
    o.value = thana; o.textContent = thana;
    sel.appendChild(o);
  });
  // default Aditamari
  if (dist === 'লালমনিরহাট') { sel.value = 'আদিতমারী'; populatePostOffices(); }
}
function populatePostOffices() {
  const div = document.getElementById('addrDivision').value;
  const dist = document.getElementById('addrDistrict').value;
  const thana = document.getElementById('addrThana').value;
  const sel = document.getElementById('addrPost');
  sel.innerHTML = '<option value="">-- পোস্ট অফিস --</option>';
  document.getElementById('addrPostCode').value = '';
  const posts = BD_DATA[div]?.[dist]?.[thana];
  if (!posts) return;
  posts.forEach(p => {
    const o = document.createElement('option');
    o.value = p.code; o.textContent = p.name;
    o.dataset.code = p.code;
    sel.appendChild(o);
  });
}
function fillPostCode() {
  const sel = document.getElementById('addrPost');
  const chosen = sel.options[sel.selectedIndex];
  document.getElementById('addrPostCode').value = chosen?.dataset?.code || chosen?.value || '';
}
function copyCurrAddr() {
  const same = document.getElementById('sameAddrCheck').checked;
  if (same) {
    const div = document.getElementById('addrDivision').value;
    const dist = document.getElementById('addrDistrict').value;
    const thana = document.getElementById('addrThana').value;
    const post = document.getElementById('addrPost').options[document.getElementById('addrPost').selectedIndex]?.textContent || '';
    const code = document.getElementById('addrPostCode').value;
    const vill = document.getElementById('addrVillage').value;
    document.getElementById('permanentAddress').value = `${vill}, ${post} - ${code}, ${thana}, ${dist}, ${div}`;
  }
}

// ─── PHONE ───
let phoneCount = 1;
function addPhone() {
  if (phoneCount >= 3) { showToast('সর্বোচ্চ ৩টি নম্বর দেওয়া যাবে', '#C9A227'); return; }
  phoneCount++;
  const container = document.getElementById('phoneContainer');
  const row = document.createElement('div');
  row.className = 'phone-row mb-2';
  row.id = 'phone-row-' + (phoneCount - 1);
  row.innerHTML = `
    <select class="country-code-sel">
      <option value="+880" data-digits="11">🇧🇩 +880</option>
      <option value="+91" data-digits="10">🇮🇳 +91</option>
      <option value="+1" data-digits="10">🇺🇸 +1</option>
      <option value="+44" data-digits="10">🇬🇧 +44</option>
      <option value="+966" data-digits="9">🇸🇦 +966</option>
      <option value="+971" data-digits="9">🇦🇪 +971</option>
    </select>
    <input type="tel" class="form-input flex-1" placeholder="মোবাইল নম্বর (ইংরেজিতে)"
      inputmode="numeric" oninput="validatePhone(this)" />
    <button type="button" onclick="this.parentElement.remove(); phoneCount--;"
      class="text-red-500 text-xl font-bold px-2" title="সরান">✕</button>
  `;
  container.appendChild(row);
}
function validatePhone(input) {
  // Only English digits
  input.value = input.value.replace(/[^\d]/g, '');
  const sel = input.previousElementSibling;
  if (sel && sel.classList.contains('country-code-sel')) {
    const digits = parseInt(sel.selectedOptions[0]?.dataset?.digits || '11');
    if (input.value.length > digits) input.value = input.value.slice(0, digits);
  }
}

// ─── DRAG & DROP HELPERS ───
function handleDrag(event, zoneId) {
  event.preventDefault();
  document.getElementById(zoneId)?.classList.add('dragover');
}
function handleDragLeave(event, zoneId) {
  document.getElementById(zoneId)?.classList.remove('dragover');
}
function handleDrop(event, inputId, zoneId) {
  event.preventDefault();
  document.getElementById(zoneId)?.classList.remove('dragover');
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const input = document.getElementById(inputId);
    // Create a DataTransfer to assign files to input
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  }
}

// ─── NID UPLOAD ───
function handleNIDUpload(input, who) {
  const files = Array.from(input.files);
  const previewBox = document.getElementById(who === 'applicant' ? 'nidPreviewBox' : 'nomNIDPreviewBox');
  previewBox.innerHTML = '';
  const storage = who === 'applicant' ? applicantNIDFiles : nomineeNIDFiles;
  storage.length = 0;

  files.forEach(file => {
    if (file.size > 2 * 1024 * 1024) {
      showToast('ফাইলটি ২ MB এর বেশি।', '#e53e3e');
      return;
    }
    storage.push(file);
    const reader = new FileReader();
    reader.onload = e => {
      const isImg = file.type.startsWith('image/');
      const thumb = document.createElement(isImg ? 'img' : 'div');
      if (isImg) {
        thumb.src = e.target.result;
        thumb.className = 'nid-preview-thumb';
        thumb.alt = 'NID';
      } else {
        thumb.className = 'nid-preview-thumb flex items-center justify-center bg-red-50 border border-gold-500 rounded text-xs text-red-600 text-center p-1';
        thumb.innerHTML = '📄 PDF';
      }
      previewBox.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

// ─── IMAGE CROPPER ───
function openCropper(input, target, w, h, maxKB) {
  const file = input.files[0];
  if (!file) return;
  currentCropTarget = target;
  cropW = w; cropH = h; cropMaxKB = maxKB;

  // Show face guide only for photo
  const fg = document.getElementById('faceGuide');
  if (fg) fg.classList.toggle('hidden', target !== 'photo');
  document.getElementById('cropperTitle').textContent = target === 'photo' ? 'পাসপোর্ট ছবি ক্রপ করুন' : 'স্বাক্ষর ক্রপ করুন';

  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('cropperImg');
    img.src = e.target.result;
    document.getElementById('cropperModal').classList.remove('hidden');
    // Destroy previous
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
    setTimeout(() => {
      cropperInstance = new Cropper(img, {
        aspectRatio: w / h,
        viewMode: 1,
        autoCropArea: 0.85,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        guides: true,
        highlight: false,
      });
    }, 100);
  };
  reader.readAsDataURL(file);
}
function closeCropper() {
  document.getElementById('cropperModal').classList.add('hidden');
  if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
}
function cropAndSave() {
  if (!cropperInstance) return;
  const canvas = cropperInstance.getCroppedCanvas({ width: cropW, height: cropH });

  // Compress if needed
  compressCanvas(canvas, cropMaxKB, (dataURL, wasCompressed) => {
    if (wasCompressed) showToast('Your image was too large, we optimized it for you!', '#C9A227');

    if (currentCropTarget === 'photo') {
      const prev = document.getElementById('photoPreview');
      prev.src = dataURL;
      prev.classList.remove('hidden');
      document.getElementById('photoPlaceholder').classList.add('hidden');
      formData.photoData = dataURL;
    } else if (currentCropTarget === 'sig') {
      const prev = document.getElementById('sigPreview');
      prev.src = dataURL;
      prev.classList.remove('hidden');
      document.getElementById('sigPlaceholder').classList.add('hidden');
      formData.sigData = dataURL;
    }
    closeCropper();
  });
}

// ─── IMAGE COMPRESSION ───
function compressCanvas(canvas, maxKB, callback) {
  const maxBytes = maxKB * 1024;
  let quality = 0.92;
  const tryCompress = () => {
    const dataURL = canvas.toDataURL('image/jpeg', quality);
    const bytes = Math.ceil((dataURL.length - 22) * 0.75);
    if (bytes <= maxBytes || quality <= 0.3) {
      callback(dataURL, quality < 0.88);
    } else {
      quality -= 0.08;
      tryCompress();
    }
  };
  tryCompress();
}

// ─── FORM SUBMIT ───
function submitForm() {
  // Validate required fields
  const required = [
    { id: 'applicantNameBn', label: 'আবেদনকারীর নাম (বাংলা)' },
    { id: 'applicantNameEn', label: 'Applicant Name (English)' },
    { id: 'fatherNameBn', label: 'পিতার নাম (বাংলা)' },
    { id: 'nidNumber', label: 'এনআইডি নম্বর' },
    { id: 'dob', label: 'জন্ম তারিখ' },
    { id: 'occupationSel', label: 'পেশা' },
    { id: 'incomeSel', label: 'আয়ের উৎস' },
    { id: 'addrVillage', label: 'বর্তমান ঠিকানা' },
    { id: 'permanentAddress', label: 'স্থায়ী ঠিকানা' },
    { id: 'nomineeName_bn', label: 'নমিনির নাম' },
    { id: 'nomineeRelation', label: 'নমিনির সম্পর্ক' },
  ];
  for (const r of required) {
    const el = document.getElementById(r.id);
    if (!el || !el.value.trim()) {
      showToast(`"${r.label}" পূরণ করুন`, '#e53e3e');
      el?.focus();
      return;
    }
  }
  if (!document.getElementById('termsAgree').checked) {
    showToast('শর্তাবলীতে সম্মতি দিন', '#e53e3e'); return;
  }
  if (!formData.sigData) {
    showToast('স্বাক্ষর আপলোড করুন', '#e53e3e'); return;
  }
  if (!formData.photoData) {
    showToast('পাসপোর্ট ছবি আপলোড করুন', '#e53e3e'); return;
  }

  // Collect NID number - only digits
  const nidVal = document.getElementById('nidNumber').value.replace(/[^\d]/g, '');
  if (nidVal.length < 10) {
    showToast('এনআইডি নম্বর সঠিক নয়', '#e53e3e'); return;
  }

  // Build data object
  const occ = document.getElementById('occupationSel').value;
  const occCustom = document.getElementById('occupationCustom').value;
  const inc = document.getElementById('incomeSel').value;
  const incCustom = document.getElementById('incomeCustom').value;

  const phones = [];
  document.querySelectorAll('#phoneContainer .phone-row').forEach(row => {
    const code = row.querySelector('.country-code-sel')?.value || '';
    const num = row.querySelector('input[type="tel"]')?.value || '';
    if (num) phones.push(code + num);
  });

  submittedFormData = {
    id: generateID(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
    approvals: { committee: [], secretary: false, vicePresident: false, president: false },
    memberID: '',
    // Applicant
    applicantNameBn: document.getElementById('applicantNameBn').value,
    applicantNameEn: document.getElementById('applicantNameEn').value,
    fatherNameBn: document.getElementById('fatherNameBn').value,
    fatherNameEn: document.getElementById('fatherNameEn').value,
    motherNameBn: document.getElementById('motherNameBn').value,
    motherNameEn: document.getElementById('motherNameEn').value,
    nidNumber: nidVal,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    occupation: occ === 'অন্যান্য' ? occCustom : occ,
    incomeSource: inc === 'অন্যান্য' ? incCustom : inc,
    currentAddress: buildAddress(),
    permanentAddress: document.getElementById('permanentAddress').value,
    phones,
    photoData: formData.photoData,
    sigData: formData.sigData,
    // Nominee
    nomineeName_bn: document.getElementById('nomineeName_bn').value,
    nomineeName_en: document.getElementById('nomineeName_en').value,
    nomineeFatherBn: document.getElementById('nomineeFatherBn').value,
    nomineeFatherEn: document.getElementById('nomineeFatherEn').value,
    nomineeRelation: document.getElementById('nomineeRelation').value,
    nomineeNID: document.getElementById('nomineeNID').value,
    nomineePhone: (document.getElementById('nomCountryCode').value || '') + (document.getElementById('nomineePhone').value || ''),
    nomineeAddress: document.getElementById('nomineeAddress').value,
  };

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem('bf_applications') || '[]');
  existing.push(submittedFormData);
  localStorage.setItem('bf_applications', JSON.stringify(existing));

  // Show success
  document.getElementById('success-ref').textContent = 'রেফারেন্স ID: ' + submittedFormData.id;
  document.getElementById('successModal').classList.remove('hidden');
}

function buildAddress() {
  const div = document.getElementById('addrDivision').value;
  const dist = document.getElementById('addrDistrict').value;
  const thana = document.getElementById('addrThana').value;
  const postSel = document.getElementById('addrPost');
  const post = postSel.options[postSel.selectedIndex]?.textContent || '';
  const code = document.getElementById('addrPostCode').value;
  const vill = document.getElementById('addrVillage').value;
  return [vill, post, code, thana, dist, div].filter(Boolean).join(', ');
}

function generateID() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'BF-' + ts + '-' + rnd;
}

// ─── PDF DOWNLOAD (Member Copy) ───
async function downloadMemberPDF() {
  if (!submittedFormData) { showToast('কোনো ডেটা নেই', '#e53e3e'); return; }
  showToast('পিডিএফ তৈরি হচ্ছে...', '#065F46');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Load Bangla font note: jsPDF standard fonts don't support Bangla
  // We'll use html2canvas to render an HTML page as PDF
  const printDiv = buildPrintHTML(submittedFormData);
  document.body.appendChild(printDiv);

  try {
    const canvas = await html2canvas(printDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
    });
    document.body.removeChild(printDiv);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfW = 210, pdfH = (canvas.height * 210) / canvas.width;
    const pageH = 297;

    let yPos = 0;
    let pageAdded = false;
    while (yPos < pdfH) {
      if (pageAdded) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, -yPos, pdfW, pdfH);
      yPos += pageH;
      pageAdded = true;
    }

    doc.save('barakah-finance-application-' + submittedFormData.id + '.pdf');
    showToast('পিডিএফ ডাউনলোড হয়েছে ✅', '#065F46');
  } catch (err) {
    if (document.body.contains(printDiv)) document.body.removeChild(printDiv);
    showToast('পিডিএফ তৈরিতে সমস্যা হয়েছে', '#e53e3e');
    console.error(err);
  }
}

function buildPrintHTML(d) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:-9999px;left:0;width:794px;background:#fff;font-family:"Noto Serif Bengali",serif;color:#111;padding:32px;box-sizing:border-box;';
  const fmt = (v) => v || '—';
  div.innerHTML = `
    <div style="text-align:center;border-bottom:3px solid #C9A227;padding-bottom:16px;margin-bottom:20px;">
      <h1 style="font-size:22px;color:#064E3B;margin:0;">বারাকাহ ফাইন্যান্স – Barakah Finance</h1>
      <p style="color:#C9A227;margin:4px 0 2px;">সুদমুক্ত লেনদেনে সমৃদ্ধি সবার</p>
      <p style="font-size:11px;color:#666;">আদিতমারী, লালমনিরহাট | +8801581093611 | barakahfinancebd.com</p>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
      <div>
        <h2 style="font-size:16px;color:#064E3B;margin:0 0 6px;">সদস্য পদের জন্য আবেদন ফরম</h2>
        <p style="font-size:11px;color:#555;margin:0;">রেফারেন্স: <strong>${d.id}</strong></p>
        <p style="font-size:11px;color:#555;margin:2px 0 0;">জমার তারিখ: ${new Date(d.submittedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${d.memberID ? `<p style="font-size:12px;color:#064E3B;font-weight:bold;margin:4px 0 0;">সদস্য আইডি: ${d.memberID}</p>` : ''}
      </div>
      ${d.photoData ? `<img src="${d.photoData}" style="width:80px;height:96px;object-fit:cover;border:2px solid #C9A227;border-radius:4px;" />` : '<div style="width:80px;height:96px;border:2px dashed #aaa;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">ছবি নেই</div>'}
    </div>

    <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin-bottom:14px;">
      <h3 style="font-size:13px;background:#064E3B;color:#fff;padding:5px 10px;border-radius:4px;margin:0 0 10px;">১। আবেদনকারীর ব্যক্তিগত তথ্য</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:4px 8px;width:40%;color:#065F46;font-weight:600;">আবেদনকারীর নাম (বাং)</td><td style="padding:4px 8px;">${fmt(d.applicantNameBn)}</td><td style="padding:4px 8px;width:40%;color:#065F46;font-weight:600;">Name (Eng)</td><td style="padding:4px 8px;">${fmt(d.applicantNameEn)}</td></tr>
        <tr style="background:#fff;"><td style="padding:4px 8px;color:#065F46;font-weight:600;">পিতার নাম (বাং)</td><td style="padding:4px 8px;">${fmt(d.fatherNameBn)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">Father (Eng)</td><td style="padding:4px 8px;">${fmt(d.fatherNameEn)}</td></tr>
        <tr><td style="padding:4px 8px;color:#065F46;font-weight:600;">মাতার নাম (বাং)</td><td style="padding:4px 8px;">${fmt(d.motherNameBn)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">Mother (Eng)</td><td style="padding:4px 8px;">${fmt(d.motherNameEn)}</td></tr>
        <tr style="background:#fff;"><td style="padding:4px 8px;color:#065F46;font-weight:600;">এনআইডি নম্বর</td><td style="padding:4px 8px;">${fmt(d.nidNumber)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">জন্ম তারিখ</td><td style="padding:4px 8px;">${fmt(d.dob)}</td></tr>
        <tr><td style="padding:4px 8px;color:#065F46;font-weight:600;">পেশা</td><td style="padding:4px 8px;">${fmt(d.occupation)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">আয়ের উৎস</td><td style="padding:4px 8px;">${fmt(d.incomeSource)}</td></tr>
        <tr style="background:#fff;"><td style="padding:4px 8px;color:#065F46;font-weight:600;">বর্তমান ঠিকানা</td><td colspan="3" style="padding:4px 8px;">${fmt(d.currentAddress)}</td></tr>
        <tr><td style="padding:4px 8px;color:#065F46;font-weight:600;">স্থায়ী ঠিকানা</td><td colspan="3" style="padding:4px 8px;">${fmt(d.permanentAddress)}</td></tr>
        <tr style="background:#fff;"><td style="padding:4px 8px;color:#065F46;font-weight:600;">মোবাইল নম্বর</td><td colspan="3" style="padding:4px 8px;">${(d.phones || []).join(' / ')}</td></tr>
      </table>
    </div>

    <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin-bottom:14px;">
      <h3 style="font-size:13px;background:#064E3B;color:#fff;padding:5px 10px;border-radius:4px;margin:0 0 10px;">২। নমিনির তথ্য</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr><td style="padding:4px 8px;width:40%;color:#065F46;font-weight:600;">নমিনির নাম (বাং)</td><td style="padding:4px 8px;">${fmt(d.nomineeName_bn)}</td><td style="padding:4px 8px;width:30%;color:#065F46;font-weight:600;">Name (Eng)</td><td style="padding:4px 8px;">${fmt(d.nomineeName_en)}</td></tr>
        <tr style="background:#fff;"><td style="padding:4px 8px;color:#065F46;font-weight:600;">সম্পর্ক</td><td style="padding:4px 8px;">${fmt(d.nomineeRelation)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">মোবাইল</td><td style="padding:4px 8px;">${fmt(d.nomineePhone)}</td></tr>
        <tr><td style="padding:4px 8px;color:#065F46;font-weight:600;">এনআইডি</td><td style="padding:4px 8px;">${fmt(d.nomineeNID)}</td><td style="padding:4px 8px;color:#065F46;font-weight:600;">ঠিকানা</td><td style="padding:4px 8px;">${fmt(d.nomineeAddress)}</td></tr>
      </table>
    </div>

    <div style="background:#fffbeb;border:1px solid #C9A227;border-radius:8px;padding:12px;font-size:11px;margin-bottom:16px;">
      <p style="font-weight:bold;margin:0 0 6px;color:#064E3B;">আর্থিক অঙ্গীকার ও শর্তাবলী:</p>
      <p style="margin:2px 0;">ক) প্রতি মাসের ১৫ তারিখের মধ্যে ২০০০ টাকা সঞ্চয় জমা দিতে বাধ্য থাকব।</p>
      <p style="margin:2px 0;">খ) নির্ধারিত সময়ে জমা না দিলে ১০০ টাকা বিলম্ব ফি প্রযোজ্য।</p>
      <p style="margin:2px 0;">গ) প্রাথমিক ৩ বছর সক্রিয় সদস্য থাকার প্রতিশ্রুতি।</p>
      <p style="margin:2px 0;">ঘ) সংস্থার শৃঙ্খলা লঙ্ঘনে সদস্যপদ বাতিলযোগ্য।</p>
    </div>

    <!-- Signature row -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
      <div>
        <p style="font-size:11px;color:#555;margin:0 0 4px;">আবেদনকারীর স্বাক্ষর:</p>
        ${d.sigData ? `<img src="${d.sigData}" style="height:40px;width:150px;object-fit:contain;border-bottom:1px solid #333;" />` : '<div style="width:150px;border-bottom:1px solid #333;height:40px;"></div>'}
        <p style="font-size:10px;color:#777;margin:2px 0 0;">${new Date(d.submittedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="text-align:center;">
        <p style="font-size:10px;color:#555;margin:0 0 4px;">অফিস ব্যবহারের জন্য</p>
        <div style="border:1px solid #C9A227;padding:8px 20px;border-radius:4px;font-size:11px;">
          <p style="margin:0;color:#064E3B;">সদস্য আইডি: ___________</p>
          <p style="margin:4px 0 0;color:#064E3B;">অনুমোদনের তারিখ: ________</p>
        </div>
      </div>
    </div>

    <!-- Approval row -->
    <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:12px;border-top:1px dashed #C9A227;font-size:10px;color:#555;text-align:center;">
      <div><div style="width:100px;border-bottom:1px solid #333;margin:0 auto 4px;height:30px;"></div><p>সাধারণ সম্পাদক</p><p style="color:#aaa;">(সুপারিশকারী)</p></div>
      <div><div style="width:100px;border-bottom:1px solid #333;margin:0 auto 4px;height:30px;"></div><p>সহ-সভাপতি</p><p style="color:#aaa;">(অনুমোদনকারী)</p></div>
      <div><div style="width:100px;border-bottom:1px solid #333;margin:0 auto 4px;height:30px;"></div><p>সভাপতি</p><p style="color:#aaa;">(চূড়ান্ত অনুমোদন)</p></div>
    </div>
  `;
  return div;
}

// ─── TOAST ───
function showToast(msg, color = '#065F46') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = color;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}
