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
        this.load.image("PlayerLife", "playerLife1_blue.png")
        // Power Ups and Shield
        this.load.image("PlayerShieldPowerUp", "powerupBlue_shield.png")
        this.load.image("PlayerShield", "shield3.png")

        // Enemy Sprites
        this.load.image("EnemyShip1", "enemyRed1.png")
        this.load.image("EnemyShip1_Upgraded", "enemyRed3.png")
        this.load.image("EnemyShip2", "enemyBlue2.png")
        this.load.image("EnemyShip2_Upgraded", "enemyBlue4.png")
        this.load.image("EnemyShip3", "enemyGreen3.png")
        this.load.image("EnemyShip3_Upgraded", "enemyGreen5.png")
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
        this.pickups = []
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

        this.lifeIcons = []
        this.renderLives()
        this.lastHp = this.player.hp
        this.shieldIcons = []
        this.updateShieldHUD()

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

        for (const p of this.pickups) p.update(delta)
        this.pickups = this.pickups.filter(p => p.alive)

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

        if (this.player.hp !== this.lastHp) {
            this.lastHp = this.player.hp
            this.renderLives()
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
                    if (!died) enemy.flash()
                    if (died) {
                        let multiplier = 1
                        if (enemy.state === "diving" || enemy.state === "charging") multiplier = 2
                        if (enemy.state === "looping") multiplier = 3
                        if (Math.random() < 0.12) {
                            this.pickups.push(new ShieldPickup(this, enemy.x, enemy.y))
                        }
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
                        const died = gun.takeDamage(bullet.damage)
                        gun.flash()
                        hit = true

                        // Award points when a gun is destroyed
                        if (died || !gun.alive) {
                            const gunPoints = Math.round(enemy.points * 0.05)
                            this.score += gunPoints
                            this.showFloatingScore(gun.sprite.x, gun.sprite.y, gunPoints, 1)
                        }
                        break
                    }
                }

                // Check cockpit only if didn't hit a gun
                if (!hit) {
                    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.cockpit.getBounds())
                        if (overlap) {
                            bullet.alive = false
                            enemy.cockpit.takeDamage(bullet.damage)
                            enemy.cockpit.flash()

                        // Award score when this hit finishes the boss
                        if (!enemy.cockpit.alive && !enemy.scored) {
                            enemy.scored = true
                            this.score += enemy.points
                            this.showFloatingScore(enemy.x, enemy.y, enemy.points, 1)
                        }
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

        for (const p of this.pickups) {
            if (!p.alive) continue
            if (!this.player.alive) continue
            if (this.overlaps(p, this.player)) {
                p.die()
                this.player.addShield(1)
                if (this.sound) this.sound.play("sfxUpgrade")  // you already load this
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

    renderLives() {
        // Clear any existing icons
        for (const icon of this.lifeIcons) icon.destroy()
        this.lifeIcons = []

        const margin   = 16
        const spacing  = 40   // gap between icons
        const baseY    = this.scale.height - margin

        for (let i = 0; i < this.player.hp; i++) {
            const icon = this.add.image(
                margin + i * spacing,
                baseY,
                "PlayerLife"
            )
            icon.setOrigin(0, 1)   // anchor bottom-left so it sits on the corner
            this.lifeIcons.push(icon)
        }
    }

    updateShieldHUD() {
        for (const icon of this.shieldIcons) icon.destroy()
        this.shieldIcons = []

        const margin  = 16
        const spacing = 40
        const baseX   = this.scale.width - margin   // right edge
        const baseY   = this.scale.height - margin  // bottom edge

        for (let i = 0; i < this.player.shieldCount; i++) {
            const icon = this.add.image(baseX - i * spacing, baseY, "PlayerShieldPowerUp")
            icon.setOrigin(1, 1)        // anchor bottom-right
            icon.setScale(1)
            this.shieldIcons.push(icon)
        }
    }

    // For testing
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