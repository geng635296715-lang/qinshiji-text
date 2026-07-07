import { analyzeBazi, analyzeBaziCompatibility } from "./service.js";

type BaziAnalysisResult = ReturnType<typeof analyzeBazi>;
type BaziCompatibilityResult = ReturnType<typeof analyzeBaziCompatibility>;

export function buildBaziPageView(result: BaziAnalysisResult) {
  return {
    page: {
      module: "bazi",
      title: "八字命理详解",
      subtitle: `${result.dayMaster.label} · ${result.calendar.lunar}`,
      vipUnlocked: result.premiumAnalysis.unlocked
    },
    header: {
      identity: {
        solar: result.calendar.solar,
        lunar: result.calendar.lunar,
        zodiac: result.calendar.zodiac,
        season: result.calendar.season,
        jieQi: result.calendar.jieQi || "当前日期未落在节气切换点"
      },
      summaryCards: [
        {
          key: "day-master",
          label: "日主",
          value: result.dayMaster.label,
          accent: result.dayMaster.colorHex,
          description: `${result.dayMaster.wuxing}行 · ${result.dayMaster.colorName}`
        },
        {
          key: "strength",
          label: "旺衰",
          value: result.strengthAnalysis.levelLabel,
          accent: result.strengthAnalysis.favorableElements[0]?.colorHex ?? "#C27C2C",
          description: result.strengthAnalysis.reasoning
        },
        {
          key: "favorable",
          label: "喜用",
          value: result.strengthAnalysis.favorableElements.map((item) => item.name).join("、"),
          accent: result.strengthAnalysis.favorableElements[0]?.colorHex ?? "#D94841",
          description: result.overview.favorableUsage
        }
      ]
    },
    tabs: [
      {
        key: "chart",
        label: "命盘",
        sections: [
          {
            type: "pillar-grid",
            title: "四柱命盘",
            data: result.pillars.map((pillar) => ({
              key: pillar.name,
              title:
                pillar.name === "year"
                  ? "年柱"
                  : pillar.name === "month"
                    ? "月柱"
                    : pillar.name === "day"
                      ? "日柱"
                      : "时柱",
              ganzhi: pillar.ganzhi,
              heavenlyStem: pillar.heavenlyStem,
              earthlyBranch: pillar.earthlyBranch,
              hiddenStems: pillar.hiddenStems,
              naYin: pillar.naYin,
              diShi: pillar.diShi,
              xunKong: pillar.xunKong
            }))
          },
          {
            type: "meta-cards",
            title: "命盘附加信息",
            data: [
              { label: "胎元", value: `${result.chartMeta.taiYuan.value} · ${result.chartMeta.taiYuan.naYin}` },
              { label: "胎息", value: `${result.chartMeta.taiXi.value} · ${result.chartMeta.taiXi.naYin}` },
              { label: "命宫", value: `${result.chartMeta.mingGong.value} · ${result.chartMeta.mingGong.naYin}` },
              { label: "身宫", value: `${result.chartMeta.shenGong.value} · ${result.chartMeta.shenGong.naYin}` }
            ]
          }
        ]
      },
      {
        key: "strength",
        label: "旺衰喜忌",
        sections: [
          {
            type: "score-cards",
            title: "旺衰判断",
            data: [
              { label: "扶助分", value: result.strengthAnalysis.supportScore },
              { label: "耗泄分", value: result.strengthAnalysis.drainScore },
              { label: "强弱差", value: result.strengthAnalysis.delta },
              { label: "结论", value: result.strengthAnalysis.levelLabel }
            ]
          },
          {
            type: "element-tags",
            title: "喜用五行",
            data: result.strengthAnalysis.favorableElements
          },
          {
            type: "element-tags",
            title: "忌神五行",
            data: result.strengthAnalysis.unfavorableElements
          },
          {
            type: "explanation",
            title: "判断说明",
            data: {
              balanceHint: result.overview.wuxingBalanceHint,
              reasoning: result.strengthAnalysis.reasoning
            }
          }
        ]
      },
      {
        key: "flow",
        label: "流年流月",
        sections: [
          {
            type: "timeline",
            title: "当前大运",
            data: result.flowAnalysis.supported
              ? {
                  currentDaYun: result.flowAnalysis.currentDaYun,
                  currentLiuNian: result.flowAnalysis.currentLiuNian,
                  liuNianTimeline: result.flowAnalysis.liuNianTimeline
                }
              : result.flowAnalysis
          },
          {
            type: "month-grid",
            title: "当年流月",
            data: result.flowAnalysis.supported ? result.flowAnalysis.liuYue : []
          }
        ]
      },
      {
        key: "premium",
        label: "专项解读",
        sections: buildPremiumSections(result)
      }
    ]
  };
}

