import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './src/routes/auth.js'
import productRoutes from './src/routes/products.js'
import orderRoutes from './src/routes/orders.js'
import dashboardRoutes from './src/routes/dashboard.js'
import { errorHandler, notFound } from './src/middleware/errors.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPaths = [
  path.join(process.cwd(), 'Backend', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
]
for (const p of envPaths) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break }
}
if (!process.env.MONGODB_URI) dotenv.config()

const required = ['MONGODB_URI', 'JWT_SECRET']
const missing = required.filter((key) => !process.env[key])
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)

const app = express()
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim())
const isLocalVite = (origin) => /^http:\/\/localhost:517\d$/.test(origin)
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (curl, Postman, server-to-server) are safe to allow.
    if (!origin || configuredOrigins.includes(origin) || isLocalVite(origin)) return callback(null, true)
    return callback(new Error(`Origin not allowed by CORS: ${origin}`))
  },
}))
app.use(express.json())
app.use((req, res, next) => { console.log(`${req.method} ${req.path}`); next() })

app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use(notFound)
app.use(errorHandler)

const port = Number(process.env.PORT || 5000)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`StockWise API listening on http://localhost:${port}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1) })
