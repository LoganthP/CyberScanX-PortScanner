import React, { useState } from 'react';
import { Search, Zap, Loader2, Square, Gauge, Timer } from 'lucide-react';

interface ScanProgress {
    scanned: number;
    total: number;
    percent: number;
    portsPerSec: number;
    elapsed: number;
}

interface ControlPanelProps {
    onStart: (config: any) => void;
    onAbort: () => void;
    isScanning: boolean;
    progress: ScanProgress | null;
}

// Preset scan types for quick access
const SCAN_PRESETS = {
    quick: { label: 'Quick (Top 100)', range: '1-100', type: 'quick' },
    standard: { label: 'Standard (1-1000)', range: '1-1000', type: 'standard' },
    full: { label: 'Full (1-65535)', range: '1-65535', type: 'full' },
    custom: { label: 'Custom Range', range: '', type: 'custom' },
};

export default function ControlPanel({ onStart, onAbort, isScanning, progress }: ControlPanelProps) {
    const [target, setTarget] = useState('');
    const [portRange, setPortRange] = useState('1-1000');
    const [concurrency, setConcurrency] = useState(150);
    const [scanPreset, setScanPreset] = useState('standard');

    const handlePresetChange = (preset: string) => {
        setScanPreset(preset);
        const p = SCAN_PRESETS[preset as keyof typeof SCAN_PRESETS];
        if (p && p.range) setPortRange(p.range);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!target) return;

        // Parse ports from range string
        let ports: number[] = [];
        if (portRange.includes('-')) {
            const [start, end] = portRange.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start < 1 || end > 65535 || start > end) return;
            for (let i = start; i <= end; i++) ports.push(i);
        } else {
            ports = portRange.split(',').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 65535);
        }

        if (ports.length === 0) return;

        onStart({
            target,
            ports,
            concurrency,
            timeout: 400,
            scanType: scanPreset,
        });
    };

    return (
        <div className="glass-card p-6 border-cyber-neon/20">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-cyber-neon/10 rounded-lg">
                    <Search className="text-cyber-neon w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Scan Controller</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Target Address</label>
                    <input
                        type="text"
                        placeholder="IP, domain, or URL (auto-sanitized)"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        disabled={isScanning}
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-cyber-neon placeholder:text-gray-700 focus:outline-none focus:border-cyber-neon/50 transition-colors disabled:opacity-50"
                    />
                </div>

                {/* Scan presets */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Scan Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SCAN_PRESETS).map(([key, preset]) => (
                            <button
                                key={key}
                                type="button"
                                disabled={isScanning}
                                onClick={() => handlePresetChange(key)}
                                className={`text-[10px] font-bold uppercase tracking-wider p-2.5 rounded border transition-all ${scanPreset === key
                                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/10'
                                    } disabled:opacity-50`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Port Range</label>
                        <input
                            type="text"
                            placeholder="1-1000 or 80,443"
                            value={portRange}
                            onChange={(e) => { setPortRange(e.target.value); setScanPreset('custom'); }}
                            disabled={isScanning}
                            className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-sm focus:outline-none focus:border-cyber-neon/50 transition-colors disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Concurrency</label>
                        <select
                            value={concurrency}
                            onChange={(e) => setConcurrency(Number(e.target.value))}
                            disabled={isScanning}
                            className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-sm focus:outline-none focus:border-cyber-neon/50 transition-colors cursor-pointer appearance-none disabled:opacity-50"
                        >
                            <option value={50}>Low (50)</option>
                            <option value={150}>Medium (150)</option>
                            <option value={300}>High (300)</option>
                            <option value={500}>Aggressive (500)</option>
                        </select>
                    </div>
                </div>

                {/* ── Progress Bar ── */}
                {isScanning && progress && (
                    <div className="space-y-2">
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full rounded-full transition-all duration-150 ease-linear"
                                style={{
                                    width: `${progress.percent}%`,
                                    background: 'linear-gradient(90deg, #06b6d4, #a855f7)',
                                    boxShadow: '0 0 12px rgba(6,182,212,0.5)',
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center gap-3">
                                <span className="text-cyan-500 flex items-center gap-1">
                                    <Gauge className="w-3 h-3" />
                                    {progress.portsPerSec} ports/s
                                </span>
                                <span className="text-purple-500 flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {progress.elapsed}s
                                </span>
                            </div>
                            <span className="text-gray-500">
                                {progress.scanned}/{progress.total} ({progress.percent}%)
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Action Buttons ── */}
                <div className="flex gap-3">
                    {isScanning ? (
                        <button
                            type="button"
                            onClick={onAbort}
                            className="w-full py-4 flex items-center justify-center gap-2 font-bold tracking-widest transition-all rounded-sm bg-red-600/80 text-white hover:bg-red-500 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                            <Square className="w-4 h-4" />
                            ABORT SCAN
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="w-full py-4 flex items-center justify-center gap-2 font-bold tracking-widest transition-all rounded-sm bg-cyber-neon text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95"
                        >
                            <Zap className="w-5 h-5" />
                            INITIATE SCAN
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
