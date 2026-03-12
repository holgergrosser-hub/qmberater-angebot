import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const variant = (process.env.SITE_VARIANT || 'offers').toLowerCase().trim();
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

const isoSiteUrl = (process.env.ISO_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://iso-9001-berater-kosten.qm-guru.de')
  .toString()
  .trim()
  .replace(/\/+$/, '');

const today = new Date().toISOString().slice(0, 10);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyFile(src, dst) {
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
}

async function copyDir(srcDir, dstDir) {
  await fs.mkdir(dstDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dst);
    } else if (entry.isFile()) {
      await copyFile(src, dst);
    }
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function buildOffers() {
  // Build the SPA into dist/
  run('npm', ['run', 'build:offers']);

  // SPA fallback
  const redirects = ['/* /index.html 200'].join('\n');

  await fs.writeFile(path.join(distDir, '_redirects'), `${redirects}\n`, 'utf8');
}

async function buildIsoLanding() {
  await ensureEmptyDir(distDir);

  // Landing root
  await copyFile(
    path.join(rootDir, 'public', 'iso-9001-berater-kosten', 'index.html'),
    path.join(distDir, 'index.html')
  );

  // Shared assets
  for (const asset of ['favicon.svg', 'qm-guru-logo-v1.svg', 'grosser-logo-v1.svg']) {
    const src = path.join(rootDir, 'public', asset);
    if (await exists(src)) {
      await copyFile(src, path.join(distDir, asset));
    }
  }

  // Legal pages: copy from offers templates but rewrite canonical host to ISO subdomain.
  const legalTargets = [
    { src: path.join(rootDir, 'public', 'impressum', 'index.html'), dst: path.join(distDir, 'impressum', 'index.html') },
    { src: path.join(rootDir, 'public', 'datenschutz', 'index.html'), dst: path.join(distDir, 'datenschutz', 'index.html') }
  ];

  for (const { src, dst } of legalTargets) {
    if (!(await exists(src))) continue;
    const html = await fs.readFile(src, 'utf8');
    const rewritten = html.replaceAll('https://angebote.qm-guru.de', 'https://iso-9001-berater-kosten.qm-guru.de');
    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.writeFile(dst, rewritten, 'utf8');
  }

  // robots + sitemap for ISO site
  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${isoSiteUrl}/sitemap.xml`,
    ''
  ].join('\n');
  await fs.writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${isoSiteUrl}/</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n` +
    `    <priority>1.0</priority>\n` +
    `  </url>\n` +
    `  <url>\n` +
    `    <loc>${isoSiteUrl}/impressum</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>yearly</changefreq>\n` +
    `    <priority>0.3</priority>\n` +
    `  </url>\n` +
    `  <url>\n` +
    `    <loc>${isoSiteUrl}/datenschutz</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <changefreq>yearly</changefreq>\n` +
    `    <priority>0.3</priority>\n` +
    `  </url>\n` +
    `</urlset>\n`;

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
}

(async () => {
  console.log(`Netlify build variant: ${variant}`);

  if (variant === 'iso') {
    await buildIsoLanding();
    return;
  }

  await buildOffers();
})();
