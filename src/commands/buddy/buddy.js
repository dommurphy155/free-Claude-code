import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { getCompanion, roll, rollWithSeed, companionUserId, } from '../../buddy/companion.js';
import { renderSprite } from '../../buddy/sprites.js';
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES, } from '../../buddy/types.js';
import { saveGlobalConfig } from '../../utils/config.js';
function CompanionCard({ onDone, args, setAppState, }) {
    const trimmed = args.trim().toLowerCase();
    const companion = getCompanion();
    // Handle keyboard input to dismiss
    const handleKeyDown = (e) => {
        if (e.key === 'q' || e.key === 'Enter') {
            e.preventDefault();
            onDone();
        }
    };
    // Handle subcommands
    React.useEffect(() => {
        if (trimmed === 'mute') {
            saveGlobalConfig(c => ({ ...c, companionMuted: true }));
            onDone(`${companion?.name ?? 'Companion'} is now muted.`, {
                display: 'system',
            });
            return;
        }
        if (trimmed === 'unmute') {
            saveGlobalConfig(c => ({ ...c, companionMuted: false }));
            onDone(`${companion?.name ?? 'Companion'} says hello!`, {
                display: 'system',
            });
            return;
        }
        if (trimmed === 'pet') {
            if (!companion) {
                onDone('You need to hatch a companion first! Use /buddy hatch', {
                    display: 'system',
                });
                return;
            }
            setAppState((prev) => ({ ...prev, companionPetAt: Date.now() }));
            onDone(`You pet ${companion.name}! ♥`, { display: 'system' });
            return;
        }
        if (trimmed === 'hatch') {
            if (companion) {
                onDone(`You already have ${companion.name}! Use /buddy info to see them.`, { display: 'system' });
                return;
            }
            // Hatch a new companion with a generated name and random seed
            const appearanceSeed = `hatch:${Date.now()}:${Math.random().toString(36).slice(2)}`;
            const { bones } = rollWithSeed(appearanceSeed);
            const adjectives = [
                'Bright', 'Cozy', 'Swift', 'Calm', 'Wise', 'Bold',
                'Fuzzy', 'Lucky', 'Snappy', 'Quirky',
            ];
            const nouns = [
                'Spark', 'Pixel', 'Ember', 'Glitch', 'Byte',
                'Flux', 'Drift', 'Blip', 'Quip', 'Zap',
            ];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const name = `${adj} ${noun}`;
            const soul = {
                name,
                personality: `A ${bones.rarity} ${bones.species} who loves debugging and hanging out.`,
                hatchedAt: Date.now(),
                appearanceSeed,
            };
            saveGlobalConfig(c => ({ ...c, companion: soul }));
            onDone(`✨ You hatched ${name} the ${bones.rarity} ${bones.species}! Say hello!`, { display: 'system' });
            return;
        }
        if (trimmed === 'release') {
            if (!companion) {
                onDone('No companion to release.', { display: 'system' });
                return;
            }
            const name = companion.name;
            saveGlobalConfig(c => {
                const next = { ...c };
                delete next.companion;
                return next;
            });
            onDone(`Goodbye, ${name}! You'll be missed.`, { display: 'system' });
            return;
        }
    }, []);
    // Render companion info
    if (!companion) {
        const { bones } = roll(companionUserId());
        const preview = renderSprite(bones, 0);
        const color = RARITY_COLORS[bones.rarity];
        return (_jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, autoFocus: true, onKeyDown: handleKeyDown, tabIndex: 0, children: [_jsx(Text, { bold: true, children: "You haven't hatched a companion yet!" }), _jsx(Text, { dimColor: true, children: "Here's a preview of yours:" }), _jsxs(Box, { flexDirection: "column", marginY: 1, children: [preview.map((line, i) => (_jsx(Text, { color: color, children: line }, i))), _jsxs(Text, { italic: true, dimColor: true, children: ["A ", bones.rarity, " ", bones.species, " ", RARITY_STARS[bones.rarity]] })] }), _jsxs(Text, { children: ["Run ", _jsx(Text, { bold: true, children: "/buddy hatch" }), " to bring them to life!"] }), _jsxs(Text, { dimColor: true, children: ["Or type ", _jsx(Text, { bold: true, children: "q" }), " to dismiss."] })] }));
    }
    const sprite = renderSprite(companion, 0);
    const color = RARITY_COLORS[companion.rarity];
    return (_jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, autoFocus: true, onKeyDown: handleKeyDown, tabIndex: 0, children: [_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsxs(Box, { flexDirection: "column", children: [sprite.map((line, i) => (_jsx(Text, { color: color, children: line }, i))), _jsx(Text, { italic: true, bold: true, color: color, children: companion.name })] }), _jsxs(Box, { flexDirection: "column", justifyContent: "center", children: [_jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Species:" }), ' ', _jsx(Text, { color: color, children: companion.species })] }), _jsxs(Text, { children: [_jsx(Text, { bold: true, children: "Rarity:" }), ' ', _jsxs(Text, { color: color, children: [companion.rarity, " ", RARITY_STARS[companion.rarity]] })] }), companion.shiny && _jsx(Text, { color: "warning", children: "\u2726 Shiny!" }), _jsx(Text, { dimColor: true, children: '─'.repeat(20) }), _jsx(Text, { bold: true, children: "Stats:" }), STAT_NAMES.map(stat => (_jsxs(Text, { children: [_jsxs(Text, { dimColor: true, children: [stat, ":"] }), ' ', _jsx(Text, { color: color, children: companion.stats[stat] })] }, stat)))] })] }), _jsx(Text, { dimColor: true, children: '─'.repeat(40) }), _jsx(Text, { dimColor: true, children: "/buddy pet \u00B7 /buddy mute \u00B7 /buddy unmute \u00B7 /buddy release" }), _jsx(Text, { dimColor: true, children: "Press q or Enter to dismiss" })] }));
}
export const call = async (onDone, context, args = '') => {
    return (_jsx(CompanionCard, { onDone: onDone, args: args, setAppState: context.setAppState }));
};
