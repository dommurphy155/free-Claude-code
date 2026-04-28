const memory = {
    type: 'local-jsx',
    name: 'memory',
    description: 'Edit Claude memory files',
    load: () => import('./memory.js'),
};
export default memory;
