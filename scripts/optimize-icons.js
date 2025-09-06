#!/usr/bin/env node

/**
 * 图标资源优化脚本
 * 用于检查和优化导航栏图标资源的大小和性能
 */

const fs = require("fs");
const path = require("path");

// 配置
const CONFIG = {
  iconPaths: [
    "src/static/icons/home.png",
    "src/static/icons/home-active.png",
    "src/static/icons/add.png",
    "src/static/icons/add-active.png",
    "src/static/icons/profile.png",
    "src/static/icons/profile-active.png",
  ],
  maxFileSize: 50 * 1024, // 50KB
  recommendedSize: 20 * 1024, // 20KB
  targetDimensions: { width: 44, height: 44 }, // 推荐尺寸
};

class IconOptimizer {
  constructor() {
    this.results = {
      totalFiles: 0,
      optimizedFiles: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0,
      issues: [],
      recommendations: [],
    };
  }

  /**
   * 检查图标文件是否存在
   */
  checkIconExists(iconPath) {
    const fullPath = path.resolve(iconPath);
    return fs.existsSync(fullPath);
  }

  /**
   * 获取文件大小
   */
  getFileSize(iconPath) {
    try {
      const stats = fs.statSync(iconPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 分析图标文件
   */
  analyzeIcon(iconPath) {
    const analysis = {
      path: iconPath,
      exists: false,
      size: 0,
      sizeFormatted: "0 B",
      isOptimal: false,
      issues: [],
      recommendations: [],
    };

    // 检查文件是否存在
    if (!this.checkIconExists(iconPath)) {
      analysis.issues.push(`图标文件不存在: ${iconPath}`);
      return analysis;
    }

    analysis.exists = true;
    analysis.size = this.getFileSize(iconPath);
    analysis.sizeFormatted = this.formatFileSize(analysis.size);

    // 检查文件大小
    if (analysis.size > CONFIG.maxFileSize) {
      analysis.issues.push(
        `文件过大: ${analysis.sizeFormatted} (最大建议: ${this.formatFileSize(
          CONFIG.maxFileSize
        )})`
      );
      analysis.recommendations.push("考虑压缩图片或使用更高效的格式");
    } else if (analysis.size > CONFIG.recommendedSize) {
      analysis.recommendations.push(
        `文件较大: ${analysis.sizeFormatted} (建议: ${this.formatFileSize(
          CONFIG.recommendedSize
        )})`
      );
    } else {
      analysis.isOptimal = true;
    }

    // 检查文件格式
    const ext = path.extname(iconPath).toLowerCase();
    if (ext === ".png") {
      analysis.recommendations.push(
        "PNG格式适合图标，但考虑使用WebP格式以获得更好的压缩率"
      );
    } else if (ext === ".jpg" || ext === ".jpeg") {
      analysis.issues.push("JPEG格式不适合图标，建议使用PNG或WebP");
    }

    return analysis;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions() {
    const suggestions = [
      {
        category: "文件大小优化",
        items: [
          "使用图片压缩工具（如TinyPNG）减小文件大小",
          "考虑使用WebP格式替代PNG",
          "确保图标尺寸不超过实际显示需求",
          "移除图片中的元数据和不必要的颜色配置文件",
        ],
      },
      {
        category: "性能优化",
        items: [
          "使用CSS Sprites技术合并小图标",
          "实现图标懒加载",
          "考虑使用SVG格式的矢量图标",
          "启用图片缓存策略",
        ],
      },
      {
        category: "用户体验",
        items: [
          "确保图标在不同设备上清晰显示",
          "提供高分辨率版本适配Retina屏幕",
          "保持图标风格一致性",
          "确保图标在深色模式下的可见性",
        ],
      },
    ];

    return suggestions;
  }

  /**
   * 检查导航配置中的图标路径
   */
  checkNavigationConfig() {
    const configIssues = [];

    try {
      // 检查pages.json中的tabBar配置
      const pagesJsonPath = path.resolve("src/pages.json");
      if (fs.existsSync(pagesJsonPath)) {
        const pagesJson = JSON.parse(fs.readFileSync(pagesJsonPath, "utf8"));

        if (pagesJson.tabBar && pagesJson.tabBar.list) {
          pagesJson.tabBar.list.forEach((tab, index) => {
            if (!tab.iconPath) {
              configIssues.push(`标签页 ${index + 1} 缺少iconPath配置`);
            }
            if (!tab.selectedIconPath) {
              configIssues.push(`标签页 ${index + 1} 缺少selectedIconPath配置`);
            }

            // 检查路径是否匹配实际文件 (uni-app中static目录映射到src/static)
            if (tab.iconPath) {
              const actualPath = tab.iconPath.replace("static/", "src/static/");
              if (!this.checkIconExists(actualPath)) {
                configIssues.push(
                  `标签页 ${index + 1} 的iconPath指向不存在的文件: ${
                    tab.iconPath
                  } (实际路径: ${actualPath})`
                );
              }
            }
            if (tab.selectedIconPath) {
              const actualPath = tab.selectedIconPath.replace(
                "static/",
                "src/static/"
              );
              if (!this.checkIconExists(actualPath)) {
                configIssues.push(
                  `标签页 ${index + 1} 的selectedIconPath指向不存在的文件: ${
                    tab.selectedIconPath
                  } (实际路径: ${actualPath})`
                );
              }
            }
          });
        }
      }
    } catch (error) {
      configIssues.push(`读取pages.json配置失败: ${error.message}`);
    }

    return configIssues;
  }

  /**
   * 运行完整的图标优化分析
   */
  async runOptimization() {
    console.log("🔍 开始图标资源优化分析...\n");

    // 分析每个图标文件
    const iconAnalyses = [];
    for (const iconPath of CONFIG.iconPaths) {
      const analysis = this.analyzeIcon(iconPath);
      iconAnalyses.push(analysis);
      this.results.totalFiles++;

      if (analysis.exists) {
        this.results.totalSizeBefore += analysis.size;
      }
    }

    // 检查导航配置
    const configIssues = this.checkNavigationConfig();

    // 生成报告
    this.generateReport(iconAnalyses, configIssues);

    return this.results;
  }

  /**
   * 生成优化报告
   */
  generateReport(iconAnalyses, configIssues) {
    console.log("📊 图标资源分析报告");
    console.log("=".repeat(50));

    // 文件存在性检查
    console.log("\n📁 文件存在性检查:");
    iconAnalyses.forEach((analysis) => {
      const status = analysis.exists ? "✅" : "❌";
      console.log(`  ${status} ${analysis.path}`);
      if (!analysis.exists) {
        console.log(`     ⚠️  文件不存在`);
      }
    });

    // 文件大小分析
    console.log("\n📏 文件大小分析:");
    iconAnalyses.forEach((analysis) => {
      if (analysis.exists) {
        const status = analysis.isOptimal
          ? "✅"
          : analysis.issues.length > 0
          ? "❌"
          : "⚠️";
        console.log(`  ${status} ${analysis.path}: ${analysis.sizeFormatted}`);

        analysis.issues.forEach((issue) => {
          console.log(`     ❌ ${issue}`);
        });

        analysis.recommendations.forEach((rec) => {
          console.log(`     💡 ${rec}`);
        });
      }
    });

    // 配置检查
    if (configIssues.length > 0) {
      console.log("\n⚙️  配置问题:");
      configIssues.forEach((issue) => {
        console.log(`  ❌ ${issue}`);
      });
    } else {
      console.log("\n⚙️  配置检查: ✅ 无问题");
    }

    // 总体统计
    const existingFiles = iconAnalyses.filter((a) => a.exists);
    const totalSize = existingFiles.reduce((sum, a) => sum + a.size, 0);
    const averageSize =
      existingFiles.length > 0 ? totalSize / existingFiles.length : 0;

    console.log("\n📈 总体统计:");
    console.log(`  总文件数: ${iconAnalyses.length}`);
    console.log(`  存在文件数: ${existingFiles.length}`);
    console.log(`  总大小: ${this.formatFileSize(totalSize)}`);
    console.log(`  平均大小: ${this.formatFileSize(averageSize)}`);

    // 优化建议
    console.log("\n💡 优化建议:");
    const suggestions = this.generateOptimizationSuggestions();
    suggestions.forEach((category) => {
      console.log(`\n  ${category.category}:`);
      category.items.forEach((item) => {
        console.log(`    • ${item}`);
      });
    });

    // 性能影响评估
    console.log("\n⚡ 性能影响评估:");
    if (totalSize > CONFIG.maxFileSize * iconAnalyses.length) {
      console.log("  ❌ 图标总大小过大，可能影响应用启动速度");
    } else if (totalSize > CONFIG.recommendedSize * iconAnalyses.length) {
      console.log("  ⚠️  图标大小适中，但仍有优化空间");
    } else {
      console.log("  ✅ 图标大小已优化，对性能影响最小");
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ 分析完成！");
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const optimizer = new IconOptimizer();
  optimizer.runOptimization().catch(console.error);
}

module.exports = IconOptimizer;
