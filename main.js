const sections = [
  '1. 헤더(화이트톤 + 제품명 폰트/픽셀)',
  '2. 훅 이미지 + 구매 유도 메시지',
  '3. 핵심 문제 제기(고객 불편)',
  '4. 솔루션 한 줄 제안',
  '5. 주요 기능 3~5개',
  '6. 기능별 시각화 가이드',
  '7. 사용 전/후 비교',
  '8. 경쟁제품 대비 차별점',
  '9. 신뢰요소(리뷰/인증/수치)',
  '10. 소재/스펙 상세',
  '11. 사용 시나리오',
  '12. FAQ',
  '13. 보증/AS/배송 정보',
  '14. 가격/구성/혜택',
  '15. 강한 CTA + 리마인드 문구'
];

const outputTypeOptions = [
  { value: 'copy', label: '문구만' },
  { value: 'image', label: '이미지 프롬프트만' },
  { value: 'both', label: '문구 + 이미지 프롬프트' }
];

const refs = {
  productName: document.getElementById('productName'),
  productCategory: document.getElementById('productCategory'),
  targetAudience: document.getElementById('targetAudience'),
  brandTone: document.getElementById('brandTone'),
  productImage: document.getElementById('productImage'),
  preview: document.getElementById('preview'),
  apiKey: document.getElementById('apiKey'),
  modelName: document.getElementById('modelName'),
  rememberApi: document.getElementById('rememberApi'),
  encryptApi: document.getElementById('encryptApi'),
  apiPassphrase: document.getElementById('apiPassphrase'),
  clearApiBtn: document.getElementById('clearApiBtn'),
  status: document.getElementById('status'),
  analysisOutput: document.getElementById('analysisOutput'),
  resultOutput: document.getElementById('resultOutput'),
  generateBtn: document.getElementById('generateBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  copyRunCmdBtn: document.getElementById('copyRunCmdBtn'),
  localCmd: document.getElementById('localCmd'),
  sectionGrid: document.getElementById('sectionGrid'),
};

let imageDataUrl = '';
const storageKeys = {
  apiKey: 'gemini-api-key',
  apiKeyEncrypted: 'gemini-api-key-encrypted',
  modelName: 'gemini-model-name',
  rememberApi: 'remember-gemini-api',
  encryptApi: 'encrypt-gemini-api',
};

function updateStatus(text) {
  refs.status.textContent = text;
}

function dataUrlToParts(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mimeType = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png';
  return { mimeType, base64 };
}

function buildSectionInputs() {
  const fragment = document.createDocumentFragment();

  sections.forEach((title, index) => {
    const box = document.createElement('div');
    box.className = 'section-item';

    const heading = document.createElement('strong');
    heading.textContent = title;

    const select = document.createElement('select');
    select.className = 'output-type';
    select.dataset.sectionIndex = String(index);
    outputTypeOptions.forEach((option) => {
      const el = document.createElement('option');
      el.value = option.value;
      el.textContent = option.label;
      if (option.value === 'both') {
        el.selected = true;
      }
      select.appendChild(el);
    });

    const textarea = document.createElement('textarea');
    textarea.dataset.sectionIndex = String(index);
    textarea.placeholder = '원하는 연출/문구/디자인 방향 입력';

    box.append(heading, select, textarea);
    fragment.appendChild(box);
  });

  refs.sectionGrid.appendChild(fragment);
}

function getSectionRequirements() {
  const textareas = [...refs.sectionGrid.querySelectorAll('textarea')];
  const selects = [...refs.sectionGrid.querySelectorAll('.output-type')];

  return sections.map((title, index) => ({
    title,
    requirement: textareas[index]?.value.trim() || '자동 최적화',
    outputType: selects[index]?.value || 'both',
  }));
}

function getKeywordCandidates(name, category) {
  return [
    `${name} ${category} 추천`,
    `${name} 후기`,
    `${category} 베스트셀러 상세페이지`,
    `${name} 비교`
  ];
}

async function analyzeImageLocally(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, 64, 64);

  const pixels = ctx.getImageData(0, 0, 64, 64).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let brightnessTotal = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    brightnessTotal += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  }

  const count = pixels.length / 4;
  const avgR = Math.round(r / count);
  const avgG = Math.round(g / count);
  const avgB = Math.round(b / count);
  const avgBrightness = Math.round(brightnessTotal / count);

  return {
    resolution: `${bitmap.width}x${bitmap.height}`,
    ratio: (bitmap.width / bitmap.height).toFixed(2),
    averageColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
    brightness: avgBrightness,
    visualHint: avgBrightness > 170 ? '밝고 클린한 톤' : '명암 대비가 있는 톤'
  };
}

