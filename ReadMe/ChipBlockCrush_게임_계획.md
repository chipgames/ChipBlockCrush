# ChipBlockCrush 게임 계획서

## 1. 프로젝트 개요

### 1.1 목표

- **ChipBlockCrush**: 블록을 그리드에 배치하고 한 줄(행/열)을 채우면 제거되는 블록 퍼즐 게임 개발
- GitHub Pages 기반 무료 웹 호스팅
- React + Canvas 기반의 반응형 웹 게임
- 다국어·다크/라이트 모드·PWA·SEO·AdSense를 적용한 완성도 높은 서비스

### 1.2 게임명 및 법적 고려

- **게임명**: ChipBlockCrush (독자적 상표로 사용 가능, 상표 검색 권장)
- 게임 규칙·메커니즘은 저작권 대상이 아니며, 그래픽·사운드·UI·코드는 자체 제작으로 진행
- 상세: `ReadMe/BlockCrush_게임_상세_조사.md` 11장 참고

---

## 2. 요구사항 정리 (체크리스트)

| 번호 | 항목             | 내용                                                   |
| ---- | ---------------- | ------------------------------------------------------ |
| 1    | 다국어 지원      | 한국어, 영어, 일본어, 중국어 등                        |
| 2    | 반응형 지원      | 데스크톱·태블릿·모바일 대응                            |
| 3    | 모바일 가로/세로 | 가로·세로 모드 모두 지원, 화면 고정 옵션               |
| 4    | 다크/라이트 모드 | 테마 전환 및 파스텔 톤 적용                            |
| 5    | SEO              | 구글, 네이버, 다음 등 검색 최적화                      |
| 6    | AdSense          | client=ca-pub-2533613198240039                         |
| 7    | 호스팅           | GitHub Pages                                           |
| 8    | 기술 스택        | React + Canvas, Canvas 16:9 고정·반응형                |
| 9    | PWA              | manifest, Service Worker, 오프라인·앱처럼 실행         |
| 10   | 웹 구조          | 첨부 이미지(스테이지 선택 화면) 및 ChipPuzzleGame 참고 |
| 11   | 디자인           | 파스텔 톤                                              |

---

## 3. 웹 구조 (UI/레이아웃)

참고: **첨부 이미지(스테이지 선택 화면)** 및 **D:\vs\ChipGames\ChipPuzzleGame** 구조.

### 3.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  Header (로고, 게임명, 네비, 다크모드, 소리, 언어 선택)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Main (게임하기 / 가이드 / 도움말 / 게임 소개에 따른 콘텐츠)   │
│  - 스테이지 선택: 그리드 + 페이지네이션                       │
│  - 게임 플레이: Canvas (16:9) 영역                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer (개인정보처리방침, 문의하기, 언어, © ChipGames, 버전) │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 화면(스크린) 구성

| 화면              | 설명                                                                    | 참고                       |
| ----------------- | ----------------------------------------------------------------------- | -------------------------- |
| **스테이지 선택** | 스테이지 그리드(예: 50개/페이지), 페이지네이션(1/20 등), 잠금/해제 표시 | 이미지와 동일한 구조       |
| **게임하기**      | Canvas 16:9 영역에서 블록 배치·라인 클리어 플레이                       | Block Crush 메커니즘       |
| **가이드**        | 게임 방법 안내                                                          | ChipPuzzleGame GuideScreen |
| **도움말**        | 자주 묻는 질문 등                                                       | ChipPuzzleGame HelpScreen  |
| **게임 소개**     | 게임·제작자 소개                                                        | ChipPuzzleGame AboutScreen |

### 3.3 헤더 네비게이션

- **게임하기**: 스테이지 선택 또는 직전 플레이 화면
- **가이드**: 플레이 방법
- **도움말**: FAQ 등
- **게임 소개**: 소개 페이지
- 우측: 다크/라이트 토글, 소리 토글, 언어 선택(한국어 등)

### 3.4 반응형·모바일

