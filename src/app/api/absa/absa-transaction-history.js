import { supabase } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Log the incoming request for debugging
    console.log('ABSA Callback received:', req.body)
    console.log('Headers:', req.headers)

    // Validate the request (add your own validation logic)
    if (!req.body) {
      return res.status(400).json({ error: 'No data received' })
    }

    // Verify the request is from ABSA using your API key
    const consumerKey = req.headers['x-consumer-key'] || req.body.consumerKey
    if (consumerKey && consumerKey !== process.env.ABSA_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized - Invalid consumer key' })
    }

    // Process the transaction history data
    const transactionData = req.body

    // Store in Supabase database
    const { data, error } = await supabase
      .from('transaction_history') // Replace with your table name
      .insert([
        {
          transaction_id: transactionData.transactionId,
          amount: transactionData.amount,
          date: transactionData.date,
          description: transactionData.description,
          account_number: transactionData.accountNumber,
          raw_data: transactionData, // Store the full response as JSON
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Database error' })
    }

    // Send success response back to ABSA
    res.status(200).json({ 
      success: true, 
      message: 'Transaction history received and stored',
      processed_records: data?.length || 0
    })

  } catch (error) {
    console.error('Callback error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Optional: Add configuration for larger payloads if needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}