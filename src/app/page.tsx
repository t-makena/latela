import TestSupabaseConnection from '../components/TestSupabaseConnection'

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-600 mb-6">
          🇿🇦 Welcome to Latela
        </h1>
        
        <p className="text-lg text-gray-700 mb-8">
          Your South African budgeting companion with ZAR support and AI-powered transaction categorization.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🏦 Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• ZAR currency formatting (R 1,234.56)</li>
              <li>• AI transaction categorization</li>
              <li>• South African bank integration</li>
              <li>• Real-time budget tracking</li>
              <li>• Tax year considerations</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🛠️ Tech Stack</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Next.js & React</li>
              <li>• Supabase (PostgreSQL)</li>
              <li>• Claude Haiku API</li>
              <li>• Vercel deployment</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>
        </div>

        <TestSupabaseConnection />

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">🚧 Development Status</h3>
          <p className="text-yellow-700 mt-1">
            Latela is currently in development. Environment variables and database setup are required for full functionality.
          </p>
        </div>
      </div>
    </div>
  )
}

// In your component
const fetchTransactions = async () => {
  try {
    const response = await fetch('/api/absa/transactions');
    const data = await response.json();
    console.log('Transactions:', data);
    // Process your ZAR transactions here
  } catch (error) {
    console.error('Error:', error);
  }
};