export function buildCompatibilityPageView(result: BaziCompatibilityResult) {
  if (!result.unlocked) {
    return {
      page: {
        module: "bazi-compatibility",
        title: result.relationLabel,
        subtitle: "VIP 合盘功能",
        vipUnlocked: false
      },
      locked: true,
      lockCard: {
        title: result.preview.title,
        summary: result.preview.summary,
        modules: result.preview.modules,
        actionText: result.upsellMessage
      }
    };
  }

  const premiumSections = result.premiumCompatibilityAnalysis.sections!;

  return {
    page: {
      module: "bazi-compatibility",
      title: result.relationLabel,
      subtitle: `${result.pairSummary.compatibilityLevel} · ${result.pairSummary.compatibilityScore}分`,
      vipUnlocked: true
    },
    header: {
      score: result.pairSummary.compatibilityScore,
      level: result.pairSummary.compatibilityLevel,
      keyMessage: result.pairSummary.keyMessage,
      sharedFavorableElements: result.pairSummary.sharedFavorableElements,
      frictionElements: result.pairSummary.frictionElements
    },
    tabs: [
      {
        key: "overview",
        label: "总览",
        sections: [
          {
            type: "people-compare",
            title: "双方基础对照",
            data: [
              {
                person: "A",
                solar: result.personA.calendar.solar,
                lunar: result.personA.calendar.lunar,
                dayMaster: result.personA.dayMaster,
                strength: result.personA.strengthAnalysis.levelLabel
              },
              {
                person: "B",
                solar: result.personB.calendar.solar,
                lunar: result.personB.calendar.lunar,
                dayMaster: result.personB.dayMaster,
                strength: result.personB.strengthAnalysis.levelLabel
              }
            ]
          },
          {
            type: "synergy-cards",
            title: "关系协同",
            data: [result.synergy.emotional, result.synergy.collaboration, result.synergy.rhythm]
          }
        ]
      },
      {
        key: "charts",
        label: "图表对照",
        sections: [
          {
            type: "strength-chart",
            title: result.compatibilityCharts.strengthChart.title,
            description: result.compatibilityCharts.strengthChart.description,
            data: result.compatibilityCharts.strengthChart.series
          },
          {
            type: "five-element-chart",
            title: result.compatibilityCharts.fiveElementContrast.title,
            description: result.compatibilityCharts.fiveElementContrast.description,
            data: result.compatibilityCharts.fiveElementContrast.elements
          },
          {
            type: "matrix",
            title: result.compatibilityCharts.synergyMatrix.title,
            description: result.compatibilityCharts.synergyMatrix.description,
            data: result.compatibilityCharts.synergyMatrix
          }
        ]
      },
      {
        key: "explain",
        label: "图文解读",
        sections: [
          {
            type: "text-panels",
            title: result.compatibilityCharts.textualPanels.title,
            data: result.compatibilityCharts.textualPanels.cards
          }
        ]
      },
      {
        key: "premium",
        label: "VIP 深度分析",
        sections: [
          {
            type: "premium-sections",
            title: "核心合盘分析",
            data: [
              premiumSections.core,
              premiumSections.special
            ]
          }
        ]
      }
    ]
  };
}

function buildPremiumSections(result: BaziAnalysisResult) {
  if (!result.premiumAnalysis.unlocked) {
    return [
      {
        type: "vip-lock",
        title: "VIP 专项解读",
        data: {
          preview: result.premiumAnalysis.preview,
          actionText: result.premiumAnalysis.upsellMessage
        }
      }
    ];
  }

  return [
    {
      type: "premium-sections",
      title: "VIP 专项解读",
      data: [
        result.premiumAnalysis.sections.career,
        result.premiumAnalysis.sections.relationship,
        result.premiumAnalysis.sections.wealth,
        result.premiumAnalysis.sections.health
      ]
    }
  ];
}
