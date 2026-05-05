// Bullet is NOT an Entity — bullets don't have health, just position and velocity.
// They're lightweight: a sprite, a direction, damage value, and an alive flag.

class Bullet {
    constructor(scene, x, y, dx, dy, damage, textureKey, scale) {
        this.scene = scene
        this.sprite = scene.add.sprite(x, y, textureKey)
        this.sprite.setScale(scale)
        this.dx = dx    // pixels per second
        this.dy = dy
        this.damage = damage
        this.alive = true
    }

    update(delta) {
        if (!this.alive) return
        this.sprite.x += this.dx * (delta / 1000)
        this.sprite.y += this.dy * (delta / 1000)
        this.cullIfOffScreen()
    }

    cullIfOffScreen() {
        const { width, height } = this.scene.scale
        const x = this.sprite.x
        const y = this.sprite.y
        if (y < -40 || y > height + 40 || x < -40 || x > width + 40) {
            this.alive = false
        }
    }

    getBounds() {
        return this.sprite.getBounds()
    }

    destroy() {
        this.sprite.destroy()
    }
}

class PlayerBullet extends Bullet {
    constructor(scene, x, y, dx, dy, damage = 2) {
        super(scene, x, y, dx, dy, damage, "playerBullet", 0.12) // was 0.2
        this.sprite.angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90
    }
}

class EnemyBullet extends Bullet {
    constructor(scene, x, y, dx, dy, damage = 1) {
        super(scene, x, y, dx, dy, damage, "enemyBullet", 0.12)
        this.sprite.angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90
        this.sprite.setTint(0xff4444)
    }

    update(delta) {
        super.update(delta)
        this.sprite.setTintFill(0xff4444)
    }
}