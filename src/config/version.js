import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_JSON_PATH = path.resolve(__dirname, "../../package.json");
const DEFAULT_VERSION = "0.0.0";
let SERVER_VERSION = DEFAULT_VERSION;
function readPackageVersion() {
    try {
        const packageJsonData = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
        const packageJson = JSON.parse(packageJsonData);
        if (!packageJson || typeof packageJson.version !== "string") {
            throw new Error("package.json does not contain a valid version string");
        }
        return packageJson.version;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("readPackageVersion: failed to read or parse package.json at", PACKAGE_JSON_PATH, "-", errorMessage);
        return DEFAULT_VERSION;
    }
}
SERVER_VERSION = readPackageVersion();
export { SERVER_VERSION };
//# sourceMappingURL=version.js.map