import React, { useEffect, useState } from 'react'
import TaskCard from '../components/TaskCard'
import AddTaskModal from '../components/AddTaskModal'

type APIIt = {
  id: number
  title: string
  project?: string
  priority?: string
  dueDate?: string
  completed?: boolean
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Home({ dark }: { dark?: boolean }){
  const [tasks, setTasks] = useState<APIIt[]>([])
  const [filter, setFilter] = useState<'All'|'To Do'|'In Progress'|'Done'>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<APIIt | null>(null)

  useEffect(()=>{ fetchTasks() }, [])

  async function fetchTasks(){
    try{
      const res = await fetch(`${API}/tasks`)
      const body = await res.json()
      const list = (body.data || []) as APIIt[]
      // normalize status from completed
      const mapped = list.map(t => ({ ...t, status: t.completed ? 'Done' : 'To Do' }))
      setTasks(mapped.slice(0, 20))
    }catch(_){
      // fallback sample
      setTasks([
        { id: 1, title: 'Design new landing page', completed: false, dueDate: 'Today' },
        { id: 2, title: 'Write product backlog', completed: false, dueDate: 'Tomorrow' },
        { id: 3, title: 'Reply to client email', completed: false, dueDate: 'May 24' },
        { id: 4, title: 'Prepare presentation', completed: false, dueDate: 'May 25' },
        { id: 5, title: 'Team stand-up meeting', completed: true, dueDate: 'May 23' },
      ])
    }
  }

  async function createTask(data: any){
    await fetch(`${API}/tasks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      title: data.title,
      project: data.project,
      priority: data.priority,
      dueDate: data.dueDate,
      completed: !!data.completed
    })})
    await fetchTasks()
  }

  async function updateTask(id:number, data:any){
    await fetch(`${API}/tasks/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      title: data.title,
      project: data.project,
      priority: data.priority,
      dueDate: data.dueDate,
      completed: !!data.completed
    })})
    setEditing(null)
    await fetchTasks()
  }

  async function deleteTask(id:number){
    if(!confirm('Delete this task?')) return
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
    await fetchTasks()
  }

  const visible = tasks.filter((t:any) => filter === 'All' ? true : (t.status || (t.completed ? 'Done' : 'To Do')) === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto pb-40">
      <header className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-sky-600">Task<span className="text-slate-700 dark:text-slate-100">Flow</span></div>
          </div>
          <h1 className="text-3xl font-semibold mt-3">Good morning, Alex! <span aria-hidden>🌞</span></h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Let's get things done today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-white shadow hover:opacity-90 dark:bg-slate-800">🔔</button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-full">
            {(['All','To Do','In Progress','Done'] as const).map(s => (
              <button key={s} onClick={()=>setFilter(s)} className={`px-4 py-1 rounded-full text-sm transition-colors duration-150 ${filter===s ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-3">
          {visible.map((t:any) => (
            <li key={t.id}><TaskCard task={{ id: t.id, title: t.title, status: t.status || (t.completed ? 'Done' : 'To Do'), dueDate: t.dueDate }} onEdit={(task)=>{ setEditing(task); setModalOpen(true) }} onDelete={(id)=>deleteTask(id)} /></li>
          ))}
        </ul>
      </div>

      <button aria-label="Add task" onClick={()=>{ setEditing(null); setModalOpen(true) }} className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-blue-600 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-3xl z-30">+</button>

      <AddTaskModal open={modalOpen} onClose={()=>setModalOpen(false)} initial={editing ? { id: editing.id, title: editing.title, project: (editing as any).project, priority: (editing as any).priority, dueDate: editing.dueDate, completed: (editing as any).completed } : undefined} onSubmit={async (data)=>{
        if(data.id) await updateTask(data.id, data)
        else await createTask(data)
      }} />
    </div>
  )
}
