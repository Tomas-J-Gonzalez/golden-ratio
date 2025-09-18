'use client'

import Link from 'next/link'

export default function TopNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🌀</div>
              <span className="text-lg font-semibold text-slate-900">Estim8r</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              About
            </Link>
            <Link 
              href="/help" 
              className="text-slate-700 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              Help
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
