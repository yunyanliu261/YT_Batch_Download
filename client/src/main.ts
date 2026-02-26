import './style.css'

const urlInput = document.getElementById('url-input') as HTMLInputElement;
const checkUrlBtn = document.getElementById('check-url-btn') as HTMLButtonElement;
const urlInfo = document.getElementById('url-info') as HTMLDivElement;
const pathInput = document.getElementById('path-input') as HTMLInputElement;
const qualitySelect = document.getElementById('quality-select') as HTMLSelectElement;
const metadataCheck = document.getElementById('metadata-check') as HTMLInputElement;
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
  const metadata = metadataCheck.checked;

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
            // yt-dlp output can be frequent. Maybe debounce UI update if needed.
            // But usually appending is fine.
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
