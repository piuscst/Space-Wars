class Entity {
    constructor(scene, x, y, textureKey, scale = 1) {
        this.scene = scene
        this.sprite = scene.physics.add.sprite(x, y, textureKey)
        this.sprite.setScale(scale)
        this.hp = 1
        this.maxHp = 1
        this.alive = true
        this.sprite.body.setCollideWorldBounds(true)
    }

    // Taking damage
    takeDamage(damage) {
        if (!this.alive) return
        this.hp -= damage
        if (this.hp <= 0) {
            this.hp = 0
            this.die()
            return true
        }

        return false
    }

    // Dying
    die() {
        this.alive = false
        this.sprite.destroy()
    }

    get x() {return this.sprite.x}
    get y() {return this.sprite.y}

    set x(val) {this.sprite.x = val}
    set y(val) {this.sprite.y = val}

    setVelocity(vx, vy) { this.sprite.body.setVelocity(vx, vy) }    
    setVelocityX(vx)    { this.sprite.body.setVelocityX(vx) }
    setVelocityY(vy)    { this.sprite.body.setVelocityY(vy) }

    // Bounding for sprites
    getBounds() {
        return this.sprite.getBounds()
    }

    flash(duration = 80) {
        if (!this.sprite || !this.sprite.active) return
        this.sprite.setTintFill(0xffffff)   // solid white silhouette
        this.scene.time.delayedCall(duration, () => {
            if (this.sprite && this.sprite.active) this.sprite.clearTint()
        })
    }

    update(time, delta) {
    }
}

class ShieldPickup {
    constructor(scene, x, y) {
        this.scene = scene
        this.alive = true
        this.sprite = scene.add.image(x, y, "PlayerShieldPowerUp")
        this.sprite.setScale(1)
        this.speed = 150

        // gentle bob/spin so it reads as a pickup
        scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        })
    }

    update(delta) {
        if (!this.alive) return
        this.sprite.y += this.speed * (delta / 1000)
        if (this.sprite.y > this.scene.scale.height + 40) {
            this.die()   // fell off screen, never collected
        }
    }

    getBounds() {
        return this.sprite.getBounds()
    }

    get x() { return this.sprite.x }
    get y() { return this.sprite.y }

    die() {
        this.alive = false
        if (this.sprite && this.sprite.active) this.sprite.destroy()
    }
}

class HealthPickup {
    constructor(scene, x, y) {
        this.scene = scene
        this.alive = true
        this.sprite = scene.add.image(x, y, "PlayerHealthPowerUp")
        this.sprite.setScale(1)
        this.speed = 150
        scene.tweens.add({
            targets: this.sprite, angle: 360,
            duration: 3000, repeat: -1, ease: 'Linear'
        })
    }

    update(delta) {
        if (!this.alive) return
        this.sprite.y += this.speed * (delta / 1000)
        if (this.sprite.y > this.scene.scale.height + 40) this.die()
    }

    getBounds() { return this.sprite.getBounds() }
    get x() { return this.sprite.x }
    get y() { return this.sprite.y }

    die() {
        this.alive = false
        if (this.sprite && this.sprite.active) this.sprite.destroy()
    }
}

