/**
 * A minimal stand-in for the supabase-js client, good enough for the chained
 * calls the _shared/ helpers actually make.
 *
 * Why a hand-rolled stub rather than a mock library: these helpers are the money
 * layer, and the thing worth testing is the DECISION each guard makes given a
 * database state. Scripting that state directly — "this referral row exists,
 * this referrer has no active plan" — reads as the scenario under test, which a
 * generic mock does not.
 *
 * Supported chains (all that _shared/ uses today):
 *   from(t).select(c).eq(k,v).in(k,vs).gte(k,v).limit(n).maybeSingle()
 *   from(t).select(c, { count: "exact", head: true }).eq().gte()
 *   from(t).update(patch).eq(k,v)
 *   from(t).insert(rows)
 *   rpc(name, args)
 *
 * Every mutation is recorded on `calls` so a test can assert BOTH the returned
 * decision and the write that accompanied it — the second half matters, because
 * "returned daily_cap_hit" without "wrote MANUAL_REVIEW" is a silent failure.
 */

export type Row = Record<string, unknown>;

export interface StubCall {
  table: string;
  op: "update" | "insert";
  payload: unknown;
  filters: Array<[string, unknown]>;
}

export interface StubOptions {
  /** Rows returned per table, in order of the queries against that table. */
  tables?: Record<string, Row[] | Row[][]>;
  /** Count returned for a head/count query, per table. */
  counts?: Record<string, number>;
  /** Error to return from the next update on a table, e.g. { code: "23505" }. */
  updateErrors?: Record<string, Array<{ code?: string; message?: string } | null>>;
  /** RPC results by name. */
  rpcs?: Record<string, { data?: unknown; error?: { message: string } | null }>;
}

export function makeStub(opts: StubOptions = {}) {
  const calls: StubCall[] = [];
  const readCursor: Record<string, number> = {};
  const updateCursor: Record<string, number> = {};

  function nextRows(table: string): Row[] {
    const cfg = opts.tables?.[table];
    if (!cfg) return [];
    // A Row[][] means "successive queries return successive result sets".
    if (Array.isArray(cfg) && Array.isArray(cfg[0])) {
      const i = readCursor[table] ?? 0;
      readCursor[table] = i + 1;
      return ((cfg as Row[][])[i] ?? []) as Row[];
    }
    return cfg as Row[];
  }

  function nextUpdateError(table: string) {
    const seq = opts.updateErrors?.[table];
    if (!seq) return null;
    const i = updateCursor[table] ?? 0;
    updateCursor[table] = i + 1;
    return seq[i] ?? null;
  }

  /**
   * A single LAZY thenable. Every filter method returns the same object and
   * nothing is read or recorded until the chain is awaited (or maybeSingle is
   * called). Settling eagerly in a filter method is the obvious mistake here: it
   * advances the per-table result cursor, so `.eq(...).limit(1).maybeSingle()`
   * silently returns the SECOND scripted result set instead of the first.
   */
  function builder(table: string, mode: "select" | "update" | "insert", payload?: unknown) {
    const filters: Array<[string, unknown]> = [];
    let head = false;
    let settled = false;

    function settle() {
      if (mode === "update") {
        if (!settled) calls.push({ table, op: "update", payload, filters: [...filters] });
        settled = true;
        return { data: null, error: nextUpdateError(table) };
      }
      if (mode === "insert") {
        if (!settled) calls.push({ table, op: "insert", payload, filters: [...filters] });
        settled = true;
        return { data: null, error: null };
      }
      if (head) return { count: opts.counts?.[table] ?? 0, error: null };
      return { data: nextRows(table), error: null };
    }

    const api: Record<string, unknown> = {
      select(_cols?: string, options?: { count?: string; head?: boolean }) {
        if (options?.head) head = true;
        return api;
      },
      eq(k: string, v: unknown) {
        filters.push([k, v]);
        return api;
      },
      in(k: string, v: unknown) {
        filters.push([k, v]);
        return api;
      },
      gte(k: string, v: unknown) {
        filters.push([k, v]);
        return api;
      },
      limit() {
        return api;
      },
      maybeSingle() {
        const res = settle() as { data?: Row[] };
        const rows = (res.data ?? []) as Row[];
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(settle()).then(resolve, reject);
      },
    };

    return api;
  }

  const client = {
    from(table: string) {
      return {
        select(cols?: string, options?: { count?: string; head?: boolean }) {
          const b = builder(table, "select") as Record<string, unknown>;
          return (b.select as (c?: string, o?: unknown) => unknown)(cols, options);
        },
        update(patch: unknown) {
          return builder(table, "update", patch);
        },
        insert(rows: unknown) {
          return builder(table, "insert", rows);
        },
      };
    },
    rpc(name: string, _args?: unknown) {
      const r = opts.rpcs?.[name];
      return Promise.resolve({ data: r?.data ?? null, error: r?.error ?? null });
    },
    calls,
  };

  return client;
}

/** Find the single update written to a table, for assertions. */
export function updateTo(client: { calls: StubCall[] }, table: string) {
  return client.calls.find((c) => c.table === table && c.op === "update")?.payload as
    | Record<string, unknown>
    | undefined;
}

/** All inserts to a table. */
export function insertsTo(client: { calls: StubCall[] }, table: string) {
  return client.calls.filter((c) => c.table === table && c.op === "insert").map((c) => c.payload);
}
