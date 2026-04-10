import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { rateLimiter } from 'hono-rate-limiter'
import { logger } from 'hono/logger'
import menu from './routes/menu.js'
import tables from './routes/tables.js'
import orders from './routes/orders.js'

const app = new Hono()

const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('remote-addr') || 'anonymous'
})

app.use(limiter)
app.use(logger())
app.use('*', cors())
app.route('/menu', menu)
app.route('/tables', tables)
app.route('/orders', orders)

serve({
  fetch: app.fetch,
  port: 5713
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
