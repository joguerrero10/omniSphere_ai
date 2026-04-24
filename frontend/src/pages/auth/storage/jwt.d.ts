export type JwtPayload = {
    userId: string;
    tenantId: string;
    roles: string[];
    iat?: number;
    exp?: number;
};
export declare function parseJwt(token: string): JwtPayload | null;
export declare function isTokenExpired(token: string): boolean;
export declare function getTokenRemainingMs(token: string): number;
