"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  const [docId, setDocId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load document info
  useEffect(() => {
    const storedDocs = JSON.parse(localStorage.getItem("documents") || "[]");
    setDocuments(storedDocs);

    const docFromUrl = searchParams.get("doc");
    const activeDoc = docFromUrl || localStorage.getItem("activeDocId");

    if (activeDoc) {
      setDocId(activeDoc);
      localStorage.setItem("activeDocId", activeDoc);
    }
  }, [searchParams]);

  // Require login: if the user isn't signed in, prompt the Clerk login modal
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      clerk.openSignIn({
        redirectUrl: docId ? `/chat?doc=${docId}` : "/chat",
      });
    }
  }, [isLoaded, isSignedIn, clerk, docId]);

  const handleDocumentSwitch = (e) => {
    const newDocId = e.target.value;
    setDocId(newDocId);
    localStorage.setItem("activeDocId", newDocId);
    setMessages([]);
    router.push(`/chat?doc=${newDocId}`);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!docId) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Please upload a document first before asking questions." },
      ]);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage, docId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeDocName = documents.find((d) => d.id === docId)?.name;

  // While Clerk is checking auth status, or if not signed in, show a simple placeholder
  if (!isLoaded || !isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please log in to continue...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Chat with your <span className="text-[#10B981]">Document</span>
        </h1>

        {documents.length > 0 && (
          <select
            value={docId || ""}
            onChange={handleDocumentSwitch}
           className="w-full sm:w-auto text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:border-[#10B981]"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeDocName && (
        <div className="px-6 py-2 bg-emerald-50 text-emerald-700 text-sm text-center">
          Currently chatting with: <strong>{activeDocName}</strong>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl w-full mx-auto">
        {!docId ? (
          <div className="text-center text-gray-400 mt-20">
            <p>No document selected. Please upload a PDF first.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <span className="text-4xl mb-3 inline-block icon-bob">💬</span>
            <p>Ask a question about your uploaded document to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex animate-[fadeInUp_0.3s_ease-out] ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-emerald-100 transition"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-3 rounded-2xl font-medium transition ${
              input.trim() && !isLoading
                ? "btn-3d bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white hover:from-[#059669] hover:to-[#0891A6]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
