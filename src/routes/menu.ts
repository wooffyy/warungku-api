import { Hono } from 'hono'
import { supabase } from '../db.js'

const app = new Hono()

app.get('/', async (c) => {
    const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', process.env.TENANT_ID)
    .eq('is_available', true)
    .is('deleted_at', null)

    if (error) {
      return c.json({ error: error.message }, 500)
    }

    if (data.length === 0) {
      return c.json({ error: 'Not found' }, 404)
    }
    return c.json({ data })
})

app.get('/:id', async (c) => {
    const id = c.req.param('id')

    const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', process.env.TENANT_ID)
    .eq('id', id)
    .is('deleted_at', null)

    if (error) {
      return c.json({ error: error.message }, 500)
    }
    
    if (data.length === 0) {
      return c.json({ error: 'Not found' }, 404)
    }
    return c.json({ data })
})

export default app