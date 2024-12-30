class ContentAnalyzer {
  constructor() {
    this.videoId = null;
    this.videoData = null;
    this.subtitles = null;
    this.analysis = null;
  }

  // 初始化分析器
  async init(videoId) {
    this.videoId = videoId;
    try {
      await this.fetchVideoData();
      await this.fetchSubtitles();
    } catch (error) {
      console.error("Analyzer initialization failed:", error);
      throw error;
    }
  }

  // 獲取視頻數據
  async fetchVideoData() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getVideoInfo",
        videoId: this.videoId,
      });
      this.videoData = response;
    } catch (error) {
      console.error("Failed to fetch video data:", error);
      throw error;
    }
  }

  // 獲取字幕數據
  async fetchSubtitles() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSubtitles",
        videoId: this.videoId,
        language: this.videoData.defaultLanguage,
      });
      this.subtitles = response;
    } catch (error) {
      console.error("Failed to fetch subtitles:", error);
      throw error;
    }
  }

  // 生成內容大綱
  async generateOutline() {
    if (!this.subtitles) return null;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "analyzeSummary",
        videoId: this.videoId,
      });

      return this.structureOutline(response.summary);
    } catch (error) {
      console.error("Failed to generate outline:", error);
      return null;
    }
  }

  // 結構化大綱
  structureOutline(summary) {
    const lines = summary.split("\n").filter(line => line.trim());
    const outline = [];
    let currentSection = null;

    for (const line of lines) {
      if (line.startsWith("#")) {
        currentSection = {
          title: line.replace(/^#+\s*/, ""),
          content: [],
          level: (line.match(/^#+/) || [""])[0].length,
        };
        outline.push(currentSection);
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    return outline;
  }

  // 提取關鍵點
  async extractKeyPoints() {
    if (!this.subtitles) return null;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "extractData",
        videoId: this.videoId,
      });

      this.analysis = response.analysis;
      return this.parseKeyPoints(response.analysis);
    } catch (error) {
      console.error("Failed to extract key points:", error);
      return null;
    }
  }

  // 解析關鍵點
  parseKeyPoints(analysis) {
    const points = [];
    const lines = analysis.split("\n");

    for (const line of lines) {
      if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        points.push({
          content: line.trim().replace(/^[-•]\s*/, ""),
          timestamp: this.findTimestamp(line),
        });
      }
    }

    return points;
  }

  // 查找時間戳
  findTimestamp(text) {
    const timePattern = /\[(\d{1,2}:)?\d{1,2}:\d{2}\]/;
    const match = text.match(timePattern);
    return match ? match[0].slice(1, -1) : null;
  }

  // 生成時間軸
  generateTimeline() {
    if (!this.subtitles) return null;

    const timeline = [];
    let currentTime = 0;
    let currentSegment = {
      startTime: 0,
      endTime: 0,
      content: [],
    };

    for (const subtitle of this.subtitles) {
      if (subtitle.startTime - currentTime > 30) {
        if (currentSegment.content.length > 0) {
          currentSegment.endTime = currentTime;
          timeline.push({ ...currentSegment });
        }
        currentSegment = {
          startTime: subtitle.startTime,
          endTime: 0,
          content: [subtitle.text],
        };
      } else {
        currentSegment.content.push(subtitle.text);
      }
      currentTime = subtitle.endTime;
    }

    if (currentSegment.content.length > 0) {
      currentSegment.endTime = currentTime;
      timeline.push(currentSegment);
    }

    return timeline;
  }

  // 提取引用
  extractQuotes() {
    if (!this.subtitles) return null;

    return this.subtitles
      .filter(subtitle => {
        const text = subtitle.text.trim();
        return text.length > 50 && (text.includes('"') || text.includes('"') || text.includes('"') || text.startsWith("I ") || text.startsWith("We "));
      })
      .map(subtitle => ({
        text: subtitle.text,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
      }));
  }

  // 生成標籤
  generateTags() {
    if (!this.analysis) return null;

    const commonWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"]);
    const words = this.analysis.toLowerCase().split(/\W+/);
    const wordCount = {};

    words.forEach(word => {
      if (word.length > 2 && !commonWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // 導出分析數據
  async exportAnalysis() {
    if (!this.videoData) return null;

    const analysis = {
      metadata: {
        videoId: this.videoId,
        title: this.videoData.title,
        description: this.videoData.description,
        language: this.videoData.defaultLanguage,
        exportTime: new Date().toISOString(),
      },
      content: {
        outline: await this.generateOutline(),
        keyPoints: await this.extractKeyPoints(),
        timeline: this.generateTimeline(),
        quotes: this.extractQuotes(),
        tags: this.generateTags(),
      },
    };

    return analysis;
  }
}

export default ContentAnalyzer;
