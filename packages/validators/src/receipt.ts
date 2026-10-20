import { z } from "zod";

export const receiptUploadSchema = z.strictObject({
  transactionId: z.uuid(),
  storagePath: z.string().max(512).regex(/^[a-f0-9-]+\/[a-f0-9-]+\/[A-Za-z0-9_-]+\.(png|jpg|jpeg|pdf)$/),
  contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  byteSize: z.int().positive().max(10485760),
}).refine(({ storagePath, contentType }) => {
  const extension = storagePath.split(".").at(-1);
  return contentType === "image/jpeg" ? extension === "jpg" || extension === "jpeg"
    : contentType === "image/png" ? extension === "png" : extension === "pdf";
}, { message: "File extension must match content type" });

export type ReceiptUploadInput = z.infer<typeof receiptUploadSchema>;
