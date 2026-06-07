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

    update(time, delta) {
    }
}

