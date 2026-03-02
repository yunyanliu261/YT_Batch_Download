import './style.css'

const urlInput = document.getElementById('url-input') as HTMLInputElement;
const checkUrlBtn = document.getElementById('check-url-btn') as HTMLButtonElement;
const urlInfo = document.getElementById('url-info') as HTMLDivElement;
const pathInput = document.getElementById('path-input') as HTMLInputElement;
const rememberPathCheck = document.getElementById('remember-path-check') as HTMLInputElement;
const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;

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
      systemStatus.textContent = '✅ System Check: Ready (Python & FFmpeg detected)';
      systemStatus.className = 'text-xs text-center text-green-600 mt-2 font-semibold';
      downloadBtn.disabled = false;
    } else {
      systemStatus.innerHTML = `❌ System Check Failed: <br>Python: ${data.python ? '✅' : '❌'}, FFmpeg: ${data.ffmpeg ? '✅' : '❌'}`;
      systemStatus.className = 'text-xs text-center text-red-600 mt-2 font-bold';
      downloadBtn.disabled = true;
      appendLog('Missing dependencies! Please ensure Python and FFmpeg are installed.', 'error');
    }
  } catch (err) {
    systemStatus.textContent = '❌ Backend not reachable';
    systemStatus.className = 'text-xs text-center text-red-600 mt-2';
    downloadBtn.disabled = true;
  }
};
checkDependencies();

// --- Handlers ---
// --- Metadata UI Logic ---
const updateMetaAllState = () => {
  const allChecked = subCheckboxes.every(c => c.checked);
  const anyChecked = subCheckboxes.some(c => c.checked);

  if (anyChecked) {
    // If ANY sub-box is checked, the master box should look checked and say "Clear All"
    metaAll.checked = allChecked || anyChecked;
    metaAllLabel.textContent = '取消全部 (Clear All)';
    metaAllLabel.className = 'ml-2 block text-sm font-semibold cursor-pointer text-red-600 hover:text-red-800';
  } else {
    // If ALL are empty, the master box should be unchecked and say "Select All"
    metaAll.checked = false;
    metaAllLabel.textContent = '全選 (Select All)';
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
  if (!url) return alert('Please enter a URL');

  checkUrlBtn.disabled = true;
  checkUrlBtn.textContent = 'Checking...';
  urlInfo.classList.add('hidden');
  urlInfo.textContent = '';

  try {
    const res = await fetch('http://localhost:3000/api/get-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();

    if (res.ok) {
      urlInfo.classList.remove('hidden');
      urlInfo.innerHTML = `
        <div class="font-bold">${data.title}</div>
        <div>Uploader: ${data.uploader}</div>
        <div>Type: ${data.is_playlist ? 'Playlist/Channel' : 'Single Video'}</div>
        <div>Count: ${data.video_count} video(s) found</div>
      `;
      appendLog(`Checked URL: Found ${data.video_count} videos from "${data.title}"`, 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (err: any) {
    alert(`Error checking URL: ${err.message}`);
    appendLog(`URL Check Failed: ${err.message}`, 'error');
  } finally {
    checkUrlBtn.disabled = false;
    checkUrlBtn.textContent = 'Check URL';
  }
};

checkUrlBtn.addEventListener('click', performUrlCheck);

downloadBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  const path = pathInput.value.trim();
  const quality = qualitySelect.value;

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
    alert('Please enter a YouTube URL');
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
        appendLog(`Invalid Path: ${pathData.error}`, 'error');
        alert(`Download path error: ${pathData.error}`);
        return;
      }
    } catch (e) {
      appendLog('Failed to validate path with server.', 'error');
      return;
    }
  }

  // UI feedback
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Downloading...';
  clearLogs();
  appendLog(`Starting download for: ${url}`, 'info');

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
        metadata
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
    downloadBtn.textContent = 'Start Download';
    appendLog('Process finished.', 'info');
  }
});
