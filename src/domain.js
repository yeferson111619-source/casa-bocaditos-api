export function validate(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object') return 'Se requiere un objeto JSON';
  if (Object.keys(input).some(k => !['cliente','fecha','personas'].includes(k))) return 'Campos desconocidos';
  if (typeof input.cliente !== 'string' || input.cliente.trim().length < 2 || input.cliente.trim().length > 100) return 'Cliente: entre 2 y 100 caracteres';
  if (typeof input.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) return 'Fecha: AAAA-MM-DD';
  const date = new Date(input.fecha + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.fecha) return 'Fecha inexistente';
  if (!Number.isInteger(input.personas) || input.personas < 1 || input.personas > 1000) return 'Personas: entero de 1 a 1000';
  return null;
}
export const normalize = x => ({cliente:x.cliente.trim(), fecha:x.fecha, personas:x.personas});
