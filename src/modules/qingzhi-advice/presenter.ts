import { buildQingzhiAdviceAiContext, generateQingzhiAdvice } from "./service.js";

type QingzhiAdviceResult = ReturnType<typeof generateQingzhiAdvice>;
type QingzhiAdviceAiContext = ReturnType<typeof buildQingzhiAdviceAiContext>;

export function buildQingzhiAdvicePageView(result: QingzhiAdviceResult) {
  return {
    page: {
      module: "qingzhi-advice",
      title: "青筮建议",
      subtitle: result.advice.scope === "daily" ? "今日专属建议" : "本月专属建议"
    },
    header: {
      score: result.advice.score,
      summary: result.advice.summary,
      badges: result.advice.badges,
      identity: {
        solar: result.timing.solar,
        lunar: result.timing.lunar,
        jieQi: result.timing.jieQi
      }
    },
    sections: [
      {
        type: "keywords",
        title: "今日 / 本月关键词",
        data: result.advice.dailyKeywords
      },
      {
        type: "fortune-overview",
        title: "运势总览",
        data: {
          strength: result.profileSummary.strength,
          favorableElements: result.profileSummary.favorableElements,
          unfavorableElements: result.profileSummary.unfavorableElements,
          currentLiuNian: result.timing.currentLiuNian,
          currentMonth: result.timing.currentMonth
        }
      },
      {
        type: "seven-day-calendar",
        title: "7天节奏日历",
        data: result.sevenDayCalendar
      },
      {
        type: "auspicious-days",
        title: "吉日建议",
        data: {
          bestDays: result.auspiciousAdvice.bestDays,
          cautionDays: result.auspiciousAdvice.cautionDays
        }
      },
      {
        type: "auspicious-categories",
        title: "吉日分类细化",
        data: result.auspiciousAdvice.categoryBreakdown
      },
      {
        type: "yi-ji",
        title: "宜忌事项",
        data: {
          yi: result.timing.yi,
          ji: result.timing.ji,
          dos: result.advice.dos,
          donts: result.advice.donts
        }
      },
      {
        type: "style-guide",
        title: "穿戴建议",
        data: {
          colors: result.advice.recommendedColors,
          styles: result.advice.recommendedStyleKeywords,
          accessories: result.advice.accessorySuggestions
        }
      },
      {
        type: "direction-scene",
        title: "方向 / 场景建议",
        data: result.directionSceneAdvice
      },
      {
        type: "life-panels",
        title: "专项提醒",
        data: [
          {
            title: "事业提醒",
            body: result.advice.careerHint
          },
          {
            title: "关系提醒",
            body: result.advice.relationshipHint
          }
        ]
      },
      {
        type: "monthly-highlights",
        title: "月度走势",
        data: result.monthlyPanel
      }
    ]
  };
}

export function buildQingzhiAdviceAiView(context: QingzhiAdviceAiContext) {
  return {
    panel: {
      module: "qingzhi-advice-ai",
      title: "AI 命理咨询",
      subtitle: "基于当前青筮建议结果继续追问"
    },
    sections: [
      {
        type: "summary-card",
        title: "上下文摘要",
        data: context.summaryCard
      },
      {
        type: "seven-day-focus",
        title: "7天问答重点",
        data: context.sevenDayFocus
      },
      {
        type: "auspicious-category-summary",
        title: "吉日分类参考",
        data: context.auspiciousCategorySummary
      },
      {
        type: "direction-scene",
        title: "方向 / 场景参考",
        data: context.directionSceneAdvice
      },
      {
        type: "suggested-questions",
        title: "建议追问",
        data: context.suggestedQuestions
      }
    ]
  };
}