function buildPrompt(localAnalysis, requirements) {
  const productName = refs.productName.value.trim() || '제품명 미입력';
  const category = refs.productCategory.value.trim() || '카테고리 미입력';
  const audience = refs.targetAudience.value.trim() || '타깃 미입력';
  const tone = refs.brandTone.value.trim() || '브랜드 톤 미입력';

  const req = requirements
    .map((item) => `- ${item.title} | 출력타입=${item.outputType} | 요구사항=${item.requirement}`)
    .join('\n');

  return `
너는 한국어 이커머스 상세페이지 전문가다.
반드시 JSON만 출력하고 설명문은 금지한다.

[기본 정보]
- 제품명: ${productName}
- 카테고리: ${category}
- 타깃고객: ${audience}
- 브랜드톤: ${tone}

[로컬 이미지 분석]
- 해상도: ${localAnalysis.resolution}
- 비율: ${localAnalysis.ratio}
- 평균색: ${localAnalysis.averageColor}
- 밝기: ${localAnalysis.brightness}
- 인사이트: ${localAnalysis.visualHint}

[섹션 조건]
${req}

[반환 JSON 스키마]
{
  "benchmarkInsights": ["..."],
  "sections": [
    {
      "title": "1. ...",
      "outputType": "copy|image|both",
      "copy": "문구 결과 또는 빈 문자열",
      "imagePrompt": "이미지 생성 프롬프트 또는 빈 문자열",
      "designGuide": "디자인 가이드"
    }
  ],
  "checklist": ["..."]
}

규칙:
1) sections는 반드시 15개
2) outputType이 copy면 copy 채우고 imagePrompt는 빈 문자열
3) outputType이 image면 imagePrompt 채우고 copy는 빈 문자열
4) outputType이 both면 둘 다 채우기
5) checklist는 8개
`.trim();
}

async function callGemini(apiKey, modelName, prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts = [{ text: prompt }];

  if (imageDataUrl) {
    const image = dataUrlToParts(imageDataUrl);
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini 호출 실패: ${response.status} ${message}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '';
}

function extractJsonText(rawText) {
  if (!rawText) {
    throw new Error('Gemini 응답이 비어 있습니다.');
  }

  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }

  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('JSON 형식을 찾지 못했습니다.');
  }

  return rawText.slice(start, end + 1);
}

function normalizeResult(payload, requirements) {
  const sectionByTitle = new Map((payload.sections || []).map((item) => [item.title, item]));
  const normalizedSections = requirements.map((req) => {
    const found = sectionByTitle.get(req.title) || {};
    const outputType = req.outputType;

    return {
      title: req.title,
      outputType,
      copy: outputType === 'image' ? '' : (found.copy || '').trim(),
      imagePrompt: outputType === 'copy' ? '' : (found.imagePrompt || '').trim(),
      designGuide: (found.designGuide || '1200px 그리드, 제품 중심 화이트톤 배치').trim(),
    };
  });

  return {
    benchmarkInsights: Array.isArray(payload.benchmarkInsights) ? payload.benchmarkInsights : [],
    sections: normalizedSections,
    checklist: Array.isArray(payload.checklist) ? payload.checklist.slice(0, 8) : [],
  };
}

function toMarkdown(result, productName) {
  const sectionBlocks = result.sections.map((section) => {
    const lines = [`## ${section.title}`, `- 출력 타입: ${section.outputType}`];

    if (section.copy) {
      lines.push(`- 문구: ${section.copy}`);
    }
    if (section.imagePrompt) {
      lines.push(`- 이미지 프롬프트: ${section.imagePrompt}`);
    }

    lines.push(`- 디자인 가이드: ${section.designGuide}`);
    return lines.join('\n');
  });

  const insightLines = result.benchmarkInsights.length
    ? result.benchmarkInsights.map((item) => `- ${item}`).join('\n')
    : '- 유사 제품 키워드 기반 벤치마크가 권장됩니다.';

  const checklistLines = result.checklist.length
    ? result.checklist.map((item) => `- [ ] ${item}`).join('\n')
    : '- [ ] CTA/신뢰요소/FAQ/배송정책 점검';

  return `# ${(productName || '제품')} 상세페이지 초안\n\n## 벤치마크 인사이트\n${insightLines}\n\n${sectionBlocks.join('\n\n')}\n\n## 실행 체크리스트\n${checklistLines}\n`;
}

