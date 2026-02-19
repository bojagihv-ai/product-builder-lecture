#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
PKG_DIR="${DIST_DIR}/ai-detail-builder-local"
ZIP_PATH="${DIST_DIR}/ai-detail-builder-local.zip"

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}"

cp "${ROOT_DIR}/index.html" "${PKG_DIR}/"
cp "${ROOT_DIR}/style.css" "${PKG_DIR}/"
cp "${ROOT_DIR}/main.js" "${PKG_DIR}/"

cat > "${PKG_DIR}/README_LOCAL_RUN.txt" <<'TXT'
[로컬 실행 방법]
1) 이 폴더에서 터미널 실행
2) python3 -m http.server 4173
3) 브라우저에서 http://localhost:4173 접속

[필수]
- 이미지 업로드 후 생성 버튼 클릭
- Gemini API Key가 있으면 모델 응답 사용
- API Key가 없으면 fallback 템플릿 모드로 동작
TXT

rm -f "${ZIP_PATH}"
(
  cd "${DIST_DIR}"
  zip -r "${ZIP_PATH}" "ai-detail-builder-local" >/dev/null
)

echo "패키지 생성 완료: ${ZIP_PATH}"
