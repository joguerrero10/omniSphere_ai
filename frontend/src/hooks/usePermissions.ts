import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  return { hasRole };
}