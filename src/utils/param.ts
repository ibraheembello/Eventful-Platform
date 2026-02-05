import { Request } from 'express';

// Express v5 types req.params values as string | string[] because wildcard
// route params (e.g. /*path) resolve to arrays. Named params like :id are
// always a single string. This helper safely extracts a named param.
export function param(req: Request, name: string): string {
  const val = req.params[name] as string | string[];
  if (Array.isArray(val)) return val[0];
  return val as string;
}
