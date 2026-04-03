import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'

interface Props {
  profile: UserProfile
  onSignOut: () => void
}

export default function AdminDashboard({ profile, onSignOut }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'access' | 'pending'>('all')
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function toggleAccess(userId: string, currentAccess: boolean) {
    setUpdating(userId)
    const res = await fetch('/api/grant-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, hasAccess: !currentAccess, requestingUserId: profile.id })
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, has_access: !currentAccess } : u))
      showToast(currentAccess ? 'Access revoked' : 'Access granted ✓', currentAccess ? 'error' : 'success')
    } else {
      showToast('Failed to update access', 'error')
    }
    setUpdating(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'access' && u.has_access) || (filter === 'pending' && !u.has_access)
    return matchSearch && matchFilter
  })

  const totalUsers = users.length
  const usersWithAccess = users.filter(u => u.has_access).length
  const pendingUsers = users.filter(u => !u.has_access).length

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',system-ui,sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .stat-card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px 24px}
        .input-field{padding:9px 14px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#e6edf3;font-size:13px;outline:none;transition:border-color 0.2s;font-family:inherit}
        .input-field:focus{border-color:#7F77DD}
        .input-field::placeholder{color:#484f58}
        .filter-btn{padding:7px 16px;border-radius:20px;border:1px solid #30363d;background:transparent;color:#8b949e;font-size:12px;cursor:pointer;font-weight:500;transition:all 0.15s;font-family:inherit}
        .filter-btn.active{background:#7F77DD;color:#fff;border-color:#7F77DD}
        .filter-btn:hover:not(.active){background:#21262d;color:#e6edf3}
        .user-row{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:border-color 0.15s}
        .user-row:hover{border-color:#484f58}
        .avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}
        .badge-access{background:rgba(29,158,117,0.15);border:1px solid rgba(29,158,117,0.3);color:#3fb950;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;white-space:nowrap}
        .badge-pending{background:rgba(186,117,23,0.15);border:1px solid rgba(186,117,23,0.3);color:#d29922;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;white-space:nowrap}
        .toggle-btn{padding:7px 16px;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;white-space:nowrap}
        .toggle-grant{background:rgba(29,158,117,0.15);color:#3fb950;border:1px solid rgba(29,158,117,0.3)}
        .toggle-grant:hover{background:rgba(29,158,117,0.25)}
        .toggle-revoke{background:rgba(226,75,74,0.12);color:#f85149;border:1px solid rgba(226,75,74,0.3)}
        .toggle-revoke:hover{background:rgba(226,75,74,0.2)}
        .toast{position:fixed;bottom:24px;right:24px;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;animation:fadeIn 0.3s ease;z-index:1000}
        @media(max-width:600px){.user-row{flex-wrap:wrap}.user-meta{display:none !important}}
      `}</style>

      {toast && (
        <div className="toast" style={{background: toast.type === 'success' ? 'rgba(29,158,117,0.9)' : 'rgba(226,75,74,0.9)',color:'#fff'}}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{background:'#161b22',borderBottom:'1px solid #30363d',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,background:'linear-gradient(135deg,#7F77DD,#534AB7)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚙️</div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>Admin Dashboard</div>
            <div style={{fontSize:11,color:'#8b949e'}}>CSC 3011 Study Companion</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:12,color:'#8b949e'}}>{profile.email}</div>
          <button onClick={onSignOut} style={{padding:'7px 16px',borderRadius:8,border:'1px solid #30363d',background:'transparent',color:'#8b949e',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'28px 20px'}}>
        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:28}}>
          <div className="stat-card">
            <div style={{fontSize:32,fontWeight:800,color:'#7F77DD'}}>{totalUsers}</div>
            <div style={{fontSize:13,color:'#8b949e',marginTop:4}}>Total registered users</div>
          </div>
          <div className="stat-card">
            <div style={{fontSize:32,fontWeight:800,color:'#3fb950'}}>{usersWithAccess}</div>
            <div style={{fontSize:13,color:'#8b949e',marginTop:4}}>Users with full access</div>
          </div>
          <div className="stat-card">
            <div style={{fontSize:32,fontWeight:800,color:'#d29922'}}>{pendingUsers}</div>
            <div style={{fontSize:13,color:'#8b949e',marginTop:4}}>Pending access</div>
          </div>
          <div className="stat-card" style={{cursor:'pointer'}} onClick={() => fetchUsers()}>
            <div style={{fontSize:32,fontWeight:800,color:'#58a6ff'}}>↺</div>
            <div style={{fontSize:13,color:'#8b949e',marginTop:4}}>Refresh user list</div>
          </div>
        </div>

        {/* How to grant access info box */}
        <div style={{background:'rgba(127,119,221,0.08)',border:'1px solid rgba(127,119,221,0.2)',borderRadius:10,padding:'14px 18px',marginBottom:24,fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>
          <span style={{color:'#7F77DD',fontWeight:600}}>How to grant access:</span> When a user confirms payment on WhatsApp, find them in the list below and click <strong style={{color:'#3fb950'}}>Grant Access</strong>. They will immediately see all locked topics.
        </div>

        {/* Search & filters */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:16}}>
          <input className="input-field" style={{flex:1,minWidth:220}} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{display:'flex',gap:6}}>
            {(['all','pending','access'] as const).map(f => (
              <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'pending' ? `Pending (${pendingUsers})` : `Access (${usersWithAccess})`}
              </button>
            ))}
          </div>
        </div>

        {/* User list */}
        {loading ? (
          <div style={{textAlign:'center',padding:'48px',color:'#8b949e'}}>
            <div style={{width:32,height:32,border:'3px solid #30363d',borderTopColor:'#7F77DD',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}></div>
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px',color:'#8b949e',background:'#161b22',borderRadius:12,border:'1px solid #30363d'}}>
            {search ? 'No users match your search' : 'No users registered yet'}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map((u, i) => {
              const initials = (u.full_name || u.email).substring(0, 2).toUpperCase()
              const colors = ['#7F77DD','#378ADD','#1D9E75','#BA7517','#D85A30']
              const color = colors[i % colors.length]
              return (
                <div key={u.id} className="user-row">
                  <div className="avatar" style={{background: color + '22', color}}>
                    {initials}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {u.full_name || '—'}
                    </div>
                    <div style={{fontSize:12,color:'#8b949e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  </div>
                  <div className="user-meta" style={{fontSize:11,color:'#484f58',flexShrink:0}}>
                    Joined {formatDate(u.created_at)}
                  </div>
                  <div style={{flexShrink:0}}>
                    {u.has_access 
                      ? <span className="badge-access">✓ Has access</span>
                      : <span className="badge-pending">⏳ Pending</span>
                    }
                  </div>
                  <button
                    className={`toggle-btn ${u.has_access ? 'toggle-revoke' : 'toggle-grant'}`}
                    onClick={() => toggleAccess(u.id, u.has_access)}
                    disabled={updating === u.id}
                    style={{opacity: updating === u.id ? 0.5 : 1}}
                  >
                    {updating === u.id ? '...' : u.has_access ? 'Revoke' : 'Grant Access'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
