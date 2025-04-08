"use client";

import { useState, useCallback } from "react";
import { ApiResponse, StatusUpdate } from "@/types";

import { SimulatedProgress } from "./components/SimulatedProgress";

export default function Home() {
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [duration, setDuration] = useState<"short" | "long">("short");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [showInteractions, setShowInteractions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusUpdate[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setShowInteractions(false);
    setIsCopied(false);
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

  const toggleInteractionsView = () => {
    setShowInteractions((prev) => !prev);
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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center p-6">
      {/* Render the Simulated Progress Overlay */}
      <SimulatedProgress isLoading={isLoading} />

      {/* Main card container */}
      <div
        className={`w-full ${
          showInteractions ? "max-w-7xl" : "max-w-4xl"
        } bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ease-in-out mb-10 ${
          isLoading ? "blur-sm pointer-events-none" : ""
        }`}
      >
        {/* Form Section */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 border-b border-slate-200"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-6 text-center">
            ScriptFlow
          </h1>
          {/* Input fields */}
          <div className="space-y-5">
            {/* Title Input */}
            <div>
              <label
                htmlFor="videoTitle"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Video Title
              </label>
              <input
                type="text"
                id="videoTitle"
                placeholder="Enter the main topic or title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {/* Optional Data Textarea */}
            <div>
              <label
                htmlFor="optionalData"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Optional Data
              </label>
              <textarea
                id="optionalData"
                placeholder="Keywords, target audience, specific points to include..."
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[100px]"
              />
            </div>
            {/* Duration Select */}
            <div>
              <label
                htmlFor="scriptDuration"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Desired Script Length
              </label>
              <select
                id="scriptDuration"
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value as "short" | "long")
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="short">Short (e.g., TikTok, Short)</option>
                <option value="long">Long (e.g., YouTube)</option>
              </select>
            </div>
          </div>
          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
                <span>Generating...</span> {/* Button text is simple now */}
              </>
            ) : (
              "Generate Script"
            )}
          </button>
        </form>

        {/* Results Area */}
        {!isLoading && result && (
          <div className="p-8 bg-slate-50 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Results</h2>
              {result.success &&
                result.interactions &&
                result.interactions.length > 0 && (
                  <button
                    onClick={toggleInteractionsView}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-200 text-sm font-medium flex items-center space-x-1.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{showInteractions ? "Hide" : "Show"} Details</span>
                  </button>
                )}
            </div>
            {/* Status Log */}
            {!isLoading && statusMessages.length > 0 && !showInteractions && (
              <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                <h4 className="text-md font-semibold text-slate-600 mb-2">
                  Generation Log:
                </h4>
                <div className="space-y-1 text-xs text-slate-500">
                  {statusMessages.map((status, index) => (
                    <p key={index}>
                      <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                        [
                        {new Date(status.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                        ]
                      </span>
                      {status.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {/* Split View */}
            <div
              className={` ${
                showInteractions ? "flex flex-col md:flex-row gap-8" : ""
              }`}
            >
              {/* Script Column */}
              {result.success && result.script && (
                <div
                  className={`${
                    showInteractions ? "md:w-1/2" : "w-full"
                  } w-full space-y-4`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-slate-700">
                      Generated Script
                    </h3>
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1.5 ${
                        isCopied
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                      disabled={isCopied}
                    >
                      {isCopied ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-100 border border-slate-200 rounded-lg p-6 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed min-h-[300px] font-mono text-slate-800">
                    {result.script}
                  </pre>
                </div>
              )}
              {/* Interactions Column */}
              {showInteractions &&
                result.success &&
                result.interactions &&
                result.interactions.length > 0 && (
                  <div className="w-full md:w-1/2 space-y-4">
                    <h3 className="text-xl font-semibold text-slate-700">
                      Agent Interactions & Log
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto border border-slate-200 rounded-lg p-4 bg-white">
                      {/* Status Log */}
                      <div className="mb-4 p-3 border border-slate-100 rounded-md bg-slate-50">
                        <h4 className="text-sm font-semibold text-slate-600 mb-1.5">
                          Generation Log:
                        </h4>
                        <div className="space-y-1 text-xs text-slate-500">
                          {statusMessages.map((status, index) => (
                            <p key={`status-${index}`}>
                              <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                                [
                                {new Date(status.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )}
                                ]
                              </span>
                              {status.message}
                            </p>
                          ))}
                        </div>
                      </div>
                      {/* Interactions */}
                      <h4 className="text-sm font-semibold text-slate-600 mb-1.5 pt-2 border-t border-slate-200">
                        Agent Details:
                      </h4>
                      {result.interactions.map((interaction, index) => (
                        <div
                          key={`interaction-${index}`}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm text-xs"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-indigo-700 text-sm">
                              {interaction.agent} - {interaction.action}
                            </div>
                            <div className="text-slate-500">
                              {new Date(
                                interaction.timestamp
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          {interaction.input && (
                            <div className="mb-2">
                              <div className="text-slate-600 mb-1 font-medium">
                                Input:
                              </div>
                              <pre className="bg-white p-2 rounded text-slate-700 whitespace-pre-wrap break-words border border-slate-200 text-[11px] leading-snug font-mono max-h-28 overflow-y-auto">
                                {interaction.input}
                              </pre>
                            </div>
                          )}
                          <div>
                            <div className="text-slate-600 mb-1 font-medium">
                              Output:
                            </div>
                            <pre className="bg-white p-2 rounded text-slate-700 whitespace-pre-wrap break-words border border-slate-200 text-[11px] leading-snug font-mono max-h-40 overflow-y-auto">
                              {interaction.output}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            {/* Error Message */}
            {!result.success && result.error && (
              <div className="mt-6 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg p-4">
                <strong>Error:</strong> {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
