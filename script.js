// Enhanced Site-wide script: invite handling, nav, gallery, uploads, and admin tools
const INVITE = 'https://discord.gg/XbR2fgFv';

// Enhanced gallery stats and filtering
let galleryData = [];
let jennaData = [];

// Gallery filtering functionality
function setupGalleryFilters() {
  const filters = document.querySelectorAll('[data-filter]');
  if (!filters.length) return;
  
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const category = filter.getAttribute('data-filter');
      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      filterGallery(category);
    });
  });
}

function filterGallery(category) {
  const grid = document.querySelector('.gallery-grid');
  if (!grid || !galleryData.length) return;
  
  let filtered = galleryData;
  if (category !== 'all') {
    filtered = galleryData.filter(img => {
      const name = img.uploader || img.filename || '';
      if (category === 'fan-art') return /art|draw|paint/i.test(name);
      if (category === 'edits') return /edit|crop|filter/i.test(name);
      if (category === 'memes') return /meme|fun|lol/i.test(name);
      if (category === 'recent') return true; // Would need timestamp logic
      return true;
    });
  }
  
  grid.innerHTML = '';
  filtered.forEach(img => {
    const el = document.createElement('img');
    el.src = img.url;
    el.loading = 'lazy';
    el.alt = img.uploader || 'fan upload';
    el.addEventListener('load', () => el.classList.add('loaded'));
    grid.appendChild(el);
  });
  
  hookGallery();
}

// Jenna image filtering
function setupJennaFilters() {
  const filters = document.querySelectorAll('[data-jenna-filter]');
  if (!filters.length) return;
  
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const category = filter.getAttribute('data-jenna-filter');
      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      filterJenna(category);
    });
  });
}

function filterJenna(category) {
  const grid = document.querySelector('.jenna-grid');
  if (!grid || !jennaData.length) return;
  
  let filtered = jennaData;
  if (category !== 'all') {
    filtered = jennaData.filter(img => {
      const url = img.url || '';
      if (category === 'red-carpet') return /redcarpet|event|award/i.test(url);
      if (category === 'casual') return /casual|street|daily/i.test(url);
      if (category === 'events') return /event|press|interview/i.test(url);
      if (category === 'behind-scenes') return /behind|bts|set/i.test(url);
      return true;
    });
  }
  
  grid.innerHTML = '';
  filtered.forEach(img => {
    const el = document.createElement('img');
    el.src = img.url;
    el.loading = 'lazy';
    el.alt = img.alt || 'jenna image';
    el.addEventListener('load', () => el.classList.add('loaded'));
    grid.appendChild(el);
  });
  
  hookGallery();
}

// Enhanced stats display
function updateGalleryStats() {
  const galleryCount = document.getElementById('galleryCount');
  const todayCount = document.getElementById('todayCount');
  
  if (galleryCount) {
    galleryCount.textContent = galleryData.length || '—';
  }
  
  if (todayCount) {
    const today = new Date().toDateString();
    const todayUploads = galleryData.filter(img => {
      const date = new Date(img.uploaded_at || 0).toDateString();
      return date === today;
    });
    todayCount.textContent = todayUploads.length || '0';
  }
}

function updateJennaStats() {
  const jennaCount = document.getElementById('jennaCount');
  const lastCollect = document.getElementById('lastCollect');
  
  if (jennaCount) {
    jennaCount.textContent = jennaData.length || '—';
  }
  
  if (lastCollect) {
    const now = new Date();
    lastCollect.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  }
}

// Channel color palette (used for badges and rows)
const COLOR_PALETTE = [
  'linear-gradient(90deg,#ff6b6b,#ff9aa2)',
  'linear-gradient(90deg,#7c5cff,#9b8cff)',
  'linear-gradient(90deg,#00d4ff,#63f5b5)',
  'linear-gradient(90deg,#ffd166,#ffb86b)',
  'linear-gradient(90deg,#ff9ad6,#7c5cff)'
];
function pickColor(key){ const s = String(key||'').split('').reduce((a,c)=>a + c.charCodeAt(0),0); return COLOR_PALETTE[s % COLOR_PALETTE.length]; }

