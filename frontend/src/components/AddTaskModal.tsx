import React, { useEffect, useState } from 'react'

type TaskForm = {
  id?: number
  title: string
  project?: string
  priority?: string
  dueDate?: string
  completed?: boolean
}

export default function AddTaskModal({ open, onClose, onSubmit, initial }: { open: boolean, onClose: ()=>void, onSubmit: (data: TaskForm)=>Promise<void> | void, initial?: TaskForm }){
  const [form, setForm] = useState<TaskForm>({ title: '', project: '', priority: 'Low', dueDate: '', completed: false })

  useEffect(()=>{ if(initial) setForm({...initial}) }, [initial])

  useEffect(()=>{ if(!open) setForm({ title: '', project: '', priority: 'Low', dueDate: '', completed: false }) }, [open])

  if(!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <form onSubmit={async (e)=>{ e.preventDefault(); await onSubmit(form); onClose() }} className="relative bg-white dark:bg-slate-800 rounded-t-xl sm:rounded-xl p-6 w-full max-w-md shadow-2xl z-50">
        <h3 className="text-lg font-medium mb-4">{form.id ? 'Edit Task' : 'Add Task'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Title</label>
            <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="mt-1 w-full rounded-md p-2 border" />
          </div>
          <div>
            <label className="block text-sm">Project</label>
            <input value={form.project} onChange={e=>setForm({...form, project: e.target.value})} className="mt-1 w-full rounded-md p-2 border" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm">Priority</label>
              <select value={form.priority} onChange={e=>setForm({...form, priority: e.target.value})} className="mt-1 w-full rounded-md p-2 border">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm">Due date</label>
              <input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate: e.target.value})} className="mt-1 w-full rounded-md p-2 border" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="completed" type="checkbox" checked={!!form.completed} onChange={e=>setForm({...form, completed: e.target.checked})} />
            <label htmlFor="completed" className="text-sm">Mark as completed</label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white">Save</button>
          </div>
        </div>
      </form>
    </div>
  )
}