function buildFallback(requirements, localAnalysis) {
  const title = refs.productName.value.trim() || '제품명';
  const sectionsOut = requirements.map((item) => ({
    title: item.title,
    outputType: item.outputType,
    copy: item.outputType === 'image' ? '' : `${title}의 핵심 가치를 강조하는 문구를 배치하세요.`,
    imagePrompt: item.outputType === 'copy' ? '' : `white clean ecommerce hero shot, ${title}, premium lighting, Korean market detail page style`,
    designGuide: '화이트 배경 + 대비색 CTA + 포인트 아이콘 3개 구성'
  }));

  return {
    benchmarkInsights: [
      `추천 키워드: ${getKeywordCandidates(title, refs.productCategory.value.trim() || '제품').join(', ')}`,
      `로컬 분석: ${localAnalysis.visualHint}, 평균색 ${localAnalysis.averageColor}, 비율 ${localAnalysis.ratio}`,
      '문제-해결-차별점-CTA 흐름을 유지하세요.'
    ],
    sections: sectionsOut,
    checklist: [
      '헤더 폰트/크기 명시',
      '구매 훅 강도 점검',
      '핵심 기능 시각화',
      '전후 비교 구성',
      '신뢰요소(리뷰/인증) 배치',
      'FAQ 5개 이상',
      '배송/AS 정책 명확화',
      '마지막 CTA 반복'
    ]
  };
}


