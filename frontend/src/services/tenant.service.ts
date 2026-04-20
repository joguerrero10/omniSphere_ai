import type {
  CreateTenantRequest,
  TenantRecord,
  UpdateTenantRequest,
} from "../types/tenant.types";
import api from "./api";
import axios from "axios";

export const tenantService = {
  async list(): Promise<TenantRecord[]> {
    try {
      const { data } = await api.get("/tenants");
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        const { data } = await api.get("/tenants/me");
        return data ? [data] : [];
      }
      throw err;
    }
  },

  async getById(id: string): Promise<TenantRecord> {
    const { data } = await api.get(`/tenants/${id}`);
    return data;
  },

  async getMyTenant(): Promise<TenantRecord> {
    const { data } = await api.get("/tenants/me");
    return data;
  },

  async create(payload: CreateTenantRequest): Promise<TenantRecord> {
    const { data } = await api.post("/tenants", payload);
    return data;
  },

  async update(id: string, payload: UpdateTenantRequest): Promise<TenantRecord> {
    const { data } = await api.patch(`/tenants/${id}`, payload);
    return data;
  },

  async updateMyTenant(payload: UpdateTenantRequest): Promise<TenantRecord> {
    const { data } = await api.patch("/tenants/me", payload);
    return data;
  },

  async remove(id: string): Promise<TenantRecord> {
    const { data } = await api.delete(`/tenants/${id}`);
    return data;
  },
};