async function fetchInviteStats({manual=false,retries=1}={}){
  const refreshBtn = document.getElementById('refreshCounts');
  const countSource = document.getElementById('countSource');
  const lastUpdated = document.getElementById('lastUpdated');
  const countEl = document.getElementById('memberCount');
  const onlineEl = document.getElementById('onlineCount');

  try{
    if(manual && refreshBtn){ refreshBtn.disabled = true; refreshBtn.classList.add('loading'); }
    if(countSource) countSource.textContent = 'Fetching...';

    const res = await fetch('/api/invite');
    if(!res.ok) throw new Error('Failed');
    const data = await res.json();

    if(countEl) countEl.textContent = data.approximate_member_count ? `${data.approximate_member_count.toLocaleString()} members` : '— members';
    if(onlineEl) onlineEl.textContent = data.approximate_presence_count ? `${data.approximate_presence_count.toLocaleString()} online` : '';
    if(data.guild && data.guild.name){
      const serverNameEl = document.getElementById('serverName');
      if(serverNameEl) serverNameEl.textContent = data.guild.name;
    }

    if(countSource) countSource.textContent = data && data.cached ? 'Invite API (cached)' : 'Invite API';
    if(lastUpdated) lastUpdated.textContent = data && data.fetched_at ? 'Last updated: ' + new Date(data.fetched_at * 1000).toLocaleTimeString() : 'Last updated: ' + new Date().toLocaleTimeString();
    return data;
  }catch(err){
    console.warn('Invite stats unavailable', err);
    if(retries > 0){
      // retry once after brief delay
      await new Promise(r=>setTimeout(r, 1000));
      return fetchInviteStats({manual, retries: retries - 1});
    }
    // final failure: show unavailable state
    if(countEl) countEl.textContent = 'Unavailable';
    if(onlineEl) onlineEl.textContent = '';
    if(countSource) countSource.textContent = 'Unavailable';
    if(lastUpdated) lastUpdated.textContent = 'Last updated: —';
    return null;
  }finally{
    if(manual && refreshBtn){ refreshBtn.disabled = false; refreshBtn.classList.remove('loading'); }
  }
}

// Simple confetti using canvas
function makeConfetti(){
  let c = document.getElementById('confettiCanvas');
  if(!c){ c = document.createElement('canvas'); c.id = 'confettiCanvas'; document.body.appendChild(c); }
  c.width = window.innerWidth; c.height = window.innerHeight;
  const ctx = c.getContext('2d');
  const pieces = [];
  const colors = ['#ff6b6b','#7c5cff','#00d4ff','#ffd166'];
  for(let i=0;i<80;i++) pieces.push({x:Math.random()*c.width,y:Math.random()*-c.height, vx:(Math.random()-0.5)*3, vy:Math.random()*3+2, size:Math.random()*6+4, color:colors[Math.floor(Math.random()*colors.length)], rot:Math.random()*360});
  let t = 0;
  function frame(){ ctx.clearRect(0,0,c.width,c.height); t+=1; pieces.forEach(p=>{ p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.rot+=0.2; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore(); });
    if(t<180){ requestAnimationFrame(frame); } else { ctx.clearRect(0,0,c.width,c.height); if(c.parentNode) c.parentNode.removeChild(c); }
  }
  requestAnimationFrame(frame);
}

async function recordJoinAndOpen(){
  try{ await fetch('/api/join',{method:'POST'}); }catch(e){console.warn('Join record failed',e)}
  // give a small visual reward for joining
  try{ makeConfetti(); }catch(e){ console.warn('Confetti failed', e); }
  window.open(INVITE,'_blank');
}

function copyInvite(btn){
  navigator.clipboard.writeText(INVITE).then(()=>{
    if(btn) btn.textContent = 'Copied!';
    setTimeout(()=>{ if(btn) btn.textContent = 'Copy Invite' },1500);
  }).catch(()=>alert('Copy failed — try selecting and copying the link'));
}

