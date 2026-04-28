import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { Select } from '../CustomSelect/select.js';
import { PermissionDialog } from '../permissions/PermissionDialog.js';
const AUTO_DISMISS_MS = 30_000;
export function PluginHintMenu({ pluginName, pluginDescription, marketplaceName, sourceCommand, onResponse }) {
    const onResponseRef = React.useRef(onResponse);
    onResponseRef.current = onResponse;
    React.useEffect(() => {
        const timeoutId = setTimeout(ref => ref.current('no'), AUTO_DISMISS_MS, onResponseRef);
        return () => clearTimeout(timeoutId);
    }, []);
    function onSelect(value) {
        switch (value) {
            case 'yes':
                onResponse('yes');
                break;
            case 'disable':
                onResponse('disable');
                break;
            default:
                onResponse('no');
        }
    }
    const options = [{
            label: _jsxs(Text, { children: ["Yes, install ", _jsx(Text, { bold: true, children: pluginName })] }),
            value: 'yes'
        }, {
            label: 'No',
            value: 'no'
        }, {
            label: "No, and don't show plugin installation hints again",
            value: 'disable'
        }];
    return _jsx(PermissionDialog, { title: "Plugin Recommendation", children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["The ", _jsx(Text, { bold: true, children: sourceCommand }), " command suggests installing a plugin."] }) }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Plugin:" }), _jsxs(Text, { children: [" ", pluginName] })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Marketplace:" }), _jsxs(Text, { children: [" ", marketplaceName] })] }), pluginDescription && _jsx(Box, { children: _jsx(Text, { dimColor: true, children: pluginDescription }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Would you like to install it?" }) }), _jsx(Box, { children: _jsx(Select, { options: options, onChange: onSelect, onCancel: () => onResponse('no') }) })] }) });
}
