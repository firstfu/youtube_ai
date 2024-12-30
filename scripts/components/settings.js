class SettingsManager {
  constructor() {
    this.container = null;
    this.settings = {
      defaultTargetLanguage: "zh-TW",
      enableAutoTranslation: true,
      subtitleStyle: {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        position: "bottom",
      },
      apiKeys: {
        youtube: "",
        openai: "",
        translation: "",
      },
    };
  }

  // 初始化設置
  async init() {
    await this.loadSettings();
    this.createSettingsPanel();
    this.bindEvents();
  }

  // 載入設置
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(["defaultTargetLanguage", "enableAutoTranslation", "subtitleStyle", "apiKeys"]);

      this.settings = {
        ...this.settings,
        ...settings,
      };
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  // 創建設置面板
  createSettingsPanel() {
    this.container = document.createElement("div");
    this.container.className = "settings-panel";

    this.container.innerHTML = `
      <div class="settings-header">
        <h2>設置</h2>
        <button id="close-settings" class="icon-button">
          <i class="close-icon"></i>
        </button>
      </div>

      <div class="settings-content">
        <div class="settings-section">
          <h3>基本設置</h3>

          <div class="setting-item">
            <label>默認目標語言</label>
            <select id="default-language">
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          <div class="setting-item">
            <label>自動開啟翻譯</label>
            <div class="toggle-switch">
              <input type="checkbox" id="auto-translation">
              <label for="auto-translation"></label>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3>字幕樣式</h3>

          <div class="setting-item">
            <label>字體大小</label>
            <select id="font-size">
              <option value="12px">小</option>
              <option value="16px">中</option>
              <option value="20px">大</option>
            </select>
          </div>

          <div class="setting-item">
            <label>字幕顏色</label>
            <input type="color" id="text-color" value="#ffffff">
          </div>

          <div class="setting-item">
            <label>背景顏色</label>
            <input type="color" id="bg-color" value="#000000">
            <input type="range" id="bg-opacity" min="0" max="100" value="70">
          </div>

          <div class="setting-item">
            <label>字幕位置</label>
            <select id="subtitle-position">
              <option value="bottom">底部</option>
              <option value="top">頂部</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h3>API 設置</h3>

          <div class="setting-item">
            <label>YouTube API Key</label>
            <input type="password" id="youtube-api-key" placeholder="輸入 YouTube API Key">
          </div>

          <div class="setting-item">
            <label>OpenAI API Key</label>
            <input type="password" id="openai-api-key" placeholder="輸入 OpenAI API Key">
          </div>

          <div class="setting-item">
            <label>Translation API Key</label>
            <input type="password" id="translation-api-key" placeholder="輸入 Translation API Key">
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button id="save-settings" class="primary-button">保存設置</button>
        <button id="reset-settings" class="secondary-button">重置設置</button>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  // 綁定事件
  bindEvents() {
    // 關閉按鈕
    const closeButton = document.getElementById("close-settings");
    closeButton.addEventListener("click", () => {
      this.hide();
    });

    // 保存按鈕
    const saveButton = document.getElementById("save-settings");
    saveButton.addEventListener("click", () => {
      this.saveSettings();
    });

    // 重置按鈕
    const resetButton = document.getElementById("reset-settings");
    resetButton.addEventListener("click", () => {
      this.resetSettings();
    });

    // 背景透明度
    const bgOpacity = document.getElementById("bg-opacity");
    const bgColor = document.getElementById("bg-color");
    bgOpacity.addEventListener("input", () => {
      const color = bgColor.value;
      const opacity = bgOpacity.value / 100;
      this.updateBackgroundColor(color, opacity);
    });

    // 背景顏色
    bgColor.addEventListener("input", () => {
      const color = bgColor.value;
      const opacity = bgOpacity.value / 100;
      this.updateBackgroundColor(color, opacity);
    });
  }

  // 更新背景顏色
  updateBackgroundColor(color, opacity) {
    const rgb = this.hexToRgb(color);
    this.settings.subtitleStyle.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  // 十六進制轉 RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // 保存設置
  async saveSettings() {
    try {
      // 獲取表單值
      this.settings.defaultTargetLanguage = document.getElementById("default-language").value;
      this.settings.enableAutoTranslation = document.getElementById("auto-translation").checked;

      this.settings.subtitleStyle = {
        fontSize: document.getElementById("font-size").value,
        color: document.getElementById("text-color").value,
        backgroundColor: this.settings.subtitleStyle.backgroundColor,
        position: document.getElementById("subtitle-position").value,
      };

      this.settings.apiKeys = {
        youtube: document.getElementById("youtube-api-key").value,
        openai: document.getElementById("openai-api-key").value,
        translation: document.getElementById("translation-api-key").value,
      };

      // 保存到 storage
      await chrome.storage.sync.set(this.settings);

      // 發送更新消息
      chrome.runtime.sendMessage({
        action: "settingsUpdated",
        settings: this.settings,
      });

      this.showSuccess("設置已保存");
      this.hide();
    } catch (error) {
      console.error("Failed to save settings:", error);
      this.showError("保存設置失敗");
    }
  }

  // 重置設置
  async resetSettings() {
    try {
      const defaultSettings = {
        defaultTargetLanguage: "zh-TW",
        enableAutoTranslation: true,
        subtitleStyle: {
          fontSize: "16px",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          position: "bottom",
        },
        apiKeys: {
          youtube: "",
          openai: "",
          translation: "",
        },
      };

      await chrome.storage.sync.set(defaultSettings);
      this.settings = defaultSettings;
      this.updateFormValues();
      this.showSuccess("設置已重置");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      this.showError("重置設置失敗");
    }
  }

  // 更新表單值
  updateFormValues() {
    document.getElementById("default-language").value = this.settings.defaultTargetLanguage;
    document.getElementById("auto-translation").checked = this.settings.enableAutoTranslation;

    document.getElementById("font-size").value = this.settings.subtitleStyle.fontSize;
    document.getElementById("text-color").value = this.settings.subtitleStyle.color;
    document.getElementById("subtitle-position").value = this.settings.subtitleStyle.position;

    const rgb = this.getRgbValues(this.settings.subtitleStyle.backgroundColor);
    document.getElementById("bg-color").value = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    document.getElementById("bg-opacity").value = Math.round(rgb.a * 100);

    document.getElementById("youtube-api-key").value = this.settings.apiKeys.youtube;
    document.getElementById("openai-api-key").value = this.settings.apiKeys.openai;
    document.getElementById("translation-api-key").value = this.settings.apiKeys.translation;
  }

  // 獲取 RGB 值
  getRgbValues(rgba) {
    const matches = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
    return matches
      ? {
          r: parseInt(matches[1]),
          g: parseInt(matches[2]),
          b: parseInt(matches[3]),
          a: matches[4] ? parseFloat(matches[4]) : 1,
        }
      : null;
  }

  // RGB 轉十六進制
  rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  // 顯示設置面板
  show() {
    if (!this.container) {
      this.createSettingsPanel();
    }
    this.updateFormValues();
    this.container.style.display = "block";
  }

  // 隱藏設置面板
  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  // 顯示成功消息
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  // 顯示錯誤消息
  showError(message) {
    this.showNotification(message, "error");
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
}

export default SettingsManager;
