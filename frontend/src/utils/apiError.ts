type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string | string[];
    };
  };
};

function asApiError(error: unknown): ApiErrorShape {
  if (typeof error === "object" && error !== null) {
    return error as ApiErrorShape;
  }
  return {};
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = asApiError(error);
  const status = apiError.response?.status;
  const apiMessage = apiError.response?.data?.message;

  if (typeof apiMessage === "string") return apiMessage;
  if (Array.isArray(apiMessage)) return apiMessage.join(" · ");

  switch (status) {
    case 400:
      return "Datos inválidos. Revisa los campos e inténtalo nuevamente.";
    case 401:
      return "Tu sesión expiró. Inicia sesión otra vez.";
    case 403:
      return "No tienes permisos para esta acción.";
    case 404:
      return "Empresa no encontrada.";
    case 409:
      return "Ya existe una empresa con esos datos.";
    case 422:
      return "La información enviada no cumple las validaciones.";
    case 500:
      return "Error interno del servidor. Intenta más tarde.";
    default:
      return fallback;
  }
}
