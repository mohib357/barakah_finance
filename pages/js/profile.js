// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — PROFILE PAGE JS
// ═══════════════════════════════════════════════════════════

const API = 'http://localhost:3001/api';
let currentUser = null;
let profileData  = {};
let cropperInst  = null;
let cropMode     = 'photo'; // 'photo' | 'signature'

// ─── Bangladesh Geo Data (simplified) ───
const GEO = {
  divisions: [
    {id:'1',name:'ঢাকা'},{id:'2',name:'চট্টগ্রাম'},{id:'3',name:'রাজশাহী'},
    {id:'4',name:'খুলনা'},{id:'5',name:'বরিশাল'},{id:'6',name:'সিলেট'},
    {id:'7',name:'রংপুর'},{id:'8',name:'ময়মনসিংহ'}
  ],
  districts: {
    '1':['ঢাকা','গাজীপুর','নারায়ণগঞ্জ','টাঙ্গাইল','কিশোরগঞ্জ','মানিকগঞ্জ','মুন্সিগঞ্জ','রাজবাড়ী','মাদারীপুর','গোপালগঞ্জ','ফরিদপুর','শরীয়তপুর'],
    '2':['চট্টগ্রাম','কক্সবাজার','রাঙ্গামাটি','বান্দরবান','খাগড়াছড়ি','ফেনী','লক্ষ্মীপুর','নোয়াখালী','চাঁদপুর','কুমিল্লা','ব্রাহ্মণবাড়িয়া'],
    '3':['রাজশাহী','চাঁপাইনবাবগঞ্জ','নওগাঁ','নাটোর','পাবনা','সিরাজগঞ্জ','বগুড়া','জয়পুরহাট'],
    '4':['খুলনা','বাগেরহাট','সাতক্ষীরা','যশোর','নড়াইল','মাগুরা','ঝিনাইদহ','চুয়াডাঙ্গা','কুষ্টিয়া','মেহেরপুর'],
    '5':['বরিশাল','ভোলা','পটুয়াখালী','পিরোজপুর','ঝালকাঠি','বরগুনা'],
    '6':['সিলেট','মৌলভীবাজার','হবিগঞ্জ','সুনামগঞ্জ'],
    '7':['রংপুর','কুড়িগ্রাম','গাইবান্ধা','লালমনিরহাট','নীলফামারী','ঠাকুরগাঁও','পঞ্চগড়','দিনাজপুর'],
    '8':['ময়মনসিংহ','নেত্রকোনা','শেরপুর','জামালপুর']
  },
  upazilas: {
    'লালমনিরহাট':['সদর','আদিতমারী','কালীগঞ্জ','হাতীবান্ধা','পাটগ্রাম'],
    'ঢাকা':['সদর','মিরপুর','উত্তরা','গুলশান','ধানমন্ডি','মোহাম্মদপুর','তেজগাঁও'],
    'চট্টগ্রাম':['সদর','বন্দর','হালিশহর','পাহাড়তলী','চান্দগাঁও'],
    'রাজশাহী':['সদর','বোয়ালিয়া','মতিহার','শাহমখদুম'],
  },
  postOffices: {
    'আদিতমারী':['আদিতমারী - ৫৫৩০','মহিষখোচা - ৫৫৩১','বড়বাড়ী - ৫৫৩২'],
  }
};

// ─── INIT ───
document.addEventListener('DOMContentLoaded', initProfile);

