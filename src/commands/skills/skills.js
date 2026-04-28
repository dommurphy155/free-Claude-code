import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { SkillsMenu } from '../../components/skills/SkillsMenu.js';
export async function call(onDone, context) {
    return _jsx(SkillsMenu, { onExit: onDone, commands: context.options.commands });
}
