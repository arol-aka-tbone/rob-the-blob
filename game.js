const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
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
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let platforms;

function preload() {
    // Assets are created dynamically in create()
}

function create() {
    // Enable world bounds collision
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create the player - a red blob (circle)
    player = this.add.circle(100, 450, 20, 0xff0000);
    this.physics.add.existing(player);
    player.body.setBounce(0.2);
    player.body.setCollideWorldBounds(true);
    player.body.setMaxVelocity(200, 500);

    // Create a static group for platforms
    platforms = this.physics.add.staticGroup();

    // Create a platform block
    const platform = platforms.create(400, 500, null);
    platform.setDisplaySize(150, 40);
    platform.setFillStyle(0x8b4513);

    // Create a second platform on the right side
    const platform2 = platforms.create(650, 350, null);
    platform2.setDisplaySize(120, 40);
    platform2.setFillStyle(0x8b4513);

    // Create ground
    const ground = platforms.create(400, 570, null);
    ground.setDisplaySize(800, 60);
    ground.setFillStyle(0x8B7355);

    // Handle collisions with platforms
    this.physics.add.collider(player, platforms);

    // Setup keyboard input
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => {
        if (player.body.touching.down) {
            player.body.setVelocityY(-250);
        }
    });
}

function update() {
    // Left/right movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(160);
    } else {
        player.body.setVelocityX(0);
    }

    // Prevent player from going off screen horizontally
    if (player.x < 20) {
        player.x = 20;
        player.body.setVelocityX(0);
    } else if (player.x > 780) {
        player.x = 780;
        player.body.setVelocityX(0);
    }
}
