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
          <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="text-[#2b5be0] underline break-all">
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
    <div className="fixed bottom-4 right-4 z-[95] safe-bottom" style={{ marginBottom: 'var(--safe-bottom, 0px)' }}>
      {open ? (
        <div className="w-[22rem] max-w-[92vw] rounded-2xl border border-[#eadfca] bg-white shadow-[0_10px_30px_rgba(90,70,30,0.15)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eadfca]">
            <div>
              <p className="text-sm font-bold text-[#2b5be0]">Ask Rudy</p>
              <p className="text-[11px] text-[#8a8272]">Conversational Help</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#8a8272] active:text-[#1a1a1a] text-sm">Close</button>
          </div>
          <div className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-white">
            {visibleMessages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-[#f1ece0] text-[#1a1a1a]"
                    : "bg-[#e7edff] text-[#2b5be0] ml-8"
                }`}
              >
                {renderWithLinks(msg.content)}
              </div>
            ))}
            {loading && <div className="text-xs text-[#8a8272]">Thinking...</div>}
          </div>
          <div className="p-3 border-t border-[#eadfca] bg-white">
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
                className="flex-1 bg-white border border-[#e3d8c1] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#8a8272] focus:outline-none focus:border-[#2b5be0]"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-[#2b5be0] active:brightness-110 disabled:bg-[#e7ddc9] disabled:text-[#8a8272] text-white text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Rudy"
          title="Ask Rudy"
          className="w-12 h-12 rounded-full text-white flex items-center justify-center text-lg font-black active:brightness-110"
          style={{ background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)', boxShadow: '0 12px 26px rgba(47,91,224,0.32)' }}
        >
          ?
        </button>
      )}
    </div>
  );
};

export default AskAndreWidget;
