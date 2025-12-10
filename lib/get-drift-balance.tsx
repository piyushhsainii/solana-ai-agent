import React from "react";
import ReactMarkdown from "react-markdown";

export const GetDriftBalance = ({ output }: { output: any }) => {
  return (
    <div className="text-sm text-gray-800">
      {/* Success - Has Account */}
      {output.success && output.driftData?.hasAccount && (
        <>
          <p className="font-semibold mb-3 text-lg flex items-center gap-2">
            🏦 Drift Protocol Balance
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Active
            </span>
          </p>

          {/* Account Summary */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">
              Account Value
            </p>
            <p className="font-bold text-3xl mb-4">
              ${output.driftData.accountValue.toFixed(2)}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/50 p-3 rounded">
                <p className="text-gray-600 text-xs mb-1">Total Collateral</p>
                <p className="font-semibold text-lg">
                  ${output.driftData.totalCollateral.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="text-gray-600 text-xs mb-1">Free Collateral</p>
                <p className="font-semibold text-lg">
                  ${output.driftData.freeCollateral.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="text-gray-600 text-xs mb-1">Leverage</p>
                <p className="font-semibold text-lg">
                  {output.driftData.leverage.toFixed(2)}x
                </p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="text-gray-600 text-xs mb-1">Unrealized PnL</p>
                <p
                  className={`font-semibold text-lg ${
                    output.driftData.unrealizedPnl >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {output.driftData.unrealizedPnl >= 0 ? "+" : ""}$
                  {output.driftData.unrealizedPnl.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Funding PnL */}
            {output.driftData.unrealizedFundingPnl !== 0 && (
              <div className="mt-3 pt-3 border-t border-white/50">
                <p className="text-xs text-gray-600">Funding PnL</p>
                <p
                  className={`font-semibold ${
                    output.driftData.unrealizedFundingPnl >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {output.driftData.unrealizedFundingPnl >= 0 ? "+" : ""}$
                  {output.driftData.unrealizedFundingPnl.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Spot Positions */}
          {output.driftData.spotPositions &&
            output.driftData.spotPositions.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  💰 Spot Positions
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {output.driftData.spotPositions.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {output.driftData.spotPositions.map((pos, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-base">
                            {pos.marketSymbol}
                          </p>
                          <p
                            className={`text-xs uppercase font-medium ${
                              pos.type === "deposit"
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {pos.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {pos.amount.toFixed(4)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${pos.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Perp Positions */}
          {output.driftData.perpPositions &&
            output.driftData.perpPositions.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  📈 Perpetual Positions
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {output.driftData.perpPositions.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {output.driftData.perpPositions.map((pos, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-base">
                            {pos.marketSymbol}
                          </p>
                          <p
                            className={`text-xs uppercase font-bold ${
                              pos.side === "long"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {pos.side} {pos.baseAmount.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            Entry: ${pos.entryPrice.toFixed(2)}
                          </p>
                          <p
                            className={`font-semibold text-lg ${
                              pos.unrealizedPnl >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {pos.unrealizedPnl >= 0 ? "+" : ""}$
                            {pos.unrealizedPnl.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Open Orders */}
          {output.driftData.openOrdersCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                📋{" "}
                <span className="font-semibold">
                  {output.driftData.openOrdersCount}
                </span>{" "}
                open order(s)
              </p>
            </div>
          )}

          {/* Account Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Account Details</p>
            <div className="space-y-1 text-xs">
              <p className="flex items-center gap-2">
                <span className="text-gray-600">Sub-Account:</span>
                <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                  {output.driftData.subAccountId}
                </code>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-600">Authority:</span>
                <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                  {output.driftData.authority.slice(0, 8)}
                  ...{output.driftData.authority.slice(-8)}
                </code>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Success - No Account */}
      {output.success && output.driftData?.hasAccount === false && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-semibold text-yellow-900 mb-1">
                No Drift Account Found
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                {output.driftData.message}
              </p>
              <a
                href="https://app.drift.trade"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Drift Account →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error States */}
      {!output.success && output.error && (
        <div
          className={`p-4 rounded-lg border ${
            output.errorType === "no_account"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {output.errorType === "no_account" ? "ℹ️" : "⚠️"}
            </span>
            <div className="flex-1">
              <p
                className={`font-semibold mb-1 ${
                  output.errorType === "no_account"
                    ? "text-yellow-900"
                    : "text-red-900"
                }`}
              >
                {output.errorType === "no_account"
                  ? "No Drift Account"
                  : output.errorType === "rate_limit"
                  ? "Rate Limit Reached"
                  : output.errorType === "network"
                  ? "Network Error"
                  : output.errorType === "timeout"
                  ? "Request Timeout"
                  : "Error"}
              </p>
              <p
                className={`text-sm ${
                  output.errorType === "no_account"
                    ? "text-yellow-800"
                    : "text-red-800"
                }`}
              >
                {output.error}
              </p>

              {/* Action buttons based on error type */}
              {output.errorType === "no_account" && (
                <a
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors mt-3"
                >
                  Create Account →
                </a>
              )}

              {(output.errorType === "rate_limit" ||
                output.errorType === "timeout" ||
                output.errorType === "network") && (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mt-3"
                >
                  🔄 Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render ANY markdown coming from the tool */}
      {output.markdown && (
        <div className="mt-4 prose prose-sm max-w-none">
          <ReactMarkdown>{output.markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
