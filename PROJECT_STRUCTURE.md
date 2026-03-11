# 專案架構與檔案說明 (Project Structure)

本專案是一個基於 Node.js (後端) 與 Vite + Vanilla TypeScript (前端) 構建的 YouTube 批次下載工具。
以下是專案中各主要資料夾與檔案的功能詳細說明。

## 根目錄 (Root Directory)

根目錄包含了啟動整個應用程式的腳本，以及全域性的說明文件。

*   **`start_app.bat`**: Windows 專用的自動化啟動腳本。它會檢查系統是否安裝了 Node.js，自動為 `server` 與 `client` 安裝必要的套件 (`npm install`)，接著在背景啟動後端伺服器 (Port 3000)，並啟動前端 Vite 開發伺服器並自動開啟瀏覽器。
*   **`README.md`**: 專案的主要說明文件，包含功能介紹、安裝步驟、使用指南以及常見問題排除 (Troubleshooting)。
*   **`CHANGELOG.md`**: 紀錄專案每次更新與修改的歷史紀錄。
*   **`PROJECT_STRUCTURE.md`**: (本檔案) 詳細說明專案架構與各個檔案的用途。
*   **`.gitignore`**: Git 版本控制的忽略清單，確保 `node_modules` 等暫存或依賴檔案不會被上傳到儲存庫中。

---

## 後端資料夾 (`server/`)

負責處理與 YouTube 的實際連線、執行 `yt-dlp` 指令，並透過 Server-Sent Events (SSE) 將下載進度即時回傳給前端。

*   **`index.js`**: 後端伺服器的核心程式碼。
    *   使用 `express` 建立 HTTP 伺服器 (預設執行在 `localhost:3000`)。
    *   提供 `/api/check-deps` 端點：檢查系統中是否有安裝 Python 與 FFmpeg。
    *   提供 `/api/check-url` 端點：在正式下載前，利用 `yt-dlp --dump-single-json` 嘗試獲取影片或頻道的基本資訊 (標題、上傳者、影片數量等)。
    *   提供 `/api/download` 端點 (GET 方法，支援 SSE)：接收前端傳來的參數 (網址、路徑、畫質、Cookies、Metadata 選項)，並呼叫 `yt-dlp-exec` 執行下載程序。同時解析 `yt-dlp` 的輸出日誌 (stdout/stderr)，即時串流給前端。
*   **`package.json` & `package-lock.json`**: 定義後端所需的 Node.js 依賴套件。主要依賴包括 `express`, `cors` (處理跨域請求), 以及 `yt-dlp-exec` (用來在 Node.js 中安全地執行 `yt-dlp` 執行檔)。

---

## 前端資料夾 (`client/`)

負責呈現使用者介面 (UI)，接收使用者的輸入，並與後端 API 進行溝通。使用 Vite 作為建置工具。

*   **`index.html`**: 應用程式的主要進入點與 HTML 結構。包含了所有的 UI 元素，如輸入框、按鈕、下拉選單、Metadata 勾選框以及進度日誌顯示區。
*   **`src/main.ts`**: 前端的核心 TypeScript 邏輯。
    *   負責處理語系切換 (英文/繁體中文)。
    *   處理 Metadata "Select All / Clear All" 的勾選邏輯。
    *   讀取與儲存使用者的「下載路徑」設定到瀏覽器的 `localStorage` 中。
    *   發送請求到後端的 `/api/check-deps` 與 `/api/check-url` 進行系統與網址驗證。
    *   在使用者按下下載時，建立 `EventSource` 連線到後端的 `/api/download`，並將接收到的即時日誌更新到 UI 的 `Terminal-like` 區域。
*   **`src/style.css`**: 全域樣式表，主要用於引入 Tailwind CSS 的核心指令 (`@tailwind base; @tailwind components; @tailwind utilities;`)。
*   **`tailwind.config.js`**: Tailwind CSS 的設定檔，定義了工具類別的掃描範圍與自定義樣式。
*   **`postcss.config.js`**: PostCSS 的設定檔，讓 Vite 能夠正確編譯 Tailwind CSS。
*   **`tsconfig.json`**: TypeScript 的編譯設定檔，確保 `main.ts` 能正確被轉譯為瀏覽器可執行的 JavaScript。
*   **`package.json` & `package-lock.json`**: 定義前端所需的 Node.js 依賴套件。主要包含開發依賴 (`devDependencies`) 如 `vite`, `typescript`, `tailwindcss` 等。
*   **`public/`**: 存放靜態資源 (如 favicon) 的資料夾。
