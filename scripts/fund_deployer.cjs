const https = require('https');

const DEPLOYER_ADDRESS = '7mwiPqiKhkECxyByfuqzjSS1socdp3pvP8WbgpWtkRn5';

const endpoints = [
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet',
];

async function tryAirdrop(url, amountLamports) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'requestAirdrop',
      params: [DEPLOYER_ADDRESS, amountLamports],
    });

    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve({ url, status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ url, status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ url, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  for (const ep of endpoints) {
    console.log(`Intentando airdrop en ${ep}...`);
    const res = await tryAirdrop(ep, 1000000000); // 1 SOL
    console.log(JSON.stringify(res, null, 2));
  }
}

run();

