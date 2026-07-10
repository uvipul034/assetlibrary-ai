import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

export const uploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Please select a file")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (file) => ACCEPTED_MIME_TYPES.includes(file.type),
      "Only .jpg, .png, .webp, .gif, .mp4, and .webm formats are supported."
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
});

export type UploadFormData = z.infer<typeof uploadSchema>;
