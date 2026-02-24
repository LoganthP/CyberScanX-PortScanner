/**
 * ScannerService — Orchestrates high-speed parallel port scanning.
 * 
 * Replaces the old worker_threads approach with an in-process Promise pool.
 * Each scan gets an AbortController so it can be cancelled instantly.
 */

import { runScan } from '../utils/portQueue.ts';
import type { PortResult } from '../utils/portQueue.ts';

export type { PortResult };

export interface ScanConfig {
    scanId: string;
    target: string;
    ports: number[];
    concurrency: number;
    timeout: number;
}

export interface ScanCallbacks {
    onResult: (result: PortResult) => void;
    onProgress: (scanned: number, total: number) => void;
    onComplete: (results: PortResult[]) => void;
}

// Store active scan abort controllers for cancellation
const activeScans = new Map<string, AbortController>();

/**
 * Sanitize user input: strip protocols, paths, ports from URLs.
 * 
 * Examples:
 *   "http://192.168.1.1:8080/path" → "192.168.1.1"
 *   "https://example.com/"         → "example.com"
 *   "192.168.1.1"                  → "192.168.1.1"
 */
function sanitizeTarget(input: string): string {
    let target = input.trim();

    // Strip protocol
    target = target.replace(/^https?:\/\//i, '');

    // Strip path
    target = target.split('/')[0];

    // Strip port
    target = target.split(':')[0];

    return target;
}

/**
 * Validate that a target looks like a valid IP or hostname.
 */
function validateTarget(target: string): boolean {
    if (!target || target.length === 0 || target.length > 255) return false;

    // IPv4
    const ipv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipv4.test(target)) return true;

    // Hostname (basic check)
    const hostname = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostname.test(target);
}

export const ScannerService = {
    /**
     * Start a high-speed parallel scan.
     * Returns immediately — results stream via callbacks.
     */
    startScan(config: ScanConfig, callbacks: ScanCallbacks): { target: string } {
        const target = sanitizeTarget(config.target);

        if (!validateTarget(target)) {
            throw new Error(`Invalid target: "${config.target}"`);
        }

        // Create abort controller for this scan
        const abort = new AbortController();
        activeScans.set(config.scanId, abort);

        // Clamp concurrency to sane limits
        const concurrency = Math.max(10, Math.min(config.concurrency, 500));

        // Use shorter timeout for large scans (>500 ports)
        const timeout = config.ports.length > 500
            ? Math.min(config.timeout, 400)
            : Math.min(config.timeout, 800);

        console.log(`[SCAN ${config.scanId}] Target: ${target} | Ports: ${config.ports.length} | Concurrency: ${concurrency} | Timeout: ${timeout}ms`);

        // Fire and forget — the Promise pool handles everything
        runScan({
            host: target,
            ports: config.ports,
            concurrency,
            timeout,
            onResult: callbacks.onResult,
            onProgress: callbacks.onProgress,
            onComplete: (results) => {
                activeScans.delete(config.scanId);
                callbacks.onComplete(results);
            },
            signal: abort.signal,
        }).catch((err) => {
            console.error(`[SCAN ${config.scanId}] Fatal error:`, err);
            activeScans.delete(config.scanId);
            callbacks.onComplete([]);
        });

        return { target };
    },

    /**
     * Abort a running scan. All pending sockets are abandoned.
     */
    abortScan(scanId: string): boolean {
        const abort = activeScans.get(scanId);
        if (abort) {
            abort.abort();
            activeScans.delete(scanId);
            console.log(`[SCAN ${scanId}] Aborted by user`);
            return true;
        }
        return false;
    },

    /**
     * Check if a scan is currently running.
     */
    isActive(scanId: string): boolean {
        return activeScans.has(scanId);
    }
};
