# 성능 최적화 가이드: Vite manualChunks, 이미지, Service Worker

이 문서는 ChipBlockCrush 프로젝트의 **Vite manualChunks**, **이미지 최적화**, **Service Worker 캐시**에 대해 상세히 설명합니다.

### 적용 현황 (구현 완료)

- **Vite manualChunks**: 함수형 + `game` 청크 적용 (`vite.config.ts`)
- **이미지**: 로고에 `<picture>` + WebP 소스 + PNG fallback, `fetchPriority="high"`, `decoding="async"` 적용 (Header, MenuScreen). WebP 생성: `npm run image:webp` (선택, sharp 필요)
- **Service Worker**: Precache(빌드 시 dist 전체 URL 목록 주입) + 전략 분리(에셋은 Cache First, HTML·기타는 Network First). `patch-sw.js`에서 `__PRECACHE_URLS__` 치환

---

## 1. Vite manualChunks

### 1.1 역할

`manualChunks`는 Rollup(Vite 빌드 엔진)에게 **어떤 npm 패키지를 어떤 JS 파일(청크)로 묶을지** 지정합니다.

- **목적**: 번들을 여러 파일로 나누어
  - **캐시 활용**: React 등 자주 안 바뀌는 코드는 별도 청크 → 버전 업해도 사용자 캐시가 유지될 수 있음
  - **병렬 로딩**: 브라우저가 여러 스크립트를 동시에 받을 수 있음
  - **lazy 로딩과 조합**: 화면별로 다른 청크를 로드해 초기 로딩 시간 단축

### 1.2 현재 설정 (vite.config.ts) — 함수형 + game 청크 적용됨

```js
manualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("react-dom") || id.includes("react/")) return "vendor";
    if (id.includes("react-helmet-async")) return "helmet";
  }
  if (
    id.includes("GameScreen") ||
    id.includes("BlockCrushCanvas") ||
    id.includes("gameLogic")
  ) {
    return "game";
  }
},
```

| 청크 이름 | 포함 패키지        | 용도                                         |
| --------- | ------------------ | -------------------------------------------- |
| `vendor`  | react, react-dom   | 앱 전반에서 쓰이므로 따로 분리해 캐시·재사용 |
| `helmet`  | react-helmet-async | SEO용, 별도 청크로 분리                      |

### 1.3 추가 권장: 게임 청크

게임 화면(GameScreen + BlockCrushCanvas + gameLogic)은 **게임에 들어갈 때만** 필요하므로, 게임 관련 코드를 한 청크로 묶으면:

- **초기 로딩**: 메뉴·가이드 등에 필요한 코드만 로드
- **캐시**: 게임 로직만 수정해도 vendor·helmet 청크는 그대로 캐시 가능

**방법 1 – 수동으로 패키지만 나누기 (현재 구조에 맞음)**

```js
manualChunks: {
  vendor: ["react", "react-dom"],
  helmet: ["react-helmet-async"],
  // 게임 화면 lazy 시 해당 청크가 자동으로 생성되므로
  // 패키지가 없다면 생략 가능
},
```

**방법 2 – 함수로 경로 기준 분리 (고급)**

```js
manualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("react-dom") || id.includes("react/")) return "vendor";
    if (id.includes("react-helmet-async")) return "helmet";
  }
  // 게임·캔버스·게임로직을 하나의 청크로
  if (
    id.includes("GameScreen") ||
    id.includes("BlockCrushCanvas") ||
    id.includes("gameLogic")
  ) {
    return "game";
  }
},
```

- `game` 청크는 **게임 화면을 lazy 로드할 때** 해당 경로들이 같이 묶여 나갑니다.
- 이미 `React.lazy`로 GameScreen을 나눴다면, 별도 `manualChunks` 없이도 게임 코드는 다른 청크로 나뉩니다.

### 1.4 정리

- **지금도**: `vendor`, `helmet`로 React·Helmet이 분리되어 있어 캐시·로딩 측면에서 유리합니다.
- **추가하고 싶다면**: 위와 같이 `manualChunks(id)`에서 `GameScreen`/`BlockCrushCanvas`/`gameLogic`을 `"game"`으로 묶어 주면, 게임 전용 청크가 명확해집니다.

---

## 2. 이미지 최적화

### 2.1 현재 이미지 사용 현황

| 파일                      | 용도              | 사용 위치                 |
| ------------------------- | ----------------- | ------------------------- |
| `ChipGames_Logo.png`      | 로고              | MenuScreen, Header        |
| `ChipGames_favicon-*.png` | 파비콘·PWA 아이콘 | index.html, manifest.json |
| `favicon.svg`             | 파비콘 (SVG)      | index.html                |

로고는 `public`에 있는 단일 PNG를 `BASE_URL`로 참조하고 있습니다.

