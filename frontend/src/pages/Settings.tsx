import React from 'react'

export default function Settings({ dark, onToggleDark }: { dark?: boolean, onToggleDark?: ()=>void }){
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold">A</div>
          <div className="flex-1">
            <div className="font-medium">Alex Carter</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">alex.carter@email.com</div>
          </div>
          <button className="text-sm text-gray-500">›</button>
        </div>

        <div className="divide-y">
          <div className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Use system theme or toggle</div>
            </div>
            <div>
              <label className="switch">
                <input type="checkbox" checked={!!dark} onChange={() => onToggleDark && onToggleDark()} />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">🔔</div>
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Customize push and email</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">›</div>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">📂</div>
              <div>
                <div className="font-medium">Categories</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manage task categories</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">›</div>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">☁️</div>
              <div>
                <div className="font-medium">Backup</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Export or restore data</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">›</div>
          </div>

          <div className="py-3">
            <button className="w-full text-left text-red-600">Log Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}
