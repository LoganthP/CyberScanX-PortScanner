import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Activity, ShieldAlert } from 'lucide-react';

interface AnalyticsProps {
    results: any[];
}

export default function AnalyticsDashboard({ results }: AnalyticsProps) {
    const serviceData = results.reduce((acc: any[], curr) => {
        const service = curr.service || 'Unknown';
        const existing = acc.find(a => a.name === service);
        if (existing) existing.value++;
        else acc.push({ name: service, value: 1 });
        return acc;
    }, []);

    const statusData = [
        { name: 'Open', value: results.filter(r => r.status === 'open').length },
        { name: 'Filtered', value: results.filter(r => r.status === 'filtered').length },
        { name: 'Closed', value: results.filter(r => r.status === 'closed').length },
    ].filter(s => s.value > 0);

    const COLORS = ['#06b6d4', '#a855f7', '#374151', '#ef4444'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border-white/5 bg-black/40">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Distribution</h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceData}>
                            <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', fontSize: '11px', color: '#e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                                itemStyle={{ color: '#06b6d4' }}
                                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" fill="url(#colorBar)" radius={[4, 4, 0, 0]} />
                            <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-card p-6 border-white/5 bg-black/40">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldAlert className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Node Status Matrix</h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', fontSize: '11px', color: '#e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                                itemStyle={{ color: '#e2e8f0', fontSize: '11px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
