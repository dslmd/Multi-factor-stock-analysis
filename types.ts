
export interface StockAnalysisData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  value: {
    forwardPE: number;       // Next 12 Months
    forwardPE_2YR: number;   // 2 Years out (better for growth stocks)
    sectorMedianPE: number;
    valuationGrade: 'Low' | 'Fair' | 'High';
    assessment: string;
  };
  quality: {
    roe: number;             // Return on Equity
    roic: number;            // Return on Invested Capital
    debtToEquity: number;    // Leverage
    dcfIntrinsicValue: number; // 0 if FCF is negative/unpredictable
    dcfMarginOfSafety: number; // 0 if FCF is negative/unpredictable
    qualityScore: number;    // 0-100 Score
    assessment: string;
  };
  momentum: {
    revisionsUp90D: number;
    revisionsDown90D: number;
    revisionsGrade: 'Strong' | 'Neutral' | 'Weak';
    assessment: string;
  };
  deepAnalysis: string;
  finalRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  riskFactors: string[];
  sources: Array<{ title: string; uri: string }>;
}

export interface AnalysisState {
  loading: boolean;
  progress: number; // Added progress percentage (0-100)
  error: string | null;
  data: StockAnalysisData[] | null;
  step: 'idle' | 'processing';
}
