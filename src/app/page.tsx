"use client";

import { useState } from "react";

// Define types for API response and interactions
interface Interaction {
  agent: string;
  action: string;
  input?: string;
  output: string;
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  script?: string;
  interactions?: Interaction[];
  error?: string;
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [duration, setDuration] = useState<"short" | "long">("short");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [showInteractions, setShowInteractions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, data, duration }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const dataRes = await res.json();
      setResult(dataRes);
    } catch (error) {
      console.error("Submission error:", error);
      setResult({ success: false, error: "Failed to generate script" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden relative">
        {result?.interactions && (
          <button
            onClick={() => setShowInteractions(!showInteractions)}
            className="absolute top-4 left-4 z-10 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-300 flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>{showInteractions ? "Hide" : "Show"} Interactions</span>
          </button>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            ScriptFlow
          </h1>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Video Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            />

            <textarea
              placeholder="Optional Data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 min-h-[120px]"
            />

            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as "short" | "long")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
            >
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Generate Script"
            )}
          </button>
        </form>

        {result && (
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            {result.script && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Generated Script
                </h2>
                <pre className="bg-white border border-gray-300 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                  {result.script}
                </pre>
              </div>
            )}

            {showInteractions && result.interactions && (
              <div className="mt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Agent Interactions
                </h3>
                {result.interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-indigo-600">
                        {interaction.agent} - {interaction.action}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(interaction.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {interaction.input && (
                      <div className="mb-2">
                        <div className="text-sm text-gray-600 mb-1">Input:</div>
                        <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                          {interaction.input}
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Output:</div>
                      <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                        {interaction.output}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
