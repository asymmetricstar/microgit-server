import { getSettings } from './settings.js';
export function motd() {
    const value = getSettings().motd;
    return value.trim() === '' ? null : value;
}
/** Same, but a missing or expired session is a 401 instead of `null`. */
//# sourceMappingURL=motd.js.map