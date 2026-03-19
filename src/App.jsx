import { useState, useEffect, useRef } from 'react';
import { sheetsDB } from './services/googleSheets';
import { facebookAPI } from './services/facebook';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => new Date().toISOString();
const fmt = (iso) => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('th-TH',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}); };
const fmtSize = (b) => b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB';
const isVideoMime = (m) => m?.startsWith('video/');
const isVideoUrl = (u) => /\.(mp4|mov|avi|wmv|flv|webm)(\?|$)/i.test(u);

const GCOLORS = ['#1877F2','#E74C3C','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E91E63','#607D8B','#00BCD4','#FF5722'];

const I = {
  dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  post:<><path d="M12 5v14"/><path d="M5 12h14"/></>,
  caption:<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></>,
  group:<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>,
  media:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  play:<polygon points="5 3 19 12 5 21 5 3"/>,
  stop:<rect x="6" y="6" width="12" height="12"/>,
  check:<polyline points="20 6 9 17 4 12"/>,
  x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  upload:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  trash:<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  refresh:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
  shuffle:<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></>,
  list:<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></>,
  link:<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  pulse:<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  db:<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  facebook:<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  save:<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></>,
  file:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  film:<><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></>,
  hdd:<><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
  eye:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  send:<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  image:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  heart:<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  share:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  msgCircle:<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
  thumbsUp:<><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>,
};
const Svg = ({children,size=20,...p}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>;

// ==================== MAIN APP ====================
export default function App() {
  const [page, setPage] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dbOk, setDbOk] = useState(false);
  const [config, setConfig] = useState(() => { try { return JSON.parse(localStorage.getItem('fb_poster_config')||'{}'); } catch { return {}; }});

  const [groups, setGroups] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [fbPages, setFbPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postProgress, setPostProgress] = useState({current:0,total:0,results:[]});
  const stopRef = useRef(false);

  useEffect(() => { loadAll(); loadIDB(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [g,c,m,a] = await Promise.all([sheetsDB.getGroups(),sheetsDB.getCaptions(),sheetsDB.getMedia(),sheetsDB.getActivity()]);
      setGroups(g); setCaptions(c); setMediaUrls(m); setActivity(a.slice(0,50)); setDbOk(true);
    } catch(e) { console.error(e); setDbOk(false); }
    setLoading(false);
  }

  // IndexedDB
  function openIDB() { return new Promise((res,rej)=>{ const r=indexedDB.open('FBPosterFiles',1); r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'}); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
  async function loadIDB() { try { const db=await openIDB(); const tx=db.transaction('files','readonly'); const req=tx.objectStore('files').getAll(); req.onsuccess=()=>setUploadedFiles(req.result||[]); } catch{} }
  async function saveIDB(f) { try { const db=await openIDB(); db.transaction('files','readwrite').objectStore('files').put(f); } catch{} }
  async function delIDB(id) { try { const db=await openIDB(); db.transaction('files','readwrite').objectStore('files').delete(id); } catch{} }
  async function clearIDB() { try { const db=await openIDB(); db.transaction('files','readwrite').objectStore('files').clear(); } catch{} }

  function notify(msg,type='info') { setToast({msg,type}); setTimeout(()=>setToast(null),3500); }
  function saveCfg(c) { const n={...config,...c}; setConfig(n); localStorage.setItem('fb_poster_config',JSON.stringify(n)); }

  async function fetchPages() {
    if(!config.fbUserToken) { notify('ใส่ Facebook Token ที่เมนูเพจก่อน','error'); return; }
    setLoadingPages(true);
    try { setFbPages(await facebookAPI.getMyPages(config.fbUserToken)); notify(`พบเพจ`,'success'); } catch(e) { notify('ดึงเพจล้มเหลว: '+e.message,'error'); }
    setLoadingPages(false);
  }

  const allMedia = [...mediaUrls.map(m=>({...m,source:'url',isVideo:m.type==='video'})), ...uploadedFiles.map(f=>({...f,source:'base64',isVideo:isVideoMime(f.mimeType)}))];

  const menu = [
    {id:'posts',icon:I.send,label:'โพส'},
    {id:'groups',icon:I.facebook,label:'เพจ'},
    {id:'captions',icon:I.caption,label:'แคปชั่น'},
    {id:'dashboard',icon:I.dashboard,label:'แดชบอร์ด'},
  ];

  return (
    <div style={S.app}><style>{CSS}</style>
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.logoBox}><Svg size={20}>{I.facebook}</Svg></div>
          <div><div style={{fontSize:15,fontWeight:800}}>Bulk Poster</div><div style={{fontSize:9,fontWeight:700,color:'#F59E0B',letterSpacing:1}}>PRO v3</div></div>
        </div>
        <nav style={S.nav}>
          {menu.map(m=>(
            <button key={m.id} style={page===m.id?{...S.navItem,...S.navActive}:S.navItem} onClick={()=>setPage(m.id)}>
              <Svg size={18}>{m.icon}</Svg><span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div style={S.sidebarFoot}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:dbOk?'#10B981':'#EF4444'}}/>
            <span style={{fontSize:11,color:'#8B95A8'}}>{dbOk?'DB เชื่อมต่อ':'ไม่ได้เชื่อมต่อ'}</span>
          </div>
        </div>
      </aside>

      <main style={S.main}>
        {loading ? <div style={S.center}><div className="spinner"/><p style={{marginTop:16,color:'#8B95A8'}}>กำลังโหลด...</p></div> : <>
          {page==='posts' && <PostPage {...{groups,captions,allMedia,mediaUrls,uploadedFiles,config,isPosting,postProgress,notify,
            onSaveUrls:async u=>{setMediaUrls(u);await sheetsDB.saveMedia(u);},
            onAddFiles:async files=>{for(const f of files) await saveIDB(f); setUploadedFiles(p=>[...p,...files]);},
            onDelFile:async id=>{await delIDB(id);setUploadedFiles(p=>p.filter(f=>f.id!==id));},
            onClearFiles:async()=>{await clearIDB();setUploadedFiles([]);},
            onStart:async pc=>{
              setIsPosting(true);stopRef.current=false;setPostProgress({current:0,total:pc.posts.length,results:[]});
              await facebookAPI.bulkPost({posts:pc.posts,delayMs:pc.delay*1000,shouldStop:()=>stopRef.current,
                onProgress:(cur,tot,res)=>setPostProgress(p=>({current:cur,total:tot,results:[...p.results,res]})),
                onComplete:async results=>{setIsPosting(false);const s=results.filter(r=>r.success).length;notify(`เสร็จ! สำเร็จ ${s}/${results.length}`,s===results.length?'success':'error');try{await sheetsDB.logActivity('bulk_post',`${s}/${results.length}`,`group:${pc.groupName}`);loadAll();}catch{}}
              });
            },
            onStop:()=>{stopRef.current=true;setIsPosting(false);}
          }}/>}
          {page==='groups' && <GroupsPage {...{groups,fbPages,loadingPages,config,onFetchPages:fetchPages,onSaveCfg:saveCfg,onSave:async u=>{setGroups(u);await sheetsDB.saveGroups(u);notify('บันทึกสำเร็จ','success');},notify}}/>}
          {page==='captions' && <CaptionsPage {...{captions,groups,onSave:async u=>{setCaptions(u);await sheetsDB.saveCaptions(u);notify('บันทึกสำเร็จ','success');},notify}}/>}
          {page==='dashboard' && <DashboardPage {...{groups,captions,allMedia,activity,onRefresh:loadAll}}/>}
        </>}
      </main>
      {toast&&<div style={{...S.toast,background:toast.type==='success'?'#10B981':toast.type==='error'?'#EF4444':'#1877F2'}}>{toast.msg}</div>}
    </div>
  );
}

// ==================== POST PAGE (merged posts + media + preview) ====================
function PostPage({groups,captions,allMedia,mediaUrls,uploadedFiles,config,isPosting,postProgress,notify,onSaveUrls,onAddFiles,onDelFile,onClearFiles,onStart,onStop}) {
  const [selGroup,setSelGroup] = useState('');
  const [postCount,setPostCount] = useState(10);
  const [delay,setDelay] = useState(config.defaultDelay||30);
  const [capMode,setCapMode] = useState('random');
  const [mediaMode,setMediaMode] = useState('random');
  const [singleCap,setSingleCap] = useState('');
  const [dragging,setDragging] = useState(false);
  const [urlInput,setUrlInput] = useState('');
  const [showUrlBox,setShowUrlBox] = useState(false);
  const [previewPosts,setPreviewPosts] = useState([]);
  const fileRef = useRef();

  const group = groups.find(g=>g.id===selGroup);
  const actualPages = groups.filter(g=>g.pageId);
  const groupNames = ['Default',...new Set(groups.map(g=>g.name).filter(n=>n&&n!=='Default'))];
  const gc = captions.filter(c=>!selGroup || c.groupId===groups.find(g=>g.id===selGroup)?.name || c.groupId==='_default');
  const gm = allMedia.filter(m=>!selGroup || m.groupId===groups.find(g=>g.id===selGroup)?.name || m.groupId==='_default');

  // Generate preview posts
  function generatePreview() {
    if(!group) { notify('เลือกเพจก่อน','error'); return; }
    const posts = [];
    for(let i=0;i<postCount;i++){
      let caption;
      if(capMode==='single') caption=singleCap;
      else if(capMode==='random') caption=gc[Math.floor(Math.random()*gc.length)]?.text||'(ไม่มีแคปชั่น)';
      else caption=gc[i%gc.length]?.text||'(ไม่มีแคปชั่น)';

      let media=null;
      if(gm.length>0){
        const idx=mediaMode==='random'?Math.floor(Math.random()*gm.length):i%gm.length;
        media=gm[idx];
      }
      posts.push({caption,media,pageId:group.pageId,pageToken:group.pageToken,pageName:group.pageName||group.pageId});
    }
    setPreviewPosts(posts);
  }

  function startPost() {
    if(previewPosts.length===0){notify('กด "ดูตัวอย่าง" ก่อน','error');return;}
    const posts = previewPosts.map(p=>({
      pageId:p.pageId, pageToken:p.pageToken, caption:p.caption,
      media: p.media ? (p.media.source==='url'?{source:'url',url:p.media.url,isVideo:p.media.isVideo}:
        p.media.source==='base64'?{source:'base64',base64:p.media.base64,mimeType:p.media.mimeType,fileName:p.media.fileName,isVideo:p.media.isVideo}:null) : null
    }));
    onStart({posts,delay,groupName:group?.name||''});
  }

  // File upload
  function handleDrop(e){e.preventDefault();setDragging(false);processFiles(e.dataTransfer.files);}
  function handleFileSelect(e){processFiles(e.target.files);e.target.value='';}
  async function processFiles(fl){
    const arr=Array.from(fl).slice(0,50-uploadedFiles.length);
    if(!arr.length){notify('สูงสุด 50 ไฟล์','error');return;}
    const processed=[];
    for(const f of arr){
      const dataUrl=await new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(rd.result);rd.readAsDataURL(f);});
      processed.push({id:uid(),groupId:group?.name||'_default',fileName:f.name,mimeType:f.type,fileSize:f.size,base64:dataUrl.split(',')[1],preview:f.type.startsWith('image/')?dataUrl:null,isVideo:isVideoMime(f.type),createdAt:now()});
    }
    onAddFiles(processed); notify(`เพิ่ม ${arr.length} ไฟล์`,'success');
  }
  function addUrls(){
    if(!urlInput.trim())return;
    const urls=urlInput.split('\n').map(u=>u.trim()).filter(Boolean);
    const newM=urls.map(u=>({id:uid(),groupId:group?.name||'_default',url:u,type:isVideoUrl(u)?'video':'image',createdAt:now()}));
    onSaveUrls([...mediaUrls,...newM]); setUrlInput(''); notify(`เพิ่ม ${urls.length} URL`,'success');
  }

  // Progress view
  const pct=postProgress.total>0?(postProgress.current/postProgress.total)*100:0;
  const circ=2*Math.PI*54; const dashOff=circ-(pct/100)*circ;
  const suc=postProgress.results.filter(r=>r.success).length;
  const fail=postProgress.results.length-suc;
  const done=postProgress.current>=postProgress.total&&!isPosting&&postProgress.results.length>0;

  if(isPosting||done){
    return <div>
      <div style={S.pageHeader}><h1 style={S.pageTitle}>{done?'เสร็จสิ้น!':'กำลังโพสต์...'}</h1></div>
      <div style={{display:'flex',gap:24}}>
        <div style={{...S.card,flex:'0 0 260px',textAlign:'center',padding:28}}>
          <div style={{position:'relative',width:130,height:130,margin:'0 auto'}}>
            <svg viewBox="0 0 120 120" width={130} height={130} style={{transform:'rotate(-90deg)'}}>
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" stroke="#2A3650"/>
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" stroke={done?'#10B981':'#1877F2'} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOff} style={{transition:'0.5s'}}/>
            </svg>
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}>
              <div style={{fontSize:32,fontWeight:800,fontFamily:'monospace'}}>{postProgress.current}</div>
              <div style={{fontSize:12,color:'#5A647A'}}>/ {postProgress.total}</div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:18}}>
            <div><div style={{fontSize:20,fontWeight:700,color:'#10B981'}}>{suc}</div><div style={{fontSize:10,color:'#5A647A'}}>สำเร็จ</div></div>
            <div><div style={{fontSize:20,fontWeight:700,color:'#EF4444'}}>{fail}</div><div style={{fontSize:10,color:'#5A647A'}}>ล้มเหลว</div></div>
          </div>
          {isPosting&&<button style={{...S.btnDanger,width:'100%',marginTop:18}} onClick={onStop}><Svg size={16}>{I.stop}</Svg> หยุด</button>}
          {done&&<button style={{...S.btnPrimary,width:'100%',marginTop:18}} onClick={()=>{setPreviewPosts([]);postProgress.results.length=0;}}>สร้างโพสต์ใหม่</button>}
        </div>
        <div style={{...S.card,flex:1,maxHeight:450,overflowY:'auto'}}>
          <h3 style={S.cardTitle}>ผลลัพธ์</h3>
          {postProgress.results.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',marginBottom:3,background:'#0F1629',borderRadius:6,borderLeft:`3px solid ${r.success?'#10B981':'#EF4444'}`}}>
              <span style={{fontFamily:'monospace',fontSize:11,color:'#5A647A',minWidth:28}}>#{i+1}</span>
              <span style={{flex:1,fontSize:12,color:r.success?'#10B981':'#EF4444'}}>{r.success?'✓ สำเร็จ':'✗ '+(r.error||'ผิดพลาด')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>;
  }

  return <div>
    <div style={S.pageHeader}><h1 style={S.pageTitle}>สร้างโพสต์</h1></div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      {/* ===== LEFT: Settings + Media ===== */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {/* Select page */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>1. เลือกเพจ</h3>
          <select style={S.input} value={selGroup} onChange={e=>{setSelGroup(e.target.value);setPreviewPosts([]);}}>
            <option value="">-- เลือกเพจ --</option>
            {actualPages.map(g=><option key={g.id} value={g.id}>{g.pageName||g.pageId} ({g.name})</option>)}
          </select>
          {!actualPages.length&&<p style={{fontSize:12,color:'#F59E0B',marginTop:8}}>⚠ ยังไม่มีเพจ — ไปเพิ่มที่เมนู "เพจ" ก่อน</p>}
        </div>

        {/* Post settings */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>2. ตั้งค่า</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={S.label}>จำนวนโพสต์</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="range" min="1" max="50" value={postCount} onChange={e=>setPostCount(+e.target.value)} style={{flex:1,accentColor:'#1877F2'}}/>
                <span style={{fontFamily:'monospace',fontSize:18,fontWeight:700,color:'#1877F2',minWidth:28}}>{postCount}</span>
              </div>
            </div>
            <div>
              <label style={S.label}>หน่วงเวลา (วินาที)</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="range" min="10" max="300" step="5" value={delay} onChange={e=>setDelay(+e.target.value)} style={{flex:1,accentColor:'#F59E0B'}}/>
                <span style={{fontFamily:'monospace',fontSize:18,fontWeight:700,color:'#F59E0B',minWidth:36}}>{delay}s</span>
              </div>
            </div>
          </div>
          <label style={{...S.label,marginTop:14}}>โหมดแคปชั่น</label>
          <div style={{display:'flex',gap:6}}>
            {[{id:'random',icon:I.shuffle,l:'สุ่ม'},{id:'sequential',icon:I.list,l:'ตามลำดับ'},{id:'single',icon:I.file,l:'แคปชั่นเดียว'}].map(m=>
              <button key={m.id} onClick={()=>setCapMode(m.id)} style={{...S.modeBtn,...(capMode===m.id?S.modeBtnActive:{})}}><Svg size={16}>{m.icon}</Svg> {m.l}</button>
            )}
          </div>
          {capMode==='single'&&<textarea style={{...S.input,marginTop:10,minHeight:60}} value={singleCap} onChange={e=>setSingleCap(e.target.value)} placeholder="พิมพ์แคปชั่น..."/>}
        </div>

        {/* Media upload */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>3. สื่อ (รูป/วิดีโอ)
            <span style={{marginLeft:'auto',fontSize:12,fontWeight:500,color:'#8B95A8'}}>{allMedia.length} รายการ</span>
          </h3>
          <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop} onClick={()=>fileRef.current?.click()}
            style={{padding:'24px 16px',border:`2px dashed ${dragging?'#1877F2':'#2A3650'}`,borderRadius:12,textAlign:'center',cursor:'pointer',background:dragging?'rgba(24,119,242,0.05)':'#0A0E17',transition:'0.2s'}}>
            <Svg size={28} style={{color:'#1877F2',margin:'0 auto'}}>{I.upload}</Svg>
            <p style={{fontSize:13,fontWeight:600,marginTop:8}}>ลากไฟล์มาวาง หรือคลิกเลือก</p>
            <p style={{fontSize:11,color:'#5A647A',marginTop:4}}>JPG, PNG, MP4, MOV — สูงสุด 50 ไฟล์</p>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*" hidden onChange={handleFileSelect}/>
          </div>

          {/* File thumbnails */}
          {uploadedFiles.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:10}}>
            {uploadedFiles.slice(0,10).map(f=>(
              <div key={f.id} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',border:'1px solid #2A3650',background:'#0A0E17'}}>
                {f.preview?<img src={f.preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#F59E0B'}}><Svg size={20}>{I.film}</Svg></div>}
                <button onClick={e=>{e.stopPropagation();onDelFile(f.id);}} style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(239,68,68,0.9)',border:'none',color:'#fff',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
              </div>
            ))}
            {uploadedFiles.length>10&&<div style={{aspectRatio:'1',borderRadius:8,background:'#1A2235',display:'flex',alignItems:'center',justifyContent:'center',color:'#8B95A8',fontSize:12}}>+{uploadedFiles.length-10}</div>}
          </div>}

          {/* URL input toggle */}
          <button onClick={()=>setShowUrlBox(!showUrlBox)} style={{...S.btnSmall,background:'none',border:'1px solid #2A3650',color:'#8B95A8',marginTop:10,width:'100%'}}>
            <Svg size={14}>{I.link}</Svg> {showUrlBox?'ซ่อน URL':'เพิ่ม URL รูป/วิดีโอ'}
          </button>
          {showUrlBox&&<div style={{marginTop:8}}>
            <textarea style={{...S.input,minHeight:60,fontFamily:'monospace',fontSize:11}} value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder={"https://example.com/photo.jpg\nhttps://example.com/video.mp4"}/>
            <button style={{...S.btnPrimary,marginTop:6,width:'100%'}} onClick={addUrls}><Svg size={14}>{I.link}</Svg> เพิ่ม URL</button>
          </div>}
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:10}}>
          <button style={{...S.btnSecondary,flex:1,padding:'14px',fontSize:14}} onClick={generatePreview} disabled={!selGroup}>
            <Svg size={18}>{I.eye}</Svg> ดูตัวอย่าง {postCount} โพสต์
          </button>
          <button style={{...S.btnDanger,flex:1,padding:'14px',fontSize:14,opacity:previewPosts.length?1:0.4}} onClick={startPost} disabled={!previewPosts.length}>
            <Svg size={18}>{I.send}</Svg> โพสต์เลย!
          </button>
        </div>
      </div>

      {/* ===== RIGHT: Preview ===== */}
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <h3 style={{fontSize:15,fontWeight:700}}>ตัวอย่างโพสต์ {previewPosts.length>0&&<span style={{color:'#1877F2'}}>({previewPosts.length})</span>}</h3>
          {previewPosts.length>0&&<button style={S.btnSmall} onClick={generatePreview}><Svg size={12}>{I.shuffle}</Svg> สุ่มใหม่</button>}
        </div>

        <div style={{maxHeight:'calc(100vh - 140px)',overflowY:'auto',display:'flex',flexDirection:'column',gap:12,paddingRight:4}}>
          {previewPosts.length===0&&(
            <div style={{...S.card,textAlign:'center',padding:40}}>
              <Svg size={48} style={{color:'#2A3650'}}>{I.eye}</Svg>
              <p style={{color:'#5A647A',marginTop:12}}>กดปุ่ม "ดูตัวอย่าง" เพื่อเรนเดอร์โพสต์</p>
              <p style={{color:'#5A647A',fontSize:12,marginTop:4}}>ระบบจะจับคู่แคปชั่น + สื่อ แล้วแสดงก่อนโพสต์จริง</p>
            </div>
          )}
          {previewPosts.map((p,i)=><FBPostPreview key={i} index={i} post={p}/>)}
        </div>
      </div>
    </div>
  </div>;
}

// ==================== FB POST PREVIEW CARD ====================
function FBPostPreview({index,post}) {
  const hasMedia = !!post.media;
  const isVid = post.media?.isVideo;
  const thumbUrl = post.media?.preview || (post.media?.source==='url'?post.media.url:null);

  return (
    <div style={{background:'#1A2235',borderRadius:12,border:'1px solid #2A3650',overflow:'hidden'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px'}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'#1877F2',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:14,fontWeight:700}}>
          {(post.pageName||'P')[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:'#F0F2F5'}}>{post.pageName||'Page'}</div>
          <div style={{fontSize:10,color:'#5A647A'}}>ตัวอย่างโพสต์ #{index+1}</div>
        </div>
        <span style={{fontSize:10,padding:'2px 8px',background:'#1877F222',color:'#1877F2',borderRadius:10,fontWeight:600}}>#{index+1}</span>
      </div>

      {/* Caption */}
      <div style={{padding:'0 14px 10px',fontSize:13,color:'#C5CAD3',lineHeight:1.6,whiteSpace:'pre-wrap',maxHeight:80,overflow:'hidden'}}>
        {post.caption}
      </div>

      {/* Media */}
      {hasMedia&&(
        <div style={{width:'100%',aspectRatio:'16/9',background:'#0A0E17',position:'relative',overflow:'hidden'}}>
          {thumbUrl && !isVid ? (
            <img src={thumbUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
          ) : (
            <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
              <Svg size={32} style={{color:isVid?'#F59E0B':'#1877F2'}}>{isVid?I.film:I.image}</Svg>
              <span style={{fontSize:11,color:'#5A647A'}}>{isVid?'วิดีโอ':'รูปภาพ'}</span>
              {post.media?.fileName&&<span style={{fontSize:10,color:'#5A647A',fontFamily:'monospace'}}>{post.media.fileName}</span>}
              {post.media?.url&&<span style={{fontSize:10,color:'#5A647A',fontFamily:'monospace',maxWidth:'90%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.media.url}</span>}
            </div>
          )}
          <div style={{position:'absolute',top:8,right:8,padding:'2px 8px',background:isVid?'#F59E0BDD':'#1877F2DD',borderRadius:4,fontSize:10,fontWeight:700,color:'white'}}>
            {isVid?'VIDEO':'IMAGE'}
          </div>
        </div>
      )}

      {/* Fake FB actions */}
      <div style={{display:'flex',justifyContent:'space-around',padding:'8px 14px',borderTop:'1px solid #2A3650'}}>
        {[{icon:I.thumbsUp,label:'ถูกใจ'},{icon:I.msgCircle,label:'แสดงความคิดเห็น'},{icon:I.share,label:'แชร์'}].map((a,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:4,color:'#5A647A',fontSize:12}}>
            <Svg size={14}>{a.icon}</Svg>{a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== GROUPS PAGE ====================
function GroupsPage({groups,fbPages,loadingPages,config,onFetchPages,onSaveCfg,onSave,notify}) {
  const [newGrp,setNewGrp] = useState('');
  const [form,setForm] = useState({groupName:'Default',pageId:'',pageToken:''});
  const [loadingPage,setLoadingPage] = useState(false);
  const [showToken,setShowToken] = useState(false);

  const groupNames = ['Default',...new Set(groups.map(g=>g.name).filter(n=>n&&n!=='Default'))];
  const actualPages = groups.filter(g=>g.pageId);

  function addGroup(){
    const n=newGrp.trim();if(!n){notify('ใส่ชื่อกรุ๊ป','error');return;}
    if(groupNames.includes(n)){notify('ชื่อซ้ำ','error');return;}
    onSave([...groups,{id:uid(),name:n,pageId:'',pageName:'',pageToken:'',color:GCOLORS[groupNames.length%GCOLORS.length],createdAt:now()}]);
    setNewGrp('');
  }
  function delGroup(n){if(n==='Default')return;if(!confirm(`ลบกรุ๊ป "${n}"?`))return;onSave(groups.filter(g=>g.name!==n));}

  async function addPage(){
    if(!form.pageId.trim()||!form.pageToken.trim()){notify('ใส่ Page ID + Token','error');return;}
    setLoadingPage(true);
    let pageName='';
    try{const info=await facebookAPI.getPageInfo(form.pageId.trim(),form.pageToken.trim());pageName=info.name||'';notify(`พบ: ${pageName}`,'success');}catch{notify('ดึงชื่อไม่ได้','info');}
    const ci=groupNames.indexOf(form.groupName);
    const np={id:uid(),name:form.groupName,pageId:form.pageId.trim(),pageName,pageToken:form.pageToken.trim(),color:GCOLORS[ci>=0?ci%GCOLORS.length:0],createdAt:now()};
    const cleaned=groups.filter(g=>!(g.name===form.groupName&&!g.pageId));
    await onSave([...cleaned,np]); setForm(f=>({...f,pageId:'',pageToken:''})); setLoadingPage(false);
  }

  return <div>
    <div style={S.pageHeader}><h1 style={S.pageTitle}>เพจ</h1></div>

    {/* FB Token */}
    <div style={{...S.card,marginBottom:16,borderLeft:'3px solid #1877F2'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <Svg size={18} style={{color:'#1877F2'}}>{I.facebook}</Svg>
        <h3 style={{fontSize:14,fontWeight:700,margin:0}}>Facebook User Token</h3>
        <button onClick={()=>setShowToken(!showToken)} style={{...S.btnSmall,marginLeft:'auto',background:'#1A2235',border:'1px solid #2A3650',color:'#8B95A8'}}>{showToken?'ซ่อน':'แก้ไข'}</button>
      </div>
      {showToken&&<>
        <input style={S.input} type="password" value={config.fbUserToken||''} onChange={e=>onSaveCfg({fbUserToken:e.target.value})} placeholder="Facebook User Access Token"/>
        <p style={{fontSize:11,color:'#5A647A',marginTop:6}}>รับจาก <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" style={{color:'#1877F2'}}>Graph API Explorer</a> — ต้องมีสิทธิ์ pages_manage_posts + pages_show_list</p>
      </>}
      {!showToken&&config.fbUserToken&&<span style={{fontSize:12,color:'#10B981'}}>✓ ตั้งค่าแล้ว</span>}
      {!showToken&&!config.fbUserToken&&<span style={{fontSize:12,color:'#F59E0B'}}>⚠ ยังไม่ได้ตั้งค่า</span>}
    </div>

    {/* กรุ๊ป */}
    <div style={{...S.card,marginBottom:16,borderLeft:'3px solid #10B981'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <span style={{fontSize:20}}>📁</span><h3 style={{fontSize:15,fontWeight:700,margin:0}}>กรุ๊ปเพจ</h3>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <input style={{...S.input,flex:1}} value={newGrp} onChange={e=>setNewGrp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addGroup()} placeholder="ชื่อกรุ๊ปใหม่"/>
        <button style={{...S.btnPrimary,background:'#10B981',padding:'10px 24px'}} onClick={addGroup}>+ เพิ่มกรุ๊ป</button>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {groupNames.map(n=>(
          <div key={n} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.3)',fontSize:13,fontWeight:600,color:'#C4B5FD'}}>
            {n}{n!=='Default'&&<button onClick={()=>delGroup(n)} style={{width:18,height:18,borderRadius:'50%',border:'none',background:'rgba(239,68,68,0.3)',color:'#F87171',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>}
          </div>
        ))}
      </div>
    </div>

    {/* เพิ่มเพจ */}
    <div style={{...S.card,marginBottom:16,borderLeft:'3px solid #1877F2'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <span style={{fontSize:20}}>➕</span><h3 style={{fontSize:15,fontWeight:700,margin:0}}>เพิ่มเพจ</h3>
        {fbPages.length===0&&<button style={{...S.btnSmall,marginLeft:'auto',background:'#1877F2'}} onClick={onFetchPages} disabled={loadingPages}>{loadingPages?'⏳':'🔄 ดึงเพจอัตโนมัติ'}</button>}
      </div>

      {fbPages.length>0&&<div style={{marginBottom:14,padding:12,background:'#0A0E17',borderRadius:10,border:'1px solid rgba(24,119,242,0.3)'}}>
        <div style={{fontSize:12,color:'#1877F2',fontWeight:600,marginBottom:8}}>🔍 คลิกเลือกเพจ</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:180,overflowY:'auto'}}>
          {fbPages.map(p=>{const added=groups.some(g=>g.pageId===p.id);return(
            <div key={p.id} onClick={()=>{if(!added){setForm(f=>({...f,pageId:p.id,pageToken:p.accessToken}));notify(`เลือก: ${p.name}`,'success');}}}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:added?'rgba(16,185,129,0.08)':'#111827',border:`1px solid ${added?'rgba(16,185,129,0.3)':'#2A3650'}`,borderRadius:8,cursor:added?'default':'pointer',opacity:added?0.6:1}}>
              {p.picture&&<img src={p.picture} alt="" style={{width:32,height:32,borderRadius:6}}/>}
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.name}</div><div style={{fontSize:11,color:'#5A647A'}}>{p.fans?.toLocaleString()} fans</div></div>
              {added?<span style={{fontSize:11,color:'#10B981'}}>✓</span>:<span style={{fontSize:11,color:'#1877F2'}}>+ เลือก</span>}
            </div>);})}
        </div>
      </div>}

      <div style={{marginBottom:12}}>
        <label style={S.label}>กรุ๊ป</label>
        <select style={S.input} value={form.groupName} onChange={e=>setForm(f=>({...f,groupName:e.target.value}))}>{groupNames.map(n=><option key={n} value={n}>{n}</option>)}</select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
        <div><label style={S.label}>Page ID</label><input style={S.input} value={form.pageId} onChange={e=>setForm(f=>({...f,pageId:e.target.value}))} placeholder="123456789"/></div>
        <div><label style={S.label}>Page Token</label><input style={S.input} type="password" value={form.pageToken} onChange={e=>setForm(f=>({...f,pageToken:e.target.value}))} placeholder="วาง Token"/></div>
      </div>
      <button style={{...S.btnPrimary,width:'100%',padding:'14px',fontSize:15}} onClick={addPage} disabled={loadingPage}>{loadingPage?'⏳ กำลังตรวจสอบ...':'✅ เพิ่มเพจ'}</button>
    </div>

    {/* รายการเพจ */}
    <div style={S.card}>
      <h3 style={S.cardTitle}>📋 รายการเพจ <span style={{marginLeft:8,padding:'2px 10px',background:'#1877F2',borderRadius:20,fontSize:12,fontWeight:700}}>{actualPages.length}</span></h3>
      {groupNames.map(gn=>{const pgs=actualPages.filter(g=>g.name===gn);if(!pgs.length)return null;return(
        <div key={gn} style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#8B5CF6',marginBottom:6}}>📁 {gn}</div>
          {pgs.map(p=>(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#0A0E17',borderRadius:10,border:'1px solid #2A3650',marginBottom:6}}>
              <div style={{width:36,height:36,borderRadius:8,background:'#1877F222',display:'flex',alignItems:'center',justifyContent:'center'}}><Svg size={16} style={{color:'#1877F2'}}>{I.facebook}</Svg></div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.pageName||p.pageId}</div><div style={{fontSize:10,color:'#5A647A',fontFamily:'monospace'}}>ID: {p.pageId}</div></div>
              <span style={{fontSize:11,color:'#10B981'}}>✓</span>
              <button style={{...S.iconBtn,borderColor:'#EF4444'}} onClick={()=>{if(confirm('ลบ?'))onSave(groups.filter(x=>x.id!==p.id));}}><Svg size={14} style={{color:'#EF4444'}}>{I.trash}</Svg></button>
            </div>
          ))}
        </div>);})}
      {!actualPages.length&&<p style={{color:'#5A647A',fontSize:13,textAlign:'center',padding:20}}>ยังไม่มีเพจ</p>}
    </div>
  </div>;
}

// ==================== CAPTIONS PAGE ====================
function CaptionsPage({captions,groups,onSave,notify}) {
  const [sg,setSg] = useState('_default');
  const [text,setText] = useState('');
  const fileRef = useRef();
  const groupNames = ['Default',...new Set(groups.map(g=>g.name).filter(n=>n&&n!=='Default'))];
  const filtered = captions.filter(c=>c.groupId===sg);

  return <div>
    <div style={S.pageHeader}><h1 style={S.pageTitle}>แคปชั่น</h1><span style={{fontSize:13,color:'#8B95A8'}}>ทั้งหมด {captions.length}</span></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={S.card}>
        <h3 style={S.cardTitle}>เพิ่มแคปชั่น</h3>
        <label style={S.label}>กรุ๊ป</label>
        <select style={S.input} value={sg} onChange={e=>setSg(e.target.value)}>
          <option value="_default">Default</option>
          {groupNames.filter(n=>n!=='Default').map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <label style={{...S.label,marginTop:14}}>แคปชั่น (คั่น ---)</label>
        <textarea style={{...S.input,minHeight:160,resize:'vertical',lineHeight:1.6}} value={text} onChange={e=>setText(e.target.value)} placeholder={"สินค้าดี 🔥\n---\nFlash Sale ⚡\n---\ninbox เลย 💬"}/>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <button style={S.btnPrimary} onClick={()=>{if(!text.trim())return;const items=text.split('---').map(t=>t.trim()).filter(Boolean);onSave([...captions,...items.map(t=>({id:uid(),groupId:sg,text:t,createdAt:now()}))]);setText('');notify(`เพิ่ม ${items.length} แคปชั่น`,'success');}}><Svg size={16}>{I.save}</Svg> บันทึก</button>
          <button style={S.btnSecondary} onClick={()=>fileRef.current?.click()}><Svg size={16}>{I.upload}</Svg> อัพโหลด .txt</button>
          <input ref={fileRef} type="file" accept=".txt,.csv" hidden onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setText(ev.target.result);notify('โหลดไฟล์สำเร็จ','success');};r.readAsText(f);e.target.value='';}}/>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={S.cardTitle}>แคปชั่นในกรุ๊ป <span style={{marginLeft:8,padding:'2px 10px',background:'#1877F2',borderRadius:20,fontSize:11,fontWeight:700}}>{filtered.length}</span></h3>
        <div style={{maxHeight:400,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
          {!filtered.length&&<p style={{color:'#5A647A',fontSize:13}}>ไม่มีแคปชั่น</p>}
          {filtered.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:'#0F1629',borderRadius:8,border:'1px solid #2A3650'}}>
              <div style={{flex:1,fontSize:12,color:'#C5CAD3',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{c.text}</div>
              <button style={{...S.iconBtn,width:24,height:24}} onClick={()=>onSave(captions.filter(x=>x.id!==c.id))}><Svg size={12} style={{color:'#EF4444'}}>{I.x}</Svg></button>
            </div>))}
        </div>
      </div>
    </div>
  </div>;
}

// ==================== DASHBOARD ====================
function DashboardPage({groups,captions,allMedia,activity,onRefresh}) {
  const actualPages=groups.filter(g=>g.pageId);
  return <div>
    <div style={S.pageHeader}><h1 style={S.pageTitle}>แดชบอร์ด</h1><button style={S.btnSecondary} onClick={onRefresh}><Svg size={16}>{I.refresh}</Svg> รีเฟรช</button></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
      {[{l:'เพจ',v:actualPages.length,c:'#1877F2',bg:'rgba(24,119,242,0.1)',i:I.facebook},{l:'แคปชั่น',v:captions.length,c:'#10B981',bg:'rgba(16,185,129,0.1)',i:I.caption},{l:'สื่อ',v:allMedia.length,c:'#8B5CF6',bg:'rgba(139,92,246,0.1)',i:I.media},{l:'โพสต์',v:activity.filter(a=>a.action==='bulk_post').length,c:'#F59E0B',bg:'rgba(245,158,11,0.1)',i:I.pulse}].map((s,i)=>(
        <div key={i} style={S.statCard}><div style={{...S.statIcon,background:s.bg,color:s.c}}><Svg size={22}>{s.i}</Svg></div><div style={{fontSize:28,fontWeight:800,marginTop:12,fontFamily:'monospace'}}>{s.v}</div><div style={{fontSize:12,color:'#8B95A8',marginTop:2}}>{s.l}</div></div>
      ))}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div style={S.card}><h3 style={S.cardTitle}>เพจ</h3>
        {!actualPages.length?<p style={{color:'#5A647A',fontSize:13}}>ยังไม่มี</p>:actualPages.slice(0,5).map(g=>(
          <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #1A2235'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:g.color}}/><span style={{flex:1,fontSize:13,fontWeight:500}}>{g.pageName||g.pageId}</span><span style={{fontSize:11,color:'#5A647A'}}>{g.name}</span>
          </div>))}
      </div>
      <div style={S.card}><h3 style={S.cardTitle}>กิจกรรมล่าสุด</h3>
        {!activity.length?<p style={{color:'#5A647A',fontSize:13}}>ยังไม่มี</p>:activity.slice(0,8).map((a,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid #1A2235',fontSize:12}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#10B981'}}/><span style={{flex:1,color:'#8B95A8'}}>{a.action} — {a.detail}</span><span style={{fontSize:10,color:'#5A647A',fontFamily:'monospace'}}>{fmt(a.timestamp)}</span>
          </div>))}
      </div>
    </div>
  </div>;
}

// ==================== STYLES ====================
const S = {
  app:{display:'flex',minHeight:'100vh',background:'#070B14',fontFamily:"'Sarabun','Noto Sans Thai',sans-serif",color:'#F0F2F5'},
  sidebar:{width:200,background:'#0C1120',borderRight:'1px solid #1A2235',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:100},
  sidebarLogo:{display:'flex',alignItems:'center',gap:12,padding:'20px 16px',borderBottom:'1px solid #1A2235'},
  logoBox:{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#1877F2,#0C54B8)',display:'flex',alignItems:'center',justifyContent:'center',color:'white'},
  nav:{flex:1,padding:'12px 8px',display:'flex',flexDirection:'column',gap:2},
  navItem:{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'none',border:'none',color:'#5A647A',fontFamily:'inherit',fontSize:13,fontWeight:500,cursor:'pointer',borderRadius:8,textAlign:'left',width:'100%',transition:'0.15s'},
  navActive:{background:'rgba(24,119,242,0.12)',color:'#1877F2'},
  sidebarFoot:{padding:'14px 16px',borderTop:'1px solid #1A2235'},
  main:{flex:1,marginLeft:200,padding:'20px 28px',minHeight:'100vh'},
  pageHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20},
  pageTitle:{fontSize:22,fontWeight:800,letterSpacing:-0.5},
  card:{background:'#111827',borderRadius:14,padding:20,border:'1px solid #1A2235'},
  cardTitle:{fontSize:15,fontWeight:700,marginBottom:14,display:'flex',alignItems:'center'},
  statCard:{background:'#111827',borderRadius:14,padding:20,border:'1px solid #1A2235'},
  statIcon:{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'},
  label:{display:'block',fontSize:12,fontWeight:600,color:'#8B95A8',marginBottom:6},
  input:{width:'100%',padding:'10px 14px',background:'#0A0E17',border:'1px solid #2A3650',borderRadius:8,color:'#F0F2F5',fontFamily:'inherit',fontSize:13,outline:'none',boxSizing:'border-box'},
  btnPrimary:{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 20px',background:'#1877F2',color:'white',border:'none',borderRadius:8,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'},
  btnSecondary:{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 20px',background:'#1A2235',color:'#8B95A8',border:'1px solid #2A3650',borderRadius:8,fontFamily:'inherit',fontSize:13,fontWeight:600,cursor:'pointer'},
  btnDanger:{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 20px',background:'#EF4444',color:'white',border:'none',borderRadius:8,fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer'},
  btnSmall:{display:'inline-flex',alignItems:'center',gap:4,padding:'6px 12px',background:'#1877F2',border:'none',borderRadius:6,color:'white',fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer'},
  iconBtn:{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'1px solid #2A3650',borderRadius:6,color:'#5A647A',cursor:'pointer'},
  modeBtn:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 8px',background:'#1A2235',border:'1px solid #2A3650',borderRadius:8,color:'#5A647A',fontFamily:'inherit',fontSize:12,fontWeight:600,cursor:'pointer'},
  modeBtnActive:{background:'rgba(24,119,242,0.12)',borderColor:'#1877F2',color:'#1877F2'},
  center:{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh'},
  toast:{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',padding:'12px 28px',borderRadius:12,color:'white',fontSize:13,fontWeight:600,boxShadow:'0 8px 30px rgba(0,0,0,0.4)',zIndex:999,animation:'toastIn 0.3s ease'},
};
const CSS=`*{margin:0;padding:0;box-sizing:border-box}body{background:#070B14;overflow-x:hidden}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2A3650;border-radius:3px}input:focus,textarea:focus,select:focus{border-color:#1877F2!important;box-shadow:0 0 0 3px rgba(24,119,242,0.15);outline:none}button:hover{filter:brightness(1.08)}button:disabled{opacity:0.4;cursor:not-allowed}code{background:#0F1629;padding:2px 6px;border-radius:4px;font-size:11px;font-family:monospace}.spinner{width:32px;height:32px;border:3px solid #2A3650;border-top-color:#1877F2;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B95A8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}option{background:#111827;color:#F0F2F5}`;
