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
        this.load.image("EnemyShip2", "enemyBlue2.png")
        this.load.image("EnemyShip3", "enemyGreen3.png")
        this.load.image("EnemyBullet", "laserRed16.png")

        // Boss Sprites
        this.load.image("cockpitBlue", "cockpitBlue_0.png")
        this.load.image("wingBlue", "wingBlue_4.png")
        this.load.image("gun00", "gun00.png")
        this.load.image("gun05", "gun05.png")
        this.load.image("beam", "beam6.png")

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

        // Score text
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        })

        // Skip wave for debugging
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => this.skipWave())
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

        if (this.displayedScore < this.score) {
            this.displayedScore += Math.ceil((this.score - this.displayedScore) / 150)
            if (this.displayedScore > this.score) this.displayedScore = this.score
        }

        this.scoreText.setText('SCORE: ' + this.displayedScore)
    }

    checkCollisions() {
        // Enemy body vs player + enemy bullets vs player
        for (const enemy of this.waveManager.enemies) {
            if (enemy instanceof Boss1) continue

            // Bullet vs player
            for (const bullet of enemy.bullets) {
                if (!bullet.alive) continue
                if (!this.player.alive) continue
                if (this.overlaps(bullet, this.player)) {
                    bullet.alive = false
                    this.player.takeDamage(bullet.damage)
                }
            }

            // Enemy body vs player
            if (!this.player.alive) continue
            if (enemy.alive && this.overlaps(enemy, this.player)) {
                enemy.die()
                this.player.takeDamage(1)
            }
        }

        for (const bullet of this.player.bullets) {
            if (!bullet.alive) continue
            for (const enemy of this.waveManager.enemies) {
                if (!enemy.alive) continue
                if (enemy instanceof Boss1) continue
                if (this.overlaps(bullet, enemy)) {
                    bullet.alive = false
                    const died = enemy.takeDamage(bullet.damage)
                    if (died) {
                        let multiplier = 1
                        if (enemy.state === "diving" || enemy.state === "charging") multiplier = 2
                        if (enemy.state === "looping") multiplier = 3
                        const points = enemy.points * multiplier
                        this.score += points
                        this.showFloatingScore(enemy.x, enemy.y, points, multiplier)
                    }
                }
            }
        }

        // Boss bullets vs player
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof Boss1)) continue
            for (const bullet of enemy.bullets) {
                if (!bullet.alive) continue
                if (!this.player.alive) continue
                if (this.overlaps(bullet, this.player)) {
                    bullet.alive = false
                    this.player.takeDamage(bullet.damage)
                }
            }
        }

        // Player bullets vs boss parts
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof Boss1)) continue

            for (const bullet of this.player.bullets) {
                if (!bullet.alive) continue
                let hit = false

                // Check guns first
                for (const gun of enemy.guns) {
                    if (!gun.alive) continue
                    if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), gun.getBounds())) {
                        bullet.alive = false
                        gun.takeDamage(bullet.damage)
                        hit = true
                        break
                    }
                }

                // Check cockpit only if didn't hit a gun
                if (!hit) {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.cockpit.getBounds())) {
                        bullet.alive = false
                        enemy.cockpit.takeDamage(bullet.damage)
                        console.log(enemy.cockpit.hp)
                    }
                }
            }
        }

        // Boss body vs player
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof Boss1)) continue
            if (!this.player.alive) continue
            if (enemy.alive && Phaser.Geom.Intersects.RectangleToRectangle(
                enemy.cockpit.getBounds(), this.player.getBounds())) {
                this.player.takeDamage(2)
            }
        }
    }

    showFloatingScore(x, y, points, multiplier) {
        const color = multiplier >= 3 ? '#ffff00' : multiplier === 2 ? '#ff9900' : '#ffffff'
        const text = multiplier > 1 ? `+${points} x${multiplier}!` : `+${points}`
        
        const floatingText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: color,
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 3
        })

        this.tweens.add({
            targets: floatingText,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        })
    }

    overlaps(a, b) {
        const ba = a.getBounds()
        const bb = b.getBounds()
        return Phaser.Geom.Intersects.RectangleToRectangle(ba, bb)
    }

    skipWave() {
        // Kill all enemies
        for (const enemy of this.waveManager.enemies) {
            enemy.die()
        }
        this.waveManager.enemies = []
        this.waveManager.spawnedEnemies = this.waveManager.expectedEnemies
        this.waveManager.waveInProgress = false
        this.waveManager.waveComplete = true
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