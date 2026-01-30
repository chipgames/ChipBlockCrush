/**
 * 빌드 후 dist/sw.js를 패치합니다.
 * - __BUILD_VERSION__ → package.json 버전 (캐시 이름)
 * - __PRECACHE_URLS__ → dist 내 모든 파일 URL 배열 (Precache)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgPath = join(__dirname, "..", "package.json");
const distDir = join(__dirname, "..", "dist");
const swPath = join(__dirname, "..", "dist", "sw.js");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const version = pkg.version;

const BASE_URL = "/ChipBlockCrush/";

function getFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(full, base));
    } else {
      files.push(relative(base, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

if (!existsSync(swPath)) {
  console.warn("scripts/patch-sw.js: dist/sw.js 없음 (빌드 후 실행하세요)");
  process.exit(0);
}

let sw = readFileSync(swPath, "utf8");
sw = sw.replace(/__BUILD_VERSION__/g, version);

let precacheUrls = [];
if (existsSync(distDir)) {
  precacheUrls = getFiles(distDir).map((f) => BASE_URL + f);
}
sw = sw.replace("__PRECACHE_URLS__", JSON.stringify(precacheUrls));

writeFileSync(swPath, sw);
console.log("sw.js CACHE_NAME → chipblockcrush-v" + version);
console.log("sw.js PRECACHE_URLS → " + precacheUrls.length + " files");
