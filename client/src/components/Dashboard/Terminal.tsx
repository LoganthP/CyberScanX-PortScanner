import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronRight } from 'lucide-react';

interface TerminalProps {
    logs: string[];
}

export default function Terminal({ logs }: TerminalProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="glass-card flex flex-col h-[300px] border-cyber-neon/10 overflow-hidden">
            <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-cyber-neon" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-0.5">Console Output</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar bg-black/20"
            >
                {logs.length === 0 && (
                    <div className="text-gray-600 italic">Waiting for scan initialization...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="mb-1 flex gap-2">
                        <span className="text-cyber-neon/50 opacity-50 shrink-0">
                            {new Date().toLocaleTimeString([], { hour12: false })}
                        </span>
                        <ChevronRight className="w-3 h-3 mt-1 text-cyber-purple shrink-0" />
                        <span className={
                            log.includes('[FOUND]') ? 'text-cyber-neon' :
                                log.includes('[COMPLETE]') ? 'text-green-400 font-bold' :
                                    'text-gray-400'
                        }>
                            {log}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
