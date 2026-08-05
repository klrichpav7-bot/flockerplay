export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data as { error?: string }).error) || "Ошибка запроса";
    throw new Error(msg);
  }
  return data as T;
}
