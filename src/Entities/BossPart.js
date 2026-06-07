class BossPart {
    constructor(scene, textureKey, scale = 1) {
        this.scene = scene
        this.sprite = scene.add.sprite(0, 0, textureKey)
        this.sprite.setScale(scale)
        this.hp = 0
        this.maxHp = 0
        this.alive = true
    }

    setPosition(x, y, rotation = 0) {
        this.sprite.x = x
        this.sprite.y = y
        this.sprite.rotation = rotation
    }

    getBounds() {
        return this.sprite.getBounds()
    }

    takeDamage(damage) {
        if (!this.alive) return false
        this.hp -= damage
        if (this.hp <= 0) {
            this.die()
            return true
        }
        return false
    }

    die() {
        this.alive = false
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => this.sprite.destroy()
        })
    }

    flash(duration = 80) {
        if (!this.sprite || !this.sprite.active) return
        this.sprite.setTintFill(0xffffff)
        this.scene.time.delayedCall(duration, () => {
            if (this.sprite && this.sprite.active) this.sprite.clearTint()
        })
    }

    destroy() {
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy()
        }
    }
}