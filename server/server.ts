/**
 * CyberScan X — Main Server
 * 
 * Performance optimizations:
 * - Batch DB writes: accumulates results, flushes every 50 or on completion
 * - Incremental AI: streams per-port risk insights in real-time
 * - Abort support: clients can cancel running scans instantly
 * - Progress tracking: emits scanned/total with ports/sec
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './services/db.ts';
import { ScannerService } from './services/scanner.ts';
import type { PortResult } from './services/scanner.ts';
import { getServiceName } from '../utils/portDb.ts';
import { AIEngine } from './services/aiEngine.ts';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════
// In-Memory Scan History (works without DB)
// ═══════════════════════════════════════════

const inMemoryHistory: any[] = [];

// ═══════════════════════════════════════════
// REST API — Health & History
// ═══════════════════════════════════════════

app.get('/api/health', (_req, res) => {
    res.json({ status: 'CyberScan X API is running' });
});

app.get('/api/history', async (_req, res) => {
    try {
        const scans = await prisma.scan.findMany({
            include: { results: true, aiReport: true },
            orderBy: { startedAt: 'desc' },
            take: 50,
        });
        res.json(scans);
    } catch (error) {
        // DB unavailable — return in-memory history
        res.json(inMemoryHistory);
    }
});

app.get('/api/history/:id', async (req, res) => {
    try {
        const scan = await prisma.scan.findUnique({
            where: { id: req.params.id },
            include: { results: true, aiReport: true },
        });
        if (!scan) return res.status(404).json({ error: 'Scan not found' });
        res.json(scan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scan details' });
    }
});

// ═══════════════════════════════════════════
// Socket.io — Real-Time Scanning
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Track the current scan for this socket
    let currentScanId: string | null = null;

    socket.on('start-scan', async (data) => {
        const { target, ports, concurrency = 150, timeout = 400 } = data;

        // ── Abort any existing scan for this socket ──
        if (currentScanId) {
            ScannerService.abortScan(currentScanId);
            currentScanId = null;
        }

        // ── Create DB record (optional — scan works without DB) ──
        let scanId: string;
        let dbEnabled = true;
        try {
            const scan = await prisma.scan.create({
                data: {
                    target,
                    scanType: data.scanType || 'custom',
                    portRange: Array.isArray(ports) ? `${ports[0]}-${ports[ports.length - 1]}` : String(ports),
                    status: 'in-progress',
                },
            });
            scanId = scan.id;
        } catch (err) {
            // DB not available — generate local ID, scan still works
            scanId = crypto.randomUUID();
            dbEnabled = false;
            console.warn(`[SCAN ${scanId}] DB unavailable — running without persistence`);
        }

        currentScanId = scanId;
        const scanStart = Date.now();

        console.log(`[SCAN ${scanId}] Starting for ${target}, ${ports.length} ports`);

        socket.emit('scan:start', {
            scanId,
            target,
            totalPorts: ports.length,
        });

        // ── Batch DB write buffer ──
        const DB_BATCH_SIZE = 50;
        let resultBuffer: any[] = [];

        const flushBuffer = async () => {
            if (!dbEnabled || resultBuffer.length === 0) return;
            const batch = [...resultBuffer];
            resultBuffer = [];
            try {
                await prisma.scanResult.createMany({ data: batch });
            } catch (err) {
                dbEnabled = false; // stop trying after first failure
            }
        };

        // ── Start scan with callbacks ──
        try {
            ScannerService.startScan(
                { scanId, target, ports, concurrency, timeout },
                {
                    // Called for EVERY port (open, closed, or filtered)
                    onResult: (result: PortResult) => {
                        const service = getServiceName(result.port);
                        const enhanced = { ...result, service };

                        // Only emit open ports to UI (skip closed — too noisy)
                        if (result.status === 'open') {
                            const insight = AIEngine.analyzePort(result.port, result.banner);

                            socket.emit('port:found', {
                                scanId,
                                result: enhanced,
                                aiInsight: insight,
                            });

                            if (dbEnabled) {
                                resultBuffer.push({
                                    scanId,
                                    port: result.port,
                                    status: result.status,
                                    serviceName: service,
                                    banner: result.banner || null,
                                    riskLevel: insight?.riskLevel || 'Low',
                                });

                                if (resultBuffer.length >= DB_BATCH_SIZE) {
                                    flushBuffer();
                                }
                            }
                        }
                    },

                    // Progress updates
                    onProgress: (scanned: number, total: number) => {
                        const elapsed = (Date.now() - scanStart) / 1000;
                        const portsPerSec = Math.round(scanned / Math.max(elapsed, 0.1));

                        socket.emit('scan:progress', {
                            scanId,
                            scanned,
                            total,
                            percent: Math.round((scanned / total) * 100),
                            portsPerSec,
                            elapsed: Math.round(elapsed * 10) / 10,
                        });
                    },

                    // Final completion
                    onComplete: async (allResults: PortResult[]) => {
                        currentScanId = null;

                        await flushBuffer();

                        const openPorts = allResults.filter(r => r.status === 'open');
                        const aiReport = AIEngine.analyze(openPorts);

                        // Save AI report (if DB available)
                        if (dbEnabled) {
                            try {
                                await prisma.aiReport.create({
                                    data: {
                                        scanId,
                                        riskScore: aiReport.riskScore,
                                        summary: aiReport.summary,
                                        recommendations: aiReport.vulnerabilities.map(v => `[${v.severity}] ${v.title}: ${v.remediation}`).join('\n'),
                                    },
                                });
                                await prisma.scan.update({
                                    where: { id: scanId },
                                    data: { status: 'completed', completedAt: new Date() },
                                });
                            } catch (err) {
                                // Silent — scan still succeeded
                            }
                        }

                        const elapsed = (Date.now() - scanStart) / 1000;

                        socket.emit('scan:complete', {
                            scanId,
                            total: allResults.length,
                            openPorts: openPorts.length,
                            elapsed: Math.round(elapsed * 10) / 10,
                            aiReport,
                        });

                        console.log(`[SCAN ${scanId}] Complete: ${openPorts.length} open / ${allResults.length} total in ${elapsed.toFixed(1)}s`);

                        // ── Save to in-memory history ──
                        const scanRecord = {
                            id: scanId,
                            target,
                            scanType: data.scanType || 'custom',
                            portRange: Array.isArray(ports) ? `${ports[0]}-${ports[ports.length - 1]}` : String(ports),
                            status: 'completed',
                            startedAt: new Date(scanStart).toISOString(),
                            completedAt: new Date().toISOString(),
                            results: openPorts.map(r => ({
                                port: r.port,
                                status: r.status,
                                serviceName: getServiceName(r.port),
                                banner: r.banner || null,
                            })),
                            aiReport,
                        };
                        inMemoryHistory.unshift(scanRecord);
                        if (inMemoryHistory.length > 50) inMemoryHistory.pop();
                    },
                }
            );
        } catch (err: any) {
            socket.emit('scan:error', { scanId, error: err.message || 'Scan failed' });
        }
    });

    // ── Abort handler ──
    socket.on('abort-scan', () => {
        if (currentScanId) {
            const aborted = ScannerService.abortScan(currentScanId);
            if (aborted) {
                socket.emit('scan:aborted', { scanId: currentScanId });
                console.log(`[SCAN ${currentScanId}] Aborted by client`);
            }
            currentScanId = null;
        }
    });

    socket.on('delete-scan', async (id: string) => {
        try {
            // Remove from DB (if exists)
            await prisma.$transaction([
                prisma.aiReport.deleteMany({ where: { scanId: id } }),
                prisma.scanResult.deleteMany({ where: { scanId: id } }),
                prisma.scan.delete({ where: { id: id } })
            ]);
        } catch (err) {
            // DB fail or not found — ignore
        }

        // Remove from in-memory history
        const index = inMemoryHistory.findIndex(s => s.id === id);
        if (index !== -1) {
            inMemoryHistory.splice(index, 1);
        }

        console.log(`[HISTORY] Deleted scan ${id}`);
    });

    socket.on('disconnect', () => {
        // Abort any running scan when client disconnects
        if (currentScanId) {
            ScannerService.abortScan(currentScanId);
            currentScanId = null;
        }
        console.log('Client disconnected:', socket.id);
    });
});

// ═══════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server (ESM) running on port ${PORT}`);
});
