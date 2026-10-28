import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, Wand2, Image as ImageIcon, Palette, 
  Layers, ChevronDown, Folder, Save, FilePlus, 
  LogOut, Undo2, Redo2, Eye, HelpCircle, PlusSquare, Settings, Menu,
  Ratio, Type, UploadCloud, PenTool, Sliders
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Editor({ onBack }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [isToolDrawerOpen, setIsToolDrawerOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasElements, setCanvasElements] = useState([]);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [toast, setToast] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Design');
  const uploadInputRef = useRef(null);
  
  // Left Sidebar Panel State
  const [activeSidebarTool, setActiveSidebarTool] = useState('ratio');
  
  // Canvas Size State
  const [canvasDimensions, setCanvasDimensions] = useState({ width: '600px', height: '400px', name: '16:9 Landscape' });

  // Close top menus when clicking outside
  const handleOutsideClick = () => {
    setActiveDropdown(null);
    setActiveSubMenu(null);
  };

  const handleRatioChange = (width, height, name) => {
    setHistory((items) => [...items, canvasDimensions]);
    setFuture([]);
    setCanvasDimensions({ width, height, name });
  };

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const handleNew = () => {
    setHistory([]);
    setFuture([]);
    setCanvasElements([]);
    setCanvasBackground('#ffffff');
    setCanvasDimensions({ width: '600px', height: '400px', name: '16:9 Landscape' });
    setProjectId(null);
    setProjectName('Untitled Design');
    notify('New local design created');
  };

  const getDocument = () => ({
    canvasDimensions,
    canvasBackground,
    canvasElements,
    showGrid,
    zoom,
  });

  const loadDocument = (project) => {
    const document = project.document || {};
    setProjectId(project.id);
    setProjectName(project.name || 'Untitled Design');
    if (document.canvasDimensions) setCanvasDimensions(document.canvasDimensions);
    if (document.canvasBackground) setCanvasBackground(document.canvasBackground);
    setCanvasElements(document.canvasElements || []);
    setShowGrid(Boolean(document.showGrid));
    setZoom(document.zoom || 1);
    setHistory([]);
    setFuture([]);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(projectId ? `${API_URL}/api/projects/${projectId}` : `${API_URL}/api/projects`, {
        method: projectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, document: getDocument() }),
      });
      if (!response.ok) throw new Error('Save failed');
      const project = await response.json();
      setProjectId(project.id);
      notify('Design saved to MongoDB');
    } catch {
      notify('Backend unavailable; start the FastAPI server first');
    }
  };

  const handleOpen = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`);
      if (!response.ok) throw new Error('Load failed');
      const projects = await response.json();
      if (!projects.length) return notify('No saved designs found');
      loadDocument(projects[0]);
      notify(`Loaded ${projects[0].name}`);
    } catch {
      notify('Could not load designs from the backend');
    }
  };

  const handleUndo = () => {
    if (!history.length) return notify('Nothing to undo');
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [canvasDimensions, ...items]);
    setCanvasDimensions(previous);
  };

  const handleRedo = () => {
    if (!future.length) return notify('Nothing to redo');
    const next = future[0];
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, canvasDimensions]);
    setCanvasDimensions(next);
  };

  const handleExport = (format = 'SVG') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasDimensions.width}" height="${canvasDimensions.height}" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="white"/><text x="300" y="220" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="800" fill="#0f172a">Hello World</text></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `untitled-design.${format.toLowerCase() === 'png' ? 'svg' : format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`${format} export downloaded`);
  };

  const addCanvasElement = (label, type = 'text') => {
    setCanvasElements((items) => [...items, { id: Date.now(), label, type }]);
    notify(`${label} added to canvas`);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCanvasElements((items) => [...items, {
        id: Date.now(),
        label: file.name,
        type: 'image',
        src: reader.result,
      }]);
      notify(`${file.name} added to canvas`);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div style={editorStyles.container} onClick={handleOutsideClick}>
      {/* ================= TOP NAVBAR ================= */}
      <header style={editorStyles.navbar}>
        <div style={editorStyles.navLeft}>
          <button onClick={onBack} style={editorStyles.backBtn} title="Back to Home">
            <ChevronLeft size={16} /> Home
          </button>
          <button
            onClick={() => setIsToolDrawerOpen((isOpen) => !isOpen)}
            style={editorStyles.toggleLeftBarBtn}
            title={isToolDrawerOpen ? 'Hide tab options' : 'Show tab options'}
            aria-label={isToolDrawerOpen ? 'Hide tab options' : 'Show tab options'}
            aria-pressed={isToolDrawerOpen}
          >
            <Menu size={16} />
          </button>
          <div style={editorStyles.divider}></div>

          {/* Interactive Nav Menus */}
          <nav style={editorStyles.menuBar}>
            
            {/* 1. FILE MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'file' ? null : 'file'); setActiveSubMenu(null); }}
              >
                File <ChevronDown size={12} />
              </button>
              {activeDropdown === 'file' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={handleNew}><FilePlus size={14} /> New</div>
                  <div style={editorStyles.dropdownItem} onClick={handleOpen}><Folder size={14} /> Open latest</div>
                  <div style={editorStyles.dropdownItem} onClick={handleSave}><Save size={14} /> Save</div>
                  
                  <div 
                    style={editorStyles.dropdownItemWithSub}
                    onMouseEnter={() => setActiveSubMenu('export')}
                  >
                    <span>Export</span> <span>▸</span>
                    {activeSubMenu === 'export' && (
                      <div style={editorStyles.subMenu}>
                        <div style={editorStyles.dropdownItem} onClick={() => handleExport('SVG')}>PDF Document</div>
                        <div style={editorStyles.dropdownItem} onClick={() => handleExport('JPEG')}>JPEG Image</div>
                        <div style={editorStyles.dropdownItem} onClick={() => handleExport('PNG')}>PNG Graphic</div>
                      </div>
                    )}
                  </div>

                  <div style={editorStyles.dropdownDivider}></div>
                  <div style={{ ...editorStyles.dropdownItem, color: '#f87171' }} onClick={onBack}>
                    <LogOut size={14} /> Exit
                  </div>
                </div>
              )}
            </div>

            {/* 2. EDIT MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'edit' ? null : 'edit'); setActiveSubMenu(null); }}
              >
                Edit <ChevronDown size={12} />
              </button>
              {activeDropdown === 'edit' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={handleUndo}><Undo2 size={14} /> Undo</div>
                  <div style={editorStyles.dropdownItem} onClick={handleRedo}><Redo2 size={14} /> Redo</div>
                </div>
              )}
            </div>

            {/* 3. OPTIONS MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'options' ? null : 'options'); setActiveSubMenu(null); }}
              >
                Options <ChevronDown size={12} />
              </button>
              {activeDropdown === 'options' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Preferences are local for now')}><Settings size={14} /> Preferences</div>
                  <div style={editorStyles.dropdownItem} onClick={() => setIsToolDrawerOpen(true)}>Canvas Settings</div>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Workspace theme settings coming soon')}>Workspace Theme</div>
                </div>
              )}
            </div>

            {/* 4. INSERT MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'insert' ? null : 'insert'); setActiveSubMenu(null); }}
              >
                Insert <ChevronDown size={12} />
              </button>
              {activeDropdown === 'insert' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={() => addCanvasElement('Text Box')}><PlusSquare size={14} /> Text Box</div>
                  <div style={editorStyles.dropdownItem} onClick={() => addCanvasElement('Shape', 'shape')}>Shape / Graphic</div>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Stock image search will be connected later')}>Stock Image</div>
                </div>
              )}
            </div>

            {/* 5. VIEW MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'view' ? null : 'view'); setActiveSubMenu(null); }}
              >
                View <ChevronDown size={12} />
              </button>
              {activeDropdown === 'view' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={() => setShowGrid((value) => !value)}><Eye size={14} /> Toggle Grid</div>
                  <div style={editorStyles.dropdownItem} onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}>Zoom In (+)</div>
                  <div style={editorStyles.dropdownItem} onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}>Zoom Out (-)</div>
                  <div style={editorStyles.dropdownItem} onClick={() => setZoom(1)}>Reset Zoom</div>
                </div>
              )}
            </div>

            {/* 6. HELP MENU */}
            <div style={editorStyles.menuItemWrapper} onClick={(e) => e.stopPropagation()}>
              <button 
                style={editorStyles.menuBtn} 
                onClick={() => { setActiveDropdown(activeDropdown === 'help' ? null : 'help'); setActiveSubMenu(null); }}
              >
                Help <ChevronDown size={12} />
              </button>
              {activeDropdown === 'help' && (
                <div style={editorStyles.dropdownMenu}>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo')}><HelpCircle size={14} /> Keyboard Shortcuts</div>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Documentation will be connected later')}>Documentation</div>
                  <div style={editorStyles.dropdownItem} onClick={() => notify('Studio UI v0.1')}>About Studio</div>
                </div>
              )}
            </div>

          </nav>
        </div>

        <div style={editorStyles.navRight}>
          <span style={editorStyles.docTitle}>{projectName} ({canvasDimensions.name}) *</span>
        </div>
      </header>

      {/* ================= WORKSPACE ================= */}
      <div style={editorStyles.workspace}>
        
        {/* 1. Left Vertical Icon Sidebar */}
        <aside style={editorStyles.sidebar}>
          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'ratio' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('ratio'); setIsToolDrawerOpen(true); }}
          >
            <Ratio size={20} />
            <span>Ratio</span>
          </div>

          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'text' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('text'); setIsToolDrawerOpen(true); }}
          >
            <Type size={20} />
            <span>Text</span>
          </div>

          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'uploads' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('uploads'); setIsToolDrawerOpen(true); }}
          >
            <UploadCloud size={20} />
            <span>Uploads</span>
          </div>

          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'draw' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('draw'); setIsToolDrawerOpen(true); }}
          >
            <PenTool size={20} />
            <span>Draw</span>
          </div>

          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'colors' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('colors'); setIsToolDrawerOpen(true); }}
          >
            <Palette size={20} />
            <span>Colors</span>
          </div>

          <div 
            style={{ ...editorStyles.toolItem, ...(activeSidebarTool === 'layers' ? editorStyles.toolItemActive : {}) }}
            onClick={() => { setActiveSidebarTool('layers'); setIsToolDrawerOpen(true); }}
          >
            <Layers size={20} />
            <span>Layers</span>
          </div>

        </aside>

        {/* 2. Secondary Contextual Tool Drawer */}
        <div style={{
          ...editorStyles.toolDrawer,
          ...(isToolDrawerOpen ? editorStyles.toolDrawerOpen : editorStyles.toolDrawerClosed),
        }}>
          {activeSidebarTool === 'ratio' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Canvas Ratio</h3>
              <p style={editorStyles.drawerSubtitle}>Select orientation or preset format</p>
              
              <div style={editorStyles.ratioGrid}>
                <button 
                  style={editorStyles.ratioCard} 
                  onClick={() => handleRatioChange('600px', '337px', '16:9 Landscape')}
                >
                  <div style={{ ...editorStyles.ratioBox, width: '40px', height: '22px' }}></div>
                  <span>16:9 Landscape</span>
                </button>

                <button 
                  style={editorStyles.ratioCard} 
                  onClick={() => handleRatioChange('380px', '380px', '1:1 Square')}
                >
                  <div style={{ ...editorStyles.ratioBox, width: '30px', height: '30px' }}></div>
                  <span>1:1 Square (Post)</span>
                </button>

                <button 
                  style={editorStyles.ratioCard} 
                  onClick={() => handleRatioChange('280px', '500px', '9:16 Story')}
                >
                  <div style={{ ...editorStyles.ratioBox, width: '22px', height: '40px' }}></div>
                  <span>9:16 Story / Reel</span>
                </button>

                <button 
                  style={editorStyles.ratioCard} 
                  onClick={() => handleRatioChange('500px', '350px', '4:3 Standard')}
                >
                  <div style={{ ...editorStyles.ratioBox, width: '36px', height: '27px' }}></div>
                  <span>4:3 Standard</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('600px', '400px', '3:2 Photo')}>
                  <div style={{ ...editorStyles.ratioBox, width: '36px', height: '24px' }}></div>
                  <span>3:2 Photo</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('400px', '600px', '2:3 Portrait Photo')}>
                  <div style={{ ...editorStyles.ratioBox, width: '24px', height: '36px' }}></div>
                  <span>2:3 Portrait Photo</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('400px', '500px', '4:5 Instagram Portrait')}>
                  <div style={{ ...editorStyles.ratioBox, width: '26px', height: '33px' }}></div>
                  <span>4:5 Instagram Portrait</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('500px', '400px', '5:4 Landscape Photo')}>
                  <div style={{ ...editorStyles.ratioBox, width: '33px', height: '26px' }}></div>
                  <span>5:4 Landscape Photo</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('500px', '312px', '16:10 Presentation')}>
                  <div style={{ ...editorStyles.ratioBox, width: '38px', height: '24px' }}></div>
                  <span>16:10 Presentation</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('420px', '594px', 'A4 Portrait')}>
                  <div style={{ ...editorStyles.ratioBox, width: '25px', height: '35px' }}></div>
                  <span>A4 Portrait</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('594px', '420px', 'A4 Landscape')}>
                  <div style={{ ...editorStyles.ratioBox, width: '35px', height: '25px' }}></div>
                  <span>A4 Landscape</span>
                </button>

                <button style={editorStyles.ratioCard} onClick={() => handleRatioChange('700px', '300px', '21:9 Ultrawide')}>
                  <div style={{ ...editorStyles.ratioBox, width: '42px', height: '18px' }}></div>
                  <span>21:9 Ultrawide</span>
                </button>
              </div>
            </div>
          )}

          {activeSidebarTool === 'text' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Text Studio</h3>
              <button style={editorStyles.drawerActionBtn} onClick={() => addCanvasElement('Heading')}>+ Add Heading</button>
              <button style={editorStyles.drawerActionBtn} onClick={() => addCanvasElement('Subheading')}>+ Add Subheading</button>
              <button style={editorStyles.drawerActionBtn} onClick={() => addCanvasElement('Body Text')}>+ Add Body Text</button>
            </div>
          )}

          {activeSidebarTool === 'uploads' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Uploads</h3>
              <button style={{ ...editorStyles.drawerActionBtn, backgroundColor: '#3b82f6' }} onClick={() => uploadInputRef.current?.click()}>Upload Media</button>
            </div>
          )}

          {activeSidebarTool === 'draw' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Draw Tools</h3>
              <p style={editorStyles.drawerSubtitle}>Select brush or pen</p>
              <button style={editorStyles.drawerActionBtn} onClick={() => addCanvasElement('Drawing', 'shape')}>Add Drawing</button>
            </div>
          )}

          {activeSidebarTool === 'colors' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Color Palette</h3>
              <p style={editorStyles.drawerSubtitle}>Set canvas background color</p>
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#ffffff' }} onClick={() => setCanvasBackground('#ffffff')}>White</button>
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#fef3c7' }} onClick={() => setCanvasBackground('#fef3c7')}>Warm</button>
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#dbeafe' }} onClick={() => setCanvasBackground('#dbeafe')}>Blue</button>
            </div>
          )}

          {activeSidebarTool === 'layers' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Layers Manager</h3>
              <p style={editorStyles.drawerSubtitle}>{canvasElements.length} local element{canvasElements.length === 1 ? '' : 's'}</p>
              {canvasElements.map((element) => <div key={element.id} style={editorStyles.layerItem}>{element.label}</div>)}
            </div>
          )}

        </div>

        {/* 3. Central Canvas Area */}
        <main style={editorStyles.canvasArea}>
          <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <div 
            style={{ 
              ...editorStyles.canvas, 
              width: canvasDimensions.width, 
              height: canvasDimensions.height,
              backgroundColor: canvasBackground,
              transform: `scale(${zoom})`,
              backgroundImage: showGrid ? 'linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px)' : 'none',
              backgroundSize: '20px 20px',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <h1 style={editorStyles.helloWorldText}>Hello World</h1>
            {canvasElements.map((element) => (
              element.type === 'image'
                ? <img key={element.id} src={element.src} alt={element.label} title={element.label} style={editorStyles.canvasImage} />
                : <div key={element.id} style={element.type === 'shape' ? editorStyles.canvasShape : element.type === 'ai' ? editorStyles.canvasAi : editorStyles.canvasElement}>{element.label}</div>
            ))}
          </div>
        </main>
      </div>
      {toast && <div style={editorStyles.toast}>{toast}</div>}
    </div>
  );
}

