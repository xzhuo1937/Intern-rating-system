import { GoogleGenAI } from "@google/genai";  // ← 用你原来的包
import { Intern, CRITERIA_LABELS, CriteriaKey } from "../types";

const apiKey = import.meta.env.VITE_API_KEY || '';  // ← 只用这一行！！

console.log('【调试】当前 apiKey 是否有值：', apiKey ? 'YES（长度'+apiKey.length+'）' : 'NO → 请检查 Vercel VITE_API_KEY');

export const generateInternSummary = async (intern: Intern): Promise<string> => {
  if (!apiKey) {
    return "未检测到 API Key，无法生成评价（检查 Vercel 是否设置了 VITE_API_KEY）";
  }

  const ai = new GoogleGenAI({ apiKey });

  const totalEvals = intern.evaluations.length;
  if (totalEvals === 0) return "暂无数据，无法生成分析。";

  const averages: Record<string, number> = {};
  (Object.keys(CRITERIA_LABELS) as CriteriaKey[]).forEach(key => {
    const sum = intern.evaluations.reduce((acc, curr) => acc + (curr.scores[key] || 0), 0);
    averages[key] = parseFloat((sum / totalEvals).toFixed(1));
  });

  const prompt = `你是一家年轻互联网公司的资深导师（Mentor）。
请根据以下实习生 "${intern.name}" 的五维能力数据（满分10分）生成一段约100字的综合评价。

数据详情:
- 沟通能力: ${averages[CriteriaKey.COMMUNICATION]}
- 工作效率: ${averages[CriteriaKey.EFFICIENCY]}
- 自学能力: ${averages[CriteriaKey.SELF_LEARNING]}
- 工作态度: ${averages[CriteriaKey.ATTITUDE]}
- 交付质量: ${averages[CriteriaKey.QUALITY]}

背景: 该实习生主要协助需求部门完成一些低门槛的重复性工作。

要求:
1. 语言风格要年轻、互联网化、直接但不失专业。
2. 指出 TA 最突出的“超能力” (Superpower)。
3. 如果有低于6分的项，委婉但明确地指出“致命伤” (Fatal Flaw)。
4. 最后给出一个明确的建议：“留用培养” 或 “建议淘汰”。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',  // 改成稳定版本
      contents: prompt,
    });
    return response.text || "生成为空";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `生成失败：${error.message}`;
  }
};
