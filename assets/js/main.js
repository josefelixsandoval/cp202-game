import {
  GAME_WIDTH,
  GAME_HEIGHT
} from './config.js';

var config = {
  // type: Phaser.CANVAS,
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  //width: window.innerWidth * window.devicePixelRatio,
  //height: window.innerHeight * window.devicePixelRatio,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 500
      },
      debug: false
    }
  },
  scene: {
    key: 'main',
    preload: preload,
    create: create,
    update: update
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
  /*
  plugins: {
    global: [{
      key: 'rexVirtualJoyStick',
      plugin: VirtualJoyStickPlugin,
      start: true
    }]
  }*/
};

var game = new Phaser.Game(config);

var scaleRatio = window.devicePixelRatio / 3;
var map;
var player;
var cursors;
var groundLayer;
var coinLayer;
var textScore;
var score = 0;
var audioCoin;
var audioBump;
var audioLevelUp;
var audioWrong;
var textHeader;
var donut;
var backgroundImage;
var backgroundImage2;
var buttonPlayAgain;
var buttonSeeSlides;
var graphics;
var reverseBackgroundDirection;
var joyStick;
var text;
var moveLeft;
var moveRight;
var moveUp;
var moveDown;

function preload() {
  this.load.atlas('player', '/cp202-game/assets/img/player-leaf.png', '/cp202-game/assets/img/player.json');

  this.load.image('coin', '/cp202-game/assets/img/coinGold.png');
  this.load.image('donut', '/cp202-game/assets/img/donut.png');
  this.load.image('marioBackground', '/cp202-game/assets/img/super-mario-landscape.jpg');

  this.load.spritesheet('tiles', '/cp202-game/assets/img/tiles.png', {
    frameWidth: 70,
    frameHeight: 70
  });

  this.load.tilemapTiledJSON('map', '/cp202-game/assets/img/map.json');

  this.load.audio('audioCoin', ['/cp202-game/assets/audio/coin.ogg', '/cp202-game/assets/audio/coin.mp3']);
  this.load.audio('bump', ['/cp202-game/assets/audio/bump.ogg', '/cp202-game/assets/audio/bump.mp3']);
  this.load.audio('levelUp', ['/cp202-game/assets/audio/level-up.ogg', '/cp202-game/assets/audio/level-up.mp3']);
  this.load.audio('wrong', ['/cp202-game/assets/audio/wrong.ogg', '/cp202-game/assets/audio/wrong.mp3']);

  this.load.bitmapFont('superMarioFont', '/cp202-game/assets/font/font.png', '/cp202-game/assets/font/font.fnt');

  var url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/plugins/dist/rexvirtualjoystickplugin.min.js';
  this.load.plugin('rexvirtualjoystickplugin', url, true);
}

function create() {
  backgroundImage = this.add.tileSprite(0, -464, 1440, 1080, "marioBackground").setOrigin(0);
  backgroundImage2 = this.add.tileSprite(1440, -464, 1440, 1080, "marioBackground").setOrigin(0);

  audioCoin = this.sound.add('audioCoin');
  audioBump = this.sound.add('bump');
  audioLevelUp = this.sound.add('levelUp');
  audioWrong = this.sound.add('wrong');

  donut = this.physics.add.sprite(740, 10, 'donut');
  donut.setCollideWorldBounds(true);
  donut.setBounce(0.3);

  textHeader = this.add.bitmapText(32, 120, 'superMarioFont', '', 72);
  textHeader.setText("SUPER CP202");

  map = this.make.tilemap({
    key: 'map'
  });

  var groundTiles = map.addTilesetImage('tiles');

  groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);

  groundLayer.setCollisionByExclusion([-1]);

  var coinTiles = map.addTilesetImage('coin');

  coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

  this.physics.world.bounds.width = groundLayer.width;
  this.physics.world.bounds.height = groundLayer.height;

  player = this.physics.add.sprite(100, 200, 'player');
  player.setBounce(0.2); // our player will bounce from items
  player.setCollideWorldBounds(true); // don't go out of the map

  // Small fix to our player images, we resize the physics body object slightly
  player.body.setSize(player.width, player.height - 8);

  // Player will collide with the level tiles
  this.physics.add.collider(groundLayer, player);
  this.physics.add.collider(groundLayer, donut);
  this.physics.add.collider(player, donut, collectDonut, null, this);

  coinLayer.setTileIndexCallback(17, collectCoin, this);

  // When the player overlaps with a tile with index 17, collectCoin will be called
  this.physics.add.overlap(player, coinLayer);

  // Player walk animation
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNames('player', {
      prefix: 'p1_walk',
      start: 1,
      end: 11,
      zeroPad: 2
    }),
    frameRate: 10,
    repeat: -1
  });

  // Idle with only one frame, so repeat is not neaded
  this.anims.create({
    key: 'idle',
    frames: [{
      key: 'player',
      frame: 'p1_stand'
    }],
    frameRate: 10,
  });

  cursors = this.input.keyboard.createCursorKeys();

  // set bounds so the camera won't go outside the game world
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // make the camera follow the player
  this.cameras.main.startFollow(player);

  // this textScore will show the score
  textScore = this.add.text(20, GAME_HEIGHT - 150, 'Collect all the coins...', {
    fontSize: '60px',
    fontFamily: 'Verdana',
    color: '#ffffff'
  });

  buttonPlayAgain = this.add.text(-2000, this.sys.game.canvas.height / 2, "PLAY AGAIN", {
    fontSize: '60px',
    fontFamily: 'Verdana',
    backgroundColor: '#00bfff',
    color: 'white',
    align: 'center',
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: '#000',
      blur: 0,
      stroke: false,
      fill: false
    },
    padding: {
      left: 16,
      right: 16,
      top: 16,
      bottom: 16,
    }
  });
  buttonPlayAgain.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonPlayAgain.width, buttonPlayAgain.height), Phaser.Geom.Rectangle.Contains);
  buttonPlayAgain.on('pointerdown', handleButtonPlayAgain);

  buttonSeeSlides = this.add.text(-2000, this.sys.game.canvas.height / 2, "SEE SLIDES", {
    fontSize: '60px',
    fontFamily: 'Verdana',
    backgroundColor: '#EC0C6E',
    color: 'white',
    align: 'center',
    padding: {
      left: 16,
      right: 16,
      top: 16,
      bottom: 16,
    },
  });
  buttonSeeSlides.setInteractive(new Phaser.Geom.Rectangle(0, 0, buttonSeeSlides.width, buttonSeeSlides.height), Phaser.Geom.Rectangle.Contains);
  buttonSeeSlides.on('pointerdown', handleButtonSeeSlides);

  // Fix the textScore to the camera
  textScore.setScrollFactor(0);

  if (!this.sys.game.device.os.desktop) {
    joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: GAME_WIDTH - 100,
      y: GAME_HEIGHT - 128,
      radius: 80,
      base: this.add.graphics().fillStyle(0xb12b33).fillCircle(0, 0, 80),
      thumb: this.add.graphics().fillStyle(0xf36769).fillCircle(0, 0, 40),
      dir: '4dir', // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
      // forceMin: 16,
      // enable: true
    }).on('update', handleJoyStick, this);

    text = this.add.text(200, 480);
    text.setScrollFactor(0);

    dumpJoyStickState();
  }
}

