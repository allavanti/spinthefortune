// Simulatore minimo di D1 sopra node:sqlite, solo per i test locali.
import { DatabaseSync } from 'node:sqlite';

export function fakeD1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    _exec: () => {
      const s = db.prepare(sql);
      return /^\s*(select|insert|update|delete)/i.test(sql) && /returning|^\s*select/i.test(sql)
        ? { results: s.all(...args) } : (s.run(...args), { results: [] });
    },
  });
  return {
    _db: db,
    prepare: (sql) => stmt(sql),
    batch: async (list) => {
      db.exec('BEGIN');
      try {
        const out = list.map((s) => s._exec());
        db.exec('COMMIT');
        return out;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}
