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
let trophyJustCollected = false;
let trophyX = 60;
let trophyY = 200;
let leftEye;
let rightEye;
let trophyCount = 0;
let trophyCountDisplay;
let backgroundMusic;

function preload() {
    // Assets are created dynamically in create()
    // Load audio
    this.load.audio('theme', 'rob-main-theme.mp3');
}

function createBlobFace(scene, blob) {
    // Create left eye (open)
    leftEye = scene.add.circle(blob.x - 7, blob.y - 5, 3, 0x000000);
    // Create right eye (open)
    rightEye = scene.add.circle(blob.x + 7, blob.y - 5, 3, 0x000000);
    
    // Create closed eyes (slits/lines) using text
    const closedLeftEye = scene.add.text(blob.x - 7, blob.y - 5, '–', { fontSize: '16px', color: '#000000' });
    closedLeftEye.setOrigin(0.5, 0.5);
    closedLeftEye.setVisible(false);
    
    const closedRightEye = scene.add.text(blob.x + 7, blob.y - 5, '–', { fontSize: '16px', color: '#000000' });
    closedRightEye.setOrigin(0.5, 0.5);
    closedRightEye.setVisible(false);
    
    // Create smile
    const smile = scene.add.text(blob.x, blob.y + 8, '︶', { fontSize: '18px', color: '#000000' });
    smile.setOrigin(0.5, 0.5);
    
    // Store references on blob object
    blob.face = { leftEye, rightEye, closedLeftEye, closedRightEye, smile };
    blob.isJumping = false;
}

function updateBlobFace(blob) {
    // Check if jumping
    blob.isJumping = !blob.body.touching.down;
    
    // Update eye appearance based on jump state
    if (blob.isJumping) {
        // Show closed eyes, hide open eyes
        blob.face.leftEye.setVisible(false);
        blob.face.rightEye.setVisible(false);
        blob.face.closedLeftEye.setVisible(true);
        blob.face.closedRightEye.setVisible(true);
    } else {
        // Show open eyes, hide closed eyes
        blob.face.leftEye.setVisible(true);
        blob.face.rightEye.setVisible(true);
        blob.face.closedLeftEye.setVisible(false);
        blob.face.closedRightEye.setVisible(false);
    }
    
    // Update positions to follow blob
    blob.face.leftEye.x = blob.x - 7;
    blob.face.leftEye.y = blob.y - 5;
    blob.face.rightEye.x = blob.x + 7;
    blob.face.rightEye.y = blob.y - 5;
    blob.face.closedLeftEye.x = blob.x - 7;
    blob.face.closedLeftEye.y = blob.y - 5;
    blob.face.closedRightEye.x = blob.x + 7;
    blob.face.closedRightEye.y = blob.y - 5;
    blob.face.smile.x = blob.x;
    blob.face.smile.y = blob.y + 8;
}

function createTrophy(scene) {
    trophy = scene.add.text(trophyX, trophyY, '🏆', { fontSize: '32px' });
    trophy.setOrigin(0.5, 0.5);
    trophy.setScrollFactor(0);
    trophy.setAlpha(1);
    trophy.setDepth(100);
}

function handleTrophyCollision(scene) {
    if (trophyCollected) return;
    
    // Increment trophy counter
    trophyCount++;
    trophyCountDisplay.setText(`Trophies: ${trophyCount}`);
    
    // Grow the blob by 1.2x
    const newScale = player.scale * 1.2;
    player.setScale(newScale);
    
    // Mark trophy as collected and flag for audio speed increase when touching ground
    trophyCollected = true;
    trophyJustCollected = true;
    trophy.setAlpha(0);
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
    
    // Add face to blob
    createBlobFace(this, player);

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
    
    // Create trophy counter display in upper right corner
    trophyCountDisplay = this.add.text(750, 40, `Trophies: ${trophyCount}`, { fontSize: '16px', color: '#000000' });
    trophyCountDisplay.setOrigin(1, 0);
    trophyCountDisplay.setScrollFactor(0);
    trophyCountDisplay.setDepth(100);

    // Play background music on loop
    backgroundMusic = this.sound.play('theme', { loop: true, volume: 1.0 });

    // Handle collisions with platforms and reset double-jump on ground contact
    this.physics.add.collider(player, platforms, () => {
        canDoubleJump = true;
        // Respawn trophy when blob touches ground after collecting it
        if (trophyCollected) {
            trophyCollected = false;
            // Increase audio speed if trophy was just collected
            if (trophyJustCollected) {
                const newRate = backgroundMusic.rate * 1.2;
                backgroundMusic.setRate(newRate);
                trophyJustCollected = false;
            }
            // Fade in the trophy
            trophy.setAlpha(0);
            this.tweens.add({
                targets: trophy,
                alpha: 1,
                duration: 300,
                ease: 'Power1'
            });
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
    // Update blob face based on state
    updateBlobFace(player);
    
    // Check collision with trophy manually (blob must move 80px away to reset collision)
    const distance = Phaser.Math.Distance.Between(player.x, player.y, trophyX, trophyY);
    
    if (trophyCollected && distance > 80) {
        // Trophy collected and blob moved away - allow re-collision and respawn trophy
        trophyCollected = false;
        trophyJustCollected = false;
        trophy.setAlpha(1);
    }
    
    if (distance < 40 && !trophyCollected) {
        handleTrophyCollision(this);
    }

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
