// Verify public Netlify deployment
const BASE = 'https://joyvibe-shop.netlify.app';

(async () => {
  const home = await fetch(BASE + '/');
  const homeHtml = await home.text();
  console.log('Home status:', home.status, '| content-type:', home.headers.get('content-type'));
  console.log('Has #root div:', homeHtml.includes('id="root"'));
  console.log('Title:', (homeHtml.match(/<title>(.*?)<\/title>/) || [])[1]);
  const hasAsset = homeHtml.match(/\/assets\/[a-zA-Z0-9._-]+\.js/);
  console.log('JS asset referenced:', hasAsset ? hasAsset[0] : 'NONE');

  const deep = await fetch(BASE + '/categories');
  console.log('Deep link /categories status:', deep.status, '(expect 200 via SPA rewrite)');

  const assetUrl = new URL(hasAsset[0], BASE).href;
  const asset = await fetch(assetUrl);
  console.log('JS asset status:', asset.status, '| cache:', asset.headers.get('cache-control'));

  const xcto = home.headers.get('x-content-type-options');
  console.log('Security header X-Content-Type-Options:', xcto);
})();
