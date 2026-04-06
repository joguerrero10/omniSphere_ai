
export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    tenantId: string;
    roles: string[];
  };
}