function uint8ToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToUint8(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function deriveKey(passphrase, salt) {
  const passphraseBytes = new TextEncoder().encode(passphrase);
  const keyMaterial = await crypto.subtle.importKey('raw', passphraseBytes, { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(plainText, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return JSON.stringify({
    iv: uint8ToBase64(iv),
    salt: uint8ToBase64(salt),
    data: uint8ToBase64(new Uint8Array(encrypted)),
  });
}

async function decryptText(payload, passphrase) {
  const parsed = JSON.parse(payload);
  const iv = base64ToUint8(parsed.iv);
  const salt = base64ToUint8(parsed.salt);
  const data = base64ToUint8(parsed.data);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

async function loadSavedApiConfig() {
  const shouldRemember = localStorage.getItem(storageKeys.rememberApi) === 'true';
  const useEncryption = localStorage.getItem(storageKeys.encryptApi) === 'true';
  refs.rememberApi.checked = shouldRemember;
  refs.encryptApi.checked = useEncryption;
  if (!shouldRemember) return;

  const savedModelName = localStorage.getItem(storageKeys.modelName);
  if (savedModelName) refs.modelName.value = savedModelName;

  const plainApiKey = localStorage.getItem(storageKeys.apiKey);
  if (plainApiKey) {
    refs.apiKey.value = plainApiKey;
    return;
  }

  const encryptedApiKey = localStorage.getItem(storageKeys.apiKeyEncrypted);
  const passphrase = refs.apiPassphrase.value.trim();
  if (!encryptedApiKey) return;
  if (!passphrase) {
    updateStatus('암호화 저장된 API Key가 있습니다. 비밀번호를 입력하면 자동 복호화됩니다.');
    return;
  }

  try {
    refs.apiKey.value = await decryptText(encryptedApiKey, passphrase);
    updateStatus('암호화된 API Key를 복호화했습니다.');
  } catch {
    updateStatus('비밀번호가 일치하지 않아 API Key 복호화에 실패했습니다.');
  }
}

async function persistApiConfig() {
  if (!refs.rememberApi.checked) {
    localStorage.removeItem(storageKeys.apiKey);
    localStorage.removeItem(storageKeys.apiKeyEncrypted);
    localStorage.removeItem(storageKeys.modelName);
    localStorage.setItem(storageKeys.rememberApi, 'false');
    localStorage.setItem(storageKeys.encryptApi, 'false');
    return;
  }

  localStorage.setItem(storageKeys.rememberApi, 'true');
  localStorage.setItem(storageKeys.modelName, refs.modelName.value.trim() || 'gemini-2.5-pro');

  const apiKey = refs.apiKey.value.trim();
  if (!apiKey) {
    localStorage.removeItem(storageKeys.apiKey);
    localStorage.removeItem(storageKeys.apiKeyEncrypted);
    return;
  }

  if (!refs.encryptApi.checked) {
    localStorage.setItem(storageKeys.encryptApi, 'false');
    localStorage.setItem(storageKeys.apiKey, apiKey);
    localStorage.removeItem(storageKeys.apiKeyEncrypted);
    return;
  }

  const passphrase = refs.apiPassphrase.value.trim();
  if (!passphrase) {
    throw new Error('암호화 저장을 사용하려면 저장 비밀번호를 입력해 주세요.');
  }

  const encrypted = await encryptText(apiKey, passphrase);
  localStorage.setItem(storageKeys.encryptApi, 'true');
  localStorage.setItem(storageKeys.apiKeyEncrypted, encrypted);
  localStorage.removeItem(storageKeys.apiKey);
}

function clearSavedApiConfig() {
  localStorage.removeItem(storageKeys.apiKey);
  localStorage.removeItem(storageKeys.apiKeyEncrypted);
  localStorage.removeItem(storageKeys.modelName);
  localStorage.setItem(storageKeys.rememberApi, 'false');
  localStorage.setItem(storageKeys.encryptApi, 'false');
  refs.rememberApi.checked = false;
  refs.encryptApi.checked = false;
  refs.apiPassphrase.value = '';
  refs.apiKey.value = '';
  refs.modelName.value = 'gemini-2.5-pro';
  updateStatus('저장된 API 설정을 삭제했습니다.');
}

refs.productImage.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = String(reader.result);
    refs.preview.src = imageDataUrl;
    refs.preview.hidden = false;
  };
  reader.readAsDataURL(file);
});

refs.generateBtn.addEventListener('click', async () => {
  const [file] = refs.productImage.files;
  if (!file) {
    updateStatus('이미지를 먼저 업로드해 주세요.');
    return;
  }

  refs.generateBtn.disabled = true;

  try {
    updateStatus('이미지 자체 분석 중...');
    const localAnalysis = await analyzeImageLocally(file);
    const requirements = getSectionRequirements();

    refs.analysisOutput.textContent = JSON.stringify(
      {
        localAnalysis,
        benchmarkKeywords: getKeywordCandidates(
          refs.productName.value.trim() || '제품',
          refs.productCategory.value.trim() || '카테고리'
        ),
        sectionOutputTypes: requirements.map((item) => ({ title: item.title, outputType: item.outputType }))
      },
      null,
      2
    );

    await persistApiConfig();
    const apiKey = refs.apiKey.value.trim();
    let structured;

    if (apiKey) {
      updateStatus('Gemini JSON 생성 중...');
      const prompt = buildPrompt(localAnalysis, requirements);
      const rawText = await callGemini(apiKey, refs.modelName.value.trim() || 'gemini-2.5-pro', prompt);
      const jsonText = extractJsonText(rawText);
      structured = normalizeResult(JSON.parse(jsonText), requirements);
    } else {
      updateStatus('API Key 없음: 로컬 템플릿 생성 중...');
      structured = buildFallback(requirements, localAnalysis);
    }

    refs.resultOutput.value = toMarkdown(structured, refs.productName.value.trim());
    updateStatus('완료! 선택한 출력 타입(문구/이미지 프롬프트/둘 다) 기준으로 생성되었습니다.');
  } catch (error) {
    updateStatus(error.message);
  } finally {
    refs.generateBtn.disabled = false;
  }
});

refs.copyBtn.addEventListener('click', async () => {
  if (!refs.resultOutput.value.trim()) return;
  await navigator.clipboard.writeText(refs.resultOutput.value);
  updateStatus('결과를 클립보드에 복사했습니다.');
});

refs.downloadBtn.addEventListener('click', () => {
  if (!refs.resultOutput.value.trim()) return;
  const blob = new Blob([refs.resultOutput.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(refs.productName.value.trim() || 'detail-page').replace(/\s+/g, '_')}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
  updateStatus('.md 파일을 저장했습니다.');
});

buildSectionInputs();


refs.rememberApi.addEventListener('change', async () => {
  try {
    await persistApiConfig();
    updateStatus(refs.rememberApi.checked ? 'API 설정 저장이 활성화되었습니다.' : 'API 설정 저장이 비활성화되었습니다.');
  } catch (error) {
    updateStatus(error.message);
    refs.rememberApi.checked = false;
  }
});

refs.encryptApi.addEventListener('change', async () => {
  try {
    await persistApiConfig();
    updateStatus(refs.encryptApi.checked ? 'API Key 암호화 저장이 활성화되었습니다.' : 'API Key 평문 저장 모드입니다.');
  } catch (error) {
    refs.encryptApi.checked = false;
    updateStatus(error.message);
  }
});

refs.apiPassphrase.addEventListener('change', async () => {
  await loadSavedApiConfig();
  if (refs.rememberApi.checked) {
    try {
      await persistApiConfig();
    } catch (error) {
      updateStatus(error.message);
    }
  }
});

refs.apiKey.addEventListener('input', async () => {
  try {
    await persistApiConfig();
  } catch (error) {
    updateStatus(error.message);
  }
});
refs.modelName.addEventListener('input', async () => {
  try {
    await persistApiConfig();
  } catch (error) {
    updateStatus(error.message);
  }
});
refs.clearApiBtn.addEventListener('click', clearSavedApiConfig);

loadSavedApiConfig();

if (refs.copyRunCmdBtn && refs.localCmd) {
  refs.copyRunCmdBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(refs.localCmd.textContent.trim());
    updateStatus('로컬 실행/패키지 명령을 복사했습니다.');
  });
}
