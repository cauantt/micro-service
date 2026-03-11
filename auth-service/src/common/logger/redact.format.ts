import * as winston from 'winston';

/**
 * Lista de chaves sensíveis que NUNCA devem aparecer nos logs.
 */
const SENSITIVE_KEYS = [
  'password', 'senha', 'secret', 'token', 'access_token', 'refresh_token',
  'authorization', 'apikey', 'api_key', 'client_secret', 'private_key',
  'credential', 'credentials', 'jwt', 'cookie', 'set-cookie', 'x-api-key',
];

function deepRedact(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(deepRedact);

  return Object.entries(obj as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      const normalizedKey = key.toLowerCase().replace(/[-_ ]/g, '');
      const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
        normalizedKey.includes(sensitiveKey.replace(/[-_]/g, '')),
      );

      acc[key] = isSensitive ? '[REDACTED]' : deepRedact(value);
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

export const redactFormat = winston.format((info) => {
  return deepRedact(info) as winston.Logform.TransformableInfo;
})();

/**
 * Filtro para ignorar o ruído (Log Noise) de inicialização do NestJS.
 * Ele descarta logs de 'info' gerados pela injeção de dependências.
 */
export const dropNestStartupNoise = winston.format((info) => {
  const noiseContexts = [
    'InstanceLoader',
    'RoutesResolver',
    'RouterExplorer',
    'NestFactory',
  ];

  if (info.level === 'info' && noiseContexts.includes(info.context as string)) {
    return false;
  }

  return info;
})();