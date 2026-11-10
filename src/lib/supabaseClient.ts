import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi.');
  }
}

export const rawClient = createClient(
  supabaseUrl || 'https://placeholder-dojo.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

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
  private chain: { method: string; args: any[] }[] = [];
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

  addChain(method: string, args: any[]) {
    this.chain.push({ method, args });
    return this;
  }

  private execute() {
    let query: any;
    
    if (this.action === 'select') {
      const selectPattern = this.actionArgs.length > 0 && this.actionArgs[0] ? this.actionArgs[0] : '*';
      query = rawClient.from(this.relation).select(selectPattern);
    } else {
      query = (rawClient.from(this.relation) as any)[this.action](...this.actionArgs);
      if (this.hasSelectAfterMutation) {
        const selectPattern = this.selectArgs.length > 0 && this.selectArgs[0] ? this.selectArgs[0] : '*';
        query = query.select(selectPattern);
      }
    }

    for (const step of this.chain) {
      if (typeof query[step.method] === 'function') {
        query = query[step.method](...step.args);
      }
    }

    if (this.isSingle) {
      query = query.single();
    } else if (this.isMaybeSingle) {
      query = query.maybeSingle();
    }

    return query;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

function createProxy(target: any): any {
  return new Proxy(target, {
    get(t: any, prop: string) {
      if (prop in t) {
        const val = t[prop];
        return typeof val === 'function' ? (...args: any[]) => {
          const res = val.apply(t, args);
          return createProxy(res);
        } : val;
      }

      if (filterMethods.has(prop)) {
        return (...args: any[]) => {
          t.addChain(prop, args);
          return createProxy(t);
        };
      }

      return undefined;
    }
  });
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase: any = new Proxy(rawClient, {
  get(target, prop: string) {
    if (prop === 'from') {
      return (relation: string) => {
        return createProxy(new PendingQuery(relation));
      };
    }
    const value = (target as any)[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  }
});


