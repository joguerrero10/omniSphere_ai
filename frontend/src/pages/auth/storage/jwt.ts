export type JwtPayload = {
  userId: string;
  tenantId: string;
  roles: string[];
  iat: number;
  exp: number;
};

export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

export function getTokenRemainingMs(token: string): number {
  const payload = parseJwt(token);
  if (!payload?.exp) return 0;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return Math.max((payload.exp - nowInSeconds) * 1000, 0);
}