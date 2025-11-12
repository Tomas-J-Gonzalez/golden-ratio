'use client'

export default function DemoModeBanner() {
  const isDemoMode = typeof window !== 'undefined' && 
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))
  
  if (!isDemoMode) return null

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-center">
      <p className="text-sm text-yellow-800">
        <strong>Demo Mode:</strong> Running locally without Supabase. All data is stored in your browser and will be lost when you clear your cache.
      </p>
    </div>
  )
}

