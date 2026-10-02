/**
 * Logistics Management Portal - Logistics Assistant View
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  User,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citedEntities?: {
    sectors: string[];
    items: string[];
    priorityAction: string;
  };
}

export const LogiCopilotView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text: "Logistics Assistant online. I can answer inquiries regarding current inventory levels, demand forecasts, risk assessments, and pending replenishment orders across monitored locations.",
      timestamp: '14:55',
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await api.queryCopilot(textToSend);
      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citedEntities: response.citedEntities,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "The logistics assistant service is temporarily unreachable. Please refer directly to the Dashboard and Inventory tables.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const commonQueries = [
    "Which locations currently require replenishment?",
    "Summarize high-risk locations and primary drivers",
    "What is the expected stock-out horizon for Sector Bravo?",
    "Evaluate fleet availability and transit capacity",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span>Logistics Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational inquiry utility grounded in active database records, demand forecasts, and transport data.
          </p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-2xl rounded p-3 leading-relaxed space-y-2 ${
                isUser
                  ? 'bg-blue-700 text-white font-medium'
                  : 'bg-slate-900 border border-slate-700 text-slate-200'
              }`}>
                <div className="whitespace-pre-wrap">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1em] mb-1">
                      {line.includes('**') ? (
                        line.split('**').map((part, j) => (
                          j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                        ))
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>

                {msg.citedEntities && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                    <span>Referenced:</span>
                    {msg.citedEntities.sectors.map(s => (
                      <span key={s} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                    {msg.citedEntities.items.map(it => (
                      <span key={it} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {it}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] text-right font-mono ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-400 font-mono">
              Retrieving database context and preparing response...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 text-[11px]">Common queries:</span>
        {commonQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Ask about inventory levels, stock-out timelines, or replenishment priorities..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
