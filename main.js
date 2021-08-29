Moralis.initialize("xWWjxNj8ugUJStkeUzqbKa28NVBmn0ef4tsD0FE9");
Moralis.serverURL = "https://dw1mtjavebcw.moralisweb3.com:2053/server";


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
            default: 'arcade',
            arcade: {
                    gravity: { y: 300 },
                    debug: false
            }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
};

var game;

var platforms; 
var space = 38;  
var player;
var competitors = {};
var jumpHeight = -350; 
var score = 0;
var scoreText;
var cursors;


function launch(){

    let user = Moralis.User.current();
    if (!user) {
      console.log("Please log-in with Metamask!");
      }
    else{
        console.log(user.get('ethAddress') + " " + "logged in!");
        game = new Phaser.Game(config);
    }  
}

launch();

//load asset
function preload ()
{
    this.load.image('background', 'assets/backup.png');
    this.load.image('groundLeft', 'assets/TilesB/Asset285.png');
    this.load.image('groundRight', 'assets/TilesB/Asset 284.png');
    this.load.image('ground', 'assets/TilesB/Asset 361.png');

    this.load.image('coin', 'assets/coin.png');
    this.load.image('bomb', 'assets/bomb.png');
   
    this.load.spritesheet('dude', 
    'assets/dude.png',
    { frameWidth: 32, frameHeight: 48 }
    );

    this.load.audio('theme', [
        'assets/audio/GamePlay_WM_01.mp3'
    ]);

    this.load.audio('jump', [
        'assets/audio/playerJump.mp3'
    ]);

    this.load.audio('collect', [
        'assets/audio/coinCollect.mp3'
    ]);

}

//init setup 
async function create ()
{
   

    this.add.image(400, 300, 'background').setScale(0.6);

    platforms = this.physics.add.staticGroup();

    platforms.create(80, 400, 'groundLeft').setScale(0.3).refreshBody();
    platforms.create(80 + space, 400, 'groundRight').setScale(0.3).refreshBody();

    platforms.create(250, 300, 'groundLeft').setScale(0.3).refreshBody();
    platforms.create(250 + space, 300, 'groundRight').setScale(0.3).refreshBody();

    platforms.create(425, 450, 'groundLeft').setScale(0.3).refreshBody();
    platforms.create(425 + space, 450, 'groundRight').setScale(0.3).refreshBody();

    platforms.create(600, 160, 'groundLeft').setScale(0.3).refreshBody();
    platforms.create(600 + space, 160, 'groundRight').setScale(0.3).refreshBody();

    //base ground
    for(let i = 0; i < 100; i++){
        platforms.create(i * 38, 580, 'ground').setScale(0.3).refreshBody();
    }

    player = this.physics.add.sprite(100, 450, 'dude');
    
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    var music = this.sound.add('theme');
    music.play();

    //player animation
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();
   
    coins = this.physics.add.group({
        key: 'coin',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
       
    });

    coins.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(bombs, platforms);

    this.physics.add.overlap(player, coins, collectCoin, null, this);
    
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    function collectCoin (player, coin)
{
    var collected = this.sound.add('collect');
    collected.play();

    coin.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    if (coins.countActive(true) === 0)
    {
        coins.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);
           

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    }
}
    
/*
    let user = Moralis.User.current();
    let query = new Moralis.Query('PlayerPosition');
    let subscription = await query.subscribe();
    subscription.on('create', (plocation) => {
      if(plocation.get("player") != user.get("ethAddress")){

        // if first time seeing
        if(competitors[plocation.get("player")] == undefined){
          // create a sprite
          competitors[plocation.get("player")] = this.add.image( plocation.get("x"), plocation.get("y"), 'player').setScale(0.3);
        }
        else{
          competitors[plocation.get("player")].x = plocation.get("x");
          competitors[plocation.get("player")].y = plocation.get("y");
        }

        console.log("someone moved!")
        console.log(plocation.get("player"))
        console.log("new X ", plocation.get("x"))
        console.log("new Y ", plocation.get("y"))
      }
    });
  */  
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}

// Game loop - 60fps
async function update ()
{
   
    if (cursors.left.isDown)
        {
            player.setVelocityX(-160);

            player.anims.play('left', true);
        }
    else if (cursors.right.isDown)
        {
            player.setVelocityX(160);

            player.anims.play('right', true);
        }
    else
        {
            player.setVelocityX(0);

            player.anims.play('turn');
        }

    if (cursors.up.isDown && player.body.touching.down)
        {
            player.setVelocityY(jumpHeight);
            let jump = this.sound.add('jump');
            jump.play();
        }

    /*
    //2player enable
   if(player.lastX!=player.x || player.lastY!=player.y){
       let user = Moralis.User.current();

       const PlayerPosition = Moralis.Object.extend("PlayerPosition");
       const playerPosition = new PlayerPosition();

       playerPosition.set("player", user.get('ethAddress'));
       playerPosition.ser('x', player.x);
       playerPosition.set('y', player.y);

       player.lastX = player.x;
       player.lastY = player.y;

       await playerPosition.save();
   }
    */       

   
}

async function login() {
    let user = Moralis.User.current();
    if (!user) {
      user = await Moralis.Web3.authenticate();
      launch();

      $('#btn-login').hide();
      $('#btn-logout').show();
      }

    console.log("logged in user:", user);
  }

  Moralis.Web3.onAccountsChanged( async ([account]) =>{
      console.log("ACCOUNTS CHANGED");
      console.log(account);

      alert("DO YOU WANT TO MERGE?");

      var user = await Moralis.Web3.link(account);
      console.log(user);
  })
  
async function logOut() {
    await Moralis.User.logOut();
    
    $('#btn-login').show();
    $('#btn-logout').hide();

    location.reload();
  
    console.log("logged out");
  }

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;