async function initProfile() {
  currentUser = (typeof DB !== 'undefined') ? DB.getSession() : null;
  if (!currentUser) { window.location.href = '../index.html'; return; }

  // Load fresh data
  try {
    const res = await fetch(`${_PROFILE_API}/users/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { profileData = await res.json(); }
    else profileData = currentUser;
  } catch (_) { profileData = currentUser; }

  fillForm();
  updateProgress();
  loadDivisions();
  renderPhoneList(profileData.phones || [profileData.phone].filter(Boolean));
  renderSocialList(profileData.socialLinks || []);
}

// ─── Fill form fields ───
function fillForm() {
  const s = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = v || ''; };
  const nameParts = (profileData.name || '').split(' ');
  s('pfFirstNameBn', nameParts[0] || profileData.firstName || '');
  s('pfLastNameBn',  nameParts.slice(1).join(' ') || profileData.lastName || '');
  s('pfFirstNameEn', profileData.firstNameEn || '');
  s('pfLastNameEn',  profileData.lastNameEn || '');
  s('pfFatherBn',    profileData.fatherName || '');
  s('pfFatherEn',    profileData.fatherNameEn || '');
  s('pfMotherBn',    profileData.motherName || '');
  s('pfMotherEn',    profileData.motherNameEn || '');
  s('pfDob',         profileData.dob || '');
  s('pfGender',      profileData.gender || '');
  s('pfNid',         profileData.nid || '');
  s('pfBlood',       profileData.bloodGroup || '');
  s('pfProfession',  profileData.profession || '');
  s('secUsername',   profileData.username || '');

  // Photo preview
  if (profileData.photo) {
    const prev = document.getElementById('photoPreview');
    if (prev) prev.innerHTML = `<img src="${profileData.photo}" style="width:100%;height:100%;object-fit:cover"/>`;
  }
  if (profileData.signature) {
    const prev = document.getElementById('signPreview');
    if (prev) prev.innerHTML = `<img src="${profileData.signature}" style="width:100%;height:100%;object-fit:contain"/>`;
  }
}

// ─── Progress calculation ───
function updateProgress() {
  const fields = ['name','phone','fatherName','motherName','address','dob','nid','gender','photo','bloodGroup'];
  let filled = 0;
  fields.forEach(f => { if (profileData[f]) filled++; });
  const pct = Math.round((filled / fields.length) * 100);
  const badge = document.getElementById('profilePctBadge');
  const fill  = document.getElementById('profileProgressFill');
  if (badge) { badge.textContent = pct + '%'; badge.className = `badge badge-${pct < 50 ? 'warning' : pct < 80 ? 'info' : 'success'}`; }
  if (fill)  fill.style.width = pct + '%';
}

// ─── Phone list ───
function renderPhoneList(phones) {
  const list = document.getElementById('phoneList');
  if (!list) return;
  list.innerHTML = '';
  (phones.length ? phones : ['']).forEach((ph, i) => addPhoneField(ph, i === 0 && phones.length === 1));
}

function addPhoneField(val = '', isPrimary = false) {
  const list = document.getElementById('phoneList');
  if (!list) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center';
  div.innerHTML = `
    <select style="width:90px;padding:10px 8px;border:1.5px solid var(--border-color);border-radius:8px;background:var(--bg-surface);font-family:var(--font-bangla);font-size:.85rem;color:var(--text-primary)">
      <option>🇧🇩 +880</option><option>🇸🇦 +966</option><option>🇦🇪 +971</option><option>🇬🇧 +44</option><option>🇺🇸 +1</option>
    </select>
    <input class="form-input phone-inp" style="flex:1" placeholder="01XXXXXXXXX" value="${val}"/>
    ${isPrimary ? '<span class="badge badge-green" style="flex-shrink:0">প্রাথমিক</span>' : '<button class="btn btn-sm btn-ghost" onclick="this.parentNode.remove()" style="flex-shrink:0">✕</button>'}`;
  list.appendChild(div);
}

// ─── Social list ───
const SOCIALS = [
  {key:'facebook',icon:'📘',label:'Facebook',placeholder:'fb.com/username'},
  {key:'whatsapp',icon:'💬',label:'WhatsApp',placeholder:'+8801XXXXXXXXX'},
  {key:'youtube',icon:'📺',label:'YouTube',placeholder:'youtube.com/@channel'},
  {key:'instagram',icon:'📸',label:'Instagram',placeholder:'instagram.com/username'},
  {key:'linkedin',icon:'💼',label:'LinkedIn',placeholder:'linkedin.com/in/username'},
  {key:'twitter',icon:'🐦',label:'Twitter/X',placeholder:'x.com/username'},
];

function renderSocialList(links) {
  const list = document.getElementById('socialList');
  if (!list) return;
  list.innerHTML = '';
  links.forEach(l => addSocialField(l.key, l.url));
}

function addSocialField(key = '', url = '') {
  const list = document.getElementById('socialList');
  if (!list) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center';

  const selOpts = SOCIALS.map(s => `<option value="${s.key}" ${s.key === key ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('');
  div.innerHTML = `
    <select style="width:160px;padding:10px 8px;border:1.5px solid var(--border-color);border-radius:8px;background:var(--bg-surface);font-family:var(--font-bangla);font-size:.85rem;color:var(--text-primary)">${selOpts}</select>
    <input class="form-input social-url" style="flex:1" placeholder="লিংক বা ইউজারনেম" value="${url}"/>
    <button class="btn btn-sm btn-ghost" onclick="this.parentNode.remove()">✕</button>`;
  list.appendChild(div);
}

// ─── Geo Address ───
function loadDivisions() {
  const sel = document.getElementById('adDivision');
  const paSel = document.getElementById('paDiv');
  if (!sel) return;
  const opts = GEO.divisions.map(d => `<option value="${d.id}" data-name="${d.name}">${d.name}</option>`).join('');
  sel.innerHTML = '<option value="">বেছে নিন</option>' + opts;
  if (paSel) paSel.innerHTML = sel.innerHTML;

  // Restore saved
  if (profileData.address?.division) {
    sel.value = GEO.divisions.find(d => d.name === profileData.address.division)?.id || '';
    loadDistricts();
  }
}

function loadDistricts() {
  const divSel = document.getElementById('adDivision');
  const distSel = document.getElementById('adDistrict');
  if (!divSel || !distSel) return;
  const divName = divSel.options[divSel.selectedIndex]?.dataset?.name || '';
  const divId   = divSel.value;
  const dists   = GEO.districts[divId] || [];
  distSel.innerHTML = '<option value="">বেছে নিন</option>' + dists.map(d => `<option>${d}</option>`).join('');
  document.getElementById('adUpazila').innerHTML = '<option value="">বেছে নিন</option>';
  document.getElementById('adUnion').innerHTML   = '<option value="">বেছে নিন</option>';
  if (profileData.address?.district) { distSel.value = profileData.address.district; loadUpazilas(); }
}

function loadUpazilas() {
  const district = document.getElementById('adDistrict')?.value;
  const upaSel   = document.getElementById('adUpazila');
  if (!upaSel || !district) return;
  const upazilas = GEO.upazilas[district] || ['সদর','উপজেলা-১','উপজেলা-২'];
  upaSel.innerHTML = '<option value="">বেছে নিন</option>' + upazilas.map(u => `<option>${u}</option>`).join('');
  if (profileData.address?.upazila) { upaSel.value = profileData.address.upazila; loadUnions(); }
}

function loadUnions() {
  const sel = document.getElementById('adUnion');
  if (!sel) return;
  sel.innerHTML = '<option value="">বেছে নিন</option><option>ইউনিয়ন-১</option><option>ইউনিয়ন-২</option>';
  loadPostOffices();
}

function loadPostOffices() {
  const upazila = document.getElementById('adUpazila')?.value;
  const sel     = document.getElementById('adPostOffice');
  if (!sel) return;
  const pos = GEO.postOffices[upazila] || [`${upazila || ''} - ০০০০`];
  sel.innerHTML = '<option value="">বেছে নিন</option>' + pos.map(p => `<option data-code="${p.split(' - ')[1]||''}">${p}</option>`).join('');
}

function setPostCode() {
  const sel = document.getElementById('adPostOffice');
  const inp = document.getElementById('adPostCode');
  if (!sel || !inp) return;
  inp.value = sel.options[sel.selectedIndex]?.dataset?.code || '';
}

function copyCurrent() {
  const same = document.getElementById('sameAsCurrent')?.checked;
  const fields = document.getElementById('permAddressFields');
  if (!fields) return;
  if (same) {
    document.getElementById('paDiv').value  = document.getElementById('adDivision')?.value || '';
    document.getElementById('paDist').value = document.getElementById('adDistrict')?.value || '';
    document.getElementById('paUpa').value  = document.getElementById('adUpazila')?.value || '';
    document.getElementById('paVillage').value = document.getElementById('adVillageBn')?.value || '';
    fields.style.opacity = '.5';
    fields.style.pointerEvents = 'none';
  } else {
    fields.style.opacity = '';
    fields.style.pointerEvents = '';
  }
}

function handleProfessionChange() {
  const sel = document.getElementById('pfProfession');
  const grp = document.getElementById('pfProfessionOtherGroup');
  if (!grp) return;
  grp.classList.toggle('hidden', sel?.value !== 'other');
}

// ─── IMAGE CROPPER ───
function openCropper(mode) {
  cropMode = mode;
  const input = document.getElementById(mode === 'photo' ? 'photoInput' : 'signInput');
  const file  = input?.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img   = document.getElementById('cropperImg');
    const title = document.getElementById('cropperTitle');
    img.src     = e.target.result;
    if (title) title.textContent = mode === 'photo' ? '📸 প্রোফাইল ছবি ক্রপ করুন' : '✍️ স্বাক্ষর ক্রপ করুন';
    document.getElementById('cropperModal').classList.remove('hidden');

    setTimeout(() => {
      if (cropperInst) cropperInst.destroy();
      cropperInst = new Cropper(img, {
        aspectRatio: mode === 'photo' ? 300 / 280 : 300 / 80,
        viewMode: 1,
        dragMode: 'move',
        guides: true,
        center: true,
        autoCropArea: .9,
      });
    }, 200);
  };
  reader.readAsDataURL(file);
}

function closeCropper() {
  if (cropperInst) { cropperInst.destroy(); cropperInst = null; }
  document.getElementById('cropperModal').classList.add('hidden');
}

function applyCrop() {
  if (!cropperInst) return;
  const isPhoto = cropMode === 'photo';
  const canvas  = cropperInst.getCroppedCanvas({ width: isPhoto ? 300 : 300, height: isPhoto ? 280 : 80, fillColor: '#fff' });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  if (isPhoto) {
    const prev = document.getElementById('photoPreview');
    if (prev) prev.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover"/>`;
    profileData._photoCrop = dataUrl;
  } else {
    const prev = document.getElementById('signPreview');
    if (prev) prev.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:contain"/>`;
    profileData._signCrop = dataUrl;
  }
  showToast('ছবি ক্রপ হয়েছে। সংরক্ষণ করুন।', 'success');
  closeCropper();
}

function previewNid(side, input) {
  const file = input.files[0];
  if (!file) return;
  const id   = side === 'front' ? 'nidFrontPreview' : 'nidBackPreview';
  const prev = document.getElementById(id);
  if (!prev) return;
  const reader = new FileReader();
  reader.onload = e => {
    profileData[side === 'front' ? '_nidFront' : '_nidBack'] = e.target.result;
    if (file.type === 'application/pdf') {
      prev.innerHTML = `<div style="font-size:.8rem;color:var(--text-muted)">📄 PDF আপলোড হয়েছে</div>`;
    } else {
      prev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:contain"/>`;
    }
  };
  reader.readAsDataURL(file);
}

// ─── SAVE FUNCTIONS ───
async function saveBasicInfo() {
  const phones = [...document.querySelectorAll('.phone-inp')].map(i => i.value.trim()).filter(Boolean);
  const data = {
    name: (document.getElementById('pfFirstNameBn')?.value || '') + ' ' + (document.getElementById('pfLastNameBn')?.value || ''),
    firstName: document.getElementById('pfFirstNameBn')?.value?.trim(),
    lastName:  document.getElementById('pfLastNameBn')?.value?.trim(),
    firstNameEn: document.getElementById('pfFirstNameEn')?.value?.trim(),
    lastNameEn:  document.getElementById('pfLastNameEn')?.value?.trim(),
    fatherName: document.getElementById('pfFatherBn')?.value?.trim(),
    fatherNameEn: document.getElementById('pfFatherEn')?.value?.trim(),
    motherName: document.getElementById('pfMotherBn')?.value?.trim(),
    motherNameEn: document.getElementById('pfMotherEn')?.value?.trim(),
    dob:        document.getElementById('pfDob')?.value,
    gender:     document.getElementById('pfGender')?.value,
    nid:        document.getElementById('pfNid')?.value?.trim(),
    bloodGroup: document.getElementById('pfBlood')?.value,
    profession: document.getElementById('pfProfession')?.value === 'other'
                ? document.getElementById('pfProfessionOther')?.value
                : document.getElementById('pfProfession')?.value,
    phones,
  };
  data.name = data.name.trim();
  await patchUser(data);
}

async function saveAddress() {
  const divSel = document.getElementById('adDivision');
  const data = {
    address: {
      country: 'Bangladesh',
      division: divSel?.options[divSel.selectedIndex]?.dataset?.name || divSel?.value,
      district:  document.getElementById('adDistrict')?.value,
      upazila:   document.getElementById('adUpazila')?.value,
      union:     document.getElementById('adUnion')?.value,
      postOffice: document.getElementById('adPostOffice')?.value,
      postCode:   document.getElementById('adPostCode')?.value,
      villageBn:  document.getElementById('adVillageBn')?.value?.trim(),
      villageEn:  document.getElementById('adVillageEn')?.value?.trim(),
    },
    permanentAddress: {
      division: document.getElementById('paDiv')?.value,
      district: document.getElementById('paDist')?.value,
      upazila:  document.getElementById('paUpa')?.value,
      village:  document.getElementById('paVillage')?.value?.trim(),
    }
  };
  await patchUser(data);
}

async function savePhotos() {
  const data = {};
  if (profileData._photoCrop) data.photo     = profileData._photoCrop;
  if (profileData._signCrop)  data.signature  = profileData._signCrop;
  if (profileData._nidFront)  data.nidFront   = profileData._nidFront;
  if (profileData._nidBack)   data.nidBack    = profileData._nidBack;
  if (!Object.keys(data).length) { showToast('কোনো পরিবর্তন নেই।', 'info'); return; }
  await patchUser(data);
}

async function saveSocial() {
  const sels = document.querySelectorAll('#socialList select');
  const urls = document.querySelectorAll('#socialList .social-url');
  const links = [];
  sels.forEach((s, i) => { if (urls[i]?.value?.trim()) links.push({ key: s.value, url: urls[i].value.trim() }); });
  await patchUser({ socialLinks: links });
}

async function patchUser(data) {
  try {
    const res = await fetch(`${_PROFILE_API}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const updated = await res.json();
      profileData = { ...profileData, ...data };
      if (typeof DB !== 'undefined') DB.setSession({ ...currentUser, ...data });
      updateProgress();
      showToast('প্রোফাইল সংরক্ষিত হয়েছে!', 'success');
      return;
    }
  } catch (_) {}
  // Offline save
  profileData = { ...profileData, ...data };
  if (typeof DB !== 'undefined') {
    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx >= 0) { users[idx] = { ...users[idx], ...data }; DB.saveUsers(users); DB.setSession({ ...currentUser, ...data }); }
  }
  updateProgress();
  showToast('প্রোফাইল সংরক্ষিত (অফলাইন)।', 'success');
}

// ─── Security ───
let _unameTimer = null;
function checkUnameAvail() {
  clearTimeout(_unameTimer);
  const val = document.getElementById('secUsername')?.value?.trim();
  const status = document.getElementById('secUnameStatus');
  const hint   = document.getElementById('secUnameHint');
  if (!val || val === currentUser.username) { if (hint) hint.textContent = ''; return; }
  _unameTimer = setTimeout(async () => {
    let available = true;
    try {
      const res = await fetch(`${_PROFILE_API}/auth/check-username/${val}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) { const d = await res.json(); available = d.available; }
    } catch (_) { if (typeof DB !== 'undefined') available = DB.checkUsername(val); }
    if (status) status.textContent = available ? '✅' : '❌';
    if (hint)   hint.textContent   = available ? '✅ উপলব্ধ' : '❌ নেওয়া হয়েছে';
  }, 500);
}

