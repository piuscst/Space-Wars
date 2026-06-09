class Player extends Entity {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey, 0.8)
        this.hp = 5
        this.maxHp = 5
        this.speed = 600
        this.shootCooldown = 0
        this.fireRate = 200
        this.bulletDamage = 1
        this.bullets = []
        this.targetAngle = 0
        this.textureKey = textureKey
        this.baseScale = 0.8
        this.shieldCount = 3          // player starts with 3
        this.maxShieldCount = 9       // optional cap for HUD sanity
        this.shielded = false
        this.shieldSprite = scene.add.image(x, y, "PlayerShield")
        this.shieldSprite.setVisible(false)
        this.shieldSprite.setDepth(this.sprite.depth + 1)
        this.shieldSprite.setOrigin(0.5)

        this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
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

        const slowing = this.shiftKey.isDown
        const currentSpeed = slowing ? this.speed * 0.5 : this.speed

        this.setVelocity(vx * currentSpeed, vy * currentSpeed)

        // Shrink while precision-moving, grow back when released
        const targetScale = slowing ? this.baseScale * 0.6 : this.baseScale
        const k = 1 - Math.exp(-12 * (delta / 1000))   // frame-rate-independent ease
        this.sprite.setScale(this.sprite.scaleX + (targetScale - this.sprite.scaleX) * k)

        // Shooting
        if (this.spaceKey.isDown && this.shootCooldown <= 0) {
            this.shoot()
            this.shootCooldown = this.fireRate
        }

        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.activateShield()
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

        if (this.shielded) {
            this.shieldSprite.x = this.sprite.x
            this.shieldSprite.y = this.sprite.y
        }
    }

    shoot() {
        const bullet = new PlayerBullet(this.scene, this.x, this.y, 0, -1200)
        this.bullets.push(bullet)
        this.scene.sound.play("sfxLaser", { volume: 0.4 })
    }

    heal(n = 1) {
        this.hp = Math.min(this.maxHp, this.hp + n)
    }

    activateShield() {
        if (this.shielded) return          // already up, don't waste a charge
        if (this.shieldCount <= 0) return  // none in stock
        this.shieldCount--
        this.scene.sound.play("sfxShield", { volume: 0.6 })

        this.shielded = true
        this.shieldSprite.setVisible(true)
        this.shieldSprite.x = this.sprite.x
        this.shieldSprite.y = this.sprite.y

        // Enlarge pop: start small + transparent, tween to full
        this.shieldSprite.setScale(0.2)
        this.shieldSprite.setAlpha(0.2)
        if (this.shieldTween) this.shieldTween.stop()
        this.shieldTween = this.scene.tweens.add({
            targets: this.shieldSprite,
            scale: 1,
            alpha: 1,
            duration: 250,
            ease: 'Back.Out'        // slight overshoot = satisfying "pop"
        })

        if (this.scene.updateShieldHUD) this.scene.updateShieldHUD()
    }

    deactivateShield() {
        this.shielded = false
        // Shrink-and-fade out instead of an instant disappear
        if (this.shieldTween) this.shieldTween.stop()
        this.shieldTween = this.scene.tweens.add({
            targets: this.shieldSprite,
            scale: 1.4,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => this.shieldSprite.setVisible(false)
        })
    }

    addShield(n = 1) {
        this.shieldCount = Math.min(this.maxShieldCount, this.shieldCount + n)
        if (this.scene.updateShieldHUD) this.scene.updateShieldHUD()
    }

    takeDamage(amount) {
        if (this.shielded) {
            this.deactivateShield()
            return
        }
        this.scene.sound.play("sfxHit", { volume: 0.5 })
        super.takeDamage(amount)
    }
}

class StarterShip extends Player {
    constructor(scene, x, y) {
        super(scene, x, y, "PlayerShip1")
    }
}