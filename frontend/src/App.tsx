import React, { useState } from 'react'
import Home from './pages/Home'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'

export default function App(){
  const [page, setPage] = useState<'home'|'calendar'|'profile'>('home')
  const [dark, setDark] = useState(false)

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className={`min-h-screen ${dark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
        {page === 'home' && <Home dark={dark} />}
        {page === 'profile' && <Settings dark={dark} onToggleDark={() => setDark(d => !d)} />}
        {page === 'calendar' && (
          <div className="p-8 max-w-4xl mx-auto"> 
            <h2 className="text-2xl font-semibold mb-4">Calendar (placeholder)</h2>
            <p className="text-sm text-gray-500">Calendar view coming soon.</p>
          </div>
        )}

        <BottomNav page={page} onChange={setPage} />
      </div>
    </div>
  )
}
