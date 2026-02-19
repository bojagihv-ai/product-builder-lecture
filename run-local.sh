#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
echo "[AI 상세페이지 스튜디오] 로컬 서버 실행: http://localhost:${PORT}"
python3 -m http.server "${PORT}"