- **768px 이하**: 햄버거 메뉴 등으로 네비 축약, 스테이지 그리드 열 수 조절
- **모바일**: 터치 드래그로 블록 배치, 가로/세로 모두 지원
- **화면 고정**: 선택 시 가로 또는 세로 고정 (Screen Orientation API, 전체화면 권장)
- **UI 숨김 버튼**: 플레이 시 헤더/푸터 숨김 옵션 (ChipPuzzleGame과 동일 패턴)

---

## 4. 기술 스택 및 구현 방향

### 4.1 기본 스택

| 구분        | 선택                    | 비고                   |
| ----------- | ----------------------- | ---------------------- |
| 프레임워크  | React                   | 함수 컴포넌트 + Hooks  |
| 언어        | TypeScript              | 타입 안정성            |
| 빌드        | Vite                    | 빠른 개발·빌드         |
| 스타일      | CSS (변수·테마)         | 파스텔 톤 변수 정의    |
| 게임 렌더링 | Canvas API              | 블록·그리드·애니메이션 |
| 상태        | useState, useContext 등 | 전역은 필요 시 Context |

### 4.2 Canvas 규격

- **비율**: 16:9 고정
- **반응형**: 뷰포트(또는 컨테이너) 크기에 맞춰 Canvas 크기만 자동 조절, 내부 논리 좌표(그리드)는 유지
- **구현 예**: `canvasConfig.aspectRatio = 16/9`, 컨테이너 크기 측정 후 `width/height`를 16:9로 맞추고, `devicePixelRatio` 적용해 선명도 확보
- ChipPuzzleGame의 `canvasConfig.ts`, `GameCanvas` 패턴 참고

### 4.3 폴더 구조 (ChipPuzzleGame 참고)

```
ChipBlockCrush/
├── public/
│   ├── .nojekyll
│   ├── manifest.json      # PWA
│   ├── sw.js              # Service Worker
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── Ads.txt            # AdSense (필요 시)
│   ├── favicon, icons (192, 512 등)
│   └── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/        # Header, Footer, GameContainer, ErrorBoundary
│   │   ├── screens/       # StageSelectScreen, GuideScreen, HelpScreen, AboutScreen
│   │   ├── game/          # 게임 로직 + Canvas 래퍼
│   │   ├── canvas/        # GameCanvas (16:9, 반응형)
│   │   ├── seo/           # SEOHead
│   │   └── ui/            # LanguageSelector, ThemeToggle
│   ├── constants/         # canvasConfig, gameConfig
│   ├── hooks/             # useLanguage, useTheme, useGameState 등
│   ├── locales/           # ko.json, en.json, ja.json, zh.json
│   ├── styles/            # themes.css (파스텔), App.css
│   ├── types/
│   ├── utils/             # storage, adsense, serviceWorker
│   └── services/         # LanguageService
├── ReadMe/
│   ├── BlockCrush_게임_상세_조사.md
│   └── ChipBlockCrush_게임_계획.md
├── vite.config.ts         # base: '/ChipBlockCrush/' (GitHub Pages)
├── package.json
└── index.html
```

---

## 5. 다국어 지원 (요구 1)

- **대상 언어**: 한국어(ko), 영어(en), 일본어(ja), 중국어(zh) 필수, 추가 언어는 선택
- **방식**: JSON locale 파일(`src/locales/ko.json` 등) + `useLanguage` 훅 + `LanguageSelector` UI
- **URL 연동**: `?lang=ko` 등 쿼리로 언어 유지, SEO hreflang과 연동
- **저장**: 선택 언어를 localStorage 등에 저장해 재방문 시 적용
- ChipPuzzleGame의 `locales/`, `LanguageService`, `LanguageSelector` 구조 재사용 권장

---

## 6. 반응형 지원 (요구 2)

- **미디어 쿼리**: 768px(또는 1024px) 기준으로 헤더·그리드·폰트 크기 조절
- **유동 레이아웃**: flex/grid로 Header·Main·Footer 배치, 스테이지 그리드는 열 개수만 조절 (예: 10열 → 5열)
- **Canvas**: 16:9 비율 유지하며 부모 너비에 맞춰 크기 계산 (max-width: 100%; aspect-ratio: 16/9 활용 가능)
- **터치**: 터치 디바이스에서 블록 드래그·드롭 지원

---

## 7. 모바일 가로/세로 모드 (요구 3)