// ================= STYLES =================
const editorStyles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    color: '#f8fafc',
    userSelect: 'none',
  },
  navbar: {
    height: '52px',
    backgroundColor: '#0b0f19',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  toggleLeftBarBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuBar: {
    display: 'flex',
    gap: '4px',
  },
  menuItemWrapper: {
    position: 'relative',
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    width: '180px',
    backgroundColor: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    padding: '6px 0',
    zIndex: 200,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  dropdownItemDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  dropdownItemWithSub: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#cbd5e1',
    cursor: 'pointer',
    position: 'relative',
  },
  subMenu: {
    position: 'absolute',
    top: 0,
    left: '100%',
    width: '150px',
    backgroundColor: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    padding: '6px 0',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    margin: '4px 0',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  docTitle: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  exportActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ec4899',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
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
    gap: '16px',
  },
  toolItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#64748b',
    fontSize: '10px',
    cursor: 'pointer',
    width: '100%',
    padding: '8px 0',
  },
  toolItemActive: {
    color: '#f8fafc',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderLeft: '3px solid #ec4899',
  },
  toolDrawer: {
    width: '240px',
    backgroundColor: '#0d1322',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '20px 16px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    transition: 'width 0.25s ease, padding 0.25s ease, opacity 0.2s ease, transform 0.25s ease',
    transformOrigin: 'left center',
  },
  toolDrawerOpen: {
    opacity: 1,
    transform: 'translateX(0)',
  },
  toolDrawerClosed: {
    width: '0px',
    paddingLeft: 0,
    paddingRight: 0,
    opacity: 0,
    overflow: 'hidden',
    transform: 'translateX(-12px)',
    pointerEvents: 'none',
  },
  drawerTitle: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  drawerSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  ratioGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  ratioCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '10px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left',
  },
  ratioBox: {
    border: '1px dashed #ec4899',
    borderRadius: '2px',
  },
  drawerActionBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px',
    fontSize: '13px',
    textAlign: 'left',
  },
  colorSwatch: {
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    padding: '8px',
    marginBottom: '8px',
    color: '#0f172a',
    textAlign: 'left',
    cursor: 'pointer',
  },
  layerItem: {
    padding: '8px 10px',
    marginBottom: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#cbd5e1',
  },
  canvasArea: {
    flex: 1,
    backgroundColor: '#131b2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    overflow: 'auto',
  },
  canvas: {
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
  canvasElement: {
    padding: '6px 12px',
    marginTop: '8px',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '14px',
  },
  canvasShape: {
    width: '72px',
    height: '40px',
    marginTop: '12px',
    backgroundColor: '#c4b5fd',
    border: '2px solid #7c3aed',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4c1d95',
    fontSize: '10px',
  },
  canvasAi: {
    padding: '10px 16px',
    marginTop: '10px',
    background: 'linear-gradient(135deg, #f9a8d4, #c4b5fd)',
    borderRadius: '8px',
    color: '#581c87',
    fontWeight: '600',
    fontSize: '12px',
  },
  canvasImage: {
    maxWidth: '80%',
    maxHeight: '55%',
    objectFit: 'contain',
    marginTop: '12px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  },
  toast: {
    position: 'fixed',
    left: '50%',
    bottom: '24px',
    transform: 'translateX(-50%)',
    backgroundColor: '#111827',
    color: '#f8fafc',
    padding: '10px 16px',
    borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    fontSize: '13px',
    zIndex: 500,
  },
};
