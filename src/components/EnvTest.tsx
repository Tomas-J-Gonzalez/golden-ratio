'use client'

import { useEffect, useState } from 'react'

export default function EnvTest() {
  const [envInfo, setEnvInfo] = useState<any>({})

  useEffect(() => {
    setEnvInfo({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      isDemoMode: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
    })
  }, [])

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Environment Variables Test:</h3>
      <pre className="text-sm">
        {JSON.stringify(envInfo, null, 2)}
      </pre>
    </div>
  )
}
