import { z } from 'zod';

// Account validation schema
export const accountSchema = z.object({
  bankName: z.string().trim().min(1, "Bank name is required").max(100, "Bank name too long"),
  accountNumber: z.string().trim().regex(/^\d{10,16}$/, "Account number must be 10-16 digits"),
  accountType: z.enum(['checking', 'savings', 'credit'], {
    errorMap: () => ({ message: "Please select a valid account type" })
  })
});

// Calendar event validation schema
export const eventSchema = z.object({
  eventName: z.string().trim().min(1, "Event name is required").max(200, "Event name too long"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  budgetedAmount: z.number().positive("Budget amount must be positive").max(999999999, "Budget amount too large"),
  eventDescription: z.string().max(1000, "Description too long").optional(),
  location: z.string().max(200, "Location too long").optional(),
  category: z.string().max(100, "Category too long").optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDaysBefore: z.number().min(0).max(365).optional()
});

// Goal validation schema
export const goalSchema = z.object({
  name: z.string().trim().min(1, "Goal name is required").max(200, "Goal name too long"),
  target: z.number().positive("Target amount must be positive").max(999999999, "Target amount too large"),
  currentSaved: z.number().min(0, "Current saved cannot be negative").max(999999999, "Amount too large").optional(),
  monthlyAllocation: z.number().min(0, "Monthly allocation cannot be negative").max(999999999, "Amount too large").optional(),
  dueDate: z.date({
    required_error: "A due date is required.",
  })
});

// Authentication validation schemas
export const emailSchema = z.string().email("Invalid email address").max(255, "Email too long");

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
});

// Transaction validation schema
export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999999, "Amount too large"),
  description: z.string().trim().max(500, "Description too long").optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  categoryId: z.string().uuid("Invalid category ID").optional()
});
