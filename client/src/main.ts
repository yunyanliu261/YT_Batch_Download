import './style.css'

const urlInput = document.getElementById('url-input') as HTMLInputElement;
const checkUrlBtn = document.getElementById('check-url-btn') as HTMLButtonElement;
const urlInfo = document.getElementById('url-info') as HTMLDivElement;
const pathInput = document.getElementById('path-input') as HTMLInputElement;
const rememberPathCheck = document.getElementById('remember-path-check') as HTMLInputElement;
const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
const cookieSelect = document.getElementById('cookie-select') as HTMLSelectElement;
const cookieFileInput = document.getElementById('cookie-file') as HTMLInputElement;

// Metadata check elements
const metaAll = document.getElementById('meta-all') as HTMLInputElement;
const metaAllLabel = document.getElementById('meta-all-label') as HTMLLabelElement;
const metaSubs = document.getElementById('meta-subs') as HTMLInputElement;
const metaThumb = document.getElementById('meta-thumb') as HTMLInputElement;
const metaJson = document.getElementById('meta-json') as HTMLInputElement;
const subCheckboxes = [metaSubs, metaThumb, metaJson];

const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

// Progress panel elements
const progressPanel = document.getElementById('progress-panel') as HTMLDivElement;
const progressItemText = document.getElementById('progress-item-text') as HTMLSpanElement;
const progressDetail = document.getElementById('progress-detail') as HTMLSpanElement;
const progressOverallBar = document.getElementById('progress-overall-bar') as HTMLDivElement;
const progressFileBar = document.getElementById('progress-file-bar') as HTMLDivElement;
const logContainer = document.getElementById('log-container') as HTMLDivElement;
const systemStatus = document.getElementById('system-status') as HTMLDivElement;

// Language Elements
const langZhBtn = document.getElementById('lang-zh') as HTMLButtonElement;
const langEnBtn = document.getElementById('lang-en') as HTMLButtonElement;

// Backend API (the server only listens on localhost)
const API_BASE = 'http://localhost:3000';

// Keep the log from growing without bound during long channel downloads
const MAX_LOG_LINES = 2000;

