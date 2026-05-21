import React from 'react'

type Task = {
  id: number
  title: string
  status?: string
  dueDate?: string
}

export default function TaskCard({ task, onEdit, onDelete }: { task: Task, onEdit?: (t: any)=>void, onDelete?: (id:number)=>void }){
  const statusColor = task.status === 'Done' ? 'text-green-500' : task.status === 'In Progress' ? 'text-blue-500' : 'text-gray-500'

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-lg">📄</div>
        <div>
          <div className="font-medium text-sm md:text-base">{task.title}</div>
          <div className={`text-xs mt-1 ${statusColor}`}>{task.status}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end mr-2">
          <div className="text-sm text-sky-600 dark:text-sky-400 font-medium">{task.dueDate || '-'}</div>
          <div className="text-xs text-gray-400">{task.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>onEdit && onEdit(task)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">✏️</button>
          <button onClick={()=>onDelete && onDelete(task.id)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">🗑️</button>
        </div>
      </div>
    </div>
  )
}
