import { createClient } from '@supabase/supabase-js'

const url = 'https://ayucatrmlenxbojnrnde.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k';

const supabase = createClient(url, anonKey);

async function runDebug() {
  console.log('--- CREATING OFFICER ---');
  const { data: officerData, error: officerError } = await supabase.functions.invoke('debug-auth', {
    body: { action: 'create_officer' }
  });
  if (officerError) {
    if (officerError.context && typeof officerError.context.text === 'function') {
      const text = await officerError.context.text();
      console.log('Error output:', text);
    } else {
      console.error(officerError);
    }
  } else {
    console.log(JSON.stringify(officerData, null, 2));
  }
}

runDebug();