// --- i18n Dictionary ---
const i18n = {
  en: {
    appTitle: 'YouTube Downloader',
    urlLabel: 'YouTube URL (Video or Channel)',
    urlPlaceholder: 'https://www.youtube.com/...',
    checkUrlBtn: 'Check URL',
    pathLabel: 'Download Path (Optional)',
    pathPlaceholder: 'Absolute path or leave empty for default',
    pathHelper: "If empty, defaults to server's 'downloads' folder.",
    rememberPath: 'Remember Path',
    qualityLabel: 'Quality / Format',
    qualityBest: 'Best Quality (Video+Audio)',
    qualityAudio: 'Audio Only (MP3)',
    cookieLabel: 'Cookies (Optional)',
    cookieTooltip: 'Select your browser to bypass age restrictions. If extraction fails, try closing the browser first.',
    cookieNone: 'None (Public Video)',
    metadataLabel: 'Download Metadata',
    metadataTooltip: 'Extra files saved alongside your video (e.g., .vtt for subs, .webp for thumbnails, .json for description and tags).',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    metaSubs: 'Subtitles (.vtt)',
    metaThumb: 'Thumbnail (.jpg/.webp)',
    metaJson: 'Info JSON (.info.json)',
    startDownload: 'Start Download',
    checkingSystem: 'Checking system dependencies...',
    sysReady: '✅ System Check: Ready (yt-dlp & FFmpeg detected)',
    sysFailed: '❌ System Check Failed: ',
    sysUnreachable: '❌ Backend not reachable',
    progressLogLabel: 'Progress Log',
    waitingInput: 'Waiting for input...',
    viewSource: 'View Source Code',
    alertNoUrl: 'Please enter a URL',
    alertPathError: 'Download path error: ',
    logSysMissing: 'Missing dependencies! Python and the yt-dlp binary are required: install Python, then run "npm install" in the server folder.',
    logChecking: 'Checking...',
    logTypePlaylist: 'Playlist',
    logTypeChannel: 'Channel',
    logTypeVideo: 'Single Video',
    progressItem: 'Video {index} of {total}',
    progressSingle: 'Current file',
    logCountFound: 'video(s) found',
    logUploader: 'Uploader: ',
    logType: 'Type: ',
    logCount: 'Count: ',
    logCheckSuccess: 'Checked URL: Found',
    logCheckFailed: 'URL Check Failed: ',
    logPathInvalid: 'Invalid Path: ',
    logPathFailed: 'Failed to validate path with server.',
    logStartDownload: 'Starting download for: ',
    logProcessFinished: 'Process finished.',
    uiDownloading: 'Downloading...',
    cancelDownload: 'Cancel',
    logCancelled: 'Download cancelled.'
  },
  zh: {
    appTitle: 'YouTube 影片下載器',
    urlLabel: 'YouTube 網址 (影片或頻道)',
    urlPlaceholder: '輸入 https://www.youtube.com/...',
    checkUrlBtn: '檢查網址',
    pathLabel: '下載路徑 (選填)',
    pathPlaceholder: '輸入絕對路徑，留空則使用預設資料夾',
    pathHelper: '若留空，將儲存至伺服器的 "downloads" 資料夾。',
    rememberPath: '記住路徑',
    qualityLabel: '畫質 / 格式',
    qualityBest: '最佳畫質 (影片+音訊)',
    qualityAudio: '僅音訊 (MP3)',
    cookieLabel: '載入瀏覽器 Cookie (可選)',
    cookieTooltip: '若遇到「Could not copy cookie database」錯誤，請先關閉該瀏覽器再試一次。',
    cookieNone: '無 (公開影片)',
    metadataLabel: '下載中介資料 (Metadata)',
    metadataTooltip: '與影片一併儲存的額外檔案 (例如：.vtt 字幕、.webp 縮圖、.json 影片資訊與標籤)。',
    selectAll: '全選 (Select All)',
    clearAll: '取消全部 (Clear All)',
    metaSubs: '字幕 (.vtt)',
    metaThumb: '縮圖 (.jpg/.webp)',
    metaJson: '影片資訊 (.info.json)',
    startDownload: '開始下載',
    checkingSystem: '正在檢查系統環境...',
    sysReady: '✅ 系統檢查：就緒 (已偵測到 yt-dlp 與 FFmpeg)',
    sysFailed: '❌ 系統檢查失敗：',
    sysUnreachable: '❌ 無法連接後端伺服器',
    progressLogLabel: '進度日誌',
    waitingInput: '等待輸入中...',
    viewSource: '查看原始碼',
    alertNoUrl: '請輸入網址',
    alertPathError: '下載路徑錯誤：',
    logSysMissing: '缺少必要套件！需要 Python 與 yt-dlp：請先安裝 Python，再於 server 資料夾執行 "npm install"。',
    logChecking: '檢查中...',
    logTypePlaylist: '播放清單',
    logTypeChannel: '頻道',
    logTypeVideo: '單一影片',
    progressItem: '第 {index} / {total} 部影片',
    progressSingle: '目前檔案',
    logCountFound: '部影片',
    logUploader: '上傳者：',
    logType: '類型：',
    logCount: '數量：',
    logCheckSuccess: '網址檢查完畢：共找到',
    logCheckFailed: '網址檢查失敗：',
    logPathInvalid: '無效的路徑：',
    logPathFailed: '無法向伺服器驗證路徑。',
    logStartDownload: '開始下載：',
    logProcessFinished: '處理完成。',
    uiDownloading: '下載中...',
    cancelDownload: '取消',
    logCancelled: '已取消下載。'
  }
};

let currentLang: 'en' | 'zh' = (localStorage.getItem('yt_downloader_lang') as 'en' | 'zh') || 'zh';

const t = (key: keyof typeof i18n['en']) => {
  return i18n[currentLang][key] || i18n['en'][key];
};

