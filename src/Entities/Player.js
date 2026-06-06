class Player extends Entity {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey, 0.8)
        this.hp = 5
        this.maxHp = 5
        this.speed = 600
        this.shootCooldown = 0
        this.fireRate = 400
        this.bulletDamage = 1
        this.bullets = []
        this.targetAngle = 0
        this.textureKey = textureKey

        this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }

    update(time, delta) {
        if (!this.alive) return

        this.shootCooldown -= delta

        const left  = this.aKey.isDown
        const right = this.dKey.isDown
        const up    = this.wKey.isDown
        const down  = this.sKey.isDown

        let vx = 0
        let vy = 0

        if (left)  vx -= 1
        if (right) vx += 1
        if (up)    vy -= 1
        if (down)  vy += 1

        if (vx !== 0 && vy !== 0) {
            vx *= Math.SQRT1_2
            vy *= Math.SQRT1_2
        }

        const currentSpeed = this.shiftKey.isDown ? this.speed * 0.5 : this.speed
        
        this.setVelocity(vx * currentSpeed, vy * currentSpeed)

        // Shooting
        if (this.spaceKey.isDown && this.shootCooldown <= 0) {
            this.shoot()
            this.shootCooldown = this.fireRate
        }

        // Clean up dead bullets
        this.bullets = this.bullets.filter(b => {
            if (!b.alive) {
                b.destroy()
                return false
            }
            return true
        })

        // Update live bullets
        for (const b of this.bullets) {
            b.update(delta)
        }
}

    shoot() {
        const bullet = new PlayerBullet(this.scene, this.x, this.y, 0, -1200)
        this.bullets.push(bullet)
    }
}

class StarterShip extends Player {
    constructor(scene, x, y) {
        super(scene, x, y, "PlayerShip1")
    }
}