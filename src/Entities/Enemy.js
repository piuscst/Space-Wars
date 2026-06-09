class Enemy extends Entity {
    constructor (scene, x, y, textureKey, hp = 1, points = 100, timeAlive = 0, upgraded = false) {
        const key = upgraded ? textureKey + "_Upgraded" : textureKey
        super(scene, x, y, key, 0.5)
        this.hp = hp
        this.maxHp = hp
        this.points = points
        this.timeAlive = timeAlive
        this.bullets = []
        this.reachedBottom = false

        this.sprite.body.setCollideWorldBounds(false)
    }

    update(time, delta) {
        if (!this.alive || !this.sprite || !this.sprite.active) {
            this.updateBullets(delta)
            return
        }
        this.timeAlive += delta
        this.updateMovement(time, delta)
        this.updateBullets(delta)
    }

    // Exiting screen
    exitBottom() {
        this.reachedBottom = true
        this.die()
    }

    // Updating Movement
    updateMovement(time, delta) {
        // Sub class, depends on enemy type
    }

    // Spawning bullets
    spawnBullet(x, y, dx, dy) {
        const bullet = new EnemyBullet(this.scene, x, y, dx, dy, 1)
        this.bullets.push(bullet)
        this.scene.sound.play("sfxLaser", { volume: 0.15, rate: 0.7 })  // lower/deeper than player
        return bullet
    }

    // Updating bullets on the scene
    updateBullets(delta) {
        for (const b of this.bullets) {   // was: bullets
            b.update(delta)
        }

        this.bullets = this.bullets.filter(b => {
            if (!b.alive) {
                b.destroy()
                return false
            }
            return true
        })
    }

    // Enemy and bullets dying
    die() {
        if (!this.alive) return
        this.alive = false

        // Empty bullets array
        this.bullets = []

        // Death tween
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.sprite.destroy()
            }
        })
    }

    destroy() {
        for (const b of this.bullets) {
            b.destroy()
        }
        this.bullets = []
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy()
        }
    }
}

// Subclasses for enemies 

class DriftEnemy extends Enemy {
    constructor(scene, x, y, speed, shootRate, hp, points, index = 0, homeY = 80, upgraded = false) {
        super(scene, x, y, "EnemyShip1", hp, points, 0, upgraded)
        this.speed = speed
        this.shootRate = shootRate
        this.shootTimer = shootRate * Math.random()
        this.sprite.angle = 0

        this.state = "entering"
        this.homeX = x
        this.homeY = homeY  // use exactly what's passed in
        this.diveTimer = 1000 + index * 400 + Math.random() * 1000
    }

    updateMovement(time, delta) {
        if (this.state === "entering") {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY)
            if (dist < 4) {
                this.setVelocity(0, 0)
                this.state = "holding"
            } else {
                // Slow down as it approaches home
                const speed = Math.min(this.speed, dist * 3)
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY)
                this.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                )
            }

        } else if (this.state === "holding") {
            const bob = Math.sin(this.timeAlive / 400) * 15
            this.sprite.y = this.homeY + bob
            this.setVelocity(0, 0)

            this.diveTimer -= delta
            if (this.diveTimer <= 0) {
                this.state = "looping"
                this.loopTimer = 0
                this.diveElapsed = 0
            }

        } else if (this.state === "looping") {
            this.loopTimer += delta
            const t = this.loopTimer / 1000

            const speed = 4
            const radius = t * 40  // grows over time

            this.sprite.x = this.homeX + Math.cos(t * speed) * radius
            this.sprite.y = this.homeY + Math.sin(t * speed) * radius
            this.setVelocity(0, 0)

            const tangentAngle = t * speed + Math.PI / 2
            this.sprite.rotation = tangentAngle + Math.PI / 2

            if (this.loopTimer > 1500) {
                this.state = "diving"
                const player = this.scene.player
                if (player && player.alive) {
                    this.diveAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                    console.log("diveAngle:", this.diveAngle, "player:", player.x, player.y, "enemy:", this.x, this.y)
                } else {
                    this.diveAngle = Math.PI / 2
                }
            }

        } else if (this.state === "diving") {
            this.diveElapsed = (this.diveElapsed || 0) + delta

            const vx = Math.cos(this.diveAngle) * this.speed
            const vy = Math.sin(this.diveAngle) * this.speed
            this.setVelocity(vx, vy)

            if (this.y > this.scene.scale.height + 40 || 
                this.x < -40 || this.x > this.scene.scale.width + 40) {
                this.sprite.y = -40
                this.sprite.x = this.homeX
                this.diveElapsed = 0
                this.state = "returning"
                this.diveTimer = 3000 + Math.random() * 3000
            }

        } else if (this.state === "returning") {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY)
            if (dist < 8) {
                this.setVelocity(0, 0)
                this.sprite.x = this.homeX
                this.sprite.y = this.homeY
                this.state = "holding"
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY)
                this.setVelocity(
                    Math.cos(angle) * this.speed * 1.5,
                    Math.sin(angle) * this.speed * 1.5
                )
            }
        }

        const vel = this.sprite.body.velocity
        if (vel.x !== 0 || vel.y !== 0) {
            this.sprite.rotation = Math.atan2(vel.y, vel.x) + Math.PI / 2
        }
    }

    update(time, delta) {
        super.update(time, delta)
        if (!this.alive) return

        this.shootTimer -= delta
        if (this.shootTimer <= 0) {
            this.shootTimer = this.shootRate
            // Only shoot while diving
            if (this.state === "holding") {
                this.spawnBullet(this.x, this.y, 0, 400)
            }
        }
    }
}

