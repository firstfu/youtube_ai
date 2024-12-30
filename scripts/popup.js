import SettingsManager from "./components/settings.js";

class PopupManager {
  constructor() {
    this.settings = new SettingsManager();
    this.isTranslating = false;
    this.isGeneratingSummary = false;
    this.isAnalyzing = false;
  }

  // 初始化
  async init() {
    await this.settings.init();
    this.bindEvents();
    this.updateButtonStates();
  }

  // 綁定事件
  bindEvents() {
    // 設置按鈕
    const settingsButton = document.getElementById("settings-button");
    settingsButton.addEventListener("click", () => {
      this.settings.show();
    });

    // 翻譯按鈕
    const toggleTranslation = document.getElementById("toggle-translation");
    toggleTranslation.addEventListener("click", () => {
      this.toggleTranslation();
    });

    // 目標語言選擇
    const targetLanguage = document.getElementById("target-language");
    targetLanguage.addEventListener("change", () => {
      this.updateTargetLanguage(targetLanguage.value);
    });

    // 生成摘要按鈕
    const generateSummary = document.getElementById("generate-summary");
    generateSummary.addEventListener("click", () => {
      this.generateSummary();
    });

    // 分析內容按鈕
    const analyzeContent = document.getElementById("analyze-content");
    analyzeContent.addEventListener("click", () => {
      this.analyzeContent();
    });

    // 導出數據按鈕
    const exportData = document.getElementById("export-data");
    exportData.addEventListener("click", () => {
      this.exportData();
    });

    // 監聽設置更新
    chrome.runtime.onMessage.addListener(message => {
      if (message.action === "settingsUpdated") {
        this.onSettingsUpdated(message.settings);
      }
    });
  }

  // 切換翻譯
  async toggleTranslation() {
    try {
      const button = document.getElementById("toggle-translation");
      this.isTranslating = !this.isTranslating;

      button.textContent = this.isTranslating ? "停止翻譯" : "開啟翻譯";
      button.classList.toggle("active", this.isTranslating);

      // 發送消息到 content script
      const tab = await this.getCurrentTab();
      chrome.tabs.sendMessage(tab.id, {
        action: "toggleTranslation",
        isEnabled: this.isTranslating,
        targetLanguage: document.getElementById("target-language").value,
      });
    } catch (error) {
      console.error("Failed to toggle translation:", error);
      this.showError("切換翻譯失敗");
    }
  }

  // 更新目標語言
  async updateTargetLanguage(language) {
    try {
      if (this.isTranslating) {
        const tab = await this.getCurrentTab();
        chrome.tabs.sendMessage(tab.id, {
          action: "updateTargetLanguage",
          targetLanguage: language,
        });
      }
    } catch (error) {
      console.error("Failed to update target language:", error);
      this.showError("更新目標語言失敗");
    }
  }

  // 生成摘要
  async generateSummary() {
    try {
      const button = document.getElementById("generate-summary");
      const resultBox = document.getElementById("summary-result");

      if (this.isGeneratingSummary) {
        return;
      }

      this.isGeneratingSummary = true;
      button.disabled = true;
      button.textContent = "生成中...";
      resultBox.textContent = "正在生成摘要，請稍候...";

      const tab = await this.getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "generateSummary",
      });

      resultBox.textContent = response.summary;
    } catch (error) {
      console.error("Failed to generate summary:", error);
      this.showError("生成摘要失敗");
    } finally {
      this.isGeneratingSummary = false;
      const button = document.getElementById("generate-summary");
      button.disabled = false;
      button.textContent = "生成摘要";
    }
  }

  // 分析內容
  async analyzeContent() {
    try {
      const button = document.getElementById("analyze-content");
      const resultBox = document.getElementById("analysis-result");

      if (this.isAnalyzing) {
        return;
      }

      this.isAnalyzing = true;
      button.disabled = true;
      button.textContent = "分析中...";
      resultBox.textContent = "正在分析內容，請稍候...";

      const tab = await this.getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "analyzeContent",
      });

      resultBox.textContent = JSON.stringify(response.analysis, null, 2);
    } catch (error) {
      console.error("Failed to analyze content:", error);
      this.showError("分析內容失敗");
    } finally {
      this.isAnalyzing = false;
      const button = document.getElementById("analyze-content");
      button.disabled = false;
      button.textContent = "分析內容";
    }
  }

  // 導出數據
  async exportData() {
    try {
      const tab = await this.getCurrentTab();
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "exportData",
      });

      // 創建並下載文件
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-analysis-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSuccess("數據導出成功");
    } catch (error) {
      console.error("Failed to export data:", error);
      this.showError("導出數據失敗");
    }
  }

  // 獲取當前標籤頁
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // 更新按鈕狀態
  updateButtonStates() {
    const toggleTranslation = document.getElementById("toggle-translation");
    const generateSummary = document.getElementById("generate-summary");
    const analyzeContent = document.getElementById("analyze-content");
    const exportData = document.getElementById("export-data");

    toggleTranslation.disabled = this.isGeneratingSummary || this.isAnalyzing;
    generateSummary.disabled = this.isAnalyzing;
    analyzeContent.disabled = this.isGeneratingSummary;
    exportData.disabled = this.isGeneratingSummary || this.isAnalyzing;
  }

  // 設置更新回調
  onSettingsUpdated(settings) {
    // 更新界面元素
    const targetLanguage = document.getElementById("target-language");
    targetLanguage.value = settings.defaultTargetLanguage;

    // 如果啟用了自動翻譯，開始翻譯
    if (settings.enableAutoTranslation && !this.isTranslating) {
      this.toggleTranslation();
    }
  }

  // 顯示成功消息
  showSuccess(message) {
    this.settings.showSuccess(message);
  }

  // 顯示錯誤消息
  showError(message) {
    this.settings.showError(message);
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  const popup = new PopupManager();
  popup.init();
});
