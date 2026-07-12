const { spawn } = require('child_process');

function setEnv(name, value) {
  return new Promise((resolve, reject) => {
    console.log(`Setting ${name}...`);
    // Need to use shell: true for npx on Windows
    const child = spawn('npx', ['vercel', 'env', 'rm', name, 'production', '--yes'], { shell: true });
    
    child.on('close', () => {
      const childAdd = spawn('npx', ['vercel', 'env', 'add', name, 'production'], { shell: true });
      childAdd.stdout.on('data', data => console.log(`stdout: ${data}`));
      childAdd.stderr.on('data', data => console.error(`stderr: ${data}`));
      childAdd.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
      childAdd.stdin.write(value + '\n');
      childAdd.stdin.end();
    });
    
    child.stdout.on('data', data => console.log(`stdout: ${data}`));
    child.stderr.on('data', data => console.error(`stderr: ${data}`));
    
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });

    // Write the value to stdin and close it
    child.stdin.write(value + '\n');
    child.stdin.end();
  });
}

async function run() {
  try {
    await setEnv('VITE_SUPABASE_URL', 'https://ayucatrmlenxbojnrnde.supabase.co');
    await setEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k');
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}

run();
