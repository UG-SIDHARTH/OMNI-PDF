import https from 'https';

function fetchGitHub(urlPath) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'OmniPDF-Release-Monitor'
      }
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.end();
  });
}

async function main() {
  const relRes = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/releases/tags/v0.4.0');
  console.log('GitHub Release Information:');
  console.log(`Tag Name: ${relRes.json.tag_name}`);
  console.log(`Name    : ${relRes.json.name}`);
  console.log(`Created : ${relRes.json.created_at}`);
  console.log(`Published: ${relRes.json.published_at}`);
  console.log(`Body/Notes:\n${relRes.json.body || '(No release description entered)'}`);
}

main();
