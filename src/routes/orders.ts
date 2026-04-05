import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createOrderSchema, updateOrderStatusSchema } from '../validator/order.js'
import { supabase } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()

app.get('/', authMiddleware, async (c) => {

    const { data, error } = await supabase
        .from('orders')
        .select('*, tables(number)')
        .eq('tenant_id', process.env.TENANT_ID)
        .in('status', ['PENDING', 'PAID'])
        .order('created_at', { ascending: false })

    if (error) {
        return c.json({ error: error.message }, 500)
    }

    return c.json({ data })

})

app.post('/', zValidator('json', createOrderSchema), async (c) => {
    const body = c.req.valid('json')

    const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('*')
    .eq('token', body.table_token)
    .eq('tenant_id', process.env.TENANT_ID)
    .eq('is_active', true)

    if (tableError) {
    return c.json({ error: tableError.message }, 500)
    }

    if (table.length === 0) {
    return c.json({ error: 'Table not found' }, 404)
    }

    const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', table[0].id)
    .eq('tenant_id', process.env.TENANT_ID)
    .in('status', ['PENDING', 'PAID'])

    if (orderError) {
    return c.json({ error: orderError.message }, 500)
    }

    if (order.length > 0) {
    return c.json({ error: 'Table is already in use' }, 400)
    }
        
    const menuIds = body.items.map(item => item.menu_item_id)
    const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('id, price, name')
    .in('id', menuIds)
    .eq('is_available', true)
    .eq('tenant_id', process.env.TENANT_ID)
    .is('deleted_at', null)

    if (menuError || !menuItems) {
    return c.json({ error: 'Failed to fetch menu items' }, 500)
    }

    if (menuItems.length !== menuIds.length) {
    return c.json({ error: 'Some menu items are unavailable' }, 400)
    }

    const totalAmount = body.items.reduce((total, item) => {
    const menuItem = menuItems.find(m => m.id === item.menu_item_id)
    if (!menuItem) return total
    return total + (item.quantity * menuItem.price)
    }, 0)

    const { data: newOrderData, error } = await supabase
    .from('orders')
    .insert({
        tenant_id: process.env.TENANT_ID,
        table_id: table[0].id,
        total_amount: totalAmount,
        status: 'PENDING'
    })
    .select('id, token')

    if (error) {
    return c.json({ error: error.message }, 500)
    }

    if (!newOrderData || newOrderData.length === 0) {
    return c.json({ error: 'Failed to create order' }, 500)
    }

    const orderId = newOrderData[0].id

    const orderItems = body.items
    .map(item => {
        const menuItem = menuItems.find(m => m.id === item.menu_item_id)
        if (!menuItem) return null
        return {
            order_id: orderId,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            subtotal: item.quantity * menuItem.price,
            snapshot_name: menuItem.name,
            snapshot_price: menuItem.price
        }
    })
    .filter(Boolean)

    const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
        
    if (itemsError) {
    return c.json({ error: 'Failed to save order items' }, 500)
    }

    return c.json({ data: { token: newOrderData[0].token } })
})

app.get('/:token', async (c) => {
    const id = c.req.param('token')
    const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, menu_items(name))')
    .eq('token', id)
    .eq('tenant_id', process.env.TENANT_ID)
    .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return c.json({ error: 'Order not found' }, 404)
        }
        return c.json({ error: error.message }, 500)
    }

    return c.json({ data })

})

app.patch('/:token/status', authMiddleware,  zValidator('json', updateOrderStatusSchema),  async (c) => {
    const token = c.req.param('token')
    const { status } = c.req.valid('json')

    const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('token', token)
    .eq('tenant_id', process.env.TENANT_ID)
    .select()
    .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return c.json({ error: 'Order not found' }, 404)
        }
        return c.json({ error: error.message }, 500)
    }

    return c.json({ data })
})

export default app