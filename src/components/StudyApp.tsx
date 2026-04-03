import { useEffect, useRef, useState } from 'react'
import type { UserProfile } from '@/lib/supabase'

interface Props {
  profile: UserProfile
  onSignOut: () => void
}

const LOCKED_SECTIONS = ['bigoh','recursion','sorting','ds','trees','avl','hashing','graphs','quiz','simulations','cheatsheet']

export default function StudyApp({ profile, onSignOut }: Props) {
  // Track open question per section and index
  const [openQA, setOpenQA] = useState<{ [section: string]: number | null }>({});

  // Handler for any .q-head click
  function handleQAExpand(section: string, idx: number) {
    setOpenQA(prev => ({ ...prev, [section]: prev[section] === idx ? null : idx }));
  }
  const hasAccess = profile.has_access
  const containerRef = useRef<HTMLDivElement>(null)
  const prevAccessRef = useRef(hasAccess)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const wasJustGranted = !prevAccessRef.current && hasAccess
    prevAccessRef.current = hasAccess

    if (hasAccess) {
      // Remove all lock overlays
      container.querySelectorAll('.lock-overlay').forEach(el => el.remove())
      // Re-enable locked nav items
      LOCKED_SECTIONS.forEach(id => {
        const sec = container.querySelector('#sec-' + id) as HTMLElement | null
        if (sec) sec.style.position = ''
        const nav = container.querySelector('#nav-' + id) as HTMLElement | null
        if (nav) {
          nav.style.opacity = '1'
          nav.style.cursor = 'pointer'
          nav.removeAttribute('data-locked')
        }
      })
      // Show toast if access was just granted live
      if (wasJustGranted) {
        const toast = document.createElement('div')
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1D9E75;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.15);'
        toast.textContent = '🔓 Full access granted! All topics are now unlocked.'
        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 4000)
      }
    } else {
      // Apply lock overlays
      LOCKED_SECTIONS.forEach(id => {
        const sec = container.querySelector('#sec-' + id)
        if (!sec) return
        if (sec.querySelector('.lock-overlay')) return
        const overlay = document.createElement('div')
        overlay.className = 'lock-overlay'
        overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(245,245,240,0.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:50;border-radius:8px;flex-direction:column;gap:12px;min-height:200px;'
        overlay.innerHTML = '<div style="font-size:32px">🔒</div><div style="font-size:16px;font-weight:700;color:#1a1a1a;text-align:center">Content Locked</div><div style="font-size:13px;color:#666;text-align:center;max-width:280px;line-height:1.6">This topic requires full access.<br>Complete payment and confirm with the admin on WhatsApp.</div><div style="font-size:12px;color:#aaa;text-align:center;padding:8px 16px;background:#fff;border-radius:8px;border:1px solid #e0e0d8">📱 Contact admin after payment to unlock</div>'
        ;(sec as HTMLElement).style.position = 'relative'
        sec.appendChild(overlay)
      })
      LOCKED_SECTIONS.forEach(id => {
        const nav = container.querySelector('#nav-' + id) as HTMLElement | null
        if (!nav) return
        nav.style.opacity = '0.5'
        nav.style.cursor = 'default'
        nav.setAttribute('data-locked', 'true')
      })
    }
  }, [hasAccess])


  // Navigation state
  const [activeSection, setActiveSection] = useState('overview');

  // Navigation click handler
  function handleNavClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const navItem = target.closest('.nav-item') as HTMLElement | null;
    if (!navItem) return;
    const navId = navItem.id;
    // Map nav id to section id
    const sectionMap: Record<string, string> = {
      'nav-overview': 'overview',
      'nav-logs': 'logs',
      'nav-bigoh': 'bigoh',
      'nav-recursion': 'recursion',
      'nav-sorting': 'sorting',
      'nav-ds': 'ds',
      'nav-trees': 'trees',
      'nav-avl': 'avl',
      'nav-hashing': 'hashing',
      'nav-graphs': 'graphs',
      'nav-quiz': 'quiz',
      'nav-simulations': 'simulations',
      'nav-cheatsheet': 'cheatsheet',
      'nav-bookmarks': 'bookmarks',
    };
    const section = sectionMap[navId];
    // Only allow access if user has access or it's the free topic (logs/overview)
    const freeSections = ['overview', 'logs'];
    if (hasAccess || freeSections.includes(section)) {
      setActiveSection(section);
    } else {
      // Optionally show a toast or message here
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;background:#f5f5f0;color:#1a1a1a;min-height:100vh}
        .topbar{background:#fff;border-bottom:1px solid #e0e0d8;padding:10px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;position:sticky;top:0;z-index:100}
        .app-title{font-size:16px;font-weight:600;color:#1a1a1a;white-space:nowrap}
        .search-wrap{flex:1;min-width:180px}
        .search-wrap input{width:100%;padding:7px 14px;border-radius:8px;border:1px solid #d0d0c8;background:#f5f5f0;color:#1a1a1a;font-size:13px;outline:none}
        .search-wrap input:focus{border-color:#7F77DD;background:#fff}
        .topbar-btns{display:flex;gap:6px;align-items:center}
        .tbtn{padding:6px 12px;border-radius:8px;border:1px solid #d0d0c8;background:#fff;cursor:pointer;font-size:12px;color:#555;font-weight:500}
        .tbtn:hover{background:#f5f5f0}
        .tbtn.active{background:#EEEDFE;color:#3C3489;border-color:#7F77DD}
        .user-pill{display:flex;align-items:center;gap:6px;padding:4px 10px;background:#f5f5f0;border-radius:20px;font-size:12px;color:#555;border:1px solid #e0e0d8}
        .user-pill .access-dot{width:7px;height:7px;border-radius:50%;background:${hasAccess ? '#1D9E75' : '#BA7517'};flex-shrink:0}

        .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px 20px;background:#fff;border-bottom:1px solid #e0e0d8}
        .stat{background:#f5f5f0;border-radius:8px;padding:8px 12px;text-align:center}
        .stat-n{font-size:20px;font-weight:700;color:#1a1a1a}
        .stat-l{font-size:11px;color:#888;margin-top:2px}

        .layout{display:flex;min-height:calc(100vh - 120px)}
        .sidebar{width:210px;flex-shrink:0;background:#fff;border-right:1px solid #e0e0d8;padding:8px 0;position:sticky;top:120px;height:calc(100vh - 120px);overflow-y:auto}
        .nav-item{padding:8px 16px;cursor:pointer;font-size:13px;color:#666;display:flex;align-items:center;gap:8px;border-left:3px solid transparent;transition:all 0.15s;user-select:none}
        .nav-item:hover{background:#f5f5f0;color:#1a1a1a}
        .nav-item.active{color:#3C3489;background:#EEEDFE;border-left-color:#7F77DD;font-weight:600}
        .nav-dot{width:8px;height:8px;border-radius:50%;background:#ddd;flex-shrink:0;transition:background 0.2s}
        .nav-dot.done{background:#1D9E75}
        .nav-badge{margin-left:auto;font-size:10px;background:#f0f0eb;padding:1px 6px;border-radius:8px;color:#999}
        .nav-item.active .nav-badge{background:#EEEDFE;color:#7F77DD}
        .nav-sep{height:1px;background:#e0e0d8;margin:6px 0}

        .main{flex:1;min-width:0;padding:16px 20px;max-width:900px}
        .section{display:none}
        .section.active{display:block}

        .sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .sec-title{font-size:20px;font-weight:700;color:#1a1a1a}
        .done-btn{padding:5px 14px;border-radius:20px;border:1px solid #d0d0c8;background:#fff;cursor:pointer;font-size:12px;color:#666;font-weight:500;transition:all 0.2s}
        .done-btn:hover{background:#f5f5f0}
        .done-btn.marked{background:#E1F5EE;color:#085041;border-color:#1D9E75;font-weight:600}

        .notes-card{background:#fff;border:1px solid #e0e0d8;border-radius:12px;padding:14px 16px;margin-bottom:12px}
        .notes-card-title{font-size:14px;font-weight:600;margin-bottom:10px;color:#1a1a1a}
        .nb{border-left:3px solid #7F77DD;padding:8px 12px;margin-bottom:8px;background:#EEEDFE;border-radius:0 6px 6px 0;font-size:13px;line-height:1.7;color:#1a1a1a}
        .nb:last-child{margin-bottom:0}
        .tip{border-left:3px solid #1D9E75;padding:8px 12px;background:#E1F5EE;border-radius:0 6px 6px 0;font-size:13px;line-height:1.6;color:#1a1a1a;margin-top:8px}
        .tip-lbl{font-size:11px;font-weight:700;color:#085041;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
        .warn{border-left:3px solid #BA7517;padding:8px 12px;background:#FAEEDA;border-radius:0 6px 6px 0;font-size:13px;line-height:1.6;color:#1a1a1a;margin-top:8px}
        .warn-lbl{font-size:11px;font-weight:700;color:#633806;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
        .kws{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
        .kw{background:#E6F1FB;color:#0C447C;font-size:11px;padding:2px 9px;border-radius:10px;font-weight:500}

        .subsec{font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.6px;margin:14px 0 6px}

        .q-acc{border:1px solid #e0e0d8;border-radius:10px;margin-bottom:8px;overflow:hidden;background:#fff}
        .q-head{padding:11px 14px;display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9f9f6;user-select:none;transition:background 0.15s}
        .q-head:hover{background:#f0f0eb}
        .bk-btn{width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;font-size:16px;opacity:0.35;transition:opacity 0.15s;background:none;border:none;line-height:1}
        .bk-btn:hover,.bk-btn.on{opacity:1}
        .q-meta{display:flex;gap:5px;flex-shrink:0;align-items:center}
        .yr{font-size:10px;background:#FAEEDA;color:#633806;padding:2px 7px;border-radius:8px;font-weight:600}
        .pt{font-size:10px;background:#E6F1FB;color:#0C447C;padding:2px 7px;border-radius:8px;font-weight:600}
        .de{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:600}
        .de.e{background:#EAF3DE;color:#27500A}
        .de.m{background:#FAEEDA;color:#633806}
        .de.h{background:#FCEBEB;color:#791F1F}
        .q-title{flex:1;font-size:13px;font-weight:600;color:#1a1a1a;min-width:0}
        .chev{font-size:11px;color:#aaa;transition:transform 0.2s;flex-shrink:0}
        .chev.open{transform:rotate(180deg)}
        .q-body{display:none;padding:14px;border-top:1px solid #e0e0d8}
        .q-body.open{display:block}
        .q-text{font-size:13px;color:#555;line-height:1.7;background:#f5f5f0;padding:8px 12px;border-radius:8px;margin-bottom:10px}
        .sol-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#aaa;margin:10px 0 6px}
        .step{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f0f0eb;font-size:13px;line-height:1.7;color:#1a1a1a}
        .step:last-child{border-bottom:none}
        .sn{min-width:22px;height:22px;background:#EEEDFE;color:#3C3489;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
        code{font-family:'Courier New',monospace;background:#f0f0eb;padding:1px 5px;border-radius:4px;font-size:12px}
        pre{font-family:'Courier New',monospace;background:#f0f0eb;padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.7;overflow-x:auto;margin:6px 0;white-space:pre-wrap}
        b{font-weight:600}

        .qz-score{background:#fff;border:1px solid #e0e0d8;border-radius:12px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:16px}
        .qz-big{font-size:30px;font-weight:700;color:#1a1a1a}
        .qz-bar-wrap{flex:1}
        .qz-bar-bg{height:8px;background:#f0f0eb;border-radius:4px;overflow:hidden}
        .qz-bar-fill{height:100%;background:#1D9E75;border-radius:4px;transition:width 0.4s}
        .qz-pct{font-size:12px;color:#888;margin-top:4px}
        .qz-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
        .qz-f{padding:5px 13px;border-radius:20px;border:1px solid #d0d0c8;background:#fff;cursor:pointer;font-size:12px;color:#666;font-weight:500;transition:all 0.15s}
        .qz-f:hover{background:#f5f5f0}
        .qz-f.active{background:#EEEDFE;color:#3C3489;border-color:#7F77DD;font-weight:600}
        .qz-q{background:#fff;border:1px solid #e0e0d8;border-radius:10px;padding:14px;margin-bottom:10px}
        .qz-qt{font-size:14px;font-weight:600;margin-bottom:10px;line-height:1.6;color:#1a1a1a}
        .qz-opt{display:block;width:100%;text-align:left;padding:9px 13px;margin:4px 0;border-radius:8px;border:1px solid #d0d0c8;background:#f9f9f6;cursor:pointer;font-size:13px;color:#1a1a1a;transition:all 0.15s;font-family:inherit}
        .qz-opt:hover:not(:disabled){background:#f0f0eb;border-color:#aaa}
        .qz-opt.correct{background:#E1F5EE;border-color:#1D9E75;color:#085041;font-weight:600}
        .qz-opt.wrong{background:#FCEBEB;border-color:#E24B4A;color:#791F1F}
        .qz-opt.reveal{background:#E1F5EE;border-color:#1D9E75;color:#085041}
        .qz-exp{font-size:13px;color:#555;margin-top:8px;padding:8px 12px;background:#f5f5f0;border-radius:8px;display:none;line-height:1.6}

        .sim-wrap{background:#f5f5f0;border-radius:10px;padding:12px;margin:8px 0}
        .sim-arr{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}
        .sim-box{width:44px;height:44px;border-radius:8px;border:1px solid #d0d0c8;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;background:#fff;color:#1a1a1a;transition:all 0.25s}
        .sim-box.comparing{background:#FAEEDA;border-color:#BA7517;color:#412402}
        .sim-box.swapped{background:#EEEDFE;border-color:#7F77DD;color:#26215C}
        .sim-box.sorted{background:#E1F5EE;border-color:#1D9E75;color:#04342C}
        .sim-log{font-size:13px;color:#555;min-height:38px;margin-top:6px;line-height:1.6}
        .sim-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
        .sim-btn{padding:6px 14px;border-radius:8px;border:1px solid #d0d0c8;background:#fff;cursor:pointer;font-size:12px;color:#555;font-weight:500;font-family:inherit;transition:all 0.15s}
        .sim-btn:hover:not(:disabled){background:#f0f0eb}
        .sim-btn:disabled{opacity:0.4;cursor:not-allowed}
        .sim-btn.primary{background:#7F77DD;color:#fff;border-color:#7F77DD}
        .sim-btn.primary:hover{background:#534AB7}
        select.algo-sel{padding:6px 10px;border-radius:8px;border:1px solid #d0d0c8;background:#fff;color:#1a1a1a;font-size:12px;font-family:inherit;cursor:pointer}
        .sim-stats{font-size:12px;color:#888;margin-top:6px}
        .legend{display:flex;gap:12px;font-size:11px;color:#888;margin-bottom:6px;flex-wrap:wrap}
        .leg-dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px}

        .avl-controls{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
        .avl-input{width:80px;padding:6px 10px;border-radius:8px;border:1px solid #d0d0c8;background:#fff;color:#1a1a1a;font-size:13px;font-family:inherit;outline:none}
        .avl-input:focus{border-color:#7F77DD}
        .avl-canvas{min-height:220px;background:#fff;border-radius:8px;overflow:hidden}
        .avl-log{font-size:13px;color:#555;margin-top:8px;padding:8px 12px;background:#fff;border-radius:8px;line-height:1.6;min-height:36px;border:1px solid #e0e0d8}

        .cheat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
        .cheat-card{background:#fff;border:1px solid #e0e0d8;border-radius:10px;padding:12px}
        .cheat-title{font-size:13px;font-weight:700;margin-bottom:8px;color:#1a1a1a;padding-bottom:6px;border-bottom:1px solid #f0f0eb}
        .cheat-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:4px 0;border-bottom:1px solid #f5f5f0;gap:8px}
        .cheat-row:last-child{border-bottom:none}
        .cheat-k{color:#666;flex-shrink:0}
        .cheat-v{font-weight:600;color:#1a1a1a;text-align:right}

        .topic-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:14px}
        .topic-card{border-radius:10px;padding:12px;cursor:pointer;transition:opacity 0.15s;border:1px solid transparent}
        .topic-card:hover{opacity:0.85}

        .no-results{padding:2rem;text-align:center;color:#aaa;font-size:14px}

        .bk-list-item{background:#fff;border:1px solid #e0e0d8;border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px}
        .bk-list-title{font-size:13px;font-weight:500;color:#1a1a1a;flex:1}

        .access-banner{background:#FAEEDA;border:1px solid #EF9F27;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:13px;color:#633806;display:flex;align-items:center;gap:10px;line-height:1.6}

        @media(max-width:650px){
          .sidebar{width:100%;height:auto;position:static;border-right:none;border-bottom:1px solid #e0e0d8;display:flex;flex-wrap:wrap;padding:6px}
          .nav-item{padding:5px 10px;border-left:none;border-radius:20px;border:1px solid #e0e0d8;margin:2px;font-size:12px}
          .nav-item.active{border-color:#7F77DD}
          .layout{flex-direction:column}
          .stats-bar{grid-template-columns:repeat(2,1fr)}
          .sim-box{width:36px;height:36px;font-size:12px}
        }
      `}</style>

      <div ref={containerRef} onClick={handleNavClick}>
        {/* Topbar */}
        <div className="topbar">
          <div className="app-title">CSC 3011 — Algorithms &amp; Complexity</div>
          <div className="search-wrap"><input type="text" id="searchInput" placeholder="Search topics, questions, keywords..." autoComplete="off" /></div>
          <div className="topbar-btns">
            <div className="user-pill">
              <span className="access-dot"></span>
              <span>{hasAccess ? 'Full access' : 'Topic 1 only'}</span>
            </div>
            <button className="tbtn" id="bkToggleBtn">&#10084; Bookmarks (<span id="bkCount">0</span>)</button>
            <button className="tbtn" id="resetBtn">Reset progress</button>
            <button className="tbtn" onClick={onSignOut}>Sign out</button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat"><div className="stat-n" id="statDone">0/9</div><div className="stat-l">Topics done</div></div>
          <div className="stat"><div className="stat-n" id="statQ">28</div><div className="stat-l">Past paper Qs</div></div>
          <div className="stat"><div className="stat-n" id="statBk">0</div><div className="stat-l">Bookmarked</div></div>
          <div className="stat"><div className="stat-n" id="statQz">0%</div><div className="stat-l">Quiz score</div></div>
        </div>

        <div className="layout">
          <div className="sidebar">
            <div className={`nav-item${activeSection==='overview' ? ' active' : ''}`} id="nav-overview"><span className="nav-dot" id="dot-overview"></span>Home<span className="nav-badge">Start</span></div>
            <div className="nav-sep"></div>
            <div className={`nav-item${activeSection==='logs' ? ' active' : ''}`} id="nav-logs"><span className="nav-dot" id="dot-logs"></span>1. Logarithms<span className="nav-badge">3Q</span></div>
            <div className={`nav-item${activeSection==='bigoh' ? ' active' : ''}`} id="nav-bigoh"><span className="nav-dot" id="dot-bigoh"></span>2. Big-O<span className="nav-badge">{hasAccess ? '6Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='recursion' ? ' active' : ''}`} id="nav-recursion"><span className="nav-dot" id="dot-recursion"></span>3. Recursion<span className="nav-badge">{hasAccess ? '4Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='sorting' ? ' active' : ''}`} id="nav-sorting"><span className="nav-dot" id="dot-sorting"></span>4. Sorting<span className="nav-badge">{hasAccess ? '3Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='ds' ? ' active' : ''}`} id="nav-ds"><span className="nav-dot" id="dot-ds"></span>5. Stacks &amp; Queues<span className="nav-badge">{hasAccess ? '4Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='trees' ? ' active' : ''}`} id="nav-trees"><span className="nav-dot" id="dot-trees"></span>6. Trees &amp; BST<span className="nav-badge">{hasAccess ? '4Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='avl' ? ' active' : ''}`} id="nav-avl"><span className="nav-dot" id="dot-avl"></span>7. AVL Trees<span className="nav-badge">{hasAccess ? '4Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='hashing' ? ' active' : ''}`} id="nav-hashing"><span className="nav-dot" id="dot-hashing"></span>8. Hashing<span className="nav-badge">{hasAccess ? '2Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='graphs' ? ' active' : ''}`} id="nav-graphs"><span className="nav-dot" id="dot-graphs"></span>9. Graphs<span className="nav-badge">{hasAccess ? '3Q' : '🔒'}</span></div>
            <div className="nav-sep"></div>
            <div className={`nav-item${activeSection==='quiz' ? ' active' : ''}`} id="nav-quiz"><span className="nav-dot" id="dot-quiz"></span>&#9998; Practice Quiz<span className="nav-badge">{hasAccess ? '20Q' : '🔒'}</span></div>
            <div className={`nav-item${activeSection==='simulations' ? ' active' : ''}`} id="nav-simulations"><span className="nav-dot" id="dot-simulations"></span>&#9654; Simulations{!hasAccess && ' 🔒'}</div>
            <div className={`nav-item${activeSection==='cheatsheet' ? ' active' : ''}`} id="nav-cheatsheet"><span className="nav-dot" id="dot-cheatsheet"></span>&#9733; Cheat Sheet{!hasAccess && ' 🔒'}</div>
            <div className={`nav-item${activeSection==='bookmarks' ? ' active' : ''}`} id="nav-bookmarks"><span className="nav-dot" id="dot-bookmarks"></span>&#10084; Bookmarks</div>
          </div>

          <div className="main">
            {/* OVERVIEW */}
            <div id="sec-overview" className={`section${activeSection==='overview' ? ' active' : ''}`}>
              <div className="sec-header"><div className="sec-title">CSC 3011 Study Companion</div></div>
              {!hasAccess && (
                <div className="access-banner">
                  <span style={{fontSize:20}}>💡</span>
                  <span>You have access to <strong>Topic 1 (Logarithms)</strong> as a free preview. After payment, contact the admin on WhatsApp to unlock all topics.</span>
                </div>
              )}
              <div className="topic-grid">
                <div className="topic-card" style={{background:'#EEEDFE',borderColor:'#AFA9EC'}} id="tc-logs"><div style={{fontSize:'11px',fontWeight:700,color:'#534AB7'}}>TOPIC 1</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Logarithms</div><div style={{fontSize:'11px',color:'#7F77DD',marginTop:'2px'}}>3 questions</div></div>
                <div className="topic-card" style={{background:'#E6F1FB',borderColor:'#85B7EB',opacity:hasAccess?1:0.5}} id="tc-bigoh"><div style={{fontSize:'11px',fontWeight:700,color:'#185FA5'}}>TOPIC 2</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Big-O {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#378ADD',marginTop:'2px'}}>6 questions</div></div>
                <div className="topic-card" style={{background:'#E1F5EE',borderColor:'#5DCAA5',opacity:hasAccess?1:0.5}} id="tc-recursion"><div style={{fontSize:'11px',fontWeight:700,color:'#0F6E56'}}>TOPIC 3</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Recursion {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#1D9E75',marginTop:'2px'}}>4 questions</div></div>
                <div className="topic-card" style={{background:'#FAEEDA',borderColor:'#EF9F27',opacity:hasAccess?1:0.5}} id="tc-sorting"><div style={{fontSize:'11px',fontWeight:700,color:'#854F0B'}}>TOPIC 4</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Sorting {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#BA7517',marginTop:'2px'}}>3 questions</div></div>
                <div className="topic-card" style={{background:'#FAECE7',borderColor:'#F0997B',opacity:hasAccess?1:0.5}} id="tc-ds"><div style={{fontSize:'11px',fontWeight:700,color:'#993C1D'}}>TOPIC 5</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Stacks &amp; Queues {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#D85A30',marginTop:'2px'}}>4 questions</div></div>
                <div className="topic-card" style={{background:'#EEEDFE',borderColor:'#AFA9EC',opacity:hasAccess?1:0.5}} id="tc-trees"><div style={{fontSize:'11px',fontWeight:700,color:'#534AB7'}}>TOPIC 6</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Trees &amp; BST {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#7F77DD',marginTop:'2px'}}>4 questions</div></div>
                <div className="topic-card" style={{background:'#E6F1FB',borderColor:'#85B7EB',opacity:hasAccess?1:0.5}} id="tc-avl"><div style={{fontSize:'11px',fontWeight:700,color:'#185FA5'}}>TOPIC 7</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>AVL Trees {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#378ADD',marginTop:'2px'}}>4 questions</div></div>
                <div className="topic-card" style={{background:'#E1F5EE',borderColor:'#5DCAA5',opacity:hasAccess?1:0.5}} id="tc-hashing"><div style={{fontSize:'11px',fontWeight:700,color:'#0F6E56'}}>TOPIC 8</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Hashing {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#1D9E75',marginTop:'2px'}}>2 questions</div></div>
                <div className="topic-card" style={{background:'#FAEEDA',borderColor:'#EF9F27',opacity:hasAccess?1:0.5}} id="tc-graphs"><div style={{fontSize:'11px',fontWeight:700,color:'#854F0B'}}>TOPIC 9</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'3px'}}>Graphs {!hasAccess && '🔒'}</div><div style={{fontSize:'11px',color:'#BA7517',marginTop:'2px'}}>3 questions</div></div>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:'220px',background:'#fff',border:'1px solid #e0e0d8',borderRadius:'10px',padding:'14px'}}>
                  <div style={{fontSize:'13px',fontWeight:700,marginBottom:'8px'}}>High-frequency exam topics</div>
                  <div style={{fontSize:'13px',color:'#555',lineHeight:2.1}}>
                    🔴 AVL rotations — <b>every year</b><br/>
                    🔴 Big-O proofs — <b>every year</b><br/>
                    🔴 Recursion simulation — <b>every year</b><br/>
                    🔴 Four rules of recursion — <b>every year</b><br/>
                    🟡 BST traversals — 3/4 years<br/>
                    🟡 Hash table insertion — 3/4 years<br/>
                    🟡 Sorting swaps/comparisons — 3/4 years
                  </div>
                </div>
                <div style={{flex:1,minWidth:'220px',background:'#fff',border:'1px solid #e0e0d8',borderRadius:'10px',padding:'14px'}}>
                  <div style={{fontSize:'13px',fontWeight:700,marginBottom:'8px'}}>Tools in this companion</div>
                  <div style={{fontSize:'13px',color:'#555',lineHeight:2.1}}>
                    <span style={{cursor:'pointer',color:'#534AB7',fontWeight:600}} id="link-quiz">&#9998; Practice quiz</span> — 20 Qs with scoring<br/>
                    <span style={{cursor:'pointer',color:'#534AB7',fontWeight:600}} id="link-sims">&#9654; Sorting simulator</span> — step-by-step<br/>
                    <span style={{cursor:'pointer',color:'#534AB7',fontWeight:600}} id="link-avl">&#9654; AVL tree builder</span> — watch rotations<br/>
                    <span style={{cursor:'pointer',color:'#534AB7',fontWeight:600}} id="link-cheat">&#9733; Cheat sheet</span> — all formulas<br/>
                    <span style={{cursor:'pointer',color:'#534AB7',fontWeight:600}} id="link-bk">&#10084; Bookmarks</span> — save questions
                  </div>
                </div>
              </div>
            </div>

            {/* LOGARITHMS - Free topic */}
            <div id="sec-logs" className={`section${activeSection==='logs' ? ' active' : ''}`}>
            {/* The rest of your hardcoded content sections should follow the same pattern: */}
            {/* <div id="sec-bigoh" className={`section${activeSection==='bigoh' ? ' active' : ''}`}> ... </div> */}
              <div className="sec-header"><div className="sec-title">1. Logarithms</div><button className="done-btn" id="done-logs">Mark as done</button></div>
              <div className="notes-card">
                <div className="notes-card-title">Notes</div>
                <div className="nb"><b>Definition:</b> log<sub>a</sub>(x) = y means a<sup>y</sup> = x. The log tells you what power to raise the base to in order to get x.<br/>Example: log<sub>2</sub>(8) = 3 because 2<sup>3</sup> = 8.</div>
                <div className="nb"><b>Five rules you must memorise:</b><br/>
                &nbsp;&nbsp;· Product: log<sub>a</sub>(xy) = log<sub>a</sub>x + log<sub>a</sub>y<br/>
                &nbsp;&nbsp;· Quotient: log<sub>a</sub>(x/y) = log<sub>a</sub>x − log<sub>a</sub>y<br/>
                &nbsp;&nbsp;· Power: log<sub>a</sub>(x<sup>n</sup>) = n·log<sub>a</sub>x<br/>
                &nbsp;&nbsp;· Change of base: log<sub>a</sub>(x) = log<sub>b</sub>(x) ÷ log<sub>b</sub>(a)<br/>
                &nbsp;&nbsp;· Identity: log<sub>a</sub>(a)=1 &nbsp;|&nbsp; log<sub>a</sub>(1)=0 &nbsp;|&nbsp; log<sub>4</sub>(2)=0.5</div>
                <div className="tip"><div className="tip-lbl">Exam tip</div>Product rule + change of base appear every single year. If asked &quot;without a calculator&quot;, combine logs first using product rule, then change base. log<sub>4</sub>(2)=0.5 is the most commonly needed identity.</div>
                <div className="kws"><span className="kw">product rule</span><span className="kw">change of base</span><span className="kw">log identity</span><span className="kw">log₄(2)=0.5</span></div>
              </div>
              <div className="subsec">Past paper questions — click to expand solution</div>
              <div className="q-acc" data-tags="log product change base 2023">
                <div className="q-head"><button className="bk-btn" data-title="[LOGS] log₄x=2.7, log₄y=1.3 — evaluate log₄(xy), xy, log₂(xy) [2023]">&#9825;</button><div className="q-title">Given log₄x=2.7 and log₄y=1.3, evaluate: (a) log₄(xy) &nbsp;(b) xy &nbsp;(c) log₂(xy)</div><div className="q-meta"><span className="yr">2023</span><span className="pt">12 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="q-text">Let log₄x = 2.7 and log₄y = 1.3. Without a calculator, evaluate: (a) log₄(xy) &nbsp; (b) xy &nbsp; (c) log₂(xy)</div><div className="sol-lbl">Step-by-step solution</div>
                <div className="step"><div className="sn">a</div><div><b>log₄(xy)</b> — use product rule:<br/>log₄(xy) = log₄x + log₄y = 2.7 + 1.3 = <b>4.0</b></div></div>
                <div className="step"><div className="sn">b</div><div><b>xy</b> — from (a), log₄(xy)=4, so xy = 4<sup>4</sup> = <b>256</b></div></div>
                <div className="step"><div className="sn">c</div><div><b>log₂(xy)</b> — use change of base: log₂(xy) = log₄(xy) ÷ log₄(2)<br/>log₄(2) = 0.5 because 4<sup>0.5</sup> = √4 = 2<br/>So log₂(xy) = 4 ÷ 0.5 = <b>8</b></div></div>
                <div className="tip" style={{marginTop:'8px'}}><div className="tip-lbl">Key trick</div>Memorise log₄(2)=0.5. It comes up whenever you change base from 4 to 2, which is the most common change-of-base question in CSC 3011.</div></div>
              </div>
              <div className="q-acc" data-tags="log product 2021">
                <div className="q-head"><button className="bk-btn" data-title="[LOGS] log(x)=0.2, log(y)=0.8, find log(xy) and xy [2021]">&#9825;</button><div className="q-title">log(x)=0.2, log(y)=0.8 — find log(xy) and xy</div><div className="q-meta"><span className="yr">2021</span><span className="pt">4 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">a</div><div><b>log(xy)</b> = log(x)+log(y) = 0.2+0.8 = <b>1.0</b></div></div>
                <div className="step"><div className="sn">b</div><div><b>xy</b>: log₁₀(xy)=1 → xy = 10<sup>1</sup> = <b>10</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="log n doubling 2020 2022">
                <div className="q-head"><button className="bk-btn" data-title="[LOGS] O(log n) algorithm, time for 2N items [2020/22]">&#9825;</button><div className="q-title">O(log n) algorithm takes t time for N items. How long for 2N?</div><div className="q-meta"><span className="yr">2020/22</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>t = c·log(N) for some constant c</div></div>
                <div className="step"><div className="sn">2</div><div>For 2N: time = c·log(2N) = c·(log N + log 2) = c·log N + c·log 2 = t + c·log 2</div></div>
                <div className="step"><div className="sn">3</div><div>c·log 2 is a small constant, so new time ≈ <b>t + constant</b>. Doubling input barely increases time!</div></div>
                <div className="tip" style={{marginTop:'8px'}}><div className="tip-lbl">Key insight</div>This is why logarithmic algorithms are so powerful — binary search on 1 billion items takes only 30 steps, and on 2 billion items takes only 31 steps.</div></div>
              </div>
            </div>

            {/* LOCKED SECTIONS - content will be shown with overlay if no access */}
            <div id="sec-bigoh" className={`section${activeSection==='bigoh' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">2. Big-O Notation</div><button className="done-btn" id="done-bigoh">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Big-O:</b> Upper bound on growth rate. O(f(n)) means the algorithm&apos;s running time grows at most as fast as f(n) for large n.</div>
                <div className="nb"><b>Formal definition:</b> T(n) = O(f(n)) if there exist constants c &gt; 0 and n₀ such that T(n) ≤ c·f(n) for all n ≥ n₀.</div>
                <div className="nb"><b>Doubling table (must memorise):</b><br/>O(1): t &nbsp;|&nbsp; O(log n): t+constant &nbsp;|&nbsp; O(n): 2t &nbsp;|&nbsp; O(n log n): ~2t &nbsp;|&nbsp; O(n²): 4t &nbsp;|&nbsp; O(2ⁿ): t²</div>
                <div className="nb"><b>Rules for products:</b> T₁=O(f) and T₂=O(g) → T₁+T₂=O(max(f,g)) and T₁×T₂=O(f·g)</div>
                <div className="tip"><div className="tip-lbl">Proof technique</div>To prove T(n) = O(n²), find c and n₀ such that T(n) ≤ c·n². For nested loops: count total iterations as a sum, simplify to dominant term.</div>
                <div className="kws"><span className="kw">upper bound</span><span className="kw">doubling effect</span><span className="kw">induction proof</span><span className="kw">nested loops = O(n²)</span></div>
              </div>
              <div className="subsec">Past paper questions — click to expand solution</div>
              <div className="q-acc" data-tags="bigoh definition proof constant c n0 2020 2021 2022 2023">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] Formal definition and proof: T(n)=5n²+3n+10 is O(n²) [Every year]">&#9825;</button><div className="q-title">State the definition of Big-O. Prove 5n²+3n+10 = O(n²)</div><div className="q-meta"><span className="yr">Every year</span><span className="pt">8–12 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>Definition:</b> T(n) = O(f(n)) if ∃ constants c &gt; 0, n₀ ≥ 0 such that T(n) ≤ c·f(n) for all n ≥ n₀.</div></div>
                <div className="step"><div className="sn">2</div><div><b>Proof:</b> For n ≥ 1: 5n²+3n+10 ≤ 5n²+3n²+10n² = 18n² (since 1≤n, 1≤n²)<br/>Choose c=18, n₀=1. Then T(n) ≤ 18n² = c·n² for all n ≥ 1. Therefore <b>T(n) = O(n²)</b></div></div>
                <div className="warn" style={{marginTop:'8px'}}><div className="warn-lbl">Mark scheme note</div>Always explicitly state the values of c and n₀ you chose, and verify the inequality holds. Missing either loses marks.</div></div>
              </div>
              <div className="q-acc" data-tags="bigoh multiplication rule O(n) 2021 2022">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] If T1=O(n), T2=O(n), what is T1*T2? [2021/22]">&#9825;</button><div className="q-title">If T₁(n)=O(n) and T₂(n)=O(n), what is the order of T₁ × T₂?</div><div className="q-meta"><span className="yr">2021/22</span><span className="pt">4 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>T₁×T₂ ≤ c₁·n × c₂·n = (c₁c₂)·n². So T₁×T₂ = <b>O(n²)</b>. The orders multiply.</div></div></div>
              </div>
              <div className="q-acc" data-tags="bigoh logn doubling 2020 2022">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] O(log n), time for 2N items [2020/22]">&#9825;</button><div className="q-title">O(log n) algorithm takes t time for N items. Time for 2N items?</div><div className="q-meta"><span className="yr">2020/22</span><span className="pt">6 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>t = c·log(N)</div></div>
                <div className="step"><div className="sn">2</div><div>For 2N: c·log(2N)=c·(log N+1)=c·log N + c = <b>t + c·log 2 = t + constant</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="bigoh nested loops mystery(n) 2023">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] mystery(n) nested loops simulation and order [2023]">&#9825;</button><div className="q-title">Analyse mystery(n) with nested loops: simulate mystery(5), count Print I*J, find order</div><div className="q-meta"><span className="yr">2023</span><span className="pt">20 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="q-text">For I:=1 to n do / For J=1 to I do / Print I*J / Print &quot; &quot; / Next / Println / Next End.</div><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">a</div><div><b>Output of mystery(5):</b><br/>I=1: &nbsp;1<br/>I=2: &nbsp;2 &nbsp;4<br/>I=3: &nbsp;3 &nbsp;6 &nbsp;9<br/>I=4: &nbsp;4 &nbsp;8 &nbsp;12 &nbsp;16<br/>I=5: &nbsp;5 &nbsp;10 &nbsp;15 &nbsp;20 &nbsp;25</div></div>
                <div className="step"><div className="sn">b</div><div>Inner loop runs I times. Total = 1+2+3+…+n = <b>n(n+1)/2</b></div></div>
                <div className="step"><div className="sn">c</div><div>n(n+1)/2 = (n²+n)/2 → dominant term is n² → <b>O(n²)</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="bigoh nlogn doubling 2020">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] O(n log n), time for 2N items [2020]">&#9825;</button><div className="q-title">Algorithm is O(n log n), takes t time for N items. Time for 2N items?</div><div className="q-meta"><span className="yr">2020</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>t = c·N·log(N)</div></div>
                <div className="step"><div className="sn">2</div><div>For 2N: c·2N·log(2N) = 2cN·(log N+1) = 2cN·log N + 2cN = <b>2t + 2cN</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="induction proof geometric 2021 2023">
                <div className="q-head"><button className="bk-btn" data-title="[BIG-O] Induction proof: 1+2+2²+…+2ⁿ=2ⁿ⁺¹-1 [2021/23]">&#9825;</button><div className="q-title">Prove by induction: 1 + 2 + 2² + … + 2ⁿ = 2ⁿ⁺¹ − 1</div><div className="q-meta"><span className="yr">2021/23</span><span className="pt">6–8 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution (Mathematical Induction — 3 parts required)</div>
                <div className="step"><div className="sn">1</div><div><b>Base case (n=0):</b> LHS = 1. RHS = 2<sup>1</sup>−1 = 1. LHS=RHS ✓</div></div>
                <div className="step"><div className="sn">2</div><div><b>Inductive hypothesis:</b> Assume true for n=k: 1+2+…+2<sup>k</sup> = 2<sup>k+1</sup>−1</div></div>
                <div className="step"><div className="sn">3</div><div><b>Inductive step (prove for n=k+1):</b><br/>LHS = (2<sup>k+1</sup>−1) + 2<sup>k+1</sup> = 2·2<sup>k+1</sup>−1 = 2<sup>k+2</sup>−1 = RHS ✓</div></div></div>
              </div>
            </div>

            {/* RECURSION */}
            <div id="sec-recursion" className={`section${activeSection==='recursion' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">3. Recursion</div><button className="done-btn" id="done-recursion">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Recursion:</b> A function that calls itself on a smaller sub-problem. Must have a base case (stops recursion) and a recursive case (moves toward base).</div>
                <div className="nb"><b>The four rules of recursion (memorise these):</b><br/>
                1. <b>Base case rule</b> — at least one case solved directly without recursion<br/>
                2. <b>Making progress</b> — every recursive call moves toward the base case<br/>
                3. <b>Design rule</b> — assume all recursive calls work correctly<br/>
                4. <b>Compound interest rule</b> — never solve the same sub-problem twice</div>
                <div className="nb"><b>Solving recurrences by substitution:</b><br/>
                T(n) = T(n/2) + c → O(log n)<br/>
                T(n) = T(n−1) + c → O(n)<br/>
                T(n) = 2T(n−1) + c → O(2ⁿ)<br/>
                T(n) = 2T(n/2) + n → O(n log n)</div>
                <div className="tip"><div className="tip-lbl">Exam tip</div>Rule 4 is the most commonly tested. When a function calls itself twice with the same argument, name it: &quot;This violates Rule 4, the compound interest rule.&quot;</div>
                <div className="kws"><span className="kw">base case</span><span className="kw">four rules</span><span className="kw">recurrence relation</span><span className="kw">substitution method</span><span className="kw">O(log n)</span></div>
              </div>
              <div className="subsec">Past paper questions — click to expand solution</div>
              <div className="q-acc" data-tags="recursion four rules 2020 2021 2022 2023">
                <div className="q-head"><button className="bk-btn" data-title="[RECURSION] Four basic rules of recursion [Every year]">&#9825;</button><div className="q-title">State and explain the four basic rules of recursion</div><div className="q-meta"><span className="yr">Every year</span><span className="pt">4–8 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>Base case rule:</b> Every recursive algorithm must have at least one case that can be solved directly without making a recursive call.</div></div>
                <div className="step"><div className="sn">2</div><div><b>Making progress:</b> Every recursive call must operate on a simpler/smaller input that moves toward the base case.</div></div>
                <div className="step"><div className="sn">3</div><div><b>Design rule:</b> Assume all recursive calls work correctly. You only need to verify that the current call&apos;s logic is correct.</div></div>
                <div className="step"><div className="sn">4</div><div><b>Compound interest rule:</b> Never duplicate work by solving the same sub-problem in separate recursive branches.</div></div></div>
              </div>
              <div className="q-acc" data-tags="recursion mystery binary representation recurrence 2020">
                <div className="q-head"><button className="bk-btn" data-title="[RECURSION] Simulate mystery(10), recurrence, prove O(log n) [2020]">&#9825;</button><div className="q-title">Simulate mystery(10). Devise recurrence. Prove O(log n).</div><div className="q-meta"><span className="yr">2020</span><span className="pt">20 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="q-text">Algorithm mystery(n): if n &lt; 2 then print n, else mystery(n/2); print n%2.</div><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">i</div><div><b>mystery(10) outputs binary 10:</b> 1 0 1 0</div></div>
                <div className="step"><div className="sn">ii</div><div><b>Recurrence:</b> T(n) = T(n/2) + c, &nbsp;T(1) = 1</div></div>
                <div className="step"><div className="sn">iii</div><div><b>Solve:</b> T(n) = T(n/4)+2c = … = T(1)+c·log₂(n) = <b>O(log n)</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="recursion twoToPower compound interest rule broken 2023">
                <div className="q-head"><button className="bk-btn" data-title="[RECURSION] twoToPower(n): simulate, broken rule, Big-O [2023]">&#9825;</button><div className="q-title">twoToPower(n): simulate for n=0,2,3. Which rule is broken? Give Big-O.</div><div className="q-meta"><span className="yr">2023</span><span className="pt">20 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="q-text">twoToPower(n): if n=0 return 1, else return twoToPower(n-1) + twoToPower(n-1).</div><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">a</div><div>n=0:1, n=2:4, n=3:8 ✓</div></div>
                <div className="step"><div className="sn">b</div><div><b>Rule broken: Rule 4 — Compound interest rule.</b> twoToPower(n-1) computed twice.</div></div>
                <div className="step"><div className="sn">c</div><div><b>T(n)=2T(n-1)+c → O(2ⁿ)</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="recursion fibonacci fib(5) inefficient iterative 2022">
                <div className="q-head"><button className="bk-btn" data-title="[RECURSION] Fibonacci fib(5), why inefficient, iterative version [2022]">&#9825;</button><div className="q-title">fib(n): simulate fib(5), explain why inefficient, write iterative version</div><div className="q-meta"><span className="yr">2022</span><span className="pt">20 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">i</div><div>fib(5)=8</div></div>
                <div className="step"><div className="sn">ii</div><div>Violates Rule 4 — fib(3), fib(2) recomputed multiple times → O(2ⁿ)</div></div>
                <div className="step"><div className="sn">iii</div><div><pre>{`Algorithm fib_iterative(n):
  if n <= 1 then return 1
  prev2 := 1;  prev1 := 1
  for i := 2 to n do
    curr := prev1 + prev2
    prev2 := prev1
    prev1 := curr
  return curr`}</pre></div></div></div>
              </div>
            </div>

            {/* SORTING */}
            <div id="sec-sorting" className={`section${activeSection==='sorting' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">4. Sorting Algorithms</div><button className="done-btn" id="done-sorting">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Bubble Sort:</b> Compare adjacent pairs, swap if out of order. O(n²)</div>
                <div className="nb"><b>Selection Sort:</b> Find minimum in unsorted part, swap to correct position. Always <b>n−1 swaps</b>.</div>
                <div className="nb"><b>Insertion Sort:</b> Take each element and insert into correct position. O(n²) worst, <b>O(n) best</b> (already sorted).</div>
                <div className="nb"><b>Merge Sort:</b> Divide and conquer. Always O(n log n). Uses O(n) extra space.</div>
                <div className="tip"><div className="tip-lbl">Key fact</div>Selection sort always makes exactly n−1 swaps regardless of input order.</div>
                <div className="warn"><div className="warn-lbl">Worst case trigger</div>Always assume input is sorted in descending order to calculate maximum comparisons and swaps.</div>
                <div className="kws"><span className="kw">O(n²)</span><span className="kw">n(n-1)/2</span><span className="kw">n-1 swaps (selection)</span><span className="kw">O(n log n) merge</span></div>
              </div>
              <div className="subsec">Past paper questions</div>
              <div className="q-acc" data-tags="sorting bubble selection insertion max swaps comparisons 2020 2021">
                <div className="q-head"><button className="bk-btn" data-title="[SORTING] Max comparisons and swaps for Bubble, Selection, Insertion [2020/21]">&#9825;</button><div className="q-title">Max comparisons and swaps for Bubble, Selection, and Insertion sort on n elements</div><div className="q-meta"><span className="yr">2020/21</span><span className="pt">6 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>Bubble:</b> Comparisons = n(n−1)/2 &nbsp;|&nbsp; Swaps = n(n−1)/2</div></div>
                <div className="step"><div className="sn">2</div><div><b>Selection:</b> Comparisons = n(n−1)/2 &nbsp;|&nbsp; Swaps = n−1</div></div>
                <div className="step"><div className="sn">3</div><div><b>Insertion:</b> Comparisons = n(n−1)/2 &nbsp;|&nbsp; Swaps = n(n−1)/2</div></div></div>
              </div>
              <div className="q-acc" data-tags="sorting simulate selection insertion [23,12,69,5,3] 2021">
                <div className="q-head"><button className="bk-btn" data-title="[SORTING] Simulate Selection and Insertion sort on [23,12,69,5,3] [2021]">&#9825;</button><div className="q-title">Simulate Selection sort and Insertion sort on [23, 12, 69, 5, 3]</div><div className="q-meta"><span className="yr">2021</span><span className="pt">20 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Selection Sort</div>
                <div className="step"><div className="sn">1</div><div>Pass 1: min=3 at pos 4. Swap → [<b>3</b>, 12, 69, 5, 23]</div></div>
                <div className="step"><div className="sn">2</div><div>Pass 2: min=5 at pos 3 → [3, <b>5</b>, 69, 12, 23]</div></div>
                <div className="step"><div className="sn">3</div><div>Pass 3: min=12 at pos 3 → [3, 5, <b>12</b>, 69, 23]</div></div>
                <div className="step"><div className="sn">4</div><div>Pass 4: min=23 → [3, 5, 12, <b>23</b>, 69]. Total swaps: 4 = n−1 ✓</div></div>
                <div className="sol-lbl">Insertion Sort</div>
                <div className="step"><div className="sn">1</div><div>Insert 12: shift 23 → [12, 23]</div></div>
                <div className="step"><div className="sn">2</div><div>Insert 69: no shift → [12, 23, 69]</div></div>
                <div className="step"><div className="sn">3</div><div>Insert 5: shift 69,23,12 → [5, 12, 23, 69]</div></div>
                <div className="step"><div className="sn">4</div><div>Insert 3: shift all → [<b>3, 5, 12, 23, 69</b>]</div></div></div>
              </div>
              <div className="q-acc" data-tags="sorting merge algorithm sorted lists complexity 2020">
                <div className="q-head"><button className="bk-btn" data-title="[SORTING] Devise merge(l1,l2) algorithm for sorted lists [2020]">&#9825;</button><div className="q-title">Devise merge(l1, l2) for two sorted lists. What is its complexity?</div><div className="q-meta"><span className="yr">2020</span><span className="pt">14 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><pre>{`Algorithm merge(l1, l2):
  result := new array of length len(l1)+len(l2)
  i := 0;  j := 0;  k := 0
  while i < len(l1) and j < len(l2) do
    if l1[i] <= l2[j] then result[k] := l1[i];  i++
    else result[k] := l2[j];  j++
    k++
  // copy remaining elements...
  return result`}</pre></div></div>
                <div className="step"><div className="sn">2</div><div>Each of n=len(l1)+len(l2) elements visited once → <b>O(n)</b></div></div></div>
              </div>
            </div>

            {/* DATA STRUCTURES */}
            <div id="sec-ds" className={`section${activeSection==='ds' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">5. Stacks &amp; Queues</div><button className="done-btn" id="done-ds">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Stack (LIFO):</b> push adds to top, pop removes from top. Applications: function call stack, undo/redo.</div>
                <div className="nb"><b>Queue (FIFO):</b> enqueue adds to rear, dequeue removes from front. Applications: CPU scheduling, BFS traversal.</div>
                <div className="nb"><b>Postfix evaluation:</b> Scan left to right. Operands → push. Operator → pop two, compute, push result.</div>
                <div className="tip"><div className="tip-lbl">Exam tip</div>For stackNQueue: trace both phases clearly. Output = reverse of input queue order.</div>
                <div className="kws"><span className="kw">LIFO</span><span className="kw">FIFO</span><span className="kw">push/pop</span><span className="kw">enqueue/dequeue</span><span className="kw">postfix evaluation</span></div>
              </div>
              <div className="subsec">Past paper questions</div>
              <div className="q-acc" data-tags="stack queue describe applications 2020 2022 2023">
                <div className="q-head"><button className="bk-btn" data-title="[DS] Describe Stack and Queue, two applications each [Every year]">&#9825;</button><div className="q-title">Describe Stack and Queue. Give two applications each.</div><div className="q-meta"><span className="yr">Every year</span><span className="pt">4–8 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>Stack (LIFO):</b> push/pop at top. Applications: (1) function call management, (2) undo/redo.</div></div>
                <div className="step"><div className="sn">2</div><div><b>Queue (FIFO):</b> enqueue at rear, dequeue from front. Applications: (1) CPU scheduling, (2) print spooling.</div></div></div>
              </div>
              <div className="q-acc" data-tags="stack queue simulation stackNQueue [a,l,i,o,v] order 2023">
                <div className="q-head"><button className="bk-btn" data-title="[DS] Simulate stackNQueue([a,l,i,o,v],5) [2023]">&#9825;</button><div className="q-title">Simulate stackNQueue([a,l,i,o,v], 5). Output and order?</div><div className="q-meta"><span className="yr">2023</span><span className="pt">20 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>Phase 1: dequeue all → push: Stack top-first: v, o, i, l, a</div></div>
                <div className="step"><div className="sn">2</div><div>Phase 2: pop all → Output: <b>v o i l a</b> (reversed!)</div></div>
                <div className="step"><div className="sn">3</div><div>Order: 4n operations = <b>O(n)</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="postfix infix stack algorithm 2021">
                <div className="q-head"><button className="bk-btn" data-title="[DS] Postfix-to-infix algorithm, trace: abc*d+ef/- [2021]">&#9825;</button><div className="q-title">Devise postfix-to-infix algorithm. Transform: a b c * d + e f / −</div><div className="q-meta"><span className="yr">2021</span><span className="pt">20 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><pre>{`for each token t:
  if operand: push(t)
  else: op2=pop(); op1=pop()
        push("("+op1+t+op2+")")`}</pre></div></div>
                <div className="step"><div className="sn">2</div><div>Result: <b>(((b*c)+d)−(e/f))</b></div></div></div>
              </div>
              <div className="q-acc" data-tags="stack queue reverse algorithm 2020">
                <div className="q-head"><button className="bk-btn" data-title="[DS] Algorithm to reverse a queue using a stack [2020]">&#9825;</button><div className="q-title">Devise algorithm to reverse the contents of a queue using a stack</div><div className="q-meta"><span className="yr">2020</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><pre>{`while Q not empty: S.push(Q.dequeue())
while S not empty: Q.enqueue(S.pop())`}</pre>Time: <b>O(n)</b></div></div></div>
              </div>
            </div>

            {/* TREES */}
            <div id="sec-trees" className={`section${activeSection==='trees' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">6. Trees &amp; Binary Search Trees</div><button className="done-btn" id="done-trees">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>BST property:</b> left subtree &lt; node &lt; right subtree. Enables O(log n) average search.</div>
                <div className="nb"><b>Traversals:</b> Pre-order (Root→L→R), In-order (L→Root→R = <b>sorted</b>), Post-order (L→R→Root)</div>
                <div className="nb"><b>Delete by copying:</b> Replace with in-order successor (smallest in right subtree).</div>
                <div className="nb"><b>Perfect binary tree of height h:</b> Nodes = 2<sup>h+1</sup> − 1</div>
                <div className="tip"><div className="tip-lbl">Most tested</div>In-order traversal of a BST always gives sorted output.</div>
                <div className="kws"><span className="kw">BST property</span><span className="kw">in-order = sorted</span><span className="kw">delete by copying</span><span className="kw">2^(h+1)−1</span></div>
              </div>
              <div className="subsec">Past paper questions</div>
              <div className="q-acc" data-tags="trees depth height branching factor 2023">
                <div className="q-head"><button className="bk-btn" data-title="[TREES] Depth of node, height of tree, branching factor [2023]">&#9825;</button><div className="q-title">Define: (a) depth of a node &nbsp;(b) height of a tree &nbsp;(c) branching factor</div><div className="q-meta"><span className="yr">2023</span><span className="pt">6 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">a</div><div><b>Depth of node:</b> Number of edges from root to that node (root depth = 0).</div></div>
                <div className="step"><div className="sn">b</div><div><b>Height of tree:</b> Edges on longest root-to-leaf path (single node = 0).</div></div>
                <div className="step"><div className="sn">c</div><div><b>Branching factor:</b> Maximum number of children any node can have.</div></div></div>
              </div>
              <div className="q-acc" data-tags="trees BST insert traversal 2020 2021 2022">
                <div className="q-head"><button className="bk-btn" data-title="[TREES] Insert into BST and give all three traversals [Every year]">&#9825;</button><div className="q-title">Insert [25,15,40,10,20,35,50] into BST. Give all three traversals.</div><div className="q-meta"><span className="yr">Every year</span><span className="pt">16 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>Pre-order (Root→L→R):</b> 25, 15, 10, 20, 40, 35, 50</div></div>
                <div className="step"><div className="sn">2</div><div><b>In-order (L→Root→R):</b> 10, 15, 20, 25, 35, 40, 50 ← sorted!</div></div>
                <div className="step"><div className="sn">3</div><div><b>Post-order (L→R→Root):</b> 10, 20, 15, 35, 50, 40, 25</div></div></div>
              </div>
              <div className="q-acc" data-tags="trees BST delete successor 2021 2022">
                <div className="q-head"><button className="bk-btn" data-title="[TREES] Delete node with two children from BST [2021/22]">&#9825;</button><div className="q-title">Delete 25 from the BST above. Describe delete-by-copying.</div><div className="q-meta"><span className="yr">2021/22</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>25 has two children. Find in-order successor: smallest in right subtree = <b>35</b>.</div></div>
                <div className="step"><div className="sn">2</div><div>Copy 35&apos;s value to node 25. Delete the node containing 35 (it has at most one child).</div></div>
                <div className="step"><div className="sn">3</div><div>Result: root becomes 35, BST property maintained.</div></div></div>
              </div>
              <div className="q-acc" data-tags="trees perfect binary height nodes 2020">
                <div className="q-head"><button className="bk-btn" data-title="[TREES] Perfect binary tree nodes formula [2020]">&#9825;</button><div className="q-title">A perfect binary tree has height 4. How many nodes?</div><div className="q-meta"><span className="yr">2020</span><span className="pt">4 pts</span><span className="de e">easy</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div>Nodes = 2<sup>h+1</sup>−1 = 2<sup>5</sup>−1 = 32−1 = <b>31</b></div></div></div>
              </div>
            </div>

            {/* AVL */}
            <div id="sec-avl" className={`section${activeSection==='avl' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">7. AVL Trees</div><button className="done-btn" id="done-avl">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Balance factor (BF) = h(left) − h(right).</b> Valid: {'{'}−1, 0, +1{'}'}. |BF| &gt; 1 = imbalance.</div>
                <div className="nb"><b>Rotation types:</b><br/>
                LL (BF=+2, child BF=+1) → <b>single right rotation</b><br/>
                RR (BF=−2, child BF=−1) → <b>single left rotation</b><br/>
                LR (BF=+2, child BF=−1) → left rotate child, right rotate node<br/>
                RL (BF=−2, child BF=+1) → right rotate child, left rotate node</div>
                <div className="tip"><div className="tip-lbl">Exam trick</div>Draw BF next to each node before and after rotation. Always check the sign of the CHILD&apos;s BF to determine single vs double rotation.</div>
                <div className="kws"><span className="kw">balance factor</span><span className="kw">LL/RR/LR/RL</span><span className="kw">single/double rotation</span><span className="kw">O(log n) guaranteed</span></div>
              </div>
              <div className="subsec">Past paper questions</div>
              <div className="q-acc" data-tags="avl insert rotations LL RR LR RL 2020 2021 2022 2023">
                <div className="q-head"><button className="bk-btn" data-title="[AVL] Insert sequence and show all rotations [Every year]">&#9825;</button><div className="q-title">Insert [3,2,1,4,5,6,7] into an AVL tree. Show all rotations.</div><div className="q-meta"><span className="yr">Every year</span><span className="pt">20 pts</span><span className="de h">hard</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution — trace each insertion</div>
                <div className="step"><div className="sn">1</div><div>Insert 3,2: no imbalance.</div></div>
                <div className="step"><div className="sn">2</div><div>Insert 1: BF(3)=+2, child BF(2)=+1 → <b>LL → right rotate at 3</b>. Root=2, left=1, right=3.</div></div>
                <div className="step"><div className="sn">3</div><div>Insert 4,5: BF(3)=−2, child BF(4)=−1 → <b>RR → left rotate at 3</b>.</div></div>
                <div className="step"><div className="sn">4</div><div>Insert 6: RR → left rotate. Insert 7: RR → left rotate. Final: balanced tree.</div></div></div>
              </div>
              <div className="q-acc" data-tags="avl balance factor definition property 2020 2022">
                <div className="q-head"><button className="bk-btn" data-title="[AVL] Define AVL tree, balance factor, and all four rotation types [2020/22]">&#9825;</button><div className="q-title">Define AVL tree and balance factor. Describe all four rotation types.</div><div className="q-meta"><span className="yr">2020/22</span><span className="pt">8–12 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>AVL tree:</b> A BST where |BF| ≤ 1 for every node. Guarantees O(log n) operations.</div></div>
                <div className="step"><div className="sn">2</div><div>LL: single right rotation | RR: single left rotation | LR/RL: double rotation</div></div></div>
              </div>
              <div className="q-acc" data-tags="avl LR case double rotation 2021 2023">
                <div className="q-head"><button className="bk-btn" data-title="[AVL] LR case: when does it occur and how to fix [2021/23]">&#9825;</button><div className="q-title">When does an LR imbalance occur? How is it fixed?</div><div className="q-meta"><span className="yr">2021/23</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>LR occurs when:</b> BF(node)=+2 (left-heavy) AND BF(left child)=−1 (right-leaning left subtree).</div></div>
                <div className="step"><div className="sn">2</div><div><b>Fix:</b> Step 1: left rotate the left child. Step 2: right rotate the imbalanced node. (Now reduced to LL case after step 1.)</div></div></div>
              </div>
              <div className="q-acc" data-tags="avl RL case double rotation 2022">
                <div className="q-head"><button className="bk-btn" data-title="[AVL] RL case: when does it occur and how to fix [2022]">&#9825;</button><div className="q-title">When does an RL imbalance occur? How is it fixed?</div><div className="q-meta"><span className="yr">2022</span><span className="pt">8 pts</span><span className="de m">medium</span></div><div className="chev">▼</div></div>
                <div className="q-body"><div className="sol-lbl">Solution</div>
                <div className="step"><div className="sn">1</div><div><b>RL occurs when:</b> BF(node)=−2 (right-heavy) AND BF(right child)=+1 (left-leaning right subtree).</div></div>
                <div className="step"><div className="sn">2</div><div><b>Fix:</b> Step 1: right rotate the right child. Step 2: left rotate the imbalanced node.</div></div></div>
              </div>
            </div>

            {/* HASHING */}
            <div id="sec-hashing" className={`section${activeSection==='hashing' ? ' active' : ''}`}> 
              <div className="sec-header"><div className="sec-title">8. Hashing</div><button className="done-btn" id="done-hashing">Mark as done</button></div>
              <div className="notes-card"><div className="notes-card-title">Notes</div>
                <div className="nb"><b>Hash function:</b> h(x) = x % tableSize. Use a prime number as table size.</div>
                        {/* Patch: React-based expand/collapse for all .q-acc accordions */}
                        <style>{`
                          .q-acc.react-acc .q-body { display: none; }
                          .q-acc.react-acc .q-body.open { display: block; }
                          .q-acc.react-acc .chev { transition: transform 0.2s; }
                          .q-acc.react-acc .chev.open { transform: rotate(180deg); }
                        `}</style>
                        {['logs','bigoh','recursion','sorting','ds','trees','avl','hashing','graphs'].map(section => {
                          // Find all .q-acc for this section
                          const secDiv = typeof window !== 'undefined' ? document.getElementById('sec-' + section) : null;
                          if (!secDiv) return null;
                          const accs = Array.from(secDiv.querySelectorAll('.q-acc'));
                          accs.forEach((acc, idx) => {
                            acc.classList.add('react-acc');
                            const head = acc.querySelector('.q-head');
                            const body = acc.querySelector('.q-body');
                            const chev = acc.querySelector('.chev');
                            if (head && body && chev) {
                              if (head instanceof HTMLElement) {
                                head.onclick = (e) => {
                                  e.stopPropagation();
                                  setOpenQA(prev => ({ ...prev, [section]: prev[section] === idx ? null : idx }));
                                };
                              }
                              if (openQA[section] === idx) {
                                body.classList.add('open');
                                chev.classList.add('open');
                              } else {
                                body.classList.remove('open');
                                chev.classList.remove('open');
                              }
                            }
                          });
                          return null;
                        })}
                  <div className="cheat-row"><span className="cheat-k">RL (BF=−2,child=+1)</span><span className="cheat-v">double: R then L</span></div>
                </div>
                <div className="cheat-card"><div className="cheat-title">Recursion recurrences</div>
                  <div className="cheat-row"><span className="cheat-k">T(n)=T(n/2)+c</span><span className="cheat-v">O(log n)</span></div>
                  <div className="cheat-row"><span className="cheat-k">T(n)=T(n−1)+c</span><span className="cheat-v">O(n)</span></div>
                  <div className="cheat-row"><span className="cheat-k">T(n)=2T(n/2)+n</span><span className="cheat-v">O(n log n)</span></div>
                  <div className="cheat-row"><span className="cheat-k">T(n)=2T(n−1)+c</span><span className="cheat-v">O(2ⁿ)</span></div>
                </div>
                <div className="cheat-card"><div className="cheat-title">Hashing</div>
                  <div className="cheat-row"><span className="cheat-k">Hash function</span><span className="cheat-v">h(x) = x % size</span></div>
                  <div className="cheat-row"><span className="cheat-k">Quadratic probe</span><span className="cheat-v">h(x)+1², +2², +3²…</span></div>
                  <div className="cheat-row"><span className="cheat-k">Load factor</span><span className="cheat-v">items / tableSize</span></div>
                  <div className="cheat-row"><span className="cheat-k">Rehash new size</span><span className="cheat-v">next prime after 2×old</span></div>
                </div>
                <div className="cheat-card"><div className="cheat-title">Graphs</div>
                  <div className="cheat-row"><span className="cheat-k">Complete graph edges</span><span className="cheat-v">n(n−1)/2</span></div>
                  <div className="cheat-row"><span className="cheat-k">MST edges</span><span className="cheat-v">n−1</span></div>
                  <div className="cheat-row"><span className="cheat-k">Dijkstra</span><span className="cheat-v">O((V+E) log V)</span></div>
                  <div className="cheat-row"><span className="cheat-k">Kruskal</span><span className="cheat-v">O(E log E)</span></div>
                </div>
                <div className="cheat-card"><div className="cheat-title">Trees</div>
                  <div className="cheat-row"><span className="cheat-k">Perfect tree nodes</span><span className="cheat-v">2^(h+1) − 1</span></div>
                  <div className="cheat-row"><span className="cheat-k">BST search avg</span><span className="cheat-v">O(log n)</span></div>
                  <div className="cheat-row"><span className="cheat-k">In-order BST</span><span className="cheat-v">sorted output</span></div>
                  <div className="cheat-row"><span className="cheat-k">Delete 2-child</span><span className="cheat-v">in-order successor</span></div>
                </div>
              </div>
            </div>

            {/* BOOKMARKS */}
            <div id="sec-bookmarks" className="section">
              <div className="sec-header"><div className="sec-title">Bookmarked questions</div></div>
              <div id="bkContainer"><div className="no-results">No bookmarks yet. Click the ♡ heart icon on any question to save it here.</div></div>
            </div>

            {/* SEARCH RESULTS */}
            <div id="sec-search" className="section">
              <div className="sec-header"><div className="sec-title">Search results</div></div>
              <div id="searchResults"></div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
(function() {
const TOPICS=['logs','bigoh','recursion','sorting','ds','trees','avl','hashing','graphs'];
const HAS_ACCESS = ${hasAccess ? 'true' : 'false'};
const LOCKED = ['bigoh','recursion','sorting','ds','trees','avl','hashing','graphs','quiz','simulations','cheatsheet'];

let progress={},bookmarks=[],qzAnswered=0,qzCorrect=0,currentFilter='all',qzState={};
try{progress=JSON.parse(localStorage.getItem('csc3011_p')||'{}')}catch(e){}
try{bookmarks=JSON.parse(localStorage.getItem('csc3011_b')||'[]')}catch(e){}

function save(){try{localStorage.setItem('csc3011_p',JSON.stringify(progress));localStorage.setItem('csc3011_b',JSON.stringify(bookmarks))}catch(e){}}

function showSec(id){
  if(!HAS_ACCESS && LOCKED.includes(id)) return;
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const s=document.getElementById('sec-'+id);if(s)s.classList.add('active');
  const n=document.getElementById('nav-'+id);if(n)n.classList.add('active');
  if(id==='quiz')renderQuiz(currentFilter);
  if(id==='bookmarks')renderBookmarks();
  const si=document.getElementById('searchInput');if(si)si.value='';
}

// Wire nav items
TOPICS.concat(['overview','quiz','simulations','cheatsheet','bookmarks']).forEach(id=>{
  const el=document.getElementById('nav-'+id);
  if(el) el.addEventListener('click',()=>showSec(id));
});
const bkBtn=document.getElementById('bkToggleBtn');if(bkBtn)bkBtn.addEventListener('click',()=>showSec('bookmarks'));
const resetBtn=document.getElementById('resetBtn');if(resetBtn)resetBtn.addEventListener('click',resetProg);

// Overview links
['quiz','simulations','simulations','cheatsheet','bookmarks'].forEach((id,i)=>{
  const ids=['link-quiz','link-sims','link-avl','link-cheat','link-bk'];
  const el=document.getElementById(ids[i]);
  if(el) el.addEventListener('click',()=>showSec(id));
});
// Topic grid cards
[['tc-logs','logs'],['tc-bigoh','bigoh'],['tc-recursion','recursion'],['tc-sorting','sorting'],
 ['tc-ds','ds'],['tc-trees','trees'],['tc-avl','avl'],['tc-hashing','hashing'],['tc-graphs','graphs']
].forEach(([elId,secId])=>{
  const el=document.getElementById(elId);if(el)el.addEventListener('click',()=>showSec(secId));
});

function togQ(header){
  const body=header.nextElementSibling;
  const ch=header.querySelector('.chev');
  const open=body.classList.toggle('open');
  if(ch)ch.classList.toggle('open',open);
}

document.querySelectorAll('.q-head').forEach(h=>{
  h.addEventListener('click',function(){togQ(this)});
});
document.querySelectorAll('.bk-btn').forEach(btn=>{
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    const title=this.dataset.title||'';
    const idx=bookmarks.indexOf(title);
    if(idx>-1){bookmarks.splice(idx,1);this.innerHTML='&#9825;';this.classList.remove('on')}
    else{bookmarks.push(title);this.innerHTML='&#10084;';this.classList.add('on')}
    updateStats();save();
  });
});

TOPICS.forEach(t=>{
  const b=document.getElementById('done-'+t);
  if(b)b.addEventListener('click',()=>markDone(t));
});

function markDone(t){
  progress[t]=!progress[t];
  const b=document.getElementById('done-'+t);
  if(b){b.textContent=progress[t]?'Done!':'Mark as done';b.classList.toggle('marked',progress[t])}
  const d=document.getElementById('dot-'+t);
  if(d)d.classList.toggle('done',progress[t]);
  updateStats();save();
}

function updateStats(){
  const done=TOPICS.filter(t=>progress[t]).length;
  const doneEl=document.getElementById('statDone');if(doneEl)doneEl.textContent=done+'/'+TOPICS.length;
  const bkEl=document.getElementById('statBk');if(bkEl)bkEl.textContent=bookmarks.length;
  const bkCEl=document.getElementById('bkCount');if(bkCEl)bkCEl.textContent=bookmarks.length;
  if(qzAnswered>0){const p=Math.round(qzCorrect/qzAnswered*100);const qzEl=document.getElementById('statQz');if(qzEl)qzEl.textContent=p+'%';}
}

function renderBookmarks(){
  const c=document.getElementById('bkContainer');if(!c)return;
  if(!bookmarks.length){c.innerHTML='<div class="no-results">No bookmarks yet.</div>';return;}
  c.innerHTML='<p style="font-size:13px;color:#888;margin-bottom:10px">'+bookmarks.length+' saved question(s):</p>'+
    bookmarks.map((b,i)=>'<div class="bk-list-item"><div class="bk-list-title">'+b+'</div><button class="sim-btn" onclick="(function(){bookmarks.splice('+i+',1);renderBookmarks();updateStats();save();})()">Remove</button></div>').join('');
}

function resetProg(){
  if(!confirm('Reset all progress and bookmarks?'))return;
  progress={};bookmarks=[];qzAnswered=0;qzCorrect=0;qzState={};
  TOPICS.forEach(t=>{
    const b=document.getElementById('done-'+t);if(b){b.textContent='Mark as done';b.classList.remove('marked')}
    const d=document.getElementById('dot-'+t);if(d)d.classList.remove('done');
  });
  const qzS=document.getElementById('qzScore');if(qzS)qzS.textContent='0/0';
  const qzB=document.getElementById('qzBar');if(qzB)qzB.style.width='0%';
  const qzP=document.getElementById('qzPct');if(qzP)qzP.textContent='Score: 0%';
  const sQz=document.getElementById('statQz');if(sQz)sQz.textContent='0%';
  updateStats();save();renderQuiz(currentFilter);
}

const si=document.getElementById('searchInput');
if(si)si.addEventListener('input',function(){doSearch(this.value)});

function doSearch(val){
  if(!val.trim()){if(document.getElementById('sec-search').classList.contains('active'))showSec('overview');return;}
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const ss=document.getElementById('sec-search');if(ss)ss.classList.add('active');
  const v=val.toLowerCase();
  const all=document.querySelectorAll('.q-acc');
  let html='<p style="font-size:13px;color:#888;margin-bottom:12px">Results for "'+val+'":</p>';
  let count=0;
  all.forEach(q=>{
    const tags=(q.dataset.tags||'').toLowerCase();
    const titleEl=q.querySelector('.q-title');
    const title=titleEl?titleEl.textContent.toLowerCase():'';
    if(tags.includes(v)||title.includes(v)){
      count++;
      const clone=q.cloneNode(true);
      clone.querySelectorAll('.q-head').forEach(h=>h.addEventListener('click',function(){togQ(this)}));
      html+='<div style="margin-bottom:8px">'+clone.outerHTML+'</div>';
    }
  });
  if(!count)html+='<div class="no-results">No questions match "'+val+'".</div>';
  const sr=document.getElementById('searchResults');if(sr){sr.innerHTML=html;sr.querySelectorAll('.q-head').forEach(h=>h.addEventListener('click',function(){togQ(this)}));}
}

const QZ=[
  {t:'bigoh',q:'What is the Big-O order of an algorithm that runs 1+2+3+…+n steps?',opts:['O(log n)','O(n)','O(n²)','O(2ⁿ)'],ans:2,exp:'1+2+…+n = n(n+1)/2 ≈ n²/2. O(n²).'},
  {t:'recursion',q:'Which rule of recursion does naive fib(n)=fib(n−1)+fib(n−2) violate?',opts:['Base case rule','Making progress','Design rule','Compound interest rule'],ans:3,exp:'fib(n−2) recomputed many times. Rule 4: compound interest rule.'},
  {t:'bigoh',q:'O(n) algorithm takes t time for N items. Time for 2N items?',opts:['t','t + constant','2t','4t'],ans:2,exp:'Linear: doubling input doubles time = 2t.'},
  {t:'sorting',q:'Max swaps Selection sort on n elements?',opts:['n(n−1)/2','n−1','n','n²'],ans:1,exp:'Selection sort: n−1 swaps always.'},
  {t:'avl',q:'Which rotation fixes LL imbalance (BF=+2, left child BF=+1)?',opts:['Single left','Single right','Left then right','Right then left'],ans:1,exp:'LL = single right rotation.'},
  {t:'trees',q:'Which traversal prints BST nodes in sorted order?',opts:['Pre-order','Post-order','In-order','Level-order'],ans:2,exp:'In-order (L→Root→R) = sorted in BST.'},
  {t:'bigoh',q:'O(log n) algorithm takes t time for N items. Time for 2N?',opts:['2t','4t','t²','t + constant'],ans:3,exp:'log(2N)=log N+1. Time = t+constant.'},
  {t:'recursion',q:'Big-O of T(n) = T(n/2) + c?',opts:['O(n)','O(n²)','O(log n)','O(2ⁿ)'],ans:2,exp:'Halving input each step = O(log n).'},
  {t:'sorting',q:'Which sorting algorithm has O(n) best case?',opts:['Bubble','Selection','Insertion','Merge'],ans:2,exp:'Insertion sort: already sorted input = O(n).'},
  {t:'avl',q:'BF=−2, right child BF=+1. Rotation?',opts:['LL','RR','LR','RL'],ans:3,exp:'RL case: right rotate child, left rotate node.'},
  {t:'trees',q:'Perfect binary tree height 3. How many nodes?',opts:['7','8','15','16'],ans:2,exp:'2^(3+1)−1=15.'},
  {t:'bigoh',q:'Fastest growing Big-O?',opts:['O(n log n)','O(n²)','O(2ⁿ)','O(n³)'],ans:2,exp:'O(2ⁿ) exponential grows fastest.'},
  {t:'avl',q:'Left subtree height 2, right height 0. Balance factor?',opts:['-2','0','+2','+1'],ans:2,exp:'BF = h(L)−h(R) = 2−0 = +2.'},
  {t:'trees',q:'Delete node with two children: replace with?',opts:['Parent','In-order predecessor','Smallest in right subtree','Random child'],ans:2,exp:'In-order successor = smallest in right subtree.'},
  {t:'sorting',q:'Always O(n log n) regardless of input?',opts:['Bubble','Insertion','Merge','Selection'],ans:2,exp:'Merge sort always O(n log n).'},
  {t:'recursion',q:'Base case rule states?',opts:['Reduce input each call','Always call itself','At least one case solved without recursion','Never solve same sub-problem twice'],ans:2,exp:'Base case: at least one case solved directly.'},
  {t:'bigoh',q:'T₁=O(n), T₂=O(n). Order of T₁×T₂?',opts:['O(n)','O(n log n)','O(n²)','O(2n)'],ans:2,exp:'O(n)×O(n)=O(n²).'},
  {t:'avl',q:'Insert in strictly increasing order always causes?',opts:['LL','RR','LR','RL'],ans:1,exp:'Increasing values go right → RR imbalance.'},
  {t:'trees',q:'X is right child of 50, 50 is left child of 67. Domain of X?',opts:['X<50','50<X<67','X>67','X<67'],ans:1,exp:'X>50 (right of 50) and X<67 (left subtree of 67). So 50<X<67.'},
  {t:'sorting',q:'Bubble sort on [5,4,3,2,1]. Comparisons in one pass?',opts:['3','4','5','n−1=4'],ans:3,exp:'One pass: n−1=4 comparisons.'},
];

function renderQuiz(filter){
  currentFilter=filter;
  const data=filter==='all'?QZ:QZ.filter(q=>q.t===filter);
  const c=document.getElementById('quizContainer');if(!c)return;
  c.innerHTML=data.map((q,i)=>{
    const st=qzState[i]||{answered:false,selected:-1};
    return '<div class="qz-q"><div class="qz-qt">'+(i+1)+'. '+q.q+'</div>'+
    q.opts.map((o,j)=>{
      let cls='qz-opt';
      if(st.answered){if(j===q.ans)cls+=' correct';else if(j===st.selected&&j!==q.ans)cls+=' wrong';}
      return '<button class="'+cls+'" data-qi="'+i+'" data-sel="'+j+'" '+(st.answered?'disabled':'')+'>'+o+'</button>';
    }).join('')+
    '<div class="qz-exp" id="qze-'+i+'" style="'+(st.answered?'display:block':'')+'"><b>Explanation:</b> '+q.exp+'</div></div>';
  }).join('');
  c.querySelectorAll('.qz-opt').forEach(btn=>{
    btn.addEventListener('click',function(){ansQ(parseInt(this.dataset.qi),parseInt(this.dataset.sel))});
  });
}

function ansQ(i,sel){
  if(qzState[i]&&qzState[i].answered)return;
  const q=QZ[i];qzState[i]={answered:true,selected:sel};
  qzAnswered++;if(sel===q.ans)qzCorrect++;
  const p=Math.round(qzCorrect/qzAnswered*100);
  const qs=document.getElementById('qzScore');if(qs)qs.textContent=qzCorrect+'/'+qzAnswered;
  const qb=document.getElementById('qzBar');if(qb)qb.style.width=p+'%';
  const qp=document.getElementById('qzPct');if(qp)qp.textContent='Score: '+p+'%';
  const sq=document.getElementById('statQz');if(sq)sq.textContent=p+'%';
  renderQuiz(currentFilter);
}

document.querySelectorAll('.qz-f').forEach(btn=>{
  btn.addEventListener('click',function(){
    document.querySelectorAll('.qz-f').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    renderQuiz(this.dataset.filter);
  });
});

const rqBtn=document.getElementById('resetQuizBtn');
if(rqBtn)rqBtn.addEventListener('click',function(){
  qzState={};qzAnswered=0;qzCorrect=0;
  const qs=document.getElementById('qzScore');if(qs)qs.textContent='0/0';
  const qb=document.getElementById('qzBar');if(qb)qb.style.width='0%';
  const qp=document.getElementById('qzPct');if(qp)qp.textContent='Score: 0%';
  const sq=document.getElementById('statQz');if(sq)sq.textContent='0%';
  renderQuiz(currentFilter);
});

// SORTING SIM
let simArr=[],simSteps=[],simIdx=0,simTimer=null,simComps=0,simSwaps=0;

function generateSteps(arr,algo){
  const steps=[],a=[...arr];
  if(algo==='bubble'){
    for(let i=0;i<a.length-1;i++){for(let j=0;j<a.length-i-1;j++){steps.push({type:'compare',i:j,j:j+1,arr:[...a],sorted:a.length-1-i});if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];steps.push({type:'swap',i:j,j:j+1,arr:[...a],sorted:a.length-1-i});}}}
  } else if(algo==='selection'){
    for(let i=0;i<a.length-1;i++){let minIdx=i;for(let j=i+1;j<a.length;j++){steps.push({type:'compare',i:minIdx,j:j,arr:[...a],sorted:i-1});if(a[j]<a[minIdx])minIdx=j;}if(minIdx!==i){[a[i],a[minIdx]]=[a[minIdx],a[i]];steps.push({type:'swap',i:i,j:minIdx,arr:[...a],sorted:i});}}
  } else {
    for(let i=1;i<a.length;i++){let key=a[i],j=i-1;while(j>=0&&a[j]>key){steps.push({type:'compare',i:j,j:j+1,arr:[...a],sorted:-1});a[j+1]=a[j];steps.push({type:'swap',i:j,j:j+1,arr:[...a],sorted:-1});j--;}a[j+1]=key;}
  }
  steps.push({type:'done',arr:[...a],sorted:a.length});
  return steps;
}

function renderSA(arr,hi=[],sortedCount=0){
  const el=document.getElementById('simArr');if(!el)return;
  el.innerHTML=arr.map((v,i)=>{let cls='sim-box';if(i>=arr.length-sortedCount&&sortedCount>0)cls+=' sorted';else if(hi.includes(i))cls+=' comparing';return'<div class="'+cls+'">'+v+'</div>';}).join('');
}

function simReset(){
  clearInterval(simTimer);simTimer=null;
  simArr=Array.from({length:7},()=>Math.floor(Math.random()*90)+10);
  simIdx=0;simComps=0;simSwaps=0;
  const algoSel=document.getElementById('algoSel');
  simSteps=generateSteps(simArr,algoSel?algoSel.value:'bubble');
  renderSA(simArr);
  const sl=document.getElementById('simLog');if(sl)sl.textContent='Array: ['+simArr.join(', ')+']. Press "Next step" to begin.';
  const sc=document.getElementById('simCounter');if(sc)sc.textContent='Step 0/'+simSteps.length;
  const cc=document.getElementById('compCount');if(cc)cc.textContent='0';
  const sw=document.getElementById('swapCount');if(sw)sw.textContent='0';
  const sb=document.getElementById('stepBtn');if(sb)sb.disabled=false;
  const ab=document.getElementById('autoBtn');if(ab)ab.textContent='Auto-play';
}

function simStep(){
  if(simIdx>=simSteps.length)return;
  const s=simSteps[simIdx++];
  if(s.type==='compare'){simComps++;renderSA(s.arr,[s.i,s.j],s.sorted);const sl=document.getElementById('simLog');if(sl)sl.textContent='Comparing index '+s.i+' ('+s.arr[s.i]+') and '+s.j+' ('+s.arr[s.j]+')';}
  else if(s.type==='swap'){simSwaps++;renderSA(s.arr,[s.i,s.j],s.sorted);const sl=document.getElementById('simLog');if(sl)sl.textContent='Swapped '+s.arr[s.j]+' and '+s.arr[s.i]+'.';}
  else{renderSA(s.arr,[],s.sorted);const sl=document.getElementById('simLog');if(sl)sl.textContent='✓ Sorting complete! Final: ['+s.arr.join(', ')+']';const sb=document.getElementById('stepBtn');if(sb)sb.disabled=true;clearInterval(simTimer);const ab=document.getElementById('autoBtn');if(ab)ab.textContent='Auto-play';}
  const sc=document.getElementById('simCounter');if(sc)sc.textContent='Step '+simIdx+'/'+simSteps.length;
  const cc=document.getElementById('compCount');if(cc)cc.textContent=simComps;
  const sw=document.getElementById('swapCount');if(sw)sw.textContent=simSwaps;
}

function simAuto(){
  const ab=document.getElementById('autoBtn');
  if(simTimer){clearInterval(simTimer);simTimer=null;if(ab)ab.textContent='Auto-play';return;}
  if(ab)ab.textContent='Pause';
  simTimer=setInterval(()=>{if(simIdx>=simSteps.length){clearInterval(simTimer);simTimer=null;if(ab)ab.textContent='Auto-play';return;}simStep();},450);
}

const newArrBtn=document.getElementById('newArrBtn');if(newArrBtn)newArrBtn.addEventListener('click',simReset);
const stepBtnEl=document.getElementById('stepBtn');if(stepBtnEl)stepBtnEl.addEventListener('click',simStep);
const autoBtnEl=document.getElementById('autoBtn');if(autoBtnEl)autoBtnEl.addEventListener('click',simAuto);
const algoSelEl=document.getElementById('algoSel');if(algoSelEl)algoSelEl.addEventListener('change',simReset);

// AVL SIM
let avlRoot=null,avlLog='';
function avlH(n){return n?n.h:-1;}
function avlU(n){if(n)n.h=1+Math.max(avlH(n.l),avlH(n.r));}
function avlBF(n){return n?avlH(n.l)-avlH(n.r):0;}
function rotL(y){const x=y.r;y.r=x.l;x.l=y;avlU(y);avlU(x);return x;}
function rotR(y){const x=y.l;y.l=x.r;x.r=y;avlU(y);avlU(x);return x;}
function avlIns(node,v){
  if(!node)return{v,l:null,r:null,h:0};
  if(v<node.v)node.l=avlIns(node.l,v);
  else if(v>node.v)node.r=avlIns(node.r,v);
  else return node;
  avlU(node);const bf=avlBF(node);
  if(bf>1&&v<node.l.v){avlLog='LL imbalance → right rotation';return rotR(node);}
  if(bf<-1&&v>node.r.v){avlLog='RR imbalance → left rotation';return rotL(node);}
  if(bf>1&&v>node.l.v){avlLog='LR imbalance → double rotation';node.l=rotL(node.l);return rotR(node);}
  if(bf<-1&&v<node.r.v){avlLog='RL imbalance → double rotation';node.r=rotR(node.r);return rotL(node);}
  return node;
}
function avlInsert(){
  const inp=document.getElementById('avlInput');if(!inp)return;
  const v=parseInt(inp.value);if(isNaN(v)||v<0||v>999)return;
  avlLog='No rotation needed.';
  avlRoot=avlIns(avlRoot,v);
  inp.value='';
  const al=document.getElementById('avlLog');if(al)al.textContent='Inserted '+v+'. '+avlLog;
  drawAVL();
}
function avlReset(){avlRoot=null;const al=document.getElementById('avlLog');if(al)al.textContent='Tree cleared.';drawAVL();}
function drawAVL(){
  const svg=document.getElementById('avlSvg');if(!svg)return;
  svg.innerHTML='';
  if(!avlRoot){svg.innerHTML='<text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#aaa">Empty tree</text>';return;}
  const W=svg.parentElement.clientWidth||600,R=20,LH=60;
  function draw(node,x,y,xMin,xMax){
    if(!node)return;
    const mid=(xMin+xMax)/2,lx=mid-(xMax-xMin)/4,rx=mid+(xMax-xMin)/4;
    if(node.l){svg.innerHTML+='<line x1="'+x+'" y1="'+y+'" x2="'+lx+'" y2="'+(y+LH)+'" stroke="#d0d0c8" stroke-width="1.5"/>';draw(node.l,lx,y+LH,xMin,mid);}
    if(node.r){svg.innerHTML+='<line x1="'+x+'" y1="'+y+'" x2="'+rx+'" y2="'+(y+LH)+'" stroke="#d0d0c8" stroke-width="1.5"/>';draw(node.r,rx,y+LH,mid,xMax);}
    const bf=avlBF(node);
    const fill=Math.abs(bf)>1?'#FCEBEB':(bf===0?'#E1F5EE':'#EEEDFE');
    const stroke=Math.abs(bf)>1?'#E24B4A':(bf===0?'#1D9E75':'#7F77DD');
    const txtc=Math.abs(bf)>1?'#791F1F':(bf===0?'#085041':'#3C3489');
    svg.innerHTML+='<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
    svg.innerHTML+='<text x="'+x+'" y="'+(y+1)+'" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="'+txtc+'">'+node.v+'</text>';
    svg.innerHTML+='<text x="'+x+'" y="'+(y+R+10)+'" text-anchor="middle" font-size="9" fill="#aaa">'+bf+'</text>';
  }
  draw(avlRoot,W/2,30,20,W-20);
}

const avlInsBtnEl=document.getElementById('avlInsertBtn');if(avlInsBtnEl)avlInsBtnEl.addEventListener('click',avlInsert);
const avlResetBtnEl=document.getElementById('avlResetBtn');if(avlResetBtnEl)avlResetBtnEl.addEventListener('click',avlReset);
const avlInputEl=document.getElementById('avlInput');
if(avlInputEl)avlInputEl.addEventListener('keydown',function(e){if(e.key==='Enter')avlInsert();});

// Init
function initApp(){
  TOPICS.forEach(t=>{
    if(progress[t]){
      const b=document.getElementById('done-'+t);if(b){b.textContent='Done!';b.classList.add('marked');}
      const d=document.getElementById('dot-'+t);if(d)d.classList.add('done');
    }
  });
  bookmarks.forEach(title=>{
    document.querySelectorAll('.bk-btn').forEach(btn=>{
      try{if((btn.dataset.title||'').startsWith(title.substring(0,30))){btn.innerHTML='&#10084;';btn.classList.add('on');}}catch(e){}
    });
  });
  updateStats();
  renderQuiz('all');
  simReset();
  drawAVL();
}

initApp();
})();
      `}} />
    </>
  )
}