class ShooterEnemy extends Enemy {
    constructor(scene, x, y, speed, shootRate, hp, points, index = 0, homeY = 80, upgraded = false) {
        super(scene, x, y, "EnemyShip2", hp, points, 0, upgraded)
        this.speed = speed
        this.shootRate = shootRate
        this.shootTimer = shootRate * Math.random()
        this.homeX = x
        this.homeY = homeY
        this.state = "entering"
    }

    updateMovement(time, delta) {
        if (this.state === "entering") {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY)
            if (dist < 8) {
                this.setVelocity(0, 0)
                this.sprite.x = this.homeX
                this.sprite.y = this.homeY
                this.state = "holding"
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY)
                this.setVelocity(
                    Math.cos(angle) * this.speed,
                    Math.sin(angle) * this.speed
                )
            }
        } else if (this.state === "holding") {
            // Bob in place
            const bob = Math.sin(this.timeAlive / 400) * 10
            this.sprite.y = this.homeY + bob
            this.setVelocity(0, 0)

            const player = this.scene.player
            if (player && player.alive) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                this.sprite.rotation = angle + (-Math.PI / 2)
            }
        }
    }

    update(time, delta) {
        super.update(time, delta)
        if (!this.alive) return

        this.shootTimer -= delta
        if (this.shootTimer <= 0) {
            this.shootTimer = this.shootRate

            const player = this.scene.player
            if (player && player.alive) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                const speed = 500
                this.spawnBullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed)
            }
        }
    }
}

class ChargerEnemy extends Enemy {
    constructor(scene, x, y, speed, hp, points, index = 0, homeY = 80, upgraded = false) {
        super(scene, x, y, "EnemyShip3", hp, points, 0, upgraded)
        this.speed = speed
        this.homeX = x
        this.homeY = homeY
        this.state = "entering"
        this.chargeDelay = 1000 + Math.random() * 1000
        this.chargeAngle = 0
    }

    updateMovement(time, delta) {
        if (this.state === "entering") {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY)
            if (dist < 8) {
                this.setVelocity(0, 0)
                this.state = "holding"
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY)
                this.setVelocity(
                    Math.cos(angle) * this.speed,
                    Math.sin(angle) * this.speed
                )
            }

        } else if (this.state === "holding") {
            this.setVelocity(0, 0)
            this.chargeDelay -= delta

            // Face player while waiting
            const player = this.scene.player
            if (player && player.alive) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                this.sprite.rotation = angle + Math.PI / 2

                if (this.chargeDelay <= 0) {
                    // Lock angle toward player and charge
                    this.chargeAngle = angle
                    this.state = "charging"
                }
            }

        } else if (this.state === "charging") {
            const vx = Math.cos(this.chargeAngle) * this.speed * 2.5
            const vy = Math.sin(this.chargeAngle) * this.speed * 2.5
            this.setVelocity(vx, vy)

            // Die if off screen
            if (this.y > this.scene.scale.height + 40 ||
                this.y < -40 ||
                this.x < -40 || 
                this.x > this.scene.scale.width + 40) {
                this.state = "entering"
            }
        }

        // Rotate to face movement direction
        const vel = this.sprite.body.velocity
        if (this.state === "charging" && (vel.x !== 0 || vel.y !== 0)) {
            this.sprite.rotation = Math.atan2(vel.y, vel.x) + Math.PI / 2
        }
    }
}