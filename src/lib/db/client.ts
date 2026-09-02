export interface DbConfig {
  isConfigured: boolean;
  supabaseUrl?: string;
  hasServiceRoleKey: boolean;
}

export function getDbConfig(): DbConfig {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(supabaseUrl && serviceKey);

  return {
    isConfigured,
    supabaseUrl: supabaseUrl || undefined,
    hasServiceRoleKey: Boolean(serviceKey),
  };
}

/**
 * Low-level Supabase REST API Query Executor (zero extra npm packages required)
 */
export async function supabaseRestQuery<T>(
  table: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const config = getDbConfig();

  if (!config.isConfigured || !config.supabaseUrl) {
    return { data: null, error: "DATABASE_NOT_CONFIGURED" };
  }

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let url = `${config.supabaseUrl}/rest/v1/${table}`;
  if (options.query) {
    const params = new URLSearchParams(options.query);
    url += `?${params.toString()}`;
  }

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Supabase REST] Error querying ${table}: ${res.status} ${errText}`);
      return { data: null, error: `SUPABASE_ERROR: ${res.status}` };
    }

    const json = (await res.json()) as T;
    return { data: json, error: null };
  } catch (err: unknown) {
    console.error(`[Supabase REST] Fetch exception for ${table}:`, err);
    return { data: null, error: String(err) };
  }
}
