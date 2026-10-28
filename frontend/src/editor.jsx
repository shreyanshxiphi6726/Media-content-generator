import React, { useState } from 'react';
import { Code2, Play, Terminal, ArrowLeft, Copy, Check, FileCode } from 'lucide-react';

export default function Editor({ onBack }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('editor.jsx');

  const codeSnippet = `import React from 'react';

export default function App() {
  // Printing Hello World
  console.log("Hello World");

  return (
    <div className="container">
      <h1>Hello World</h1>
    </div>
  );
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <button onClick={onBack} style={styles.backBtn} title="Back to Landing Page">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div style={styles.divider}></div>
          <div style={styles.brand}>
            <Code2 size={18} color="#00f2fe" />
            <span style={styles.brandName}>Studio Workspace</span>
          </div>
        </div>

        <div style={styles.navRight}>
          <button style={styles.runBtn}>
            <Play size={14} fill="#090d16" />
            <span>Run Code</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={styles.workspace}>
        {/* Code Editor Panel */}
        <div style={styles.editorPanel}>
          {/* File Tabs Header */}
          <div style={styles.tabBar}>
            <div style={{ ...styles.tab, ...styles.activeTab }}>
              <FileCode size={14} color="#00f2fe" />
              <span>editor.jsx</span>
            </div>
          </div>

          {/* Code View Area */}
          <div style={styles.codeArea}>
            {/* Line Numbers */}
            <div style={styles.lineNumbers}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i + 1} style={styles.lineNumber}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <pre style={styles.codeContent}>
              <code>
                <span style={{ color: '#c792ea' }}>import</span> React <span style={{ color: '#c792ea' }}>from</span> <span style={{ color: '#ecc48d' }}>'react'</span>;{'\n\n'}
                <span style={{ color: '#c792ea' }}>export default function</span> <span style={{ color: '#82aaff' }}>App</span>() {'{\n'}
                {'  '}<span style={{ color: '#546e7a', fontStyle: 'italic' }}>// Printing Hello World</span>{'\n'}
                {'  '}console.<span style={{ color: '#82aaff' }}>log</span>(<span style={{ color: '#ecc48d' }}>"Hello World"</span>);{'\n\n'}
                {'  '}<span style={{ color: '#c792ea' }}>return</span> ({'\n'}
                {'    '}&lt;<span style={{ color: '#f07178' }}>div</span> <span style={{ color: '#c792ea' }}>className</span>=<span style={{ color: '#ecc48d' }}>"container"</span>&gt;{'\n'}
                {'      '}&lt;<span style={{ color: '#f07178' }}>h1</span>&gt;<span style={{ color: '#ffffff' }}>Hello World</span>&lt;/<span style={{ color: '#f07178' }}>h1</span>&gt;{'\n'}
                {'    '}&lt;/<span style={{ color: '#f07178' }}>div</span>&gt;{'\n'}
                {'  '});{'\n'}
                {'}'}
              </code>
            </pre>

            <button onClick={handleCopy} style={styles.copyBtn} title="Copy Code">
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#94a3b8" />}
            </button>
          </div>
        </div>

        {/* Terminal / Output Console Panel */}
        <div style={styles.consolePanel}>
          <div style={styles.consoleHeader}>
            <Terminal size={14} color="#00f2fe" />
            <span>Console Output</span>
          </div>

          <div style={styles.consoleBody}>
            <div style={styles.logLine}>
              <span style={styles.prompt}>&gt;</span>
              <span style={styles.logSuccess}>Hello World</span>
            </div>
            <div style={styles.logStatus}>
              Process finished with exit code 0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline styles for high-tech code studio aesthetic
const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0d14',
    color: '#e2e8f0',
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, Monaco, monospace",
    overflow: 'hidden',
  },
  navbar: {
    height: '50px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'sans-serif',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
  },
  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#00f2fe',
    color: '#090d16',
    border: 'none',
    padding: '6px 16px',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'sans-serif',
  },
  workspace: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    height: 'calc(100vh - 50px)',
  },
  editorPanel: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0b0f19',
  },
  tabBar: {
    height: '36px',
    backgroundColor: '#080c14',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    height: '100%',
    fontSize: '13px',
    color: '#64748b',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  },
  activeTab: {
    color: '#f8fafc',
    backgroundColor: '#0b0f19',
    borderTop: '2px solid #00f2fe',
  },
  codeArea: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    padding: '16px 0',
    overflowY: 'auto',
  },
  lineNumbers: {
    width: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingRight: '16px',
    userSelect: 'none',
  },
  lineNumber: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#334155',
  },
  codeContent: {
    flex: 1,
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  copyBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    padding: '6px',
    cursor: 'pointer',
  },
  consolePanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#070a0f',
  },
  consoleHeader: {
    height: '36px',
    backgroundColor: '#080c14',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: 'sans-serif',
  },
  consoleBody: {
    flex: 1,
    padding: '16px',
    fontSize: '14px',
  },
  logLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  prompt: {
    color: '#00f2fe',
    fontWeight: 'bold',
  },
  logSuccess: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  logStatus: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#475569',
  },
};