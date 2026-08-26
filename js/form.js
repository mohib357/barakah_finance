// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — MEMBERSHIP APPLICATION FORM JS
// ═══════════════════════════════════════════════════════════

const API = 'http://localhost:3001/api';
let currentStep = 1;
let formCropInst = null;
let formCropMode = 'photo';
const formData   = { photo: null, signature: null, nidFront: null, nidBack: null };

const DISTRICTS = {
  'ঢাকা':['ঢাকা','গাজীপুর','নারায়ণগঞ্জ','টাঙ্গাইল','কিশোরগঞ্জ','মানিকগঞ্জ','মুন্সিগঞ্জ','রাজবাড়ী','মাদারীপুর','গোপালগঞ্জ','ফরিদপুর','শরীয়তপুর'],
  'চট্টগ্রাম':['চট্টগ্রাম','কক্সবাজার','রাঙ্গামাটি','বান্দরবান','খাগড়াছড়ি','ফেনী','লক্ষ্মীপুর','নোয়াখালী','চাঁদপুর','কুমিল্লা','ব্রাহ্মণবাড়িয়া'],
  'রাজশাহী':['রাজশাহী','চাঁপাইনবাবগঞ্জ','নওগাঁ','নাটোর','পাবনা','সিরাজগঞ্জ','বগুড়া','জয়পুরহাট'],
  'খুলনা':['খুলনা','বাগেরহাট','সাতক্ষীরা','যশোর','নড়াইল','মাগুরা','ঝিনাইদহ','চুয়াডাঙ্গা','কুষ্টিয়া','মেহেরপুর'],
  'বরিশাল':['বরিশাল','ভোলা','পটুয়াখালী','পিরোজপুর','ঝালকাঠি','বরগুনা'],
  'সিলেট':['সিলেট','মৌলভীবাজার','হবিগঞ্জ','সুনামগঞ্জ'],
  'রংপুর':['রংপুর','কুড়িগ্রাম','গাইবান্ধা','লালমনিরহাট','নীলফামারী','ঠাকুরগাঁও','পঞ্চগড়','দিনাজপুর'],
  'ময়মনসিংহ':['ময়মনসিংহ','নেত্রকোনা','শেরপুর','জামালপুর'],
};

document.addEventListener('DOMContentLoaded', () => {
  const session = (typeof DB !== 'undefined') ? DB.getSession() : null;
  if (session) autoFillFromSession(session);
  loadProjects();
  // Set default start month to current
  const sm = document.getElementById('f3StartMonth');
  if (sm) sm.value = new Date().toISOString().slice(0, 7);
});

function autoFillFromSession(u) {
  const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
  const names = (u.name || '').split(' ');
  set('f1NameBn', u.name || '');
  set('f1NameEn', u.nameEn || '');
  set('f1Phone',  u.phone || '');
  set('f1Email',  u.email || '');
  set('f1Dob',    u.dob   || '');
  set('f1Nid',    u.nid   || '');
}

async function loadProjects() {
  const sel = document.getElementById('f3Project');
  if (!sel) return;
  try {
    const res = await fetch(`${API}/projects`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const d = await res.json();
      const projects = d.projects || [];
      sel.innerHTML = '<option value="">— প্রজেক্ট বেছে নিন —</option>' + projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      return;
    }
  } catch (_) {}
  sel.innerHTML = '<option value="">— কোনো প্রজেক্ট নেই —</option>';
}

function fillDistricts(divId, distId) {
  const div  = document.getElementById(divId)?.value;
  const dist = document.getElementById(distId);
  if (!dist) return;
  const list = DISTRICTS[div] || [];
  dist.innerHTML = '<option value="">বেছে নিন</option>' + list.map(d => `<option>${d}</option>`).join('');
}

function selectInvType(type) {
  document.querySelectorAll('.inv-option').forEach(o => o.classList.remove('selected'));
  const radios = document.querySelectorAll('input[name="invType"]');
  radios.forEach(r => { r.checked = r.value === type; if (r.value === type) r.closest('.inv-option').classList.add('selected'); });
  ['monthly','onetime','project'].forEach(t => {
    const el = document.getElementById(t + 'Details');
    if (el) el.style.display = t === type ? 'block' : 'none';
  });
}

function calcUnits() {
  const amount = parseFloat(document.getElementById('f3Amount')?.value) || 0;
  const el = document.getElementById('f3Units');
  if (el) el.textContent = amount >= 2000 ? `= ${(amount / 2000).toFixed(2)} ইউনিট` : '';
}

