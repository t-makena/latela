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