function handleJoyStick() {
  var cursorKeys = joyStick.createCursorKeys();

  console.log(cursorKeys);
  dumpJoyStickState();
}

function dumpJoyStickState() {
  var cursorKeys = joyStick.createCursorKeys();
  var s = 'Key down: ';
  for (var name in cursorKeys) {
    if (cursorKeys[name].isDown) {
      switch (name) {
        case 'left':
          moveLeft = true;
          moveRight = false;
          moveUp = false;
          moveDown = false;
          console.log('THIS IS LEFT');
          break;

        case 'right':
          moveRight = true;
          moveLeft = false;
          moveUp = false;
          moveDown = false;
          console.log('THIS IS RIGHT');
          break;

        case 'up':
          moveUp = true;
          moveLeft = false;
          moveRight = false;
          moveDown = false;
          console.log('THIS IS UP');
          break;

        case 'down':
          moveUp = false;
          moveLeft = false;
          moveRight = false;
          moveDown = true;

        default:
          moveDown = true;
          moveUp = false;
          moveLeft = false;
          moveRight = false;
      }

      s += name + ' ';
    }
  }
  s += '\n';
  s += ('Force: ' + Math.floor(joyStick.force * 100) / 100 + '\n');
  s += ('Angle: ' + Math.floor(joyStick.angle * 100) / 100 + '\n');
  text.setText(s);
}

function collectDonut() {
  console.log('collectDonut')

  if (score < 18) {
    audioWrong.play();
    textScore.setText("Collect all the coins first...")
  } else {
    audioLevelUp.play();
    donut.destroy();
    displayEndOption();
    textScore.setText();
    reverseBackgroundDirection = true;
    // textScore.setText("Wait 3 seconds for the slides...")
  }
}

function displayEndOption() {
  buttonPlayAgain.x = 60;
  buttonSeeSlides.x = 560;
}

function handleButtonPlayAgain() {
  var s = window.open('index.html', '_self');

  if (s && s.focus) {
    s.focus();
  } else if (!s) {
    window.location.href = 'index.html';
  }
}

function handleButtonSeeSlides() {
  var s = window.open('/index-netflix.html', '_self');

  if (s && s.focus) {
    s.focus();
  } else if (!s) {
    window.location.href = '/index-netflix.html';
  }
}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
  audioCoin.play();
  coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
  score++;
  textScore.setText(score); // set the textScore to show the current score

  if (score == 0) {
    textScore.setText("")
  }

  if (score == 12) {
    textScore.setText("You need 6 more coins...");
  }

  if (score == 18) {
    textScore.setText("Yay! Get the donut...");
  }

  return false;
}

function update(time, delta) {
  // Move background
  if (reverseBackgroundDirection) {
    backgroundImage.tilePositionX -= 0.4;
    backgroundImage2.tilePositionX -= 0.4;
  } else {
    backgroundImage.tilePositionX += 0.4;
    backgroundImage2.tilePositionX += 0.4;
  }

  if (cursors.left.isDown || moveLeft) {
    player.body.setVelocityX(-500);
    player.anims.play('walk', true); // walk left
    player.flipX = true; // flip the sprite to the left
  } else if (cursors.right.isDown || moveRight) {
    player.body.setVelocityX(500);
    player.anims.play('walk', true);
    player.flipX = false; // use the original sprite looking to the right
  } else if (cursors.down.isDown || moveDown) {
    player.body.setVelocityX(0);
    player.anims.play('idle', true);
  } else {
    player.body.setVelocityX(0);
    player.anims.play('idle', true);
    moveDown = true;
  }

  // Jump
  if ((cursors.up.isDown || moveUp) && player.body.onFloor()) {
    player.body.setVelocityY(-500);
    audioBump.play();
  }
}