// ─── Step Navigation ───
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;
  if (n === 5) buildReview();

  document.getElementById('step' + currentStep)?.classList.remove('active');
  document.getElementById('step' + n)?.classList.add('active');

  // Update indicators
  for (let i = 1; i <= 5; i++) {
    const circle = document.getElementById('sdc' + i);
    const label  = document.getElementById('sdl' + i);
    const line   = document.getElementById('sl' + i);
    if (!circle) continue;
    if (i < n)  { circle.classList.add('done'); circle.classList.remove('active'); circle.textContent = '✓'; }
    else if (i === n) { circle.classList.remove('done'); circle.classList.add('active'); circle.textContent = i; }
    else        { circle.classList.remove('done','active'); circle.textContent = i; }
    if (label)  label.classList.toggle('active', i === n);
    if (line)   line.classList.toggle('done', i < n);
  }
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
  const req = (id) => { const el = document.getElementById(id); if (!el || !el.value.trim()) { el?.focus(); showToast(el?.previousElementSibling?.textContent?.replace(' *','') + ' পূরণ করুন।', 'error'); return false; } return true; };
  if (step === 1) return req('f1NameBn') && req('f1Father') && req('f1Phone') && req('f1Nid') && req('f1Div') && req('f1Dist') && req('f1Village');
  if (step === 2) return req('f2NomName') && req('f2NomPhone') && req('f2NomRel');
  if (step === 3) {
    const type = document.querySelector('input[name="invType"]:checked')?.value;
    if (!type) { showToast('বিনিয়োগের ধরন বেছে নিন।', 'error'); return false; }
    return true;
  }
  if (step === 4) {
    if (!formData.photo)     { showToast('ছবি আপলোড করুন।', 'error'); return false; }
    if (!formData.signature) { showToast('স্বাক্ষর আপলোড করুন।', 'error'); return false; }
    return true;
  }
  return true;
}

// ─── Review Builder ───
function buildReview() {
  const v  = (id) => document.getElementById(id)?.value?.trim() || '—';
  const row = (lbl, val) => `<div style="padding:8px;background:var(--bg-surface-2);border-radius:8px"><div style="font-size:.72rem;color:var(--text-muted)">${lbl}</div><div style="font-weight:600">${val}</div></div>`;

  document.getElementById('reviewPersonal').innerHTML = [
    row('নাম (বাংলা)', v('f1NameBn')), row('নাম (ইংরেজি)', v('f1NameEn')),
    row('পিতার নাম', v('f1Father')), row('মাতার নাম', v('f1Mother')),
    row('জন্ম তারিখ', v('f1Dob')), row('লিঙ্গ', v('f1Gender')),
    row('মোবাইল', v('f1Phone')), row('এনআইডি', v('f1Nid')),
    row('বিভাগ', v('f1Div')), row('জেলা', v('f1Dist')),
    row('উপজেলা', v('f1Upazila')), row('গ্রাম/বাসা', v('f1Village')),
  ].join('');

  document.getElementById('reviewNominee').innerHTML = [
    row('নাম', v('f2NomName')), row('সম্পর্ক', v('f2NomRel')),
    row('মোবাইল', v('f2NomPhone')), row('ঠিকানা', v('f2NomAddress')),
  ].join('');

  const type = document.querySelector('input[name="invType"]:checked')?.value;
  const labels = { monthly:'মাসিক সঞ্চয়', onetime:'এককালীন বিনিয়োগ', project:'প্রজেক্ট বিনিয়োগ' };
  document.getElementById('reviewInvest').innerHTML = `
    <div style="padding:12px;background:var(--bg-surface-2);border-radius:8px">
      <div style="font-weight:700;margin-bottom:6px">${labels[type] || '—'}</div>
      ${type === 'monthly' ? `<div>শুরুর মাস: ${v('f3StartMonth')}</div>` : ''}
      ${type === 'onetime' ? `<div>পরিমাণ: ৳ ${v('f3Amount')} = ${(parseFloat(v('f3Amount')) / 2000 || 0).toFixed(2)} ইউনিট</div>` : ''}
      ${type === 'project' ? `<div>পরিমাণ: ৳ ${v('f3ProjAmount')}</div>` : ''}
      <div style="margin-top:6px;font-size:.8rem;color:var(--text-muted)">ফরম ফি: ৳ ১০০ (পেমেন্ট অনুমোদনের পর)</div>
    </div>`;
}

// ─── Cropper ───
function openFormCropper(mode, input) {
  formCropMode = mode;
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('formCropImg');
    img.src = e.target.result;
    document.getElementById('formCropTitle').textContent = mode === 'photo' ? '📸 ছবি ক্রপ করুন' : '✍️ স্বাক্ষর ক্রপ করুন';
    document.getElementById('formCropperModal').classList.remove('hidden');
    setTimeout(() => {
      if (formCropInst) formCropInst.destroy();
      formCropInst = new Cropper(img, {
        aspectRatio: mode === 'photo' ? 300 / 280 : 300 / 80,
        viewMode: 1, autoCropArea: .9,
      });
    }, 200);
  };
  reader.readAsDataURL(file);
}

function closeFormCropper() {
  if (formCropInst) { formCropInst.destroy(); formCropInst = null; }
  document.getElementById('formCropperModal').classList.add('hidden');
}

