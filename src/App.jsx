import { useState, useEffect, useRef, useCallback } from 'react';
import { sheetsDB } from './services/googleSheets';
import { facebookAPI } from './services/facebook';

// ==========================================
// FB Bulk Poster Pro v2.1 — with File Upload
// ==========================================

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => new Date().toISOString();
const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};
const fmtSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};
const isVideoFile = (name) => /\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v)$/i.test(name);
const isVideoMime = (mime) => mime?.startsWith('video/');

const GROUP_COLORS = ['#1877F2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#607D8B', '#00BCD4', '#FF5722'];

// ==================== ICONS ====================
const I = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  post: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  caption: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  group: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  media: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  play: <polygon points="5 3 19 12 5 21 5 3" />,
  stop: <rect x="6" y="6" width="12" height="12" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
  shuffle: <><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></>,
  list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  pulse: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  video: <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></>,
  film: <><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" /></>,
  harddrive: <><line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" /></>,
};

const Svg = ({ children, size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);

// ==================== MAIN APP ====================
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [config, setConfig] = useState({ fbUserToken: '', sheetsApiKey: '', spreadsheetId: '', googleOAuthToken: '', defaultDelay: 30 });
  const [groups, setGroups] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]); // URL-based media from Google Sheets
  const [uploadedFiles, setUploadedFiles] = useState([]); // Local file uploads (in memory)
  const [activity, setActivity] = useState([]);
  const [fbPages, setFbPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postProgress, setPostProgress] = useState({ current: 0, total: 0, results: [] });
  const stopRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('fb_poster_config');
    if (saved) {
      try {
        const c = JSON.parse(saved);
        setConfig(c);
        if (c.spreadsheetId && c.googleOAuthToken) {
          sheetsDB.configure({ apiKey: c.sheetsApiKey, spreadsheetId: c.spreadsheetId, accessToken: c.googleOAuthToken });
          setConfigured(true);
          loadAllData(c);
        } else setLoading(false);
      } catch { setLoading(false); }
    } else setLoading(false);
    // Load uploaded files from IndexedDB
    loadFilesFromIDB();
  }, []);

  async function loadAllData(cfg) {
    setLoading(true);
    try {
      sheetsDB.configure({ apiKey: cfg?.sheetsApiKey || config.sheetsApiKey, spreadsheetId: cfg?.spreadsheetId || config.spreadsheetId, accessToken: cfg?.googleOAuthToken || config.googleOAuthToken });
      const [g, c, m, a] = await Promise.all([sheetsDB.getGroups(), sheetsDB.getCaptions(), sheetsDB.getMedia(), sheetsDB.getActivity()]);
      setGroups(g); setCaptions(c); setMediaUrls(m); setActivity(a.slice(0, 50));
    } catch (e) { showToast('โหลดข้อมูลผิดพลาด: ' + e.message, 'error'); }
    setLoading(false);
  }

  // ---- IndexedDB for local files ----
  function openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('FBPosterFiles', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('files', { keyPath: 'id' }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function loadFilesFromIDB() {
    try {
      const db = await openIDB();
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.getAll();
      req.onsuccess = () => setUploadedFiles(req.result || []);
    } catch (e) { console.error('IDB load error:', e); }
  }
  async function saveFileToIDB(fileObj) {
    try {
      const db = await openIDB();
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(fileObj);
    } catch (e) { console.error('IDB save error:', e); }
  }
  async function deleteFileFromIDB(id) {
    try {
      const db = await openIDB();
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(id);
    } catch (e) { console.error('IDB delete error:', e); }
  }
  async function clearAllFilesIDB() {
    try {
      const db = await openIDB();
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').clear();
    } catch (e) { console.error('IDB clear error:', e); }
  }

  function showToast(msg, type = 'info') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }

  async function saveConfig(newConfig) {
    const c = { ...config, ...newConfig };
    setConfig(c);
    localStorage.setItem('fb_poster_config', JSON.stringify(c));
    sheetsDB.configure({ apiKey: c.sheetsApiKey, spreadsheetId: c.spreadsheetId, accessToken: c.googleOAuthToken });
    if (c.spreadsheetId && c.googleOAuthToken) { setConfigured(true); await loadAllData(c); }
    showToast('บันทึกตั้งค่าสำเร็จ', 'success');
  }

  async function fetchFbPages() {
    if (!config.fbUserToken) { showToast('กรุณาใส่ Facebook User Token', 'error'); return; }
    setLoadingPages(true);
    try {
      const pages = await facebookAPI.getMyPages(config.fbUserToken);
      setFbPages(pages);
      showToast(`พบ ${pages.length} เพจ`, 'success');
    } catch (e) { showToast('ดึงเพจล้มเหลว: ' + e.message, 'error'); }
    setLoadingPages(false);
  }

  // all media combined
  const allMedia = [
    ...mediaUrls.map(m => ({ ...m, source: 'url', isVideo: m.type === 'video' })),
    ...uploadedFiles.map(f => ({ ...f, source: 'base64', isVideo: isVideoMime(f.mimeType) }))
  ];
  const totalFiles = uploadedFiles.length;
  const totalUrls = mediaUrls.length;

  return (
    <div style={S.app}>
      <style>{globalCSS}</style>

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.logoBox}><Svg size={20}>{I.facebook}</Svg></div>
          <div>
            <div style={S.logoTitle}>Bulk Poster</div>
            <div style={S.logoBadge}>PRO v2.1</div>
          </div>
        </div>
        <nav style={S.nav}>
          {[
            { id: 'dashboard', icon: I.dashboard, label: 'แดชบอร์ด' },
            { id: 'posts', icon: I.post, label: 'สร้างโพสต์' },
            { id: 'groups', icon: I.group, label: 'เพจ' },
            { id: 'captions', icon: I.caption, label: 'แคปชั่น' },
            { id: 'media', icon: I.media, label: 'สื่อ / Media' },
            { id: 'settings', icon: I.settings, label: 'ตั้งค่า' },
          ].map(item => (
            <button key={item.id} style={page === item.id ? { ...S.navItem, ...S.navActive } : S.navItem} onClick={() => setPage(item.id)}>
              <Svg size={18}>{item.icon}</Svg><span>{item.label}</span>
              {item.id === 'media' && (totalFiles + totalUrls) > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', background: '#8B5CF622', color: '#8B5CF6', borderRadius: 10, fontWeight: 700 }}>{totalFiles + totalUrls}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={S.sidebarFooter}>
          <div style={S.dbStatus}>
            <div style={{ ...S.statusDot, background: configured ? '#10B981' : '#EF4444' }} />
            <span style={{ fontSize: 11, color: '#8B95A8' }}>{configured ? 'Google Sheets เชื่อมต่อ' : 'ยังไม่เชื่อมต่อ'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {loading ? (
          <div style={S.loadingScreen}><div className="spinner" /><p style={{ marginTop: 16, color: '#8B95A8' }}>กำลังโหลด...</p></div>
        ) : !configured && page !== 'settings' ? (
          <div style={S.setupScreen}>
            <div style={S.setupCard}>
              <Svg size={48} style={{ color: '#1877F2' }}>{I.db}</Svg>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>ตั้งค่าระบบก่อนเริ่มใช้งาน</h2>
              <p style={{ color: '#8B95A8', marginTop: 8, lineHeight: 1.7 }}>เชื่อมต่อ Google Sheets + Facebook Token</p>
              <button style={{ ...S.btnPrimary, marginTop: 16 }} onClick={() => setPage('settings')}><Svg size={18}>{I.settings}</Svg> ไปตั้งค่า</button>
            </div>
          </div>
        ) : (
          <>
            {page === 'dashboard' && <DashboardPage groups={groups} captions={captions} allMedia={allMedia} activity={activity} onRefresh={() => loadAllData()} />}
            {page === 'posts' && (
              <PostsPage groups={groups} captions={captions} allMedia={allMedia} config={config}
                isPosting={isPosting} postProgress={postProgress}
                onStart={async (pc) => {
                  setIsPosting(true); stopRef.current = false;
                  setPostProgress({ current: 0, total: pc.posts.length, results: [] });
                  await facebookAPI.bulkPost({
                    posts: pc.posts, delayMs: pc.delay * 1000,
                    shouldStop: () => stopRef.current,
                    onProgress: (cur, tot, res) => setPostProgress(p => ({ current: cur, total: tot, results: [...p.results, res] })),
                    onComplete: async (results) => {
                      setIsPosting(false);
                      const s = results.filter(r => r.success).length;
                      showToast(`เสร็จ! สำเร็จ ${s}/${results.length}`, s === results.length ? 'success' : 'error');
                      try { await sheetsDB.logActivity('bulk_post', `${s}/${results.length}`, `group: ${pc.groupName}`); loadAllData(); } catch { }
                    }
                  });
                }}
                onStop={() => { stopRef.current = true; setIsPosting(false); }}
                showToast={showToast}
              />
            )}
            {page === 'groups' && <GroupsPage groups={groups} fbPages={fbPages} loadingPages={loadingPages} onFetchPages={fetchFbPages} onSave={async (u) => { setGroups(u); await sheetsDB.saveGroups(u); showToast('บันทึกกลุ่มสำเร็จ', 'success'); }} showToast={showToast} />}
            {page === 'captions' && <CaptionsPage captions={captions} groups={groups} onSave={async (u) => { setCaptions(u); await sheetsDB.saveCaptions(u); showToast('บันทึกแคปชั่นสำเร็จ', 'success'); }} showToast={showToast} />}
            {page === 'media' && (
              <MediaPage
                mediaUrls={mediaUrls} uploadedFiles={uploadedFiles} groups={groups}
                onSaveUrls={async (u) => { setMediaUrls(u); await sheetsDB.saveMedia(u); showToast('บันทึก URL สำเร็จ', 'success'); }}
                onAddFiles={async (files) => {
                  for (const f of files) { await saveFileToIDB(f); }
                  setUploadedFiles(prev => [...prev, ...files]);
                  showToast(`เพิ่ม ${files.length} ไฟล์สำเร็จ`, 'success');
                }}
                onDeleteFile={async (id) => {
                  await deleteFileFromIDB(id);
                  setUploadedFiles(prev => prev.filter(f => f.id !== id));
                }}
                onClearFiles={async () => {
                  await clearAllFilesIDB();
                  setUploadedFiles([]);
                  showToast('ลบไฟล์ทั้งหมดสำเร็จ', 'info');
                }}
                showToast={showToast}
              />
            )}
            {page === 'settings' && <SettingsPage config={config} onSave={saveConfig} onInit={async () => { try { const r = await sheetsDB.initializeSheets(); showToast(r.success ? 'สร้าง headers สำเร็จ' : r.error, r.success ? 'success' : 'error'); } catch (e) { showToast(e.message, 'error'); } }} showToast={showToast} />}
          </>
        )}
      </main>

      {toast && <div style={{ ...S.toast, background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#1877F2' }}>{toast.msg}</div>}
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardPage({ groups, captions, allMedia, activity, onRefresh }) {
  return (
    <div>
      <div style={S.pageHeader}><h1 style={S.pageTitle}>แดชบอร์ด</h1><button style={S.btnSecondary} onClick={onRefresh}><Svg size={16}>{I.refresh}</Svg> รีเฟรช</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'เพจ', value: groups.filter(g=>g.pageId).length, color: '#1877F2', bg: 'rgba(24,119,242,0.1)', icon: I.group },
          { label: 'แคปชั่น', value: captions.length, color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: I.caption },
          { label: 'สื่อทั้งหมด', value: allMedia.length, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: I.media },
          { label: 'โพสต์', value: activity.filter(a => a.action === 'bulk_post').length, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: I.pulse },
        ].map((s, i) => (
          <div key={i} style={S.statCard}>
            <div style={{ ...S.statIcon, background: s.bg, color: s.color }}><Svg size={22}>{s.icon}</Svg></div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8B95A8', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={S.card}><h3 style={S.cardTitle}>กลุ่มสินค้า</h3>
          {groups.length === 0 ? <p style={{ color: '#5A647A', fontSize: 13 }}>ยังไม่มีกลุ่ม</p> : groups.slice(0, 5).map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1A2235' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} /><span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{g.name}</span><span style={{ fontSize: 11, color: '#5A647A' }}>{g.pageName || g.pageId}</span>
            </div>))}
        </div>
        <div style={S.card}><h3 style={S.cardTitle}>กิจกรรมล่าสุด</h3>
          {activity.length === 0 ? <p style={{ color: '#5A647A', fontSize: 13 }}>ยังไม่มี</p> : activity.slice(0, 8).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1A2235', fontSize: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /><span style={{ flex: 1, color: '#8B95A8' }}>{a.action} — {a.detail}</span><span style={{ fontSize: 10, color: '#5A647A', fontFamily: 'monospace' }}>{fmt(a.timestamp)}</span>
            </div>))}
        </div>
      </div>
    </div>
  );
}

// ==================== MEDIA PAGE (with File Upload) ====================
function MediaPage({ mediaUrls, uploadedFiles, groups, onSaveUrls, onAddFiles, onDeleteFile, onClearFiles, showToast }) {
  const [tab, setTab] = useState('files');
  const [selectedGroup, setSelectedGroup] = useState('_default');
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const filteredUrls = mediaUrls.filter(m => m.groupId === selectedGroup);
  const filteredFiles = uploadedFiles.filter(f => f.groupId === selectedGroup);

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  }
  function handleFileSelect(e) {
    processFiles(e.target.files);
    e.target.value = '';
  }

  async function processFiles(fileList) {
    const maxAdd = 50 - uploadedFiles.length;
    const files = Array.from(fileList).slice(0, maxAdd);
    if (files.length === 0) { showToast('ถึงจำนวนไฟล์สูงสุด (50)', 'error'); return; }

    const processed = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      const preview = file.type.startsWith('image/') ? base64.dataUrl : null;
      processed.push({
        id: uid(),
        groupId: selectedGroup,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64: base64.raw,
        preview,
        isVideo: isVideoMime(file.type),
        createdAt: now()
      });
    }
    onAddFiles(processed);
  }

  function fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const raw = dataUrl.split(',')[1];
        resolve({ dataUrl, raw });
      };
      reader.readAsDataURL(file);
    });
  }

  function addUrls() {
    if (!url.trim()) return;
    const urls = url.split('\n').map(u => u.trim()).filter(Boolean);
    const newMedia = urls.map(u => {
      const isVid = isVideoFile(u);
      return { id: uid(), groupId: selectedGroup, url: u, type: isVid ? 'video' : 'image', createdAt: now() };
    });
    onSaveUrls([...mediaUrls, ...newMedia]);
    setUrl('');
  }

  function removeUrl(id) { onSaveUrls(mediaUrls.filter(m => m.id !== id)); }

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.pageTitle}>สื่อ / Media</h1>
        <span style={{ fontSize: 13, color: '#8B95A8' }}>ไฟล์ {uploadedFiles.length} · URL {mediaUrls.length}</span>
      </div>

      {/* Tab Switch */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#111827', borderRadius: 10, padding: 4, border: '1px solid #1A2235', width: 'fit-content' }}>
        {[
          { id: 'files', icon: I.harddrive, label: `อัพโหลดจากเครื่อง (${uploadedFiles.length})` },
          { id: 'urls', icon: I.link, label: `URL (${mediaUrls.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: tab === t.id ? '#1877F2' : 'transparent', border: 'none', borderRadius: 8, color: tab === t.id ? 'white' : '#5A647A', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Svg size={14}>{t.icon}</Svg> {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>กลุ่มสินค้า</label>
        <select style={{ ...S.input, maxWidth: 300 }} value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
          <option value="_default">ทั่วไป</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* ======= FILE UPLOAD TAB ======= */}
      {tab === 'files' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Upload Zone */}
          <div style={S.card}>
            <h3 style={S.cardTitle}><Svg size={18}>{I.upload}</Svg>&nbsp; อัพโหลดรูป / วิดีโอ</h3>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '36px 20px', border: `2px dashed ${dragging ? '#1877F2' : '#2A3650'}`,
                borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(24,119,242,0.06)' : '#0A0E17',
                transition: '0.2s'
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(24,119,242,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#1877F2' }}>
                <Svg size={28}>{I.upload}</Svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F2F5', marginTop: 14 }}>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
              <p style={{ fontSize: 12, color: '#5A647A', marginTop: 6 }}>รองรับ: JPG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM</p>
              <p style={{ fontSize: 11, color: '#5A647A', marginTop: 2 }}>สูงสุด 50 ไฟล์ · รูปไม่เกิน 4MB · วิดีโอไม่เกิน 1GB</p>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*" hidden onChange={handleFileSelect} />
            </div>

            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8B95A8' }}>ทั้งหมด {uploadedFiles.length} ไฟล์</span>
                <button onClick={onClearFiles} style={{ ...S.btnSmall, background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444' }}>
                  <Svg size={12}>{I.trash}</Svg> ลบทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* File Grid */}
          <div style={S.card}>
            <h3 style={S.cardTitle}>
              ไฟล์ในกลุ่ม
              <span style={{ marginLeft: 8, padding: '2px 10px', background: '#8B5CF6', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{filteredFiles.length}</span>
            </h3>
            <div style={{ maxHeight: 450, overflowY: 'auto' }}>
              {filteredFiles.length === 0 && <p style={{ color: '#5A647A', fontSize: 13 }}>ยังไม่มีไฟล์ในกลุ่มนี้</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {filteredFiles.map(f => (
                  <div key={f.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #2A3650', background: '#0A0E17', aspectRatio: '1' }}>
                    {f.preview ? (
                      <img src={f.preview} alt={f.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                        <Svg size={28}>{I.film}</Svg>
                        <span style={{ fontSize: 9, color: '#5A647A', marginTop: 4 }}>VIDEO</span>
                      </div>
                    )}
                    {/* Type Badge */}
                    <div style={{ position: 'absolute', bottom: 4, left: 4, padding: '2px 6px', background: f.isVideo ? '#F59E0BDD' : '#1877F2DD', borderRadius: 4, fontSize: 9, fontWeight: 700, color: 'white' }}>
                      {f.isVideo ? 'VID' : 'IMG'}
                    </div>
                    {/* Size */}
                    <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', background: 'rgba(0,0,0,0.7)', borderRadius: 4, fontSize: 9, color: '#8B95A8' }}>
                      {fmtSize(f.fileSize)}
                    </div>
                    {/* Delete */}
                    <button onClick={() => onDeleteFile(f.id)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1 }}>×</button>
                    {/* Filename */}
                    <div style={{ position: 'absolute', top: 4, left: 4, maxWidth: 'calc(100% - 36px)', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', borderRadius: 4, fontSize: 9, color: '#C5CAD3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.fileName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= URL TAB ======= */}
      {tab === 'urls' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}><Svg size={18}>{I.link}</Svg>&nbsp; เพิ่ม URL</h3>
            <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.png\nhttps://example.com/video.mp4"} />
            <button style={{ ...S.btnPrimary, marginTop: 10 }} onClick={addUrls}><Svg size={16}>{I.link}</Svg> เพิ่ม URL</button>
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>URL ในกลุ่ม <span style={{ marginLeft: 8, padding: '2px 10px', background: '#1877F2', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{filteredUrls.length}</span></h3>
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredUrls.length === 0 && <p style={{ color: '#5A647A', fontSize: 13 }}>ไม่มี URL</p>}
              {filteredUrls.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0F1629', borderRadius: 8, border: '1px solid #2A3650' }}>
                  <span style={{ fontSize: 9, padding: '2px 6px', background: m.type === 'video' ? '#F59E0B22' : '#1877F222', color: m.type === 'video' ? '#F59E0B' : '#1877F2', borderRadius: 4, fontWeight: 700 }}>{m.type === 'video' ? 'VID' : 'IMG'}</span>
                  <span style={{ flex: 1, fontSize: 11, color: '#8B95A8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</span>
                  <button style={{ ...S.iconBtn, width: 24, height: 24 }} onClick={() => removeUrl(m.id)}><Svg size={12} style={{ color: '#EF4444' }}>{I.x}</Svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== POSTS PAGE ====================
function PostsPage({ groups, captions, allMedia, config, isPosting, postProgress, onStart, onStop, showToast }) {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [postCount, setPostCount] = useState(10);
  const [captionMode, setCaptionMode] = useState('random');
  const [mediaMode, setMediaMode] = useState('random');
  const [delay, setDelay] = useState(config.defaultDelay || 30);
  const [singleCaption, setSingleCaption] = useState('');

  function handleStart() {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) { showToast('เลือกกลุ่มก่อน', 'error'); return; }

    const gc = captions.filter(c => c.groupId === selectedGroup || c.groupId === '_default');
    const gm = allMedia.filter(m => m.groupId === selectedGroup || m.groupId === '_default');

    if (captionMode !== 'single' && gc.length === 0) { showToast('ไม่มีแคปชั่น', 'error'); return; }

    const posts = [];
    for (let i = 0; i < postCount; i++) {
      let caption;
      if (captionMode === 'single') caption = singleCaption;
      else if (captionMode === 'random') caption = gc[Math.floor(Math.random() * gc.length)]?.text || '';
      else caption = gc[i % gc.length]?.text || '';

      let media = null;
      if (gm.length > 0) {
        const idx = mediaMode === 'random' ? Math.floor(Math.random() * gm.length) : i % gm.length;
        const m = gm[idx];
        if (m.source === 'url') {
          media = { source: 'url', url: m.url, isVideo: m.isVideo };
        } else if (m.source === 'base64') {
          media = { source: 'base64', base64: m.base64, mimeType: m.mimeType, fileName: m.fileName, isVideo: m.isVideo };
        }
      }
      posts.push({ pageId: group.pageId, pageToken: group.pageToken, caption, media });
    }
    onStart({ posts, delay, groupName: group.name });
  }

  const pct = postProgress.total > 0 ? (postProgress.current / postProgress.total) * 100 : 0;
  const circ = 2 * Math.PI * 54;
  const dashOff = circ - (pct / 100) * circ;

  if (isPosting || (postProgress.results.length > 0 && postProgress.current >= postProgress.total)) {
    const success = postProgress.results.filter(r => r.success).length;
    const failed = postProgress.results.length - success;
    const done = postProgress.current >= postProgress.total && !isPosting;

    return (
      <div><div style={S.pageHeader}><h1 style={S.pageTitle}>{done ? 'เสร็จสิ้น!' : 'กำลังโพสต์...'}</h1></div>
        <div style={{ display: 'flex', gap: 28 }}>
          <div style={{ ...S.card, flex: '0 0 280px', textAlign: 'center', padding: 28 }}>
            <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
              <svg viewBox="0 0 120 120" width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" stroke="#2A3650" />
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" stroke={done ? '#10B981' : '#1877F2'} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOff} style={{ transition: '0.5s' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{postProgress.current}</div>
                <div style={{ fontSize: 12, color: '#5A647A' }}>/ {postProgress.total}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18 }}>
              <div><div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>{success}</div><div style={{ fontSize: 10, color: '#5A647A' }}>สำเร็จ</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>{failed}</div><div style={{ fontSize: 10, color: '#5A647A' }}>ล้มเหลว</div></div>
            </div>
            {isPosting && <button style={{ ...S.btnDanger, width: '100%', marginTop: 18 }} onClick={onStop}><Svg size={16}>{I.stop}</Svg> หยุด</button>}
          </div>
          <div style={{ ...S.card, flex: 1, maxHeight: 420, overflowY: 'auto' }}>
            <h3 style={S.cardTitle}>ผลลัพธ์</h3>
            {postProgress.results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', marginBottom: 3, background: '#0F1629', borderRadius: 6, borderLeft: `3px solid ${r.success ? '#10B981' : '#EF4444'}` }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#5A647A', minWidth: 28 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, color: r.success ? '#10B981' : '#EF4444' }}>{r.success ? `✓ สำเร็จ` : `✗ ${r.error || 'ผิดพลาด'}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const group = groups.find(g => g.id === selectedGroup);
  const gc = captions.filter(c => c.groupId === selectedGroup || c.groupId === '_default');
  const gm = allMedia.filter(m => m.groupId === selectedGroup || m.groupId === '_default');
  const gmFiles = gm.filter(m => m.source === 'base64');
  const gmUrls = gm.filter(m => m.source === 'url');

  return (
    <div><div style={S.pageHeader}><h1 style={S.pageTitle}>สร้างโพสต์</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>ตั้งค่าการโพสต์</h3>
          <label style={S.label}>เลือกกรุ๊ปเพจ</label>
          <select style={S.input} value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">-- เลือกกลุ่ม --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.pageName || g.pageId})</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <div><label style={S.label}>จำนวนโพสต์</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min="1" max="50" value={postCount} onChange={e => setPostCount(+e.target.value)} style={{ flex: 1, accentColor: '#1877F2' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#1877F2', minWidth: 28 }}>{postCount}</span>
              </div>
            </div>
            <div><label style={S.label}>หน่วงเวลา (วินาที)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min="10" max="300" step="5" value={delay} onChange={e => setDelay(+e.target.value)} style={{ flex: 1, accentColor: '#F59E0B' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#F59E0B', minWidth: 36 }}>{delay}s</span>
              </div>
            </div>
          </div>
          <label style={{ ...S.label, marginTop: 16 }}>โหมดแคปชั่น</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'random', icon: I.shuffle, l: 'สุ่ม' }, { id: 'sequential', icon: I.list, l: 'ตามลำดับ' }, { id: 'single', icon: I.file, l: 'แคปชั่นเดียว' }].map(m => (
              <button key={m.id} onClick={() => setCaptionMode(m.id)} style={{ ...S.modeBtn, ...(captionMode === m.id ? S.modeBtnActive : {}) }}><Svg size={16}>{m.icon}</Svg> {m.l}</button>
            ))}
          </div>
          {captionMode === 'single' && <textarea style={{ ...S.input, marginTop: 12, minHeight: 80 }} value={singleCaption} onChange={e => setSingleCaption(e.target.value)} placeholder="พิมพ์แคปชั่น..." />}
          <label style={{ ...S.label, marginTop: 16 }}>โหมดสื่อ</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'random', l: 'สุ่ม' }, { id: 'sequential', l: 'ตามลำดับ' }, { id: 'pair', l: 'จับคู่' }].map(m => (
              <button key={m.id} onClick={() => setMediaMode(m.id)} style={{ ...S.modeBtn, ...(mediaMode === m.id ? S.modeBtnActive : {}) }}>{m.l}</button>
            ))}
          </div>
          <button style={{ ...S.btnDanger, width: '100%', marginTop: 24, padding: '14px', fontSize: 15 }} onClick={handleStart} disabled={!selectedGroup}>
            <Svg size={20}>{I.play}</Svg> เริ่มโพสต์ {postCount} โพสต์
          </button>
        </div>

        {/* Summary Sidebar */}
        <div>
          <div style={{ ...S.card, marginBottom: 12 }}>
            <h3 style={S.cardTitle}>สรุป</h3>
            {group ? (<><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} /><span style={{ fontWeight: 700 }}>{group.name}</span></div>
              <div style={{ fontSize: 12, color: '#1877F2' }}>{group.pageName}</div></>) : <p style={{ color: '#5A647A', fontSize: 12 }}>เลือกกลุ่มก่อน</p>}
          </div>
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#8B95A8' }}>แคปชั่น</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>{gc.length}</span>
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#8B95A8' }}>สื่อทั้งหมด</span>
              <span style={{ fontWeight: 700, color: '#8B5CF6' }}>{gm.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
              <span style={{ color: '#1877F2', background: '#1877F211', padding: '2px 8px', borderRadius: 4 }}>📁 ไฟล์ {gmFiles.length}</span>
              <span style={{ color: '#F59E0B', background: '#F59E0B11', padding: '2px 8px', borderRadius: 4 }}>🔗 URL {gmUrls.length}</span>
            </div>
          </div>
          {/* Preview thumbnails */}
          {gm.length > 0 && (
            <div style={S.card}>
              <h3 style={{ ...S.cardTitle, fontSize: 12 }}>ตัวอย่างสื่อ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                {gm.slice(0, 9).map((m, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#0A0E17', border: '1px solid #2A3650' }}>
                    {m.preview ? (
                      <img src={m.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : m.source === 'url' ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Svg size={16} style={{ color: '#5A647A' }}>{m.isVideo ? I.film : I.image}</Svg>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                        <Svg size={16}>{I.film}</Svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {gm.length > 9 && <p style={{ fontSize: 10, color: '#5A647A', marginTop: 6, textAlign: 'center' }}>+{gm.length - 9} อื่นๆ</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== GROUPS PAGE ====================
function GroupsPage({ groups, fbPages, loadingPages, onFetchPages, onSave, showToast }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [pageForm, setPageForm] = useState({ groupName: 'Default', pageId: '', pageToken: '' });
  const [loadingPage, setLoadingPage] = useState(false);

  // Derive unique group names from existing groups
  const groupNames = ['Default', ...new Set(groups.map(g => g.name).filter(n => n && n !== 'Default'))];

  function addGroup() {
    const name = newGroupName.trim();
    if (!name) { showToast('กรุณาใส่ชื่อกรุ๊ป', 'error'); return; }
    if (groupNames.includes(name)) { showToast('ชื่อกรุ๊ปซ้ำ', 'error'); return; }
    // Add a placeholder group entry so the name persists
    const updated = [...groups, { id: uid(), name, pageId: '', pageName: '', pageToken: '', color: GROUP_COLORS[groupNames.length % GROUP_COLORS.length], createdAt: now() }];
    onSave(updated);
    setNewGroupName('');
    showToast(`เพิ่มกรุ๊ป "${name}" สำเร็จ`, 'success');
  }

  function deleteGroup(name) {
    if (name === 'Default') return;
    if (!confirm(`ลบกรุ๊ป "${name}" และเพจทั้งหมดในกรุ๊ปนี้?`)) return;
    onSave(groups.filter(g => g.name !== name));
    showToast(`ลบกรุ๊ป "${name}" แล้ว`, 'info');
  }

  async function addPage() {
    if (!pageForm.pageId.trim() || !pageForm.pageToken.trim()) {
      showToast('กรุณาใส่ Page ID และ Token', 'error'); return;
    }
    // Check duplicate
    if (groups.some(g => g.pageId === pageForm.pageId.trim() && g.name === pageForm.groupName)) {
      showToast('เพจนี้มีอยู่ในกรุ๊ปแล้ว', 'error'); return;
    }

    setLoadingPage(true);
    let pageName = '';
    try {
      const info = await facebookAPI.getPageInfo(pageForm.pageId.trim(), pageForm.pageToken.trim());
      pageName = info.name || '';
      showToast(`พบเพจ: ${pageName}`, 'success');
    } catch (e) {
      showToast('ดึงชื่อเพจไม่ได้ — เพิ่มเพจต่อ', 'info');
    }

    const colorIdx = groupNames.indexOf(pageForm.groupName);
    const newPage = {
      id: uid(),
      name: pageForm.groupName,
      pageId: pageForm.pageId.trim(),
      pageName,
      pageToken: pageForm.pageToken.trim(),
      color: GROUP_COLORS[colorIdx >= 0 ? colorIdx % GROUP_COLORS.length : 0],
      createdAt: now()
    };

    // Remove placeholder entry (empty pageId) for this group if exists
    const cleaned = groups.filter(g => !(g.name === pageForm.groupName && !g.pageId));
    await onSave([...cleaned, newPage]);
    setPageForm(f => ({ ...f, pageId: '', pageToken: '' }));
    setLoadingPage(false);
  }

  function deletePage(id) {
    if (!confirm('ลบเพจนี้?')) return;
    onSave(groups.filter(g => g.id !== id));
  }

  // Pages with actual pageId (not placeholders)
  const actualPages = groups.filter(g => g.pageId);

  return (
    <div>
      <div style={S.pageHeader}><h1 style={S.pageTitle}>เพจ</h1></div>

      {/* Token Warning */}
      <div style={{ padding: '12px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#F59E0B', fontSize: 16 }}>⚠</span>
        <span style={{ fontSize: 13, color: '#F59E0B' }}>Token ต้องมีสิทธิ์: <strong>pages_manage_posts</strong> + <strong>pages_show_list</strong></span>
      </div>

      {/* ======= Section 1: กรุ๊ปเพจ ======= */}
      <div style={{ ...S.card, marginBottom: 16, borderLeft: '3px solid #10B981' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>📁</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>กรุ๊ปเพจ</h3>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGroup()}
            placeholder="ชื่อกรุ๊ปใหม่"
          />
          <button style={{ ...S.btnPrimary, background: '#10B981', padding: '10px 28px', whiteSpace: 'nowrap', fontSize: 14 }} onClick={addGroup}>
            + เพิ่มกรุ๊ป
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {groupNames.map((name, i) => (
            <div key={name} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
              fontSize: 13, fontWeight: 600, color: '#C4B5FD'
            }}>
              {name}
              {name !== 'Default' && (
                <button onClick={() => deleteGroup(name)} style={{
                  width: 18, height: 18, borderRadius: '50%', border: 'none',
                  background: 'rgba(239,68,68,0.3)', color: '#F87171',
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                }}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======= Section 2: เพิ่มเพจ ======= */}
      <div style={{ ...S.card, marginBottom: 16, borderLeft: '3px solid #1877F2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>➕</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>เพิ่มเพจ</h3>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>กรุ๊ป</label>
          <select style={S.input} value={pageForm.groupName} onChange={e => setPageForm(f => ({ ...f, groupName: e.target.value }))}>
            {groupNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Page ID</label>
            <input style={S.input} value={pageForm.pageId} onChange={e => setPageForm(f => ({ ...f, pageId: e.target.value }))} placeholder="123456789012345" />
          </div>
          <div>
            <label style={S.label}>Page Token</label>
            <input style={S.input} type="password" value={pageForm.pageToken} onChange={e => setPageForm(f => ({ ...f, pageToken: e.target.value }))} placeholder="วาง Token" />
          </div>
        </div>

        <button
          style={{ ...S.btnPrimary, width: '100%', padding: '14px', fontSize: 15, opacity: loadingPage ? 0.6 : 1 }}
          onClick={addPage}
          disabled={loadingPage}
        >
          {loadingPage ? '⏳ กำลังตรวจสอบเพจ...' : '✅ เพิ่มเพจ'}
        </button>
      </div>

      {/* ======= Section 3: รายการเพจ ======= */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>รายการเพจ</h3>
            <span style={{ padding: '2px 10px', background: '#1877F2', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'white' }}>{actualPages.length}</span>
          </div>
          {fbPages.length === 0 && (
            <button style={{ ...S.btnSmall, background: '#1877F2' }} onClick={onFetchPages} disabled={loadingPages}>
              {loadingPages ? '⏳ โหลด...' : '🔄 ดึงเพจอัตโนมัติ'}
            </button>
          )}
        </div>

        {/* Auto-fetched pages suggestion */}
        {fbPages.length > 0 && (
          <div style={{ marginBottom: 16, padding: 14, background: '#0A0E17', borderRadius: 10, border: '1px solid rgba(24,119,242,0.3)' }}>
            <div style={{ fontSize: 12, color: '#1877F2', fontWeight: 600, marginBottom: 8 }}>🔍 เพจที่พบ (คลิกเพื่อเพิ่ม)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {fbPages.map(p => {
                const alreadyAdded = groups.some(g => g.pageId === p.id);
                return (
                  <div key={p.id} onClick={() => {
                    if (alreadyAdded) return;
                    setPageForm(f => ({ ...f, pageId: p.id, pageToken: p.accessToken }));
                    showToast(`เลือก: ${p.name} — กด "เพิ่มเพจ" เพื่อบันทึก`, 'success');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: alreadyAdded ? 'rgba(16,185,129,0.08)' : '#111827',
                    border: `1px solid ${alreadyAdded ? 'rgba(16,185,129,0.3)' : '#2A3650'}`,
                    borderRadius: 8, cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.6 : 1
                  }}>
                    {p.picture && <img src={p.picture} alt="" style={{ width: 32, height: 32, borderRadius: 6 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#5A647A' }}>{p.category} · {p.fans?.toLocaleString()} fans</div>
                    </div>
                    {alreadyAdded ? (
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ เพิ่มแล้ว</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#1877F2', fontWeight: 600 }}>+ เลือก</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pages list grouped */}
        {groupNames.map(gName => {
          const pagesInGroup = actualPages.filter(g => g.name === gName);
          if (pagesInGroup.length === 0) return null;
          return (
            <div key={gName} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                📁 {gName}
                <span style={{ padding: '1px 8px', background: '#8B5CF622', borderRadius: 10, fontSize: 11 }}>{pagesInGroup.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pagesInGroup.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: '#0A0E17', borderRadius: 10, border: '1px solid #2A3650'
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: (p.color || '#1877F2') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Svg size={18} style={{ color: p.color || '#1877F2' }}>{I.facebook}</Svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.pageName || 'ไม่ทราบชื่อเพจ'}</div>
                      <div style={{ fontSize: 11, color: '#5A647A', fontFamily: "'JetBrains Mono',monospace" }}>ID: {p.pageId}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Svg size={14}>{I.check}</Svg> เชื่อมต่อ
                    </div>
                    <button style={{ ...S.iconBtn, borderColor: '#EF4444' }} onClick={() => deletePage(p.id)}>
                      <Svg size={14} style={{ color: '#EF4444' }}>{I.trash}</Svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {actualPages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#5A647A' }}>
            <Svg size={40} style={{ color: '#2A3650', marginBottom: 8 }}>{I.facebook}</Svg>
            <p>ยังไม่มีเพจ — เพิ่มเพจด้านบนหรือกด "ดึงเพจอัตโนมัติ"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CAPTIONS PAGE ====================
function CaptionsPage({ captions, groups, onSave, showToast }) {
  const [sg, setSg] = useState('_default');
  const [text, setText] = useState('');
  const fileRef = useRef();
  const filtered = captions.filter(c => c.groupId === sg);

  return (
    <div><div style={S.pageHeader}><h1 style={S.pageTitle}>แคปชั่น</h1><span style={{ fontSize: 13, color: '#8B95A8' }}>ทั้งหมด {captions.length}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>เพิ่มแคปชั่น</h3>
          <label style={S.label}>กลุ่ม</label>
          <select style={S.input} value={sg} onChange={e => setSg(e.target.value)}><option value="_default">ทั่วไป</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
          <label style={{ ...S.label, marginTop: 14 }}>แคปชั่น (คั่น ---)</label>
          <textarea style={{ ...S.input, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }} value={text} onChange={e => setText(e.target.value)} placeholder={"สินค้าดี ราคาถูก 🔥\n---\nFlash Sale ⚡"} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={S.btnPrimary} onClick={() => { if (!text.trim()) return; const items = text.split('---').map(t => t.trim()).filter(Boolean); onSave([...captions, ...items.map(t => ({ id: uid(), groupId: sg, text: t, createdAt: now() }))]); setText(''); showToast(`เพิ่ม ${items.length} แคปชั่น`, 'success'); }}><Svg size={16}>{I.save}</Svg> บันทึก</button>
            <button style={S.btnSecondary} onClick={() => fileRef.current?.click()}><Svg size={16}>{I.upload}</Svg> อัพโหลด .txt</button>
            <input ref={fileRef} type="file" accept=".txt,.csv" hidden onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setText(ev.target.result); showToast('โหลดไฟล์สำเร็จ', 'success'); }; r.readAsText(f); e.target.value = ''; }} />
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.cardTitle}>แคปชั่นในกลุ่ม <span style={{ marginLeft: 8, padding: '2px 10px', background: '#1877F2', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{filtered.length}</span></h3>
          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.length === 0 && <p style={{ color: '#5A647A', fontSize: 13 }}>ไม่มีแคปชั่น</p>}
            {filtered.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#0F1629', borderRadius: 8, border: '1px solid #2A3650' }}>
                <div style={{ flex: 1, fontSize: 12, color: '#C5CAD3', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.text}</div>
                <button style={{ ...S.iconBtn, width: 24, height: 24 }} onClick={() => onSave(captions.filter(x => x.id !== c.id))}><Svg size={12} style={{ color: '#EF4444' }}>{I.x}</Svg></button>
              </div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SETTINGS PAGE ====================
function SettingsPage({ config, onSave, onInit, showToast }) {
  const [form, setForm] = useState(config);
  return (
    <div><div style={S.pageHeader}><h1 style={S.pageTitle}>ตั้งค่า</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ ...S.card, border: '1px solid #1877F2' }}>
          <h3 style={{ ...S.cardTitle, color: '#1877F2' }}><Svg size={20}>{I.facebook}</Svg>&nbsp; Facebook</h3>
          <label style={S.label}>User Access Token</label><input style={S.input} type="password" value={form.fbUserToken} onChange={e => setForm(f => ({ ...f, fbUserToken: e.target.value }))} placeholder="Facebook User Access Token" />
          <p style={{ fontSize: 11, color: '#5A647A', marginTop: 6 }}>รับ Token จาก <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{ color: '#1877F2' }}>Graph API Explorer</a></p>
          <label style={{ ...S.label, marginTop: 14 }}>Default Delay (วินาที)</label><input style={S.input} type="number" value={form.defaultDelay} min="10" max="300" onChange={e => setForm(f => ({ ...f, defaultDelay: +e.target.value }))} />
        </div>
        <div style={{ ...S.card, border: '1px solid #10B981' }}>
          <h3 style={{ ...S.cardTitle, color: '#10B981' }}><Svg size={20}>{I.db}</Svg>&nbsp; Google Sheets</h3>
          <label style={S.label}>Spreadsheet ID</label><input style={S.input} value={form.spreadsheetId} onChange={e => setForm(f => ({ ...f, spreadsheetId: e.target.value }))} placeholder="จาก URL" />
          <label style={{ ...S.label, marginTop: 14 }}>OAuth Token</label><input style={S.input} type="password" value={form.googleOAuthToken} onChange={e => setForm(f => ({ ...f, googleOAuthToken: e.target.value }))} placeholder="Google OAuth Token" />
          <p style={{ fontSize: 11, color: '#5A647A', marginTop: 6 }}>ใช้ <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noreferrer" style={{ color: '#10B981' }}>OAuth Playground</a></p>
          <label style={{ ...S.label, marginTop: 14 }}>API Key</label><input style={S.input} value={form.sheetsApiKey} onChange={e => setForm(f => ({ ...f, sheetsApiKey: e.target.value }))} placeholder="ไม่บังคับ" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button style={S.btnPrimary} onClick={() => onSave(form)}><Svg size={16}>{I.save}</Svg> บันทึกตั้งค่า</button>
        <button style={S.btnSecondary} onClick={onInit}><Svg size={16}>{I.db}</Svg> สร้าง Sheet Headers</button>
      </div>
      <div style={{ ...S.card, marginTop: 24 }}>
        <h3 style={S.cardTitle}>📋 วิธีตั้งค่า</h3>
        <ol style={{ color: '#8B95A8', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>สร้าง Google Spreadsheet → สร้าง 5 sheets: <code>groups</code>, <code>captions</code>, <code>media</code>, <code>activity</code>, <code>settings</code></li>
          <li>คัดลอก Spreadsheet ID จาก URL</li>
          <li>ไป <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noreferrer" style={{ color: '#10B981' }}>OAuth Playground</a> → เลือก Google Sheets API v4 → Authorize → คัดลอก Access Token</li>
          <li>วาง Token ที่นี่ → บันทึก → กด "สร้าง Sheet Headers"</li>
        </ol>
      </div>
    </div>
  );
}

// ==================== STYLES ====================
const S = {
  app: { display: 'flex', minHeight: '100vh', background: '#070B14', fontFamily: "'Sarabun','Noto Sans Thai',sans-serif", color: '#F0F2F5' },
  sidebar: { width: 240, background: '#0C1120', borderRight: '1px solid #1A2235', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 18px', borderBottom: '1px solid #1A2235' },
  logoBox: { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1877F2,#0C54B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  logoTitle: { fontSize: 16, fontWeight: 800, letterSpacing: -0.5 },
  logoBadge: { fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: 1 },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', color: '#5A647A', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8, textAlign: 'left', width: '100%', transition: '0.15s' },
  navActive: { background: 'rgba(24,119,242,0.12)', color: '#1877F2' },
  sidebarFooter: { padding: '14px 18px', borderTop: '1px solid #1A2235' },
  dbStatus: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  main: { flex: 1, marginLeft: 240, padding: '24px 32px', minHeight: '100vh' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  card: { background: '#111827', borderRadius: 14, padding: 20, border: '1px solid #1A2235' },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center' },
  statCard: { background: '#111827', borderRadius: 14, padding: 20, border: '1px solid #1A2235' },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#8B95A8', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#0A0E17', border: '1px solid #2A3650', borderRadius: 8, color: '#F0F2F5', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', background: '#1877F2', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', background: '#1A2235', color: '#8B95A8', border: '1px solid #2A3650', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSmall: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 6, color: 'white', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  iconBtn: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #2A3650', borderRadius: 6, color: '#5A647A', cursor: 'pointer' },
  modeBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', background: '#1A2235', border: '1px solid #2A3650', borderRadius: 8, color: '#5A647A', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  modeBtnActive: { background: 'rgba(24,119,242,0.12)', borderColor: '#1877F2', color: '#1877F2' },
  loadingScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  setupScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' },
  setupCard: { textAlign: 'center', padding: 48, background: '#111827', borderRadius: 20, border: '1px solid #1A2235', maxWidth: 420 },
  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 28px', borderRadius: 12, color: 'white', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 999, animation: 'toastIn 0.3s ease' },
};

const globalCSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#070B14; overflow-x:hidden; }
  ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#2A3650; border-radius:3px; }
  input:focus,textarea:focus,select:focus { border-color:#1877F2!important; box-shadow:0 0 0 3px rgba(24,119,242,0.15); }
  button:hover { filter:brightness(1.08); } button:disabled { opacity:0.4; cursor:not-allowed; }
  code { background:#0F1629; padding:2px 6px; border-radius:4px; font-size:11px; font-family:'JetBrains Mono',monospace; }
  .spinner { width:32px; height:32px; border:3px solid #2A3650; border-top-color:#1877F2; border-radius:50%; animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B95A8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px; }
  option { background:#111827; color:#F0F2F5; }
`;
