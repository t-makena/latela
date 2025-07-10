// This part goes in your Lovable React components
const handleSyncTransactions = async () => {
  try {
    const response = await fetch('https://your-backend-url.com/api/sync-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        accountNumber: '4048970487',
        fromDate: '2024-01-01',
        toDate: '2024-12-31'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Transaction sync requested! Check your phone for SureCheck approval.');
    }
  } catch (error) {
    alert('Failed to sync transactions');
  }
};