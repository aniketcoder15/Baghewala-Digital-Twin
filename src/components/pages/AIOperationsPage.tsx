import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Send, 
  RotateCw, 
  HelpCircle,
  Activity,
  Flame,
  Sliders,
  History,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { askAIOperations, buildAIContext } from '../../services/aiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataUsed?: Record<string, string | number>;
  actionKey?: string;
}

export const AIOperationsPage: React.FC = () => {
  const { selectedWellId, wellBaseline, activeParameters, calculatedState } = useWell();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Build the live structured context object
  const aiContext = useMemo(() => {
    return buildAIContext(wellBaseline, activeParameters, calculatedState);
  }, [wellBaseline, activeParameters, calculatedState]);

  // Pre-seeded initial conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'user',
      text: 'Why is production changing?',
      timestamp: '14:20:05',
      actionKey: 'production',
    },
    {
      id: 'init-2',
      sender: 'assistant',
      text: `Production for ${selectedWellId} is currently ${calculatedState.production} BOPD. As downhole reservoir temperature has cooled to ${calculatedState.reservoirTemperature}°C, heavy oil viscosity has reached ${calculatedState.oilViscosity.toLocaleString()} cP. Higher viscosity reduces pump intake efficiency to ${calculatedState.pumpEfficiency}% and elevates downstroke rod loading to ${calculatedState.rodLoad}%.`,
      timestamp: '14:20:06',
      dataUsed: {
        'Well ID': selectedWellId,
        'Reservoir Temp': `${calculatedState.reservoirTemperature} °C`,
        'Oil Viscosity': `${calculatedState.oilViscosity.toLocaleString()} cP`,
        'Production': `${calculatedState.production} BOPD`,
        'Pump Efficiency': `${calculatedState.pumpEfficiency}%`,
        'Rod Load': `${calculatedState.rodLoad}%`,
      },
    },
  ]);

  const quickQuestions = [
    { label: 'WHY IS PRODUCTION CHANGING?', key: 'production', icon: Activity },
    { label: 'ANALYZE CURRENT RISK', key: 'risk', icon: HelpCircle },
    { label: 'ANALYZE CSS CYCLE', key: 'css', icon: Flame },
    { label: 'ANALYZE SRP PERFORMANCE', key: 'srp', icon: Sliders },
    { label: 'EXPLAIN CURRENT WELL', key: 'explain', icon: Info },
    { label: 'COMPARE WITH HISTORY', key: 'history', icon: History },
  ];

  const handleQuickQuestion = async (label: string, key: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: label,
      timestamp: new Date().toLocaleTimeString(),
      actionKey: key,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await askAIOperations(label, aiContext, key);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString(),
        dataUsed: result.dataUsed,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const query = inputQuery.trim();
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await askAIOperations(query, aiContext);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString(),
        dataUsed: result.dataUsed,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Find latest message with dataUsed for the audit panel
  const latestAssistantMessage = [...messages].reverse().find(m => m.sender === 'assistant' && m.dataUsed);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">AI Operations</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#06B6D4] border border-[#A5F3FC] shadow-xs font-semibold">
              WELL: {selectedWellId}
            </span>
          </div>
          <p className="text-xs text-[#475569]">Telemetry-grounded petroleum engineering decision support</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#06B6D4] font-mono font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>DECISION SUPPORT TERMINAL</span>
        </div>
      </div>

      {/* QUICK ANALYSIS BUTTONS */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 shadow-xs">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] mb-2 font-semibold">
          QUICK ANALYSIS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickQuestions.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleQuickQuestion(item.label, item.key)}
                disabled={loading}
                className="flex items-center gap-2 p-2 bg-[#F8FAFC] hover:bg-[#FFFFFF] active:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#F97316]/50 rounded text-left transition-colors group disabled:opacity-50 shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                <span className="text-[10px] font-mono uppercase font-semibold text-[#1E293B] truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Feed + Audit Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Compact Conversation Area (col-span-8) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg overflow-hidden flex flex-col h-[440px] shadow-xs">
          {/* Terminal Sub-header */}
          <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs font-mono text-[#64748B]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
              <span className="text-[#475569] font-medium">BAGHEWALA OPERATIONAL DIAGNOSTIC TERMINAL</span>
            </div>
            <span className="font-semibold text-[#1E293B]">WELL: {selectedWellId}</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[#64748B]">{msg.timestamp}</span>
                  <span className={`text-[10px] font-mono font-semibold ${msg.sender === 'user' ? 'text-[#F97316]' : 'text-[#0891B2]'}`}>
                    {msg.sender === 'user' ? 'PRODUCTION ENGINEER' : 'AI OPERATIONS'}
                  </span>
                </div>
                <div className={`p-3 rounded text-xs leading-relaxed max-w-2xl shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#FFFFFF] text-[#1E293B] border border-[#CBD5E1]'
                    : 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] border-l-3 border-l-[#06B6D4]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[#06B6D4] font-semibold">AI OPERATIONS</span>
                </div>
                <div className="p-3 rounded text-xs bg-[#FFFFFF] text-[#475569] border border-[#E2E8F0] flex items-center gap-2 shadow-xs">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                  <span>Evaluating live well telemetry and kinematic equations...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleCustomSubmit} className="p-3 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about this well..."
              disabled={loading}
              className="flex-1 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#F97316] rounded px-3 py-2 text-xs text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* DATA USED Audit Panel (col-span-4) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[#E2E8F0]">
              <div className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                DATA USED
              </div>
              <span className="text-[10px] text-[#0D9488] font-mono font-semibold">AUDIT SNAPSHOT</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {latestAssistantMessage?.dataUsed ? (
                Object.entries(latestAssistantMessage.dataUsed).map(([k, v]) => (
                  <div key={k} className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">{k}</span>
                    <span className="font-mono text-[#1E293B] font-semibold">{v}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  Telemetry snapshot will appear after query
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-[#64748B] font-mono border-t border-[#E2E8F0] flex items-center justify-between">
            <span>Model Grounding: 100%</span>
            <span className="text-[#0D9488] font-semibold">● DETERMINISTIC + LLM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
