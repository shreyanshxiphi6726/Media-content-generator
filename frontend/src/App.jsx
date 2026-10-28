import React, { useState, useEffect } from 'react';
import { Layout, Wand2, Sparkles, ArrowRight, Image as ImageIcon, Layers, Palette, Download, ChevronLeft } from 'lucide-react';

// ==========================================
// 1. Editor Component (Prints Hello World)
// ==========================================
function Editor({ onBack }) {
  return (
    <div style={editorStyles.container}>
      {/* Top Bar */}
      <header style={editorStyles.header}>
        <div style={editorStyles.headerLeft}>
          <button onClick={onBack} style={editorStyles.backBtn}>
            <ChevronLeft size={16} /> Back to Home
          </button>
          <div style={editorStyles.divider}></div>
          <span style={editorStyles.docTitle}>Untitled Design *</span>
        </div>
        <div style={editorStyles.headerRight}>
          <button style={editorStyles.exportBtn}>
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* Main Studio View */}
      <div style={editorStyles.workspace}>
        {/* Sidebar Tools */}
        <aside style={editorStyles.sidebar}>
          <div style={editorStyles.toolItem}><Layout size={18} /><span>Templates</span></div>
          <div style={editorStyles.toolItem}><ImageIcon size={18} /><span>Elements</span></div>
          <div style={editorStyles.toolItem}><Palette size={18} /><span>Brand</span></div>
          <div style={editorStyles.toolItem}><Wand2 size={18} /><span>AI Studio</span></div>
        </aside>

        {/* Canvas Area */}
        <main style={editorStyles.canvasArea}>
          <div style={editorStyles.canvas}>
            <h1 style={editorStyles.helloWorldText}>Hello World</h1>
          </div>
        </main>
      </div>
    </div>
  );
}

// ==========================================
// 2. Landing Page Component
// ==========================================
function LandingPage({ onGetStarted }) {
  const [showBtn, setShowBtn] = useState(false);

  // Trigger slow fade-in for Get Started button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBtn(true);
    }, 600); // 0.6s delay before fade starts
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={landingStyles.container}>
      {/* Dynamic Technical / Design Grid Background */}
      <div style={landingStyles.gridOverlay}></div>
      <div style={landingStyles.glowBlob1}></div>
      <div style={landingStyles.glowBlob2}></div>

      {/* Floating Design Elements / Badges */}
      <div style={landingStyles.floatingBadge1}>
        <Wand2 size={16} color="#ec4899" />
        <span>AI Layout Engine active</span>
      </div>
      <div style={landingStyles.floatingBadge2}>
        <Layers size={16} color="#8b5cf6" />
        <span>Instant Brand Kit</span>
      </div>

      {/* Hero Content */}
      <main style={landingStyles.heroContent}>
        <div style={landingStyles.badge}>
          <Sparkles size={14} color="#ec4899" /> Next-Gen Design Platform
        </div>

        <h1 style={landingStyles.title}>
          Design & Create with <br />
          <span style={landingStyles.gradientText}>Infinite Precision</span>
        </h1>

        <p style={landingStyles.subtitle}>
          An intelligent canvas for modern creators. Generate, customize, and publish stunning visual content seamlessly.
        </p>

        {/* Slow Fade-In Get Started Button */}
        <div
          style={{
            ...landingStyles.buttonWrapper,
            opacity: showBtn ? 1 : 0,
            transform: showBtn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.8s ease, transform 1.8s ease',
          }}
        >
          <button style={landingStyles.getStartedBtn} onClick={onGetStarted}>
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 3. Main App Container & State Manager
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState('landing');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc' }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(236, 72, 153, 0.4);
        }
      `}</style>

      {currentView === 'landing' ? (
        <LandingPage onGetStarted={() => setCurrentView('editor')} />
      ) : (
        <Editor onBack={() => setCurrentView('landing')} />
      )}
    </div>
  );
}

// ==========================================
// 4. Stylesheet
// ==========================================
const landingStyles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
    pointerEvents: 'none',
  },
  glowBlob1: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)',
    animation: 'pulseGlow 6s infinite ease-in-out',
    pointerEvents: 'none',
  },
  glowBlob2: {
    position: 'absolute',
    bottom: '15%',
    right: '15%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)',
    animation: 'pulseGlow 8s infinite ease-in-out',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    maxWidth: '750px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    border: '1px solid rgba(236, 72, 153, 0.2)',
    color: '#ec4899',
    fontSize: '13px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: '800',
    lineHeight: '1.15',
    marginBottom: '20px',
    color: '#ffffff',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.15rem',
    color: '#94a3b8',
    marginBottom: '40px',
    lineHeight: '1.6',
  },
  buttonWrapper: {
    display: 'inline-block',
  },
  getStartedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ec4899',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '14px 32px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)',
  },
  floatingBadge1: {
    position: 'absolute',
    top: '20%',
    left: '8%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    backdropFilter: 'blur(8px)',
    animation: 'float 4s ease-in-out infinite',
  },
  floatingBadge2: {
    position: 'absolute',
    bottom: '22%',
    right: '8%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    backdropFilter: 'blur(8px)',
    animation: 'float 5s ease-in-out infinite 1s',
  },
};

const editorStyles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    height: '56px',
    backgroundColor: '#0b0f19',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  docTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ec4899',
    color: '#ffffff',
    border: 'none',
    padding: '6px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  workspace: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '72px',
    backgroundColor: '#090d16',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '16px',
    gap: '24px',
  },
  toolItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#64748b',
    fontSize: '10px',
    cursor: 'pointer',
  },
  canvasArea: {
    flex: 1,
    backgroundColor: '#131b2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  canvas: {
    width: '600px',
    height: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloWorldText: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    fontFamily: 'sans-serif',
  },
};