// Simple ABSA API client using pre-generated token

export async function makeAbsaApiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${process.env.ABSA_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${process.env.ABSA_API_TOKEN}`,
        'X-Consumer-Key': process.env.ABSA_API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`ABSA API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('ABSA API Error:', error)
    throw error
  }
}

// Example function to request transaction history
export async function requestTransactionHistory(accountNumber, dateFrom, dateTo) {
  try {
    const response = await makeAbsaApiRequest('', {
      method: 'POST',
      body: JSON.stringify({
        accountNumber,
        dateFrom,
        dateTo,
        callbackUrl: process.env.ABSA_CALLBACK_URL
      })
    })

    return response
  } catch (error) {
    console.error('Error requesting transaction history:', error)
    throw error
  }
}