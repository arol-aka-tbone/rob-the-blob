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
let canDoubleJump = true;
let trophy;
let colorInverted = false;
let trophyCollected = false;

function preload() {
    // Assets are created dynamically in create()
}

function createTrophy(scene) {
    trophy = scene.add.text(60, 40, '🏆', { fontSize: '32px' });
    trophy.setOrigin(0.5, 0.5);
    trophy.setScrollFactor(0);
    scene.physics.add.existing(trophy);
    trophy.body.setImmovable(true);
    scene.physics.add.overlap(player, trophy, handleTrophyCollision, null, scene);
}

function handleTrophyCollision(scene) {
    // Toggle color scheme
    if (colorInverted) {
        scene.cameras.main.setBackgroundColor(0xffffff);
        colorInverted = false;
    } else {
        scene.cameras.main.setBackgroundColor(0x000000);
        colorInverted = true;
    }
    
    // Mark trophy as collected and hide it
    trophyCollected = true;
    trophy.setVisible(false);
}

function create() {
    // Set white background
    this.cameras.main.setBackgroundColor(0xffffff);

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

    // Create a platform block (visible rectangle)
    const platform = this.add.rectangle(400, 500, 150, 40, 0x8b4513);
    this.physics.add.existing(platform, true);
    platforms.add(platform);

    // Create a second platform on the right side
    const platform2 = this.add.rectangle(650, 350, 120, 40, 0x8b4513);
    this.physics.add.existing(platform2, true);
    platforms.add(platform2);

    // Create a third platform in the center (maintaining height ratio)
    const platform3 = this.add.rectangle(400, 200, 140, 40, 0x8b4513);
    this.physics.add.existing(platform3, true);
    platforms.add(platform3);

    // Create ground - green bar at the bottom
    const ground = this.add.rectangle(400, 570, 800, 60, 0x00aa00);
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    // Create trophy
    createTrophy(this);

    // Handle collisions with platforms and reset double-jump on ground contact
    this.physics.add.collider(player, platforms, () => {
        canDoubleJump = true;
        // Respawn trophy when blob touches ground after collecting it
        if (trophyCollected) {
            trophy.setVisible(true);
            trophyCollected = false;
        }
    });

    // Setup keyboard input
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => {
        if (player.body.touching.down) {
            // Normal jump from ground
            player.body.setVelocityY(-250);
            canDoubleJump = true;
        } else if (canDoubleJump) {
            // Double jump in the air
            player.body.setVelocityY(-250);
            canDoubleJump = false;
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

    // Reset double jump when touching ground (for safety)
    if (player.body.touching.down) {
        canDoubleJump = true;
    }
}
