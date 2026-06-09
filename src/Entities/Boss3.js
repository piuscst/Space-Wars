// ============================================================
//  Boss3 — Berserker
//  Phase 1: erratic zigzag, aimed burst fire
//  Phase 2: starts ramming + wider spreads
//  Phase 3: combo rams, wall bouncing, rapid chaos fire
// ============================================================
class Boss3 extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, "cockpitBlue", 1)
        this.hp    = 70
        this.maxHp = 70
        this.points = 12000
        this.phase = 1
        this.bullets = []
        this.shootTimer = 0
        this.state = "entering"

        this.speed = 140
        this.vx    = 0
        this.vy    = 0
        this.homeX = x
        this.homeY = y
        this.loopTimer = 0

        // Zigzag
        this.zigTimer    = 0
        this.zigAngle    = 0

        // Ram
        this.ramState    = null   // null | "telegraphing" | "ramming"
        this.ramTimer    = 0
        this.ramCooldown = 3500
        this.ramAngle    = 0
        this.ramCombo    = 0

        this.activePhase = 1
        this.rot = 0
        this.bobTimer = 0

        // ---- Parts (no separate gun parts — fires from body) ----

        this.leftBeam  = new BossPart(scene, "beam", 1.1)
        this.rightBeam = new BossPart(scene, "beam", 1.1)
        this.rightBeam.sprite.setFlipX(true)

        this.cockpit = new BossPart(scene, "cockpitRed", 1.1)
        this.cockpit.hp    = 70
        this.cockpit.maxHp = 70

        this.leftWing  = new BossPart(scene, "wingRed", 1.1)
        this.leftWing.sprite.setFlipX(true)
        this.rightWing = new BossPart(scene, "wingRed", 1.1)

        this.guns  = []
        this.parts = [this.cockpit, this.leftWing, this.rightWing, this.leftBeam, this.rightBeam]

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
        const radius = 100 * Math.exp(-t * 1.1)
        const tx = this.homeX + Math.cos(t * 4) * radius
        const ty = this.homeY + Math.sin(t * 4) * radius * 0.4
        this.sprite.x = this.damp(this.sprite.x, tx, 6, dt)
        this.sprite.y = this.damp(this.sprite.y, ty, 3, dt)
        if (this.loopTimer > 2800 && radius < 6) {
            this.state    = "fighting"
            this.zigAngle = Math.random() * Math.PI * 2
        }
    }

    updateFighting(delta) {
        const dt = delta / 1000
        const rawPhase = this.getPhase()
        const player   = this.scene.player
        const w = this.scene.scale.width
        const h = this.scene.scale.height

        if (rawPhase !== this.activePhase) {
            this.activePhase = rawPhase
            // don't nuke an in-progress ram on phase change; just shorten next cooldown
            this.ramCooldown = Math.min(this.ramCooldown, 1200)
        }
        const phase = this.activePhase

        // ---- Telegraph ----
        if (this.ramState === "telegraphing") {
            this.ramTimer -= delta
            if (player && player.alive) {
                this.ramAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
            }
            this.sprite.x -= Math.cos(this.ramAngle) * 30 * dt
            this.sprite.y -= Math.sin(this.ramAngle) * 30 * dt
            if (this.ramTimer <= 0) {
                this.ramState = "ramming"
                this.ramHitPlayer = false   // <- new: this ram hasn't connected yet
            }
            return
        }

        // ---- Ram ----
        if (this.ramState === "ramming") {
            const ramSpd = this.speed * (phase === 3 ? 8 : 6)
            this.sprite.x += Math.cos(this.ramAngle) * ramSpd * dt
            this.sprite.y += Math.sin(this.ramAngle) * ramSpd * dt

            if (phase === 3) {
                if (this.x < 60)     { this.sprite.x = 60;     this.ramAngle = Math.PI - this.ramAngle }
                if (this.x > w - 60) { this.sprite.x = w - 60; this.ramAngle = Math.PI - this.ramAngle }
                if (this.y < 60)     { this.sprite.y = 60;     this.ramAngle = -this.ramAngle }
            }

            const offScreen = this.y > h + 80 || this.y < -80 || this.x < -80 || this.x > w + 80
            if (offScreen) {
                this.ramCombo--
                if (this.ramCombo > 0) {
                    this.sprite.x = Phaser.Math.Clamp(this.homeX + (Math.random() - 0.5) * 200, 80, w - 80)
                    this.sprite.y = -40
                    this.ramState = "telegraphing"
                    this.ramTimer = 320
                } else {
                    this.sprite.x = w / 2
                    this.sprite.y = -40
                    this.ramState = null
                    this.state    = "returning"
                    this.homeX = w / 2
                    this.homeY = 120
                }
            }
            return
        }

        // ---- Zigzag wander ----
        this.zigTimer -= delta
        if (this.zigTimer <= 0) {
            const interval = phase === 3 ? 300 : phase === 2 ? 450 : 650
            this.zigTimer = interval + Math.random() * 200
            let baseAngle = Math.random() * Math.PI * 2
            if (player && player.alive) {
                const toPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
                baseAngle = toPlayer + (Math.random() - 0.5) * (phase === 1 ? 2.5 : 1.8)
            }
            this.zigAngle = baseAngle
        }

        const spd = this.speed * (phase === 3 ? 2.2 : phase === 2 ? 1.6 : 1.0)
        this.vx = this.damp(this.vx, Math.cos(this.zigAngle) * spd, 5, dt)
        this.vy = this.damp(this.vy, Math.sin(this.zigAngle) * spd, 5, dt)
        this.sprite.x += this.vx * dt
        this.sprite.y += this.vy * dt

        // Hard clamp to the top band + steer the zig target back inside,
        // so it can't oscillate on the boundary.
        const topMargin = 70, botLimit = h * 0.5, sideMargin = 70
        if (this.x < sideMargin)     { this.sprite.x = sideMargin;     this.vx = Math.abs(this.vx); this.zigAngle = Math.random() * Math.PI - Math.PI / 2 }
        if (this.x > w - sideMargin) { this.sprite.x = w - sideMargin; this.vx = -Math.abs(this.vx); this.zigAngle = Math.random() * Math.PI + Math.PI / 2 }
        if (this.y < topMargin)      { this.sprite.y = topMargin;      this.vy = Math.abs(this.vy) }
        if (this.y > botLimit)       { this.sprite.y = botLimit;       this.vy = -Math.abs(this.vy); this.zigAngle = -Math.abs(this.zigAngle) } // force an upward target

        // ---- Trigger ram (ALL phases now) ----
        this.ramCooldown -= delta
        if (this.ramCooldown <= 0 && player && player.alive) {
            this.ramCooldown = phase === 3 ? 1400 : phase === 2 ? 2400 : 3200
            this.ramCombo    = phase === 3 ? 2 + Math.floor(Math.random() * 2) : 1
            this.ramState    = "telegraphing"
            this.ramTimer    = phase === 3 ? 280 : 420
            this.homeX = this.x
            this.homeY = this.y
        }
    }

    updateShooting(delta) {
        const phase  = this.activePhase
        const player = this.scene.player
        if (!player || !player.alive) return
        if (this.ramState !== null) return  // silent during rams

        this.shootTimer -= delta
        const rate = phase === 3 ? 350 : phase === 2 ? 600 : 900
        if (this.shootTimer > 0) return
        this.shootTimer = rate

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
        const count  = phase === 3 ? 5 : phase === 2 ? 3 : 2
        const step   = phase === 3 ? 0.28 : 0.22
        const spd    = phase === 3 ? 500 : 420

        for (let i = -(count - 1) / 2; i <= (count - 1) / 2; i++) {
            const angle = baseAngle + i * step
            this.spawnBullet(this.x, this.y + 40,
                Math.cos(angle) * spd, Math.sin(angle) * spd)
        }
    }

    updatePartPositions(delta) {
        const dt  = delta / 1000
        const x   = this.x, y = this.y

        let targetRot = 0
        if (this.ramState === "ramming" || this.ramState === "telegraphing") {
            targetRot = this.ramAngle - Math.PI / 2
        } else if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
            targetRot = Math.atan2(this.vy, this.vx) - Math.PI / 2
        }
        this.rot = this.dampAngle(this.rot, targetRot, 6, dt)
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

        placeFixed(this.leftBeam,  -35, -5, rot)
        placeFixed(this.rightBeam,  35, -5, rot)

        place(this.cockpit,    0,   0)
        place(this.leftWing,  -65, 15)
        place(this.rightWing,  65, 15)

        // Flash white during telegraph, red otherwise
        if (this.ramState === "telegraphing") {
            const flash = Math.floor(Date.now() / 80) % 2 === 0
            const tint  = flash ? 0xffffff : 0xffffff
            for (const p of this.parts) if (p.sprite.active) p.sprite.setTint(tint)
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

    update(time, delta) {
        if (!this.alive) { this.updateBullets(delta); return }

        this.bobTimer += delta

        if (this.state === "entering") {
            this.updateEntrance(delta)
        } else if (this.state === "returning") {
            const dx = this.homeX - this.sprite.x
            const dy = this.homeY - this.sprite.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const step = this.speed * 2 * (delta / 1000)
            if (dist <= step) {
                this.sprite.x = this.homeX; this.sprite.y = this.homeY
                this.state = "fighting"
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

        this.hp    = this.cockpit.hp
        this.phase = this.getPhase()

        if (!this.cockpit.alive) this.die()
    }

    die() {
        if (!this.alive) return
        this.alive = false
        for (const p of this.parts) p.destroy()
        this.bullets = []
        this.sprite.destroy()
        console.log("Boss3 defeated!")
    }

    destroy() {
        for (const p of this.parts) p.destroy()
        this.bullets = []
        if (this.sprite && this.sprite.active) this.sprite.destroy()
    }
}