async function changeUsername() {
  const uname = document.getElementById('secUsername')?.value?.trim();
  if (!uname) { showToast('নতুন ইউজারনেম দিন।', 'error'); return; }
  // Check 60-day policy
  const lastChange = profileData.usernameChangedAt;
  if (lastChange) {
    const diff = (Date.now() - new Date(lastChange)) / (1000 * 60 * 60 * 24);
    if (diff < 60) {
      showToast(`ইউজারনেম পরিবর্তন করতে আরও ${Math.ceil(60 - diff)} দিন অপেক্ষা করুন।`, 'warning');
      return;
    }
  }
  await patchUser({ username: uname, usernameChangedAt: new Date().toISOString() });
}

async function changePassword() {
  const oldPass  = document.getElementById('secOldPass')?.value;
  const newPass  = document.getElementById('secNewPass')?.value;
  const confPass = document.getElementById('secConfPass')?.value;
  if (!oldPass || !newPass || !confPass) { showToast('সব ফিল্ড পূরণ করুন।', 'error'); return; }
  if (newPass !== confPass) { showToast('পাসওয়ার্ড মিলছে না।', 'error'); return; }
  if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
    showToast('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, সংখ্যা ও অক্ষরসহ হতে হবে।', 'error'); return;
  }
  try {
    const res = await fetch(`${_PROFILE_API}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) { showToast('পাসওয়ার্ড পরিবর্তন হয়েছে!', 'success'); return; }
    const d = await res.json();
    showToast(d.error || 'ব্যর্থ হয়েছে।', 'error');
  } catch (_) { showToast('সার্ভার সংযোগ নেই।', 'error'); }
}

// ─── Tab switching ───
function switchProfileTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#profileTabs .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id)?.classList.add('active');
  if (btn) btn.classList.add('active');
}

function togglePass(id) { const el = document.getElementById(id); if (el) el.type = el.type === 'password' ? 'text' : 'password'; }
