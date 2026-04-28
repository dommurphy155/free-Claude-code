import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { logEvent } from 'src/services/analytics/index.js';
import { Box, Text } from '../../ink.js';
import { FeedbackSurveyView, isValidResponseInput } from './FeedbackSurveyView.js';
import { TranscriptSharePrompt } from './TranscriptSharePrompt.js';
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js';
export function FeedbackSurvey(t0) {
    const $ = _c(16);
    const { state, lastResponse, handleSelect, handleTranscriptSelect, inputValue, setInputValue, onRequestFeedback, message } = t0;
    if (state === "closed") {
        return null;
    }
    if (state === "thanks") {
        let t1;
        if ($[0] !== inputValue || $[1] !== lastResponse || $[2] !== onRequestFeedback || $[3] !== setInputValue) {
            t1 = _jsx(FeedbackSurveyThanks, { lastResponse: lastResponse, inputValue: inputValue, setInputValue: setInputValue, onRequestFeedback: onRequestFeedback });
            $[0] = inputValue;
            $[1] = lastResponse;
            $[2] = onRequestFeedback;
            $[3] = setInputValue;
            $[4] = t1;
        }
        else {
            t1 = $[4];
        }
        return t1;
    }
    if (state === "submitted") {
        let t1;
        if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "success", children: ["\u2713", " Thanks for sharing your transcript!"] }) });
            $[5] = t1;
        }
        else {
            t1 = $[5];
        }
        return t1;
    }
    if (state === "submitting") {
        let t1;
        if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            t1 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Sharing transcript", "\u2026"] }) });
            $[6] = t1;
        }
        else {
            t1 = $[6];
        }
        return t1;
    }
    if (state === "transcript_prompt") {
        if (!handleTranscriptSelect) {
            return null;
        }
        if (inputValue && !["1", "2", "3"].includes(inputValue)) {
            return null;
        }
        let t1;
        if ($[7] !== handleTranscriptSelect || $[8] !== inputValue || $[9] !== setInputValue) {
            t1 = _jsx(TranscriptSharePrompt, { onSelect: handleTranscriptSelect, inputValue: inputValue, setInputValue: setInputValue });
            $[7] = handleTranscriptSelect;
            $[8] = inputValue;
            $[9] = setInputValue;
            $[10] = t1;
        }
        else {
            t1 = $[10];
        }
        return t1;
    }
    if (inputValue && !isValidResponseInput(inputValue)) {
        return null;
    }
    let t1;
    if ($[11] !== handleSelect || $[12] !== inputValue || $[13] !== message || $[14] !== setInputValue) {
        t1 = _jsx(FeedbackSurveyView, { onSelect: handleSelect, inputValue: inputValue, setInputValue: setInputValue, message: message });
        $[11] = handleSelect;
        $[12] = inputValue;
        $[13] = message;
        $[14] = setInputValue;
        $[15] = t1;
    }
    else {
        t1 = $[15];
    }
    return t1;
}
const isFollowUpDigit = (char) => char === '1';
function FeedbackSurveyThanks(t0) {
    const $ = _c(12);
    const { lastResponse, inputValue, setInputValue, onRequestFeedback } = t0;
    const showFollowUp = onRequestFeedback && lastResponse === "good";
    const t1 = Boolean(showFollowUp);
    let t2;
    if ($[0] !== lastResponse || $[1] !== onRequestFeedback) {
        t2 = () => {
            logEvent("tengu_feedback_survey_event", {
                event_type: "followup_accepted",
                response: lastResponse
            });
            onRequestFeedback?.();
        };
        $[0] = lastResponse;
        $[1] = onRequestFeedback;
        $[2] = t2;
    }
    else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== inputValue || $[4] !== setInputValue || $[5] !== t1 || $[6] !== t2) {
        t3 = {
            inputValue,
            setInputValue,
            isValidDigit: isFollowUpDigit,
            enabled: t1,
            once: true,
            onDigit: t2
        };
        $[3] = inputValue;
        $[4] = setInputValue;
        $[5] = t1;
        $[6] = t2;
        $[7] = t3;
    }
    else {
        t3 = $[7];
    }
    useDebouncedDigitInput(t3);
    const feedbackCommand = false ? "/issue" : "/feedback";
    let t4;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = _jsx(Text, { color: "success", children: "Thanks for the feedback!" });
        $[8] = t4;
    }
    else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== lastResponse || $[10] !== showFollowUp) {
        t5 = _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [t4, showFollowUp ? _jsxs(Text, { dimColor: true, children: ["(Optional) Press [", _jsx(Text, { color: "ansi:cyan", children: "1" }), "] to tell us what went well ", " \xB7 ", feedbackCommand] }) : lastResponse === "bad" ? _jsx(Text, { dimColor: true, children: "Use /issue to report model behavior issues." }) : _jsxs(Text, { dimColor: true, children: ["Use ", feedbackCommand, " to share detailed feedback anytime."] })] });
        $[9] = lastResponse;
        $[10] = showFollowUp;
        $[11] = t5;
    }
    else {
        t5 = $[11];
    }
    return t5;
}
