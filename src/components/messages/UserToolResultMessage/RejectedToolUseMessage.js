import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Text } from '../../../ink.js';
import { MessageResponse } from '../../MessageResponse.js';
export function RejectedToolUseMessage() {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(MessageResponse, { height: 1, children: _jsx(Text, { dimColor: true, children: "Tool use rejected" }) });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
