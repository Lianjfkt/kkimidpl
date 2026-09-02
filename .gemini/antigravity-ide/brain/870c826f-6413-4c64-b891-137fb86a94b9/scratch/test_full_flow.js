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
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
}

const rawClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fullLoginFlow(email, password) {
  console.log(`\n=== Testing login: ${email} ===`);
  
  // Step 1: signInWithPassword
  const { data, error } = await rawClient.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.log('❌ Auth error:', error.message);
    return;
  }
  
  console.log('✅ Auth berhasil. User ID:', data.user?.id);
  console.log('   Email confirmed?', data.user?.email_confirmed_at ? 'YES' : 'NO');
  
  // Step 2: fetchProfile
  if (data.user) {
    const { data: profileData, error: profileError } = await rawClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message, 'Code:', profileError.code);
    } else if (profileData) {
      console.log('✅ Profile ditemukan:', profileData);
      console.log('   Role:', profileData.role);
      console.log('   → Seharusnya redirect ke /' + profileData.role);
    } else {
      console.log('❌ Profile TIDAK ditemukan (data null)');
    }
  }
  
  await rawClient.auth.signOut();
}

async function main() {
  await fullLoginFlow('owner@dojo.com', 'owner123');
  await fullLoginFlow('pelatih@dojo.com', 'pelatih123');
  await fullLoginFlow('ortu@dojo.com', 'ortu123');
}

main().catch(console.error);
