import * as mock from './mockData';

// Helper to initialize and retrieve local storage database tables
const getLocalStorageDb = () => {
  if (typeof window === 'undefined') {
    return {
      profiles: mock.initialProfiles,
      students: mock.initialStudents,
      coaches: mock.initialCoaches,
      classes: mock.initialClasses,
      attendance_students: [] as mock.StudentAttendance[],
      attendance_coaches: [] as mock.CoachAttendance[],
      fees: mock.initialFees,
      finance_transactions: mock.initialFinanceTransactions,
      belt_exams: [] as mock.BeltExam[],
      exam_participants: [] as mock.ExamParticipant[],
      tournaments: [] as mock.Tournament[],
      tournament_participants: [] as mock.TournamentParticipant[],
      registrations: mock.initialRegistrations,
      notifications: mock.initialNotifications,
    };
  }

  const keys = [
    'profiles', 'students', 'coaches', 'classes', 'attendance_students',
    'attendance_coaches', 'fees', 'finance_transactions', 'belt_exams',
    'exam_participants', 'tournaments', 'tournament_participants', 'registrations', 'notifications'
  ];

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
      if (key === 'fees') initialVal = mock.initialFees;
      if (key === 'finance_transactions') initialVal = mock.initialFinanceTransactions;
      if (key === 'registrations') initialVal = mock.initialRegistrations;
      if (key === 'notifications') initialVal = mock.initialNotifications;

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
      id: item.id || crypto.randomUUID(),
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

export const supabase = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      // Simulate registration
      const db = getLocalStorageDb();
      const profiles = db.profiles || [];
      const userId = `user-${crypto.randomUUID()}`;

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
      // First check mock users
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      let matchedUser = mockUsers.find((u: any) => u.email === email && u.password === password);

      // Or fallback to default accounts
      if (!matchedUser) {
        if (email === 'owner@dojo.com' && password === 'owner123') {
          matchedUser = { id: 'user-owner-id', email };
        } else if (email === 'pelatih@dojo.com' && password === 'pelatih123') {
          matchedUser = { id: 'user-coach-id', email };
        } else if (email === 'ortu@dojo.com' && password === 'ortu123') {
          matchedUser = { id: 'user-parent-id', email };
        }
      }

      if (matchedUser) {
        const session = { access_token: `token-${matchedUser.id}`, user: { id: matchedUser.id, email } };
        localStorage.setItem('mock_auth_session', JSON.stringify(session));
        return { data: { user: { id: matchedUser.id, email }, session }, error: null };
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
