/** Version reported by `/`, `/health`, the `Server` header and the CLI banner. */
import fs from 'node:fs';
import path from 'node:path';
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
export const SERVER_VERSION = packageJson.version;
//# sourceMappingURL=version.js.map