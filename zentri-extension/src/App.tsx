import React, { useState, useEffect } from 'react';
import { Shield, Globe, Cpu, Clock, Search, ExternalLink, Zap } from 'lucide-react';

const App = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#09090b] text-zinc-400 flex flex-col items-center justify-center relative overflow-hidden m-0 p-0">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

      <div className="max-w-5xl w-full z-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/20 animate-pulse">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">ZENTRI <span className="text-emerald-500">ENGINE</span></h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Secure Session Environment Active</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search the decentralized web..."
            className="w-full h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-16 pr-6 text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    window.location.href = `https://www.google.com/search?q=${(e.target as HTMLInputElement).value}`;
                }
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: Globe, label: 'Proxy IP', value: 'Protected', color: 'text-blue-500' },
            { icon: Cpu, label: 'Fingerprint', value: 'Spoofed', color: 'text-purple-500' },
            { icon: Zap, label: 'Latency', value: 'Optimized', color: 'text-amber-500' },
            { icon: Clock, label: 'Local Time', value: time.toLocaleTimeString(), color: 'text-zinc-200' },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl hover:border-zinc-700 transition-all group">
              <stat.icon className={`w-5 h-5 mb-3 ${stat.color} opacity-70 group-hover:opacity-100 transition-all`} />
              <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">{stat.label}</div>
              <div className="text-sm font-mono text-zinc-300 mt-1">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex justify-center gap-4">
          {['https://pixelscan.net', 'https://whoer.net', 'https://browserleaks.com'].map((link) => (
            <a 
              key={link}
              href={link}
              className="px-6 py-3 bg-zinc-900/20 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 group"
            >
              <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-emerald-500" />
              {link.replace('https://', '')}
            </a>
          ))}
        </div>
      </div>

      {/* Tailwind Utility Styles (Simplified for this example) */}
      <style>{`
        .bg-primary\\/10 { background-color: rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

export default App;
