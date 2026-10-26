# 專案架構與檔案說明 (Project Structure)

本專案是一個基於 Node.js (後端) 與 Vite + Vanilla TypeScript (前端) 構建的 YouTube 批次下載工具。
以下是專案中各主要資料夾與檔案的功能詳細說明。

## 根目錄 (Root Directory)

根目錄包含了啟動整個應用程式的腳本，以及全域性的說明文件。

*   **`start_app.bat`**: Windows 專用的自動化啟動腳本。它會檢查系統是否安裝了 Node.js，自動為 `server` 與 `client` 安裝必要的套件 (`npm install`，並略過 Windows 不需要的 Python 檢查)，接著在背景啟動後端伺服器 (Port 3000)，並啟動前端 Vite 開發伺服器並自動開啟瀏覽器。
*   **`scripts/check-ports.js`**: 啟動腳本在啟動前執行，檢查連接埠 3000 與 5173 是否已被佔用（例如舊版本仍在執行）；被佔用時會說明如何結束該程式，並停止啟動。
*   **`start_app.sh`**: macOS / Linux 的啟動腳本，功能同上；後端在背景執行，前端在前景執行，按 `Ctrl+C` 會同時關閉兩者。
*   **`README.md`**: 專案的主要說明文件，包含功能介紹、安裝步驟、使用指南以及常見問題排除 (Troubleshooting)。
*   **`CHANGELOG.md`**: 紀錄專案每次更新與修改的歷史紀錄。
*   **`PROJECT_STRUCTURE.md`**: (本檔案) 詳細說明專案架構與各個檔案的用途。
*   **`.gitignore`**: Git 版本控制的忽略清單，確保 `node_modules` 等暫存或依賴檔案不會被上傳到儲存庫中。

---

## 後端資料夾 (`server/`)

負責處理與 YouTube 的實際連線、執行 `yt-dlp` 指令，並透過 Server-Sent Events (SSE) 將下載進度即時回傳給前端。

*   **`index.js`**: 進入點。啟動時先檢查並更新 `yt-dlp`，再於 `127.0.0.1:3000` 啟動伺服器（只接受本機連線）。
*   **`src/app.js`**: 建立 Express 應用程式，套用安全檢查並掛上所有路由。
*   **`src/config.js`**: 連接埠、預設下載資料夾 (`server/downloads`) 等設定。
*   **`src/security.js`**: 只允許本機前端呼叫 API：檢查 `Host` 與 `Origin` 標頭，並限制 CORS。
*   **`src/validation.js`**: 驗證輸入：網址必須是 `http(s)://`、下載路徑必須是絕對路徑、瀏覽器與畫質只接受已知選項、資料夾名稱去除不合法字元。
*   **`src/cookies.js`**: 上傳的 `cookies.txt` 暫存檔的建立與刪除。
*   **`src/ytdlp.js`**: 所有與 `yt-dlp` 有關的邏輯：自動更新、版本檢查、取得影片資訊、組合下載參數、解析進度輸出。
*   **`src/errors.js`**: 將 yt-dlp 的錯誤分類（會員限定、年齡限制、機器人驗證、私人、地區限制、DRM／格式、無法取得），並在下載結束時產生摘要（成功／略過／失敗數量、是否建議提供 cookies）。
*   **`src/library.js`**: 決定下載資料夾（影片與頻道放在 `<頻道>/`，播放清單放在 `<頻道>/<清單名稱>/`），讀取 `download_archive.txt` 並計算已下載／待下載數量。
*   **`src/routes/system.js`**: `/api/health`、`/api/check-dependencies`（檢查 yt-dlp、FFmpeg、Python）、`/api/check-path`。
*   **`src/routes/info.js`**: `/api/get-info`：下載前取得影片、播放清單或頻道的標題、上傳者與影片數量。
*   **`src/routes/download.js`**: `/api/download`（POST，以 SSE 回傳）：執行下載並即時回傳進度 (`progress`、`item`)、訊息與日誌；用戶端中斷連線時會停止 `yt-dlp`。
*   **`test/`**: 後端測試，執行 `npm test`（使用 Node.js 內建的 `node:test`）。
*   **`package.json` & `package-lock.json`**: 定義後端所需的 Node.js 依賴套件：`express`、`cors`、`body-parser`、`youtube-dl-exec`（安裝時下載 `yt-dlp` 執行檔）、`ffmpeg-static`（安裝時下載 FFmpeg）。

---

## 前端資料夾 (`client/`)

負責呈現使用者介面 (UI)，接收使用者的輸入，並與後端 API 進行溝通。使用 Vite 作為建置工具。

*   **`index.html`**: 應用程式的主要進入點與 HTML 結構。包含了所有的 UI 元素，如輸入框、按鈕、下拉選單、Metadata 勾選框以及進度日誌顯示區。
*   **`src/main.ts`**: 前端的核心 TypeScript 邏輯。
    *   負責處理語系切換 (英文/繁體中文)。
    *   處理 Metadata "Select All / Clear All" 的勾選邏輯。
    *   讀取與儲存使用者的「下載路徑」設定到瀏覽器的 `localStorage` 中。
    *   發送請求到後端的 `/api/check-dependencies` 與 `/api/get-info` 進行系統與網址驗證。
    *   在使用者按下下載時，以 `fetch` POST 到後端的 `/api/download` 並讀取 SSE 串流，更新進度條與日誌區域；按下「取消」會中斷連線，後端隨即停止下載。
*   **`src/style.css`**: 全域樣式表，主要用於引入 Tailwind CSS 的核心指令 (`@tailwind base; @tailwind components; @tailwind utilities;`)。
*   **`tailwind.config.js`**: Tailwind CSS 的設定檔，定義了工具類別的掃描範圍與自定義樣式。
*   **`postcss.config.js`**: PostCSS 的設定檔，讓 Vite 能夠正確編譯 Tailwind CSS。
*   **`tsconfig.json`**: TypeScript 的編譯設定檔，確保 `main.ts` 能正確被轉譯為瀏覽器可執行的 JavaScript。
*   **`package.json` & `package-lock.json`**: 定義前端所需的 Node.js 依賴套件。主要包含開發依賴 (`devDependencies`) 如 `vite`, `typescript`, `tailwindcss` 等。
*   **`public/`**: 存放靜態資源 (如 favicon) 的資料夾。
