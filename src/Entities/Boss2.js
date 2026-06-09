// ============================================================
//  Boss2Minion — extends Enemy so WaveManager / checkCollisions
//  can treat it like any other enemy (bullets vs player, body
//  vs player, player bullets vs body all work automatically).
// ============================================================
class Boss2Minion extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "EnemyShip3", 3, 150, 0, false)
        this.sprite.setTint(0xaa44ff)
        this.sprite.setScale(0.55)

        // Weak homing velocity
        this.vx = (Math.random() - 0.5) * 60
        this.vy = 50 + Math.random() * 40
        this.homingStrength = 0.5 + Math.random() * 0.4
        this.sprite.body.setCollideWorldBounds(false)
    }

    updateMovement(time, delta) {
        const dt = delta / 1000
        const player = this.scene.player

        if (player && player.alive) {
            const dx = player.x - this.x
            const dy = player.y - this.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            this.vx += (dx / dist) * 70 * this.homingStrength * dt
            this.vy += (dy / dist) * 70 * this.homingStrength * dt
        }

        // Cap speed
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        const maxSpd = 170
        if (spd > maxSpd) { this.vx = this.vx / spd * maxSpd; this.vy = this.vy / spd * maxSpd }

        this.sprite.body.setVelocity(this.vx, this.vy)
        this.sprite.rotation += dt * 2

        const h = this.scene.scale.height
        const w = this.scene.scale.width
        if (this.y > h + 60 || this.x < -60 || this.x > w + 60) this.die()
    }

    // On death fire a pop-shot at the player (kamikaze)
    die() {
        if (!this.alive) return
        const player = this.scene.player
        if (player && player.alive) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
            const b = new EnemyBullet(this.scene, this.x, this.y,
                Math.cos(angle) * 260, Math.sin(angle) * 260, 1)
            // Push into the boss bullet list so checkCollisions picks it up
            const boss = this.scene.waveManager.enemies.find(e => e instanceof Boss2)
            if (boss) boss.bullets.push(b)
        }
        super.die()
    }
}

