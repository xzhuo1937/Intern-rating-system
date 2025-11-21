import { GoogleGenerativeAI } from "@google/generative-ai";  // 注意这里包名改成了官方最新的
import { Intern, CRITERIA_LABELS, CriteriaKey } from "../types";

// 关键：只用 Vite 标准方式读取环境变量（Vercel 只有这种能注入前端）
const apiKey = import.meta.env.VITE_API_KEY || "";

export const generateInternSummary = async (intern: Intern): Promise<string> => {
  // 如果没 Key，直接返回提示（不会崩溃）
  if (!apiKey) {
    return "未检测到 API Key，无法生成 AI 评价。请在 Vercel 中正确设置 VITE_API_KEY 环境变量。";
  }

  // 使用 Google 官方最新的 SDK（旧的 @google/genai 容易出各种诡异问题）
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 计算平均分
  const totalEvals = intern.evaluations.length;
  if (totalEvals === 0) return "暂无数据，无法生成分析。";

  const averages: Record<string, number> = {};
  (Object.keys(CRITERIA_LABELS) as CriteriaKey[]).forEach(key => {
    const sum = intern.evaluations.reduce((acc, curr) => acc + (curr.scores[key] || 0), 0);
    averages[key] = Number((sum / totalEvals).toFixed(1));
  });

  const prompt = `你是一家年轻互联网公司的资深导师（Mentor）。
请根据以下实习生 "${intern.name}" 的五维能力数据（满分10分）生成一段约100字的综合评价。

数据详情:
- 沟通能力: ${averages[CriteriaKey.COMMUNICATION]}
- 工作效率: ${averages[CriteriaKey.EFFICIENCY]}
- 自学能力: ${averages[CriteriaKey.SELF_LEARNING]}
- 工作态度: ${averages[CriteriaKey.ATTITUDE]}
- 交付质量: ${averages[Criteria.KEY_QUALITY]}

背景: 该实习生主要协助需求部门完成一些低门槛的重复性工作。

要求:
1. 语言风格要年轻、互联网化、直接但不失专业（可以使用一些互联网黑话，但不要过分）。
2. 指出 TA 最突出的“超能力” (Superpower)。
3. 如果有低于6分的项，委婉但明确地指出“致命伤” (Fatal Flaw)。
4. 最后给出一个明确的建议：“留用培养” 或 “建议淘汰”。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `生成失败：${error.message || "未知错误"}`;
  }
};