- **orientation**: `any` 또는 `portrait-primary, portrait-secondary, landscape-primary, landscape-secondary` 지원
- **화면 고정 버튼**: 모바일에서만 표시, Screen Orientation API로 현재 방향 고정/해제 (전체화면 권장)
- **resize/orientationchange**: 이벤트로 Canvas·레이아웃 재계산
- ChipPuzzleGame의 `orientationchange`, `toggleOrientationLock` 로직 참고

---

## 8. 다크 모드 / 라이트 모드 (요구 4)

- **data-theme**: `data-theme="dark"` | `data-theme="light"`, 기본값은 사용자 선호 또는 dark
- **파스텔 톤** (요구 11):
  - 다크: 배경 `#1a1a2e` 계열, 액센트 `#a8b5ff`, `#c5a3ff`, `#ffb3e6` 등 부드러운 파스텔
  - 라이트: 배경 `#f5f5f8` 계열, 액센트 `#7c8aff`, `#a78aff` 등 밝은 파스텔
- **CSS 변수**: `themes.css`에 `--bg-primary`, `--accent-primary` 등 정의 후 컴포넌트에서 사용
- **저장**: `localStorage`에 `chipBlockCrush_theme` 저장, `useTheme`으로 초기화
- ChipPuzzleGame의 `themes.css`, `ThemeToggle` 참고

---

## 9. SEO (요구 5)

### 9.1 검색 엔진 대상

- **구글**: meta description, title, og, Twitter Card, JSON-LD
- **네이버**: NaverBot 허용, 메타 태그, 구조화 데이터
- **다음**: Daum/Daumoa 허용, 동일 메타·구조화

### 9.2 구현

- **react-helmet-async**: 페이지별 `title`, `meta name="description"`, `meta name="keywords"`, `og:title`, `og:description`, `og:image`, `og:type`
- **다국어**: `hreflang` (ko, en, ja, zh)를 sitemap 및 Helmet에 반영
- **JSON-LD**: WebSite, Game, Organization 등 스키마 (ChipPuzzleGame SEOHead 참고)
- **robots.txt**: User-agent별 Allow, Sitemap URL
- **sitemap.xml**: 메인·가이드·도움말·소개 등 URL + hreflang
- **index.html**: 기본 title/description (한국어 등 기본 언어)

---

## 10. Google AdSense (요구 6)

- **Publisher ID**: `ca-pub-2533613198240039`
- **로드**: `index.html`에 스크립트 한 번만 로드  
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2533613198240039`
- **초기화**: 프로덕션에서만 실행, localhost 등에서는 스킵 (ChipPuzzleGame App.tsx 참고)
- **유틸**: `preventAdSenseErrors`, `setupAdObserver` 등으로 오류·레이아웃 깨짐 방지
- **배치**: 헤더 아래 또는 푸터 위 등 노출 위치는 정책에 맞게 결정
- **Ads.txt**: 필요 시 public/Ads.txt에 구글 제공 내용 추가

---

## 11. GitHub Pages (요구 7)

- **저장소**: ChipBlockCrush (또는 조직/사용자별 경로)
- **배포 경로**: `https://<user>.github.io/ChipBlockCrush/` (또는 `https://<org>.github.io/ChipBlockCrush/`)
- **Vite base**: `base: '/ChipBlockCrush/'` (프로덕션)
- **빌드**: `npm run build` → `dist` 출력
- **배포**: `gh-pages -d dist` 또는 `npm run deploy` 스크립트
- **public/.nojekyll**: Jekyll 무시
- ChipPuzzleGame의 `vite.config.ts` base, `DEPLOYMENT.md` 참고

---

## 12. Canvas + React, 16:9 반응형 (요구 8)

- **역할 분리**: React는 화면·UI·상태, Canvas는 블록·그리드·애니메이션 렌더링
- **비율**: 16:9 고정. 컨테이너 width 기준으로 height = width \* (9/16), 또는 `aspect-ratio: 16/9`로 감싼 뒤 Canvas를 100%로 채움
- **해상도**: `devicePixelRatio`를 반영해 Canvas 내부 해상도 올리기 (선명도)
- **이벤트**: 마우스/터치를 Canvas 좌표로 변환해 블록 선택·드래그
- **참고**: ChipPuzzleGame `GameCanvas.tsx`, `canvasConfig.ts`

