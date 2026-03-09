import * as winston from 'winston';

/**
 * Lista de chaves sensíveis que NUNCA devem aparecer nos logs.
 * Regra: qualquer campo cujo nome CONTENHA uma dessas strings será substituído por [REDACTED].
 * Busca é recursiva — protege objetos aninhados (ex: req.body.password).
 */
const SENSITIVE_KEYS = [
  'password',
  'senha',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'apikey',
  'api_key',
  'client_secret',
  'private_key',
  'credential',
  'credentials',
  'jwt',
  'cookie',
  'set-cookie',
  'x-api-key',
];

function deepRedact(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(deepRedact);

  return Object.entries(obj as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      // Normaliza: minúsculo + remove separadores para comparação agnóstica a estilo
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

/**
 * Formato Winston que varre recursivamente todos os campos do objeto de log
 * e redige qualquer chave que corresponda a dados sensíveis.
 *
 * DEVE ser o primeiro formato na cadeia `combine()` para garantir que nada
 * sensível escape para os transportes subsequentes.
 */
export const redactFormat = winston.format((info) => {
  return deepRedact(info) as winston.Logform.TransformableInfo;
})();
