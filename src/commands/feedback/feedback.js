import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Feedback } from '../../components/Feedback.js';
// Shared function to render the Feedback component
export function renderFeedbackComponent(onDone, abortSignal, messages, initialDescription = '', backgroundTasks = {}) {
    return _jsx(Feedback, { abortSignal: abortSignal, messages: messages, initialDescription: initialDescription, onDone: onDone, backgroundTasks: backgroundTasks });
}
export async function call(onDone, context, args) {
    const initialDescription = args || '';
    return renderFeedbackComponent(onDone, context.abortController.signal, context.messages, initialDescription);
}
