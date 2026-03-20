import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

function skipBrokenPublicFiles() {
  return {
    name: 'skip-broken-public-files',
    apply: 'build',
    closeBundle() {},
    generateBundle() {},
    writeBundle() {
      const brokenFile = path.resolve('./dist/legionary_walk copy.png');
      try { fs.unlinkSync(brokenFile); } catch (_) {}
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@supabase/supabase-js': path.resolve('./supabase-cdn-shim.js'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/rosebud-assets': {
        target: 'https://rosebud.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rosebud-assets/, '/assets'),
      },
    },
  },
  build: {
    target: 'esnext',
    copyPublicDir: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
          if (id.includes('node_modules/tone')) {
            return 'tone';
          }
          if (id.includes('node_modules/@supabase') || id.includes('supabase-cdn-shim')) {
            return 'supabase';
          }
          if (
            id.includes('GameScene.js') ||
            id.includes('MultiplayerGameScene.js') ||
            id.includes('OnlineGameScene.js') ||
            id.includes('BaseGameScene.js') ||
            id.includes('Unit.js') ||
            id.includes('Worker.js') ||
            id.includes('Harvester.js') ||
            id.includes('Thrall.js') ||
            id.includes('Base.js') ||
            id.includes('GoldMine.js') ||
            id.includes('Minimap.js') ||
            id.includes('Aqueduct.js') ||
            id.includes('SpellSystem.js') ||
            id.includes('AIController.js') ||
            id.includes('LockstepEngine.js') ||
            id.includes('MultiplayerNetwork.js')
          ) {
            return 'gameplay';
          }
          if (
            id.includes('CampaignScene.js') ||
            id.includes('VikingCampaignScene.js') ||
            id.includes('AlienCampaignScene.js') ||
            id.includes('ComicIntroScene.js') ||
            id.includes('VikingComicIntroScene.js') ||
            id.includes('AlienComicIntroScene.js') ||
            id.includes('CampaignCompleteScene.js') ||
            id.includes('VictoryScene.js') ||
            id.includes('DefeatScene.js') ||
            id.includes('ChallengeMenuScene.js')
          ) {
            return 'campaign';
          }
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-public-safe',
      apply: 'build',
      closeBundle() {
        const publicDir = path.resolve('./public');
        const outDir = path.resolve('./dist');
        const skip = new Set(['legionary_walk copy.png']);
        function copyDir(src, dest) {
          try {
            const entries = fs.readdirSync(src);
            fs.mkdirSync(dest, { recursive: true });
            for (const entry of entries) {
              if (skip.has(entry)) continue;
              const srcPath = path.join(src, entry);
              const destPath = path.join(dest, entry);
              try {
                const stat = fs.statSync(srcPath);
                if (stat.isDirectory()) {
                  copyDir(srcPath, destPath);
                } else {
                  fs.copyFileSync(srcPath, destPath);
                }
              } catch (e) {
                console.warn(`Skipping ${srcPath}: ${e.message}`);
              }
            }
          } catch (e) {
            console.warn(`copyDir error: ${e.message}`);
          }
        }
        copyDir(publicDir, outDir);
      },
    },
  ],
});
