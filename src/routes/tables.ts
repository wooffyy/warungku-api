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
    .eq('is_active', true)

    if (error) {
      return c.json({ error: error.message }, 500)
    }

    if (data.length === 0) {
      return c.json({ error: 'Not found' }, 404)
    }
    return c.json({ data })
})

export default app