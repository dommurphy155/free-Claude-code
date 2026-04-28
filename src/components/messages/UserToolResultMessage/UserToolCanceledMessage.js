import { jsx as _jsx } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { InterruptedByUser } from 'src/components/InterruptedByUser.js';
import { MessageResponse } from 'src/components/MessageResponse.js';
export function UserToolCanceledMessage() {
    const $ = _c(1);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = _jsx(MessageResponse, { height: 1, children: _jsx(InterruptedByUser, {}) });
        $[0] = t0;
    }
    else {
        t0 = $[0];
    }
    return t0;
}
