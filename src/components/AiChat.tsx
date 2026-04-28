"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type ReferencedKarte = {
  id: string;
  date: string;
  summary: string;
};

type Message = {
  role: "user" | "ai";
  text: string;
  referenced_kartes?: ReferencedKarte[];
  match_type?: string;
};

type Props = {
  accessToken: string | null;
};

export default function AiChat({ accessToken }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: data.answer,
            referenced_kartes: data.referenced_kartes || [],
            match_type: data.match_type,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "エラーが発生しました。もう一度お試しください。" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "通信エラーが発生しました。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 border-brand rounded-xl p-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛳</span>
          <div className="text-left">
            <p className="font-bold text-brand text-sm">富加ゴルフレッスンアシスタントAI</p>
            <p className="text-xs text-gray-500">カルテの内容について質問できます</p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="bg-white border-x-2 border-b-2 border-brand rounded-b-xl shadow-sm overflow-hidden">
          <div className="h-72 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-sm gap-1">
                <p>レッスンカルテの内容について</p>
                <p>お気軽にご質問ください</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-brand text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === "ai" &&
                    msg.referenced_kartes &&
                    msg.referenced_kartes.length > 0 && (
                      <div className="space-y-1 pl-1">
                        {msg.referenced_kartes.map((karte) => (
                          <Link
                            key={karte.id}
                            href={`/mypage/karte/${karte.id}`}
                            className="flex items-start gap-2 text-xs bg-green-50 border border-brand text-brand font-bold px-3 py-2 rounded-lg"
                          >
                            <span className="mt-0.5">📋</span>
                            <div>
                              <p>{karte.date}のカルテを見る →</p>
                              {karte.summary && (
                                <p className="font-normal text-gray-500 mt-0.5">{karte.summary}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="例：スイングで気をつけることは？"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 shrink-0"
            >
              送信
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
