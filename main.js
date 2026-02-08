import Phaser from 'phaser';
import { SplashScene } from './SplashScene.js';
import { MenuScene } from './MenuScene.js';
import { CampaignScene } from './CampaignScene.js';
import { ComicIntroScene } from './ComicIntroScene.js';
import { VikingCampaignScene } from './VikingCampaignScene.js';
import { VikingComicIntroScene } from './VikingComicIntroScene.js';
import { AlienCampaignScene } from './AlienCampaignScene.js';
import { AlienComicIntroScene } from './AlienComicIntroScene.js';
import { ChallengeMenuScene } from './ChallengeMenuScene.js';
import { AchievementScene } from './AchievementScene.js';
import { SkirmishSetupScene } from './SkirmishSetupScene.js';
import { FactionSelectScene } from './FactionSelectScene.js';
import { MultiplayerSetupScene } from './MultiplayerSetupScene.js';
import { MultiplayerGameScene } from './MultiplayerGameScene.js';
import { MultiplayerVictoryScene } from './MultiplayerVictoryScene.js';
import { GameScene } from './GameScene.js';
import { VictoryScene } from './VictoryScene.js';
import { DefeatScene } from './DefeatScene.js';
import { PauseMenuScene } from './PauseMenuScene.js';
import { CampaignCompleteScene } from './CampaignCompleteScene.js';
import { LeaderboardScene } from './LeaderboardScene.js';
import { AudioSettingsScene } from './AudioSettingsScene.js';

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  backgroundColor: '#1a0033',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    }
  },
  scene: [
    SplashScene,
    MenuScene, 
    CampaignScene, 
    ComicIntroScene, 
    VikingCampaignScene, 
    VikingComicIntroScene, 
    AlienCampaignScene,
    AlienComicIntroScene,
    ChallengeMenuScene,
    AchievementScene,
    SkirmishSetupScene, 
    FactionSelectScene, 
    MultiplayerSetupScene, 
    MultiplayerGameScene, 
    MultiplayerVictoryScene, 
    GameScene, 
    VictoryScene, 
    DefeatScene, 
    PauseMenuScene,
    CampaignCompleteScene,
    LeaderboardScene,
    AudioSettingsScene
  ],
  pixelArt: false,
  antialias: true,
};

const game = new Phaser.Game(config);
