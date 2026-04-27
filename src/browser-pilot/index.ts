/**
 * Browser Pilot - Embedded browser automation
 * Chrome DevTools Protocol automation with daemon-based architecture
 */

// Export core CDP functionality
export { ChromeBrowser } from './cdp/browser';
export { CDPClient } from './cdp/client';
export { getOutputDir, loadSharedConfig, getProjectPort, updateProjectLastUsed, cleanupProjectIfNeeded } from './cdp/config';

// Export daemon components
export { DaemonServer } from './daemon/server';
export { DaemonClient } from './daemon/client';
export { DaemonManager } from './daemon/manager';
export { MapManager } from './daemon/map-manager';

// Export protocol types
export {
  IPCRequest,
  IPCResponse,
  IPCError,
  IPCErrorCodes,
  SOCKET_PATH_PREFIX,
  PID_FILENAME,
  IDLE_SHUTDOWN_TIMEOUT,
  getProjectSocketName,
} from './daemon/protocol';

// Export action handlers
export * as actions from './cdp/actions';

// Export map functionality
export { generateInteractionMap } from './cdp/map/generate-interaction-map';
export { queryMap } from './cdp/map/query-map';

// Export utilities
export { logger } from './utils/logger';
export * as constants from './constants';

// Main entry point for CLI usage
export { runBrowserPilot } from './cli/cli';
