import { createClient } from '@supabase/supabase-js'

const url = 'https://ayucatrmlenxbojnrnde.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(url, serviceKey);

async function run() {
  const { data, error } = await supabaseAdmin.from('drivers').select('*').eq('email', 'jane_1782820754075@test.com');
  console.log('Error:', error);
  console.log('Data (bypassing RLS):', data);
}

run();
