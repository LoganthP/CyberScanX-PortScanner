import { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, History, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlPanel from './components/Scanner/ControlPanel';
import ResultsTable from './components/Scanner/ResultsTable';
import AIInsights from './components/AI/InsightsPanel';
import Terminal from './components/Dashboard/Terminal';
import Hero from './components/Dashboard/Hero';
import AnalyticsDashboard from './components/Dashboard/AnalyticsDashboard';
import WomenSafetyMode from './components/Safety/WomenSafetyMode';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000');

interface ScanProgress {
  scanned: number;
  total: number;
  percent: number;
  portsPerSec: number;
  elapsed: number;
}

export default function App() {
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showConsent, setShowConsent] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use ref for current scan ID to avoid stale closures
  const activeScanId = useRef<string | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/history');
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();

    // ── New high-performance event protocol ──

    socket.on('scan:start', (data) => {
      activeScanId.current = data.scanId;
      setLogs(prev => [...prev, `[ENGINE] Scan ${data.scanId.slice(0, 8)} initiated — ${data.totalPorts} ports queued`]);
    });

    socket.on('port:found', (data) => {
      const { result, aiInsight } = data;
      // Merge AI insight into result so UI can display it
      const enrichedResult = { ...result, aiInsight };
      setScanResults(prev => [...prev, enrichedResult]);

      const riskTag = aiInsight?.riskLevel || 'Low';
      setLogs(prev => [...prev,
      `[FOUND] Port ${result.port} → ${result.service} (${result.status}) [${riskTag}]${result.banner ? ' | Banner: ' + result.banner.slice(0, 60) : ''}`
      ]);
    });

    socket.on('scan:progress', (data: ScanProgress) => {
      setProgress(data);
    });

    socket.on('scan:complete', (data) => {
      setIsScanning(false);
      setProgress(null);
      activeScanId.current = null;
      setAiReport(data.aiReport);
      setLogs(prev => [...prev,
      `[COMPLETE] ${data.openPorts} open ports found / ${data.total} scanned in ${data.elapsed}s`
      ]);
      fetchHistory();
    });

    socket.on('scan:aborted', (data) => {
      setIsScanning(false);
      setProgress(null);
      activeScanId.current = null;
      setLogs(prev => [...prev, `[ABORT] Scan ${data.scanId.slice(0, 8)} cancelled by operator`]);
    });

    socket.on('scan:error', (data) => {
      setIsScanning(false);
      setProgress(null);
      setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
    });

    return () => {
      socket.off('scan:start');
      socket.off('port:found');
      socket.off('scan:progress');
      socket.off('scan:complete');
      socket.off('scan:aborted');
      socket.off('scan:error');
    };
  }, []);

  const handleStartScan = (config: any) => {
    setScanResults([]);
    setAiReport(null);
    setProgress(null);
    setSelectedScanId(null);
    setIsScanning(true);
    setLogs([`[INFO] Initializing scan for ${config.target}...`]);
    socket.emit('start-scan', config);
  };

  const handleAbortScan = () => {
    socket.emit('abort-scan');
    setLogs(prev => [...prev, `[INFO] Abort signal sent...`]);
  };

  const selectHistoryScan = (scan: any) => {
    setSelectedScanId(scan.id);
    setScanResults(scan.results);
    setAiReport(scan.aiReport);
    setProgress(null);
    setLogs([`[HISTORY] Loaded scan results for ${scan.target} from ${new Date(scan.startedAt).toLocaleString()}`]);
  };

  const handleDeleteScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the scan when clicking delete
    socket.emit('delete-scan', id);
    setHistory(prev => prev.filter(s => s.id !== id));
    if (selectedScanId === id) {
      setSelectedScanId(null);
      setScanResults([]);
      setAiReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200 cyber-grid-bg selection:bg-cyan-500 selection:text-black font-['Inter',_sans-serif]">
      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="glass-card max-w-md p-8 border-cyan-500/30">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-cyan-500 w-8 h-8" />
                <h2 className="text-2xl font-bold text-cyan-500 tracking-tight uppercase">Ethical Policy</h2>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                This platform is for authorized security research only.
                Unauthorized scanning of infrastructure is a violation of international law.
                By clicking proceed, you assume full responsibility for your actions.
              </p>
              <button
                onClick={() => setShowConsent(false)}
                className="w-full py-4 bg-cyan-600 text-white font-black rounded hover:bg-cyan-500 transition-all active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-[0.2em]"
              >
                Accept Protocols
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-black/40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Shield className="w-8 h-8 text-cyan-500 group-hover:scale-110 transition-transform cursor-pointer" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Cyber<span className="text-cyan-500">Scan</span> <span className="text-purple-500">X</span>
            </h1>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]'}`} />
              <span className={isScanning ? 'text-yellow-500' : 'text-cyan-500'}>
                {isScanning ? 'Scanning' : 'Node Active'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <button
                onClick={() => { setShowSearch(s => !s); setShowActivity(false); setSearchQuery(''); }}
                className={`p-1.5 rounded transition-all ${showSearch ? 'text-cyan-500 bg-cyan-500/10' : 'hover:text-cyan-500'}`}
                title="Search ports & services"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowActivity(a => !a); setShowSearch(false); }}
                className={`p-1.5 rounded transition-all ${showActivity ? 'text-cyan-500 bg-cyan-500/10' : 'hover:text-cyan-500'}`}
                title="Scan activity"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search Panel ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sticky top-[57px] z-30 w-full bg-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
          >
            <div className="max-w-[1600px] mx-auto px-6 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-4 h-4 text-cyan-500 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search ports, services, banners..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setShowSearch(false)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                />
                <kbd
                  onClick={() => setShowSearch(false)}
                  className="text-[9px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5 cursor-pointer hover:border-white/20"
                >ESC</kbd>
              </div>
              {searchQuery.trim() && (
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {scanResults
                    .filter(r =>
                      String(r.port).includes(searchQuery) ||
                      (r.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (r.banner || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((r, i) => (
                      <div key={i} className="flex items-center gap-4 px-3 py-2 rounded bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                        <span className="font-mono text-cyan-400 font-bold text-sm w-16 shrink-0">{r.port}</span>
                        <span className="text-gray-300 text-sm flex-1">{r.service || 'Unknown'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${r.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                          }`}>{r.status}</span>
                        {r.banner && <span className="text-[10px] text-gray-500 truncate max-w-[200px]">{r.banner}</span>}
                      </div>
                    ))}
                  {scanResults.filter(r =>
                    String(r.port).includes(searchQuery) ||
                    (r.service || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                      <p className="text-xs text-gray-600 italic py-3 text-center">No results matching "{searchQuery}"</p>
                    )}
                </div>
              )}
              {!searchQuery.trim() && (
                <p className="text-xs text-gray-600 italic">
                  {scanResults.length > 0 ? `${scanResults.length} port results available to search` : 'Run a scan first to search results'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Activity Panel ── */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sticky top-[57px] z-30 w-full bg-black/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
          >
            <div className="max-w-[1600px] mx-auto px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Scan Activity</span>
                </div>
                <button onClick={() => setShowActivity(false)} className="text-[9px] text-gray-600 border border-white/10 rounded px-1.5 py-0.5 hover:border-white/20">ESC</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {[
                  { label: 'Scans Run', value: history.length, color: 'text-cyan-400' },
                  { label: 'Open Ports', value: scanResults.filter(r => r.status === 'open').length, color: 'text-green-400' },
                  { label: 'Services', value: [...new Set(scanResults.map(r => r.service).filter(Boolean))].length, color: 'text-purple-400' },
                  { label: 'Risk Score', value: aiReport ? `${aiReport.riskScore}/100` : '—', color: 'text-orange-400' },
                  { label: 'Status', value: isScanning ? 'Scanning' : 'Idle', color: isScanning ? 'text-yellow-400' : 'text-gray-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                    <span className={`text-lg font-black block ${stat.color}`}>{stat.value}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                ))}
              </div>
              {history.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Recent Scans</p>
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {history.slice(0, 8).map((scan, i) => (
                      <div key={i} className="shrink-0 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-xs">
                        <span className="text-cyan-400 font-bold block">{scan.target}</span>
                        <span className="text-gray-500">{scan.results?.length || 0} open • {new Date(scan.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {history.length === 0 && (
                <p className="text-xs text-gray-600 italic">No scan history yet. Run a scan to see activity here.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <Hero />

        <div className="flex flex-col lg:flex-row items-stretch gap-6 mt-8">
          {/* ── Left Sidebar ── */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <ControlPanel
              onStart={handleStartScan}
              onAbort={handleAbortScan}
              isScanning={isScanning}
              progress={progress}
            />

            <div className="glass-card p-6 border-white/5 bg-black/20 flex-1 flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History className="w-3 h-3" />
                  Fleet Intelligence
                </h3>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {history.length === 0 && <p className="text-xs text-gray-600 italic py-4">Intel history is empty.</p>}
                {history.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => selectHistoryScan(scan)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 group relative ${selectedScanId === scan.id
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                          {scan.target}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(scan.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-purple-500 px-1.5 py-0.5 bg-purple-500/10 rounded uppercase">
                          {scan.scanType}
                        </span>
                        <div
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-[10px] text-cyan-600/70">{scan.results?.length || 0} nodes discovered</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <AnalyticsDashboard results={scanResults} />
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ResultsTable results={scanResults} />
              <AIInsights report={aiReport} loading={isScanning} />
            </div>
          </div>
        </div>

        {/* ── Full-width Console ── */}
        <div className="mt-8">
          <Terminal logs={logs} />
        </div>

        <WomenSafetyMode onPrivacyScan={handleStartScan} isScanning={isScanning} scanResults={scanResults} />
      </main>
    </div>
  );
}