### 2.2 최적화 방향

#### (1) 포맷: WebP / AVIF

- **WebP**: PNG 대비 25–35% 정도 용량 감소가 흔함. 브라우저 지원 매우 좋음.
- **AVIF**: WebP보다 더 줄일 수 있으나 인코딩/디코딩 비용·구형 브라우저 지원을 고려해야 함.

**적용 방법**

- **빌드 타임**: Vite 플러그인으로 `public` 또는 `src/assets`의 PNG를 WebP(·AVIF)로 변환
  - 예: `vite-plugin-imagemin`, `rollup-plugin-image-minifier` 등
- **수동**: 기존 PNG를 WebP로 변환해 `public`에 두고, 아래처럼 `<picture>`로 제공

```html
<picture>
  <source srcset="/ChipBlockCrush/ChipGames_Logo.webp" type="image/webp" />
  <img src="/ChipBlockCrush/ChipGames_Logo.png" alt="CHIP GAMES" />
</picture>
```

React에서는 `import.meta.env.BASE_URL`을 그대로 쓰면 됩니다.

#### (2) 지연 로딩 (loading="lazy")

- **첫 화면에 안 보이는 이미지**에만 사용하는 것이 좋습니다.
- 로고는 보통 **LCP(가장 큰 콘텐츠)**에 해당하므로 **lazy 하지 않는 것**이 권장됩니다.
- 가이드/소개 화면 등에 나중에 추가하는 이미지가 있다면 `loading="lazy"`를 붙이면 됩니다.

```jsx
<img src="..." alt="..." loading="lazy" decoding="async" />
```

#### (3) 크기·해상도

- **반응형**: 다른 해상도에 맞춰 여러 크기의 로고를 두고 `srcset`으로 선택할 수 있습니다.

```html
<img
  src="/ChipBlockCrush/ChipGames_Logo.png"
  srcset="
    /ChipBlockCrush/ChipGames_Logo-240.png 240w,
    /ChipBlockCrush/ChipGames_Logo-480.png 480w,
    /ChipBlockCrush/ChipGames_Logo.png     800w
  "
  sizes="(max-width: 480px) 240px, (max-width: 800px) 480px, 800px"
  alt="CHIP GAMES"
/>
```

- **고해상도(DPR)**: `srcset`에 `1x`, `2x`를 두어 레티나 대응도 가능합니다.

#### (4) PWA·파비콘

- `manifest.json`의 192x192, 512x512 PNG는 **이미 적절한 크기**로 두는 것이 좋습니다.
- 필요하면 동일 아이콘을 WebP로도 만들어 `<link rel="icon">`에 type으로 지정할 수 있으나, 브라우저 호환성을 위해 PNG 유지가 무난합니다.

### 2.3 구현 우선순위 제안

1. **로고 WebP 추가**: `ChipGames_Logo.png` → `ChipGames_Logo.webp` 변환 후 `<picture>` 또는 한 개 img에 `srcset`으로 WebP 우선 사용.
2. **로고는 lazy 제외**: LCP 요소이므로 `loading="lazy"` 사용하지 않기.
3. **추가 이미지**: 이후 가이드/배너 등 이미지를 넣을 때는 `loading="lazy"` + 필요 시 WebP/작은 크기 버전 추가.

---

## 3. Service Worker 캐시

### 3.1 현재 동작 (public/sw.js)

- **캐시 이름**: `chipblockcrush-v__BUILD_VERSION__`  
  → 빌드 후 `scripts/patch-sw.js`가 `__BUILD_VERSION__`을 `package.json` 버전으로 치환합니다. (예: `chipblockcrush-v1.0.6`)

- **install**
  - 새 SW가 설치될 때 `self.registration.scope`(앱 진입점 URL) 한 개만 캐시에 넣습니다.
  - `skipWaiting()`으로 새 SW가 곧바로 활성화됩니다.

- **activate**
  - 이전 버전의 캐시 이름(`CACHE_NAME`이 아닌 것)을 모두 삭제합니다.
  - `clients.claim()`으로 열린 페이지를 즉시 새 SW가 제어합니다.

- **fetch**
  - **우선**: 항상 네트워크 요청(`fetch(event.request)`).
  - **성공(200, basic)**이면 응답을 복제해 현재 `CACHE_NAME` 캐시에 넣습니다. (런타임 캐시)
  - **실패**하면 캐시를 찾고, 없으면 navigate 요청일 때 `registration.scope`(진입점)를 반환하거나 504 Offline 응답을 반환합니다.

즉, **“네트워크 우선 + 실패 시 캐시”** 전략입니다.

### 3.2 캐시 전략 비교

