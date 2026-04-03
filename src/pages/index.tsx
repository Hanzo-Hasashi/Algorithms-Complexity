import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'
import StudyApp from '@/components/StudyApp'
import AdminDashboard from '@/components/AdminDashboard'

const WHATSAPP_URL = 'https://wa.me/260771191739?text=Greetings%2C%20I%20would%20like%20to%20make%20payment.'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    // Handle initial session (covers the OAuth redirect-back case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchOrCreateProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchOrCreateProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Realtime: listen for profile updates (e.g. admin granting access)
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile((prev: any) => prev ? { ...prev, ...(payload.new as any) } : prev)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Fetch the profile row; if it doesn't exist yet (trigger race), create it
  async function fetchOrCreateProfile(authUser: any) {
    setLoading(true)
    try {
      // First attempt
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // If no row yet (trigger may not have fired), upsert it
      if (error || !data) {
        const { data: upserted } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            full_name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            has_access: false,
            is_admin: false,
          }, { onConflict: 'id' })
          .select('*')
          .single()
        data = upserted
      }

      // If still null, retry once after a short delay
      if (!data) {
        await new Promise(r => setTimeout(r, 1000))
        const { data: retry } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        data = retry
      }

      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setAuthLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) {
      setAuthError(error.message)
      setAuthLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0f0e17',fontFamily:'system-ui,sans-serif'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:40,height:40,border:'3px solid #7F77DD',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}></div>
          <p style={{color:'#888',fontSize:14}}>Signing you in...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (user && profile) {
    if (profile.is_admin) {
      return <AdminDashboard profile={profile} onSignOut={handleSignOut} />
    }
    return <StudyApp profile={profile} onSignOut={handleSignOut} />
  }

  // Landing page (Google-only auth)
  return (
    <>
      <Head>
        <title>CSC 3011 — Algorithms & Complexity Study Companion</title>
        <meta name="description" content="Master algorithms & complexity with past paper solutions, interactive simulations, and practice quizzes." />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f0e17;color:#fffffe;min-height:100vh;overflow-x:hidden}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .fade-up{animation:fadeUp 0.6s ease forwards}
        .fade-up-2{animation:fadeUp 0.6s 0.1s ease both}
        .fade-up-3{animation:fadeUp 0.6s 0.2s ease both}
        .fade-up-4{animation:fadeUp 0.6s 0.3s ease both}
        .fade-up-5{animation:fadeUp 0.6s 0.4s ease both}
        .feature-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;transition:all 0.2s}
        .feature-card:hover{background:rgba(127,119,221,0.08);border-color:rgba(127,119,221,0.3);transform:translateY(-2px)}
        .btn-google{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1a1a1a;border:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit}
        .btn-google:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,255,255,0.18)}
        .btn-google:disabled{opacity:0.6;cursor:not-allowed}
        .btn-whatsapp{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;border:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;text-decoration:none;font-family:inherit}
        .btn-whatsapp:hover{background:#20BA5A;transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,211,102,0.35)}
        .step-badge{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7F77DD,#534AB7);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
        .lock-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:4px 12px;font-size:12px;color:rgba(255,255,255,0.5)}
        .open-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(29,158,117,0.15);border:1px solid rgba(29,158,117,0.3);border-radius:20px;padding:4px 12px;font-size:12px;color:#1D9E75;font-weight:600}
        .glow{background:radial-gradient(ellipse at center,rgba(127,119,221,0.15) 0%,transparent 70%);position:absolute;width:600px;height:600px;pointer-events:none}
      `}</style>

      {/* Navbar */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(15,14,23,0.8)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'linear-gradient(135deg,#7F77DD,#534AB7)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📚</div>
          <span style={{fontWeight:700,fontSize:15,letterSpacing:'-0.3px'}}>CSC 3011</span>
        </div>
        <button className="btn-google" style={{padding:'8px 20px',fontSize:13}} onClick={handleGoogleSignIn} disabled={authLoading}>
          <GoogleIcon size={18} />
          Sign in with Google
        </button>
      </nav>

      {/* Hero */}
      <div style={{position:'relative',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',paddingTop:80}}>
        <div className="glow" style={{top:'10%',left:'50%',transform:'translateX(-50%)'}}></div>
        <div style={{textAlign:'center',padding:'60px 24px',maxWidth:780,position:'relative',zIndex:1}}>
          <div className="fade-up" style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(127,119,221,0.12)',border:'1px solid rgba(127,119,221,0.25)',borderRadius:20,padding:'6px 16px',fontSize:12,color:'#AFA9EC',fontWeight:600,letterSpacing:'0.5px',marginBottom:32,textTransform:'uppercase'}}>
            ✦ CSC 3011 Algorithms & Complexity
          </div>
          <h1 className="fade-up-2" style={{fontSize:'clamp(38px,7vw,72px)',fontWeight:800,lineHeight:1.1,letterSpacing:'-2px',marginBottom:24}}>
            Study smarter.<br/>
            <span style={{background:'linear-gradient(135deg,#7F77DD,#AFA9EC,#7F77DD)',backgroundSize:'200% 200%',animation:'gradMove 4s ease infinite',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              Ace your exam.
            </span>
          </h1>
          <p className="fade-up-3" style={{fontSize:18,color:'rgba(255,255,255,0.55)',lineHeight:1.7,maxWidth:560,margin:'0 auto 40px'}}>
            Past paper solutions, interactive simulations, practice quizzes, and cheat sheets — everything you need for CSC 3011.
          </p>

          {/* Primary CTAs */}
          <div className="fade-up-4" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:16}}>
            <button className="btn-google" style={{fontSize:16,padding:'14px 32px'}} onClick={handleGoogleSignIn} disabled={authLoading}>
              {authLoading
                ? <div style={{width:18,height:18,border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#1a1a1a',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}></div>
                : <GoogleIcon size={20} />
              }
              Continue with Google
            </button>
            <a className="btn-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={20} />
              WhatsApp Admin
            </a>
          </div>

          {authError && (
            <div style={{marginTop:12,padding:'10px 16px',background:'rgba(226,75,74,0.1)',border:'1px solid rgba(226,75,74,0.3)',borderRadius:10,fontSize:13,color:'#E24B4A',display:'inline-block'}}>
              {authError}
            </div>
          )}

          {/* Stats */}
          <div className="fade-up-5" style={{display:'flex',gap:32,justifyContent:'center',flexWrap:'wrap',marginTop:48}}>
            {[['9','Topics'],['28','Past paper Qs'],['20','Quiz questions'],['3','Simulations']].map(([n,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:800,color:'#7F77DD'}}>{n}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{padding:'80px 24px',maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <h2 style={{fontSize:36,fontWeight:800,letterSpacing:'-1px',marginBottom:12}}>How it works</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:16}}>Three simple steps to access the full companion</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:24}}>
          {[
            {step:'1',icon:'🔑',title:'Sign in with Google',desc:'No passwords needed. Click "Continue with Google" and sign in instantly with your Google account.'},
            {step:'2',icon:'💳',title:'Make payment & WhatsApp',desc:'Complete your payment, then tap the WhatsApp button to notify the admin with a pre-filled message.'},
            {step:'3',icon:'🔓',title:'Get full access',desc:'Admin grants you access within minutes. All 9 topics, quizzes, and simulations unlock immediately.'},
          ].map(({step,icon,title,desc}) => (
            <div key={step} className="feature-card" style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className="step-badge">{step}</div>
                <span style={{fontSize:22}}>{icon}</span>
              </div>
              <h3 style={{fontSize:17,fontWeight:700}}>{title}</h3>
              <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div style={{padding:'40px 24px 80px',maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 style={{fontSize:36,fontWeight:800,letterSpacing:'-1px',marginBottom:12}}>What&apos;s included</h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:16}}>Topic 1 is free — the rest unlock after payment</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {[
            {num:'1',name:'Logarithms',qs:'3 questions',free:true,color:'#7F77DD'},
            {num:'2',name:'Big-O Notation',qs:'6 questions',free:false,color:'#378ADD'},
            {num:'3',name:'Recursion',qs:'4 questions',free:false,color:'#1D9E75'},
            {num:'4',name:'Sorting Algorithms',qs:'3 questions',free:false,color:'#BA7517'},
            {num:'5',name:'Stacks & Queues',qs:'4 questions',free:false,color:'#D85A30'},
            {num:'6',name:'Trees & BST',qs:'4 questions',free:false,color:'#7F77DD'},
            {num:'7',name:'AVL Trees',qs:'4 questions',free:false,color:'#378ADD'},
            {num:'8',name:'Hashing',qs:'2 questions',free:false,color:'#1D9E75'},
            {num:'9',name:'Graphs',qs:'3 questions',free:false,color:'#BA7517'},
          ].map(({num,name,qs,free,color}) => (
            <div key={num} className="feature-card" style={{opacity:free?1:0.7}}>
              <div style={{fontSize:10,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>TOPIC {num}</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{name}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12}}>{qs}</div>
              {free
                ? <span className="open-badge">✓ Free preview</span>
                : <span className="lock-badge">🔒 Requires access</span>
              }
            </div>
          ))}
        </div>
        <div style={{marginTop:24,padding:20,background:'rgba(127,119,221,0.08)',border:'1px solid rgba(127,119,221,0.2)',borderRadius:12,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{fontSize:20}}>⚡</div>
          <div>
            <div style={{fontWeight:600,marginBottom:2}}>Plus: Practice Quiz, Sorting Simulator, AVL Tree Builder & Cheat Sheet</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>All included with full access</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:'60px 24px 80px',textAlign:'center',background:'rgba(127,119,221,0.05)',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <h2 style={{fontSize:32,fontWeight:800,letterSpacing:'-1px',marginBottom:16}}>Ready to ace CSC 3011?</h2>
        <p style={{color:'rgba(255,255,255,0.45)',marginBottom:32,fontSize:16}}>Sign in with Google, make payment, then WhatsApp the admin to unlock everything.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn-google" style={{fontSize:16,padding:'14px 32px'}} onClick={handleGoogleSignIn} disabled={authLoading}>
            <GoogleIcon size={20} />
            Continue with Google
          </button>
          <a className="btn-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={20} />
            WhatsApp Admin
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:'24px',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.25)',fontSize:12}}>
        CSC 3011 Study Companion · Algorithms & Complexity
      </div>
    </>
  )
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink:0}}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
