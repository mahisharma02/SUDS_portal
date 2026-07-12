const { execSync } = require('child_process');

const url = 'https://ayucatrmlenxbojnrnde.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k';

function run(cmd) {
  try {
    console.log(`Running: ${cmd}`);
    // use cmd.exe to avoid powershell pipe issues if any
    const output = execSync(cmd, { shell: 'cmd.exe', stdio: 'pipe' });
    console.log('Success:', output.toString());
  } catch (err) {
    console.error('Error:', err.stderr ? err.stderr.toString() : err.message);
  }
}

// Remove old ones just in case (will fail if they don't exist, ignore)
run('npx vercel env rm VITE_SUPABASE_URL production --yes');
run('npx vercel env rm VITE_SUPABASE_ANON_KEY production --yes');

// Add URL
run(`echo ${url}| npx vercel env add VITE_SUPABASE_URL production --yes`);

// Add KEY
run(`echo ${key}| npx vercel env add VITE_SUPABASE_ANON_KEY production --yes`);
