export interface TenantResourceOptions {
  /**
   * Nombre del modelo Prisma.
   * Debe coincidir con la propiedad del PrismaService.
   * Ejemplos: 'tenant', 'user', 'flow', 'channel', 'webhook'
   */
  model: string;

  /**
   * Nombre del parámetro de ruta que contiene el id.
   * Ejemplo: ':id' => paramName: 'id'
   */
  paramName: string;

  /**
   * Campo tenant en la tabla.
   * Por defecto: 'tenantId'
   */
  tenantField?: string;

  /**
   * Campo id en la tabla.
   * Por defecto: 'id'
   */
  idField?: string;

  /**
   * Si true, responde 404 cuando no encuentra.
   * Si false, responde forbidden o sigue lógica custom.
   */
  notFoundMessage?: string;
}
