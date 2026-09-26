// Builds the Flaticon UIcons fonts used by <Icon> (components/neo/Icon.tsx).
//
// Reads the icon names in constants/icons.json, looks up their glyphs in
// @flaticon/flaticon-uicons, and writes fonts that contain only those glyphs —
// the full UIcons fonts are several MB each. Run after adding an icon:
//   npm run icons
//
// UIcons are free with attribution: "Uicons by Flaticon" (shown in Profile).

const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const root = path.join(__dirname, '..');
const cssDir = path.join(root, 'node_modules', '@flaticon', 'flaticon-uicons', 'css');

const STYLES = {
  bold: { css: 'bold/rounded.css', prefix: 'fi-br-', font: /^uicons-bold-rounded-.*\.woff$/, out: 'uicons-bold.ttf' },
  solid: { css: 'solid/rounded.css', prefix: 'fi-sr-', font: /^uicons-solid-rounded-.*\.woff$/, out: 'uicons-solid.ttf' },
  brands: { css: 'brands/all.css', prefix: 'fi-brands-', font: /^uicons-brands-.*\.woff$/, out: 'uicons-brands.ttf' },
};

function glyphMap(file, prefix) {
  const css = fs.readFileSync(path.join(cssDir, file), 'utf8');
  const out = {};
  const rule = /([^{}]+)\{content:"\\([0-9a-f]+)"\}/g;
  let m;
  while ((m = rule.exec(css))) {
    for (const sel of m[1].split(',')) {
      const s = sel.trim();
      if (s.startsWith(`.${prefix}`) && s.endsWith(':before')) {
        out[s.slice(prefix.length + 1, -':before'.length)] = parseInt(m[2], 16);
      }
    }
  }
  return out;
}

async function main() {
  const names = require(path.join(root, 'constants', 'icons.json'));
  const wanted = { bold: new Set(), solid: new Set(), brands: new Set() };
  for (const target of Object.values(names)) {
    if (target.startsWith('brands:')) wanted.brands.add(target.slice('brands:'.length));
    else { wanted.bold.add(target); wanted.solid.add(target); }
  }

  const glyphs = {};
  const missing = [];
  fs.mkdirSync(path.join(root, 'assets', 'fonts'), { recursive: true });

  for (const [style, cfg] of Object.entries(STYLES)) {
    const map = glyphMap(cfg.css, cfg.prefix);
    glyphs[style] = {};
    for (const name of [...wanted[style]].sort()) {
      if (map[name]) glyphs[style][name] = map[name];
      // A few glyphs only exist in the bold set; <Icon> falls back to bold.
      else if (style !== 'solid') missing.push(`${style}:${name}`);
    }

    const fontFile = fs.readdirSync(cssDir).find(f => cfg.font.test(f));
    const text = Object.values(glyphs[style]).map(cp => String.fromCodePoint(cp)).join('');
    const ttf = await subsetFont(fs.readFileSync(path.join(cssDir, fontFile)), text, { targetFormat: 'sfnt' });
    fs.writeFileSync(path.join(root, 'assets', 'fonts', cfg.out), ttf);
    console.log(`${cfg.out}: ${Object.keys(glyphs[style]).length} icons, ${(ttf.length / 1024).toFixed(1)} KB`);
  }

  if (missing.length) {
    console.error(`Not found in UIcons: ${missing.join(', ')}`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(root, 'constants', 'iconGlyphs.json'), `${JSON.stringify(glyphs, null, 2)}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
