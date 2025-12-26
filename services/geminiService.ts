
import { GoogleGenAI, Type } from "@google/genai";
import { StockAnalysisData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const STOCK_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ticker: { type: Type.STRING },
    companyName: { type: Type.STRING },
    currentPrice: { type: Type.NUMBER },
    value: {
      type: Type.OBJECT,
      properties: {
        forwardPE: { type: Type.NUMBER, description: "Next 12 Months P/E" },
        forwardPE_2YR: { type: Type.NUMBER, description: "Estimated P/E for 2 fiscal years ahead (source: Seeking Alpha/Analyst estimates)" },
        sectorMedianPE: { type: Type.NUMBER },
        valuationGrade: { type: Type.STRING, enum: ['Low', 'Fair', 'High'] },
        assessment: { type: Type.STRING }
      },
      required: ['forwardPE', 'forwardPE_2YR', 'sectorMedianPE', 'valuationGrade', 'assessment']
    },
    quality: {
      type: Type.OBJECT,
      properties: {
        roe: { type: Type.NUMBER, description: "Return on Equity %" },
        roic: { type: Type.NUMBER, description: "Return on Invested Capital %" },
        debtToEquity: { type: Type.NUMBER, description: "Total Debt to Equity Ratio" },
        dcfIntrinsicValue: { type: Type.NUMBER, description: "Calculated Intrinsic Value via DCF. Set to 0 if FCF is negative." },
        dcfMarginOfSafety: { type: Type.NUMBER, description: "(Intrinsic - Price)/Intrinsic. Set to 0 if FCF is negative." },
        qualityScore: { type: Type.NUMBER, description: "Score 0-100. Mix of ROE/ROIC/Debt. If DCF is valid, include Margin of Safety in score." },
        assessment: { type: Type.STRING }
      },
      required: ['roe', 'roic', 'debtToEquity', 'dcfIntrinsicValue', 'dcfMarginOfSafety', 'qualityScore', 'assessment']
    },
    momentum: {
      type: Type.OBJECT,
      properties: {
        revisionsUp90D: { type: Type.NUMBER },
        revisionsDown90D: { type: Type.NUMBER },
        revisionsGrade: { type: Type.STRING, enum: ['Strong', 'Neutral', 'Weak'] },
        assessment: { type: Type.STRING }
      },
      required: ['revisionsUp90D', 'revisionsDown90D', 'revisionsGrade', 'assessment']
    },
    deepAnalysis: { type: Type.STRING },
    finalRecommendation: { type: Type.STRING, enum: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['ticker', 'companyName', 'currentPrice', 'value', 'quality', 'momentum', 'deepAnalysis', 'finalRecommendation', 'riskFactors']
};

const BATCH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: STOCK_ITEM_SCHEMA
    }
  },
  required: ['results']
};

export async function analyzeStocks(tickers: string[]): Promise<StockAnalysisData[]> {
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `
    You are a Wall Street Quant Analyst. Analyze the provided list of stock tickers [${tickers.join(', ')}] simultaneously.
    
    METHODOLOGY (UPDATED v2):
    
    1. **VALUE FACTOR**: 
       - Look for "Forward P/E" (Next 12 Months).
       - CRITICAL: For Growth Stocks, specifically find the **2-Year Forward P/E** to normalize valuations.
       - Compare against Sector Median.
    
    2. **QUALITY FACTOR (Hybrid Model)**: 
       - **Core Metrics**: Find ROE, ROIC, and Debt-to-Equity.
       - **DCF Integration**:
         - IF Free Cash Flow (FCF) is POSITIVE and growable: Calculate Intrinsic Value (2-stage DCF, Terminal Rate 2.5%). Calculate Margin of Safety.
         - IF FCF is NEGATIVE or highly erratic: Ignore DCF (set DCF fields to 0). Rely solely on ROE/Debt/Growth.
       - **Quality Score (0-100)**: 
         - A weighted score of Profitability (ROIC), Health (Debt), and Valuation (DCF Margin if valid).
         - High ROIC (>15%) + Low Debt + Positive DCF Margin = 90+ Score.

    3. **MOMENTUM FACTOR**: 
       - Earnings Revisions (90 days Up vs Down). Mention PEAD effect.
    
    EFFICIENCY RULE: Perform parallel search for all tickers.
    Return a JSON object with a 'results' array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Perform quantitative 3-factor analysis for: ${tickers.join(', ')}. Calculate DCF only if FCF is positive.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: BATCH_SCHEMA as any
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(resultText);
    const stocks = parsed.results as StockAnalysisData[];
    
    // Attach sources to each stock
    const globalSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Market Source',
      uri: chunk.web?.uri || '#'
    })).filter((s: any) => s.uri !== '#') || [];

    return stocks.map(stock => ({
      ...stock,
      sources: globalSources.slice(0, 5)
    }));
  } catch (error) {
    console.error("Batch Analysis Error:", error);
    throw error;
  }
}
