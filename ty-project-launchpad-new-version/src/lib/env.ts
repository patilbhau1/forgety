export function getBackendOrigin(): string {
  const env = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
  const origin = env && env.trim().length ? env : 'http://localhost:8000';
  // Ensure no trailing slash
  return origin.replace(/\/+$/,'');
}

export function getApiBase(): string {
  return `${getBackendOrigin()}/api`;
}
