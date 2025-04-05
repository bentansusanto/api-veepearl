import { z, ZodType } from "zod";

export class ProductValidation {
    static readonly CREATEPRODUCT:ZodType = z.object({
        name_product: z.string(),
        price: z.number(),
        jeweltypeId: z.string(),
        description: z.string(),
        grade: z.string(),
        size: z.string().optional(),
        stock_ready: z.boolean().optional(),
        thumbnail: z.string(),
        images: z.array(z.string()),
        video: z.array(z.string()).optional(),
        popular: z.boolean().optional(),
        sku: z.string(),
    })

    static readonly UPDATEPRODUCT:ZodType = z.object({
        name_product: z.string().optional(),
        price: z.number().optional(),
        jeweltypeId: z.string().optional(),
        description: z.string().optional(),
        grade: z.string().optional(),
        size: z.string().optional(),
        stock_ready: z.boolean().optional(),
        thumbnail: z.string().optional(),
        images: z.array(z.string()).optional(),
        video: z.array(z.string()).optional(),
        popular: z.boolean().optional(),
        sku: z.string().optional(),
    })
}