| 전략                       | 동작                                        | 적합한 용도                       |
| -------------------------- | ------------------------------------------- | --------------------------------- |
| **Network First (현재)**   | 먼저 네트워크, 실패 시 캐시                 | HTML, API, 최신성이 중요한 리소스 |
| **Cache First**            | 먼저 캐시, 없으면 네트워크                  | 버전이 바뀌는 JS/CSS, 아이콘 등   |
| **Stale-While-Revalidate** | 캐시를 먼저 반환하고 뒤에서 네트워크로 갱신 | 빠른 표시 + 점진적 업데이트       |
| **Network Only**           | 캐시 사용 안 함                             | 실시간 데이터, 광고 등            |

현재는 **HTML·스크립트·이미지 전부** Network First라, 오프라인에서는 한 번이라도 성공한 요청만 재생할 수 있습니다.

### 3.3 개선 방향

#### (1) 빌드 결과(JS/CSS/이미지)를 설치 시 캐시 (Precache)

- **목적**: 두 번째 방문부터는 JS/CSS/에셋을 캐시에서 바로 로드해 체감 속도 향상.
- **방법**:
  - Vite 플러그인 `vite-plugin-pwa`(Workbox 기반)를 쓰면, 빌드 시 생성되는 `dist` 목록을 SW가 자동으로 precache합니다.
  - 또는 `patch-sw.js` 대신 빌드 시점에 `dist` 파일 목록을 읽어 `install`에서 `cache.addAll([...])`로 넣는 스크립트를 만들어 쓸 수 있습니다.

#### (2) 캐시 전략 분리

- **HTML / 최상위 문서**:
  - 현재처럼 Network First 유지하면, 새 버전 배포 시 최신 HTML을 받고 새 JS/CSS를 요청하게 됩니다.
- **JS / CSS / 채널링된 에셋**:
  - 파일명에 해시가 붙어 있으므로 **Cache First**로 두어도 됩니다.
  - 새 배포 시 HTML만 바뀌고 새 파일명이 참조되므로, 오래된 캐시는 자연스럽게 안 쓰입니다.

예시 (개념):

```js
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // JS/CSS/이미지: 캐시 우선 (파일명에 해시 있음)
  if (
    url.pathname.startsWith(self.registration.scope + "assets/") ||
    /\.(js|css|png|webp|ico|svg)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res?.ok && res.type === "basic") {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // HTML·기타: 네트워크 우선 (현재와 동일)
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res?.ok && res.type === "basic") {
          const clone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(
            (cached) =>
              cached ||
              (event.request.mode === "navigate"
                ? caches.match(self.registration.scope)
                : null) ||
              new Response(null, { status: 504, statusText: "Offline" }),
          ),
      ),
  );
});
```

- 실제로는 `CACHE_NAME`·scope 경로(`/ChipBlockCrush/`)에 맞게 조건을 조정해야 합니다.

#### (3) 캐시 버전 관리 (현재 유지)

- `CACHE_NAME`에 버전을 넣고, `activate`에서 구 캐시를 삭제하는 방식은 **그대로 두는 것**이 좋습니다.
- `patch-sw.js`로 배포마다 버전이 바뀌어, 예전 에셋이 오래 남지 않습니다.

#### (4) 외부 요청(광고 등)은 그대로 통과

- `event.request.url`이 `self.registration.scope` 밖이면 **캐시에 넣지 않고** 그냥 `fetch`만 하거나, 현재처럼 GET만 처리하는 수준으로 두면 됩니다.
- 광고·분석은 캐시하지 않는 것이 일반적입니다.

### 3.4 정리

- **현재**: 버전별 캐시 이름 + Network First + 오프라인 시 scope/캐시 폴백으로, 동작은 안정적입니다.
- **개선 시**:
  1. **Precache**: 빌드 산출물을 install 시 한 번에 캐시(플러그인 또는 커스텀 스크립트).
  2. **전략 분리**: 에셋(JS/CSS/이미지)은 Cache First, HTML은 Network First.
  3. **버전·정리**: 지금처럼 `CACHE_NAME` + activate에서 구 캐시 삭제 유지.

---

## 4. 요약 표

| 항목             | 현재                       | 권장                                              |
| ---------------- | -------------------------- | ------------------------------------------------- |
| **manualChunks** | vendor(react), helmet      | 필요 시 game 청크 추가(함수 형태로 경로 분리)     |
| **이미지**       | PNG 로고·파비콘            | 로고 WebP 추가 + picture/srcset, 로고는 lazy 제외 |
| **SW 캐시**      | Network First, 버전별 이름 | Precache(선택) + 에셋은 Cache First로 분리(선택)  |

원하시면 **manualChunks 함수 버전**, **로고 WebP 적용 예시(JSX)**, **sw.js 전체 수정 예시** 중 필요한 부분만 골라서 코드로 정리해 드리겠습니다.