// Theme helpers
function applyThemeFromStorage(){
  const t = localStorage.getItem('site-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if(t === 'dark') document.body.classList.add('dark');
  const btn = document.getElementById('themeToggle'); if(btn) btn.setAttribute('aria-pressed', t==='dark');
}
function toggleTheme(){
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('site-theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('themeToggle'); if(btn) btn.setAttribute('aria-pressed', isDark);
}

// small helper to animate numeric stat changes
function animateNumberText(el, newValue){
  if(!el) return;
  const startText = el.textContent.replace(/[^0-9]/g,'');
  const start = parseInt(startText||'0',10);
  const end = Number(newValue) || 0;
  const duration = 700; const startTime = performance.now();
  function step(now){ const t = Math.min(1, (now - startTime)/duration); const val = Math.floor(start + (end - start) * t); el.textContent = val.toLocaleString() + (el.id==='memberCount' ? ' members' : (el.id==='onlineCount' ? ' online' : ''));
    if(t < 1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}

// lazy load gallery and fade in
async function loadGallery(){
  const grid = document.querySelector('.gallery-grid');
  if(!grid) return;
  grid.innerHTML = 'Loading...';
  try{
    const r = await fetch('/api/gallery');
    const j = await r.json();
    grid.innerHTML = '';
    j.images.forEach(img=>{
      const el = document.createElement('img');
      el.src = img.url;
      el.loading = 'lazy';
      el.alt = img.uploader || 'fan upload';
      el.addEventListener('load', ()=> el.classList.add('loaded'));
      grid.appendChild(el);
    });
    hookGallery();
  }catch(e){ grid.innerHTML = '<div style="color:var(--muted)">Could not load gallery.</div>'; }
}

function openInviteFromAny(){ document.querySelectorAll('[data-join]').forEach(b=>b.addEventListener('click', recordJoinAndOpen)); }
function copyInviteFromAny(){ document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click', ()=>copyInvite(b))); }

// Gallery loader (de-duplicated) — lazy loader is used above

// Channels: load list from server and render
async function loadChannels(){
  try{
    const r = await fetch('/api/channels');
    if(!r.ok) return;
    const j = await r.json();
    const channels = j.channels || [];
    // render preview channels (index)
    const preview = document.querySelector('.preview-channels');
    if(preview){ preview.innerHTML = ''; channels.slice(0,8).forEach((c, idx)=>{
      const s = document.createElement('span'); s.className = 'channel'; s.setAttribute('data-url', c.url); s.textContent = (c.emoji? c.emoji + ' ' : '') + c.name;
      const grad = pickColor(c.name || idx);
      s.style.background = grad;
      s.style.color = '#fff';
      s.addEventListener('click', ()=>window.open(c.url,'_blank'));
      preview.appendChild(s);
    }); }
    // render full channel list
    const list = document.querySelector('.channel-list');
    if(list){ list.innerHTML = ''; channels.forEach((c, idx)=>{
      const row = document.createElement('div'); row.className = 'channel-row';
      const grad = pickColor(c.name || idx);
      row.style.background = grad;
      row.style.color = '#fff';
      row.style.border = '1px solid rgba(255,255,255,0.04)';

      const name = document.createElement('div'); name.className = 'channel-name'; name.innerHTML = `<span class="emoji">${c.emoji||''}</span>${c.name}`;
      const desc = document.createElement('div'); desc.className = 'channel-desc'; desc.textContent = c.desc || '';
      desc.style.color = 'rgba(255,255,255,0.9)';
      const open = document.createElement('button'); open.className = 'btn'; open.textContent = 'Open'; open.style.marginLeft='auto'; open.addEventListener('click', ()=>window.open(c.url,'_blank'));
      row.appendChild(name); row.appendChild(desc); row.appendChild(open);
      list.appendChild(row);
    }); }

    // if admin channel management UI exists, populate it
    const chList = document.getElementById('channelList');
    if(chList){ chList.innerHTML = ''; channels.forEach(c=>{
      const el = document.createElement('div'); el.style.display='flex'; el.style.alignItems='center'; el.style.gap='12px'; el.style.marginTop='8px';
      el.innerHTML = `<div style='flex:1'><strong>${c.emoji||''} ${c.name}</strong><div style='color:var(--muted)'>${c.url}</div></div>`;
      const del = document.createElement('button'); del.className='btn secondary'; del.textContent='Delete'; del.addEventListener('click', async ()=>{ await adminAction('/api/admin/channels',{action:'delete',name:c.name}); await loadChannels(); populateAdminChannels(); });
      el.appendChild(del); chList.appendChild(el);
    }); }

  }catch(e){ console.warn('Failed to load channels', e); }
}

// fetch current site banner/pfp settings and apply
async function fetchSiteAssets(){
  try{
    const r = await fetch('/api/site');
    if(!r.ok) return;
    const s = await r.json();
    // set banner images
    document.querySelectorAll('.banner img').forEach(img=>{ img.src = s.banner; });
    // set header pfp across all pages
    document.querySelectorAll('.logo.pfp').forEach(img=>{ img.src = s.pfp; });
  }catch(e){ console.warn('Site assets load failed', e); }
}

// Upload form handling
async function setupUpload(){
  const form = document.getElementById('uploadForm');
  if(!form) return;
  const fileInput = form.querySelector('input[type=file]');
  const status = document.getElementById('uploadStatus');
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    if(!fileInput.files.length){ status.textContent = 'Choose a file first'; return; }
    const f = fileInput.files[0];
    const fd = new FormData();
    fd.append('image', f);
    fd.append('uploader', form.querySelector('[name=uploader]').value || 'anonymous');
    try{
      const res = await fetch('/api/upload',{method:'POST',body:fd});
      const j = await res.json();
      if(res.ok){ status.textContent = 'Uploaded — pending moderation'; form.reset(); }
      else { status.textContent = j.error || 'Upload failed'; }
    }catch(e){ status.textContent = 'Upload failed'; }
  });
}

function hookGallery(){
  const lb = document.getElementById('lightbox');
  const lbImg = lb ? lb.querySelector('.lightbox-img') : null;
  document.querySelectorAll('.gallery-grid img, .jenna-grid img').forEach(img=>{
    img.addEventListener('click', ()=>{
      if(!lb || !lbImg) return;
      lbImg.src = img.src;
      lb.setAttribute('aria-hidden','false');
    });
  });
  if(lb){
    lb.querySelector('.lightbox-close').addEventListener('click', ()=> lb.setAttribute('aria-hidden','true'));
    lb.addEventListener('click', (e)=>{ if(e.target === lb) lb.setAttribute('aria-hidden','true') });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') lb.setAttribute('aria-hidden','true') });
  }
}

async function loadJenna(){
  const grid = document.querySelector('.jenna-grid');
  if(!grid) return;
  grid.innerHTML = 'Loading...';
  try{
    const r = await fetch('/api/jenna');
    const j = await r.json();
    grid.innerHTML = '';
    j.images.forEach(img=>{
      const el = document.createElement('img');
      el.src = img.url;
      el.loading = 'lazy';
      el.alt = img.alt || 'jenna image';
      el.addEventListener('load', ()=> el.classList.add('loaded'));
      grid.appendChild(el);
    });
    hookGallery();
  }catch(e){ grid.innerHTML = '<div style="color:var(--muted)">Could not load images.</div>'; }
}

// Admin helpers: need to provide ?token=YOUR_TOKEN as query string or X-Admin-Token header
async function adminFetch(path, opts={}){
  return fetch(path + (location.search ? '&' + location.search.slice(1) : '?token=devtoken'), opts);
}

async function loadAdmin(){
  const panel = document.getElementById('adminPanel');
  if(!panel) return;
  panel.innerHTML = 'Loading...';
  try{
    const r = await adminFetch('/api/admin/uploads');
    if(!r.ok){ panel.innerHTML = 'Unauthorized or error'; return; }
    const j = await r.json();
    const pending = j.pending || [];
    const approved = j.approved || [];
    panel.innerHTML = `<div style="font-weight:700">Pending uploads</div>`;
    pending.forEach(p=>{
      const div = document.createElement('div');
      div.style.display='flex';div.style.gap='12px';div.style.alignItems='center';div.style.marginTop='10px';
      div.innerHTML = `<img src="/uploads/pending/${p.filename}" style="width:120px;border-radius:8px"><div style="flex:1"><div>${p.uploader}</div><div style="color:var(--muted)">${p.uploaded_at}</div></div>`;
      const approve = document.createElement('button'); approve.className='btn'; approve.textContent='Approve';
      const reject = document.createElement('button'); reject.className='btn secondary'; reject.textContent='Reject';
      approve.onclick = async ()=>{ await adminAction('/api/admin/approve',{id:p.id}); loadAdmin(); loadChannels(); };
      reject.onclick = async ()=>{ await adminAction('/api/admin/reject',{id:p.id}); loadAdmin(); };
      div.appendChild(approve); div.appendChild(reject);
      panel.appendChild(div);
    });
    panel.appendChild(document.createElement('hr'));

    // Approved images — allow admin to set as site banner or pfp
    const approvedHeader = document.createElement('div'); approvedHeader.style.fontWeight='700'; approvedHeader.textContent='Approved images (click to set)'; panel.appendChild(approvedHeader);
    const aprWrap = document.createElement('div'); aprWrap.style.display='flex'; aprWrap.style.flexWrap='wrap'; aprWrap.style.gap='12px'; aprWrap.style.marginTop='10px';
    approved.forEach(p=>{
      const d = document.createElement('div'); d.style.width='160px'; d.style.border='1px solid rgba(11,18,32,0.03)'; d.style.borderRadius='8px'; d.style.padding='8px'; d.style.background='white';
      d.innerHTML = `<img src="/uploads/approved/${p.filename}" style="width:100%;height:90px;object-fit:cover;border-radius:6px"><div style="display:flex;gap:8px;margin-top:8px"><button class='btn' data-set='banner' data-file='${p.filename}'>Set Banner</button><button class='btn secondary' data-set='pfp' data-file='${p.filename}'>Set PFP</button><button class='btn' data-jenna='${p.filename}'>Add to Jenna</button></div>`;
      aprWrap.appendChild(d);
    });
    panel.appendChild(aprWrap);
    panel.appendChild(document.createElement('hr'));
    panel.appendChild(document.createTextNode(`Approved: ${approved.length}`));

    // wire up set buttons
    panel.querySelectorAll('[data-set]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const type = b.getAttribute('data-set');
        const file = b.getAttribute('data-file');
        const url = `/uploads/approved/${file}`;
        await adminAction('/api/admin/set_asset',{type, url});
        // refresh assets on page
        await fetchSiteAssets();
        alert('Updated site ' + type);
      });
    });

  // wire up Add to Jenna buttons
    panel.querySelectorAll('[data-jenna]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const fname = b.getAttribute('data-jenna');
        const res = await adminAction('/api/admin/add_jenna',{filename: fname});
        if(res && res.url){ alert('Added to Jenna page'); } else { alert('Failed to add'); }
      });
    });

    // wire up Collect Images button
    const collectBtn = document.getElementById('collectImagesBtn');
    const collectStatus = document.getElementById('collectStatus');
    if(collectBtn && collectStatus){
      collectBtn.addEventListener('click', async ()=>{
        collectBtn.disabled = true;
        collectBtn.textContent = 'Collecting...';
        collectStatus.textContent = 'Collecting images...';
        try{
          const res = await adminAction('/api/admin/collect_jenna_images', {});
          if(res && res.status === 'ok'){
            collectStatus.textContent = 'Images collected successfully!';
            // reload jenna images if on that page
            if(document.querySelector('.jenna-grid')) loadJenna();
          } else {
            collectStatus.textContent = res.error || 'Collection failed';
          }
        }catch(e){
          collectStatus.textContent = 'Collection failed';
        }
        collectBtn.disabled = false;
        collectBtn.textContent = 'Collect Images Now';
      });
    }

    // load channels into admin UI
    await populateAdminChannels();

  }catch(e){ panel.innerHTML = 'Failed to load admin panel'; }
}

