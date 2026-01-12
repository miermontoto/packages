import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export class Config {
  private static instance: Config;
  private readonly secretsManager?: SecretsManager;
  private readonly secretsContainerName?: string;

  private constructor() {
    // solo inicializar secrets manager si AWS_SECRET_ID está definido
    if (process.env.AWS_SECRET_ID) {
      this.secretsManager = new SecretsManager({});
      this.secretsContainerName = process.env.AWS_SECRET_ID;
    } else {
      console.warn('AWS_SECRET_ID is not defined. Config will only use environment variables.');
    }
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  // versión síncrona: solo lee de variables de entorno, no hace peticiones a AWS
  public getSync(key: string, defaultValue: string): string;
  public getSync(key: string, defaultValue?: string): string | undefined;
  public getSync(key: string, defaultValue?: string): string | undefined {
    return process.env[key] ?? defaultValue;
  }

  // sobrecarga: cuando se proporciona un valor por defecto, el resultado nunca será undefined
  public async get(key: string, defaultValue: string): Promise<string>;
  // sobrecarga: cuando no se proporciona valor por defecto, el resultado puede ser undefined
  public async get(
    key: string,
    defaultValue?: string
  ): Promise<string | undefined>;
  // implementación
  public async get(
    key: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    // 1. intentar obtener el valor de variables de entorno
    const envValue = this.getSync(key);
    if (envValue) {
      return envValue;
    }

    // 2. intentar obtener el valor de Secrets Manager (solo si está configurado)
    if (this.secretsManager) {
      try {
        const secretValue = await this.getSecretValue(key);
        if (secretValue) {
          return secretValue;
        }
      } catch (error) {
        // si hay un error, no lanzar excepción: imprimir error y seguir
        console.error(`Error getting secret value for ${key}:`, error);
      }
    }

    // 3. si no está en ninguno de los dos, devolver el valor por defecto
    return defaultValue;
  }

  private async getSecretValue(key: string): Promise<string | undefined> {
    // verificar que secrets manager esté inicializado
    if (!this.secretsManager || !this.secretsContainerName) {
      return undefined;
    }

    try {
      const data = await this.secretsManager.getSecretValue({
        SecretId: this.secretsContainerName
      });

      if (data.SecretString) {
        const secrets = JSON.parse(data.SecretString);
        if (key in secrets) {
          return secrets[key];
        }
      }
    } catch (error) {
      console.error(`Error retrieving ${key} from Secrets Manager:`, error);
    }

    return undefined;
  }
}

export const config = Config.getInstance();
