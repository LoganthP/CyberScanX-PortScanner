import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ShieldAlert } from 'lucide-react';

interface NodeStatusProps {
    results: any[];
}

const COLORS = ['#06b6d4', '#a855f7', '#374151', '#ef4444'];

export default function NodeStatusMatrix({ results }: NodeStatusProps) {
    const statusData = [
        { name: 'Open', value: results.filter(r => r.status === 'open').length },
        { name: 'Filtered', value: results.filter(r => r.status === 'filtered').length },
        { name: 'Closed', value: results.filter(r => r.status === 'closed').length },
    ].filter(s => s.value > 0);

    return (
        <div className="glass-card p-5 border-white/5 bg-black/40 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Node Status Matrix</h3>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                    { label: 'Open', count: results.filter(r => r.status === 'open').length, color: 'text-cyan-400' },
                    { label: 'Filtered', count: results.filter(r => r.status === 'filtered').length, color: 'text-purple-400' },
                    { label: 'Total', count: results.length, color: 'text-gray-300' },
                ].map((s, i) => (
                    <div key={i} className="bg-black/40 rounded-lg p-2.5 text-center border border-white/5">
                        <span className={`text-lg font-black block ${s.color}`}>{s.count}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Donut chart */}
            <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData.length > 0 ? statusData : [{ name: 'No Data', value: 1 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={statusData.length > 1 ? 5 : 0}
                            dataKey="value"
                        >
                            {(statusData.length > 0 ? statusData : [{ name: 'No Data', value: 1 }]).map((_entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={statusData.length > 0 ? COLORS[index % COLORS.length] : '#1f2937'}
                                    stroke="none"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                        />
                        <Legend verticalAlign="bottom" height={28} iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
