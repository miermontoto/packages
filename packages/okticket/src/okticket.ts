import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type { AuthCallDataObj, OkticketConfig, RequestOptions } from "./interfaces";

/**
 * cliente para la api de okticket
 * facilita la autenticación y el envío de peticiones
 */
export class OkticketClient {
  private readonly http: AxiosInstance;
  private providerUrl: string;
  private readonly appName: string;
  private readonly authConfig: OkticketConfig["auth"];
  private token: string | null = null;

  constructor(config: OkticketConfig) {
    this.providerUrl = config.providerUrl;
    this.appName = config.appName;
    this.authConfig = config.auth;
    this.http = axios.create();
  }

  /** actualiza la url base del proveedor */
  public setProviderUrl(url: string): void {
    this.providerUrl = url;
  }

  /** obtiene la url actual del proveedor */
  public getProviderUrl(): string {
    return this.providerUrl;
  }

  /** verifica si el cliente está autenticado */
  public isAuthenticated(): boolean {
    return this.token !== null && this.token.length > 0;
  }

  /**
   * autentica con la api de okticket mediante oauth
   * el token se almacena internamente para futuras peticiones
   * @returns true si la autenticación fue exitosa
   */
  public async authenticate(): Promise<boolean> {
    const response = await this.sendRequest("POST", "/oauth/token", {
      data: this.buildAuthData(),
      noApi: true,
    });

    try {
      if (!response || response.status !== 200) {
        console.error("[okticket] error al autenticar con la API", response?.status);
        return false;
      }

      this.token = this.extractToken(response);
      return true;
    } catch (error) {
      console.error("[okticket] error al autenticar con la API", response);
      return false;
    }
  }

  /**
   * envía una petición a la api de okticket
   * incluye automáticamente el token de autenticación si existe
   * @param method método http (GET, POST, PUT, DELETE, etc.)
   * @param path endpoint de la api (sin la url base)
   * @param options opciones de la petición
   * @returns respuesta de axios o undefined si hay error
   */
  public async sendRequest<T = Record<string, unknown>>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T> | undefined> {
    const {
      headers = {},
      data = {},
      noApi = false,
      contentType = "application/json; charset=utf-8",
      responseType = "json",
      axiosOptions = {},
    } = options;

    const targetUrl = this.providerUrl + (noApi ? "" : "/api") + path;
    console.log(`[okticket] ${method} ${targetUrl}`);

    try {
      return await this.http.request<T>({
        method,
        url: targetUrl,
        data,
        responseType,
        headers: this.buildHeaders({ ...headers, "Content-Type": contentType }),
        ...axiosOptions,
      });
    } catch (error: unknown) {
      const axiosError = error as { message?: string; response?: AxiosResponse<T> };
      console.error("[okticket] error en sendRequest:", axiosError.message ?? error);
      return axiosError.response;
    }
  }

  /** método de conveniencia para GET */
  public async get<T = Record<string, unknown>>(
    path: string,
    options: Omit<RequestOptions, "data"> = {}
  ): Promise<AxiosResponse<T> | undefined> {
    return this.sendRequest<T>("GET", path, options);
  }

  /** método de conveniencia para POST */
  public async post<T = Record<string, unknown>>(
    path: string,
    data: Record<string, unknown> = {},
    options: Omit<RequestOptions, "data"> = {}
  ): Promise<AxiosResponse<T> | undefined> {
    return this.sendRequest<T>("POST", path, { ...options, data });
  }

  /** método de conveniencia para PUT */
  public async put<T = Record<string, unknown>>(
    path: string,
    data: Record<string, unknown> = {},
    options: Omit<RequestOptions, "data"> = {}
  ): Promise<AxiosResponse<T> | undefined> {
    return this.sendRequest<T>("PUT", path, { ...options, data });
  }

  /** método de conveniencia para DELETE */
  public async delete<T = Record<string, unknown>>(
    path: string,
    options: Omit<RequestOptions, "data"> = {}
  ): Promise<AxiosResponse<T> | undefined> {
    return this.sendRequest<T>("DELETE", path, options);
  }

  /** construye el objeto de autenticación oauth */
  private buildAuthData(): AuthCallDataObj {
    return {
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      grant_type: this.authConfig.grantType,
      password: this.authConfig.password,
      scope: this.authConfig.scope,
      username: this.authConfig.username,
    };
  }

  /** extrae el token de la respuesta de autenticación */
  private extractToken(response: AxiosResponse<Record<string, unknown>>): string {
    const token = response.data?.access_token;
    if (typeof token !== "string" || !token) {
      throw new Error("token de autenticación no encontrado en la respuesta");
    }
    return token;
  }

  /** construye los headers por defecto incluyendo el token si existe */
  private buildHeaders(options: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      Caller: this.appName,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return { ...headers, ...options };
  }
}
