import { Hono } from 'hono'
import { supabase } from '../db.js'

const app = new Hono()

app.get('/:token', async (c) => {
    const token = c.req.param('token')

    const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('token', token)
    .eq('tenant_id', process.env.TENANT_ID)

    if (error) {
      return c.json({ error: error.message }, 500)
    }
    return c.json({ data })
})

export default app