import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { Select } from '../CustomSelect/select.js';
import { PermissionDialog } from '../permissions/PermissionDialog.js';
const AUTO_DISMISS_MS = 30_000;
export function LspRecommendationMenu({ pluginName, pluginDescription, fileExtension, onResponse }) {
    // Use ref to avoid timer reset when onResponse changes
    const onResponseRef = React.useRef(onResponse);
    onResponseRef.current = onResponse;
    // 30-second auto-dismiss timer - counts as ignored (no)
    React.useEffect(() => {
        const timeoutId = setTimeout(ref => ref.current('no'), AUTO_DISMISS_MS, onResponseRef);
        return () => clearTimeout(timeoutId);
    }, []);
    function onSelect(value) {
        switch (value) {
            case 'yes':
                onResponse('yes');
                break;
            case 'no':
                onResponse('no');
                break;
            case 'never':
                onResponse('never');
                break;
            case 'disable':
                onResponse('disable');
                break;
        }
    }
    const options = [{
            label: _jsxs(Text, { children: ["Yes, install ", _jsx(Text, { bold: true, children: pluginName })] }),
            value: 'yes'
        }, {
            label: 'No, not now',
            value: 'no'
        }, {
            label: _jsxs(Text, { children: ["Never for ", _jsx(Text, { bold: true, children: pluginName })] }),
            value: 'never'
        }, {
            label: 'Disable all LSP recommendations',
            value: 'disable'
        }];
    return _jsx(PermissionDialog, { title: "LSP Plugin Recommendation", children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "LSP provides code intelligence like go-to-definition and error checking" }) }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Plugin:" }), _jsxs(Text, { children: [" ", pluginName] })] }), pluginDescription && _jsx(Box, { children: _jsx(Text, { dimColor: true, children: pluginDescription }) }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Triggered by:" }), _jsxs(Text, { children: [" ", fileExtension, " files"] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Would you like to install this LSP plugin?" }) }), _jsx(Box, { children: _jsx(Select, { options: options, onChange: onSelect, onCancel: () => onResponse('no') }) })] }) });
}
