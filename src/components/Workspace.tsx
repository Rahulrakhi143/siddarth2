import { useState, useEffect, useRef, useCallback } from 'react';
import { Panel } from './Panel';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { AIAgent } from './AIAgent';
import { Terminal } from './Terminal';
import { Preview } from './Preview';
import { StatusHUD } from './StatusHUD';
import { 
  Play, Square, RotateCcw, Eye, Maximize2, Grid3x3, 
  Settings, Zap, Minimize2, Split, Layout, 
  ChevronLeft, ChevronRight, Menu, X, 
  Bell, Clock, Battery, Wifi, Cloud
} from 'lucide-react';

interface PanelLayout {
  id: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  isCollapsed: boolean;
  isFullscreen: boolean;
}

type LayoutMode = 'default' | 'code' | 'terminal' | 'preview' | 'ai' | 'custom';

export const Workspace = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('editor');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('default');
  const [isResizing, setIsResizing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Build Complete', message: 'Project built successfully', time: '2 min ago', unread: true },
    { id: 2, title: 'AI Suggestion', message: 'Optimization available for main.js', time: '5 min ago', unread: true },
    { id: 3, title: 'System Update', message: 'HENU OS v1.2 available', time: '1 hour ago', unread: false },
  ]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<{ type: string; startX?: number; startY?: number; startWidth?: number; startHeight?: number }>({ type: '' });

  // Panel layout states
  const [panelLayouts, setPanelLayouts] = useState({
    sidebar: { width: 300, isResizing: false },
    terminal: { height: 250, isResizing: false },
    rightPanel: { width: 380, isResizing: false },
  });

  // Auto-adjust layout on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 1024) {
        setPanelLayouts(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, width: 240 },
          rightPanel: { ...prev.rightPanel, width: 320 },
        }));
      } else if (width < 1280) {
        setPanelLayouts(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, width: 280 },
          rightPanel: { ...prev.rightPanel, width: 350 },
        }));
      } else {
        setPanelLayouts(prev => ({
          ...prev,
          sidebar: { ...prev.sidebar, width: 300 },
          rightPanel: { ...prev.rightPanel, width: 380 },
        }));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // Handle resizing
    if (isResizing && resizeHandleRef.current.type) {
      e.preventDefault();
      
      const { type, startX, startY, startWidth, startHeight } = resizeHandleRef.current;
      
      switch (type) {
        case 'sidebar':
          if (startX !== undefined && startWidth !== undefined) {
            const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
            setPanelLayouts(prev => ({
              ...prev,
              sidebar: { ...prev.sidebar, width: newWidth }
            }));
          }
          break;
          
        case 'terminal':
          if (startY !== undefined && startHeight !== undefined) {
            const newHeight = Math.max(150, Math.min(500, startHeight - (e.clientY - startY)));
            setPanelLayouts(prev => ({
              ...prev,
              terminal: { ...prev.terminal, height: newHeight }
            }));
          }
          break;
          
        case 'rightPanel':
          if (startX !== undefined && startWidth !== undefined) {
            const newWidth = Math.max(250, Math.min(500, startWidth - (e.clientX - startX)));
            setPanelLayouts(prev => ({
              ...prev,
              rightPanel: { ...prev.rightPanel, width: newWidth }
            }));
          }
          break;
      }
    }
  };

  const startResizing = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeHandleRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panelLayouts[type as keyof typeof panelLayouts].width || panelLayouts[type as keyof typeof panelLayouts].height,
      startHeight: panelLayouts[type as keyof typeof panelLayouts].height,
    };
    
    document.body.style.cursor = type === 'terminal' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    setIsResizing(false);
    resizeHandleRef.current = { type: '' };
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  useEffect(() => {
    const handleMouseUp = () => stopResizing();
    const handleMouseLeave = () => stopResizing();

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
    
    switch (mode) {
      case 'code':
        setPanelLayouts({
          sidebar: { width: 300, isResizing: false },
          terminal: { height: 0, isResizing: false },
          rightPanel: { width: 0, isResizing: false },
        });
        setSidebarCollapsed(false);
        setTerminalCollapsed(true);
        setRightPanelCollapsed(true);
        break;
        
      case 'terminal':
        setPanelLayouts({
          sidebar: { width: 0, isResizing: false },
          terminal: { height: 500, isResizing: false },
          rightPanel: { width: 0, isResizing: false },
        });
        setSidebarCollapsed(true);
        setTerminalCollapsed(false);
        setRightPanelCollapsed(true);
        break;
        
      case 'preview':
        setPanelLayouts({
          sidebar: { width: 0, isResizing: false },
          terminal: { height: 0, isResizing: false },
          rightPanel: { width: 800, isResizing: false },
        });
        setShowPreview(true);
        setSidebarCollapsed(true);
        setTerminalCollapsed(true);
        setRightPanelCollapsed(false);
        break;
        
      case 'ai':
        setPanelLayouts({
          sidebar: { width: 0, isResizing: false },
          terminal: { height: 0, isResizing: false },
          rightPanel: { width: 500, isResizing: false },
        });
        setShowPreview(false);
        setSidebarCollapsed(true);
        setTerminalCollapsed(true);
        setRightPanelCollapsed(false);
        break;
        
      default:
        setPanelLayouts({
          sidebar: { width: 300, isResizing: false },
          terminal: { height: 250, isResizing: false },
          rightPanel: { width: 380, isResizing: false },
        });
        setSidebarCollapsed(false);
        setTerminalCollapsed(false);
        setRightPanelCollapsed(false);
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Morning';
    if (hour < 18) return '☀️ Afternoon';
    return '🌙 Evening';
  };

  const handleRunCode = () => {
    setIsRunning(true);
    
    // Simulate running code
    setTimeout(() => {
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Code Executed',
        message: 'Your code ran successfully with 0 errors',
        time: 'Just now',
        unread: true
      }, ...prev]);
    }, 1000);
    
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-black overflow-hidden relative select-none"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/10 to-black"></div>
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-red-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`,
              boxShadow: '0 0 20px 2px rgba(239, 68, 68, 0.3)'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Top Control Bar */}
        <div className="control-bar backdrop-blur-xl bg-gradient-to-r from-black/95 via-red-950/20 to-black/95 border-b border-red-900/30 px-4 py-2 flex items-center justify-between shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <div className="flex items-center space-x-4">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] group-hover:shadow-[0_0_40px_rgba(239,68,68,0.8)] transition-all duration-300">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div>
                <div className="text-red-400 font-bold tracking-wider text-lg">HENU OS</div>
                <div className="text-gray-500 text-xs font-mono tracking-wider">{getTimeOfDay()} • v2.1.0</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleLayoutChange('default')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${layoutMode === 'default' ? 'bg-red-900/40 text-red-300' : 'bg-black/40 text-gray-400 hover:text-red-300 hover:bg-red-900/20'}`}
              >
                <Layout size={16} className="inline mr-2" />
                Default
              </button>
              <button
                onClick={() => handleLayoutChange('code')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${layoutMode === 'code' ? 'bg-red-900/40 text-red-300' : 'bg-black/40 text-gray-400 hover:text-red-300 hover:bg-red-900/20'}`}
              >
                <Split size={16} className="inline mr-2" />
                Code
              </button>
              <button
                onClick={() => handleLayoutChange('terminal')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${layoutMode === 'terminal' ? 'bg-red-900/40 text-red-300' : 'bg-black/40 text-gray-400 hover:text-red-300 hover:bg-red-900/20'}`}
              >
                <Grid3x3 size={16} className="inline mr-2" />
                Terminal
              </button>
            </div>
          </div>

          {/* System Controls */}
          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-black/40 rounded-lg border border-green-900/30">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-green-400 font-mono">{isRunning ? 'RUNNING' : 'READY'}</span>
              </div>
              
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-black/40 rounded-lg border border-blue-900/30">
                <Cloud size={12} className="text-blue-400" />
                <span className="text-blue-400 font-mono">CLOUD</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-1 bg-black/60 rounded-xl p-1 border border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <button
                onClick={handleRunCode}
                className={`p-2 rounded-lg transition-all duration-300 ${isRunning ? 'bg-yellow-900/30 text-yellow-300' : 'hover:bg-red-900/30 text-red-400 hover:text-red-300'} hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]`}
                title={isRunning ? 'Stop' : 'Run'}
              >
                {isRunning ? (
                  <div className="flex items-center">
                    <Square size={16} className="animate-pulse" />
                    <span className="ml-2 text-xs">STOP</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Play size={16} />
                    <span className="ml-2 text-xs">RUN</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => handleLayoutChange('ai')}
                className="p-2 hover:bg-purple-900/30 rounded-lg transition-all text-purple-400 hover:text-purple-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                title="AI Assistant"
              >
                <Zap size={16} />
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-lg transition-all ${showPreview ? 'bg-red-900/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-red-400 hover:bg-red-900/30'}`}
                title="Preview"
              >
                <Eye size={16} />
              </button>
              
              <div className="w-px h-5 bg-red-900/30 mx-1"></div>
              
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-red-900/30 rounded-lg transition-all text-red-400 hover:text-red-300 relative"
                  title="Notifications"
                >
                  <Bell size={16} />
                  {notifications.filter(n => n.unread).length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-xs">
                      {notifications.filter(n => n.unread).length}
                    </div>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-red-900/30 py-2 z-50">
                    <div className="px-4 py-3 border-b border-red-900/20 flex justify-between items-center">
                      <h3 className="text-red-400 font-bold">Notifications</h3>
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-red-900/10 transition-colors ${notification.unread ? 'bg-red-900/5' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-200">{notification.title}</div>
                              <div className="text-sm text-gray-400 mt-1">{notification.message}</div>
                            </div>
                            <div className="text-xs text-gray-500">{notification.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-red-900/30 rounded-lg transition-all text-red-400 hover:text-red-300"
                title="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
              
              <button
                onClick={() => handleLayoutChange('default')}
                className="p-2 hover:bg-red-900/30 rounded-lg transition-all text-red-400 hover:text-red-300"
                title="Reset Layout"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* System Info */}
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Battery size={12} />
                <span>94%</span>
              </div>
              <Wifi size={12} />
            </div>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 flex overflow-hidden p-2 relative">
          {/* Left Sidebar */}
          {!sidebarCollapsed && (
            <>
              <div
                ref={sidebarRef}
                className="border border-red-900/20 rounded-xl overflow-hidden hover-lift transition-all duration-300"
                style={{ width: `${panelLayouts.sidebar.width}px` }}
              >
                <Panel 
                  title="FILE SYSTEM" 
                  className="h-full rounded-none"
                  onCollapse={() => setSidebarCollapsed(true)}
                >
                  <FileExplorer />
                </Panel>
              </div>
              
              {/* Resize Handle for Sidebar */}
              <div
                className="w-1 cursor-col-resize hover:bg-red-500/50 active:bg-red-500 transition-colors ml-1 mr-1 rounded"
                onMouseDown={(e) => startResizing('sidebar', e)}
              />
            </>
          )}
          
          {/* Collapsed Sidebar Button */}
          {sidebarCollapsed && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 bg-black/80 backdrop-blur-sm border border-red-900/30 rounded-r-lg hover:bg-red-900/30 transition-all hover:translate-x-1"
              >
                <ChevronRight size={20} className="text-red-400" />
              </button>
            </div>
          )}

          {/* Middle Area - Code Editor & Terminal */}
          <div className="flex-1 flex flex-col" style={{
            marginLeft: sidebarCollapsed ? 0 : '4px',
            marginRight: rightPanelCollapsed ? 0 : '4px'
          }}>
            {/* Code Editor */}
            <div
              className="flex-1 border border-red-900/20 rounded-xl overflow-hidden hover-lift transition-all duration-300 mb-2"
              style={{ 
                height: terminalCollapsed ? '100%' : `calc(100% - ${panelLayouts.terminal.height}px - 8px)`,
                opacity: terminalCollapsed ? 1 : 0.98
              }}
            >
              <Panel 
                title="CODE EDITOR" 
                className="h-full rounded-none"
                isActive={activeTab === 'editor'}
                onClick={() => setActiveTab('editor')}
              >
                <CodeEditor />
              </Panel>
            </div>

            {/* Terminal */}
            {!terminalCollapsed && (
              <>
                {/* Resize Handle for Terminal */}
                <div
                  className="h-1 cursor-row-resize hover:bg-red-500/50 active:bg-red-500 transition-colors my-1 rounded"
                  onMouseDown={(e) => startResizing('terminal', e)}
                />
                
                <div
                  ref={terminalRef}
                  className="border border-red-900/20 rounded-xl overflow-hidden hover-lift transition-all duration-300"
                  style={{ height: `${panelLayouts.terminal.height}px` }}
                >
                  <Panel 
                    title="TERMINAL" 
                    className="h-full rounded-none"
                    onCollapse={() => setTerminalCollapsed(true)}
                    isActive={activeTab === 'terminal'}
                    onClick={() => setActiveTab('terminal')}
                  >
                    <Terminal />
                  </Panel>
                </div>
              </>
            )}
            
            {/* Collapsed Terminal Button */}
            {terminalCollapsed && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <button
                  onClick={() => setTerminalCollapsed(false)}
                  className="p-2 bg-black/80 backdrop-blur-sm border border-red-900/30 rounded-t-lg hover:bg-red-900/30 transition-all hover:-translate-y-1"
                >
                  <ChevronLeft size={20} className="text-red-400 rotate-90" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          {!rightPanelCollapsed && (
            <>
              {/* Resize Handle for Right Panel */}
              <div
                className="w-1 cursor-col-resize hover:bg-red-500/50 active:bg-red-500 transition-colors ml-1 mr-1 rounded"
                onMouseDown={(e) => startResizing('rightPanel', e)}
              />
              
              <div
                ref={rightPanelRef}
                className="border border-red-900/20 rounded-xl overflow-hidden hover-lift transition-all duration-300"
                style={{ width: `${panelLayouts.rightPanel.width}px` }}
              >
                <Panel 
                  title={showPreview ? "LIVE PREVIEW" : "AI AGENT"} 
                  className="h-full rounded-none"
                  onCollapse={() => setRightPanelCollapsed(true)}
                >
                  {showPreview ? <Preview /> : <AIAgent />}
                </Panel>
              </div>
            </>
          )}
          
          {/* Collapsed Right Panel Button */}
          {rightPanelCollapsed && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
              <button
                onClick={() => setRightPanelCollapsed(false)}
                className="p-2 bg-black/80 backdrop-blur-sm border border-red-900/30 rounded-l-lg hover:bg-red-900/30 transition-all hover:-translate-x-1"
              >
                <ChevronLeft size={20} className="text-red-400" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border-t border-red-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="text-gray-400 font-mono">
              <span className="text-red-400">Mode:</span> {layoutMode.toUpperCase()}
            </div>
            <div className="text-gray-400 font-mono">
              <span className="text-green-400">Panel:</span> {!sidebarCollapsed ? '📁' : '❌'} {!terminalCollapsed ? '💻' : '❌'} {!rightPanelCollapsed ? (showPreview ? '👁️' : '🤖') : '❌'}
            </div>
            <div className="text-gray-400 font-mono">
              <span className="text-blue-400">Cursor:</span> {mousePos.x}, {mousePos.y}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-500">System Normal</span>
            </div>
            
            <div className="h-4 w-px bg-red-900/30"></div>
            
            <div className="flex items-center space-x-1">
              <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <span className="text-gray-500">75% CPU</span>
            </div>
          </div>
        </div>
      </div>

      <StatusHUD />

      <style>{`
        .panel-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .panel-3d:hover {
          transform: translateZ(15px);
        }
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hover-lift:hover {
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.15), 0 0 30px rgba(239, 68, 68, 0.1);
          transform: translateY(-2px);
        }
        .control-bar {
          position: relative;
          backdrop-filter: blur(20px);
        }
        .control-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.5), transparent);
          animation: scan-line 3s linear infinite;
        }
        
        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes gridMove {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(50px) translateY(50px); }
        }
        
        .resize-handle {
          transition: background-color 0.2s;
        }
        
        .resize-handle:hover {
          background-color: rgba(239, 68, 68, 0.5);
        }
        
        .resize-handle:active {
          background-color: rgba(239, 68, 68, 0.8);
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.7);
        }
      `}</style>
    </div>
  );
};