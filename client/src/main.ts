import './style.css'

const urlInput = document.getElementById('url-input') as HTMLInputElement;
const checkUrlBtn = document.getElementById('check-url-btn') as HTMLButtonElement;
const urlInfo = document.getElementById('url-info') as HTMLDivElement;
const pathInput = document.getElementById('path-input') as HTMLInputElement;
const rememberPathCheck = document.getElementById('remember-path-check') as HTMLInputElement;
const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
const cookieSelect = document.getElementById('cookie-select') as HTMLSelectElement;

// Metadata check elements
const metaAll = document.getElementById('meta-all') as HTMLInputElement;
const metaAllLabel = document.getElementById('meta-all-label') as HTMLLabelElement;
const metaSubs = document.getElementById('meta-subs') as HTMLInputElement;
const metaThumb = document.getElementById('meta-thumb') as HTMLInputElement;
const metaJson = document.getElementById('meta-json') as HTMLInputElement;
const subCheckboxes = [metaSubs, metaThumb, metaJson];

const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const logContainer = document.getElementById('log-container') as HTMLDivElement;
const systemStatus = document.getElementById('system-status') as HTMLDivElement;

// Language Elements
const langZhBtn = document.getElementById('lang-zh') as HTMLButtonElement;
const langEnBtn = document.getElementById('lang-en') as HTMLButtonElement;

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
    cookieTooltip: 'Select your browser to bypass age restrictions and login requirements.',
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
    sysReady: '✅ System Check: Ready (Python & FFmpeg detected)',
    sysFailed: '❌ System Check Failed: ',
    sysUnreachable: '❌ Backend not reachable',
    progressLogLabel: 'Progress Log',
    waitingInput: 'Waiting for input...',
    viewSource: 'View Source Code',
    alertNoUrl: 'Please enter a URL',
    alertPathError: 'Download path error: ',
    logSysMissing: 'Missing dependencies! Please ensure Python and FFmpeg are installed.',
    logChecking: 'Checking...',
    logTypePlaylist: 'Playlist/Channel',
    logTypeVideo: 'Single Video',
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
    uiDownloading: 'Downloading...'
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
    cookieTooltip: '若影片有年齡限制或需要登入，請選擇您有登入 YouTube 的瀏覽器以繞過限制。',
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
    sysReady: '✅ 系統檢查：就緒 (已偵測到 Python 與 FFmpeg)',
    sysFailed: '❌ 系統檢查失敗：',
    sysUnreachable: '❌ 無法連接後端伺服器',
    progressLogLabel: '進度日誌',
    waitingInput: '等待輸入中...',
    viewSource: '查看原始碼',
    alertNoUrl: '請輸入網址',
    alertPathError: '下載路徑錯誤：',
    logSysMissing: '缺少必要套件！請確認已安裝 Python 與 FFmpeg。',
    logChecking: '檢查中...',
    logTypePlaylist: '播放清單 / 頻道',
    logTypeVideo: '單一影片',
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
    uiDownloading: '下載中...'
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
  logContainer.scrollTop = logContainer.scrollHeight;
};

const clearLogs = () => {
  logContainer.innerHTML = '';
};

// --- Initialization ---
// Load Saved Path Preferences
const SAVED_PATH_KEY = 'yt_downloader_saved_path';
const savedPath = localStorage.getItem(SAVED_PATH_KEY);
if (savedPath) {
  pathInput.value = savedPath;
  rememberPathCheck.checked = true;
}

const checkDependencies = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/check-dependencies');
    const data = await res.json();

    if (data.ready) {
      systemStatus.textContent = t('sysReady');
      systemStatus.className = 'text-xs text-center text-green-600 mt-2 font-semibold';
      downloadBtn.disabled = false;
    } else {
      systemStatus.innerHTML = `${t('sysFailed')} <br>Python: ${data.python ? '✅' : '❌'}, FFmpeg: ${data.ffmpeg ? '✅' : '❌'}`;
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

  checkUrlBtn.disabled = true;
  checkUrlBtn.textContent = t('logChecking');
  urlInfo.classList.add('hidden');
  urlInfo.textContent = '';

  try {
    const res = await fetch('http://localhost:3000/api/get-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        browser: cookieSelect.value
      })
    });
    const data = await res.json();

    if (res.ok) {
      urlInfo.classList.remove('hidden');
      const typeText = data.is_playlist ? t('logTypePlaylist') : t('logTypeVideo');
      urlInfo.innerHTML = `
        <div class="font-bold">${data.title}</div>
        <div>${t('logUploader')} ${data.uploader}</div>
        <div>${t('logType')} ${typeText}</div>
        <div>${t('logCount')} ${data.video_count} ${t('logCountFound')}</div>
      `;
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

  // Save or Clear Path Preference
  if (rememberPathCheck.checked && path) {
    localStorage.setItem(SAVED_PATH_KEY, path);
  } else {
    localStorage.removeItem(SAVED_PATH_KEY);
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
      const pathRes = await fetch('http://localhost:3000/api/check-path', {
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
  appendLog(`${t('logStartDownload')} ${url}`, 'info');

  try {
    const response = await fetch('http://localhost:3000/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        downloadPath: path,
        quality,
        metadata,
        browser
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
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

          if (eventType === 'progress') {
            // Update log with raw output
            if (data.raw) {
                appendLog(data.raw, 'progress');
            }
          } else if (eventType === 'info') {
            appendLog(data.message, 'info');
          } else if (eventType === 'error') {
            appendLog(data.message, 'error');
          } else if (eventType === 'complete') {
            appendLog(data.message, 'success');
          }
        }
      }
    }

  } catch (error: any) {
    appendLog(`Error: ${error.message}`, 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = t('startDownload');
    appendLog(t('logProcessFinished'), 'info');
  }
});

// Run localization on mount
applyLanguage();
checkDependencies();
