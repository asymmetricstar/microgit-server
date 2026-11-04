/** An error that maps directly onto an HTTP response. */
export class RepoError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'RepoError';
    }
}
/** True for values a caller left out: `undefined`, `null` or a blank string. */
export function isBlank(value) {
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}
//# sourceMappingURL=errors.js.map