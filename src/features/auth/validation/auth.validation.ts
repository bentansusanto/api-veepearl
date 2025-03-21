import { z, ZodType } from "zod";

export class AuthValidation{
     // validation create auth
  static readonly CREATEAUTH: ZodType = z.object({
    name: z.string(),
    email: z.string().email('must be @'),
    password: z
      .string()
      .min(8, { message: 'minLengthErrorMessage ' })
      .max(20, { message: 'maxLengthErrorMessage' })
      .refine((password) => /[A-Z]/.test(password), {
        message: 'uppercaseErrorMessage',
      })
      .refine((password) => /[a-z]/.test(password), {
        message: 'lowercaseErrorMessage',
      })
      .refine((password) => /[0-9]/.test(password), {
        message: 'numberErrorMessage',
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message: 'specialCharacterErrorMessage',
      }),
    role: z.string().optional(),
  });

  // validation login
  static readonly LOGIN: ZodType = z.object({
    email: z.string().email('must be @'),
    password: z
      .string()
      .min(8, { message: 'minLengthErrorMessage ' })
      .max(20, { message: 'maxLengthErrorMessage' })
      .refine((password) => /[A-Z]/.test(password), {
        message: 'uppercaseErrorMessage',
      })
      .refine((password) => /[a-z]/.test(password), {
        message: 'lowercaseErrorMessage',
      })
      .refine((password) => /[0-9]/.test(password), {
        message: 'numberErrorMessage',
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message: 'specialCharacterErrorMessage',
      }),
  })

  // validation reset password
  static readonly RESETPASSWORD: ZodType = z.object({
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, { message: 'minLengthErrorMessage ' })
      .max(20, { message: 'maxLengthErrorMessage' })
      .refine((password) => /[A-Z]/.test(password), {
        message: 'uppercaseErrorMessage',
      })
      .refine((password) => /[a-z]/.test(password), {
        message: 'lowercaseErrorMessage',
      })
      .refine((password) => /[0-9]/.test(password), {
        message: 'numberErrorMessage',
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message: 'specialCharacterErrorMessage',
      }),
    retryPassword: z
      .string()
      .min(8, { message: 'minLengthErrorMessage ' })
      .max(20, { message: 'maxLengthErrorMessage' })
      .refine((password) => /[A-Z]/.test(password), {
        message: 'uppercaseErrorMessage',
      })
      .refine((password) => /[a-z]/.test(password), {
        message: 'lowercaseErrorMessage',
      })
      .refine((password) => /[0-9]/.test(password), {
        message: 'numberErrorMessage',
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message: 'specialCharacterErrorMessage',
      }),
    otpCode: z.string().min(6, { message: 'minLengthErrorMessage' }),
  });
}