async function adminAction(path, body){
  try{
    const r = await adminFetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    return await r.json();
  }catch(e){ return {error:'failed'} }
}

function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

// Admin: populate channels management UI
async function populateAdminChannels(){
  const addForm = document.getElementById('addChannelForm');
  if(!addForm) return;
  const list = document.getElementById('channelList');
  list.innerHTML = 'Loading...';
  try{
    const r = await adminFetch('/api/channels');
    if(!r.ok){ list.innerHTML = 'Unauthorized or error'; return; }
    const j = await r.json();
    const channels = j.channels || [];
    list.innerHTML = '';
    channels.forEach(c=>{
      const el = document.createElement('div'); el.style.display='flex'; el.style.alignItems='center'; el.style.gap='12px'; el.style.marginTop='8px';
      el.innerHTML = `<div style='flex:1'><strong>${c.emoji||''} ${c.name}</strong><div style='color:var(--muted)'>${c.url}</div></div>`;
      const del = document.createElement('button'); del.className='btn secondary'; del.textContent='Delete'; del.addEventListener('click', async ()=>{ await adminAction('/api/admin/channels',{action:'delete',name:c.name}); await populateAdminChannels(); loadChannels(); });
      el.appendChild(del); list.appendChild(el);
    });

    addForm.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const data = new FormData(addForm);
      const emoji = data.get('emoji');
      const name = data.get('name');
      const url = data.get('url');
      await adminAction('/api/admin/channels',{action:'add', channel:{emoji,name,url}});
      addForm.reset();
      await populateAdminChannels();
      await loadChannels();
    });
  }catch(e){ list.innerHTML='Failed to load'; }
}

