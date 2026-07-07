import {
  buildLiuyaoAiContext,
  buildMeihuaAiContext,
  castLiuyao,
  castMeihua
} from "./service.js";

type LiuyaoResult = ReturnType<typeof castLiuyao>;
type MeihuaResult = ReturnType<typeof castMeihua>;

export function buildLiuyaoPageView(result: LiuyaoResult) {
  return {
    page: {
      module: "liuyao",
      title: "六爻金钱课",
      subtitle: `${result.topicLabel} · ${result.primaryHexagram.name}`
    },
    header: {
      title: result.input.title,
      description: result.input.description || null,
      summaryCards: result.frontend.quickCards,
      summary: result.interpretation.overall
    },
    sections: [
      {
        type: "casting-animation",
        title: "起卦过程",
        data: result.animation
      },
      {
        type: "casting-summary",
        title: "起卦摘要",
        data: result.frontend.castingSummary
      },
      {
        type: "hexagram-overview",
        title: "本卦 / 变卦",
        data: {
          primaryHexagram: result.primaryHexagram,
          transformedHexagram: result.transformedHexagram
        }
      },
      {
        type: "line-board",
        title: "六爻图示",
        data: result.frontend.lineBoard
      },
      {
        type: "moving-lines",
        title: "动爻重点",
        data: result.movingLineInsights
      },
      {
        type: "topic-panels",
        title: "专项断语",
        data: result.frontend.topicPanels
      },
      {
        type: "search-panel",
        title: "寻物提示",
        data: result.frontend.searchPanel
      },
      {
        type: "topic-interpretation",
        title: "卦象解读",
        data: {
          interpretation: result.interpretation,
          topicGuidance: result.topicGuidance
        }
      }
    ]
  };
}

export function buildMeihuaPageView(result: MeihuaResult) {
  return {
    page: {
      module: "meihua",
      title: "梅花易数",
      subtitle: `${result.topicLabel} · ${result.primaryHexagram.name}`
    },
    header: {
      title: result.input.title,
      description: result.input.description || null,
      summaryCards: result.frontend.quickCards,
      summary: result.interpretation.overall
    },
    sections: [
      {
        type: "casting-summary",
        title: "起卦摘要",
        data: result.frontend.castingSummary
      },
      {
        type: "hexagram-overview",
        title: "本卦 / 互卦 / 变卦",
        data: {
          primaryHexagram: result.primaryHexagram,
          mutualHexagram: result.mutualHexagram,
          changedHexagram: result.changedHexagram
        }
      },
      {
        type: "body-use",
        title: "体用关系",
        data: result.frontend.bodyUseCard
      },
      {
        type: "topic-panels",
        title: "专项断语",
        data: result.frontend.topicPanels
      },
      {
        type: "search-panel",
        title: "寻物提示",
        data: result.frontend.searchPanel
      },
      {
        type: "topic-interpretation",
        title: "卦象解读",
        data: {
          interpretation: result.interpretation,
          topicGuidance: result.topicGuidance
        }
      }
    ]
  };
}

export function buildDivinationAiView(
  context: ReturnType<typeof buildLiuyaoAiContext> | ReturnType<typeof buildMeihuaAiContext>
) {
  return {
    panel: {
      module: "divination-ai",
      title: "AI 命理咨询",
      subtitle: "基于当前卦象继续追问"
    },
    sections: [
      {
        type: "summary-card",
        title: "上下文摘要",
        data: context.summaryCard
      },
      {
        type: "consultation-brief",
        title: "速读结论",
        data: context.consultationBrief
      },
      {
        type: "hexagram-context",
        title: "卦象依据",
        data: context.hexagramContext
      },
      {
        type: "suggested-questions",
        title: "建议追问",
        data: context.suggestedQuestions
      }
    ]
  };
}
