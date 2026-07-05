const { spawn } = require('child_process');

const key = "sk_test_51TpOMyGfdSCWL02OmNJrblsDdBUwKXCilwPm3zpye0LO7raQ0vCnLRj1KijFXLuJYuE2YvePXFc2xXeZhhNinFTF00HNPfdP7K";

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