function setup(){
  openInviteFromAny();
  copyInviteFromAny();
  setActiveNav();
  // apply stored theme preference and wire the toggle
  applyThemeFromStorage();
  const themeBtn = document.getElementById('themeToggle'); if(themeBtn) themeBtn.addEventListener('click', toggleTheme);
  loadChannels();
  loadGallery();
  if(document.querySelector('.jenna-grid')) loadJenna();
  setupUpload();
  loadAdmin();
  populateAdminChannels();
  hookGallery();

  // Setup enhanced features
  setupGalleryFilters();
  setupJennaFilters();

  // wire refresh button for invite counts
  const refreshBtn = document.getElementById('refreshCounts');
  if(refreshBtn) refreshBtn.addEventListener('click', ()=>fetchInviteStats({manual:true, retries:1}));

  // Wire up Collect Images button on Jenna page
  const collectBtn = document.getElementById('collectJennaBtn');
  const collectStatus = document.getElementById('collectStatus');
  if(collectBtn && collectStatus){
    collectBtn.addEventListener('click', async ()=>{
      collectBtn.disabled = true;
      collectBtn.textContent = 'Collecting...';
      collectStatus.textContent = 'Collecting images...';
      try{
        const res = await adminAction('/api/admin/collect', {});
        if(res && res.status === 'ok'){
          collectStatus.textContent = 'Images collected successfully!';
          // reload jenna images
          loadJenna();
          updateJennaStats();
        } else {
          collectStatus.textContent = res.error || 'Collection failed';
        }
      }catch(e){
        collectStatus.textContent = 'Collection failed';
      }
      collectBtn.disabled = false;
      collectBtn.textContent = 'Collect New Photos 📷';
    });
  }

  // initial fetch
  fetchInviteStats();
  fetchSiteAssets();
  // periodic refresh (every minute)
  setInterval(()=>fetchInviteStats(),60000);
  
  // Update stats periodically
  setInterval(() => {
    updateGalleryStats();
    updateJennaStats();
  }, 30000);
}

document.addEventListener('DOMContentLoaded',setup);

/* polished hover for channel badges */
document.addEventListener('mouseover', (e)=>{
  if(e.target.classList && e.target.classList.contains('channel')){
    e.target.style.transform = 'translateY(-4px)';
    e.target.style.transition = 'transform .18s ease';
  }
});
document.addEventListener('mouseout', (e)=>{
  if(e.target.classList && e.target.classList.contains('channel')){
    e.target.style.transform = '';
  }
});
