import React from 'react'

export default function BottomNav({ page, onChange }: { page: string, onChange: (p: any)=>void }){
  return (
    <nav role="navigation" className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-800 text-slate-100 rounded-full shadow-2xl px-4 py-3 flex items-center justify-between z-20">
      <button onClick={()=>onChange('home')} className={`flex flex-col items-center text-sm gap-1 px-3 py-1 rounded-full ${page==='home' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300'}`}>
        <div className="text-xl">🏠</div>
        <div className="text-xs">Home</div>
      </button>
      <button onClick={()=>onChange('calendar')} className={`flex flex-col items-center text-sm gap-1 px-3 py-1 rounded-full ${page==='calendar' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300'}`}>
        <div className="text-xl">📅</div>
        <div className="text-xs">Calendar</div>
      </button>
      <button onClick={()=>onChange('profile')} className={`flex flex-col items-center text-sm gap-1 px-3 py-1 rounded-full ${page==='profile' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300'}`}>
        <div className="text-xl">👤</div>
        <div className="text-xs">Profile</div>
      </button>
    </nav>
  )
}
