export class ColorDiff {
    hunk;
    filePath;
    firstLine;
    prefixContent;
    constructor(hunk, firstLine, filePath, prefixContent) {
        this.hunk = hunk;
        this.filePath = filePath;
        this.firstLine = firstLine;
        this.prefixContent = prefixContent ?? null;
    }
    render(themeName, width, dim) {
        return null;
    }
}
export class ColorFile {
    code;
    filePath;
    constructor(code, filePath) {
        this.code = code;
        this.filePath = filePath;
    }
    render(themeName, width, dim) {
        return null;
    }
}
export function getSyntaxTheme(themeName) {
    return { theme: themeName, source: null };
}
