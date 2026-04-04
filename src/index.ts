import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import menu from './routes/menu.js'
import tables from './routes/tables.js'
import orders from './routes/orders.js'

const app = new Hono()

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
