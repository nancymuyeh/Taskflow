const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 3000

// in-memory task store for scaffold
let tasks = []
let nextId = 1

app.get('/tasks', (req, res) => {
  res.json({ data: tasks })
})

app.post('/tasks', (req, res) => {
  const { title, completed = false } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const task = { id: nextId++, title, completed }
  tasks.push(task)
  res.status(201).json({ data: task })
})

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  const { title, completed } = req.body
  const updated = { ...tasks[idx], ...(title !== undefined ? { title } : {}), ...(completed !== undefined ? { completed } : {}) }
  tasks[idx] = updated
  res.json({ data: updated })
})

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  const removed = tasks.splice(idx,1)[0]
  res.json({ data: removed })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`TaskFlow backend listening on ${PORT}`))
