/**
 * AIEngine — Rule-based vulnerability analysis with incremental per-port insights.
 * 
 * Two modes:
 * 1. analyzePort(port, banner?) — instant per-port risk assessment, streamed during scan
 * 2. analyze(ports) — full summary report, called on scan completion
 */

export interface Vulnerability {
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    title: string;
    description: string;
    remediation: string;
    port: number;
}

export interface PortInsight {
    port: number;
    riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
    title: string;
    shortDesc: string;
}

export interface SecurityReport {
    riskScore: number;
    vulnerabilities: Vulnerability[];
    summary: string;
}

// Extended vulnerability database covering more services
const VULN_DB: Record<number, Omit<Vulnerability, 'port'>> = {
    21: { severity: 'Medium', title: 'FTP Service Exposed', description: 'FTP may allow anonymous access or brute-force.', remediation: 'Disable anonymous login; use SFTP instead.' },
    22: { severity: 'Low', title: 'SSH Service Exposed', description: 'SSH is exposed to brute-force attacks.', remediation: 'Use key-based auth; disable password login.' },
    23: { severity: 'High', title: 'Telnet Plaintext Protocol', description: 'Telnet sends all data in cleartext.', remediation: 'Disable Telnet; migrate to SSH.' },
    25: { severity: 'Medium', title: 'SMTP Open Relay Risk', description: 'SMTP may be an open relay for spam.', remediation: 'Restrict relay; enable authentication.' },
    53: { severity: 'Low', title: 'DNS Service Exposed', description: 'DNS may be vulnerable to amplification.', remediation: 'Restrict recursive queries; use rate limiting.' },
    80: { severity: 'Low', title: 'Unencrypted HTTP', description: 'HTTP traffic is unencrypted.', remediation: 'Enforce HTTPS with TLS certificates.' },
    110: { severity: 'Medium', title: 'POP3 Plaintext Risk', description: 'POP3 sends credentials in cleartext.', remediation: 'Use POP3S (port 995) with TLS.' },
    135: { severity: 'High', title: 'Windows RPC Exposed', description: 'MSRPC is a common attack vector.', remediation: 'Block port 135 at the firewall.' },
    139: { severity: 'High', title: 'NetBIOS Session Service', description: 'NetBIOS enables SMB enumeration.', remediation: 'Disable NetBIOS over TCP/IP.' },
    143: { severity: 'Medium', title: 'IMAP Plaintext Risk', description: 'IMAP sends credentials in cleartext.', remediation: 'Use IMAPS (port 993) with TLS.' },
    443: { severity: 'Low', title: 'HTTPS Service', description: 'Encrypted, but check TLS version.', remediation: 'Ensure TLS 1.2+ and valid certificates.' },
    445: { severity: 'High', title: 'SMB Service Exposed', description: 'SMB is frequently targeted (EternalBlue).', remediation: 'Block port 445 externally; patch SMB.' },
    1433: { severity: 'High', title: 'MSSQL Exposed', description: 'Database should not be public.', remediation: 'Restrict to trusted IPs; use VPN.' },
    1521: { severity: 'High', title: 'Oracle DB Exposed', description: 'Oracle DB should not be public.', remediation: 'Restrict to trusted IPs; use VPN.' },
    3306: { severity: 'High', title: 'MySQL Database Exposed', description: 'MySQL should not be on the public internet.', remediation: 'Restrict to trusted IPs; use VPN.' },
    3389: { severity: 'High', title: 'RDP Service Exposed', description: 'RDP is a major ransomware vector.', remediation: 'Use VPN; enable NLA; limit access.' },
    5432: { severity: 'High', title: 'PostgreSQL Exposed', description: 'Database should not be public.', remediation: 'Restrict to trusted IPs; use VPN.' },
    5900: { severity: 'High', title: 'VNC Service Exposed', description: 'VNC may have weak or no authentication.', remediation: 'Use SSH tunnel; enforce strong auth.' },
    6379: { severity: 'Critical', title: 'Redis No Auth', description: 'Redis often runs without authentication.', remediation: 'Enable AUTH; bind to localhost only.' },
    8080: { severity: 'Low', title: 'HTTP Proxy/Alt Service', description: 'Alternative HTTP service detected.', remediation: 'Ensure proper access controls.' },
    8443: { severity: 'Low', title: 'HTTPS Alt Service', description: 'Alternative HTTPS service detected.', remediation: 'Verify TLS configuration.' },
    27017: { severity: 'Critical', title: 'MongoDB No Auth', description: 'MongoDB may lack authentication.', remediation: 'Enable auth; restrict via firewall.' },
};

const SEVERITY_SCORES: Record<string, number> = {
    Critical: 40,
    High: 25,
    Medium: 15,
    Low: 5,
};

export class AIEngine {

    /**
     * Instant per-port analysis — called immediately when a port is found open.
     * Returns null for ports with no known risk.
     */
    static analyzePort(port: number, banner?: string): PortInsight | null {
        const vuln = VULN_DB[port];
        if (vuln) {
            return {
                port,
                riskLevel: vuln.severity,
                title: vuln.title,
                shortDesc: vuln.description,
            };
        }
        // Unknown open port — still worth noting
        return {
            port,
            riskLevel: 'Low',
            title: `Unknown Service (Port ${port})`,
            shortDesc: 'Open port with unrecognized service.',
        };
    }

    /**
     * Full scan summary — called once on completion.
     * Aggregates all open ports into a single risk report.
     */
    static analyze(ports: { port: number; banner?: string }[]): SecurityReport {
        const vulns: Vulnerability[] = [];
        let score = 0;

        for (const p of ports) {
            const vuln = VULN_DB[p.port];
            if (vuln) {
                vulns.push({ ...vuln, port: p.port });
                score += SEVERITY_SCORES[vuln.severity] ?? 5;
            }
        }

        const finalScore = Math.min(100, score);
        let summary = `Scan complete. Risk score: ${finalScore}/100. ${ports.length} open port(s) detected. `;

        if (finalScore > 70) summary += 'CRITICAL: Immediate remediation required.';
        else if (finalScore > 40) summary += 'WARNING: Moderate security risks found.';
        else if (finalScore > 0) summary += 'Low risk — continue monitoring.';
        else summary += 'No known vulnerabilities detected.';

        return { riskScore: finalScore, vulnerabilities: vulns, summary };
    }
}
