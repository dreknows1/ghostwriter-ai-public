import React, { useMemo, useState } from "react";
import { askAndre } from "../services/geminiService";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AskAndreWidgetProps = {
  email?: string;
};

const STARTER =
  "Ask me anything about SongGhost: login, members access, credits, songs, revisions, billing, or setup. What do you need help with first?";

const AskAndreWidget: React.FC<AskAndreWidgetProps> = ({ email }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: STARTER }]);

  const visibleMessages = useMemo(() => messages.slice(-10), [messages]);

  const renderWithLinks = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, index) => {
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        return (
          <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="text-cyan-300 underline break-all">
            {part}
          </a>
        );
      }
      return <React.Fragment key={`${index}-txt`}>{part}</React.Fragment>;
    });
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const answer = await askAndre(question, email || "guest@songghost.com", nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error: any) {
      const message =
        error?.message ||
        "I hit an error while answering. What exact screen and action triggered this? Is there anything else I can help you with?";
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[95]">
      {open ? (
        <div className="w-[22rem] max-w-[92vw] rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div>
              <p className="text-sm font-bold text-cyan-300">Ask Andre</p>
              <p className="text-[11px] text-slate-400">Conversational Help</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
          </div>
          <div className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-slate-900/40">
            {visibleMessages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-slate-800 text-slate-100"
                    : "bg-cyan-900/40 border border-cyan-800 text-cyan-100 ml-8"
                }`}
              >
                {renderWithLinks(msg.content)}
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400">Thinking...</div>}
          </div>
          <div className="p-3 border-t border-slate-700 bg-[#0b1220]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-xl border border-cyan-400/40"
        >
          Ask Andre
        </button>
      )}
    </div>
  );
};

export default AskAndreWidget;
