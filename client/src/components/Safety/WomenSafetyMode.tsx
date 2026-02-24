import { useState } from 'react';
import { Shield, Eye, AlertTriangle, Heart, Smartphone, Globe, Loader2, CheckCircle2 } from 'lucide-react';

// Surveillance & IoT ports that indicate cameras, smart devices, or insecure services
const PRIVACY_PORTS = [
    23,    // Telnet (insecure remote access)
    80,    // HTTP (web admin panels)
    81,    // Alternate HTTP (many IP cameras)
    443,   // HTTPS
    554,   // RTSP (IP cameras, video streams)
    1883,  // MQTT (IoT messaging)
    1900,  // UPnP/SSDP (device discovery)
    3389,  // RDP (remote desktop)
    5000,  // UPnP / Synology NAS
    5353,  // mDNS (Bonjour)
    5900,  // VNC (remote screen)
    8080,  // HTTP proxy / camera web UI
    8443,  // HTTPS alt
    8554,  // RTSP alt (cameras)
    8888,  // HTTP alt (IoT devices)
    9100,  // Printer
    37777, // Dahua cameras
    49152, // UPnP
];

interface WomenSafetyModeProps {
    onPrivacyScan: (config: any) => void;
    isScanning: boolean;
    scanResults: any[];
}

export default function WomenSafetyMode({ onPrivacyScan, isScanning, scanResults }: WomenSafetyModeProps) {
    const [scanStarted, setScanStarted] = useState(false);

    const safetyTips = [
        { icon: <Globe className="w-4 h-4" />, text: "Use a VPN when connected to public WiFi networks." },
        { icon: <Smartphone className="w-4 h-4" />, text: "Disable Bluetooth 'Discoverable' mode in crowded areas." },
        { icon: <Shield className="w-4 h-4" />, text: "Ensure your home router admin panel is not exposed to WAN." },
        { icon: <Eye className="w-4 h-4" />, text: "Check for hidden IoT cameras if you see unknown active ports like 554 (RTSP)." },
    ];

    const handlePrivacyScan = () => {
        setScanStarted(true);
        onPrivacyScan({
            target: '192.168.1.1',  // Default to common gateway — user can change in ControlPanel
            ports: PRIVACY_PORTS,
            concurrency: 50,
            timeout: 500,
            scanType: 'privacy',
        });
    };

    // Calculate live safety indicators from scan results
    const openPorts = scanStarted ? scanResults.filter(r => r.status === 'open') : [];
    const hasCameras = openPorts.some(r => [554, 8554, 81, 37777].includes(r.port));
    const hasInsecureAccess = openPorts.some(r => [23, 3389, 5900].includes(r.port));
    const hasIoT = openPorts.some(r => [1883, 1900, 5353, 49152].includes(r.port));
    const hasOpenWeb = openPorts.some(r => [80, 8080, 8888].includes(r.port));

    // Dynamic safety score based on scan results
    let safetyScore = 100;
    if (hasCameras) safetyScore -= 40;
    if (hasInsecureAccess) safetyScore -= 30;
    if (hasIoT) safetyScore -= 15;
    if (hasOpenWeb) safetyScore -= 10;
    safetyScore = Math.max(0, safetyScore);

    const scoreLabel = safetyScore >= 80 ? 'GOOD' : safetyScore >= 50 ? 'FAIR' : safetyScore >= 20 ? 'AT RISK' : 'CRITICAL';
    const scoreColor = safetyScore >= 80 ? 'text-green-400' : safetyScore >= 50 ? 'text-pink-400' : 'text-red-500';

    const indicators = [
        {
            label: 'Network Privacy',
            status: hasOpenWeb ? 'EXPOSED' : (scanStarted && !isScanning) ? 'PROTECTED' : 'PENDING',
            level: hasOpenWeb ? 'LOW' : 'HIGH',
        },
        {
            label: 'IoT Exposure',
            status: hasIoT ? 'WARNING' : (scanStarted && !isScanning) ? 'CLEAR' : 'PENDING',
            level: hasIoT ? 'MED' : 'SAFE',
        },
        {
            label: 'Hidden Cameras',
            status: hasCameras ? 'DETECTED' : (scanStarted && !isScanning) ? 'NOT DETECTED' : 'PENDING',
            level: hasCameras ? 'CRITICAL' : 'SAFE',
        },
        {
            label: 'Remote Access',
            status: hasInsecureAccess ? 'CRITICAL' : (scanStarted && !isScanning) ? 'SECURE' : 'PENDING',
            level: hasInsecureAccess ? 'LOW' : 'HIGH',
        },
    ];

    return (
        <div className="glass-card p-8 border-pink-500/20 bg-pink-500/5 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Heart className="w-40 h-40 text-pink-500" />
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-500/20 rounded-xl">
                            <Shield className="text-pink-500 w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-pink-500 tracking-tight">Cyber Safety <span className="text-white">Assurance</span></h3>
                    </div>

                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Specialized module designed to detect privacy-invasive devices and insecure domestic
                        networks. Scans specifically for surveillance equipment and common IoT vulnerabilities.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {safetyTips.map((tip, i) => (
                            <div key={i} className="flex gap-3 p-4 bg-black/40 border border-pink-500/10 rounded-lg">
                                <div className="text-pink-500 shrink-0 mt-0.5">{tip.icon}</div>
                                <p className="text-xs text-gray-400 leading-tight">{tip.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrivacyScan}
                            disabled={isScanning}
                            className={`px-6 py-3 font-bold rounded-lg transition-all shadow-lg shadow-pink-600/20 flex items-center gap-2 ${isScanning
                                    ? 'bg-pink-800 text-pink-300 cursor-not-allowed'
                                    : 'bg-pink-600 text-white hover:bg-pink-500 active:scale-95'
                                }`}
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SCANNING...
                                </>
                            ) : (scanStarted && !isScanning) ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    RESCAN NETWORK
                                </>
                            ) : (
                                'INITIATE PRIVACY SCAN'
                            )}
                        </button>
                        <div className={`flex items-center gap-2 text-sm font-bold ${scoreColor}`}>
                            <AlertTriangle className="w-4 h-4" />
                            <span>Safety Score: {safetyScore}% - {scoreLabel}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 space-y-4">
                    <h4 className="text-[10px] font-black text-pink-500/50 uppercase tracking-[0.2em]">Surveillance Indicators</h4>
                    {indicators.map((item, i) => (
                        <div key={i} className="glass-card p-4 border-pink-500/10 flex justify-between items-center bg-black/60">
                            <div>
                                <span className="text-xs font-bold block text-gray-300">{item.label}</span>
                                <span className={`text-[10px] font-black ${item.status === 'PROTECTED' || item.status === 'CLEAR' || item.status === 'NOT DETECTED' || item.status === 'SECURE'
                                        ? 'text-green-500'
                                        : item.status === 'WARNING' || item.status === 'EXPOSED'
                                            ? 'text-orange-500'
                                            : item.status === 'PENDING'
                                                ? 'text-gray-500'
                                                : 'text-red-500'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-600 font-bold block uppercase">Level</span>
                                <span className="text-xs text-gray-400">{item.level}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
