const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const promClient = require('prom-client')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const collectDefaultMetrics = promClient.collectDefaultMetrics
collectDefaultMetrics()

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
})

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const path = req.route ? req.route.path : req.path
    httpRequestsTotal.inc({ method: req.method, path, status: res.statusCode })
    httpRequestDuration.observe({ method: req.method, path, status: res.statusCode }, duration)
  })
  next()
})

const PORT = process.env.PORT || 3000
const DATA_PATH = path.join(__dirname, '..', 'data', 'tasks.json')

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch (err) {
    return []
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(tasks, null, 2), 'utf8')
}

let tasks = readTasks()
let nextId = tasks.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1

app.get('/tasks', (req, res) => {
  res.json({ data: tasks })
})

app.post('/tasks', (req, res) => {
  const { title, project = '', priority = 'Low', dueDate = '', completed = false } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const task = { id: nextId++, title, project, priority, dueDate, completed }
  tasks.push(task)
  writeTasks(tasks)
  res.status(201).json({ data: task })
})

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  const updates = req.body
  tasks[idx] = { ...tasks[idx], ...updates }
  writeTasks(tasks)
  res.json({ data: tasks[idx] })
})

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  const removed = tasks.splice(idx, 1)[0]
  writeTasks(tasks)
  res.json({ data: removed })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType)
    res.end(await promClient.register.metrics())
  } catch (err) {
    res.status(500).end(err)
  }
})

app.listen(PORT, () => console.log(`TaskFlow backend listening on ${PORT}`))
