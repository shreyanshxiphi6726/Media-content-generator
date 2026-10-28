import React, { useEffect, useRef, useState } from 'react';
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
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mcp-editor-history') || '[]').slice(-10); } catch { return []; }
  });
  const [future, setFuture] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mcp-editor-future') || '[]').slice(0, 10); } catch { return []; }
  });
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasElements, setCanvasElements] = useState([]);
  const [canvasBackground, setCanvasBackground] = useState('#ffffff');
  const [toast, setToast] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Design');
  const uploadInputRef = useRef(null);
  const mcpInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [mcpFileHandle, setMcpFileHandle] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [dragState, setDragState] = useState(null);
  
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
    recordHistory();
    setCanvasDimensions({ width, height, name });
  };

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const handleNew = () => {
    recordHistory();
    setCanvasElements([]);
    setCanvasBackground('#ffffff');
    setCanvasDimensions({ width: '600px', height: '400px', name: '16:9 Landscape' });
    setProjectId(null);
    setProjectName('Untitled');
    setMcpFileHandle(null);
    notify('New blank .mcp design created');
  };

  const getDocument = () => ({
    canvasDimensions,
    canvasBackground,
    canvasElements,
    showGrid,
    zoom,
  });

  const recordHistory = () => {
    setHistory((items) => [...items, getDocument()].slice(-10));
    setFuture([]);
  };

  const restoreDocument = (document) => {
    setCanvasDimensions(document.canvasDimensions || { width: '600px', height: '400px', name: '16:9 Landscape' });
    setCanvasBackground(document.canvasBackground || '#ffffff');
    setCanvasElements(document.canvasElements || []);
    setShowGrid(Boolean(document.showGrid));
    setZoom(document.zoom || 1);
  };

  useEffect(() => {
    localStorage.setItem('mcp-editor-history', JSON.stringify(history.slice(-10)));
    localStorage.setItem('mcp-editor-future', JSON.stringify(future.slice(0, 10)));
  }, [history, future]);

  const loadDocument = (project) => {
    const document = project.document || {};
    setProjectId(project.id);
    setProjectName(project.name || 'Untitled Design');
    if (document.canvasDimensions) setCanvasDimensions(document.canvasDimensions);
    if (document.canvasBackground) setCanvasBackground(document.canvasBackground);
    setCanvasElements((document.canvasElements || []).map((element, index) => ({
      x: 40 + (index % 2) * 180,
      y: 40 + Math.floor(index / 2) * 70,
      fontSize: 24,
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#0f172a',
      textAlign: 'left',
      visible: true,
      ...element,
    })));
    setShowGrid(Boolean(document.showGrid));
    setZoom(document.zoom || 1);
    setHistory([]);
    setFuture([]);
  };

  const getMcpFile = () => ({
    format: 'mcp',
    version: 1,
    name: projectName || 'Untitled',
    document: getDocument(),
  });

  const handleSave = async () => {
    const content = JSON.stringify(getMcpFile(), null, 2);
    try {
      if ('showSaveFilePicker' in window) {
        const handle = mcpFileHandle || await window.showSaveFilePicker({
          suggestedName: `${projectName || 'Untitled'}.mcp`,
          types: [{ description: 'Media Canvas Project', accept: { 'application/json': ['.mcp'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        setMcpFileHandle(handle);
        setProjectName(handle.name.replace(/\.mcp$/i, '') || 'Untitled');
        notify('Design saved as .mcp');
        return;
      }

      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'Untitled'}.mcp`;
      link.click();
      URL.revokeObjectURL(url);
      notify('Design downloaded as .mcp');
    } catch {
      notify('Save cancelled');
    }
  };

  const applyMcpFile = async (file, handle = null) => {
    try {
      const data = JSON.parse(await file.text());
      if (data.format !== 'mcp' || !data.document) throw new Error('Invalid MCP file');
      loadDocument({ id: null, name: data.name || file.name.replace(/\.mcp$/i, ''), document: data.document });
      setMcpFileHandle(handle);
      notify(`Opened ${file.name}`);
    } catch {
      notify('That file is not a valid .mcp project');
    }
  };

  const handleOpen = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Media Canvas Project', accept: { 'application/json': ['.mcp'] } }],
        });
        await applyMcpFile(await handle.getFile(), handle);
        return;
      }
      mcpInputRef.current?.click();
    } catch {
      notify('Open cancelled');
    }
  };

  const handleMcpInput = (event) => {
    const file = event.target.files?.[0];
    if (file) applyMcpFile(file);
    event.target.value = '';
  };

  const handleUndo = () => {
    if (!history.length) return notify('Nothing to undo');
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [getDocument(), ...items].slice(0, 10));
    restoreDocument(previous);
  };

  const handleRedo = () => {
    if (!future.length) return notify('Nothing to redo');
    const next = future[0];
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, getDocument()].slice(-10));
    restoreDocument(next);
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? handleRedo() : handleUndo();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [history, future]);

  const handleExport = (format = 'SVG') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasDimensions.width}" height="${canvasDimensions.height}" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="${canvasBackground}"/></svg>`;
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
    recordHistory();
    setCanvasElements((items) => [...items, {
      id: Date.now(), label, type,
      x: 40 + (items.length % 2) * 180,
      y: 40 + Math.floor(items.length / 2) * 70,
      fontSize: 24,
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#0f172a',
      textAlign: 'left',
      visible: true,
    }]);
    notify(`${label} added to canvas`);
  };

  const addTextElement = (label, fontSize, fontWeight = '400') => {
    recordHistory();
    const id = Date.now();
    setCanvasElements((items) => [...items, {
      id, label, type: 'text', x: 50, y: 50 + items.length * 50,
      fontSize, fontWeight, fontStyle: 'normal', color: '#0f172a', textAlign: 'left',
      visible: true,
    }]);
    setSelectedElementId(id);
    notify(`${label} added to canvas`);
  };

  const selectedElement = canvasElements.find((element) => element.id === selectedElementId);

  const updateElement = (id, changes, saveHistory = true) => {
    if (saveHistory) recordHistory();
    setCanvasElements((items) => items.map((element) => (
      element.id === id ? { ...element, ...changes } : element
    )));
  };

  const deleteElement = (id) => {
    recordHistory();
    setCanvasElements((items) => items.filter((element) => element.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
    notify('Layer deleted');
  };

  const moveElement = (id, direction) => {
    recordHistory();
    setCanvasElements((items) => {
      const index = items.findIndex((element) => element.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const handleElementDragStart = (event, element) => {
    event.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedElementId(element.id);
    setDragState({
      id: element.id,
      offsetX: (event.clientX - rect.left) / zoom - (element.x || 0),
      offsetY: (event.clientY - rect.top) / zoom - (element.y || 0),
    });
    recordHistory();
  };

  const handleCanvasPointerMove = (event) => {
    if (!dragState || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    updateElement(dragState.id, {
      x: Math.max(0, (event.clientX - rect.left) / zoom - dragState.offsetX),
      y: Math.max(0, (event.clientY - rect.top) / zoom - dragState.offsetY),
    }, false);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      recordHistory();
      setCanvasElements((items) => [...items, {
        id: Date.now(),
        label: file.name,
        type: 'image',
        src: reader.result,
        x: 40,
        y: 40 + items.length * 30,
        visible: true,
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
                  <div style={editorStyles.dropdownItem} onClick={handleOpen}><Folder size={14} /> Open .mcp</div>
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
                  <div style={editorStyles.dropdownItem} onClick={() => { recordHistory(); setShowGrid((value) => !value); }}><Eye size={14} /> Toggle Grid</div>
                  <div style={editorStyles.dropdownItem} onClick={() => { recordHistory(); setZoom((value) => Math.min(1.5, value + 0.1)); }}>Zoom In (+)</div>
                  <div style={editorStyles.dropdownItem} onClick={() => { recordHistory(); setZoom((value) => Math.max(0.5, value - 0.1)); }}>Zoom Out (-)</div>
                  <div style={editorStyles.dropdownItem} onClick={() => { recordHistory(); setZoom(1); }}>Reset Zoom</div>
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
              <button style={editorStyles.drawerActionBtn} onClick={() => addTextElement('Heading', 32, '700')}>+ Add Heading</button>
              <button style={editorStyles.drawerActionBtn} onClick={() => addTextElement('Subheading', 24, '600')}>+ Add Subheading</button>
              <button style={editorStyles.drawerActionBtn} onClick={() => addTextElement('Body Text', 16)}>+ Add Body Text</button>
              {selectedElement?.type === 'text' && (
                <div style={editorStyles.formatPanel}>
                  <h4 style={editorStyles.formatTitle}>Format selected text</h4>
                  <label style={editorStyles.fieldLabel}>Font size
                    <input type="number" min="8" max="120" value={selectedElement.fontSize || 24} onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) })} style={editorStyles.fieldInput} />
                  </label>
                  <label style={editorStyles.fieldLabel}>Color
                    <input type="color" value={selectedElement.color || '#0f172a'} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })} style={editorStyles.colorInput} />
                  </label>
                  <div style={editorStyles.formatButtons}>
                    <button style={editorStyles.smallFormatButton} onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === '700' ? '400' : '700' })}><strong>B</strong></button>
                    <button style={editorStyles.smallFormatButton} onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}><em>I</em></button>
                    <button style={editorStyles.smallFormatButton} onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}>L</button>
                    <button style={editorStyles.smallFormatButton} onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}>C</button>
                    <button style={editorStyles.smallFormatButton} onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}>R</button>
                  </div>
                  <p style={editorStyles.drawerSubtitle}>Drag text directly on the canvas. Click the text to edit it.</p>
                </div>
              )}
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
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#ffffff' }} onClick={() => { recordHistory(); setCanvasBackground('#ffffff'); }}>White</button>
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#fef3c7' }} onClick={() => { recordHistory(); setCanvasBackground('#fef3c7'); }}>Warm</button>
              <button style={{ ...editorStyles.colorSwatch, backgroundColor: '#dbeafe' }} onClick={() => { recordHistory(); setCanvasBackground('#dbeafe'); }}>Blue</button>
            </div>
          )}

          {activeSidebarTool === 'layers' && (
            <div>
              <h3 style={editorStyles.drawerTitle}>Layers Manager</h3>
              <p style={editorStyles.drawerSubtitle}>{canvasElements.length} local element{canvasElements.length === 1 ? '' : 's'}</p>
              {[...canvasElements].reverse().map((element, reversedIndex) => (
                <div key={element.id} style={{ ...editorStyles.layerItem, ...(selectedElementId === element.id ? editorStyles.layerItemActive : {}) }} onClick={() => setSelectedElementId(element.id)}>
                  <input
                    value={element.label}
                    onChange={(event) => updateElement(element.id, { label: event.target.value })}
                    onClick={(event) => event.stopPropagation()}
                    style={editorStyles.layerNameInput}
                    aria-label={`Rename ${element.label}`}
                  />
                  <div style={editorStyles.layerControls}>
                    <button style={editorStyles.layerButton} onClick={(event) => { event.stopPropagation(); updateElement(element.id, { visible: element.visible === false }); }} title="Toggle visibility">{element.visible === false ? '◌' : '◉'}</button>
                    <button style={editorStyles.layerButton} onClick={(event) => { event.stopPropagation(); moveElement(element.id, 1); }} disabled={reversedIndex === canvasElements.length - 1} title="Move up">↑</button>
                    <button style={editorStyles.layerButton} onClick={(event) => { event.stopPropagation(); moveElement(element.id, -1); }} disabled={reversedIndex === 0} title="Move down">↓</button>
                    <button style={editorStyles.layerDeleteButton} onClick={(event) => { event.stopPropagation(); deleteElement(element.id); }} title="Delete layer">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 3. Central Canvas Area */}
        <main style={editorStyles.canvasArea} onMouseMove={handleCanvasPointerMove} onMouseUp={() => setDragState(null)}>
          <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <input ref={mcpInputRef} type="file" accept=".mcp,application/json" onChange={handleMcpInput} style={{ display: 'none' }} />
          <div 
            ref={canvasRef}
            onMouseDown={() => setSelectedElementId(null)}
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
            {canvasElements.map((element) => (
              element.visible === false ? null : element.type === 'image'
                ? <img key={element.id} src={element.src} alt={element.label} title={element.label} onMouseDown={(event) => handleElementDragStart(event, element)} style={{ ...editorStyles.canvasImage, left: element.x, top: element.y, position: 'absolute', outline: selectedElementId === element.id ? '2px solid #ec4899' : 'none' }} />
                : <div
                    key={element.id}
                    contentEditable={element.type === 'text'}
                    suppressContentEditableWarning
                    onBlur={(event) => element.type === 'text' && updateElement(element.id, { label: event.currentTarget.textContent })}
                    onMouseDown={(event) => handleElementDragStart(event, element)}
                    style={{
                      ...(element.type === 'shape' ? editorStyles.canvasShape : element.type === 'ai' ? editorStyles.canvasAi : editorStyles.canvasElement),
                      position: 'absolute', left: element.x, top: element.y,
                      fontSize: element.type === 'text' ? element.fontSize : undefined,
                      fontWeight: element.type === 'text' ? element.fontWeight : undefined,
                      fontStyle: element.type === 'text' ? element.fontStyle : undefined,
                      color: element.type === 'text' ? element.color : undefined,
                      textAlign: element.type === 'text' ? element.textAlign : undefined,
                      outline: selectedElementId === element.id ? '2px solid #ec4899' : 'none',
                    }}
                  >{element.label}</div>
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
  formatPanel: {
    marginTop: '18px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  formatTitle: {
    margin: '0 0 12px',
    fontSize: '12px',
    color: '#f8fafc',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '10px',
    color: '#94a3b8',
    fontSize: '11px',
  },
  fieldInput: {
    width: '64px',
    padding: '4px 6px',
    backgroundColor: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '4px',
    color: '#f8fafc',
  },
  colorInput: {
    width: '64px',
    height: '24px',
    padding: 0,
    border: 0,
    backgroundColor: 'transparent',
  },
  formatButtons: {
    display: 'flex',
    gap: '5px',
    marginBottom: '12px',
  },
  smallFormatButton: {
    width: '28px',
    height: '26px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '4px',
    color: '#f8fafc',
    cursor: 'pointer',
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
  layerItemActive: {
    border: '1px solid #ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  layerNameInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    border: 0,
    outline: 0,
    color: '#cbd5e1',
    fontSize: '12px',
    marginBottom: '7px',
  },
  layerControls: {
    display: 'flex',
    gap: '4px',
  },
  layerButton: {
    minWidth: '22px',
    height: '21px',
    padding: '0 4px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '0',
    borderRadius: '3px',
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  layerDeleteButton: {
    minWidth: '22px',
    height: '21px',
    padding: '0 4px',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    border: '0',
    borderRadius: '3px',
    color: '#f87171',
    cursor: 'pointer',
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
    position: 'relative',
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
