/**
 * 빌드 후 dist/sw.js의 __BUILD_VERSION__을 package.json 버전으로 치환합니다.
 * Service Worker 캐시 이름이 버전별로 바뀌어 배포 시 캐시가 갱신됩니다.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgPath = join(__dirname, "..", "package.json");
const swPath = join(__dirname, "..", "dist", "sw.js");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = pkg.version;

if (!existsSync(swPath)) {
  console.warn("scripts/patch-sw.js: dist/sw.js 없음 (빌드 후 실행하세요)");
  process.exit(0);
}

let sw = readFileSync(swPath, "utf8");
sw = sw.replace(/__BUILD_VERSION__/g, version);
writeFileSync(swPath, sw);
console.log("sw.js CACHE_NAME → chipblockcrush-v" + version);
