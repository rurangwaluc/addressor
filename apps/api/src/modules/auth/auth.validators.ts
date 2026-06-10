import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  fullName: z.string().min(2),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
export type LoginSchemaType = z.infer<typeof LoginSchema>;