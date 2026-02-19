# AI 상세페이지 자동 생성 스튜디오 (로컬 실행판)

이 프로젝트는 브라우저에서 동작하는 로컬 UI 앱입니다.

## 1) 바로 실행 (Mac/Linux)
```bash
./run-local.sh
```

## 2) 수동 실행
```bash
python3 -m http.server 4173
```
브라우저에서 `http://localhost:4173` 접속.

## 3) 로컬 배포용 ZIP 만들기
```bash
./build-local-package.sh
```
생성 파일: `dist/ai-detail-builder-local.zip`

ZIP 안에는 아래가 포함됩니다.
- `index.html`
- `style.css`
- `main.js`
- `README_LOCAL_RUN.txt`

## API 관련
- 텍스트/이미지 프롬프트 생성: Gemini API Key 필요
- `생성 후 섹션별 이미지도 자동 생성` 체크 시 Gemini 이미지 모델로 실제 섹션 이미지를 순차 생성합니다.
- 기본 이미지 모델명은 `gemini-2.0-flash-preview-image-generation`이며, 계정/모델 권한에 따라 실패할 수 있습니다.

## API 설정 저장
- UI의 "이 브라우저에 API 설정 저장" 체크 시 API Key/모델명이 localStorage에 저장됩니다.
- "저장 시 API Key 암호화" 체크 + 저장 비밀번호 입력 시 AES-GCM 방식으로 암호화 저장됩니다.
- 동일 브라우저에서 비밀번호를 입력하면 저장된 암호문을 복호화해 자동 채웁니다.
- "저장된 API 삭제" 버튼으로 즉시 삭제할 수 있습니다.
