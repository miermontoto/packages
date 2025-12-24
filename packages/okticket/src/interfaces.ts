import type { AxiosRequestConfig, ResponseType } from "axios";

/** datos del proveedor de autenticación */
export interface AuthProviderResultDataObj {
  api_url?: string;
  client_id?: string;
  secret_id?: string;
  native_login?: boolean;
  country?: string;
  host_identifier?: string;
}

/** datos de autenticación oauth */
export interface AuthCallDataObj {
  identifier?: string;
  client_id: string;
  client_secret: string;
  grant_type: string;
  password: string;
  scope: string;
  username: string;
  [key: string]: string | undefined;
}

/** configuración del cliente okticket */
export interface OkticketConfig {
  /** url base del proveedor (API_URL) */
  providerUrl: string;
  /** nombre de la aplicación que se envía en el header Caller */
  appName: string;
  /** credenciales de autenticación oauth */
  auth: {
    clientId: string;
    clientSecret: string;
    grantType: string;
    password: string;
    scope: string;
    username: string;
  };
}

/** opciones para peticiones */
export interface RequestOptions {
  /** headers adicionales */
  headers?: Record<string, string>;
  /** body de la petición */
  data?: Record<string, unknown>;
  /** si es true, no añade /api al path */
  noApi?: boolean;
  /** content-type personalizado */
  contentType?: string;
  /** tipo de respuesta esperada */
  responseType?: ResponseType;
  /** opciones adicionales de axios */
  axiosOptions?: Omit<AxiosRequestConfig, "method" | "url" | "data" | "headers" | "responseType">;
}
