import { z, ZodType } from "zod";

export class CartValidation {
    static readonly CREATECART: ZodType = z.object({
        productId: z.string(),
        quantity: z.number(),
    })

    static readonly UPDATECART: ZodType = z.object({
        quantity: z.number().optional(),
    })
}