// ============================================================
//  Boss2 — Swarm Queen
//  Phase 1: drifts side-to-side at top, spawns minion waves
//  Phase 2: faster, adds rotating bullet rings
//  Phase 3: drops to mid-screen, short dashes + faster spawns
// ============================================================
class Boss2 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, "cockpitBlue", 1)
        this.hp     = 40
        this.maxHp  = 40
        this.points = 8000
        this.phase  = 1
        this.bullets  = []
        this.minions  = []   // kept separately so WaveManager can count them
        this.shootTimer = 0
        this.spawnTimer = 3500
        this.ringTimer  = 0
        this.ringAngle  = 0
        this.dashTimer  = 0
        this.dashState  = null
        this.dashAngle  = 0
        this.dashCooldown = 3000
        this.state = "entering"

        this.moveDir = 1
        this.speed   = 55
        this.homeX = x
        this.homeY = y
        this.loopTimer = 0
        this.activePhase = 1
        this.rot = 0
        this.bobTimer = 0

        // ---- Parts ----
        this.leftBeam  = new BossPart(scene, "beam", 1.3)
        this.rightBeam = new BossPart(scene, "beam", 1.3)
        this.rightBeam.sprite.setFlipX(true)

        this.cockpit = new BossPart(scene, "cockpitYellow", 1.3)
        this.cockpit.hp    = 40
        this.cockpit.maxHp = 40

        this.leftWing  = new BossPart(scene, "wingYellow", 1.3)
        this.leftWing.sprite.setFlipX(true)
        this.rightWing = new BossPart(scene, "wingYellow", 1.3)

        this.gunL = new BossPart(scene, "gun00", 1.3)
        this.gunR = new BossPart(scene, "gun00", 1.3)
        this.gunR.sprite.setFlipX(true)
        this.gunL.hp = this.gunR.hp = 80
        this.gunL.maxHp = this.gunR.maxHp = 80

        this.guns  = [this.gunL, this.gunR]
        this.parts = [this.cockpit, this.leftWing, this.rightWing, this.leftBeam, this.rightBeam, this.gunL, this.gunR]

        this.sprite.setAlpha(0)
        this.sprite.body.setEnable(false)
        this.sprite.x = x
        this.sprite.y = -40
    }

    damp(cur, tgt, lambda, dt) {
        return cur + (tgt - cur) * (1 - Math.exp(-lambda * dt))
    }
    dampAngle(cur, tgt, lambda, dt) {
        let d = tgt - cur
        d -= Math.PI * 2 * Math.floor((d + Math.PI) / (Math.PI * 2))
        return cur + d * (1 - Math.exp(-lambda * dt))
    }

    getPhase() {
        const pct = this.cockpit.hp / this.cockpit.maxHp
        if (pct <= 0.25) return 3
        if (pct <= 0.6)  return 2
        return 1
    }

    updateEntrance(delta) {
        const dt = delta / 1000
        this.loopTimer += delta
        const t = this.loopTimer / 1000
        const radius = 90 * Math.exp(-t * 1.1)
        const tx = this.homeX + Math.cos(t * 3) * radius
        const ty = this.homeY + Math.sin(t * 3) * radius * 0.4
        this.sprite.x = this.damp(this.sprite.x, tx, 6, dt)
        this.sprite.y = this.damp(this.sprite.y, ty, 3, dt)
        if (this.loopTimer > 2800 && radius < 6) this.state = "fighting"
    }

    updateFighting(delta) {
        const dt = delta / 1000
        const rawPhase = this.getPhase()
        const player = this.scene.player
        const w = this.scene.scale.width

        if (rawPhase !== this.activePhase) {
            this.activePhase = rawPhase
            this.dashCooldown = 2500
            this.homeX = this.x
            this.homeY = this.y
            this.moveDir = this.x > w / 2 ? 1 : -1
        }

        const phase = this.activePhase

        if (phase === 1 || phase === 2) {
            const targetY = phase === 1 ? 120 : 140
            const spd     = phase === 1 ? this.speed : this.speed * 1.6
            this.sprite.x += this.moveDir * spd * dt
            this.sprite.y  = this.damp(this.sprite.y, targetY, 3, dt)
            if (this.x > w - 180) this.moveDir = -1
            if (this.x < 180)     this.moveDir =  1

        } else {
            // Phase 3: center hover + short dashes
            if (this.dashState !== "dashing") {
                this.dashCooldown -= delta
                const targetY = 180 + Math.sin(this.bobTimer / 400) * 60
                this.sprite.x  = this.damp(this.sprite.x, w / 2, 1.5, dt)
                this.sprite.y  = this.damp(this.sprite.y, targetY, 5, dt)

                if (this.dashCooldown <= 0 && player && player.alive) {
                    this.dashAngle    = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                    this.dashState    = "dashing"
                    this.dashCooldown = 2200
                    this.dashTimer    = 0
                }
            } else {
                this.sprite.x += Math.cos(this.dashAngle) * this.speed * 5 * dt
                this.sprite.y += Math.sin(this.dashAngle) * this.speed * 5 * dt

                 if (this.y > this.scene.scale.height + 60 || this.y < -60 ||
                        this.x < -60 || this.x > w + 60) {
                    this.sprite.x  = w / 2
                    this.sprite.y  = -40
                    this.dashState = null
                    this.state     = "returning"
                    this.homeX     = w / 2
                    this.homeY     = 180
                }
            }
        }
    }

    updateSpawning(delta) {
        const phase = this.activePhase
        const spawnRate = phase === 3 ? 2200 : phase === 2 ? 3500 : 5000

        this.spawnTimer -= delta
        if (this.spawnTimer <= 0) {
            this.spawnTimer = spawnRate
            const count = phase === 3 ? 5 : phase === 2 ? 4 : 3

            for (let i = 0; i < count; i++) {
                const ox = (i - (count - 1) / 2) * 55
                const sx = this.x + ox
                const homeY = 120 + Math.random() * 120   // where it settles

                const roll = Math.random()
                let m
                if (roll < 0.34) {
                    m = new ShooterEnemy(this.scene, sx, -40, 120, 1400, 2, 150, i, homeY, true)
                } else if (roll < 0.67) {
                    m = new ChargerEnemy(this.scene, sx, -40, 120, 2, 150, i, homeY, true)
                } else {
                    m = new DriftEnemy(this.scene, sx, -40, 120, 1400, 2, 150, i, homeY, true)
                }

                this.minions.push(m)
                this.scene.waveManager.enemies.push(m)
            }
        }

        // Rotating ring bullets in phase 2+
        if (phase >= 2) {
            this.ringTimer -= delta
            const ringRate = phase === 3 ? 800 : 1200
            if (this.ringTimer <= 0) {
                this.ringTimer = ringRate
                const ringCount = phase === 3 ? 12 : 8
                for (let i = 0; i < ringCount; i++) {
                    const angle = this.ringAngle + (Math.PI * 2 / ringCount) * i
                    this.spawnBullet(this.x, this.y,
                        Math.cos(angle) * 200, Math.sin(angle) * 200)
                }
                this.ringAngle += 0.4
            }
        }
    }

    updateShooting(delta) {
        const phase = this.activePhase
        const player = this.scene.player
        if (!player || !player.alive) return

        this.shootTimer -= delta
        const rate = phase === 3 ? 500 : 900
        if (this.shootTimer > 0) return
        this.shootTimer = rate

        for (const gun of this.guns) {
            if (!gun.alive) continue
            const angle = Phaser.Math.Angle.Between(gun.sprite.x, gun.sprite.y, player.x, player.y)
            this.spawnBullet(gun.sprite.x, gun.sprite.y,
                Math.cos(angle) * 380, Math.sin(angle) * 380)
        }
    }

    updatePartPositions(delta) {
        const dt = delta / 1000
        const x = this.x, y = this.y

        let targetRot = 0
        if (this.dashState === "dashing") targetRot = this.dashAngle - Math.PI / 2
        this.rot = this.dampAngle(this.rot, targetRot, 8, dt)
        const rot = this.rot
        const cos = Math.cos(rot), sin = Math.sin(rot)

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

        placeFixed(this.leftBeam,  -40, -5, rot)
        placeFixed(this.rightBeam,  40, -5, rot)

        place(this.cockpit,    0,   0)
        place(this.leftWing,  -80, 15)
        place(this.rightWing,  80, 15)
        place(this.gunL,      -60, 30)
        place(this.gunR,       60, 30)

        const player = this.scene.player
        if (player && player.alive) {
            for (const gun of this.guns) {
                if (gun.alive && gun.sprite.active) {
                    gun.sprite.rotation = Phaser.Math.Angle.Between(
                        gun.sprite.x, gun.sprite.y, player.x, player.y
                    ) - Math.PI / 2
                }
            }
        }
    }

    spawnBullet(x, y, dx, dy) {
        this.bullets.push(new EnemyBullet(this.scene, x, y, dx, dy, 2))
        this.scene.sound.play("sfxLaser", { volume: 0.15, rate: 0.7 })  // lower/deeper than player
    }

    updateBullets(delta) {
        for (const b of this.bullets) b.update(delta)
        this.bullets = this.bullets.filter(b => { if (!b.alive) { b.destroy(); return false } return true })
    }

    updateMinions(delta) {
        for (const m of this.minions) m.update(0, delta)
        // Prune dead ones (waveManager prunes its own copy separately)
        this.minions = this.minions.filter(m => m.alive)
    }

    update(time, delta) {
        if (!this.alive) { this.updateBullets(delta); return }

        this.bobTimer += delta

        if (this.state === "entering") {
            this.updateEntrance(delta)
        } else if (this.state === "returning") {
            const dx = this.homeX - this.sprite.x
            const dy = this.homeY - this.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const step = this.speed * 2.5 * (delta / 1000)
            if (dist <= step) {
                this.sprite.x = this.homeX; this.sprite.y = this.homeY
                this.state = "fighting"; this.dashState = null
            } else {
                this.sprite.x += (dx / dist) * step
                this.sprite.y += (dy / dist) * step
            }
        } else {
            this.updateFighting(delta)
            this.updateSpawning(delta)
            this.updateShooting(delta)
        }

        this.updatePartPositions(delta)
        this.updateBullets(delta)

        this.hp    = this.cockpit.hp
        this.phase = this.getPhase()

        if (!this.cockpit.alive) this.die()
    }

    die() {
        if (!this.alive) return
        this.alive = false
        for (const p of this.parts) p.destroy()
        for (const m of this.minions) m.die()   // <- die(), not destroy()
        this.bullets = []
        this.minions = []
        this.sprite.destroy()
        console.log("Boss2 defeated!")
    }

    destroy() {
        for (const p of this.parts)   p.destroy()
        for (const m of this.minions) m.destroy()
        this.bullets = []
        this.minions = []
        if (this.sprite && this.sprite.active) this.sprite.destroy()
    }
}