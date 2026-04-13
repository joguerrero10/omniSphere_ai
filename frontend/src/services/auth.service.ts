import type { LoginRequest, LoginResponse } from "../types/auth.types";
import api from "./api";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  async me() {
    const { data } = await api.get("/auth/me");
    return data;
  },
};