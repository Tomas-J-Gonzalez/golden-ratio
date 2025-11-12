import TopNavigation from '@/components/TopNavigation'

export default function ColophonPage() {
  return (
    <>
      <TopNavigation />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="text-4xl mb-4">🌀</div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Colophon</h1>
            <p className="text-lg text-slate-600">
              How this site was built and why it exists
            </p>
          </div>

          <div className="space-y-8">
            {/* Purpose */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Purpose</h2>
              <p className="text-slate-600 leading-relaxed">
                This is a collaborative design estimation tool for UX/UI teams. It allows teams to create 
                estimation sessions where participants can vote on the complexity and effort required for 
                design tasks. The tool helps teams plan better, estimate more accurately, and align on 
                expectations for design work.
              </p>
            </section>

            {/* Tech Stack */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Tech Stack</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Frontend</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• Next.js 15.5.3 (React Framework)</li>
                    <li>• TypeScript (Type Safety)</li>
                    <li>• Tailwind CSS (Styling)</li>
                    <li>• Radix UI (Components)</li>
                    <li>• Lucide React (Icons)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Backend & Database</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• Supabase (Database & Auth)</li>
                    <li>• PostgreSQL (Database)</li>
                    <li>• Real-time subscriptions</li>
                    <li>• Row Level Security</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Deployment</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• Netlify (Hosting)</li>
                    <li>• Git-based deployments</li>
                    <li>• Environment variables</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Development</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• ESLint (Code Quality)</li>
                    <li>• PostCSS (CSS Processing)</li>
                    <li>• Class Variance Authority</li>
                    <li>• Tailwind Merge</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Design Philosophy */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Design Philosophy</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  The design follows a minimalist approach inspired by modern web applications. 
                  The interface prioritizes clarity and ease of use, with clean typography, 
                  generous white space, and subtle visual hierarchy.
                </p>
                <p>
                  The color scheme uses a neutral slate palette with blue and green accents 
                  to create a professional and approachable feel. The glassmorphism navigation 
                  bar provides a modern touch while maintaining usability.
                </p>
                <p>
                  The tool is designed to be fast, responsive, and accessible, ensuring 
                  that teams can focus on estimation rather than fighting with the interface.
                </p>
              </div>
            </section>

            {/* Features */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Key Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Session Management</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• Create estimation sessions with unique codes</li>
                    <li>• Join sessions with 6-character codes</li>
                    <li>• Real-time participant management</li>
                    <li>• Session persistence and recovery</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Voting & Estimation</h3>
                  <ul className="space-y-1 text-slate-600 text-sm">
                    <li>• Anonymous voting system</li>
                    <li>• Fibonacci sequence estimation points</li>
                    <li>• Real-time vote reveals</li>
                    <li>• Task history and tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Security & Privacy */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Security & Privacy</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Your data security and privacy are priorities. This application is designed 
                  with security best practices and minimal data collection.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">What We Collect</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Nicknames (display names only)</li>
                      <li>• Task estimates and voting data</li>
                      <li>• Avatar emojis (optional)</li>
                      <li>• Session timestamps</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">What We Don&apos;t Collect</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Email addresses</li>
                      <li>• Passwords or credentials</li>
                      <li>• IP addresses or location</li>
                      <li>• Personal identifiable information</li>
                      <li>• Analytics or tracking data</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                  <h3 className="font-medium text-blue-900 mb-2">Security Features</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>✓ All data transmitted over HTTPS encryption</li>
                    <li>✓ Row Level Security on all database tables</li>
                    <li>✓ Session isolation (no cross-session data access)</li>
                    <li>✓ Random session codes (2.1 billion combinations)</li>
                    <li>✓ Automatic data cleanup when sessions end</li>
                    <li>✓ No third-party tracking or analytics</li>
                  </ul>
                </div>

                <p className="text-sm">
                  Sessions are temporary and designed for team collaboration. All data is stored 
                  securely in a PostgreSQL database with Row Level Security policies. When you leave 
                  a session, your participation data can be removed. Session creators can end sessions 
                  to clean up all associated data.
                </p>
              </div>
            </section>

            {/* Open Source */}
            <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Open Source</h2>
              <p className="text-slate-600">
                This project is open source and available on GitHub. Contributions, 
                bug reports, and feature requests are welcome. The codebase follows 
                modern React and TypeScript best practices.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
