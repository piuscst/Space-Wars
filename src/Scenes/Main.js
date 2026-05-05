class Main extends Phaser.Scene {

    constructor() {
        super("mainScene")
    }

    preload() {

        // Load all sprites via assets
        this.load.setPath("./assets/")
        this.load.image("player",      "survivor1_gun.png")
        this.load.image("playerShotgun", "survivor1_machine.png")
        this.load.image("playerRifle", "survivor1_silencer.png")
        this.load.image("playerBullet","trace_07.png")
        this.load.image("enemyBullet","trace_07.png")
        this.load.image("normalZombie","zoimbie1_hold.png")
        this.load.image("gunZombie", "zoimbie1_gun.png")
        this.load.image("playerReloading", "survivor1_reload.png")

        this.load.image("tl", "tile_373.png")
        this.load.image("t",  "tile_374.png")
        this.load.image("tr", "tile_375.png")
        this.load.image("l",  "tile_400.png")
        this.load.image("c",  "tile_401.png")
        this.load.image("r",  "tile_402.png")
        this.load.image("bl", "tile_427.png")
        this.load.image("b",  "tile_428.png")
        this.load.image("br", "tile_429.png")
        this.load.image("wd", "tile_42.png")
        this.load.image("gr1", "tile_01.png")
        this.load.image("gr2", "tile_02.png")
        this.load.image("gr3", "tile_03.png")
        this.load.image("gr4", "tile_04.png")
        this.load.image("drt1", "tile_05.png")
        this.load.image("drt2", "tile_06.png")

        this.load.audio("sfxHit",       "hit_sfx.ogg")
        this.load.audio("sfxZombieDie", "zombie_death.mp3")
        this.load.audio("sfxPlayerDie", "you_lose.ogg")
        this.load.audio("sfxPlayerHurt", "player_hurt.mp3")
        this.load.audio("shootSFX", "gun_sfx.mp3")
        this.load.audio("bgMusic", "bg_music.mp3")
        this.load.audio("gunUnlock", "gun_unlock.mp3")
        this.load.audio("upgradeSFX", "upgrade_sfx.mp3")
    }

    create() {

        const tileSize = 64
        const map = [
            ["tl", "t",  "t",  "t",  "t",  "t",  "t",  "t",  "t",  "t",  "t",  "t",  "tr"],
            ["l",  "c",  "c",  "c",  "c",  "gr3",  "c",  "c",  "c",  "c",  "c",  "c",  "r" ],
            ["l",  "gr2",  "gr1",  "c",  "c",  "c",  "gr4",  "c",  "c",  "c",  "c",  "c",  "r" ],
            ["l",  "gr1",  "c",  "c",  "gr3",  "c",  "c",  "c",  "c",  "c",  "c",  "c",  "r" ],
            ["l",  "c",  "gr2",  "gr1",  "gr3",  "gr1",  "gr4",  "c",  "gr2",  "gr2",  "c",  "gr2",  "r" ],
            ["l",  "c",  "c",  "gr2",  "gr1",  "c",  "c",  "c",  "c",  "gr2",  "c",  "c",  "r" ],
            ["l",  "gr1",  "gr4",  "c",  "c",  "c",  "gr3",  "c",  "c",  "c",  "c",  "gr2",  "r" ],
            ["l",  "c",  "c",  "gr1",  "c",  "gr3",  "gr3",  "gr1",  "gr1",  "gr2",  "c",  "c",  "r" ],
            ["l",  "c",  "gr4",  "c",  "c",  "gr1",  "c",  "c",  "gr1",  "c",  "c",  "c",  "r" ],
            ["l",  "gr4",  "c",  "c",  "c",  "c",  "c",  "c",  "c",  "gr1",  "c",  "c",  "r" ],
            ["wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd" ],
            ["wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd" ],
            ["wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd",  "wd" ],
        ]

        for (let row = 0; row < map.length; row++) {
            for (let col = 0; col < map[row].length; col++) {
                this.add.image(col * tileSize, row * tileSize, map[row][col]).setOrigin(0)
            }
        }

        // Create a new player, array of enemies, wave count, wave flag, and score
        this.player = new PistolPlayer(this, 400, 695)
        this.unlockedWeapons = [1]
        this.currentWeapon = 1
        this.enemies = []
        this.wave = 0
        this.waveInProgress = false
        this.score = 0
        this.lastHpBonus = 0
        this.displayedScore = 0
        this.scoreTimers = []
        this.upgrades = {fireRateDelta: 0, damageDelta: 0, speedDelta: 0}

        this.debug = false

        // Text for wave, HP, and score
        this.waveText  = this.add.text(400, 20, "", { fontFamily: 'Creepster', fontSize: "50px", fill: "#ffffff" }).setOrigin(0.5, 0).setAlpha(0)
        this.hpText    = this.add.text(20,  20, "HP: 5", { fontFamily: 'Creepster', fontSize: "42px", fill: "#ff4444" }).setAlpha(0)
        this.scoreText = this.add.text(20,  780, "Score: 0", { fontFamily: 'Creepster', fontSize: "42px", fill: "#29f30f" }).setAlpha(0)
        this.unlockedWeaponsText = this.add.text(300, 785, "Weapons: Pistol (1)", { fontFamily: 'Creepster', fontSize: "35px", fill: "#0f72f3" }).setAlpha(0)

        // Fade in HUD staggered
        this.fadeIn(this.waveText,           300)
        this.fadeIn(this.hpText,             600)
        this.fadeIn(this.scoreText,          900)
        this.fadeIn(this.unlockedWeaponsText, 1200)

        // Switching weapons
        this.input.keyboard.on("keydown-ONE", () => this.switchWeapon(1))
        this.input.keyboard.on("keydown-TWO", () => this.switchWeapon(2))
        this.input.keyboard.on("keydown-THREE", () => this.switchWeapon(3))

        // Start the first wave
        this.startNextWave()

        // Debugging for hitboxes
        this.debugGraphics = this.add.graphics()

        // SFX
        this.sfxHit       = this.sound.add("sfxHit",       { volume: 0.6 })
        this.sfxZombieDie = this.sound.add("sfxZombieDie", { volume: 0.7 })
        this.sfxPlayerDie = this.sound.add("sfxPlayerDie", { volume: 0.8 })
        this.sfxPlayerHurt = this.sound.add("sfxPlayerHurt", { volume: 0.8 })
        this.sfxShoot = this.sound.add("shootSFX", { volume: 0.6 })
        this.sfxUpgrade = this.sound.add("upgradeSFX", { volume: 0.6})
        this.gunUnlock = this.sound.add("gunUnlock", { volume: 0.6})

        // BG Music
        this.bgMusic = this.sound.add("bgMusic", { volume: 0.3, loop: true })
        this.bgMusic.play()
    }

    // Start the next wave
    startNextWave() {
        this.wave++ // Increment the wave count
        this.waveInProgress = true // Toggle wave flag
        this.waveText.setText("Wave " + this.wave) // Modify wave text to display wave count

        if (this.wave >= 25) {
            this.winGame()
            return
        }
        // Every 5 waves, apply an upgrade
        if (this.wave > 1 && (this.wave % 5 === 0)) {
            this.applyUpgrade()
        }

        if (this.wave === 10 && !this.unlockedWeapons.includes(2)) {
            this.unlockedWeapons.push(2)
            const text = this.add.text(this.scale.width / 2, 300, "SHOTGUN UNLOCKED! (Press 2)", {
                fontFamily: 'Creepster', fontSize: "32px", fill: "#00ffff"
            }).setOrigin(0.5).setAlpha(0)
            this.fadeIn(text, 0)
            this.time.delayedCall(3000, () => text.destroy())
            this.gunUnlock.play()
            this.unlockedWeaponsText.setText("Weapons: Pistol (1), Shotgun (2)")
        }

        if (this.wave === 20 && !this.unlockedWeapons.includes(3)) {
            this.unlockedWeapons.push(3)
            const text = this.add.text(this.scale.width / 2, 300, "RIFLE UNLOCKED! (Press 3)", {
                fontFamily: 'Creepster', fontSize: "32px", fill: "#00ffff"
            }).setOrigin(0.5).setAlpha(0)
            this.fadeIn(text, 0)
            this.time.delayedCall(3000, () => text.destroy())
            this.gunUnlock.play()
            this.unlockedWeaponsText.setText("Weapons: Pistol (1), Shotgun (2), Rifle (3)")
        }

        const maxZombieCount = Math.min(10 + Math.floor(this.wave * 0.5), 35)

        const lanes = [100, 200, 300, 400, 500, 600, 700] // Array for each lane that the zombies can spawn in

        // For loop to spawn random enemies in, with a random x, and pushing it to the enemies array
        for (let i = 0; i < maxZombieCount; i++) {
            const x = lanes[Phaser.Math.Between(0, lanes.length - 1)] // Pick a random index between 0 and lanes.length - 1
            const y = -5 - (i * 20) // y Offset between zombies in the same lane
            const enemy = this.pickEnemy() // Pick the enemy to spawn
             this.enemies.push(enemy(this, x, y, this.hpScale())) // Push the enemy and their x and y coords and hpScale
        }
    }

    hpScale() {
        return Math.floor(this.wave / 5)  // +1 HP every 5 waves
    }

    pickEnemy() {
        const roll = Phaser.Math.Between(0, 99)

        if (this.wave < 3) {
            // Only normal zombies early on
            return (scene, x, y, hpBonus) => new NormalZombie(scene, x, y, hpBonus)

        } else if (this.wave < 7) {
            // Introduce gun zombies
            if (roll > 75) return (scene, x, y, hpBonus) => new GunZombie(scene, x, y, hpBonus)
            else           return (scene, x, y, hpBonus) => new NormalZombie(scene, x, y, hpBonus)

        } else if (this.wave < 12) {
            // Introduce rifle zombies, gun zombies more common
            if (roll > 90)      return (scene, x, y, hpBonus) => new RifleZombie(scene, x, y, hpBonus)
            else if (roll > 65) return (scene, x, y, hpBonus) => new GunZombie(scene, x, y, hpBonus)
            else                return (scene, x, y, hpBonus) => new NormalZombie(scene, x, y, hpBonus)

        } else if (this.wave < 18) {
            // Tanks start appearing, rifle zombies more common
            if (roll > 92)      return (scene, x, y, hpBonus) => new TankZombie(scene, x, y, hpBonus)
            else if (roll > 78) return (scene, x, y, hpBonus) => new RifleZombie(scene, x, y, hpBonus)
            else if (roll > 55) return (scene, x, y, hpBonus) => new GunZombie(scene, x, y, hpBonus)
            else                return (scene, x, y, hpBonus) => new NormalZombie(scene, x, y, hpBonus)

        } else {
            // Late game, tanks and rifles more threatening
            if (roll > 85)      return (scene, x, y, hpBonus) => new TankZombie(scene, x, y, hpBonus)
            else if (roll > 70) return (scene, x, y, hpBonus) => new RifleZombie(scene, x, y, hpBonus)
            else if (roll > 50) return (scene, x, y, hpBonus) => new GunZombie(scene, x, y, hpBonus)
            else                return (scene, x, y, hpBonus) => new NormalZombie(scene, x, y, hpBonus)
        }
    }


    // Needed math help from Google
    separateEnemies () {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = 0; j < this.enemies.length; j++) {
                const a = this.enemies[i]
                const b = this.enemies[j]

                if (!a.alive || !b.alive) continue

                const dx = b.x - a.x
                const dy = b.y - a.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const minDist = 50  

                if (dist < minDist && dist > 0) {
                    const overlap = (minDist - dist) / 2
                    const nx = dx / dist
                    const ny = dy / dist

                    a.x -= nx * overlap
                    a.y -= ny * overlap
                    b.x += nx * overlap
                    b.y += ny * overlap
                }
            }
        }
    }

    update(time, delta) {

        if (!this.player.alive) {
            this.gameOver()
            return
        }
        // Update player (handles input + its own bullets internally)
        this.player.update(time, delta)

        // Update each enemy (handles movement + its own bullets internally)
        for (const enemy of this.enemies) {
            enemy.update(time, delta)
        }

        this.checkCollisions()
        this.separateEnemies()

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => {
            if (!e.alive && e.reachedBottom) {
                this.player.takeDamage(1)
            }
            return e.alive
        })
        
        // Update player HP text
        this.hpText.setText("HP: " + this.player.hp)

        // If a wave is in progress, and the enemies array has nothing, then stop the wave and start a new one after 2 seconds
        if (this.waveInProgress && this.enemies.length === 0) {
            this.waveInProgress = false
            if (this.wave < 25) {
                this.time.delayedCall(2000, () => this.startNextWave())
            }
        }

        // Update the score
        if (this.score !== this.displayedScore) {
            // Cancel any in-progress animation
            this.scoreTimers.forEach(t => t.remove())
            this.scoreTimers = []

            const startScore = this.displayedScore
            const targetScore = this.score
            this.displayedScore = targetScore

            const diff = targetScore - startScore
            const steps = 60
            const stepSize = Math.ceil(diff / steps)

            for (let i = 0; i <= steps; i++) {
                const timer = this.time.delayedCall(i * 40, () => {
                    const current = Math.min(startScore + i * stepSize, targetScore)
                    this.scoreText.setText("Score: " + current)
                })
                this.scoreTimers.push(timer)
            }
        }

        this.debugGraphics.clear()
        this.drawDebug(this.debug)
    }


    applyUpgrade () {

        // Put the upgrades in an array, add keys to them
        const upgrades = [
            { label: "Fire Rate +", apply: () => {
                this.upgrades.fireRateDelta = Math.min(this.upgrades.fireRateDelta - 80, -80)
                this.player.fireRate = Math.max(100, this.player.fireRate - 80)
            }},
            { label: "Speed +", apply: () => {
                this.upgrades.speedDelta += 40
                this.player.speed += 40
            }},
            { label: "Damage +", apply: () => {
                this.upgrades.damageDelta++
                this.player.bulletDamage++
            }},
            { label: "HP +1", apply: () => {
                this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp + 1)
                this.player.maxHp++
            }},
        ]

        // Choose a random upgrade from the array
        const upgrade = upgrades[Phaser.Math.Between(0, upgrades.length - 1)]

        // Apply the upgrade
        upgrade.apply()

        // Display a text saying which upgrade was applied
        const text = this.add.text(416, 416, "UPGRADE: " + upgrade.label, {
            fontFamily: 'Creepster', fontSize: "42px", fill: "#ffff00"
        }).setOrigin(0.5).setAlpha(0)

        this.sfxUpgrade.play()
        this.fadeIn(text, 0)
    
        // Wait 2 seconds before the text disappears
        this.time.delayedCall(2000, () => text.destroy())
    }

    switchWeapon(slot) {

        if (!this.unlockedWeapons.includes(slot)) return


        // Save HP, max HP, and coords
        const savedHp    = this.player.hp
        const savedMaxHp = this.player.maxHp
        const x          = this.player.x
        const y          = this.player.y

        // Destroy the player and its bullets
        this.player.sprite.destroy()
        for (const bullet of this.player.bullets) {
            if (bullet && bullet.sprite) bullet.sprite.destroy()
        }
        this.player.bullets = []

        // Make new players
        if (slot === 1) this.player = new PistolPlayer(this, x, y)
        if (slot === 2) this.player = new ShotgunPlayer(this, x, y)
        if (slot === 3) this.player = new RiflePlayer(this, x, y)

        // Apply upgrade deltas on top of the new weapon's base stats
        this.player.fireRate     = Math.max(100, this.player.fireRate + this.upgrades.fireRateDelta)
        this.player.bulletDamage += this.upgrades.damageDelta
        this.player.speed        += this.upgrades.speedDelta
        this.player.hp            = savedHp
        this.player.maxHp         = savedMaxHp
        this.currentWeapon        = slot
    }

    gameOver() {

        // Destroy every enemy and their bullets
        for (const enemy of this.enemies) {
            for (const bullet of enemy.bullets) {
                bullet.destroy()
            }
            enemy.die()
        }
        // Empty the array
        this.enemies = []

        // Destroy every player bullet
        for (const bullet of this.player.bullets) {
            bullet.destroy()
        }
        // Empty the array
        this.player.bullets = []

        // Clear debugGraphics
        this.debugGraphics.clear()

        // Show a text that says you lost
        const loseText = this.add.text(416, 416, "YOU LOSE", {
            fontFamily: 'Creepster', fontSize: "100px", fill: "#ff0000"
        }).setOrigin(0.5).setAlpha(0)

        const retryText = this.add.text(416, 495, "Press R to retry", {
            fontFamily: 'Creepster', fontSize: "55px", fill: "#ffffff"
        }).setOrigin(0.5).setAlpha(0)

        this.fadeIn(loseText,  0)
        this.fadeIn(retryText, 800)

        this.input.keyboard.once("keydown-R", () => {
            console.log("Pressed R")
            this.scene.restart()
        })
    }
    
    winGame() {
        for (const enemy of this.enemies) {
            for (const bullet of enemy.bullets) bullet.destroy()
            enemy.die()
        }

        this.enemie = []
        for (const bullet of this.player.bullets) bullet.destroy()
        this.player.bullets = []
        this.debugGraphics.clear()

        const winText = this.add.text(416, 380, "YOU WIN!", {
            fontFamily: 'Nosifer', fontSize: "72px", fill: "#00ff00"
        }).setOrigin(0.5).setAlpha(0)

        const replayText = this.add.text(416, 460, "Press R to play again", {
            fontFamily: 'Creepster', fontSize: "35px", fill: "#ffffff"
        }).setOrigin(0.5).setAlpha(0)

        this.fadeIn(winText,    0)
        this.fadeIn(replayText, 800)

        this.input.keyboard.once("keydown-R", () => this.scene.restart())
    }

    checkCollisions () {
        // Get the bounds of the player
        const playerBounds = this.player.getBounds()

        // Loop over every enemy in the enemies array
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue

            // Loop over every bullet in the player's bullets array
            for (const bullet of this.player.bullets) {
                if (!bullet.alive) continue

                // Check if the two bounds intersects (bullet to zombie)
                if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), enemy.getBounds())) {
                    const killed = enemy.takeDamage(bullet.damage)
                    if (killed) {
                        this.sfxZombieDie.play()
                        const timeBonus = Math.floor(enemy.timeAlive / 1000) * 10
                        this.score += enemy.points + timeBonus

                        const threshold = Math.floor(this.score / 5000)
                        if (threshold > this.lastHpBonus) {
                            this.lastHpBonus = threshold
                            this.player.hp += 1
                            this.player.maxHp += 1

                            const text = this.add.text(416, 416, "HP BONUS!", {
                                fontFamily: 'Creepster', fontSize: "45px", fill: "#ff0000"
                            }).setOrigin(0.5).setAlpha(0)
                            this.fadeIn(text, 0)
                            this.time.delayedCall(3000, () => text.destroy())
                        }
                    } else {
                        this.sfxHit.play()
                    }

                    bullet.alive = false
                    break
                }
            }

            // Loop over every bullet in the enemies bullets array
            for (const bullet of enemy.bullets) {
                if (!bullet.alive) continue

                // Check if the two bounds intersects (bullet to player)
                if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), this.player.getBounds())) {
                    this.player.takeDamage(bullet.damage)
                    this.sfxPlayerHurt.play()
                    bullet.alive = false
                    break
                }
            }

            // Check if the enemy's bounds and the player's bounds intersects
            if (Phaser.Geom.Intersects.RectangleToRectangle(enemy.getBounds(), playerBounds)) {
                this.player.takeDamage(1)
                this.sfxPlayerHurt.play()
                enemy.die()
                break
            }
        }
    }

    fadeIn(target, delay) {
        this.time.delayedCall(delay, () => {
            this.tweens.add({
                targets: target, alpha: 1, duration: 600, ease: 'Power2'
            })
        })
    }

    drawDebug(toggle) {
        if (toggle) {
            const g = this.debugGraphics

            // Player
            g.lineStyle(1, 0x00ff00)
            g.strokeRectShape(this.player.getBounds())

            // Player bullets
            for (const bullet of this.player.bullets) {
                g.lineStyle(1, 0xffff00)
                g.strokeRectShape(bullet.getBounds())
            }

            // Enemies + their bullets
            for (const enemy of this.enemies) {
                g.lineStyle(1, 0xff0000)
                g.strokeRectShape(enemy.getBounds())

                for (const bullet of enemy.bullets) {
                    g.lineStyle(1, 0xff8800)
                    g.strokeRectShape(bullet.getBounds())
                }
            }
        }
    }
}