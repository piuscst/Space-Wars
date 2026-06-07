class Boss1 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, "cockpitBlue", 1)
        this.hp = 50
        this.maxHp = 50
        this.points = 5000
        this.phase = 1
        this.bullets = []
        this.shootTimer = 0
        this.state = "entering"

        this.moveDir = 1
        this.speed = 80
        this.currentSpeed = 80

        // Entrance
        this.homeX = x
        this.homeY = y
        this.loopTimer = 0

        // Loop/dive attack
        this.attackTimer = 8000
        this.attackState = null
        this.attackLoopTimer = 0
        this.diveAngle = 0

        // Charger
        this.chargeAngle = 0
        this.chargeDelay = 2000

        // Phase tracking
        this.activePhase = 1   // the phase actually driving behavior; only
                               // switches between attacks so actions finish first

        // Smoothing state
        this.rot = 0          // smoothed body rotation (angle-lerped each frame)
        this.bobTimer = 0     // continuous timer for the phase-3 hover bob

        // Parts
        this.cockpit = new BossPart(scene, "cockpitBlue", 1)
        this.cockpit.hp = 50
        this.cockpit.maxHp = 50

        this.leftWing  = new BossPart(scene, "wingBlue", 1)
        this.leftWing.sprite.setFlipX(true)
        this.rightWing = new BossPart(scene, "wingBlue", 1)

        this.leftBeam  = new BossPart(scene, "beam", 1)
        this.rightBeam = new BossPart(scene, "beam", 1)
        this.rightBeam.sprite.setFlipX(true)
        this.leftBeam.sprite.setScale(1, 1)
        this.rightBeam.sprite.setScale(1, 1)

        this.gunTL = new BossPart(scene, "gun00", 1)
        this.gunBL = new BossPart(scene, "gun05", 1)
        this.gunTR = new BossPart(scene, "gun00", 1)
        this.gunBR = new BossPart(scene, "gun05", 1)
        this.gunTR.sprite.setFlipX(true)
        this.gunBR.sprite.setFlipX(true)

        this.gunTL.hp = this.gunBL.hp = this.gunTR.hp = this.gunBR.hp = 10
        this.gunTL.maxHp = this.gunBL.maxHp = this.gunTR.maxHp = this.gunBR.maxHp = 10

        this.guns  = [this.gunTL, this.gunBL, this.gunTR, this.gunBR]
        this.parts = [this.cockpit, this.leftWing, this.rightWing, this.leftBeam, this.rightBeam, ...this.guns]

        this.sprite.setAlpha(0)
        this.sprite.body.setEnable(false)
        this.sprite.x = x
        this.sprite.y = -40
    }

    // ---- Frame-rate-independent smoothing helpers ----------------------------
    // Exponential approach toward a target. lambda = "stiffness" (higher = snappier).
    damp(current, target, lambda, dt) {
        return current + (target - current) * (1 - Math.exp(-lambda * dt))
    }

    // Same, but takes the shortest angular path so spins never snap or reverse.
    dampAngle(current, target, lambda, dt) {
        let diff = target - current
        diff -= Math.PI * 2 * Math.floor((diff + Math.PI) / (Math.PI * 2)) // wrap to [-PI, PI)
        return current + diff * (1 - Math.exp(-lambda * dt))
    }

    updateEntrance(delta) {
        const dt = delta / 1000
        this.loopTimer += delta
        const t = this.loopTimer / 1000

        // A swirl whose radius decays to ~0, so the boss eases onto its home
        // position in BOTH axes — no sideways snap at the hand-off.
        const radius = 110 * Math.exp(-t * 1.2)
        const targetX = this.homeX + Math.cos(t * 3.5) * radius
        const targetY = this.homeY + Math.sin(t * 3.5) * radius * 0.4

        this.sprite.x = this.damp(this.sprite.x, targetX, 6, dt)
        this.sprite.y = this.damp(this.sprite.y, targetY, 3, dt)

        // Settle when the swirl has effectively collapsed — position is already
        // on home, so there is nothing to snap.
        if (this.loopTimer > 2800 && radius < 6) {
            this.state = "fighting"
        }
    }

    getPhase() {
        const gunsAlive = this.guns.filter(g => g.alive).length
        const hpPercent = this.cockpit.hp / this.cockpit.maxHp
        if (hpPercent <= 0.3) return 3
        if (gunsAlive <= 2)   return 2
        return 1
    }

    updateFighting(delta) {
        const dt = delta / 1000
        const rawPhase = this.getPhase()
        const player = this.scene.player
        const w = this.scene.scale.width

        // Berserk / phase change is DEFERRED until the boss is between actions,
        // so a dive or charge already in progress gets to finish cleanly.
        if (rawPhase !== this.activePhase && this.attackState === null) {
            this.activePhase = rawPhase
            this.attackTimer = 3000
            this.chargeDelay = 3500
            this.homeX = this.x
            this.homeY = this.y
            this.moveDir = this.x > w / 2 ? 1 : -1
        }

        const phase = this.activePhase

        if (phase === 1) {
            this.attackTimer -= delta

            if (this.attackState === null) {
                this.currentSpeed = this.damp(this.currentSpeed, this.speed, 3, dt)
                this.sprite.x += this.moveDir * this.currentSpeed * dt
                if (this.x > w - 200) this.moveDir = -1
                if (this.x < 200)     this.moveDir = 1

                if (this.attackTimer <= 0) {
                    this.attackTimer = 8000 + Math.random() * 5000
                    this.attackState = "looping"
                    this.attackLoopTimer = 0
                    this.homeX = this.x
                    this.homeY = this.y
                }

            } else if (this.attackState === "looping") {
                this.attackLoopTimer += delta
                const t = this.attackLoopTimer / 1000
                const radius = t * 60
                // radius starts at 0, so the loop begins exactly on home (no jump).
                this.sprite.x = this.homeX + Math.cos(t * 3) * radius
                this.sprite.y = this.homeY + Math.sin(t * 3) * radius

                if (this.attackLoopTimer > 1800) {
                    this.attackState = "diving"
                    if (player && player.alive) {
                        this.diveAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                    } else {
                        this.diveAngle = Math.PI / 2
                    }
                }

            } else if (this.attackState === "diving") {
                // Ballistic motion — continuous from wherever the loop ended.
                const vx = Math.cos(this.diveAngle) * this.speed * 3
                const vy = Math.sin(this.diveAngle) * this.speed * 3
                this.sprite.x += vx * dt
                this.sprite.y += vy * dt

                if (this.y > this.scene.scale.height + 100 ||
                    this.x < -100 || this.x > w + 100) {
                    // Re-enter from the top (off-screen, so the reset is invisible)
                    // then glide back down to home.
                    this.sprite.x = this.homeX
                    this.sprite.y = -40
                    this.attackState = "returning"
                }

            } else if (this.attackState === "returning") {
                const dx = this.homeX - this.sprite.x
                const dy = this.homeY - this.sprite.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const step = this.speed * 2 * dt

                if (dist <= step) {
                    this.sprite.x = this.homeX
                    this.sprite.y = this.homeY
                    this.attackState = null
                } else {
                    this.sprite.x += (dx / dist) * step
                    this.sprite.y += (dy / dist) * step
                }
            }

        } else if (phase === 2) {
            const targetX = this.moveDir > 0 ? w - 200 : 200
            const targetY = 150

            const dx = targetX - this.sprite.x
            const dy = targetY - this.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const step = this.speed * 1.5 * dt

            if (dist > step) {
                this.sprite.x += (dx / dist) * step
                this.sprite.y += (dy / dist) * step
            } else {
                this.sprite.x = targetX
                this.sprite.y = targetY
            }

            this.attackTimer -= delta
            if (this.attackTimer <= 0) {
                this.attackTimer = 8000 + Math.random() * 5000
                this.moveDir *= -1
            }

        } else if (phase === 3) {
            if (this.attackState !== "charging") {
                this.chargeDelay -= delta
                this.sprite.x += this.moveDir * this.speed * 2 * dt
                // Ease into the hover bob instead of assigning y directly, so
                // entering phase 3 (and returning from a charge) never snaps.
                const targetY = 150 + Math.sin(this.bobTimer / 300) * 80
                this.sprite.y = this.damp(this.sprite.y, targetY, 8, dt)

                if (this.x > w - 200) this.moveDir = -1
                if (this.x < 200)     this.moveDir = 1

                if (this.chargeDelay <= 0 && player && player.alive) {
                    this.chargeAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                    this.attackState = "charging"
                    this.chargeDelay = 3500
                }
            } else {
                this.sprite.x += Math.cos(this.chargeAngle) * this.speed * 3 * dt
                this.sprite.y += Math.sin(this.chargeAngle) * this.speed * 3 * dt

                if (this.y > this.scene.scale.height + 100 ||
                    this.y < -100 ||
                    this.x < -100 || this.x > w + 100) {
                    this.sprite.x = this.homeX
                    this.sprite.y = -40
                    this.attackState = null
                    this.state = "returning"
                }
            }
        }
    }

    updateShooting(delta) {
        const phase = this.getPhase()
        const player = this.scene.player
        if (!player || !player.alive) return

        this.shootTimer -= delta
        const shootRate = phase === 3 ? 500 : phase === 2 ? 600 : 1000

        if (this.shootTimer <= 0) {
            this.shootTimer = shootRate

            if (phase === 1) {
                if (this.attackState === null) {
                    for (const gun of this.guns) {
                        if (gun.alive) {
                            const angle = gun.sprite.rotation + Math.PI / 2
                            this.spawnBullet(gun.sprite.x, gun.sprite.y,
                                Math.cos(angle) * 400,
                                Math.sin(angle) * 400)
                        }
                    }
                } else if (this.attackState === "diving") {
                    for (const gun of this.guns) {
                        if (gun.alive) {
                            this.spawnBullet(gun.sprite.x, gun.sprite.y,
                                Math.cos(this.diveAngle) * 500,
                                Math.sin(this.diveAngle) * 500)
                        }
                    }
                }

            } else if (phase === 2) {
                for (const gun of this.guns) {
                    if (gun.alive) {
                        const angle = Phaser.Math.Angle.Between(gun.sprite.x, gun.sprite.y, player.x, player.y)
                        this.spawnBullet(gun.sprite.x, gun.sprite.y,
                            Math.cos(angle) * 500, Math.sin(angle) * 500)
                    }
                }

            } else if (phase === 3) {
                const angles = [-0.25, 0, 0.25]
                for (const offset of angles) {
                    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y) + offset
                    this.spawnBullet(this.x, this.y + 60,
                        Math.cos(angle) * 480, Math.sin(angle) * 480)
                }
            }
        }
    }

    updatePartPositions(delta) {
        const dt = delta / 1000
        const x = this.x
        const y = this.y

        // Smoothly steer the body rotation toward whatever the current state
        // wants, instead of snapping between idle / loop / dive / charge.
        let targetRot = 0
        if (this.attackState === "looping") {
            targetRot = (this.attackLoopTimer / 1000) * 3
        } else if (this.attackState === "diving") {
            targetRot = this.diveAngle - Math.PI / 2
        } else if (this.attackState === "charging") {
            targetRot = this.chargeAngle - Math.PI / 2
        }
        this.rot = this.dampAngle(this.rot, targetRot, 10, dt)
        const rot = this.rot
        const cos = Math.cos(rot)
        const sin = Math.sin(rot)

        const place = (part, ox, oy) => {
            if (!part.sprite.active) return
            part.sprite.x = x + cos * ox - sin * oy
            part.sprite.y = y + sin * ox + cos * oy
            part.sprite.rotation = rot
        }

        const placeFixed = (part, ox, oy, fixedRot = 0) => {
            if (!part.sprite.active) return
            part.sprite.x = x + cos * ox - sin * oy
            part.sprite.y = y + sin * ox + cos * oy
            part.sprite.rotation = fixedRot
        }

        place(this.cockpit,   0,    0)
        place(this.leftWing,  -70,  10)
        place(this.rightWing,  70,  10)
        place(this.gunTL,    -85, -10)
        place(this.gunBL,    -70,  45)
        place(this.gunTR,     85, -10)
        place(this.gunBR,     70,  45)

        placeFixed(this.leftBeam,  -35, -5, rot)
        placeFixed(this.rightBeam,  35, -5, rot)

        // Aim all guns at the player every frame
        const player = this.scene.player
        if (player && player.alive) {
            for (const gun of this.guns) {
                if (gun.alive && gun.sprite.active) {
                    gun.sprite.rotation = Phaser.Math.Angle.Between(
                        gun.sprite.x, gun.sprite.y,
                        player.x, player.y
                    ) - Math.PI / 2  // offset since gun sprites point upward
                }
            }
        }
    }

    spawnBullet(x, y, dx, dy) {
        const bullet = new EnemyBullet(this.scene, x, y, dx, dy, 2)
        this.bullets.push(bullet)
    }

    updateBullets(delta) {
        for (const b of this.bullets) b.update(delta)
        this.bullets = this.bullets.filter(b => {
            if (!b.alive) { b.destroy(); return false }
            return true
        })
    }

    update(time, delta) {
        if (!this.alive) {
            this.updateBullets(delta)
            return
        }

        this.bobTimer += delta // keep the hover phase continuous across states

        if (this.state === "entering") {
            this.updateEntrance(delta)
        } else if (this.state === "returning") {
            const dx = this.homeX - this.sprite.x
            const dy = this.homeY - this.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const step = this.speed * 2 * (delta / 1000)

            if (dist <= step) {
                this.sprite.x = this.homeX
                this.sprite.y = this.homeY
                this.state = "fighting"
                this.attackState = null
            } else {
                this.sprite.x += (dx / dist) * step
                this.sprite.y += (dy / dist) * step
            }
        } else {
            this.updateFighting(delta)
            this.updateShooting(delta)
        }

        this.updatePartPositions(delta)
        this.updateBullets(delta)

        this.hp = this.cockpit.hp
        this.phase = this.getPhase()

        if (!this.cockpit.alive) {
            this.die()
        }
    }

    die() {
        if (!this.alive) return
        this.alive = false
        for (const part of this.parts) part.destroy()
        this.bullets = []
        this.sprite.destroy()
        console.log("Boss1 defeated!")
    }

    destroy() {
        for (const part of this.parts) part.destroy()
        this.bullets = []
        if (this.sprite && this.sprite.active) this.sprite.destroy()
    }
}