import SubtitleManager from "./subtitle";
import ContentAnalyzer from "./analyzer";
import UIManager from "./components/ui";

class YouTubeAIAssistant {
  constructor() {
    this.ui = null;
    this.subtitle = null;
    this.analyzer = null;
    this.initialized = false;
  }

  // 初始化助手
  async init() {
    if (this.initialized) return;

    try {
      // 檢查是否在 YouTube 視頻頁面
      if (!this.isVideoPage()) return;

      // 等待視頻元素加載
      await this.waitForElement("video");

      // 初始化組件
      this.ui = new UIManager();
      this.subtitle = new SubtitleManager();
      this.analyzer = new ContentAnalyzer();

      // 初始化 UI
      await this.ui.init();

      // 綁定消息監聽
      this.bindMessageListeners();

      // 標記初始化完成
      this.initialized = true;

      console.log("YouTube AI Assistant initialized");
    } catch (error) {
      console.error("Failed to initialize YouTube AI Assistant:", error);
    }
  }

  // 檢查是否在視頻頁面
  isVideoPage() {
    return window.location.pathname === "/watch" && new URLSearchParams(window.location.search).has("v");
  }

  // 等待元素加載
  waitForElement(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  // 綁定消息監聽
  bindMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case "getVideoInfo":
          this.handleGetVideoInfo(sendResponse);
          return true;

        case "toggleTranslation":
          this.handleToggleTranslation(request.state, sendResponse);
          return true;

        case "generateSummary":
          this.handleGenerateSummary(sendResponse);
          return true;

        case "analyzeContent":
          this.handleAnalyzeContent(sendResponse);
          return true;

        case "exportData":
          this.handleExportData(sendResponse);
          return true;
      }
    });
  }

  // 處理獲取視頻信息
  async handleGetVideoInfo(sendResponse) {
    try {
      const videoId = new URLSearchParams(window.location.search).get("v");
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
      const data = await response.json();
      sendResponse({ success: true, data: data.items[0] });
    } catch (error) {
      console.error("Failed to get video info:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 處理切換翻譯
  async handleToggleTranslation(state, sendResponse) {
    try {
      await this.subtitle.toggle(state);
      sendResponse({ success: true });
    } catch (error) {
      console.error("Failed to toggle translation:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 處理生成摘要
  async handleGenerateSummary(sendResponse) {
    try {
      const summary = await this.analyzer.generateSummary();
      sendResponse({ success: true, summary });
    } catch (error) {
      console.error("Failed to generate summary:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 處理內容分析
  async handleAnalyzeContent(sendResponse) {
    try {
      const analysis = await this.analyzer.analyzeContent();
      sendResponse({ success: true, analysis });
    } catch (error) {
      console.error("Failed to analyze content:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 處理數據導出
  async handleExportData(sendResponse) {
    try {
      const data = await this.analyzer.exportAnalysis();
      sendResponse({ success: true, data });
    } catch (error) {
      console.error("Failed to export data:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 監聽頁面變化
  observePageChanges() {
    const observer = new MutationObserver(mutations => {
      if (this.isVideoPage() && !this.initialized) {
        this.init();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// 創建並初始化助手
const assistant = new YouTubeAIAssistant();
assistant.init();
assistant.observePageChanges();