function applyFormCrop() {
  if (!formCropInst) return;
  const isPhoto = formCropMode === 'photo';
  const canvas  = formCropInst.getCroppedCanvas({ width: isPhoto ? 300 : 300, height: isPhoto ? 280 : 80, fillColor: '#fff' });
  const dataUrl = canvas.toDataURL('image/jpeg', .85);
  formData[formCropMode === 'photo' ? 'photo' : 'signature'] = dataUrl;

  if (isPhoto) {
    document.getElementById('photoDisplayArea').innerHTML = `<img class="preview-photo" src="${dataUrl}" alt="ছবি"/>`;
  } else {
    document.getElementById('signDisplayArea').innerHTML = `<img class="preview-sign" src="${dataUrl}" alt="স্বাক্ষর"/>`;
  }
  closeFormCropper();
  showToast('ছবি ক্রপ হয়েছে!', 'success');
}

function previewFormNid(side, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    formData[side === 'front' ? 'nidFront' : 'nidBack'] = e.target.result;
    const areaId = side === 'front' ? 'nidFrontArea' : 'nidBackArea';
    const area = document.getElementById(areaId);
    if (!area) return;
    if (file.type === 'application/pdf') area.innerHTML = '<div style="font-size:1.5rem">📄</div><div style="font-size:.75rem;color:var(--text-muted)">PDF</div>';
    else area.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain;border-radius:8px"/>`;
  };
  reader.readAsDataURL(file);
}

// ─── Submit ───
async function submitApplication() {
  if (!document.getElementById('termsCheck')?.checked) {
    showToast('শর্তাবলিতে সম্মত হতে হবে।', 'error'); return;
  }

  const session = (typeof DB !== 'undefined') ? DB.getSession() : null;
  const type    = document.querySelector('input[name="invType"]:checked')?.value;

  const appId = 'APP-' + Date.now().toString(36).toUpperCase();

  const payload = {
    applicationId: appId,
    personalInfo: {
      nameBn:   document.getElementById('f1NameBn')?.value.trim(),
      nameEn:   document.getElementById('f1NameEn')?.value.trim(),
      father:   document.getElementById('f1Father')?.value.trim(),
      mother:   document.getElementById('f1Mother')?.value.trim(),
      dob:      document.getElementById('f1Dob')?.value,
      gender:   document.getElementById('f1Gender')?.value,
      phone:    document.getElementById('f1Phone')?.value.trim(),
      email:    document.getElementById('f1Email')?.value.trim(),
      nid:      document.getElementById('f1Nid')?.value.trim(),
      profession: document.getElementById('f1Profession')?.value,
      address: {
        division: document.getElementById('f1Div')?.value,
        district: document.getElementById('f1Dist')?.value,
        upazila:  document.getElementById('f1Upazila')?.value.trim(),
        village:  document.getElementById('f1Village')?.value.trim(),
      }
    },
    nominee: {
      name:    document.getElementById('f2NomName')?.value.trim(),
      father:  document.getElementById('f2NomFather')?.value.trim(),
      relation:document.getElementById('f2NomRel')?.value,
      phone:   document.getElementById('f2NomPhone')?.value.trim(),
      gender:  document.getElementById('f2NomGender')?.value,
      address: document.getElementById('f2NomAddress')?.value.trim(),
    },
    investment: {
      type,
      startMonth:  document.getElementById('f3StartMonth')?.value,
      amount:      parseFloat(document.getElementById('f3Amount')?.value) || 0,
      projectId:   document.getElementById('f3Project')?.value,
      projAmount:  parseFloat(document.getElementById('f3ProjAmount')?.value) || 0,
      referral:    document.getElementById('f3Referral')?.value.trim(),
    },
    photo:     formData.photo,
    signature: formData.signature,
    nidFront:  formData.nidFront,
    nidBack:   formData.nidBack,
    submittedBy: session?.id || null,
    status:    'pending',
    submittedAt: new Date().toISOString(),
  };

  const btn  = document.getElementById('submitBtn');
  const txt  = document.getElementById('submitTxt');
  const spin = document.getElementById('submitSpinner');
  if (btn) btn.disabled = true;
  if (txt) txt.textContent = 'জমা হচ্ছে...';
  spin?.classList.remove('hidden');

  let success = false;
  try {
    const res = await fetch(`${API}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) success = true;
  } catch (_) {}

  // Offline fallback
  if (!success && typeof DB !== 'undefined') {
    const apps = DB.get('bf_applications') || [];
    apps.push(payload);
    DB.set('bf_applications', apps);
    success = true;
  }

  if (btn) btn.disabled = false;
  if (txt) txt.textContent = '✅ আবেদন জমা দিন';
  spin?.classList.add('hidden');

  if (success) {
    document.getElementById('step5').classList.remove('active');
    document.getElementById('stepSuccess').classList.add('active');
    document.getElementById('appIdDisplay').textContent = appId;
    // Update step indicator
    for (let i = 1; i <= 5; i++) {
      const c = document.getElementById('sdc' + i);
      if (c) { c.classList.add('done'); c.classList.remove('active'); c.textContent = '✓'; }
    }
  } else {
    showToast('জমা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
  }
}
