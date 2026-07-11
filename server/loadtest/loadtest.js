const autocannon = require('autocannon');

function runLoadTest() {
  const url = process.env.TARGET_URL || 'http://localhost:5000/api/products';

  console.log(`Starting load test on target: ${url}`);

  const instance = autocannon(
    {
      url,
      connections: 50,
      duration: 10,
      pipelining: 1,
    },
    (err, result) => {
      if (err) {
        console.error('Load test failed:', err);
        process.exit(1);
      }
      console.log('\n--- Load Test Results ---');
      console.log(`Target URL: ${url}`);
      console.log(`Total Requests Sent: ${result.requests.sent}`);
      console.log(`Avg Latency: ${result.latency.average} ms`);
      console.log(`Avg Requests/Sec: ${result.requests.average}`);
      console.log(`Total Errors (non-2xx): ${result.non2xx}`);
    }
  );

  autocannon.track(instance, { renderProgressBar: true });
}

runLoadTest();
