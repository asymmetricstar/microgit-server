import { getSettings } from './settings.js';
export function motd() {
    const value = getSettings().motd;
    return value.trim() === '' ? null : value;
}
//# sourceMappingURL=motd.js.map