# ChipBlockCrush 빌드 및 배포

## 사전 조건

- Node.js (v16 이상)
- Git, GitHub 저장소 설정
- `package.json`의 `homepage`가 없으면 GitHub Pages 기준:  
  `https://<username>.github.io/ChipBlockCrush/`

## 1. 빌드

```bash
# 타입 검사 + 프로덕션 빌드 (base: /ChipBlockCrush/)
npm run build
```

또는 GitHub Pages 전용 빌드만:

```bash
npm run build:gh
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

## 2. 로컬에서 빌드 결과 확인

```bash
npm run preview
```

브라우저에서 `http://localhost:4173` (또는 터미널에 표시된 주소)로 접속해 확인합니다.

## 3. GitHub Pages 배포

```bash
npm run deploy
```

이 명령은 다음을 순서대로 실행합니다.

1. **`npm run version:patch`** — `package.json`의 패치 버전 자동 증가 (예: 1.0.0 → 1.0.1). Git 태그/커밋은 만들지 않습니다.
2. **`npm run build:gh`** — 프로덕션 빌드 후 `dist/sw.js`의 캐시 이름을 새 버전으로 치환해 Service Worker 캐시가 갱신되도록 합니다.
3. **`npx gh-pages -d dist`** — `dist/` 내용을 `gh-pages` 브랜치로 푸시

배포 후 `package.json`·`package-lock.json`이 바뀌므로, 필요하면 버전 업을 커밋해 두세요.

- **버전만 올리기**: `npm run version:patch` (배포 없이)
- **빌드만** (버전 유지): `npm run build:gh` (캐시 이름은 현재 `package.json` 버전 사용)

배포 후 URL 예:

- `https://<username>.github.io/ChipBlockCrush/`

GitHub 저장소 **Settings → Pages**에서 Source를 **gh-pages** 브랜치로 설정했는지 확인하세요.

## 문제 해결

- **`spawn EPERM`**: 터미널(또는 Cursor 외부 터미널)에서 같은 명령을 실행해 보세요.
- **배포 실패**: `git remote`가 올바른지, GitHub 인증이 되어 있는지 확인하세요.
- **404**: 저장소 이름이 `ChipBlockCrush`가 아니면 `vite.config.ts`의 `base`를 해당 경로로 수정하세요.
