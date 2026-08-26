import { createClient } from '@supabase/supabase-js';
import * as mock from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL_HERE');

let realSupabase: any = null;
if (isSupabaseConfigured) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client successfully initialized with URL:', supabaseUrl);
  } catch (err) {
    console.error('Failed to initialize real Supabase client:', err);
  }
} else {
  console.log('Supabase credentials not configured or using placeholders. Falling back to local storage mock database.');
}

const getLocalStorageDb = () => {
  if (typeof window === 'undefined') {
    return {
      profiles: mock.initialProfiles,
      students: mock.initialStudents,
      coaches: mock.initialCoaches,
      classes: mock.initialClasses,
      attendance_students: mock.initialAttendanceStudents,
      attendance_coaches: [] as mock.CoachAttendance[],
      fees: mock.initialFees,
      finance_transactions: mock.initialFinanceTransactions,
      belt_exams: mock.initialBeltExams,
      exam_participants: mock.initialExamParticipants,
      tournaments: mock.initialTournaments,
      tournament_participants: mock.initialTournamentParticipants,
      registrations: mock.initialRegistrations,
      notifications: mock.initialNotifications,
      class_students: mock.initialClassStudents,
      curriculum_materials: mock.initialCurriculumMaterials,
    };
  }

  const keys = [
    'profiles', 'students', 'coaches', 'classes', 'attendance_students',
    'attendance_coaches', 'fees', 'finance_transactions', 'belt_exams',
    'exam_participants', 'tournaments', 'tournament_participants', 'registrations', 'notifications',
    'class_students', 'curriculum_materials'
  ];

  // Only reseed if version key is missing (run once per browser)
  if (localStorage.getItem('db_reseeded_v6') !== 'true') {
    console.log('First-time initialization: seeding database...');
    keys.forEach(key => localStorage.removeItem(`db_${key}`));
    localStorage.setItem('db_reseeded_v6', 'true');
    // Do NOT clear mock_auth_session here — preserve any active session
  }

  const db: any = {};
  keys.forEach(key => {
    const val = localStorage.getItem(`db_${key}`);
    if (val) {
      db[key] = JSON.parse(val);
    } else {
      // Seed initial data
      let initialVal: any = [];
      if (key === 'profiles') initialVal = mock.initialProfiles;
      if (key === 'students') initialVal = mock.initialStudents;
      if (key === 'coaches') initialVal = mock.initialCoaches;
      if (key === 'classes') initialVal = mock.initialClasses;
      if (key === 'attendance_students') initialVal = mock.initialAttendanceStudents;
      if (key === 'fees') initialVal = mock.initialFees;
      if (key === 'finance_transactions') initialVal = mock.initialFinanceTransactions;
      if (key === 'belt_exams') initialVal = mock.initialBeltExams;
      if (key === 'exam_participants') initialVal = mock.initialExamParticipants;
      if (key === 'tournaments') initialVal = mock.initialTournaments;
      if (key === 'tournament_participants') initialVal = mock.initialTournamentParticipants;
      if (key === 'registrations') initialVal = mock.initialRegistrations;
      if (key === 'notifications') initialVal = mock.initialNotifications;
      if (key === 'class_students') initialVal = mock.initialClassStudents;
      if (key === 'curriculum_materials') initialVal = mock.initialCurriculumMaterials;

      localStorage.setItem(`db_${key}`, JSON.stringify(initialVal));
      db[key] = initialVal;
    }
  });

  return db;
};

const saveLocalStorageDb = (table: string, data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`db_${table}`, JSON.stringify(data));
  }
};

class QueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private limitCount?: number;
  private sortColumn?: string;
  private sortAscending?: boolean;

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item: any) => values.includes(item[column]));
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sortColumn = column;
    this.sortAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async select(columns = '*') {
    const db = getLocalStorageDb();
    let data = db[this.table] || [];

    // Apply filters
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // Apply sorting
    if (this.sortColumn) {
      const col = this.sortColumn;
      const asc = this.sortAscending ? 1 : -1;
      data = [...data].sort((a: any, b: any) => {
        if (a[col] < b[col]) return -1 * asc;
        if (a[col] > b[col]) return 1 * asc;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== undefined) {
      data = data.slice(0, this.limitCount);
    }

    return { data, error: null };
  }

  async insert(newData: any) {
    const db = getLocalStorageDb();
    const tableData = db[this.table] || [];

    const itemsToInsert = Array.isArray(newData) ? newData : [newData];
    const insertedItems = itemsToInsert.map(item => ({
      id: item.id || generateUUID(),
      created_at: new Date().toISOString(),
      ...item
    }));

    const updatedData = [...tableData, ...insertedItems];
    saveLocalStorageDb(this.table, updatedData);

    return { data: Array.isArray(newData) ? insertedItems : insertedItems[0], error: null };
  }

  async update(updatedFields: any) {
    const db = getLocalStorageDb();
    let tableData = db[this.table] || [];
    let updatedCount = 0;

    const matchedData = tableData.map((item: any) => {
      // Check if item matches filters
      const matches = this.filters.every(filter => filter(item));
      if (matches) {
        updatedCount++;
        return { ...item, ...updatedFields };
      }
      return item;
    });

    saveLocalStorageDb(this.table, matchedData);
    return { data: matchedData, error: null, count: updatedCount };
  }

  async delete() {
    const db = getLocalStorageDb();
    const tableData = db[this.table] || [];

    // Keep items that DO NOT match filters
    const keptData = tableData.filter((item: any) => {
      return !this.filters.every(filter => filter(item));
    });

    saveLocalStorageDb(this.table, keptData);
    return { data: null, error: null };
  }

  async single() {
    const { data, error } = await this.select();
    if (error) return { data: null, error };
    if (!data || data.length === 0) return { data: null, error: { message: 'Row not found' } };
    return { data: data[0], error: null };
  }
}

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  if (!window.crypto || !window.crypto.subtle) {
    if (message === 'owner123') return '4015f83ee3f975f9376533068867fb1297e651663dad02e0c37a95a88694fb57';
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'mock-hash-' + Math.abs(hash).toString(16);
  }

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      // Simulate registration
      const db = getLocalStorageDb();
      const profiles = db.profiles || [];
      const userId = `user-${generateUUID()}`;

      const newProfile = {
        id: userId,
        full_name: options?.data?.full_name || email.split('@')[0],
        role: options?.data?.role || 'ortu', // Default role is Ortu/parent
        phone: options?.data?.phone || '',
        avatar_url: '',
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      saveLocalStorageDb('profiles', profiles);

      // Save credentials for simulated login check
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      mockUsers.push({ id: userId, email, password });
      localStorage.setItem('mock_auth_users', JSON.stringify(mockUsers));

      const session = { access_token: `token-${userId}`, user: { id: userId, email } };
      localStorage.setItem('mock_auth_session', JSON.stringify(session));

      return { data: { user: { id: userId, email }, session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanPass = (password || '').trim();

      let matchedUser: { id: string; email: string } | null = null;

      // 1. Owner
      if (['owner', 'admin', 'owner@dojo.com'].includes(cleanEmail)) {
        if (cleanPass === 'owner123') {
          matchedUser = { id: 'user-owner-id', email: 'owner@dojo.com' };
        } else {
          // also try password_hash match from profiles
          const pwdHash = await sha256(cleanPass);
          const db = getLocalStorageDb();
          const ownerProfile = (db.profiles || []).find((p: any) => p.role === 'owner');
          if (ownerProfile && ownerProfile.password_hash === pwdHash) {
            matchedUser = { id: ownerProfile.id, email: 'owner@dojo.com' };
          }
        }
      }

      // 2. Pelatih
      if (!matchedUser && cleanEmail === 'pelatih@dojo.com' && cleanPass === 'pelatih123') {
        matchedUser = { id: 'user-coach-id', email: 'pelatih@dojo.com' };
      }

      // 3. Ortu demo
      if (!matchedUser && cleanEmail === 'ortu@dojo.com' && cleanPass === 'ortu123') {
        matchedUser = { id: 'user-parent-id', email: 'ortu@dojo.com' };
      }

      // 4. Ortu by phone number in profiles
      if (!matchedUser) {
        const pwdHash = await sha256(cleanPass);
        const db = getLocalStorageDb();
        const parentProfile = (db.profiles || []).find(
          (p: any) => p.role === 'ortu' && p.phone === cleanEmail
        );
        if (parentProfile && parentProfile.password_hash === pwdHash) {
          matchedUser = { id: parentProfile.id, email: cleanEmail };
        }
      }

      // 5. Fallback to manually signed-up mock users
      if (!matchedUser) {
        const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
        const mockMatch = mockUsers.find((u: any) => u.email === cleanEmail && u.password === cleanPass);
        if (mockMatch) {
          matchedUser = { id: mockMatch.id, email: mockMatch.email };
        }
      }

      if (matchedUser) {
        const session = { access_token: `token-${matchedUser.id}`, user: { id: matchedUser.id, email: matchedUser.email } };
        localStorage.setItem('mock_auth_session', JSON.stringify(session));
        return { data: { user: { id: matchedUser.id, email: matchedUser.email }, session }, error: null };
      }

      return { data: { user: null, session: null }, error: { message: 'Email atau password salah.' } };
    },

    signOut: async () => {
      localStorage.removeItem('mock_auth_session');
      return { error: null };
    },

    getUser: async () => {
      const sessionStr = localStorage.getItem('mock_auth_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        return { data: { user: session.user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    getSession: async () => {
      const sessionStr = localStorage.getItem('mock_auth_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        return { data: { session }, error: null };
      }
      return { data: { session: null }, error: null };
    }
  },

  from: (table: string) => {
    return new QueryBuilder(table);
  }
};

// Export hybrid client using Javascript Proxy
export const supabase = new Proxy({}, {
  get(target, prop: string | symbol) {
    if (isSupabaseConfigured && realSupabase) {
      return (realSupabase as any)[prop];
    }
    return (mockSupabase as any)[prop];
  }
}) as any;
