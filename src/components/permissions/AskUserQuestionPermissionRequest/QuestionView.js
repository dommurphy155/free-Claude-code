import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import React, { useState } from 'react';
import { Box, Text } from '../../../ink.js';
import { useAppState } from '../../../state/AppState.js';
import { getExternalEditor } from '../../../utils/editor.js';
import { toIDEDisplayName } from '../../../utils/ide.js';
import { editPromptInEditor } from '../../../utils/promptEditor.js';
import { Select, SelectMulti } from '../../CustomSelect/index.js';
import { Divider } from '../../design-system/Divider.js';
import { FilePathLink } from '../../FilePathLink.js';
import { PermissionRequestTitle } from '../PermissionRequestTitle.js';
import { PreviewQuestionView } from './PreviewQuestionView.js';
import { QuestionNavigationBar } from './QuestionNavigationBar.js';
export function QuestionView(t0) {
    const $ = _c(114);
    const { question, questions, currentQuestionIndex, answers, questionStates, hideSubmitTab: t1, planFilePath, minContentHeight, minContentWidth, onUpdateQuestionState, onAnswer, onTextInputFocus, onCancel, onSubmit, onTabPrev, onTabNext, onRespondToClaude, onFinishPlanInterview, onImagePaste, pastedContents, onRemoveImage } = t0;
    const hideSubmitTab = t1 === undefined ? false : t1;
    const isInPlanMode = useAppState(_temp) === "plan";
    const [isFooterFocused, setIsFooterFocused] = useState(false);
    const [footerIndex, setFooterIndex] = useState(0);
    const [isOtherFocused, setIsOtherFocused] = useState(false);
    let t2;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        const editor = getExternalEditor();
        t2 = editor ? toIDEDisplayName(editor) : null;
        $[0] = t2;
    }
    else {
        t2 = $[0];
    }
    const editorName = t2;
    let t3;
    if ($[1] !== onTextInputFocus) {
        t3 = value => {
            const isOther = value === "__other__";
            setIsOtherFocused(isOther);
            onTextInputFocus(isOther);
        };
        $[1] = onTextInputFocus;
        $[2] = t3;
    }
    else {
        t3 = $[2];
    }
    const handleFocus = t3;
    let t4;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = () => {
            setIsFooterFocused(true);
        };
        $[3] = t4;
    }
    else {
        t4 = $[3];
    }
    const handleDownFromLastItem = t4;
    let t5;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = () => {
            setIsFooterFocused(false);
        };
        $[4] = t5;
    }
    else {
        t5 = $[4];
    }
    const handleUpFromFooter = t5;
    let t6;
    if ($[5] !== footerIndex || $[6] !== isFooterFocused || $[7] !== isInPlanMode || $[8] !== onCancel || $[9] !== onFinishPlanInterview || $[10] !== onRespondToClaude) {
        t6 = e => {
            if (!isFooterFocused) {
                return;
            }
            if (e.key === "up" || e.ctrl && e.key === "p") {
                e.preventDefault();
                if (footerIndex === 0) {
                    handleUpFromFooter();
                }
                else {
                    setFooterIndex(0);
                }
                return;
            }
            if (e.key === "down" || e.ctrl && e.key === "n") {
                e.preventDefault();
                if (isInPlanMode && footerIndex === 0) {
                    setFooterIndex(1);
                }
                return;
            }
            if (e.key === "return") {
                e.preventDefault();
                if (footerIndex === 0) {
                    onRespondToClaude();
                }
                else {
                    onFinishPlanInterview();
                }
                return;
            }
            if (e.key === "escape") {
                e.preventDefault();
                onCancel();
            }
        };
        $[5] = footerIndex;
        $[6] = isFooterFocused;
        $[7] = isInPlanMode;
        $[8] = onCancel;
        $[9] = onFinishPlanInterview;
        $[10] = onRespondToClaude;
        $[11] = t6;
    }
    else {
        t6 = $[11];
    }
    const handleKeyDown = t6;
    let handleOpenEditor;
    let questionText;
    let t7;
    if ($[12] !== onUpdateQuestionState || $[13] !== question || $[14] !== questionStates) {
        const textOptions = question.options.map(_temp2);
        questionText = question.question;
        const questionState = questionStates[questionText];
        let t8;
        if ($[18] !== onUpdateQuestionState || $[19] !== question.multiSelect || $[20] !== questionText) {
            t8 = async (currentValue, setValue) => {
                const result = await editPromptInEditor(currentValue);
                if (result.content !== null && result.content !== currentValue) {
                    setValue(result.content);
                    onUpdateQuestionState(questionText, {
                        textInputValue: result.content
                    }, question.multiSelect ?? false);
                }
            };
            $[18] = onUpdateQuestionState;
            $[19] = question.multiSelect;
            $[20] = questionText;
            $[21] = t8;
        }
        else {
            t8 = $[21];
        }
        handleOpenEditor = t8;
        const t9 = question.multiSelect ? "Type something" : "Type something.";
        const t10 = questionState?.textInputValue ?? "";
        let t11;
        if ($[22] !== onUpdateQuestionState || $[23] !== question.multiSelect || $[24] !== questionText) {
            t11 = value_0 => {
                onUpdateQuestionState(questionText, {
                    textInputValue: value_0
                }, question.multiSelect ?? false);
            };
            $[22] = onUpdateQuestionState;
            $[23] = question.multiSelect;
            $[24] = questionText;
            $[25] = t11;
        }
        else {
            t11 = $[25];
        }
        let t12;
        if ($[26] !== t10 || $[27] !== t11 || $[28] !== t9) {
            t12 = {
                type: "input",
                value: "__other__",
                label: "Other",
                placeholder: t9,
                initialValue: t10,
                onChange: t11
            };
            $[26] = t10;
            $[27] = t11;
            $[28] = t9;
            $[29] = t12;
        }
        else {
            t12 = $[29];
        }
        const otherOption = t12;
        t7 = [...textOptions, otherOption];
        $[12] = onUpdateQuestionState;
        $[13] = question;
        $[14] = questionStates;
        $[15] = handleOpenEditor;
        $[16] = questionText;
        $[17] = t7;
    }
    else {
        handleOpenEditor = $[15];
        questionText = $[16];
        t7 = $[17];
    }
    const options = t7;
    const hasAnyPreview = !question.multiSelect && question.options.some(_temp3);
    if (hasAnyPreview) {
        let t8;
        if ($[30] !== answers || $[31] !== currentQuestionIndex || $[32] !== hideSubmitTab || $[33] !== minContentHeight || $[34] !== minContentWidth || $[35] !== onAnswer || $[36] !== onCancel || $[37] !== onFinishPlanInterview || $[38] !== onRespondToClaude || $[39] !== onTabNext || $[40] !== onTabPrev || $[41] !== onTextInputFocus || $[42] !== onUpdateQuestionState || $[43] !== question || $[44] !== questionStates || $[45] !== questions) {
            t8 = _jsx(PreviewQuestionView, { question: question, questions: questions, currentQuestionIndex: currentQuestionIndex, answers: answers, questionStates: questionStates, hideSubmitTab: hideSubmitTab, minContentHeight: minContentHeight, minContentWidth: minContentWidth, onUpdateQuestionState: onUpdateQuestionState, onAnswer: onAnswer, onTextInputFocus: onTextInputFocus, onCancel: onCancel, onTabPrev: onTabPrev, onTabNext: onTabNext, onRespondToClaude: onRespondToClaude, onFinishPlanInterview: onFinishPlanInterview });
            $[30] = answers;
            $[31] = currentQuestionIndex;
            $[32] = hideSubmitTab;
            $[33] = minContentHeight;
            $[34] = minContentWidth;
            $[35] = onAnswer;
            $[36] = onCancel;
            $[37] = onFinishPlanInterview;
            $[38] = onRespondToClaude;
            $[39] = onTabNext;
            $[40] = onTabPrev;
            $[41] = onTextInputFocus;
            $[42] = onUpdateQuestionState;
            $[43] = question;
            $[44] = questionStates;
            $[45] = questions;
            $[46] = t8;
        }
        else {
            t8 = $[46];
        }
        return t8;
    }
    let t8;
    if ($[47] !== isInPlanMode || $[48] !== planFilePath) {
        t8 = isInPlanMode && planFilePath && _jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Divider, { color: "inactive" }), _jsxs(Text, { color: "inactive", children: ["Planning: ", _jsx(FilePathLink, { filePath: planFilePath })] })] });
        $[47] = isInPlanMode;
        $[48] = planFilePath;
        $[49] = t8;
    }
    else {
        t8 = $[49];
    }
    let t9;
    if ($[50] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = _jsx(Box, { marginTop: -1, children: _jsx(Divider, { color: "inactive" }) });
        $[50] = t9;
    }
    else {
        t9 = $[50];
    }
    let t10;
    if ($[51] !== answers || $[52] !== currentQuestionIndex || $[53] !== hideSubmitTab || $[54] !== questions) {
        t10 = _jsx(QuestionNavigationBar, { questions: questions, currentQuestionIndex: currentQuestionIndex, answers: answers, hideSubmitTab: hideSubmitTab });
        $[51] = answers;
        $[52] = currentQuestionIndex;
        $[53] = hideSubmitTab;
        $[54] = questions;
        $[55] = t10;
    }
    else {
        t10 = $[55];
    }
    let t11;
    if ($[56] !== question.question) {
        t11 = _jsx(PermissionRequestTitle, { title: question.question, color: "text" });
        $[56] = question.question;
        $[57] = t11;
    }
    else {
        t11 = $[57];
    }
    let t12;
    if ($[58] !== currentQuestionIndex || $[59] !== handleFocus || $[60] !== handleOpenEditor || $[61] !== isFooterFocused || $[62] !== onAnswer || $[63] !== onCancel || $[64] !== onImagePaste || $[65] !== onRemoveImage || $[66] !== onSubmit || $[67] !== onUpdateQuestionState || $[68] !== options || $[69] !== pastedContents || $[70] !== question.multiSelect || $[71] !== question.question || $[72] !== questionStates || $[73] !== questionText || $[74] !== questions.length) {
        t12 = _jsx(Box, { marginTop: 1, children: question.multiSelect ? _jsx(SelectMulti, { options: options, defaultValue: questionStates[question.question]?.selectedValue, onChange: values => {
                    onUpdateQuestionState(questionText, {
                        selectedValue: values
                    }, true);
                    const textInput = values.includes("__other__") ? questionStates[questionText]?.textInputValue : undefined;
                    const finalValues = values.filter(_temp4).concat(textInput ? [textInput] : []);
                    onAnswer(questionText, finalValues, undefined, false);
                }, onFocus: handleFocus, onCancel: onCancel, submitButtonText: currentQuestionIndex === questions.length - 1 ? "Submit" : "Next", onSubmit: onSubmit, onDownFromLastItem: handleDownFromLastItem, isDisabled: isFooterFocused, onOpenEditor: handleOpenEditor, onImagePaste: onImagePaste, pastedContents: pastedContents, onRemoveImage: onRemoveImage }, question.question) : _jsx(Select, { options: options, defaultValue: questionStates[question.question]?.selectedValue, onChange: value_1 => {
                    onUpdateQuestionState(questionText, {
                        selectedValue: value_1
                    }, false);
                    const textInput_0 = value_1 === "__other__" ? questionStates[questionText]?.textInputValue : undefined;
                    onAnswer(questionText, value_1, textInput_0);
                }, onFocus: handleFocus, onCancel: onCancel, onDownFromLastItem: handleDownFromLastItem, isDisabled: isFooterFocused, layout: "compact-vertical", onOpenEditor: handleOpenEditor, onImagePaste: onImagePaste, pastedContents: pastedContents, onRemoveImage: onRemoveImage }, question.question) });
        $[58] = currentQuestionIndex;
        $[59] = handleFocus;
        $[60] = handleOpenEditor;
        $[61] = isFooterFocused;
        $[62] = onAnswer;
        $[63] = onCancel;
        $[64] = onImagePaste;
        $[65] = onRemoveImage;
        $[66] = onSubmit;
        $[67] = onUpdateQuestionState;
        $[68] = options;
        $[69] = pastedContents;
        $[70] = question.multiSelect;
        $[71] = question.question;
        $[72] = questionStates;
        $[73] = questionText;
        $[74] = questions.length;
        $[75] = t12;
    }
    else {
        t12 = $[75];
    }
    let t13;
    if ($[76] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = _jsx(Divider, { color: "inactive" });
        $[76] = t13;
    }
    else {
        t13 = $[76];
    }
    let t14;
    if ($[77] !== footerIndex || $[78] !== isFooterFocused) {
        t14 = isFooterFocused && footerIndex === 0 ? _jsx(Text, { color: "suggestion", children: figures.pointer }) : _jsx(Text, { children: " " });
        $[77] = footerIndex;
        $[78] = isFooterFocused;
        $[79] = t14;
    }
    else {
        t14 = $[79];
    }
    const t15 = isFooterFocused && footerIndex === 0 ? "suggestion" : undefined;
    const t16 = options.length + 1;
    let t17;
    if ($[80] !== t15 || $[81] !== t16) {
        t17 = _jsxs(Text, { color: t15, children: [t16, ". Chat about this"] });
        $[80] = t15;
        $[81] = t16;
        $[82] = t17;
    }
    else {
        t17 = $[82];
    }
    let t18;
    if ($[83] !== t14 || $[84] !== t17) {
        t18 = _jsxs(Box, { flexDirection: "row", gap: 1, children: [t14, t17] });
        $[83] = t14;
        $[84] = t17;
        $[85] = t18;
    }
    else {
        t18 = $[85];
    }
    let t19;
    if ($[86] !== footerIndex || $[87] !== isFooterFocused || $[88] !== isInPlanMode || $[89] !== options.length) {
        t19 = isInPlanMode && _jsxs(Box, { flexDirection: "row", gap: 1, children: [isFooterFocused && footerIndex === 1 ? _jsx(Text, { color: "suggestion", children: figures.pointer }) : _jsx(Text, { children: " " }), _jsxs(Text, { color: isFooterFocused && footerIndex === 1 ? "suggestion" : undefined, children: [options.length + 2, ". Skip interview and plan immediately"] })] });
        $[86] = footerIndex;
        $[87] = isFooterFocused;
        $[88] = isInPlanMode;
        $[89] = options.length;
        $[90] = t19;
    }
    else {
        t19 = $[90];
    }
    let t20;
    if ($[91] !== t18 || $[92] !== t19) {
        t20 = _jsxs(Box, { flexDirection: "column", children: [t13, t18, t19] });
        $[91] = t18;
        $[92] = t19;
        $[93] = t20;
    }
    else {
        t20 = $[93];
    }
    let t21;
    if ($[94] !== questions.length) {
        t21 = questions.length === 1 ? _jsxs(_Fragment, { children: [figures.arrowUp, "/", figures.arrowDown, " to navigate"] }) : "Tab/Arrow keys to navigate";
        $[94] = questions.length;
        $[95] = t21;
    }
    else {
        t21 = $[95];
    }
    let t22;
    if ($[96] !== isOtherFocused) {
        t22 = isOtherFocused && editorName && _jsxs(_Fragment, { children: [" \u00B7 ctrl+g to edit in ", editorName] });
        $[96] = isOtherFocused;
        $[97] = t22;
    }
    else {
        t22 = $[97];
    }
    let t23;
    if ($[98] !== t21 || $[99] !== t22) {
        t23 = _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "inactive", dimColor: true, children: ["Enter to select \u00B7", " ", t21, t22, " ", "\u00B7 Esc to cancel"] }) });
        $[98] = t21;
        $[99] = t22;
        $[100] = t23;
    }
    else {
        t23 = $[100];
    }
    let t24;
    if ($[101] !== minContentHeight || $[102] !== t12 || $[103] !== t20 || $[104] !== t23) {
        t24 = _jsxs(Box, { flexDirection: "column", minHeight: minContentHeight, children: [t12, t20, t23] });
        $[101] = minContentHeight;
        $[102] = t12;
        $[103] = t20;
        $[104] = t23;
        $[105] = t24;
    }
    else {
        t24 = $[105];
    }
    let t25;
    if ($[106] !== t10 || $[107] !== t11 || $[108] !== t24) {
        t25 = _jsxs(Box, { flexDirection: "column", paddingTop: 0, children: [t10, t11, t24] });
        $[106] = t10;
        $[107] = t11;
        $[108] = t24;
        $[109] = t25;
    }
    else {
        t25 = $[109];
    }
    let t26;
    if ($[110] !== handleKeyDown || $[111] !== t25 || $[112] !== t8) {
        t26 = _jsxs(Box, { flexDirection: "column", marginTop: 0, tabIndex: 0, autoFocus: true, onKeyDown: handleKeyDown, children: [t8, t9, t25] });
        $[110] = handleKeyDown;
        $[111] = t25;
        $[112] = t8;
        $[113] = t26;
    }
    else {
        t26 = $[113];
    }
    return t26;
}
function _temp4(v) {
    return v !== "__other__";
}
function _temp3(opt_0) {
    return opt_0.preview;
}
function _temp2(opt) {
    return {
        type: "text",
        value: opt.label,
        label: opt.label,
        description: opt.description
    };
}
function _temp(s) {
    return s.toolPermissionContext.mode;
}
