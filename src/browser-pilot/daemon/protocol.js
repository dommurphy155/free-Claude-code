/**
 * IPC Protocol definitions for Browser Pilot Daemon
 */
/**
 * Protocol constants
 */
export const SOCKET_PATH_PREFIX = 'daemon';
export const PID_FILENAME = 'daemon.pid';
export const STATE_FILENAME = 'daemon-state.json';
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const IDLE_SHUTDOWN_TIMEOUT = 1800000; // 30 minutes
/**
 * Get project-specific socket name
 * Uses project folder name + path hash to create unique socket for each project
 */
import { basename } from 'path';
import { createHash } from 'crypto';
import { findProjectRoot } from '../cdp/utils.js';
export function getProjectSocketName() {
    const projectRoot = findProjectRoot();
    const projectName = basename(projectRoot)
        .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace special chars with hyphen
        .toLowerCase();
    // Add hash of full path to prevent collision
    const hash = createHash('sha256')
        .update(projectRoot)
        .digest('hex')
        .substring(0, 8); // Use first 8 chars for brevity
    return `${SOCKET_PATH_PREFIX}-${projectName}-${hash}`;
}
/**
 * Protocol errors
 */
export class IPCError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'IPCError';
    }
}
export const IPCErrorCodes = {
    TIMEOUT: 'TIMEOUT',
    DAEMON_NOT_RUNNING: 'DAEMON_NOT_RUNNING',
    DAEMON_ALREADY_RUNNING: 'DAEMON_ALREADY_RUNNING',
    BROWSER_NOT_CONNECTED: 'BROWSER_NOT_CONNECTED',
    COMMAND_FAILED: 'COMMAND_FAILED',
    INVALID_REQUEST: 'INVALID_REQUEST',
    CONNECTION_ERROR: 'CONNECTION_ERROR'
};
/**
 * Daemon command constants
 */
export const DAEMON_COMMANDS = {
    // Navigation
    NAVIGATE: 'navigate',
    BACK: 'back',
    FORWARD: 'forward',
    RELOAD: 'reload',
    // Interaction
    CLICK: 'click',
    FILL: 'fill',
    HOVER: 'hover',
    PRESS: 'press',
    TYPE: 'type',
    // Capture
    SCREENSHOT: 'screenshot',
    PDF: 'pdf',
    // Data
    EXTRACT: 'extract',
    CONTENT: 'content',
    FIND: 'find',
    EVAL: 'eval',
    // Console
    CONSOLE: 'console',
    // Wait
    WAIT: 'wait',
    WAIT_IDLE: 'wait-idle',
    SLEEP: 'sleep',
    // Scroll
    SCROLL: 'scroll',
    // Daemon management
    DAEMON_STATUS: 'daemon-status',
    DAEMON_STOP: 'daemon-stop',
    // Map operations
    QUERY_MAP: 'query-map',
    GENERATE_MAP: 'generate-map',
    GET_MAP_STATUS: 'get-map-status'
};
