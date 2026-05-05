class Player extends Entity {
    constructor (scene, x, y, textureKey) {
        super(scene, x, y, textureKey, 1.5)
        this.hp = 5
        this.maxHp = 5
        this.speed = 450
        this.shootCooldown = 0
        this.fireRate = 600
        this.bulletDamage = 1
        this.bullets = []
        this.targetAngle = 0
        this.textureKey = textureKey

        this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }

    update(time, delta) {
        if (!this.alive) return

        this.shootCooldown -= delta

        let moving = false

        let direction = 0

        if (!this.spaceKey.isDown) {
            if (this.aKey.isDown) {
                this.x -= this.speed * (delta / 1000)
                this.sprite.setTexture("playerReloading")

                direction = -1
            }
            if (this.dKey.isDown) {
                this.x += this.speed * (delta / 1000)
                this.sprite.setTexture("playerReloading")
                direction = 1
            }
        }

        this.x = Phaser.Math.Clamp(this.x, 20, this.scene.scale.width - 20)

        // Shooting
        if (this.spaceKey.isDown && this.shootCooldown <= 0) {
            this.shoot()
            this.shootCooldown = this.fireRate
        }

        if (this.spaceKey.isDown) {
            // Shooting has priority
            this.targetAngle = -90
            this.sprite.setTexture(this.textureKey)
        } else {
            // Movement controls facing
            if (this.aKey.isDown) {
                this.targetAngle = 180
                this.sprite.setTexture("playerReloading")
            } else if (this.dKey.isDown) {
                this.targetAngle = 0
                this.sprite.setTexture("playerReloading")
            }
        }

        this.targetScaleX = this.facing

        this.updateBullets(delta)

        // this.sprite.angle = -90
        // this.sprite.flipX = this.aKey.isDown ? true : false 

        const turnSpeed = 0.2

        this.sprite.angle = Phaser.Math.Angle.RotateTo(
            Phaser.Math.DegToRad(this.sprite.angle),
            Phaser.Math.DegToRad(this.targetAngle),
            turnSpeed
        ) * Phaser.Math.RAD_TO_DEG
    }

    shoot() {
        // Override in subclasses to define bullet pattern
    }
 
    spawnBullet(x, y, dx, dy) {
        const bullet = new PlayerBullet(this.scene, x, y, dx, dy, this.bulletDamage)
        this.bullets.push(bullet)
        return bullet
    }
 
    updateBullets(delta) {
        for (const b of this.bullets) {
            b.update(delta)
        }
        // Remove bullets that have gone off screen or hit something
        this.bullets = this.bullets.filter(b => {
            if (!b.alive) {
                b.destroy()
                return false
            }
            return true
        })
    }

    die() {
        for (const bullet of this.bullets) {
            bullet.destroy()
        }
        this.bullets = []
        super.die()
    }
}

class PistolPlayer extends Player {
    constructor(scene, x, y) {
        super(scene, x, y, "player")
        this.fireRate = 600
        this.bulletDamage = 1
    }
 
    shoot() {
        this.scene.sfxShoot.stop()
        this.scene.sfxShoot.play()
        this.spawnBullet(this.x + 16, this.y - 50, 0, -700)
    }
}

class ShotgunPlayer extends Player {
    constructor(scene, x, y) {
        super(scene, x, y, "playerShotgun")
        this.fireRate = 1000
        this.bulletDamage = 1
    }
 
    shoot() {
        this.scene.sfxShoot.stop()
        this.scene.sfxShoot.play()
        this.spawnBullet(this.x,       this.y - 20,   0,   -700)  // center
        this.spawnBullet(this.x,       this.y - 20,  -180, -680)  // left
        this.spawnBullet(this.x,       this.y - 20,   180, -680)  // right
    }
}

class RiflePlayer extends Player {
    constructor(scene, x, y) {
        super(scene, x, y, "playerRifle")
        this.fireRate = 200
        this.bulletDamage = 2
    }
 
    shoot() {
        this.scene.sfxShoot.play()
        this.spawnBullet(this.x + 16, this.y - 50, 0, -700)
    }
}