import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigurableShortcutHint } from '../../components/ConfigurableShortcutHint.js';
import { Byline } from '../../components/design-system/Byline.js';
import { SearchBox } from '../../components/SearchBox.js';
import { useSearchInput } from '../../hooks/useSearchInput.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- useInput needed for raw search mode text input
import { Box, Text, useInput, useTerminalFocus } from '../../ink.js';
import { useKeybinding, useKeybindings } from '../../keybindings/useKeybinding.js';
import { count } from '../../utils/array.js';
import { openBrowser } from '../../utils/browser.js';
import { logForDebugging } from '../../utils/debug.js';
import { errorMessage } from '../../utils/errors.js';
import { clearAllCaches } from '../../utils/plugins/cacheUtils.js';
import { formatInstallCount, getInstallCounts } from '../../utils/plugins/installCounts.js';
import { isPluginGloballyInstalled } from '../../utils/plugins/installedPluginsManager.js';
import { createPluginId, detectEmptyMarketplaceReason, formatFailureDetails, formatMarketplaceLoadingErrors, loadMarketplacesWithGracefulDegradation } from '../../utils/plugins/marketplaceHelpers.js';
import { loadKnownMarketplacesConfig } from '../../utils/plugins/marketplaceManager.js';
import { OFFICIAL_MARKETPLACE_NAME } from '../../utils/plugins/officialMarketplace.js';
import { installPluginFromMarketplace } from '../../utils/plugins/pluginInstallationHelpers.js';
import { isPluginBlockedByPolicy } from '../../utils/plugins/pluginPolicy.js';
import { plural } from '../../utils/stringUtils.js';
import { truncateToWidth } from '../../utils/truncate.js';
import { findPluginOptionsTarget, PluginOptionsFlow } from './PluginOptionsFlow.js';
import { PluginTrustWarning } from './PluginTrustWarning.js';
import { buildPluginDetailsMenuOptions, extractGitHubRepo } from './pluginDetailsHelpers.js';
import { usePagination } from './usePagination.js';
export function DiscoverPlugins({ error, setError, result: _result, setResult, setViewState: setParentViewState, onInstallComplete, onSearchModeChange, targetPlugin }) {
    // View state
    const [viewState, setViewState] = useState('plugin-list');
    const [selectedPlugin, setSelectedPlugin] = useState(null);
    // Data state
    const [availablePlugins, setAvailablePlugins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installCounts, setInstallCounts] = useState(null);
    // Search state
    const [isSearchMode, setIsSearchModeRaw] = useState(false);
    const setIsSearchMode = useCallback((active) => {
        setIsSearchModeRaw(active);
        onSearchModeChange?.(active);
    }, [onSearchModeChange]);
    const { query: searchQuery, setQuery: setSearchQuery, cursorOffset: searchCursorOffset } = useSearchInput({
        isActive: viewState === 'plugin-list' && isSearchMode && !loading,
        onExit: () => {
            setIsSearchMode(false);
        }
    });
    const isTerminalFocused = useTerminalFocus();
    const { columns: terminalWidth } = useTerminalSize();
    // Filter plugins based on search query
    const filteredPlugins = useMemo(() => {
        if (!searchQuery)
            return availablePlugins;
        const lowerQuery = searchQuery.toLowerCase();
        return availablePlugins.filter(plugin => plugin.entry.name.toLowerCase().includes(lowerQuery) || plugin.entry.description?.toLowerCase().includes(lowerQuery) || plugin.marketplaceName.toLowerCase().includes(lowerQuery));
    }, [availablePlugins, searchQuery]);
    // Selection state
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedForInstall, setSelectedForInstall] = useState(new Set());
    const [installingPlugins, setInstallingPlugins] = useState(new Set());
    // Pagination for plugin list (continuous scrolling)
    const pagination = usePagination({
        totalItems: filteredPlugins.length,
        selectedIndex
    });
    // Reset selection when search query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);
    // Details view state
    const [detailsMenuIndex, setDetailsMenuIndex] = useState(0);
    const [isInstalling, setIsInstalling] = useState(false);
    const [installError, setInstallError] = useState(null);
    // Warning state for non-critical errors
    const [warning, setWarning] = useState(null);
    // Empty state reason
    const [emptyReason, setEmptyReason] = useState(null);
    // Load all plugins from all marketplaces
    useEffect(() => {
        async function loadAllPlugins() {
            try {
                const config = await loadKnownMarketplacesConfig();
                // Load marketplaces with graceful degradation
                const { marketplaces, failures } = await loadMarketplacesWithGracefulDegradation(config);
                // Collect all plugins from all marketplaces
                const allPlugins = [];
                for (const { name, data: marketplace } of marketplaces) {
                    if (marketplace) {
                        for (const entry of marketplace.plugins) {
                            const pluginId = createPluginId(entry.name, name);
                            allPlugins.push({
                                entry,
                                marketplaceName: name,
                                pluginId,
                                // Only block when globally installed (user/managed scope).
                                // Project/local-scope installs don't block — user may want to
                                // promote to user scope so it's available everywhere (gh-29997).
                                isInstalled: isPluginGloballyInstalled(pluginId)
                            });
                        }
                    }
                }
                // Filter out installed and policy-blocked plugins
                const uninstalledPlugins = allPlugins.filter(p => !p.isInstalled && !isPluginBlockedByPolicy(p.pluginId));
                // Fetch install counts and sort by popularity
                try {
                    const counts = await getInstallCounts();
                    setInstallCounts(counts);
                    if (counts) {
                        // Sort by install count (descending), then alphabetically
                        uninstalledPlugins.sort((a_0, b_0) => {
                            const countA = counts.get(a_0.pluginId) ?? 0;
                            const countB = counts.get(b_0.pluginId) ?? 0;
                            if (countA !== countB)
                                return countB - countA;
                            return a_0.entry.name.localeCompare(b_0.entry.name);
                        });
                    }
                    else {
                        // No counts available - sort alphabetically
                        uninstalledPlugins.sort((a_1, b_1) => a_1.entry.name.localeCompare(b_1.entry.name));
                    }
                }
                catch (error_0) {
                    // Log the error, then gracefully degrade to alphabetical sort
                    logForDebugging(`Failed to fetch install counts: ${errorMessage(error_0)}`);
                    uninstalledPlugins.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
                }
                setAvailablePlugins(uninstalledPlugins);
                // Detect empty reason if no plugins available
                const configuredCount = Object.keys(config).length;
                if (uninstalledPlugins.length === 0) {
                    const reason = await detectEmptyMarketplaceReason({
                        configuredMarketplaceCount: configuredCount,
                        failedMarketplaceCount: failures.length
                    });
                    setEmptyReason(reason);
                }
                // Handle marketplace loading errors/warnings
                const successCount = count(marketplaces, m => m.data !== null);
                const errorResult = formatMarketplaceLoadingErrors(failures, successCount);
                if (errorResult) {
                    if (errorResult.type === 'warning') {
                        setWarning(errorResult.message + '. Showing available plugins.');
                    }
                    else {
                        throw new Error(errorResult.message);
                    }
                }
                // Handle targetPlugin - navigate directly to plugin details
                // Search in allPlugins (before filtering) to handle installed plugins gracefully
                if (targetPlugin) {
                    const foundPlugin = allPlugins.find(p_0 => p_0.entry.name === targetPlugin);
                    if (foundPlugin) {
                        if (foundPlugin.isInstalled) {
                            setError(`Plugin '${foundPlugin.pluginId}' is already installed. Use '/plugin' to manage existing plugins.`);
                        }
                        else {
                            setSelectedPlugin(foundPlugin);
                            setViewState('plugin-details');
                        }
                    }
                    else {
                        setError(`Plugin "${targetPlugin}" not found in any marketplace`);
                    }
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load plugins');
            }
            finally {
                setLoading(false);
            }
        }
        void loadAllPlugins();
    }, [setError, targetPlugin]);
    // Install selected plugins
    const installSelectedPlugins = async () => {
        if (selectedForInstall.size === 0)
            return;
        const pluginsToInstall = availablePlugins.filter(p_1 => selectedForInstall.has(p_1.pluginId));
        setInstallingPlugins(new Set(pluginsToInstall.map(p_2 => p_2.pluginId)));
        let successCount_0 = 0;
        let failureCount = 0;
        const newFailedPlugins = [];
        for (const plugin_0 of pluginsToInstall) {
            const result = await installPluginFromMarketplace({
                pluginId: plugin_0.pluginId,
                entry: plugin_0.entry,
                marketplaceName: plugin_0.marketplaceName,
                scope: 'user'
            });
            if (result.success) {
                successCount_0++;
            }
            else {
                failureCount++;
                newFailedPlugins.push({
                    name: plugin_0.entry.name,
                    reason: result.error
                });
            }
        }
        setInstallingPlugins(new Set());
        setSelectedForInstall(new Set());
        clearAllCaches();
        // Handle installation results
        if (failureCount === 0) {
            const message = `✓ Installed ${successCount_0} ${plural(successCount_0, 'plugin')}. ` + `Run /reload-plugins to activate.`;
            setResult(message);
        }
        else if (successCount_0 === 0) {
            setError(`Failed to install: ${formatFailureDetails(newFailedPlugins, true)}`);
        }
        else {
            const message_0 = `✓ Installed ${successCount_0} of ${successCount_0 + failureCount} plugins. ` + `Failed: ${formatFailureDetails(newFailedPlugins, false)}. ` + `Run /reload-plugins to activate successfully installed plugins.`;
            setResult(message_0);
        }
        if (successCount_0 > 0) {
            if (onInstallComplete) {
                await onInstallComplete();
            }
        }
        setParentViewState({
            type: 'menu'
        });
    };
    // Install single plugin from details view
    const handleSinglePluginInstall = async (plugin_1, scope = 'user') => {
        setIsInstalling(true);
        setInstallError(null);
        const result_0 = await installPluginFromMarketplace({
            pluginId: plugin_1.pluginId,
            entry: plugin_1.entry,
            marketplaceName: plugin_1.marketplaceName,
            scope
        });
        if (result_0.success) {
            const loaded = await findPluginOptionsTarget(plugin_1.pluginId);
            if (loaded) {
                setIsInstalling(false);
                setViewState({
                    type: 'plugin-options',
                    plugin: loaded,
                    pluginId: plugin_1.pluginId
                });
                return;
            }
            setResult(result_0.message);
            if (onInstallComplete) {
                await onInstallComplete();
            }
            setParentViewState({
                type: 'menu'
            });
        }
        else {
            setIsInstalling(false);
            setInstallError(result_0.error);
        }
    };
    // Handle error state
    useEffect(() => {
        if (error) {
            setResult(error);
        }
    }, [error, setResult]);
    // Escape in plugin-details view - go back to plugin-list
    useKeybinding('confirm:no', () => {
        setViewState('plugin-list');
        setSelectedPlugin(null);
    }, {
        context: 'Confirmation',
        isActive: viewState === 'plugin-details'
    });
    // Escape in plugin-list view (not search mode) - exit to parent menu
    useKeybinding('confirm:no', () => {
        setParentViewState({
            type: 'menu'
        });
    }, {
        context: 'Confirmation',
        isActive: viewState === 'plugin-list' && !isSearchMode
    });
    // Handle entering search mode (non-escape keys)
    useInput((input, _key) => {
        const keyIsNotCtrlOrMeta = !_key.ctrl && !_key.meta;
        if (!isSearchMode) {
            // Enter search mode with '/' or any printable character
            if (input === '/' && keyIsNotCtrlOrMeta) {
                setIsSearchMode(true);
                setSearchQuery('');
            }
            else if (keyIsNotCtrlOrMeta && input.length > 0 && !/^\s+$/.test(input) &&
                // Don't enter search mode for navigation keys
                input !== 'j' && input !== 'k' && input !== 'i') {
                setIsSearchMode(true);
                setSearchQuery(input);
            }
        }
    }, {
        isActive: viewState === 'plugin-list' && !loading
    });
    // Plugin-list navigation (non-search mode)
    useKeybindings({
        'select:previous': () => {
            if (selectedIndex === 0) {
                setIsSearchMode(true);
            }
            else {
                pagination.handleSelectionChange(selectedIndex - 1, setSelectedIndex);
            }
        },
        'select:next': () => {
            if (selectedIndex < filteredPlugins.length - 1) {
                pagination.handleSelectionChange(selectedIndex + 1, setSelectedIndex);
            }
        },
        'select:accept': () => {
            if (selectedIndex === filteredPlugins.length && selectedForInstall.size > 0) {
                void installSelectedPlugins();
            }
            else if (selectedIndex < filteredPlugins.length) {
                const plugin_2 = filteredPlugins[selectedIndex];
                if (plugin_2) {
                    if (plugin_2.isInstalled) {
                        setParentViewState({
                            type: 'manage-plugins',
                            targetPlugin: plugin_2.entry.name,
                            targetMarketplace: plugin_2.marketplaceName
                        });
                    }
                    else {
                        setSelectedPlugin(plugin_2);
                        setViewState('plugin-details');
                        setDetailsMenuIndex(0);
                        setInstallError(null);
                    }
                }
            }
        }
    }, {
        context: 'Select',
        isActive: viewState === 'plugin-list' && !isSearchMode
    });
    useKeybindings({
        'plugin:toggle': () => {
            if (selectedIndex < filteredPlugins.length) {
                const plugin_3 = filteredPlugins[selectedIndex];
                if (plugin_3 && !plugin_3.isInstalled) {
                    const newSelection = new Set(selectedForInstall);
                    if (newSelection.has(plugin_3.pluginId)) {
                        newSelection.delete(plugin_3.pluginId);
                    }
                    else {
                        newSelection.add(plugin_3.pluginId);
                    }
                    setSelectedForInstall(newSelection);
                }
            }
        },
        'plugin:install': () => {
            if (selectedForInstall.size > 0) {
                void installSelectedPlugins();
            }
        }
    }, {
        context: 'Plugin',
        isActive: viewState === 'plugin-list' && !isSearchMode
    });
    // Plugin-details navigation
    const detailsMenuOptions = React.useMemo(() => {
        if (!selectedPlugin)
            return [];
        const hasHomepage = selectedPlugin.entry.homepage;
        const githubRepo = extractGitHubRepo(selectedPlugin);
        return buildPluginDetailsMenuOptions(hasHomepage, githubRepo);
    }, [selectedPlugin]);
    useKeybindings({
        'select:previous': () => {
            if (detailsMenuIndex > 0) {
                setDetailsMenuIndex(detailsMenuIndex - 1);
            }
        },
        'select:next': () => {
            if (detailsMenuIndex < detailsMenuOptions.length - 1) {
                setDetailsMenuIndex(detailsMenuIndex + 1);
            }
        },
        'select:accept': () => {
            if (!selectedPlugin)
                return;
            const action = detailsMenuOptions[detailsMenuIndex]?.action;
            const hasHomepage_0 = selectedPlugin.entry.homepage;
            const githubRepo_0 = extractGitHubRepo(selectedPlugin);
            if (action === 'install-user') {
                void handleSinglePluginInstall(selectedPlugin, 'user');
            }
            else if (action === 'install-project') {
                void handleSinglePluginInstall(selectedPlugin, 'project');
            }
            else if (action === 'install-local') {
                void handleSinglePluginInstall(selectedPlugin, 'local');
            }
            else if (action === 'homepage' && hasHomepage_0) {
                void openBrowser(hasHomepage_0);
            }
            else if (action === 'github' && githubRepo_0) {
                void openBrowser(`https://github.com/${githubRepo_0}`);
            }
            else if (action === 'back') {
                setViewState('plugin-list');
                setSelectedPlugin(null);
            }
        }
    }, {
        context: 'Select',
        isActive: viewState === 'plugin-details' && !!selectedPlugin
    });
    if (typeof viewState === 'object' && viewState.type === 'plugin-options') {
        const { plugin: plugin_4, pluginId: pluginId_0 } = viewState;
        function finish(msg) {
            setResult(msg);
            if (onInstallComplete) {
                void onInstallComplete();
            }
            setParentViewState({
                type: 'menu'
            });
        }
        return _jsx(PluginOptionsFlow, { plugin: plugin_4, pluginId: pluginId_0, onDone: (outcome, detail) => {
                switch (outcome) {
                    case 'configured':
                        finish(`✓ Installed and configured ${plugin_4.name}. Run /reload-plugins to apply.`);
                        break;
                    case 'skipped':
                        finish(`✓ Installed ${plugin_4.name}. Run /reload-plugins to apply.`);
                        break;
                    case 'error':
                        finish(`Installed but failed to save config: ${detail}`);
                        break;
                }
            } });
    }
    // Loading state
    if (loading) {
        return _jsx(Text, { children: "Loading\u2026" });
    }
    // Error state
    if (error) {
        return _jsx(Text, { color: "error", children: error });
    }
    // Plugin details view
    if (viewState === 'plugin-details' && selectedPlugin) {
        const hasHomepage_1 = selectedPlugin.entry.homepage;
        const githubRepo_1 = extractGitHubRepo(selectedPlugin);
        const menuOptions = buildPluginDetailsMenuOptions(hasHomepage_1, githubRepo_1);
        return _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, children: "Plugin details" }) }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: selectedPlugin.entry.name }), _jsxs(Text, { dimColor: true, children: ["from ", selectedPlugin.marketplaceName] }), selectedPlugin.entry.version && _jsxs(Text, { dimColor: true, children: ["Version: ", selectedPlugin.entry.version] }), selectedPlugin.entry.description && _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: selectedPlugin.entry.description }) }), selectedPlugin.entry.author && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["By:", ' ', typeof selectedPlugin.entry.author === 'string' ? selectedPlugin.entry.author : selectedPlugin.entry.author.name] }) })] }), _jsx(PluginTrustWarning, {}), installError && _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: "error", children: ["Error: ", installError] }) }), _jsx(Box, { flexDirection: "column", children: menuOptions.map((option, index) => _jsxs(Box, { children: [detailsMenuIndex === index && _jsx(Text, { children: '> ' }), detailsMenuIndex !== index && _jsx(Text, { children: '  ' }), _jsx(Text, { bold: detailsMenuIndex === index, children: isInstalling && option.action.startsWith('install-') ? 'Installing…' : option.label })] }, option.action)) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: _jsxs(Byline, { children: [_jsx(ConfigurableShortcutHint, { action: "select:accept", context: "Select", fallback: "Enter", description: "select" }), _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" })] }) }) })] });
    }
    // Empty state
    if (availablePlugins.length === 0) {
        return _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, children: "Discover plugins" }) }), _jsx(EmptyStateMessage, { reason: emptyReason }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: "Esc to go back" }) })] });
    }
    // Get visible plugins from pagination
    const visiblePlugins = pagination.getVisibleItems(filteredPlugins);
    return _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, children: "Discover plugins" }), pagination.needsPagination && _jsxs(Text, { dimColor: true, children: [' ', "(", pagination.scrollPosition.current, "/", pagination.scrollPosition.total, ")"] })] }), _jsx(Box, { marginBottom: 1, children: _jsx(SearchBox, { query: searchQuery, isFocused: isSearchMode, isTerminalFocused: isTerminalFocused, width: terminalWidth - 4, cursorOffset: searchCursorOffset }) }), warning && _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: "warning", children: [figures.warning, " ", warning] }) }), filteredPlugins.length === 0 && searchQuery && _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["No plugins match \"", searchQuery, "\""] }) }), pagination.scrollPosition.canScrollUp && _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [" ", figures.arrowUp, " more above"] }) }), visiblePlugins.map((plugin_5, visibleIndex) => {
                const actualIndex = pagination.toActualIndex(visibleIndex);
                const isSelected = selectedIndex === actualIndex;
                const isSelectedForInstall = selectedForInstall.has(plugin_5.pluginId);
                const isInstallingThis = installingPlugins.has(plugin_5.pluginId);
                const isLast = visibleIndex === visiblePlugins.length - 1;
                return _jsxs(Box, { flexDirection: "column", marginBottom: isLast && !error ? 0 : 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: isSelected && !isSearchMode ? 'suggestion' : undefined, children: [isSelected && !isSearchMode ? figures.pointer : ' ', ' '] }), _jsxs(Text, { children: [isInstallingThis ? figures.ellipsis : isSelectedForInstall ? figures.radioOn : figures.radioOff, ' ', plugin_5.entry.name, _jsxs(Text, { dimColor: true, children: [" \u00B7 ", plugin_5.marketplaceName] }), plugin_5.entry.tags?.includes('community-managed') && _jsx(Text, { dimColor: true, children: " [Community Managed]" }), installCounts && plugin_5.marketplaceName === OFFICIAL_MARKETPLACE_NAME && _jsxs(Text, { dimColor: true, children: [' · ', formatInstallCount(installCounts.get(plugin_5.pluginId) ?? 0), ' ', "installs"] })] })] }), plugin_5.entry.description && _jsx(Box, { marginLeft: 4, children: _jsx(Text, { dimColor: true, children: truncateToWidth(plugin_5.entry.description, 60) }) })] }, `${pagination.startIndex}-${plugin_5.pluginId}`);
            }), pagination.scrollPosition.canScrollDown && _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [" ", figures.arrowDown, " more below"] }) }), error && _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "error", children: [figures.cross, " ", error] }) }), _jsx(DiscoverPluginsKeyHint, { hasSelection: selectedForInstall.size > 0, canToggle: selectedIndex < filteredPlugins.length && !filteredPlugins[selectedIndex]?.isInstalled })] });
}
function DiscoverPluginsKeyHint(t0) {
    const $ = _c(10);
    const { hasSelection, canToggle } = t0;
    let t1;
    if ($[0] !== hasSelection) {
        t1 = hasSelection && _jsx(ConfigurableShortcutHint, { action: "plugin:install", context: "Plugin", fallback: "i", description: "install", bold: true });
        $[0] = hasSelection;
        $[1] = t1;
    }
    else {
        t1 = $[1];
    }
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = _jsx(Text, { children: "type to search" });
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== canToggle) {
        t3 = canToggle && _jsx(ConfigurableShortcutHint, { action: "plugin:toggle", context: "Plugin", fallback: "Space", description: "toggle" });
        $[3] = canToggle;
        $[4] = t3;
    }
    else {
        t3 = $[4];
    }
    let t4;
    let t5;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(ConfigurableShortcutHint, { action: "select:accept", context: "Select", fallback: "Enter", description: "details" });
        t5 = _jsx(ConfigurableShortcutHint, { action: "confirm:no", context: "Confirmation", fallback: "Esc", description: "back" });
        $[5] = t4;
        $[6] = t5;
    }
    else {
        t4 = $[5];
        t5 = $[6];
    }
    let t6;
    if ($[7] !== t1 || $[8] !== t3) {
        t6 = _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [t1, t2, t3, t4, t5] }) }) });
        $[7] = t1;
        $[8] = t3;
        $[9] = t6;
    }
    else {
        t6 = $[9];
    }
    return t6;
}
/**
 * Context-aware empty state message for the Discover screen
 */
