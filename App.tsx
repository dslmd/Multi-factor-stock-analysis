
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisState } from './types';
import { analyzeStocks } from './services/geminiService';
import AnalysisDashboard from './components/AnalysisDashboard';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    progress: 0,
    error: null,
    data: null,
    step: 'idle'
  });
  
  const progressInterval = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (progressInterval.current) window.clearInterval(progressInterval.current);
    };
  }, []);

  const startProgressSimulation = () => {
    setState(prev => ({ ...prev, progress: 5 })); // Start slightly visible
    if (progressInterval.current) window.clearInterval(progressInterval.current);
    
    // Simulate typical Gemini 3 Pro latency (approx 8-12 seconds for deep reasoning)
    const startTime = Date.now();
    const duration = 10000; // 10 seconds target

    progressInterval.current = window.setInterval(() => {
      setState(prev => {
        if (prev.progress >= 95) return prev; // Hold at 95% until done
        
        const elapsed = Date.now() - startTime;
        // Logarithmic approach to 90%
        const percent = Math.min(95, (elapsed / duration) * 90); 
        
        return { ...prev, progress: Math.max(prev.progress, percent) };
      });
    }, 100);
  };

  const finishProgress = () => {
    if (progressInterval.current) window.clearInterval(progressInterval.current);
    setState(prev => ({ ...prev, progress: 100 }));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    // Parse tickers: handle commas, spaces, and uppercase
    const tickers = input.split(/[, \s]+/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
    if (tickers.length === 0) return;

    setState({ loading: true, progress: 0, error: null, data: null, step: 'processing' });
    startProgressSimulation();

    try {
      const results = await analyzeStocks(tickers);
      
      if (results.length === 0) {
        throw new Error("No valid financial data found for the provided tickers.");
      }

      finishProgress();
      // Small delay to let user see 100% bar before showing data
      setTimeout(() => {
        setState({ 
            loading: false, 
            progress: 100, 
            error: null, 
            data: results, 
            step: 'idle' 
        });
      }, 400);

    } catch (err: any) {
      console.error(err);
      finishProgress();
      setState({ 
        loading: false, 
        progress: 0,
        error: err.message || "Financial analysis engine encountered an error. Please verify the tickers.", 
        data: null, 
        step: 'idle' 
      });
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-3">
              <i className="fas fa-terminal text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">QUANTEDGE <span className="text-blue-500">PRO</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Institutional Intelligence</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <span className="text-blue-400 border-b-2 border-blue-500 pb-1">3-Factor Model</span>
            <span className="hover:text-white cursor-pointer transition-colors">Risk Engine</span>
            <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          </div>
        </div>
        {/* Top Progress Bar for subtle indication */}
        {state.loading && (
             <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${state.progress}%` }}></div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-16">
        <div className={`transition-all duration-500 ease-out ${state.data ? 'mb-12 translate-y-0 opacity-100' : 'h-[50vh] flex flex-col justify-center'}`}>
          {!state.data && !state.loading && (
            <div className="text-center mb-12 animate-fadeIn">
              <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                Quant Analyst v4.0.2
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
                Analyze <span className="text-slate-500">Fast.</span><br/>Invest <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Deep.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                Enter multiple tickers separated by commas to perform batch institutional-grade analysis in seconds.
              </p>
            </div>
          )}

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto w-full">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden p-2 pr-4 ring-1 ring-white/5 shadow-3xl">
                <input
                  type="text"
                  placeholder="e.g. AAPL, NVDA, TSLA..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full py-4 px-6 bg-transparent text-white focus:outline-none font-mono text-xl uppercase placeholder:capitalize placeholder:font-sans placeholder:text-slate-600"
                  disabled={state.loading}
                />
                <button
                  type="submit"
                  disabled={state.loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black text-xs uppercase tracking-widest py-4 px-10 rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center gap-3"
                >
                  {state.loading ? (
                    <>
                      <span className="animate-pulse">Analyzing</span>
                    </>
                  ) : (
                    <>
                      Run Analysis
                      <i className="fas fa-bolt text-blue-200"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Main Central Progress Bar */}
            {state.loading && (
                <div className="mt-8 max-w-md mx-auto">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        <span>Processing Market Data</span>
                        <span>{Math.round(state.progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${state.progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {!state.loading && !state.data && (
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                 <button type="button" onClick={() => { setInput('AAPL, NVDA, MSFT'); }} className="group flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300">Big Tech Batch</span>
                 </button>
                 <button type="button" onClick={() => { setInput('TSLA, RIVN, LCID'); }} className="group flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors"></span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300">EV Sector</span>
                 </button>
              </div>
            )}
          </form>
        </div>

        {state.loading && !state.progress && (
          <div className="flex flex-col items-center justify-center py-32 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fas fa-brain text-blue-500 text-2xl animate-pulse"></i>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div className="max-w-2xl mx-auto bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 text-center animate-fadeIn shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-bug text-rose-500 text-2xl"></i>
            </div>
            <h3 className="text-white font-black text-xl mb-3 tracking-tight">Execution Halted</h3>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed">{state.error}</p>
            <button 
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all"
            >
              Clear Faults
            </button>
          </div>
        )}

        {state.data && !state.loading && (
          <AnalysisDashboard stocks={state.data} />
        )}
      </main>

      <footer className="mt-32 py-16 border-t border-slate-900/50 bg-slate-950/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-12 mb-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
             <i className="fab fa-aws text-3xl"></i>
             <i className="fab fa-google text-3xl"></i>
             <i className="fab fa-python text-3xl"></i>
             <i className="fas fa-microchip text-3xl"></i>
          </div>
          <p className="text-slate-600 text-[10px] leading-relaxed uppercase tracking-[0.2em] font-bold max-w-xl mx-auto">
            QuantEdge utilizes high-performance Gemini 3 infrastructure for real-time inference. No warranty is provided.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
