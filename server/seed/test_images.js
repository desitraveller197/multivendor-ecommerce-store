const https = require('https');

const testIds = [
  // Punjab
  '1610030469983-98e550d6193c',
  '1612196808214-b8e1d6145a8c',
  '1596702990275-c59993359d99',
  '1546833999-b9f581a1996d',
  '1597983073492-bc24058b8785',
  // KPK
  '1603487742131-4160ec999306',
  '1620799140408-edc6dcb6d633',
  '1582139329536-e7284fece509',
  '1587049352846-4a222e784d38',
  '1617137968427-85924c800a22',
  // Balochistan
  '1583391733956-6c78276477e2',
  '1576016770956-debb63d900bb',
  '1560343090-f0409e92791a',
  '1505252585461-04db1ebb846d',
  '1599643478518-a784e5dc4c8f',
  // backups
  '1590080875515-8a3a8dc5735e',
  '1513530534585-c7b1394c6d51',
  '1541832676-9b763b0239ab',
  '1605371924599-2d0365da1ae0',
  '1544816155-12df9643f363',
  '1563245372-f21724e3856d',
  '1509319117193-57bab727e09d',
  '1498049794561-7780e7231661',
  '1556910103-1c02745aae4d',
  '1556228578-8c89e6adf883',
  '1535632066927-ab7c9ab60908',
  '1584917865442-de89df76afd3'
];

function checkUrl(id) {
  const url = `https://images.unsplash.com/photo-${id}?w=800&q=80`;
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${id} is VALID`);
      } else {
        console.log(`❌ ${id} is INVALID (Status: ${res.statusCode})`);
      }
      resolve();
    }).on('error', (err) => {
      console.log(`❌ ${id} is INVALID (Error: ${err.message})`);
      resolve();
    }).end();
  });
}

async function run() {
  for (const id of testIds) {
    await checkUrl(id);
  }
}

run();
