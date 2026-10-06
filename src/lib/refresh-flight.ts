let refreshPromise: Promise<string | null> | null = null;

export async function performRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.accessToken === "string") {
          return data.accessToken;
        }
      }
      return null;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
