class Entity {
    constructor(scene, x, y, textureKey, scale = 1.5) {
        this.scene = scene
        this.sprite = scene.add.sprite(x, y, textureKey)
        this.sprite.setScale(scale)
        this.hp = 1
        this.maxHp = 1
        this.alive = true
    }

    takeDamage(amount) {
        if (!this.alive) return
        this.hp -= amount
        console.log("takeDamage called, hp:", this.hp)
        console.log("Flashed!")
        if (this.hp <= 0) {
            this.hp = 0
            this.die()
            return true
        }

        this.flash()
        return false
    }

    flash() {
        if (!this.sprite || !this.sprite.active) return
        this.sprite.setAlpha(0.2)
        this.scene.time.delayedCall(200, () => {
            if (this.sprite && this.sprite.active) this.sprite.setAlpha(1)
        })
    }

    die() {
        this.alive = false
        this.sprite.destroy()
    }

    get x() {return this.sprite.x}
    get y() {return this.sprite.y}

    set x(val) {this.sprite.x = val}
    set y(val) {this.sprite.y = val}

    getBounds() {
        return this.sprite.getBounds()
    }

    update (time, delta) {

    }
}