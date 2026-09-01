import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak dikonfigurasi di .env.local');
}

export const rawClient = createClient(supabaseUrl, supabaseAnonKey);

// Daftar method filter yang didukung Supabase
const filterMethods = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
  'contains', 'containedBy', 'rangeLt', 'rangeGt', 'rangeGte', 'rangeLte',
  'rangeAdjacent', 'overlaps', 'textSearch', 'match', 'not', 'or', 'filter',
  'order', 'limit', 'range'
]);

class PendingQuery {
  private relation: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private actionArgs: any[] = [];
  private filters: { method: string; args: any[] }[] = [];
  private hasSelectAfterMutation = false;
  private selectArgs: any[] = [];
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(relation: string) {
    this.relation = relation;
  }

  select(...args: any[]) {
    if (this.action === 'insert' || this.action === 'update' || this.action === 'delete') {
      this.hasSelectAfterMutation = true;
      this.selectArgs = args;
      return this;
    }
    this.action = 'select';
    this.actionArgs = args;
    return this;
  }

  insert(...args: any[]) {
    this.action = 'insert';
    this.actionArgs = args;
    return this;
  }

  update(...args: any[]) {
    this.action = 'update';
    this.actionArgs = args;
    return this;
  }

  delete(...args: any[]) {
    this.action = 'delete';
    this.actionArgs = args;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Menangkap semua panggilan method filter dinamis
  addFilter(method: string, args: any[]) {
    this.filters.push({ method, args });
    return this;
  }

  // Mengeksekusi query Supabase sesungguhnya
  private execute() {
    let query: any;
    
    // Inisialisasi query berdasarkan action
    if (this.action === 'select') {
      query = rawClient.from(this.relation).select(this.actionArgs[0]);
    } else {
      query = (rawClient.from(this.relation) as any)[this.action](...this.actionArgs);
      if (this.hasSelectAfterMutation) {
        query = query.select(this.selectArgs[0]);
      }
    }

    // Terapkan semua filter yang dikumpulkan
    for (const filter of this.filters) {
      if (typeof query[filter.method] === 'function') {
        query = query[filter.method](...filter.args);
      }
    }

    // Terapkan single / maybeSingle di akhir
    if (this.isSingle) {
      query = query.single();
    } else if (this.isMaybeSingle) {
      query = query.maybeSingle();
    }

    return query;
  }

  // Agar objek ini bisa di-await secara langsung (Promise-like)
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Proxy wrapper untuk menangkap pemanggilan method dinamis pada PendingQuery
function createQueryProxy(relation: string): any {
  const pending = new PendingQuery(relation);

  return new Proxy(pending, {
    get(target: any, prop: string) {
      if (prop in target) {
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }

      if (filterMethods.has(prop)) {
        return (...args: any[]) => {
          target.addFilter(prop, args);
          return createQueryProxyWrapper(target);
        };
      }

      return undefined;
    }
  });
}

function createQueryProxyWrapper(pending: PendingQuery): any {
  return new Proxy(pending, {
    get(target: any, prop: string) {
      if (prop in target) {
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }
      if (filterMethods.has(prop)) {
        return (...args: any[]) => {
          target.addFilter(prop, args);
          return createQueryProxyWrapper(target);
        };
      }
      return undefined;
    }
  });
}

// Export proxy client utama Supabase
export const isSupabaseConfigured = true;
export const supabase = new Proxy(rawClient, {
  get(target, prop: string) {
    if (prop === 'from') {
      return (relation: string) => {
        return createQueryProxy(relation);
      };
    }
    const value = (target as any)[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  }
}) as any;
