import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => !value || URL.canParse(value), {
    message: "Enter a valid URL.",
  });

const dateTime = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Enter a valid date and time.",
});

const walletAddress = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar public wallet address.");

export const createDraftEventRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    eventType: z.string().trim().min(2).max(60),
    shortDescription: z.string().trim().min(12).max(280),
    coverImageUrl: optionalUrl,
    startDateTime: dateTime,
    endDateTime: dateTime,
    timezone: z.string().trim().min(2).max(80),
    locationType: z.enum(["physical", "virtual", "hybrid"]),
    locationText: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((value) => (value ? value : null)),
    meetingUrl: optionalUrl,
    isFree: z.boolean(),
    priceUsdc: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Use a USDC amount with up to 2 decimals."),
    capacity: z.coerce.number().int().min(1).max(10000),
    collaborators: z
      .array(
        z.object({
          displayName: z.string().trim().min(2).max(80),
          role: z.string().trim().min(2).max(60),
          walletAddress,
          splitPercentage: z.coerce.number().min(0).max(100),
        }),
      )
      .min(1)
      .max(12),
  })
  .superRefine((value, context) => {
    if (Date.parse(value.endDateTime) <= Date.parse(value.startDateTime)) {
      context.addIssue({
        code: "custom",
        message: "End time must be after start time.",
        path: ["endDateTime"],
      });
    }

    if (!value.isFree && Number(value.priceUsdc) <= 0) {
      context.addIssue({
        code: "custom",
        message: "Paid events must have a price above 0 USDC.",
        path: ["priceUsdc"],
      });
    }

    const splitTotal = value.collaborators.reduce(
      (total, collaborator) => total + collaborator.splitPercentage,
      0,
    );

    if (Math.abs(splitTotal - 100) > 0.001) {
      context.addIssue({
        code: "custom",
        message: "Collaborator split total must equal 100%.",
        path: ["collaborators"],
      });
    }
  });

export type CreateDraftEventRequest = z.infer<typeof createDraftEventRequestSchema>;

export function slugifyEventTitle(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "quorum-event";
}
