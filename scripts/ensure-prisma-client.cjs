const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pnpmDir = path.join(root, 'node_modules', '.pnpm');

if (!fs.existsSync(pnpmDir)) {
  process.exit(0);
}

const prismaClientPackages = fs
  .readdirSync(pnpmDir)
  .filter((entry) => entry.startsWith('@prisma+client@'));

for (const entry of prismaClientPackages) {
  const packageRoot = path.join(pnpmDir, entry, 'node_modules');
  const sourceDir = path.join(packageRoot, '.prisma');
  const targetDir = path.join(packageRoot, '@prisma', 'client', '.prisma');

  if (!fs.existsSync(sourceDir)) {
    continue;
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });

  try {
    if (fs.existsSync(targetDir) || fs.lstatSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  } catch {}

  fs.symlinkSync(path.relative(path.dirname(targetDir), sourceDir), targetDir, 'dir');
}
