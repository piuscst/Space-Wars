class Main extends Phaser.Scene {

    constructor() {
        super("MainScene")
    }

    preload() {
        this.load.setPath("./assets/")

        // -- Sprites --

        // Player Sprites
        this.load.image("PlayerShip1", "playerShip1_blue.png")
        this.load.image("PlayerShip2", "playerShip2_blue.png")
        this.load.image("PlayerShip3", "playerShip3_blue.png")
        this.load.image("PlayerBullet", "laserBlue16.png")
        this.load.image("PlayerBullet2", "laserBlue08.png")
        this.load.image("PlayerShield", "powerupBlue_shield.png")
        this.load.image("PlayerLife", "playerLife1_blue.png")
        this.load.image("PlayerShieldPowerUp", "powerupBlue_shield.png")
        this.load.image("PlayerShield", "shield3.png")

        // Enemy Sprites
        this.load.image("EnemyShip1", "enemyRed1.png")
        this.load.image("EnemyShip2", "enemyRed2.png")
        this.load.image("EnemyShip3", "enemyGreen3.png")
        this.load.image("EnemyBullet", "laserRed16.png")

        // Boss Sprites

        // -- SFX --
        this.load.audio("sfxHit", "hit_sfx.ogg")
        this.load.audio("sfxUpgrade", "upgrade_sfx.mp3")

    }

    create() {
        this.enemies = []
        this.wave = 0
        this.waveInProgress = false
        this.score = 0
        this.displayedScore = 0
        this.debug = false

        // Stars!
        this.generateStarTexture("stars1", 3, 150)   // small, lots of stars
        this.generateStarTexture("stars2", 5, 60)    // bigger, fewer stars
        this.stars1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "stars1")
        this.stars1.setOrigin(0, 0)
        this.stars2 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "stars2")
        this.stars2.setOrigin(0, 0)

        this.player = new StarterShip(this, 400, 695)
        this.waveManager = new WaveManager(this)
        this.waveManager.startNextWave()
    }

    update(time, delta) {
        this.player.update(time, delta)
        this.waveManager.update(time, delta)

        // Parallax Effect
        this.stars1.tilePositionY -= 0.5
        this.stars2.tilePositionY -= 0.8

        this.checkCollisions()

        // Start next wave when current one clears
        if (this.waveManager.waveComplete) {
            this.waveManager.waveComplete = false
            this.time.delayedCall(1500, () => {
                this.waveManager.startNextWave()
            })
        }
    }

    checkCollisions() {

        for (const bullet of this.player.bullets) {
            if (!bullet.alive) continue
            for (const enemy of this.waveManager.enemies) {
                if (!enemy.alive) continue
                if (this.overlaps(bullet, enemy)) {
                    bullet.alive = false
                    const died = enemy.takeDamage(bullet.damage)
                    if (died) {
                        this.score += enemy.points
                    }
                }
            }
        }

        for (const enemy of this.waveManager.enemies) {
            for (const bullet of enemy.bullets) {
                if (!bullet.alive) continue
                if (!this.player.alive) continue
                if (this.overlaps(bullet, this.player)) {
                    bullet.alive = false
                    this.player.takeDamage(bullet.damage)
                }
            }
        }
    }

    overlaps(a, b) {
        const ba = a.getBounds()
        const bb = b.getBounds()
        return Phaser.Geom.Intersects.RectangleToRectangle(ba, bb)
    }

    generateStarTexture(key, starSize, starCount) {
        const w = this.scale.width
        const h = this.scale.height

        const graphics = this.make.graphics({ x: 0, y: 0, add: false })

        for (let i = 0; i < starCount; i++) {
            const x = Phaser.Math.Between(0, w)
            const y = Phaser.Math.Between(0, h)
            const shapeRoll = Phaser.Math.Between(1, 2)
            const alpha = Phaser.Math.FloatBetween(0.3, 0.8)
            graphics.fillStyle(0xffffff, alpha)

            if (shapeRoll === 1) {
                graphics.fillRect(x, y, starSize, starSize)
            } else if (shapeRoll === 2) {
                graphics.fillCircle(x, y, starSize, starSize)
            }
        }

        graphics.generateTexture(key, w, h)
        graphics.destroy()
    }
}