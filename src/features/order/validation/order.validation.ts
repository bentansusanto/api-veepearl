import { z, ZodType } from "zod";

export class OrderValidation {
    // create order validation
    static readonly CREATEORDER:ZodType = z.object({
        payment_method: z.any(),
        shipping_method: z.any().optional()
    })
}


