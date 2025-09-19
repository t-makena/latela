'use client';

import { useState } from 'react';

interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning: string;
  suggestedBudgetType: string;
}

export default function TransactionCategorizer() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [result, setResult] = useState<CategorizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample South African transactions for testing
  const sampleTransactions = [
    { description: 'WOOLWORTHS FOOD CLAREMONT', amount: '287.50', merchant: 'Woolworths' },
    { description: 'SHELL PETROL STATION', amount: '850.00', merchant: 'Shell' },
    { description: 'FNB ATM WITHDRAWAL', amount: '500.00', merchant: 'FNB' },
    { description: 'UBER TRIP 12345', amount: '45.80', merchant: 'Uber' },
    { description: 'CHECKERS HYPER PAYMENT', amount: '156.90', merchant: 'Checkers' },
    { description: 'ESKOM ELECTRICITY PAYMENT', amount: '1250.00', merchant: 'Eskom' },
    { description: 'CLICKS PHARMACY', amount: '89.50', merchant: 'Clicks' },
  ];

  const handleCategorize = async () => {
    if (!description.trim() || !amount.trim()) {
      setError('Please enter both description and amount');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          merchant: merchant.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Categorization failed');
      }

      setResult(data.categorization);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: typeof sampleTransactions[0]) => {
    setDescription(sample.description);
    setAmount(sample.amount);
    setMerchant(sample.merchant);
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-green-600 mb-6">
        🤖 Claude Haiku Transaction Categorizer
      </h2>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Description *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. WOOLWORTHS FOOD CLAREMONT"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (ZAR) *
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="287.50"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant (Optional)
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Woolworths"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleCategorize}
          disabled={loading || !description.trim() || !amount.trim()}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Categorizing with Claude...' : 'Categorize Transaction'}
        </button>
      </div>

      {/* Sample Transactions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🇿🇦 Try Sample SA Transactions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sampleTransactions.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSample(sample)}
              className="text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
            >
              <div className="font-medium">{sample.description}</div>
              <div className="text-green-600">R {sample.amount}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold text-lg mb-3">Categorization Result:</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Category:</span>
              <span className="text-green-600 font-semibold">{result.category}</span>
            </div>
            
            {result.subcategory && (
              <div className="flex justify-between">
                <span className="font-medium">Subcategory:</span>
                <span>{result.subcategory}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="font-medium">Confidence:</span>
              <span className={`font-semibold ${result.confidence > 0.8 ? 'text-green-600' : result.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Budget Type:</span>
              <span className="capitalize font-medium">{result.suggestedBudgetType}</span>
            </div>
            
            <div className="mt-3">
              <span className="font-medium">Reasoning:</span>
              <p className="text-gray-700 mt-1">{result.reasoning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}