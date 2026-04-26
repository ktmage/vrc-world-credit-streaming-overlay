import { z } from "zod";
import pkg from "~/package.json" with { type: "json" };
import { WorldIdSchema, WorldInfoSchema, type WorldInfo } from "@/schema";

export class VrchatApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "VrchatApiError";
  }

  static async fromResponse(res: Response): Promise<VrchatApiError> {
    return new VrchatApiError(`VRChat API ${res.status}: ${await res.text()}`, res.status);
  }

  static missingContact(): VrchatApiError {
    return new VrchatApiError(
      "VRCHAT_API_CONTACT is not set. See .env.example. " +
        "https://hello.vrchat.com/creator-guidelines#api-usage",
    );
  }

  static invalidContact(value: string): VrchatApiError {
    return new VrchatApiError(
      `VRCHAT_API_CONTACT is not a valid email: ${JSON.stringify(value)}`,
    );
  }

  static invalidResponse(error: z.ZodError): VrchatApiError {
    return new VrchatApiError(`VRChat API returned unexpected shape: ${error.message}`);
  }

  static invalidWorldId(value: string): VrchatApiError {
    return new VrchatApiError(`Invalid VRChat world ID: ${JSON.stringify(value)}`);
  }
}

export function loadContact(): string {
  const v = process.env.VRCHAT_API_CONTACT;
  if (!v) throw VrchatApiError.missingContact();
  if (!z.email().safeParse(v).success) throw VrchatApiError.invalidContact(v);
  return v;
}

// 429 を踏んだ後、再起動するまでこの値を返し続ける。
const RATE_LIMITED_PLACEHOLDER: WorldInfo = {
  id: "wrld_00000000-0000-0000-0000-000000000000",
  name: "VRChat API レート制限中",
  authorName: "再起動するまで復帰しません",
  imageUrl: "",
  description: "",
};

export function createVrchatApi(contact: string) {
  const userAgent = `${pkg.name}/${pkg.version} ${contact}`;
  const cache = new Map<string, WorldInfo>();
  let rateLimited = false;

  async function fetchWorldInfo(worldId: string): Promise<WorldInfo> {
    if (!WorldIdSchema.safeParse(worldId).success) throw VrchatApiError.invalidWorldId(worldId);
    if (rateLimited) return RATE_LIMITED_PLACEHOLDER;

    const cached = cache.get(worldId);
    if (cached) return cached;

    const res = await fetch(`https://vrchat.com/api/1/worlds/${worldId}`, {
      headers: { "User-Agent": userAgent },
    });
    if (res.status === 429) {
      rateLimited = true;
      console.warn("VRChat API rate limit (429). Locked until restart.");
      return RATE_LIMITED_PLACEHOLDER;
    }
    if (!res.ok) throw await VrchatApiError.fromResponse(res);

    const parsed = WorldInfoSchema.safeParse(await res.json());
    if (!parsed.success) throw VrchatApiError.invalidResponse(parsed.error);
    cache.set(worldId, parsed.data);
    return parsed.data;
  }

  return { fetchWorldInfo };
}

export type VrchatApi = ReturnType<typeof createVrchatApi>;
