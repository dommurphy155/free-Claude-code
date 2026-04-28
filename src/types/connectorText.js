export function isConnectorTextBlock(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        value.type === 'connector_text');
}