---

## 13. PWA (요구 9)

- **manifest.json**:
  - `name`, `short_name`: ChipBlockCrush 관련 문구
  - `start_url`: `/ChipBlockCrush/`
  - `display`: `standalone`
  - `orientation`: `any`
  - `icons`: 192x192, 512x512 (maskable)
  - `theme_color`, `background_color`: 파스텔 톤에 맞게
  - `scope`: `/ChipBlockCrush/`
- **Service Worker**: sw.js로 캐시 전략(캐시 우선 또는 네트워크 우선), 버전 관리
- **등록**: `main.tsx` 또는 `App.tsx`에서 `registerServiceWorker()` 호출
- **iOS**: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-mobile-web-app-title
- ChipPuzzleGame의 `public/manifest.json`, `sw.js`, `serviceWorker.ts` 참고

---

## 14. 디자인 (파스텔 톤, 요구 11)

- **일관성**: 첨부 이미지처럼 다크 배경 + 파스텔 그라데이션(연보라·하늘색)으로 버튼·선택 상태 강조
- **색상 변수 예시** (themes.css):
  - 다크: `--accent-primary: #a8b5ff`, `--accent-secondary: #c5a3ff`, `--gradient-primary: linear-gradient(135deg, #a8b5ff 0%, #c5a3ff 100%)`
  - 라이트: 배경 밝게, 액센트는 같은 톤으로 약간 더 진하게
- **스테이지 카드**: 잠금 = 회색+자물쇠 아이콘, 해제 = 파스텔 그라데이션 배경
- **버튼·링크**: 호버 시 파스텔 톤 보더/배경

---

## 15. 게임 설계 (Block Crush 메커니즘)

- **보드**: 정사각형 그리드 (예: 9×9 또는 10×10)
- **블록**: 여러 형태의 폴리오미노를 순차적으로 배치
- **승리 조건**: 한 행 또는 한 열이 가득 차면 해당 줄 제거, 공간 확보
- **패배 조건**: 남은 블록을 놓을 수 없으면 게임 오버
- **스테이지**: 1부터 N단계 (예: 50~1000), 순차 해제, 진행은 localStorage 저장
- **점수**: 줄 클리어 시 점수, 동시 다중 줄·콤보 보너스 (규칙은 `BlockCrush_게임_상세_조사.md` 참고)

---

## 16. 일정·우선순위 제안

| 단계 | 내용                                                                   |
| ---- | ---------------------------------------------------------------------- |
| 1    | 프로젝트 셋업 (Vite + React + TS), 라우팅/화면 구조, Header/Footer     |
| 2    | 테마(다크/라이트)·파스텔 CSS 변수, 반응형 기본                         |
| 3    | 다국어 (locales, useLanguage, LanguageSelector)                        |
| 4    | 스테이지 선택 화면 (그리드, 페이지네이션, 잠금/해제)                   |
| 5    | Canvas 16:9 래퍼 + 블록 그리드 렌더링 + 드래그/드롭                    |
| 6    | 게임 로직 (라인 완성 판정, 제거, 점수, 게임 오버)                      |
| 7    | PWA (manifest, Service Worker), SEO (Helmet, sitemap, robots), AdSense |
| 8    | 모바일 가로/세로·화면 고정, UI 숨김, 최종 테스트 및 GitHub Pages 배포  |

---

## 17. 참고 자료

- **프로젝트**: `D:\vs\ChipGames\ChipPuzzleGame` (웹 구조, Canvas, PWA, SEO, AdSense, 테마, 다국어)
- **게임 규칙·법적**: `ReadMe/BlockCrush_게임_상세_조사.md`
- **UI 참고**: 제공된 스테이지 선택 화면 이미지 (CHIP GAMES, 매칭 퍼즐 게임, 스테이지 선택, 페이지네이션, 다크+파스텔)

---

_이 계획서는 ChipBlockCrush 개발 시 요구사항과 구조를 정리한 문서이며, 구현 중 세부 사항은 변경될 수 있습니다._
