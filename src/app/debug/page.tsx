'use client'

import { useState, useEffect, useCallback } from 'react'
import TopNavigation from '@/components/TopNavigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [debugInfo, setDebugInfo] = useState<{
    screen?: { width: number; height: number; availWidth: number; availHeight: number }
    window?: { innerWidth: number; innerHeight: number }
    localStorage?: string[]
    timestamp?: string
  }>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const testSupabaseConnection = useCallback(async () => {
    addLog('Testing Supabase connection...')
    try {
      const { error } = await supabase
        .from('sessions')
        .select('count')
        .limit(1)
      
      if (error) {
        addLog(`Supabase error: ${error.message}`)
        setConnectionStatus('error')
      } else {
        addLog('Supabase connection successful')
        setConnectionStatus('connected')
      }
    } catch (err) {
      addLog(`Connection failed: ${err}`)
      setConnectionStatus('error')
    }
  }, [])

  const testSessionCreation = async () => {
    addLog('Testing session creation...')
    try {
      const testCode = `TEST${Date.now().toString().slice(-6)}`
      const { error } = await supabase
        .from('sessions')
        .insert({
          code: testCode,
          created_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single()

      if (error) {
        addLog(`Session creation failed: ${error.message}`)
      } else {
        addLog(`Session created successfully: ${testCode}`)
        
        // Clean up test session
        await supabase
          .from('sessions')
          .delete()
          .eq('code', testCode)
        addLog('Test session cleaned up')
      }
    } catch (err) {
      addLog(`Session creation error: ${err}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getSystemInfo = useCallback(() => {
    const info = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      }
    }
    setDebugInfo(info)
    addLog('System info collected')
  }, [])

  useEffect(() => {
    testSupabaseConnection()
    getSystemInfo()
    addLog('Debug page initialized')
  }, [testSupabaseConnection, getSystemInfo])

  return (
    <>
      <TopNavigation />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="text-4xl mb-4">🔧</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Debug Console</h1>
            <p className="text-lg text-slate-600">
              Test and debug the application
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Connection Status */}
            <Card className="bg-white rounded-lg shadow-sm border border-slate-200">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm text-slate-600 capitalize">{connectionStatus}</span>
                </div>
                <Button 
                  onClick={testSupabaseConnection}
                  className="w-full text-sm"
                  variant="outline"
                >
                  Test Connection
                </Button>
                <Button 
                  onClick={testSessionCreation}
                  className="w-full text-sm"
                  variant="outline"
                >
                  Test Session Creation
                </Button>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-white rounded-lg shadow-sm border border-slate-200">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button 
                  onClick={getSystemInfo}
                  className="w-full text-sm mb-3"
                  variant="outline"
                >
                  Refresh System Info
                </Button>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Screen: {debugInfo.screen?.width}x{debugInfo.screen?.height}</div>
                  <div>Window: {debugInfo.window?.innerWidth}x{debugInfo.window?.innerHeight}</div>
                  <div>Storage: {debugInfo.localStorage?.length} items</div>
                  <div>Timestamp: {debugInfo.timestamp}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Debug Logs */}
          <Card className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Debug Logs
                </CardTitle>
                <Button 
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                >
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-sm">No logs yet...</div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-xs text-slate-600 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables (Safe) */}
          <Card className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Environment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Supabase URL:</span>
                  <span className="text-slate-900">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Supabase Anon Key:</span>
                  <span className="text-slate-900">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Environment:</span>
                  <span className="text-slate-900">{process.env.NODE_ENV}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
