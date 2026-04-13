'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession, isAuthenticated } from '@/lib/auth/session';
import { Cpu, Eye, EyeOff } from 'lucide-react';
export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard');
  }, [navigate]);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError('Enter credentials');
      return;
    }
    setError('');
    setLoading(true);
    const u = username.trim().toLowerCase();
    if (u !== 'rms' || password !== 'rms') {
      setError('Use username "rms" and password "rms" for UI review');
      setLoading(false);
      return;
    }
    // Must match backend / Flyway seed tenant (see X-Tenant-ID → TenantFilter → rules rows).
    setSession({
      token: 'rms-review-token',
      tenant_id: 'default',
      user_id: 'rms-review-user',
      email: 'rms@local.review',
      name: 'RMS Reviewer',
      role: 'admin'
    });
    navigate('/dashboard');
    setLoading(false);
  }
  return <div style={{
    minHeight: '100vh',
    background: 'var(--surface-0)',
    display: 'flex',
    position: 'relative',
    overflow: 'hidden'
  }}>
      {/* Ambient grid */}
      <div style={{
      position: 'absolute',
      inset: 0,
      opacity: 0.03,
      backgroundImage: 'linear-gradient(var(--accent-blue) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue) 1px, transparent 1px)',
      backgroundSize: '60px 60px',
      pointerEvents: 'none',
      zIndex: 0
    }} />

      {/* Left — branding panel */}
      <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '80px 64px',
      position: 'relative',
      borderRight: '1px solid var(--border)',
      background: 'linear-gradient(135deg, var(--surface-0) 0%, var(--surface-1) 100%)',
      zIndex: 1
    }}>
        {/* Accent glow */}
        <div style={{
        position: 'absolute',
        top: '20%',
        left: '-80px',
        width: '360px',
        height: '360px',
        background: 'radial-gradient(circle, rgba(75,108,243,0.18) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

        <div style={{
        position: 'relative'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '48px'
        }}>
            <div style={{
            width: '42px',
            height: '42px',
            background: 'var(--accent-blue)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px var(--accent-blue-glow)'
          }}>
              <Cpu size={22} color="#12121e" />
            </div>
            <div>
              <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>AODB Platform</div>
              <div style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em'
            }}>Resource Management System</div>
            </div>
          </div>

          <h1 style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          marginBottom: '20px'
        }}>
            Airport<br />
            <span style={{
            color: 'var(--accent-blue)'
          }}>Operations</span><br />
            Intelligence
          </h1>
          <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          maxWidth: '380px'
        }}>
            Real-time gate, stand, belt and runway allocation with conflict detection and auto-assignment engine.
          </p>

          <div style={{
          marginTop: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
            {[{
            label: 'Auto-Allocation Engine',
            desc: 'AI-driven resource assignment'
          }, {
            label: 'Conflict Detection',
            desc: 'Real-time overlap prevention'
          }, {
            label: 'Gantt Timeline',
            desc: 'Visual resource management'
          }].map(f => <div key={f.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
                <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-blue)',
              flexShrink: 0
            }} />
                <div>
                  <span style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>{f.label}</span>
                  <span style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginLeft: '6px'
              }}>— {f.desc}</span>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div style={{
      width: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 48px',
      background: 'var(--surface-1)',
      position: 'relative',
      zIndex: 1
    }}>
        <div style={{
        width: '100%'
      }}>
          <h2 style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px'
        }}>
            Sign in
          </h2>
          <p style={{
          fontSize: '0.83rem',
          color: 'var(--text-secondary)',
          marginBottom: '32px'
        }}>
            Demo login for UI review: <span className="font-mono">rms / rms</span>
          </p>

          {error && <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          color: '#f87171'
        }}>
              {error}
            </div>}

          <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
            <div>
              <label className="field-label" htmlFor="rms-username">Username / Email</label>
              <input id="rms-username" className="field-input" type="text" placeholder="admin@airport.com" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>

            <div>
              <label className="field-label" htmlFor="rms-password">Password</label>
              <div style={{
              position: 'relative'
            }}>
                <input id="rms-password" className="field-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{
                paddingRight: '44px'
              }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: '8px'
          }}>
              {loading ? <><div className="spinner" style={{
                width: '16px',
                height: '16px'
              }} /> Authenticating...</> : 'Sign In'}
            </button>
          </form>

          <p style={{
          marginTop: '32px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
            AODB Platform · Airport Operations Database
          </p>
        </div>
      </div>
    </div>;
}
