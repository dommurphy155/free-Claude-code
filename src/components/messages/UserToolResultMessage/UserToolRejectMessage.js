import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
import { useTheme } from '../../../ink.js';
import { filterToolProgressMessages } from '../../../Tool.js';
import { FallbackToolUseRejectedMessage } from '../../FallbackToolUseRejectedMessage.js';
export function UserToolRejectMessage(t0) {
    const $ = _c(13);
    const { input, progressMessagesForMessage, style, tool, tools, verbose, isTranscriptMode } = t0;
    const { columns } = useTerminalSize();
    const [theme] = useTheme();
    if (!tool || !tool.renderToolUseRejectedMessage) {
        let t1;
        if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = _jsx(FallbackToolUseRejectedMessage, {});
            $[0] = t1;
        }
        else {
            t1 = $[0];
        }
        return t1;
    }
    const t1 = tool.inputSchema;
    let t2;
    let t3;
    if ($[1] !== columns || $[2] !== input || $[3] !== isTranscriptMode || $[4] !== progressMessagesForMessage || $[5] !== style || $[6] !== theme || $[7] !== tool || $[8] !== tools || $[9] !== verbose) {
        t3 = Symbol.for("react.early_return_sentinel");
        bb0: {
            const parsedInput = t1.safeParse(input);
            if (!parsedInput.success) {
                let t4;
                if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
                    t4 = _jsx(FallbackToolUseRejectedMessage, {});
                    $[12] = t4;
                }
                else {
                    t4 = $[12];
                }
                t3 = t4;
                break bb0;
            }
            t2 = tool.renderToolUseRejectedMessage(parsedInput.data, {
                columns,
                messages: [],
                tools,
                verbose,
                progressMessagesForMessage: filterToolProgressMessages(progressMessagesForMessage),
                style,
                theme,
                isTranscriptMode
            }) ?? _jsx(FallbackToolUseRejectedMessage, {});
        }
        $[1] = columns;
        $[2] = input;
        $[3] = isTranscriptMode;
        $[4] = progressMessagesForMessage;
        $[5] = style;
        $[6] = theme;
        $[7] = tool;
        $[8] = tools;
        $[9] = verbose;
        $[10] = t2;
        $[11] = t3;
    }
    else {
        t2 = $[10];
        t3 = $[11];
    }
    if (t3 !== Symbol.for("react.early_return_sentinel")) {
        return t3;
    }
    return t2;
}
