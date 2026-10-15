import { bump } from "./db";
import { config } from "./config";

export class LimitError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonimo";
}

export async function enforceLimits(ip: string): Promise<void> {
  const stamp = new Date().toISOString();
  const hourly = await bump(`ip:${ip}:${stamp.slice(0, 13)}`);
  if (hourly > config.hourlyLimit) {
    throw new LimitError("Llegaste al límite de pedidos por hora. Probá de nuevo más tarde.", 429);
  }
  const daily = await bump(`dia:${stamp.slice(0, 10)}`);
  if (daily > config.dailyCap) {
    throw new LimitError("Hoy se agotó el cupo de pedidos. Volvé mañana.", 503);
  }
}
