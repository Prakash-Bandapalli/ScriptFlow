"use client";

import type React from "react";

import { useState, useCallback, useRef } from "react";
import type { ApiResponse, StatusUpdate } from "@/types";

import { SimulatedProgress } from "./components/SimulatedProgress";

const fadeInUp = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const fadeIn = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const pulse = `
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const shimmer = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Sample data for preview
const SAMPLE_INTERACTIONS = [
  {
    agent: "TitleAnalyzer",
    action: "Analyzing title",
    timestamp: "2023-05-15T14:30:22Z",
    input: "How to make a delicious chocolate cake at home",
    output:
      "Title analysis complete. Detected keywords: chocolate, cake, home cooking, recipe. Category: Food & Cooking. Target audience: Home bakers, cooking enthusiasts.",
  },
  {
    agent: "StyleGenerator",
    action: "Generating style patterns",
    timestamp: "2023-05-15T14:30:45Z",
    input: "Food & Cooking, Home bakers",
    output:
      "Style pattern generated. Tone: Friendly, instructional. Format: Step-by-step guide with introduction, ingredients list, preparation steps, and conclusion with tips.",
  },
  {
    agent: "ScriptDrafter",
    action: "Creating initial draft",
    timestamp: "2023-05-15T14:31:15Z",
    input:
      "Title: How to make a delicious chocolate cake at home\nStyle: Friendly, instructional\nFormat: Step-by-step guide",
    output:
      "Initial draft complete. Created 450-word script with introduction, ingredients section, 8 preparation steps, and conclusion with serving suggestions.",
  },
  {
    agent: "QualityChecker",
    action: "Evaluating script quality",
    timestamp: "2023-05-15T14:31:45Z",
    input: "[Full script content]",
    output:
      "Quality check complete. Readability score: 85/100. Engagement score: 90/100. Suggestions: Add more sensory descriptions, include alternative ingredients for dietary restrictions.",
  },
  {
    agent: "ScriptReviser",
    action: "Revising script",
    timestamp: "2023-05-15T14:32:15Z",
    input:
      "Add more sensory descriptions, include alternative ingredients for dietary restrictions",
    output:
      "Revision complete. Added sensory descriptions to steps 3, 5, and 7. Added alternative ingredient suggestions for dairy-free and gluten-free options.",
  },
];

export default function Home() {
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [duration, setDuration] = useState<"short" | "long">("short");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusUpdate[]>([]);
  const [activeInteractionIndex, setActiveInteractionIndex] = useState<
    number | null
  >(null);

  // For demo purposes, use sample data if no result
  const interactions =
    result?.success && result.interactions
      ? result.interactions
      : SAMPLE_INTERACTIONS;
  const logContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setIsCopied(false);
    setActiveInteractionIndex(null);
    setStatusMessages([
      { message: "Sending request...", timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, data, duration }),
      });

      const dataRes = await res.json();

      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`;
        errorMsg = dataRes.error || errorMsg;
        setStatusMessages(
          dataRes.statusUpdates || [
            {
              message: `Error: ${errorMsg}`,
              timestamp: new Date().toISOString(),
            },
          ]
        );
        throw new Error(errorMsg);
      }

      setResult(dataRes);
      setStatusMessages(dataRes.statusUpdates || []);
    } catch (error: any) {
      console.error("Submission error:", error);
      if (!result) {
        setResult({
          success: false,
          error: error.message || "Failed to generate script",
        });
      }
      if (statusMessages.length <= 1) {
        setStatusMessages((prev) => [
          ...prev,
          {
            message: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = useCallback(() => {
    if (result?.success && result.script) {
      navigator.clipboard.writeText(result.script).then(
        () => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        },
        (err) => {
          console.error("Failed to copy text: ", err);
        }
      );
    }
  }, [result]);

  const toggleInteraction = (index: number) => {
    setActiveInteractionIndex(activeInteractionIndex === index ? null : index);
  };

  return (
    <>
      <style jsx global>{`
        ${fadeInUp}
        ${fadeIn}
        ${pulse}
        ${shimmer}
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-title-pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        .btn-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .card-hover-effect:hover {
          transform: translateY(-4px);
          transition: transform 0.3s ease-out;
        }

        .tab-transition {
          transition: all 0.3s ease-out;
        }

        .agent-item-transition {
          transition: all 0.2s ease-out;
        }

        .agent-item-transition:hover {
          transform: translateX(4px);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Simulated Progress Overlay */}
        <SimulatedProgress isLoading={isLoading} />

        <div className="container mx-auto py-10 px-4 max-w-6xl">
          {/* Header */}
          <div
            className="text-center mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="animate-title-pulse">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 mb-3 relative">
                <span className="animate-shimmer absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400"></span>
                ScriptFlow
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Generate professional scripts for your videos with AI assistance
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div
            className={`animate-fade-in-up ${
              isLoading ? "pointer-events-none" : ""
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl card-hover-effect">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Create Your Script
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Fill in the details below to generate a customized script
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Title Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="videoTitle"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Video Title
                      </label>
                      <input
                        id="videoTitle"
                        type="text"
                        placeholder="Enter the main topic or title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all duration-300 focus:border-transparent focus:shadow-md"
                      />
                    </div>

                    {/* Optional Data Textarea */}
                    <div className="space-y-2">
                      <label
                        htmlFor="optionalData"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Optional Data
                      </label>
                      <textarea
                        id="optionalData"
                        placeholder="Keywords, target audience, specific points to include..."
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all duration-300 min-h-[100px] resize-y focus:border-transparent focus:shadow-md"
                      />
                    </div>

                    {/* Duration Select */}
                    <div className="space-y-2">
                      <label
                        htmlFor="scriptDuration"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Desired Script Length
                      </label>
                      <select
                        id="scriptDuration"
                        value={duration}
                        onChange={(e) =>
                          setDuration(e.target.value as "short" | "long")
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all duration-300 appearance-none focus:border-transparent focus:shadow-md"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1rem center",
                          backgroundSize: "1rem",
                        }}
                      >
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md btn-hover-effect"
                  >
                    {isLoading ? (
                      <>
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
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        Generate Script
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-1 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {(!isLoading && result) || (!isLoading && SAMPLE_INTERACTIONS) ? (
            <div
              className="mt-10 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl card-hover-effect">
                <div className="border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center p-6">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                      Results
                    </h2>
                    <div className="ml-auto flex space-x-2">
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeInteractionIndex === null
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        } tab-transition`}
                        onClick={() => setActiveInteractionIndex(null)}
                      >
                        Script
                      </button>
                      <button
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeInteractionIndex !== null
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        } tab-transition`}
                        onClick={() => setActiveInteractionIndex(0)}
                      >
                        Agent Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-0">
                  {/* Status Log (Compact) */}
                  {!isLoading &&
                    statusMessages.length > 0 &&
                    activeInteractionIndex === null && (
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-slate-500 dark:text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Generation Log
                          </h4>
                        </div>
                        <div
                          ref={logContainerRef}
                          className="max-h-32 overflow-y-auto rounded-md bg-white dark:bg-slate-800 p-2 text-xs"
                        >
                          {statusMessages.map((status, index) => (
                            <div
                              key={index}
                              className="flex py-1 border-b border-slate-100 dark:border-slate-700 last:border-0"
                            >
                              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mr-2 shrink-0">
                                {new Date(status.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )}
                              </span>
                              <span className="text-slate-600 dark:text-slate-300">
                                {status.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Content Area */}
                  <div className="p-6">
                    {/* Script View */}
                    {activeInteractionIndex === null &&
                      (result?.success ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                                Generated Script
                              </h3>
                            </div>
                            <button
                              onClick={handleCopy}
                              disabled={isCopied}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center ${
                                isCopied
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105"
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  <span className="animate-fade-in">
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <pre className="font-mono text-sm leading-relaxed p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-pre-wrap min-h-[300px] text-slate-700 dark:text-slate-300">
                              {result.script ||
                                "// Sample script would appear here"}
                            </pre>
                            {/* Word count badge */}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                              {result.script
                                ? result.script.split(/\s+/).length
                                : 0}{" "}
                              words
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Error Message */
                        result &&
                        !result.success &&
                        result.error && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-700 dark:text-red-400">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )
                      ))}

                    {/* Agent Interactions View */}
                    {activeInteractionIndex !== null && (
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Sidebar with agent list */}
                        <div className="md:w-1/4 space-y-2">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                            Agent Timeline
                          </h3>
                          <div className="space-y-1">
                            {interactions.map((interaction, index) => (
                              <button
                                key={`agent-${index}`}
                                onClick={() => toggleInteraction(index)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 agent-item-transition ${
                                  activeInteractionIndex === index
                                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 font-medium"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
                                  <span className="truncate">
                                    {interaction.agent}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                                  {interaction.action}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Main interaction details */}
                        <div className="md:w-3/4">
                          {activeInteractionIndex !== null &&
                            interactions[activeInteractionIndex] && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 mr-2">
                                        {
                                          interactions[activeInteractionIndex]
                                            .agent
                                        }
                                      </span>
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {
                                          interactions[activeInteractionIndex]
                                            .action
                                        }
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(
                                        interactions[
                                          activeInteractionIndex
                                        ].timestamp
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4 space-y-4">
                                  {interactions[activeInteractionIndex]
                                    .input && (
                                    <div>
                                      <div className="flex items-center mb-2">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 text-slate-500 dark:text-slate-400 mr-1.5"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16l-4-4m0 0l4-4m-4 4h18"
                                          />
                                        </svg>
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                          Input
                                        </h4>
                                      </div>
                                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                                        <pre className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto">
                                          {
                                            interactions[activeInteractionIndex]
                                              .input
                                          }
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center mb-2">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 text-slate-500 dark:text-slate-400 mr-1.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                      </svg>
                                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Output
                                      </h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                                      <pre className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-60 overflow-y-auto">
                                        {
                                          interactions[activeInteractionIndex]
                                            .output
                                        }
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                                  <button
                                    onClick={() =>
                                      setActiveInteractionIndex(
                                        Math.max(0, activeInteractionIndex - 1)
                                      )
                                    }
                                    disabled={activeInteractionIndex === 0}
                                    className="px-3 py-1 text-xs font-medium rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3.5 w-3.5 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                    Previous
                                  </button>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {activeInteractionIndex + 1} of{" "}
                                    {interactions.length}
                                  </div>
                                  <button
                                    onClick={() =>
                                      setActiveInteractionIndex(
                                        Math.min(
                                          interactions.length - 1,
                                          activeInteractionIndex + 1
                                        )
                                      )
                                    }
                                    disabled={
                                      activeInteractionIndex ===
                                      interactions.length - 1
                                    }
                                    className="px-3 py-1 text-xs font-medium rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                  >
                                    Next
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3.5 w-3.5 ml-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
