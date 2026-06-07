class Bullet extends Entity {
    constructor(scene, x, y, dx, dy, damage, textureKey, scale) {
        super(scene, x, y, textureKey, scale)  // scale was missing before too
        this.damage = damage
        this.alive = true
        this.sprite.setScale(scale)
        this.sprite.body.setVelocity(dx, dy)   // set once, physics handles the rest
        this.sprite.body.setCollideWorldBounds(false)
    }

    update(delta) {
        if (!this.alive) return
        this.cullIfOffScreen()
        // no manual position math needed anymore
    }

    // Destroying off screen (for performance I guess)
    cullIfOffScreen() {
        const { width, height } = this.scene.scale
        const x = this.sprite.x
        const y = this.sprite.y
        if (y < -40 || y > height + 40 || x < -40 || x > width + 40) {
            this.alive = false
        }
    }

    // Bounds for bullets
    getBounds() {
        return this.sprite.getBounds()
    }

    //Destroying bullets
    destroy() {
        this.sprite.destroy()
    }
}

// Subclasses for player and enemy bullets

class PlayerBullet extends Bullet {
    constructor(scene, x, y, dx, dy, damage = 1) {
        super(scene, x, y, dx, dy, damage, "PlayerBullet", 0.7)
        this.sprite.angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90
    }
}

class EnemyBullet extends Bullet {
    constructor(scene, x, y, dx, dy, damage = 1) {
        super(scene, x, y, dx, dy, damage, "EnemyBullet", 0.7)
        this.sprite.angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) + 90
    }

    update(delta) {
        super.update(delta)
    }
}