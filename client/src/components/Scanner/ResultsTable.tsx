import { ShieldCheck } from 'lucide-react';

interface ResultsTableProps {
    results: any[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
    return (
        <div className="glass-card flex flex-col flex-1 min-h-[420px] border-cyber-neon/10 overflow-hidden">
            <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    Port Intelligence Feed
                    <span className="text-xs font-mono bg-cyber-neon/10 text-cyber-neon px-2 py-0.5 rounded-full border border-cyber-neon/20">
                        {results.length} DISCOVERED
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0A0F1C]/90 backdrop-blur-sm z-10 border-b border-white/5">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <th className="px-6 py-4">Port</th>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Risk</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {results.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-600 italic">
                                    No scan data available. Start a scan to begin discovery.
                                </td>
                            </tr>
                        )}
                        {results.map((res, i) => (
                            <tr key={i} className="group hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4 font-mono">
                                    <span className="text-cyber-neon group-hover:neon-text transition-all">{res.port}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-gray-300">{res.service}</span>
                                        <span className="text-[10px] text-gray-600 truncate max-w-[150px]">
                                            {res.banner || 'No banner captured'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border
                    ${res.status === 'open'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${res.status === 'open' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                                        {res.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider
                                        ${res.aiInsight?.riskLevel === 'Critical' ? 'text-red-500' :
                                            res.aiInsight?.riskLevel === 'High' ? 'text-orange-500' :
                                                res.aiInsight?.riskLevel === 'Medium' ? 'text-yellow-500' :
                                                    res.aiInsight?.riskLevel === 'Low' ? 'text-cyan-500' :
                                                        'text-green-500'}`}>
                                        <ShieldCheck className={`w-3.5 h-3.5 ${res.aiInsight?.riskLevel === 'Critical' ? 'animate-pulse' : ''}`} />
                                        <span>{res.aiInsight?.riskLevel || 'Safe'}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
