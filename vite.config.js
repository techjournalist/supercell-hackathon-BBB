import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@supabase/supabase-js': path.resolve('./supabase-cdn-shim.js'),
      'phaser': path.resolve('./phaser-cdn-shim.js'),
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
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
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
});
