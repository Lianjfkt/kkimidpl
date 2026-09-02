const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
  if (line && !line.startsWith('#')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const accounts = [
  { email: 'owner@dojo.com', passwords: ['owner123', 'Owner123!'] },
  { email: 'pelatih@dojo.com', passwords: ['pelatih123', 'Pelatih123!'] },
  { email: 'ortu@dojo.com', passwords: ['ortu123', 'Ortu123!'] }
];

async function testLogins() {
  for (const acc of accounts) {
    for (const pass of acc.passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: pass
      });
      if (error) {
        console.log(`Failed: ${acc.email} with "${pass}" - ${error.message}`);
      } else {
        console.log(`SUCCESS: ${acc.email} with "${pass}"! User ID: ${data.user.id}`);
        await supabase.auth.signOut();
      }
    }
  }
}

testLogins();
