const buddyCommand = {
    type: 'local-jsx',
    name: 'buddy',
    description: 'Meet your companion',
    argumentHint: '[hatch|pet|mute|unmute|info]',
    load: () => import('./buddy.js'),
};
export default buddyCommand;
