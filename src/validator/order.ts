import { z } from 'zod'

export const createOrderSchema = z.object({
    table_token: z.uuid(),
    items: z.array(
        z.object({
            menu_item_id: z.uuid(),
            quantity: z.number().int().min(1).positive(),
        })
    ).min(1)
})

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PAID', 'DONE'])
})