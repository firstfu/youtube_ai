// API 配置
const API_CONFIG = {
  youtube: {
    key: process.env.YOUTUBE_API_KEY,
    baseUrl: "https://www.googleapis.com/youtube/v3",
  },
  translation: {
    key: process.env.TRANSLATION_API_KEY,
    baseUrl: "https://translation.googleapis.com/language/translate/v2",
  },
  openai: {
    key: process.env.OPENAI_API_KEY,
    baseUrl: "https://api.openai.com/v1",
  },
};

// 緩存管理
const cache = {
  translations: new Map(),
  subtitles: new Map(),
  videoInfo: new Map(),
};

// 處理來自內容腳本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getVideoInfo":
      getVideoInfo(request.videoId).then(sendResponse);
      return true;
    case "getSubtitles":
      getSubtitles(request.videoId, request.language).then(sendResponse);
      return true;
    case "translateText":
      translateText(request.text, request.from, request.to).then(sendResponse);
      return true;
    case "analyzeSummary":
      generateSummary(request.videoId).then(sendResponse);
      return true;
    case "extractData":
      extractVideoData(request.videoId).then(sendResponse);
      return true;
  }
});

// 獲取視頻信息
async function getVideoInfo(videoId) {
  // 檢查緩存
  if (cache.videoInfo.has(videoId)) {
    return cache.videoInfo.get(videoId);
  }

  try {
    const response = await fetch(`${API_CONFIG.youtube.baseUrl}/videos?part=snippet,contentDetails&id=${videoId}&key=${API_CONFIG.youtube.key}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoInfo = {
        title: data.items[0].snippet.title,
        description: data.items[0].snippet.description,
        defaultLanguage: data.items[0].snippet.defaultLanguage || "en",
        duration: data.items[0].contentDetails.duration,
      };

      // 存入緩存
      cache.videoInfo.set(videoId, videoInfo);
      return videoInfo;
    }
    throw new Error("Video not found");
  } catch (error) {
    console.error("Failed to fetch video info:", error);
    throw error;
  }
}

// 獲取字幕
async function getSubtitles(videoId, language) {
  const cacheKey = `${videoId}-${language}`;

  // 檢查緩存
  if (cache.subtitles.has(cacheKey)) {
    return cache.subtitles.get(cacheKey);
  }

  try {
    const response = await fetch(`${API_CONFIG.youtube.baseUrl}/captions?part=snippet&videoId=${videoId}&key=${API_CONFIG.youtube.key}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // 找到匹配語言的字幕
      const caption = data.items.find(item => item.snippet.language === language);

      if (caption) {
        // 獲取字幕內容
        const subtitles = await fetchCaptionContent(caption.id);
        // 存入緩存
        cache.subtitles.set(cacheKey, subtitles);
        return subtitles;
      }
    }
    throw new Error("Subtitles not found");
  } catch (error) {
    console.error("Failed to fetch subtitles:", error);
    throw error;
  }
}

// 獲取字幕內容
async function fetchCaptionContent(captionId) {
  try {
    const response = await fetch(`${API_CONFIG.youtube.baseUrl}/captions/${captionId}?key=${API_CONFIG.youtube.key}`);
    const data = await response.json();
    return parseCaptionData(data);
  } catch (error) {
    console.error("Failed to fetch caption content:", error);
    throw error;
  }
}

// 解析字幕數據
function parseCaptionData(data) {
  // 實現字幕解析邏輯
  return [];
}

// 翻譯文本
async function translateText(text, fromLang, toLang) {
  const cacheKey = `${text}-${fromLang}-${toLang}`;

  // 檢查緩存
  if (cache.translations.has(cacheKey)) {
    return cache.translations.get(cacheKey);
  }

  try {
    const response = await fetch(API_CONFIG.translation.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_CONFIG.translation.key}`,
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
      }),
    });

    const data = await response.json();
    const translation = data.data.translations[0].translatedText;

    // 存入緩存
    cache.translations.set(cacheKey, { translation });
    return { translation };
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

// 生成內容摘要
async function generateSummary(videoId) {
  try {
    // 獲取視頻信息和字幕
    const videoInfo = await getVideoInfo(videoId);
    const subtitles = await getSubtitles(videoId, videoInfo.defaultLanguage);

    // 使用 OpenAI API 生成摘要
    const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_CONFIG.openai.key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a concise summary of the following video content.",
          },
          {
            role: "user",
            content: subtitles.map(s => s.text).join(" "),
          },
        ],
      }),
    });

    const data = await response.json();
    return {
      summary: data.choices[0].message.content,
    };
  } catch (error) {
    console.error("Failed to generate summary:", error);
    throw error;
  }
}

// 提取視頻數據
async function extractVideoData(videoId) {
  try {
    const videoInfo = await getVideoInfo(videoId);
    const subtitles = await getSubtitles(videoId, videoInfo.defaultLanguage);

    // 使用 OpenAI API 分析內容
    const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_CONFIG.openai.key}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract key information, quotes, and data points from the following video content.",
          },
          {
            role: "user",
            content: subtitles.map(s => s.text).join(" "),
          },
        ],
      }),
    });

    const data = await response.json();
    return {
      analysis: data.choices[0].message.content,
      metadata: videoInfo,
    };
  } catch (error) {
    console.error("Failed to extract video data:", error);
    throw error;
  }
}

// 初始化擴展
chrome.runtime.onInstalled.addListener(() => {
  // 設置默認配置
  chrome.storage.sync.set({
    defaultTargetLanguage: "zh-TW",
    enableAutoTranslation: true,
    subtitleStyle: {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      position: "bottom",
    },
  });
});
