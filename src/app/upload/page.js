"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export default function Upload() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const clerk = useClerk();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  const isValidFile = (f) =>
    f &&
    (ACCEPTED_TYPES.includes(f.type) ||
      f.name.toLowerCase().endsWith(".docx") ||
      f.name.toLowerCase().endsWith(".txt"));

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (isValidFile(selectedFile)) {
      setFile(selectedFile);
      setMessage("");
    } else {
      alert("Please select a PDF, Word (.docx), or text (.txt) file only.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFile(droppedFile)) {
      setFile(droppedFile);
      setMessage("");
    } else {
      alert("Please drop a PDF, Word (.docx), or text (.txt) file only.");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Success! ${data.message}`);

        const existing = JSON.parse(localStorage.getItem("documents") || "[]");
        const updated = [
          { id: data.docId, name: data.fileName, date: new Date().toISOString() },
          ...existing,
        ];
        localStorage.setItem("documents", JSON.stringify(updated));
        localStorage.setItem("activeDocId", data.docId);

        const chatUrl = `/chat?doc=${data.docId}`;

        setTimeout(() => {
          if (isSignedIn) {
            router.push(chatUrl);
          } else {
            clerk.openSignIn({ redirectUrl: chatUrl });
          }
        }, 1200);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Text + Upload Card */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Upload your <span className="text-[#10B981]">Document</span>
          </h1>
          <p className="text-gray-600 mb-8">
            Drop a PDF, Word, or text file to get started. Sign in required to start chatting.
          </p>

          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition ${
                isDragging ? "border-[#10B981] bg-emerald-50" : "border-gray-300"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />

              {file ? (
                <div>
                  <p className="text-gray-900 font-medium mb-2">{file.name}</p>
                  <p className="text-gray-500 text-sm">Ready to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-2">Drag and drop your PDF or Word file here</p>
                  <p className="text-gray-500 text-sm mb-4">or</p>
                  <label
                    htmlFor="fileInput"
                    className="bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white px-6 py-2 rounded-full cursor-pointer hover:from-[#059669] hover:to-[#0891A6] transition inline-block"
                  >
                    Browse File
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full mt-6 px-8 py-3 rounded-full text-lg font-medium transition flex items-center justify-center gap-2 ${
                file && !isUploading
                  ? "btn-3d bg-gradient-to-r from-[#10B981] to-[#0EA5A6] text-white hover:from-[#059669] hover:to-[#0891A6]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isUploading && (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
              )}
              {isUploading ? "Processing..." : "Upload & Process"}
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
            )}
          </div>

          <p className="text-gray-400 text-sm mt-4">Sign-in required to chat · PDF, Word, or TXT · Private per document</p>
        </div>

        {/* Right: Custom illustration */}
        <div className="hidden md:flex justify-center relative">
          <span className="floating-symbol text-2xl top-2 left-2" style={{ animationDelay: "0s" }}>✨</span>
          <span className="floating-symbol text-2xl bottom-6 right-2" style={{ animationDelay: "1.5s" }}>💬</span>
          <span className="floating-symbol text-xl top-10 right-10" style={{ animationDelay: "2.4s" }}>✅</span>

          <svg viewBox="0 0 400 400" className="w-full max-w-md">
            <circle cx="200" cy="200" r="170" fill="#ECFDF5" />

            {/* Document */}
            <rect x="120" y="80" width="140" height="180" rx="12" fill="white" stroke="#10B981" strokeWidth="3" />
            <rect x="140" y="110" width="100" height="8" rx="4" fill="#A7F3D0" />
            <rect x="140" y="130" width="100" height="8" rx="4" fill="#A7F3D0" />
            <rect x="140" y="150" width="70" height="8" rx="4" fill="#A7F3D0" />
            <rect x="140" y="180" width="100" height="8" rx="4" fill="#D1FAE5" />
            <rect x="140" y="200" width="80" height="8" rx="4" fill="#D1FAE5" />

            {/* Chat bubble */}
            <rect x="230" y="230" width="110" height="60" rx="16" fill="#10B981" />
            <path d="M245 290 L245 305 L265 290 Z" fill="#10B981" />
            <circle cx="255" cy="260" r="5" fill="white" />
            <circle cx="280" cy="260" r="5" fill="white" />
            <circle cx="305" cy="260" r="5" fill="white" />

            {/* Small decorative circles */}
            <circle cx="90" cy="140" r="8" fill="#6EE7B7" />
            <circle cx="310" cy="120" r="6" fill="#34D399" />
            <circle cx="95" cy="280" r="6" fill="#A7F3D0" />
          </svg>
        </div>
      </div>
    </main>
  );
}