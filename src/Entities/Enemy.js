class Enemy extends Entity {
    constructor (scene, x, y, textureKey, hp = 1, points = 100, timeAlive = 0) {
        super(scene, x, y, textureKey, 1.5)
        this.hp = hp
        this.maxHp = hp
        this.points = points
        this.timeAlive = timeAlive
        this.bullets = []
        this.reachedBottom = false


        this.sprite.angle = 90
    }

    update(time, delta) {
        this.sprite.setTintFill(0xff0000)   
        if (!this.alive) {
            this.updateBullets(delta)
            return
        }
        this.timeAlive += delta

        if (Math.floor(this.timeAlive / 1000) > Math.floor((this.timeAlive - delta) / 1000)) {
            console.log("Zombie alive for: " + Math.floor(this.timeAlive / 1000) + "s")
        }
        this.updateMovement(time, delta)
        this.x = Phaser.Math.Clamp(this.x, 20, this.scene.scale.width - 20)
        this.updateBullets(delta)
    }

    // Die when reaching the bottom of the canvas
    exitBottom() {
        this.reachedBottom = true
        this.die()
    }

    updateMovement(time, delta) {
        // Will be implemented in sub class
    }

    // Spawning bullets
    spawnBullet(x, y, dx, dy) {
        const bullet = new EnemyBullet(this.scene, x, y, dx, dy, 1)
        this.bullets.push(bullet)
        return bullet
    }

    // Updating these bullets
    updateBullets(delta) {
        for (const b of this.bullets) {
            b.update(delta)
        }

        // Destroying bullets
        this.bullets = this.bullets.filter(b => {
            if (!b.alive) {
                b.destroy()
                return false
            }
            return true
        })
    }

    // Bullets dying
    die() {
        if (!this.alive) return
        this.alive = false

        // Stop bullets
        for (const bullet of this.bullets) bullet.destroy()
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
}


// Different zombie classes
class NormalZombie extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "normalZombie", 1, 100)
        this.speed = 80
    }
 
    updateMovement(time, delta) {
        this.y += this.speed * (delta / 1000)
 
        // Die if it reaches the bottom
        if (this.y > this.scene.scale.height + 40) {
            this.exitBottom()
        }
    }
}

class GunZombie extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "gunZombie", 2, 200)  // swap texture later
        this.speed = 40
        this.driftSpeed = 90
        this.driftRange = 60     // px each direction from spawn x
        this.originX = x
        this.shootTimer = Phaser.Math.Between(1000, 2500)
        this.shootCooldown = this.shootTimer
    }
 
    updateMovement(time, delta) {
        // Drift horizontally using a sine wave
        this.y += this.speed * (delta / 1000)
        this.x = this.originX + Math.sin(time * 0.002) * this.driftRange
 
        // Shooting
        this.shootCooldown -= delta
        if (this.shootCooldown <= 0) {
            this.spawnBullet(this.x - 16, this.y + 50, 0, 300)
            this.shootCooldown = this.shootTimer
        }
 
        if (this.y > this.scene.scale.height + 40) {
            this.exitBottom()
        }
    }
}

class TankZombie extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "normalZombie", 5, 500)
        this.speed = 30
        this.steerSpeed = 80
        this.sprite.setScale(2.5)
    }
 
    updateMovement(time, delta) {
        const player = this.scene.player

        if (player && player.alive) {
            // Get direction vector toward player
            const dx = player.x - this.x
            const dy = player.y - this.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 0) {
                // Normalize and move
                const nx = dx / dist
                const ny = dy / dist

                this.x += nx * this.speed * (delta / 1000)
                this.y += ny * this.speed * (delta / 1000)

                // Face the player
                this.sprite.angle = Math.atan2(dy, dx) * Phaser.Math.RAD_TO_DEG + 360
            }
        }

        if (this.y > this.scene.scale.height + 40) {
            this.exitBottom()
        }
    }
}

class RifleZombie extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "gunZombie", 3, 300)
        this.speed = 60
        this.stopY = Phaser.Math.Between(150, 250)  // where it stops
        this.settled = false
        this.shootTimer = 1500
        this.shootCooldown = this.shootTimer
    }

    updateMovement(time, delta) {
        if (!this.settled) {
            // Advance until reaching stop position
            this.y += this.speed * (delta / 1000)
            if (this.y >= this.stopY) {
                this.y = this.stopY
                this.settled = true
            }
        } else {
            // Campp, aim and shoot at player
            const player = this.scene.player
            if (player && player.alive) {
                const dx = player.x - this.x
                const dy = player.y - this.y
                this.sprite.angle = Math.atan2(dy, dx) * Phaser.Math.RAD_TO_DEG + 360

                this.shootCooldown -= delta
                if (this.shootCooldown <= 0) {
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const nx = dx / dist
                    const ny = dy / dist
                    this.spawnBullet(this.x, this.y, nx * 350, ny * 350)
                    this.shootCooldown = this.shootTimer
                }
            }
        }

        if (this.y > this.scene.scale.height + 40) {
            this.exitBottom()
        }
    }
}