const applyLanguage = () => {
  // Update UI text
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') as keyof typeof i18n['en'];
    if (key && i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });

  // Update Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder') as keyof typeof i18n['en'];
    if (key && i18n[currentLang][key]) {
      (el as HTMLInputElement).placeholder = i18n[currentLang][key];
    }
  });

  // Re-run state updates to refresh dynamic text (like Select All/Clear All)
  updateMetaAllState();

  // Highlight active language button
  if (currentLang === 'zh') {
    langZhBtn.classList.add('text-blue-600', 'font-extrabold');
    langZhBtn.classList.remove('text-gray-500');
    langEnBtn.classList.add('text-gray-500');
    langEnBtn.classList.remove('text-blue-600', 'font-extrabold');
  } else {
    langEnBtn.classList.add('text-blue-600', 'font-extrabold');
    langEnBtn.classList.remove('text-gray-500');
    langZhBtn.classList.add('text-gray-500');
    langZhBtn.classList.remove('text-blue-600', 'font-extrabold');
  }
};

langZhBtn.addEventListener('click', () => {
  currentLang = 'zh';
  localStorage.setItem('yt_downloader_lang', 'zh');
  applyLanguage();
});

langEnBtn.addEventListener('click', () => {
  currentLang = 'en';
  localStorage.setItem('yt_downloader_lang', 'en');
  applyLanguage();
});


// --- Logger ---
const appendLog = (message: string, type: 'info' | 'error' | 'success' | 'progress' = 'info') => {
  const div = document.createElement('div');
  div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

  if (type === 'error') div.className = 'text-red-500 font-bold';
  else if (type === 'success') div.className = 'text-green-300 font-bold';
  else if (type === 'progress') div.className = 'text-gray-400';
  else div.className = 'text-blue-300'; // info

  logContainer.appendChild(div);
  while (logContainer.childElementCount > MAX_LOG_LINES) {
    logContainer.firstElementChild?.remove();
  }
  logContainer.scrollTop = logContainer.scrollHeight;
};

const clearLogs = () => {
  logContainer.innerHTML = '';
};

// --- Initialization ---
// Load Saved Preferences
const SAVED_PATH_KEY = 'yt_downloader_saved_path';
const SAVED_COOKIE_KEY = 'yt_downloader_saved_cookie';

const savedPath = localStorage.getItem(SAVED_PATH_KEY);
if (savedPath) {
  pathInput.value = savedPath;
  rememberPathCheck.checked = true;
}

const savedCookie = localStorage.getItem(SAVED_COOKIE_KEY);
if (savedCookie) {
  cookieSelect.value = savedCookie;
}

