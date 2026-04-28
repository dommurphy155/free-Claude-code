// @bun
// src/bootstrap/state.js
import { realpathSync } from "fs";
import { cwd } from "process";

// src/utils/crypto.js
import { randomUUID } from "crypto";

// src/utils/settings/settingsCache.js
var perSourceCache = new Map;
var parseFileCache = new Map;

// src/utils/signal.js
function createSignal() {
  const listeners = new Set;
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(...args) {
      for (const listener of listeners)
        listener(...args);
    },
    clear() {
      listeners.clear();
    }
  };
}

// src/bootstrap/state.js
function getInitialState() {
  let resolvedCwd = "";
  if (typeof process !== "undefined" && typeof process.cwd === "function" && typeof realpathSync === "function") {
    const rawCwd = cwd();
    try {
      resolvedCwd = realpathSync(rawCwd).normalize("NFC");
    } catch {
      resolvedCwd = rawCwd.normalize("NFC");
    }
  }
  const state = {
    originalCwd: resolvedCwd,
    projectRoot: resolvedCwd,
    totalCostUSD: 0,
    totalAPIDuration: 0,
    totalAPIDurationWithoutRetries: 0,
    totalToolDuration: 0,
    turnHookDurationMs: 0,
    turnToolDurationMs: 0,
    turnClassifierDurationMs: 0,
    turnToolCount: 0,
    turnHookCount: 0,
    turnClassifierCount: 0,
    startTime: Date.now(),
    lastInteractionTime: Date.now(),
    totalLinesAdded: 0,
    totalLinesRemoved: 0,
    hasUnknownModelCost: false,
    cwd: resolvedCwd,
    modelUsage: {},
    mainLoopModelOverride: undefined,
    initialMainLoopModel: null,
    modelStrings: null,
    isInteractive: false,
    kairosActive: false,
    strictToolResultPairing: false,
    sdkAgentProgressSummariesEnabled: false,
    userMsgOptIn: false,
    clientType: "cli",
    sessionSource: undefined,
    questionPreviewFormat: undefined,
    sessionIngressToken: undefined,
    oauthTokenFromFd: undefined,
    apiKeyFromFd: undefined,
    flagSettingsPath: undefined,
    flagSettingsInline: null,
    allowedSettingSources: [
      "userSettings",
      "projectSettings",
      "localSettings",
      "flagSettings",
      "policySettings"
    ],
    meter: null,
    sessionCounter: null,
    locCounter: null,
    prCounter: null,
    commitCounter: null,
    costCounter: null,
    tokenCounter: null,
    codeEditToolDecisionCounter: null,
    activeTimeCounter: null,
    statsStore: null,
    sessionId: randomUUID(),
    parentSessionId: undefined,
    loggerProvider: null,
    eventLogger: null,
    meterProvider: null,
    tracerProvider: null,
    agentColorMap: new Map,
    agentColorIndex: 0,
    lastAPIRequest: null,
    lastAPIRequestMessages: null,
    lastClassifierRequests: null,
    cachedClaudeMdContent: null,
    inMemoryErrorLog: [],
    inlinePlugins: [],
    chromeFlagOverride: undefined,
    useCoworkPlugins: false,
    sessionBypassPermissionsMode: false,
    scheduledTasksEnabled: false,
    sessionCronTasks: [],
    sessionCreatedTeams: new Set,
    sessionTrustAccepted: false,
    sessionPersistenceDisabled: false,
    hasExitedPlanMode: false,
    needsPlanModeExitAttachment: false,
    needsAutoModeExitAttachment: false,
    lspRecommendationShownThisSession: false,
    initJsonSchema: null,
    registeredHooks: null,
    planSlugCache: new Map,
    teleportedSessionInfo: null,
    invokedSkills: new Map,
    slowOperations: [],
    sdkBetas: undefined,
    mainThreadAgentType: undefined,
    isRemoteMode: false,
    ...process.env.USER_TYPE === "ant" ? {
      replBridgeActive: false
    } : {},
    directConnectServerUrl: undefined,
    systemPromptSectionCache: new Map,
    lastEmittedDate: null,
    additionalDirectoriesForClaudeMd: [],
    allowedChannels: [],
    hasDevChannels: false,
    sessionProjectDir: null,
    promptCache1hAllowlist: null,
    promptCache1hEligible: null,
    afkModeHeaderLatched: null,
    fastModeHeaderLatched: null,
    cacheEditingHeaderLatched: null,
    thinkingClearLatched: null,
    promptId: null,
    lastMainRequestId: undefined,
    lastApiCompletionTimestamp: null,
    pendingPostCompaction: false
  };
  return state;
}
var STATE = getInitialState();
var sessionSwitched = createSignal();
var onSessionSwitch = sessionSwitched.subscribe;
function getIsNonInteractiveSession() {
  return !STATE.isInteractive;
}

// src/commands/browser-pilot/index.ts
import { spawn } from "child_process";
import { join } from "path";
var BP_PATH = join(process.cwd(), ".browser-pilot", "bp.js");
async function runBrowserPilot(args) {
  return new Promise((resolve) => {
    const proc = spawn("node", [BP_PATH, ...args], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });
  });
}
function parseBrowserArgs(input) {
  const args = input.trim().split(/\s+/);
  if (args.length === 0 || !args[0].startsWith("-") && !isSubcommand(args[0])) {
    const maybeUrl = args[0] || input.trim();
    if (maybeUrl && (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://"))) {
      return ["navigate", "-u", maybeUrl];
    }
    return ["navigate", "-u", maybeUrl];
  }
  return args;
}
function isSubcommand(arg) {
  const subcommands = [
    "navigate",
    "click",
    "fill",
    "type",
    "press",
    "extract",
    "screenshot",
    "chain",
    "daemon-start",
    "daemon-stop",
    "daemon-status",
    "--help"
  ];
  return subcommands.includes(arg);
}
var command = {
  name: "browser",
  description: "Browser automation with Chrome DevTools Protocol",
  isEnabled: () => !getIsNonInteractiveSession(),
  type: "local",
  async execute(args, context) {
    const parsedArgs = parseBrowserArgs(args);
    if (!args.trim() || args.trim() === "--help" || args.trim() === "-h") {
      const result2 = await runBrowserPilot(["--help"]);
      return {
        output: result2.stdout || result2.stderr,
        render: "text"
      };
    }
    const result = await runBrowserPilot(parsedArgs);
    if (result.exitCode !== 0) {
      return {
        output: `Browser Pilot error (exit ${result.exitCode}):
${result.stderr || result.stdout}`,
        render: "text"
      };
    }
    if (parsedArgs[0] === "screenshot" || parsedArgs.includes("screenshot")) {
      const outputIndex = parsedArgs.indexOf("-o");
      const screenshotPath = outputIndex !== -1 && outputIndex + 1 < parsedArgs.length ? parsedArgs[outputIndex + 1] : "/root/claude-code-haha/.browser-pilot/screenshots/tmp/browser-screenshot.png";
      return {
        output: `${result.stdout}
Screenshot saved to: ${screenshotPath}`,
        render: "text"
      };
    }
    return {
      output: result.stdout || "Command executed successfully",
      render: "text"
    };
  }
};
var browser_pilot_default = command;
export {
  browser_pilot_default as default
};
