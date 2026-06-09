class Main extends Phaser.Scene {

    constructor() {
        super("MainScene")
    }

    preload() {
        this.load.setPath("./assets/")

        // Player Sprites
        this.load.image("PlayerShip1", "playerShip1_blue.png")
        this.load.image("PlayerShip2", "playerShip2_blue.png")
        this.load.image("PlayerShip3", "playerShip3_blue.png")
        this.load.image("PlayerBullet", "laserBlue16.png")
        this.load.image("PlayerBullet2", "laserBlue08.png")
        this.load.image("PlayerLife", "playerLife1_blue.png")
        this.load.image("PlayerShieldPowerUp", "powerupBlue_shield.png")
        this.load.image("PlayerShield", "shield3.png")
        this.load.image("PlayerHealthPowerUp", "pill_red.png")

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

        this.load.image("cockpitYellow", "cockpitYellow_4.png")
        this.load.image("wingYellow", "wingYellow_0.png")

        this.load.image("cockpitRed", "cockpitRed_3.png")
        this.load.image("wingRed", "wingRed_7.png")

        this.load.image("gun00", "gun00.png")
        this.load.image("gun05", "gun05.png")
        this.load.image("beam", "beam6.png")

        // SFX
        this.load.audio("sfxHit", "impactMetal_004.ogg")
        this.load.audio("sfxLaser", "laserSmall_004.ogg")
        this.load.audio("sfxShield", "forceField_003.ogg")
        this.load.audio("sfxDeath", "explosionCrunch_000.ogg")
        this.load.audio("sfxUpgrade", "upgrade_sfx.mp3")
        this.load.audio("bgm", "serhii_kliets-spaceship-arcade-shooter-game-background-soundtrack-318508.mp3")
    }

    create() {
        this.enemies = []
        this.pickups = []
        this.wave = 0
        this.waveInProgress = false
        this.score = 0
        this.displayedScore = 0
        this.debug = false
        this.gameEnded = false   // prevent double-triggering game over / win

        // Stars
        this._makeStars(400)

        this.player = new StarterShip(this, 400, 695)
        this.waveManager = new WaveManager(this)
        this.waveManager.startNextWave()

        this.lifeIcons = []
        this.renderLives()
        this.lastHp = this.player.hp
        this.shieldIcons = []
        this.updateShieldHUD()

        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        })

        this.music = this.sound.add("bgm", { loop: true, volume: 0.1 })
        this.music.play()

        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => this.skipWave())
    }

    update(time, delta) {
        if (this.gameEnded) return

        this.player.update(time, delta)
        this.waveManager.update(time, delta)

        for (const s of this.stars) {
            s.obj.y += s.speed
            if (s.obj.y > this.scale.height + 4) s.obj.y = -4
        }

        this.checkCollisions()

        for (const p of this.pickups) p.update(delta)
        this.pickups = this.pickups.filter(p => p.alive)

        if (this.waveManager.waveComplete) {
            this.waveManager.waveComplete = false
            this.time.delayedCall(1500, () => {
                // All waves done = win
                if (this.waveManager.currentWave >= WAVES.length && !this.gameEnded) {
                    this.endGame("win")
                } else {
                    this.waveManager.startNextWave()
                }
            })
        }

        // Player death = game over
        if (!this.player.alive && !this.gameEnded) {
            this.endGame("lose")
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

    endGame(result) {
        if (this.gameEnded) return
        this.gameEnded = true
        if (this.music) this.music.stop()

        this.cameras.main.fadeOut(600, 0, 0, 0)
        this.cameras.main.once("camerafadeoutcomplete", () => {
            if (result === "win") {
                this.scene.start("WinScene", { score: this.score })
            } else {
                this.scene.start("GameOverScene", { score: this.score })
            }
        })
    }

    checkCollisions() {
        const player = this.player

        for (const enemy of this.waveManager.enemies) {
            // Skip bosses in the generic enemy checks below — handled separately
            if (enemy instanceof Boss1 || enemy instanceof Boss2 || enemy instanceof Boss3) continue
            // Skip minions in generic body-vs-player (handled in Boss2 minion section)
            if (enemy instanceof Boss2Minion) continue

            // Enemy bullets vs player
            for (const bullet of enemy.bullets) {
                if (!bullet.alive || !player.alive) continue
                if (this.overlaps(bullet, player)) {
                    bullet.alive = false
                    player.takeDamage(bullet.damage)
                }
            }

            // Enemy body vs player
            if (!player.alive) continue
            if (enemy.alive && this.overlaps(enemy, player)) {
                enemy.die()
                player.takeDamage(1)
            }
        }

        // Player bullets vs regular enemies
        for (const bullet of player.bullets) {
            if (!bullet.alive) continue
            for (const enemy of this.waveManager.enemies) {
                if (!enemy.alive) continue
                if (enemy instanceof Boss1 || enemy instanceof Boss2 || enemy instanceof Boss3) continue
                if (enemy instanceof Boss2Minion) continue
                if (this.overlaps(bullet, enemy)) {
                    bullet.alive = false
                    const died = enemy.takeDamage(bullet.damage)
                    if (!died) { enemy.flash(); this.sound.play("sfxHit", { volume: 0.25 }) }   
                    if (died) {
                        this.sound.play("sfxDeath", { volume: 0.4 })
                        let multiplier = 1
                        if (enemy.state === "diving" || enemy.state === "charging") multiplier = 2
                        if (enemy.state === "looping") multiplier = 3
                        if (Math.random() < 0.12) this.pickups.push(new ShieldPickup(this, enemy.x, enemy.y))
                        if (Math.random() < 0.06) this.pickups.push(new HealthPickup(this, enemy.x, enemy.y))
                        const points = enemy.points * multiplier
                        this.score += points
                        this.showFloatingScore(enemy.x, enemy.y, points, multiplier)
                    }
                }
            }
        }

        // ---- Boss2Minion collisions ----
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof Boss2Minion)) continue

            // Minion bullets vs player (pop-shot on death)
            for (const bullet of enemy.bullets) {
                if (!bullet.alive || !player.alive) continue
                if (this.overlaps(bullet, player)) {
                    bullet.alive = false
                    player.takeDamage(bullet.damage)
                }
            }

            // Minion body vs player (ram damage)
            if (player.alive && enemy.alive && this.overlaps(enemy, player)) {
                enemy.die()
                player.takeDamage(1)
            }
        }

        // Player bullets vs minions
        for (const bullet of player.bullets) {
            if (!bullet.alive) continue
            for (const enemy of this.waveManager.enemies) {
                if (!(enemy instanceof Boss2Minion) || !enemy.alive) continue
                if (this.overlaps(bullet, enemy)) {
                    bullet.alive = false
                    const died = enemy.takeDamage(bullet.damage)
                    if (!died) { enemy.flash(); this.sound.play("sfxHit", { volume: 0.25 }) }  
                    if (died) {
                        this.score += enemy.points
                        this.showFloatingScore(enemy.x, enemy.y, enemy.points, 1)
                    }
                }
            }
        }

        // ---- Boss1 collisions (unchanged from your original) ----
        this._bossBulletVsPlayer(Boss1)
        this._playerBulletsVsBossParts(Boss1)
        this._bossBodyVsPlayer(Boss1)

        // ---- Boss2 collisions ----
        // Boss2 bullet pop-shots from minions come through boss.bullets already
        this._bossBulletVsPlayer(Boss2)
        this._playerBulletsVsBossParts(Boss2)
        this._bossBodyVsPlayer(Boss2)

        // ---- Boss3 collisions ----
        this._bossBulletVsPlayer(Boss3)
        this._playerBulletsVsBossParts(Boss3)
        // Boss3 rams player — check body overlap and deal contact damage
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof Boss3) || !enemy.alive || !player.alive) continue
            if (enemy.ramState === "ramming" && !enemy.ramHitPlayer &&
                Phaser.Geom.Intersects.RectangleToRectangle(
                    enemy.cockpit.getBounds(), player.getBounds())) {
                enemy.ramHitPlayer = true        // <- only once per ram
                player.takeDamage(2)
            }
        }

        // Pickups vs player
        for (const p of this.pickups) {
            if (!p.alive || !player.alive) continue
            if (this.overlaps(p, player)) {
                p.die()
                if (p instanceof HealthPickup) {
                    player.heal(1)
                } else {
                    player.addShield(1)
                }
                if (this.sound) this.sound.play("sfxUpgrade")
            }
        }
    }

    // ---- Shared boss collision helpers ----

    _bossBulletVsPlayer(BossClass) {
        const player = this.player
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof BossClass)) continue
            for (const bullet of enemy.bullets) {
                if (!bullet.alive || !player.alive) continue
                if (this.overlaps(bullet, player)) {
                    bullet.alive = false
                    player.takeDamage(bullet.damage)
                }
            }
        }
    }

    _playerBulletsVsBossParts(BossClass) {
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof BossClass)) continue

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
                        if (died) this.sound.play("sfxDeath", { volume: 0.35 })
                        else      this.sound.play("sfxHit",   { volume: 0.2 })
                        hit = true
                        if (died || !gun.alive) {
                            const pts = Math.round(enemy.points * 0.05)
                            this.score += pts
                            this.showFloatingScore(gun.sprite.x, gun.sprite.y, pts, 1)
                        }
                        break
                    }
                }

                if (!hit) {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.cockpit.getBounds())) {
                        bullet.alive = false
                        enemy.cockpit.takeDamage(bullet.damage)
                        enemy.cockpit.flash()
                        this.sound.play("sfxHit", { volume: 0.2 })

                        if (!enemy.cockpit.alive && !enemy.scored) {
                            enemy.scored = true
                            this.sound.play("sfxDeath", { volume: 0.5 })   // boss death — louder
                            this.score += enemy.points
                            this.showFloatingScore(enemy.x, enemy.y, enemy.points, 1)
                        }
                    }
                }
            }
        }
    }

    _bossBodyVsPlayer(BossClass) {
        const player = this.player
        for (const enemy of this.waveManager.enemies) {
            if (!(enemy instanceof BossClass) || !enemy.alive || !player.alive) continue
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                enemy.cockpit.getBounds(), player.getBounds())) {
                player.takeDamage(2)
            }
        }
    }

    showFloatingScore(x, y, points, multiplier) {
        const color = multiplier >= 3 ? '#ffff00' : multiplier === 2 ? '#ff9900' : '#ffffff'
        const text  = multiplier > 1 ? `+${points} x${multiplier}!` : `+${points}`
        const ft = this.add.text(x, y, text, {
            fontSize: '20px', fill: color, fontFamily: 'monospace',
            stroke: '#000000', strokeThickness: 3
        })
        this.tweens.add({
            targets: ft, y: y - 60, alpha: 0, duration: 800, ease: 'Power2',
            onComplete: () => ft.destroy()
        })
    }

    overlaps(a, b) {
        return Phaser.Geom.Intersects.RectangleToRectangle(a.getBounds(), b.getBounds())
    }

    renderLives() {
        for (const icon of this.lifeIcons) icon.destroy()
        this.lifeIcons = []
        const margin = 16, spacing = 40, baseY = this.scale.height - margin
        for (let i = 0; i < this.player.hp; i++) {
            const icon = this.add.image(margin + i * spacing, baseY, "PlayerLife").setOrigin(0, 1)
            this.lifeIcons.push(icon)
        }
    }

    updateShieldHUD() {
        for (const icon of this.shieldIcons) icon.destroy()
        this.shieldIcons = []
        const margin = 16, spacing = 40
        const baseX = this.scale.width - margin, baseY = this.scale.height - margin
        for (let i = 0; i < this.player.shieldCount; i++) {
            const icon = this.add.image(baseX - i * spacing, baseY, "PlayerShieldPowerUp").setOrigin(1, 1).setScale(1)
            this.shieldIcons.push(icon)
        }
    }

    skipWave() {
        for (const enemy of this.waveManager.enemies) enemy.die()
        this.waveManager.enemies = []
        this.waveManager.spawnedEnemies = this.waveManager.expectedEnemies
        this.waveManager.waveInProgress = false
        this.waveManager.waveComplete = true
    }

    _makeStars(count) {
        this.stars = []
        const w = this.scale.width, h = this.scale.height
        for (let i = 0; i < count; i++) {
            const sz = Math.random() < 0.3 ? 2 : 1
            const s = this.add.rectangle(
                Math.random() * w, Math.random() * h,
                sz, sz, 0xffffff, 0.3 + Math.random() * 0.6
            )
            this.stars.push({ obj: s, speed: 0.3 + Math.random() * 0.8 })
        }
    }
}