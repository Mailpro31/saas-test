export type PlatformStat = {
  platform: string;
  handle: string;
  followers: number;
};

export function parsePlatformStats(json: string): PlatformStat[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.platform === "string")
      .map((p) => ({
        platform: String(p.platform),
        handle: typeof p.handle === "string" ? p.handle : "",
        followers: Number(p.followers) || 0,
      }));
  } catch {
    return [];
  }
}
