import { z } from "zod";

import {
  nonEmptyStringSchema,
  timestampSchema,
} from "./common.js";

export const AUTH_PROVIDER_VALUES = ["privy"] as const;
export const authProviderSchema = z.enum(AUTH_PROVIDER_VALUES);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const authenticatedOwnerSchema = z.object({
  providerId: authProviderSchema,
  appId: nonEmptyStringSchema,
  userId: nonEmptyStringSchema,
  sessionId: nonEmptyStringSchema.nullable(),
  issuer: nonEmptyStringSchema,
  authenticatedAt: timestampSchema,
});
export type AuthenticatedOwner = z.infer<typeof authenticatedOwnerSchema>;
