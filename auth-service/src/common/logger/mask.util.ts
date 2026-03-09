/**
 * Mascara parcialmente um e-mail para logs de auditoria.
 * Preserva os 2 primeiros caracteres do local-part e o domínio inteiro.
 *
 * Exemplos:
 *   "dyogo@email.com"  → "dy***@email.com"
 *   "a@email.com"      → "a***@email.com"
 *   "invalid"          → "[invalid-email]"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '[invalid-email]';
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(2, local.length));
  const masked = '*'.repeat(Math.max(local.length - visible.length, 3));
  return `${visible}${masked}@${domain}`;
}

/**
 * Mascara o último segmento de um endereço IP.
 * Evita que IPs completos apareçam nos logs (GDPR/LGPD compliance).
 *
 * Exemplos:
 *   "192.168.1.100"  → "192.168.1.***"
 *   "2001:db8::1"    → "2001:db8::***"
 */
export function maskIp(ip: string): string {
  if (!ip) return '[unknown-ip]';
  const ipv4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (ipv4) return `${ipv4[1]}.***`;
  return ip.replace(/:[^:]+$/, ':***');
}
