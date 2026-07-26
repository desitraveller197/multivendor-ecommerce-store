const { spawn } = require('child_process');

const key = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

const child = spawn('npx', ['vercel', 'env', 'add', 'STRIPE_SECRET_KEY', 'production', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

child.stdin.write(key);
child.stdin.end();

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  process.exit(code);
});
