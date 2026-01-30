/**
 * public 폴더의 ChipGames_Logo.png를 ChipGames_Logo.webp로 변환합니다.
 * WebP 미지원 브라우저는 <picture> fallback으로 PNG를 사용합니다.
 * 실행: npm run image:webp (또는 node scripts/generate-webp.js)
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const pngPath = join(publicDir, "ChipGames_Logo.png");
const webpPath = join(publicDir, "ChipGames_Logo.webp");

if (!existsSync(pngPath)) {
  console.warn(
    "ChipGames_Logo.png not found in public/, skipping WebP generation.",
  );
  process.exit(0);
}

try {
  const sharp = (await import("sharp")).default;
  await sharp(pngPath).webp({ quality: 85 }).toFile(webpPath);
  console.log("Generated ChipGames_Logo.webp");
} catch (e) {
  if (e.code === "ERR_MODULE_NOT_FOUND" || e.message?.includes("sharp")) {
    console.warn(
      "Optional: install sharp (npm i -D sharp) and run again to generate WebP.",
    );
  } else {
    throw e;
  }
}
