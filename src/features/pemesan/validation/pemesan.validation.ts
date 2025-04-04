import { z, ZodType } from "zod";

export class PemesanValidation {
    // create validation
    static readonly CREATEPEMESAN:ZodType = z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        address: z.string(),
        city: z.string(),
        country: z.string(),
        zip_code: z.string(),
    })
    
    // update validation
    static readonly UPDATEPEMESAN:ZodType = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        zip_code: z.string().optional()
    })
}
