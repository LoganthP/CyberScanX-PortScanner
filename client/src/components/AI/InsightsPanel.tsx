import { motion } from 'framer-motion';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AIInsightsProps {
    report: any;
    loading: boolean;
}

export default function AIInsights({ report, loading }: AIInsightsProps) {
    if (loading && !report) {
        return (
            <div className="glass-card flex flex-col items-center justify-center p-12 flex-1 min-h-[420px] border-cyber-neon/10">
                <Loader2 className="w-12 h-12 text-cyber-neon animate-spin mb-6" />
                <h3 className="text-xl font-bold neon-text mb-2">AI ENGINE ACTIVE</h3>
                <p className="text-gray-500 text-center max-w-xs leading-relaxed">
                    Analyzing service fingerprints and correlating results with vulnerability database...
                </p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="glass-card flex flex-col items-center justify-center p-12 flex-1 min-h-[420px] border-cyber-neon/10 grayscale opacity-50">
                <Sparkles className="w-12 h-12 text-gray-500 mb-6" />
                <h3 className="text-xl font-bold mb-2">Security Intelligence</h3>
                <p className="text-gray-500 text-center max-w-xs">
                    Complete a scan to generate AI-powered security insights and vulnerability reports.
                </p>
            </div>
        );
    }

    const chartData = [
        { name: 'Critical', value: report.vulnerabilities.filter((v: any) => v.severity === 'Critical').length, color: '#FF0055' },
        { name: 'High', value: report.vulnerabilities.filter((v: any) => v.severity === 'High').length, color: '#FF7A00' },
        { name: 'Medium', value: report.vulnerabilities.filter((v: any) => v.severity === 'Medium').length, color: '#BC00FF' },
        { name: 'Low', value: report.vulnerabilities.filter((v: any) => v.severity === 'Low').length, color: '#00F3FF' },
    ].filter(d => d.value > 0);

    return (
        <div className="glass-card flex flex-col flex-1 min-h-[420px] border-cyber-neon/10 overflow-hidden">
            <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-cyber-neon w-5 h-5" />
                    <h3 className="text-lg font-bold">Security Insights</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase">Risk Score</span>
                    <span className={`text-xl font-black ${report.riskScore > 70 ? 'text-red-500' : 'text-cyber-neon'}`}>
                        {report.riskScore}/100
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="h-[200px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#0A0F1C', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '4px' }}
                                itemStyle={{ color: '#E2E8F0', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-400 italic mb-6 leading-relaxed bg-white/5 p-4 border-l-2 border-cyber-neon rounded-r-lg">
                        "{report.summary}"
                    </p>

                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Vulnerability Report</h4>
                    {report.vulnerabilities.map((vuln: any, i: number) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="p-4 bg-white/5 border border-white/5 rounded-lg group hover:border-cyber-neon/20 transition-all"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                  ${vuln.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                                        vuln.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                            vuln.severity === 'Medium' ? 'bg-purple-500/20 text-purple-500' :
                                                'bg-cyan-500/20 text-cyan-500'}
                `}>
                                    {vuln.severity} Severity
                                </span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{vuln.title}</h5>
                            <p className="text-xs text-gray-400 mb-3">{vuln.description}</p>
                            <div className="flex items-start gap-2 text-xs text-cyber-neon bg-cyber-neon/5 p-2 rounded">
                                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                                <span><strong className="uppercase">Remediation:</strong> {vuln.remediation}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
