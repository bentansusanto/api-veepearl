import { z, ZodType } from "zod";

export class JewelTypeValidation {
    static readonly CREATEJEWELTYPE:ZodType = z.object({
        name_type: z.string(),
        type: z.string(),
    })

    static readonly UPDATEJEWELTYPE:ZodType = z.object({
        name_type: z.string().optional(),
        type: z.string().optional(),
    })
}
