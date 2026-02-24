export const COMMON_PORTS: Record<number, string> = {
    20: 'FTP-DATA',
    21: 'FTP',
    22: 'SSH',
    23: 'TELNET',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'MICROSOFT-DS',
    3306: 'MYSQL',
    3389: 'RDP',
    5432: 'POSTGRESQL',
    6379: 'REDIS',
    8080: 'HTTP-PROXY',
    27017: 'MONGODB'
};

export const getServiceName = (port: number): string => {
    return COMMON_PORTS[port] || 'UNKNOWN';
};
