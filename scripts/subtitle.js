class SubtitleManager {
  constructor() {
    this.subtitles = null;
    this.currentLanguage = null;
    this.targetLanguage = null;
    this.isEnabled = false;
    this.styleConfig = {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      position: "bottom",
    };
  }

  // 初始化字幕管理器
  async init() {
    try {
      // 檢測視頻語言
      this.currentLanguage = await this.detectVideoLanguage();
      // 載入字幕數據
      await this.loadSubtitles();
      // 初始化字幕容器
      this.initSubtitleContainer();
      // 綁定事件監聽
      this.bindEvents();
    } catch (error) {
      console.error("Subtitle initialization failed:", error);
      throw error;
    }
  }

  // 檢測視頻語言
  async detectVideoLanguage() {
    try {
      const videoId = this.getVideoId();
      const response = await chrome.runtime.sendMessage({
        action: "getVideoInfo",
        videoId: videoId,
      });
      return response.defaultLanguage || "en";
    } catch (error) {
      console.error("Language detection failed:", error);
      return "en";
    }
  }

  // 載入字幕數據
  async loadSubtitles() {
    try {
      const videoId = this.getVideoId();
      const response = await chrome.runtime.sendMessage({
        action: "getSubtitles",
        videoId: videoId,
        language: this.currentLanguage,
      });
      this.subtitles = this.parseSubtitles(response.subtitles);
    } catch (error) {
      console.error("Failed to load subtitles:", error);
      throw error;
    }
  }

  // 解析字幕數據
  parseSubtitles(rawSubtitles) {
    return rawSubtitles.map(subtitle => ({
      id: subtitle.id,
      startTime: this.parseTime(subtitle.start),
      endTime: this.parseTime(subtitle.end),
      text: subtitle.text,
      translation: null,
    }));
  }

  // 時間格式轉換
  parseTime(timeString) {
    const parts = timeString.split(":");
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }

  // 初始化字幕容器
  initSubtitleContainer() {
    const container = document.createElement("div");
    container.id = "ai-subtitle-container";
    container.style.cssText = `
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      text-align: center;
      pointer-events: none;
      transition: all 0.3s ease;
      ${this.styleConfig.position}: 10%;
    `;
    document.querySelector(".html5-video-container").appendChild(container);
  }

  // 更新字幕樣式
  updateStyle(newStyle) {
    this.styleConfig = { ...this.styleConfig, ...newStyle };
    const container = document.getElementById("ai-subtitle-container");
    if (container) {
      Object.assign(container.style, {
        fontSize: this.styleConfig.fontSize,
        color: this.styleConfig.color,
        backgroundColor: this.styleConfig.backgroundColor,
        [this.styleConfig.position]: "10%",
      });
    }
  }

  // 翻譯字幕
  async translateSubtitle(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "translateText",
        text: text,
        from: this.currentLanguage,
        to: this.targetLanguage,
      });
      return response.translation;
    } catch (error) {
      console.error("Translation failed:", error);
      return text;
    }
  }

  // 顯示字幕
  async showSubtitle(subtitle) {
    const container = document.getElementById("ai-subtitle-container");
    if (!container || !this.isEnabled) return;

    // 如果需要翻譯且還沒有翻譯
    if (this.targetLanguage && !subtitle.translation) {
      subtitle.translation = await this.translateSubtitle(subtitle.text);
    }

    // 創建字幕元素
    const subtitleElement = document.createElement("div");
    subtitleElement.className = "ai-subtitle-text";

    // 設置字幕內容
    if (this.targetLanguage) {
      subtitleElement.innerHTML = `
        <div class="original-text">${subtitle.text}</div>
        <div class="translated-text">${subtitle.translation}</div>
      `;
    } else {
      subtitleElement.textContent = subtitle.text;
    }

    // 清除舊字幕
    container.innerHTML = "";
    container.appendChild(subtitleElement);
  }

  // 綁定事件監聽
  bindEvents() {
    const video = document.querySelector("video");
    if (!video) return;

    video.addEventListener("timeupdate", () => {
      if (!this.isEnabled || !this.subtitles) return;

      const currentTime = video.currentTime;
      const currentSubtitle = this.subtitles.find(subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime);

      if (currentSubtitle) {
        this.showSubtitle(currentSubtitle);
      } else {
        const container = document.getElementById("ai-subtitle-container");
        if (container) container.innerHTML = "";
      }
    });
  }

  // 切換字幕顯示
  toggle(state) {
    this.isEnabled = state;
    const container = document.getElementById("ai-subtitle-container");
    if (container) {
      container.style.display = state ? "block" : "none";
    }
  }

  // 設置目標語言
  setTargetLanguage(language) {
    this.targetLanguage = language;
    // 清除已有的翻譯緩存
    if (this.subtitles) {
      this.subtitles.forEach(subtitle => {
        subtitle.translation = null;
      });
    }
  }

  // 獲取視頻ID
  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }
}

// 導出字幕管理器
export default SubtitleManager;
