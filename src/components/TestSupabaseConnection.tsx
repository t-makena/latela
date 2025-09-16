'use client';

import { useEffect, useState } from 'react';

interface ConnectionStatus {
  supabase: string;
  claude: string;
  environment: string;
}

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState<ConnectionStatus>({
    supabase: 'Testing...',
    claude: 'Testing...',
    environment: 'Loading...'
  });

  useEffect(() => {
    // Test environment variables
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasClaude = !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    setStatus({
      supabase: hasSupabase ? 'Configured ✅' : 'Not configured ❌',
      claude: hasClaude ? 'Configured ✅' : 'Not configured ❌',
      environment: process.env.NODE_ENV || 'development'
    });
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold text-lg mb-2">🔧 Latela Connection Status</h3>
      <div className="space-y-2">
        <p><strong>Environment:</strong> {status.environment}</p>
        <p><strong>Supabase:</strong> {status.supabase}</p>
        <p><strong>Claude API:</strong> {status.claude}</p>
      </div>
    </div>
  );
}