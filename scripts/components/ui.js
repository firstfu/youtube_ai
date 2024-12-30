class UIManager {
  constructor() {
    this.container = null;
    this.subtitleManager = null;
    this.contentAnalyzer = null;
    this.isAnalyzing = false;
  }

  // 初始化 UI
  async init() {
    try {
      // 創建主容器
      this.createContainer();
      // 創建控制面板
      this.createControlPanel();
      // 創建結果顯示區
      this.createResultPanel();
      // 綁定事件
      this.bindEvents();
      // 載入用戶設置
      await this.loadSettings();
    } catch (error) {
      console.error("UI initialization failed:", error);
      this.showError("初始化失敗，請刷新頁面重試");
    }
  }

  // 創建主容器
  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "youtube-ai-assistant";
    this.container.className = "youtube-ai-container";
    document.body.appendChild(this.container);
  }

  // 創建控制面板
  createControlPanel() {
    const panel = document.createElement("div");
    panel.className = "control-panel";

    // 字幕控制
    const subtitleControl = document.createElement("div");
    subtitleControl.className = "control-section";
    subtitleControl.innerHTML = `
      <div class="section-header">
        <h3>字幕翻譯</h3>
        <div class="toggle-switch">
          <input type="checkbox" id="subtitle-toggle">
          <label for="subtitle-toggle"></label>
        </div>
      </div>
      <div class="section-content">
        <select id="target-language">
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
        <button id="subtitle-settings" class="icon-button">
          <i class="settings-icon"></i>
        </button>
      </div>
    `;

    // 內容分析
    const analysisControl = document.createElement("div");
    analysisControl.className = "control-section";
    analysisControl.innerHTML = `
      <div class="section-header">
        <h3>內容分析</h3>
      </div>
      <div class="section-content">
        <button id="generate-summary" class="primary-button">
          生成摘要
        </button>
        <button id="extract-data" class="secondary-button">
          提取數據
        </button>
      </div>
    `;

    // 數據導出
    const exportControl = document.createElement("div");
    exportControl.className = "control-section";
    exportControl.innerHTML = `
      <div class="section-header">
        <h3>數據導出</h3>
      </div>
      <div class="section-content">
        <button id="export-data" class="primary-button">
          導出分析
        </button>
      </div>
    `;

    panel.appendChild(subtitleControl);
    panel.appendChild(analysisControl);
    panel.appendChild(exportControl);
    this.container.appendChild(panel);
  }

  // 創建結果顯示區
  createResultPanel() {
    const panel = document.createElement("div");
    panel.className = "result-panel";

    panel.innerHTML = `
      <div class="result-header">
        <h3>分析結果</h3>
        <button id="close-result" class="icon-button">
          <i class="close-icon"></i>
        </button>
      </div>
      <div class="result-content">
        <div id="summary-section" class="result-section">
          <h4>內容摘要</h4>
          <div class="summary-content"></div>
        </div>
        <div id="keypoints-section" class="result-section">
          <h4>關鍵點</h4>
          <div class="keypoints-content"></div>
        </div>
        <div id="timeline-section" class="result-section">
          <h4>時間軸</h4>
          <div class="timeline-content"></div>
        </div>
      </div>
    `;

    this.container.appendChild(panel);
  }

  // 綁定事件
  bindEvents() {
    // 字幕控制
    const subtitleToggle = document.getElementById("subtitle-toggle");
    subtitleToggle.addEventListener("change", e => {
      this.toggleSubtitle(e.target.checked);
    });

    const targetLanguage = document.getElementById("target-language");
    targetLanguage.addEventListener("change", e => {
      this.changeTargetLanguage(e.target.value);
    });

    const subtitleSettings = document.getElementById("subtitle-settings");
    subtitleSettings.addEventListener("click", () => {
      this.openSettings();
    });

    // 內容分析
    const generateSummary = document.getElementById("generate-summary");
    generateSummary.addEventListener("click", () => {
      this.generateSummary();
    });

    const extractData = document.getElementById("extract-data");
    extractData.addEventListener("click", () => {
      this.extractData();
    });

    // 數據導出
    const exportData = document.getElementById("export-data");
    exportData.addEventListener("click", () => {
      this.exportData();
    });

    // 結果面板
    const closeResult = document.getElementById("close-result");
    closeResult.addEventListener("click", () => {
      this.toggleResultPanel(false);
    });
  }

  // 載入設置
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(["defaultTargetLanguage", "enableAutoTranslation", "subtitleStyle"]);

      if (settings.defaultTargetLanguage) {
        document.getElementById("target-language").value = settings.defaultTargetLanguage;
      }

      if (settings.enableAutoTranslation) {
        document.getElementById("subtitle-toggle").checked = true;
        this.toggleSubtitle(true);
      }

      if (settings.subtitleStyle) {
        this.subtitleManager?.updateStyle(settings.subtitleStyle);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  // 切換字幕
  async toggleSubtitle(enabled) {
    if (!this.subtitleManager) {
      this.subtitleManager = new SubtitleManager();
      await this.subtitleManager.init();
    }
    this.subtitleManager.toggle(enabled);
  }

  // 更改目標語言
  changeTargetLanguage(language) {
    if (this.subtitleManager) {
      this.subtitleManager.setTargetLanguage(language);
    }
    chrome.storage.sync.set({ defaultTargetLanguage: language });
  }

  // 打開設置
  openSettings() {
    // TODO: 實現設置面板
  }

  // 生成摘要
  async generateSummary() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    try {
      if (!this.contentAnalyzer) {
        this.contentAnalyzer = new ContentAnalyzer();
        await this.contentAnalyzer.init(this.getVideoId());
      }

      const outline = await this.contentAnalyzer.generateOutline();
      this.displaySummary(outline);
      this.toggleResultPanel(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      this.showError("生成摘要失敗");
    } finally {
      this.isAnalyzing = false;
    }
  }

  // 提取數據
  async extractData() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    try {
      if (!this.contentAnalyzer) {
        this.contentAnalyzer = new ContentAnalyzer();
        await this.contentAnalyzer.init(this.getVideoId());
      }

      const keyPoints = await this.contentAnalyzer.extractKeyPoints();
      const timeline = this.contentAnalyzer.generateTimeline();

      this.displayKeyPoints(keyPoints);
      this.displayTimeline(timeline);
      this.toggleResultPanel(true);
    } catch (error) {
      console.error("Failed to extract data:", error);
      this.showError("數據提取失敗");
    } finally {
      this.isAnalyzing = false;
    }
  }

  // 導出數據
  async exportData() {
    if (!this.contentAnalyzer) return;

    try {
      const analysis = await this.contentAnalyzer.exportAnalysis();
      if (!analysis) {
        this.showError("無可導出的數據");
        return;
      }

      const blob = new Blob([JSON.stringify(analysis, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `youtube-analysis-${this.getVideoId()}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSuccess("數據導出成功");
    } catch (error) {
      console.error("Failed to export data:", error);
      this.showError("數據導出失敗");
    }
  }

  // 顯示摘要
  displaySummary(outline) {
    const container = document.querySelector(".summary-content");
    if (!container) return;

    container.innerHTML = outline
      .map(
        section => `
        <div class="outline-section level-${section.level}">
          <h${section.level + 2}>${section.title}</h${section.level + 2}>
          <div class="section-content">
            ${section.content.map(text => `<p>${text}</p>`).join("")}
          </div>
        </div>
      `
      )
      .join("");
  }

  // 顯示關鍵點
  displayKeyPoints(points) {
    const container = document.querySelector(".keypoints-content");
    if (!container) return;

    container.innerHTML = points
      .map(
        point => `
        <div class="keypoint-item">
          <div class="keypoint-content">${point.content}</div>
          ${
            point.timestamp
              ? `
            <div class="keypoint-timestamp" data-time="${point.timestamp}">
              ${point.timestamp}
            </div>
          `
              : ""
          }
        </div>
      `
      )
      .join("");
  }

  // 顯示時間軸
  displayTimeline(timeline) {
    const container = document.querySelector(".timeline-content");
    if (!container) return;

    container.innerHTML = timeline
      .map(
        segment => `
        <div class="timeline-segment">
          <div class="segment-time">
            ${this.formatTime(segment.startTime)} - ${this.formatTime(segment.endTime)}
          </div>
          <div class="segment-content">
            ${segment.content.map(text => `<p>${text}</p>`).join("")}
          </div>
        </div>
      `
      )
      .join("");
  }

  // 格式化時間
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // 切換結果面板
  toggleResultPanel(show) {
    const panel = document.querySelector(".result-panel");
    if (panel) {
      panel.style.display = show ? "block" : "none";
    }
  }

  // 顯示錯誤信息
  showError(message) {
    this.showNotification(message, "error");
  }

  // 顯示成功信息
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  // 顯示通知
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  // 獲取視頻ID
  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }
}

export default UIManager;
