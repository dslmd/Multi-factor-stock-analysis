
import React, { useState } from 'react';
import { StockAnalysisData } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface Props {
  stocks: StockAnalysisData[];
}

const AnalysisDashboard: React.FC<Props> = ({ stocks }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = stocks[activeIndex];

  if (!data) return null;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Buy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Buy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Hold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Sell': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Strong Sell': return 'text-rose-600 bg-rose-600/10 border-rose-600/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const factorData = [
    { subject: 'Value', A: data.value.valuationGrade === 'Low' ? 100 : data.value.valuationGrade === 'Fair' ? 60 : 20, fullMark: 100 },
    { subject: 'Quality', A: data.quality.qualityScore, fullMark: 100 },
    { subject: 'Momentum', A: data.momentum.revisionsGrade === 'Strong' ? 100 : data.momentum.revisionsGrade === 'Neutral' ? 50 : 10, fullMark: 100 },
  ];

  const valuationComparison = [
    { name: 'Fwd P/E (1Y)', value: data.value.forwardPE },
    { name: 'Fwd P/E (2Y)', value: data.value.forwardPE_2YR },
    { name: 'Sector Median', value: data.value.sectorMedianPE },
  ];

  // Helper to display DCF info if valid (> 0), else display N/A reason
  const renderDCFInfo = () => {
    if (data.quality.dcfIntrinsicValue && data.quality.dcfIntrinsicValue > 0) {
      const margin = data.quality.dcfMarginOfSafety * 100;
      return (
        <span className="text-xs text-slate-400 block mt-1">
          DCF Value: <span className="text-white">${data.quality.dcfIntrinsicValue.toFixed(2)}</span>
          <span className="mx-2">|</span>
          Margin: <span className={margin > 0 ? "text-emerald-400" : "text-rose-400"}>{margin.toFixed(1)}%</span>
        </span>
      );
    }
    return <span className="text-[10px] text-slate-600 block mt-1 italic">DCF N/A (Negative/Unpredictable FCF)</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stock Selection Tabs */}
      {stocks.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {stocks.map((s, idx) => (
            <button
              key={s.ticker}
              onClick={() => setActiveIndex(idx)}
              className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                activeIndex === idx 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s.ticker}
            </button>
          ))}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{data.companyName} <span className="text-slate-500 font-mono text-xl">({data.ticker})</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-2xl font-semibold font-mono text-blue-400">${data.currentPrice.toFixed(2)}</span>
            <span className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-wider ${getRecommendationColor(data.finalRecommendation)}`}>
              {data.finalRecommendation}
            </span>
          </div>
        </div>
        <div className="mt-6 md:mt-0 text-right">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold">Quality Score</p>
          <div className="flex items-baseline justify-end gap-2">
             <span className={`text-4xl font-bold font-mono ${data.quality.qualityScore >= 80 ? 'text-emerald-400' : data.quality.qualityScore >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
              {data.quality.qualityScore}
            </span>
            <span className="text-slate-500 text-xl">/ 100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factor Summary Table */}
        <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
            <i className="fas fa-layer-group text-blue-400"></i> Quantitative Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-4">Factor</th>
                  <th className="pb-4">Core Metric</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr>
                  <td className="py-4 font-semibold text-white">Value</td>
                  <td className="py-4 font-mono text-slate-300">
                    <div className="flex flex-col">
                        <span>{data.value.forwardPE}x (Next 12M)</span>
                        <span className="text-xs text-slate-500">{data.value.forwardPE_2YR}x (2-Year Fwd)</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-black uppercase ${data.value.valuationGrade === 'Low' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {data.value.valuationGrade}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-white">Quality</td>
                  <td className="py-4 font-mono text-slate-300">
                    <div>
                      ROIC: {data.quality.roic}% | ROE: {data.quality.roe}%
                      {renderDCFInfo()}
                    </div>
                  </td>
                  <td className="py-4 align-top">
                    <span className={`px-2 py-1 rounded text-xs font-black uppercase ${data.quality.qualityScore > 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {data.quality.qualityScore > 70 ? 'High Qual' : 'Mixed'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-white">Momentum</td>
                  <td className="py-4 font-mono text-slate-300">{data.momentum.revisionsUp90D} Up / {data.momentum.revisionsDown90D} Down</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-black uppercase ${data.momentum.revisionsGrade === 'Strong' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {data.momentum.revisionsGrade}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar Visualization */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center min-h-[300px]">
           <h3 className="text-lg font-semibold mb-2 self-start text-slate-300">Factor Radar</h3>
           <div className="w-full h-full">
             <ResponsiveContainer width="100%" height={240}>
               <RadarChart cx="50%" cy="50%" outerRadius="75%" data={factorData}>
                 <PolarGrid stroke="#334155" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                 <Radar name="Stock" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Quant Analysis Narrative
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-slate-400 leading-relaxed whitespace-pre-wrap">
            {data.deepAnalysis}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Exposure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.riskFactors.map((risk, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs text-slate-400">
                  <i className="fas fa-shield-alt text-blue-500/50"></i>
                  {risk}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
              <i className="fas fa-dna text-blue-400"></i> Fundamental DNA
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'ROIC (Efficiency)', value: `${data.quality.roic.toFixed(2)}%`, color: data.quality.roic > 15 ? 'text-emerald-400' : 'text-white' },
                { label: 'ROE (Profitability)', value: `${data.quality.roe.toFixed(2)}%`, color: 'text-blue-400' },
                { label: 'Debt-to-Equity', value: `${data.quality.debtToEquity.toFixed(2)}`, color: data.quality.debtToEquity < 1 ? 'text-emerald-400' : 'text-yellow-400' },
                { label: 'DCF Intrinsic', value: data.quality.dcfIntrinsicValue && data.quality.dcfIntrinsicValue > 0 ? `$${data.quality.dcfIntrinsicValue.toFixed(2)}` : 'N/A', color: 'text-slate-400' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{item.label}</p>
                  <p className={`text-lg font-mono font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-300">
              <i className="fas fa-chart-line text-blue-400"></i> Forward Valuation Curve
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valuationComparison} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 10 }} width={100} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {valuationComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#475569' : '#3b82f6'} stroke={index === 0 ? 'none' : '#334155'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
