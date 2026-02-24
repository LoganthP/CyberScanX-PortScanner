import { motion } from 'framer-motion';
import { Shield, Zap, Target } from 'lucide-react';

export default function Hero() {
    return (
        <div className="relative glass-card p-10 overflow-hidden border-cyber-neon/20">
            <div className="scan-line animate-scan-line" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4"
                    >
                        <Zap className="text-cyber-neon w-4 h-4" />
                        <span className="text-cyber-neon text-sm font-bold tracking-widest uppercase">AI Attack Surface Intelligence</span>
                    </motion.div>

                    <h2 className="text-5xl font-extrabold tracking-tight mb-6">
                        CyberScan <span className="neon-text">X</span> <br />
                        <span className="text-3xl text-gray-500">Autonomous Vulnerability Discovery</span>
                    </h2>

                    <p className="text-lg text-gray-400 leading-relaxed mb-8">
                        Advanced multi-threaded port scanner with AI-driven vulnerability analysis
                        and real-time attack surface intelligence. Detect, analyze, and secure
                        your digital assets.
                    </p>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-cyber-neon/10 border border-cyber-neon/30 rounded-full">
                            <Shield className="text-cyber-neon w-4 h-4" />
                            <span className="text-cyber-neon text-sm font-bold">Encrypted Analysis</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-cyber-purple/10 border border-cyber-purple/30 rounded-full">
                            <Target className="text-cyber-purple w-4 h-4" />
                            <span className="text-cyber-purple text-sm font-bold">Deep Service Detection</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    {[
                        { label: 'Latency', value: '12ms', color: 'text-cyber-neon' },
                        { label: 'Concurrency', value: '500+', color: 'text-cyber-purple' },
                        { label: 'Uptime', value: '99.9%', color: 'text-cyber-cyan' },
                        { label: 'AI Accuracy', value: '94%', color: 'text-green-400' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            className="glass-card p-6 flex flex-col items-center justify-center min-w-[140px] border-white/5"
                        >
                            <span className="text-gray-500 text-xs font-bold uppercase mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
