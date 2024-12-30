# YouTube AI 助手

一個強大的 Chrome 瀏覽器插件，為 YouTube 視頻提供實時字幕翻譯、內容摘要和資料分析功能。

## 功能特點

- 實時字幕翻譯：自動將 YouTube 字幕翻譯成指定語言
- 內容摘要生成：快速生成視頻內容的重點摘要
- 資料分析：提供視頻數據的深度分析
- 資料導出：支持將分析結果導出為 JSON 格式

## 安裝步驟

1. 克隆或下載本倉庫
2. 配置 API 密鑰
   - 打開 `scripts/background.js`
   - 設置以下 API 密鑰：
     ```javascript
     const API_CONFIG = {
       YOUTUBE_API_KEY: "你的 YouTube Data API 密鑰",
       OPENAI_API_KEY: "你的 OpenAI API 密鑰",
       TRANSLATION_API_KEY: "你的 Google Cloud Translation API 密鑰",
     };
     ```
3. 在 Chrome 瀏覽器中載入插件
   - 打開 Chrome 擴展管理頁面 (chrome://extensions/)
   - 開啟右上角的「開發者模式」
   - 點擊「載入未封裝項目」
   - 選擇插件目錄

## 使用方法

1. 字幕翻譯

   - 點擊插件圖標打開控制面板
   - 選擇目標翻譯語言
   - 點擊「開啟翻譯」按鈕
   - 觀看 YouTube 視頻時將自動翻譯字幕

2. 內容摘要

   - 在 YouTube 視頻頁面點擊插件圖標
   - 點擊「生成摘要」按鈕
   - 等待系統生成視頻內容摘要

3. 資料分析

   - 在視頻頁面點擊插件圖標
   - 點擊「分析內容」按鈕
   - 查看視頻的詳細數據分析

4. 導出資料
   - 生成摘要或分析後
   - 點擊「導出資料」按鈕
   - 選擇保存位置即可導出 JSON 格式的分析結果

## 獲取 API 密鑰

1. YouTube Data API

   - 訪問 [Google Cloud Console](https://console.cloud.google.com/)
   - 創建新項目或選擇現有項目
   - 啟用 YouTube Data API
   - 在憑證頁面生成 API 密鑰

2. Google Cloud Translation API

   - 在同一個 Google Cloud 項目中
   - 啟用 Cloud Translation API
   - 使用相同或生成新的 API 密鑰

3. OpenAI API
   - 訪問 [OpenAI API](https://platform.openai.com/)
   - 註冊或登錄帳號
   - 在 API 密鑰頁面生成新的密鑰

## 注意事項

- 請確保 API 密鑰的安全性，不要分享給他人
- API 調用可能產生費用，請注意使用量
- 建議在開發環境中測試 API 功能
- 遵守相關服務的使用條款和規範

## 技術支持

如有問題或建議，請提交 Issue 或 Pull Request。

## 授權協議

本項目採用 MIT 授權協議。
