import { SecretsManager } from '@aws-sdk/client-secrets-manager';

export class Config {
  private static instance: Config;
  private readonly secretsManager: SecretsManager;
  private readonly secretsContainerName: string;

  private constructor() {
    if (!process.env.AWS_SECRET_ID) {
      throw new Error('AWS_SECRET_ID environment variable is not set');
    }
    
    this.secretsManager = new SecretsManager({});
    this.secretsContainerName = process.env.AWS_SECRET_ID;
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public async get(
    key: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    // 1. intentar obtener el valor de variables de entorno
    const envValue = process.env[key];
    if (envValue) {
      return envValue;
    }

    // 2. intentar obtener el valor de Secrets Manager
    try {
      const secretValue = await this.getSecretValue(key);
      if (secretValue) {
        return secretValue;
      }
    } catch (error) {
      // si hay un error, no lanzar excepción: imprimir error y seguir
      console.error(`Error getting secret value for ${key}:`, error);
    }

    // 3. si no está en ninguno de los dos, devolver el valor por defecto
    return defaultValue;
  }

  private async getSecretValue(key: string): Promise<string | undefined> {
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