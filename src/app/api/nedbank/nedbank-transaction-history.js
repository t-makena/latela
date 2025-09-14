// components/NedbankTransactionHistory.js
import React, { useState, useEffect } from 'react';
import nedbankService from '../services/nedbankService';

const NedbankTransactionHistory = ({ accountId, heavyToken }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    toDate: new Date().toISOString().split('T')[0] // today
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await nedbankService.getTransactions(
        heavyToken, 
        accountId, 
        dateRange.fromDate, 
        dateRange.toDate
      );
      
      setTransactions(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && heavyToken) {
      fetchTransactions();
    }
  }, [accountId, heavyToken, dateRange]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatAmount = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionType = (amount) => {
    return parseFloat(amount) >= 0 ? 'credit' : 'debit';
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="transaction-history">
      <h2>Nedbank Transaction History</h2>
      
      <div className="date-filters">
        <label>
          From:
          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
          />
        </label>
        <button onClick={fetchTransactions}>Refresh</button>
      </div>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <p>No transactions found for the selected date range.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={transaction.transactionId || index}>
                  <td>{formatDate(transaction.transactionDateTime)}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.reference}</td>
                  <td className={`amount ${getTransactionType(transaction.amount)}`}>
                    {formatAmount(transaction.amount, transaction.currency)}
                  </td>
                  <td>{formatAmount(transaction.balance, transaction.currency)}</td>
                  <td className={`type ${getTransactionType(transaction.amount)}`}>
                    {getTransactionType(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NedbankTransactionHistory;