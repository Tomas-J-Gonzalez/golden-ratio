'use client'

import Link from 'next/link'

export default function TopNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center no-underline">
              <div className="text-2xl">🌀</div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              Estimate
            </Link>
            <Link 
              href="/colophon" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              Colophon
            </Link>
            {/* Debug page temporarily hidden */}
            {/* <Link 
              href="/debug" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              Debug
            </Link> */}
          </div>
        </div>
      </div>
    </nav>
  )
}
