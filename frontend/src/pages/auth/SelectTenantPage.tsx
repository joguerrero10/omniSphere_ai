import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
export default function SelectTenantPage() {
  const navigate = useNavigate();
  const { tenants, activeTenant, setActiveTenantById } = useAuth();

  const handleContinue = () => {
    if (!activeTenant) return;
    navigate("/dashboard");
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h1>Selecciona una empresa</h1>

      <select
        value={activeTenant?.id || ""}
        onChange={(e) => setActiveTenantById(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
      >
        <option value="">Selecciona una empresa</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      <button onClick={handleContinue} disabled={!activeTenant}>
        Continuar
      </button>
    </div>
  );
}