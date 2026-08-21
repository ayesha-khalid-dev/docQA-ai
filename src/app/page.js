export default function Home() {
  const features = [
    { icon: "📤", title: "Upload Any PDF", desc: "Drag and drop to get started." },
    { icon: "💭", title: "Ask Questions", desc: "Plain English, no syntax needed." },
    { icon: "⚡", title: "Instant Answers", desc: "Accurate, sourced from your file." },
    { icon: "🔒", title: "Private by Default", desc: "Each document stays isolated." },
    { icon: "🤖", title: "AI Powered", desc: "Built on Google Gemini." },
    { icon: "🌍", title: "Any Language", desc: "Ask in the language you prefer." },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden">
        <span className="floating-symbol text-4xl top-16 left-[8%]" style={{ animationDelay: "0s" }}>📄</span>
        <span className="floating-symbol text-3xl top-32 right-[10%]" style={{ animationDelay: "1.2s" }}>✨</span>
        <span className="floating-symbol text-5xl bottom-24 left-[14%]" style={{ animationDelay: "2.1s" }}>❓</span>
        <span className="floating-symbol text-3xl top-1/3 right-[6%]" style={{ animationDelay: "0.6s" }}>💬</span>
        <span className="floating-symbol text-4xl bottom-16 right-[16%]" style={{ animationDelay: "1.8s" }}>✅</span>
        <span className="floating-symbol text-3xl top-10 right-[30%]" style={{ animationDelay: "2.6s" }}>🤖</span>
        <span className="floating-symbol text-2xl bottom-10 left-[32%]" style={{ animationDelay: "3.2s" }}>📌</span>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-[fadeInUp_0.6s_ease-out] relative z-10">
          Chat with your <span className="text-[#10B981]">Documents</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-8 animate-[fadeInUp_0.6s_ease-out_0.1s_both] relative z-10">
          Upload any PDF and ask questions instantly. Powered by AI to give you accurate answers from your own documents.
        </p>
        <a
          href="/upload"
          className="btn-3d bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white px-8 py-3 rounded-full text-lg font-medium hover:from-[#059669] hover:to-[#0891A6] relative z-10 animate-[fadeInUp_0.6s_ease-out_0.2s_both]"
        >
          Get Started
        </a>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 justify-center mt-10 relative z-10">
          {["Free to Upload", "Sign In to Start Chatting", "Powered by Gemini AI"].map((badge) => (
            <span
              key={badge}
              className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-full shadow-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Marquee feature strip */}
      <section className="py-10 overflow-hidden border-y border-gray-100 bg-white/50">
        <div className="marquee-track">
          {[...features, ...features].map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-4 mx-3 shadow-sm shrink-0"
            >
              <span className="icon-bob text-2xl" style={{ animationDelay: `${(idx % 6) * 0.2}s` }}>{f.icon}</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{f.title}</p>
                <p className="text-gray-500 text-xs whitespace-nowrap">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            { step: "1", title: "Upload your PDF", color: "#10B981" },
            { step: "2", title: "Ask a question", color: "#0EA5A6" },
            { step: "3", title: "Get an instant answer", color: "#059669" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
                style={{ backgroundColor: s.color }}
              >
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA with illustration */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-[#10B981] to-[#0EA5A6] rounded-3xl grid md:grid-cols-2 items-center gap-8 p-10 md:p-16 overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your documents, finally easy to talk to.
            </h2>
            <p className="text-emerald-50 mb-8">
              Stop scrolling through pages. Upload once, ask anything, and get answers grounded in your own content — in seconds.
            </p>
            <a
              href="/upload"
              className="bg-white text-[#10B981] px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-100 transition inline-block hover:scale-105 hover:-translate-y-1"
            >
              Try it free
            </a>
          </div>

          <div className="relative hidden md:flex justify-center">
            <svg viewBox="0 0 300 300" className="w-full max-w-xs">
              <circle cx="150" cy="150" r="130" fill="rgba(255,255,255,0.12)" />
              <rect x="90" y="60" width="120" height="150" rx="10" fill="white" />
              <rect x="105" y="85" width="90" height="7" rx="3.5" fill="#A7F3D0" />
              <rect x="105" y="102" width="90" height="7" rx="3.5" fill="#A7F3D0" />
              <rect x="105" y="119" width="60" height="7" rx="3.5" fill="#A7F3D0" />
              <rect x="150" y="180" width="90" height="50" rx="14" fill="#059669" />
              <circle cx="165" cy="205" r="4" fill="white" />
              <circle cx="185" cy="205" r="4" fill="white" />
              <circle cx="205" cy="205" r="4" fill="white" />
              <circle cx="75" cy="100" r="6" fill="white" opacity="0.7" />
              <circle cx="230" cy="90" r="5" fill="white" opacity="0.5" />
            </svg>
          </div>
        </div>
      </section>
    </main>
  );
}