import { useAuth } from "../../hooks/useAuth";

export default function TenantSelector() {
  const { tenants, activeTenant, setActiveTenantById } = useAuth();

  if (tenants.length <= 1) return null;

  return (
    <select
      value={activeTenant?.id || ""}
      onChange={(e) => setActiveTenantById(e.target.value)}
    >
      <option value="" disabled>
        Selecciona empresa
      </option>
      {tenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </select>
  );
}