function EmptyStateMessage(t0) {
    const $ = _c(6);
    const { reason } = t0;
    switch (reason) {
        case "git-not-installed":
            {
                let t1;
                if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "Git is required to install marketplaces." }), _jsx(Text, { dimColor: true, children: "Please install git and restart Claude Code." })] });
                    $[0] = t1;
                }
                else {
                    t1 = $[0];
                }
                return t1;
            }
        case "all-blocked-by-policy":
            {
                let t1;
                if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "Your organization policy does not allow any external marketplaces." }), _jsx(Text, { dimColor: true, children: "Contact your administrator." })] });
                    $[1] = t1;
                }
                else {
                    t1 = $[1];
                }
                return t1;
            }
        case "policy-restricts-sources":
            {
                let t1;
                if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "Your organization restricts which marketplaces can be added." }), _jsx(Text, { dimColor: true, children: "Switch to the Marketplaces tab to view allowed sources." })] });
                    $[2] = t1;
                }
                else {
                    t1 = $[2];
                }
                return t1;
            }
        case "all-marketplaces-failed":
            {
                let t1;
                if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "Failed to load marketplace data." }), _jsx(Text, { dimColor: true, children: "Check your network connection." })] });
                    $[3] = t1;
                }
                else {
                    t1 = $[3];
                }
                return t1;
            }
        case "all-plugins-installed":
            {
                let t1;
                if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "All available plugins are already installed." }), _jsx(Text, { dimColor: true, children: "Check for new plugins later or add more marketplaces." })] });
                    $[4] = t1;
                }
                else {
                    t1 = $[4];
                }
                return t1;
            }
        case "no-marketplaces-configured":
        default:
            {
                let t1;
                if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
                    t1 = _jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: "No plugins available." }), _jsx(Text, { dimColor: true, children: "Add a marketplace first using the Marketplaces tab." })] });
                    $[5] = t1;
                }
                else {
                    t1 = $[5];
                }
                return t1;
            }
    }
}
