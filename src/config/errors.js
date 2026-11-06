export class RepoError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'RepoError';
    }
}
export function isBlank(value) {
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}
//# sourceMappingURL=errors.js.map