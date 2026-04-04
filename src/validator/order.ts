import { z } from 'zod'

export const createOrderSchema = z.object({
    table_token: z.string().uuid(),
    items: z.array(
        z.object({
            menu_item_id: z.string().uuid(),
            quantity: z.number().int().min(1).positive(),
        })
    ).min(1)
})