const checkDependencies = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/check-dependencies`);
    const data = await res.json();

    if (data.ready) {
      systemStatus.textContent = `${t('sysReady')} — yt-dlp ${data.ytDlpVersion}`;
      systemStatus.className = 'text-xs text-center text-green-600 mt-2 font-semibold';
      downloadBtn.disabled = false;
    } else {
      systemStatus.textContent = `${t('sysFailed')} yt-dlp: ${data.ytDlp ? '✅' : '❌'}, FFmpeg: ${data.ffmpeg ? '✅' : '❌'}, Python: ${data.python ? '✅' : '❌'}`;
      systemStatus.className = 'text-xs text-center text-red-600 mt-2 font-bold';
      downloadBtn.disabled = true;
      appendLog(t('logSysMissing'), 'error');
    }
  } catch (err) {
    systemStatus.textContent = t('sysUnreachable');
    systemStatus.className = 'text-xs text-center text-red-600 mt-2';
    downloadBtn.disabled = true;
  }
};


// --- Progress Panel ---
const progressState = { index: 1, total: 1, percent: 0 };

const renderProgress = (detail = '') => {
  const { index, total, percent } = progressState;
  const overall = total > 1 ? ((index - 1) + percent / 100) / total * 100 : percent;
  progressOverallBar.style.width = `${Math.min(100, overall).toFixed(1)}%`;
  progressFileBar.style.width = `${Math.min(100, percent).toFixed(1)}%`;
  progressItemText.textContent = total > 1
    ? t('progressItem').replace('{index}', String(index)).replace('{total}', String(total))
    : t('progressSingle');
  progressDetail.textContent = detail;
};

const resetProgress = () => {
  Object.assign(progressState, { index: 1, total: 1, percent: 0 });
  renderProgress();
  progressPanel.classList.remove('hidden');
};

// --- Handlers ---
// --- Metadata UI Logic ---
const updateMetaAllState = () => {
  const allChecked = subCheckboxes.every(c => c.checked);
  const anyChecked = subCheckboxes.some(c => c.checked);

  if (anyChecked) {
    metaAll.checked = allChecked || anyChecked;
    metaAllLabel.textContent = t('clearAll');
    metaAllLabel.className = 'ml-2 block text-sm font-semibold cursor-pointer text-red-600 hover:text-red-800';
  } else {
    metaAll.checked = false;
    metaAllLabel.textContent = t('selectAll');
    metaAllLabel.className = 'ml-2 block text-sm text-gray-900 font-semibold cursor-pointer hover:text-blue-600';
  }
};

metaAll.addEventListener('change', (e) => {
  const isChecked = (e.target as HTMLInputElement).checked;
  // User action:
  // If they click "Select All" (transition to checked) -> Check all
  // If they click "Clear All" (transition to unchecked) -> Uncheck all
  subCheckboxes.forEach(cb => cb.checked = isChecked);
  updateMetaAllState();
});

subCheckboxes.forEach(cb => {
  cb.addEventListener('change', updateMetaAllState);
});

// Initialize metadata state
updateMetaAllState();

const performUrlCheck = async () => {
  const url = urlInput.value.trim();
  if (!url) return alert(t('alertNoUrl'));

  let cookieContent: string | undefined = undefined;
  if (cookieFileInput.files && cookieFileInput.files.length > 0) {
    const file = cookieFileInput.files[0];
    cookieContent = await file.text();
  }

  checkUrlBtn.disabled = true;
  checkUrlBtn.textContent = t('logChecking');
  urlInfo.classList.add('hidden');
  urlInfo.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/api/get-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        browser: cookieSelect.value,
        cookieContent
      })
    });
    const data = await res.json();

    if (res.ok) {
      urlInfo.classList.remove('hidden');
      const typeText = data.kind === 'channel'
        ? t('logTypeChannel')
        : data.kind === 'playlist' ? t('logTypePlaylist') : t('logTypeVideo');
      // Build with textContent: titles and uploader names come from YouTube and may contain HTML
      const rows: [string, string?][] = [
        [`${data.title}`, 'font-bold'],
        [`${t('logUploader')} ${data.uploader}`],
        [`${t('logType')} ${typeText}`],
        [`${t('logCount')} ${data.video_count} ${t('logCountFound')}`],
      ];
      for (const [text, className] of rows) {
        const row = document.createElement('div');
        row.textContent = text;
        if (className) row.className = className;
        urlInfo.appendChild(row);
      }
      appendLog(`${t('logCheckSuccess')} ${data.video_count} ${t('logCountFound')} ("${data.title}")`, 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (err: any) {
    alert(`${t('logCheckFailed')} ${err.message}`);
    appendLog(`${t('logCheckFailed')} ${err.message}`, 'error');
  } finally {
    checkUrlBtn.disabled = false;
    checkUrlBtn.textContent = t('checkUrlBtn');
  }
};

checkUrlBtn.addEventListener('click', performUrlCheck);

downloadBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  const path = pathInput.value.trim();
  const quality = qualitySelect.value;
  const browser = cookieSelect.value;

  let cookieContent: string | undefined = undefined;
  if (cookieFileInput.files && cookieFileInput.files.length > 0) {
    const file = cookieFileInput.files[0];
    cookieContent = await file.text();
  }

  // Save or Clear Preferences
  if (rememberPathCheck.checked && path) {
    localStorage.setItem(SAVED_PATH_KEY, path);
  } else {
    localStorage.removeItem(SAVED_PATH_KEY);
  }

  if (browser !== 'none') {
    localStorage.setItem(SAVED_COOKIE_KEY, browser);
  } else {
    localStorage.removeItem(SAVED_COOKIE_KEY);
  }

  // Construct metadata object instead of a single boolean
  const metadata = {
    subs: metaSubs.checked,
    thumbnail: metaThumb.checked,
    json: metaJson.checked,
  };

  if (!url) {
    alert(t('alertNoUrl'));
    return;
  }

  // Pre-check Path if provided
  if (path) {
    try {
      const pathRes = await fetch(`${API_BASE}/api/check-path`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ downloadPath: path })
      });
      const pathData = await pathRes.json();
      if (!pathData.valid) {
        appendLog(`${t('logPathInvalid')} ${pathData.error}`, 'error');
        alert(`${t('alertPathError')} ${pathData.error}`);
        return;
      }
    } catch (e) {
      appendLog(t('logPathFailed'), 'error');
      return;
    }
  }

  // UI feedback
  downloadBtn.disabled = true;
  downloadBtn.textContent = t('uiDownloading');
  clearLogs();
  resetProgress();
  appendLog(`${t('logStartDownload')} ${url}`, 'info');

  // Aborting the request closes the connection, which makes the server stop yt-dlp
  const abortController = new AbortController();
  const onCancel = () => abortController.abort();
  cancelBtn.addEventListener('click', onCancel);
  cancelBtn.classList.remove('hidden');

  try {
    const response = await fetch(`${API_BASE}/api/download`, {
      method: 'POST',
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        downloadPath: path,
        quality,
        metadata,
        browser,
        cookieContent
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Server returned ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process buffer line by line
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the incomplete part in buffer

      for (const block of lines) {
        if (!block.trim()) continue;

        const linesInBlock = block.split('\n');
        const eventLine = linesInBlock.find(l => l.startsWith('event:'));
        const dataLine = linesInBlock.find(l => l.startsWith('data:'));

        if (eventLine && dataLine) {
          const eventType = eventLine.replace('event:', '').trim();
          const dataContent = dataLine.replace('data:', '').trim();

          let data: any;
          try {
            data = JSON.parse(dataContent);
          } catch (e) {
            console.error('Failed to parse JSON data', e);
            continue;
          }

          if (eventType === 'log') {
            // Other yt-dlp output
            appendLog(data.raw, 'progress');
          } else if (eventType === 'progress') {
            progressState.percent = data.percent;
            renderProgress([`${data.percent.toFixed(1)}%`, data.size, data.speed, data.eta && `ETA ${data.eta}`].filter(Boolean).join(' · '));
          } else if (eventType === 'item') {
            Object.assign(progressState, { index: data.index, total: data.total, percent: 0 });
            renderProgress();
          } else if (eventType === 'info') {
            appendLog(data.message, 'info');
          } else if (eventType === 'error') {
            appendLog(data.message, 'error');
          } else if (eventType === 'complete') {
            Object.assign(progressState, { index: progressState.total, percent: 100 });
            renderProgress();
            appendLog(data.message, 'success');
          } else if (eventType === 'download-plan') {
            appendLog(`[Plan] Total expected: ${data.total} | Already downloaded: ${data.downloaded} | Pending: ${data.pending}`, 'success');
          }
        }
      }
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      appendLog(t('logCancelled'), 'error');
    } else {
      appendLog(`Error: ${error.message}`, 'error');
    }
  } finally {
    cancelBtn.removeEventListener('click', onCancel);
    cancelBtn.classList.add('hidden');
    downloadBtn.disabled = false;
    downloadBtn.textContent = t('startDownload');
    appendLog(t('logProcessFinished'), 'info');
  }
});

// Run localization on mount
applyLanguage();
checkDependencies();
