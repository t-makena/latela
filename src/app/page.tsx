import TestSupabaseConnection from "@/components/TestSupabaseConnection";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Zaka Budgeting App</h1>
          <p className="text-gray-600">Testing Supabase Connection</p>
        </div>
        <TestSupabaseConnection />
      </div>
    </main>
  )
}

// Look for code like this that might be causing issues:
// new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) // If undefined, this fails

// Make sure you have fallbacks:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';