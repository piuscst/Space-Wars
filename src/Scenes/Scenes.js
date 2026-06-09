// ============================================================
//  AutoPlayer — purely visual wandering ship used as a
//  background decoration on Game Over and Win screens.
//  Uses scene.add only, no physics.
// ============================================================
class AutoPlayer {
    constructor(scene) {
        this.scene = scene
        const w = scene.scale.width
        const h = scene.scale.height
        this.w = w
        this.h = h

        this.sprite = scene.add.image(w / 2, h - 100, "PlayerShip1")
        this.sprite.setScale(0.8).setAlpha(0.55)

        this.bullets  = []
        this.vx = 0
        this.vy = 0
        this.targetX  = w / 2
        this.targetY  = h - 120
        this.retargetTimer = 0
        this.shootTimer    = 0
    }

    update(delta) {
        const dt = delta / 1000

        this.retargetTimer -= delta
        if (this.retargetTimer <= 0) {
            this.retargetTimer = 900 + Math.random() * 1200
            this.targetX = 80 + Math.random() * (this.w - 160)
            this.targetY = this.h - 60 - Math.random() * 180
        }

        const k = 1 - Math.exp(-5 * dt)
        this.vx += ((this.targetX - this.sprite.x) * 3 - this.vx) * k
        this.vy += ((this.targetY - this.sprite.y) * 3 - this.vy) * k
        this.sprite.x += this.vx * dt
        this.sprite.y += this.vy * dt

        this.shootTimer -= delta
        if (this.shootTimer <= 0) {
            this.shootTimer = 160 + Math.random() * 120
            const bullet = new PlayerBullet(this.scene, this.sprite.x, this.sprite.y, 0, -1200)
            this.bullets.push(bullet)
        }

        // PlayerBullet moves + culls itself; just call update and prune dead ones
        for (const b of this.bullets) b.update(delta)
        this.bullets = this.bullets.filter(b => {
            if (!b.alive) { b.destroy(); return false }
            return true
        })
    }

    destroy() {
        this.sprite.destroy()
        for (const b of this.bullets) b.destroy()
        this.bullets = []
    }
}

// ============================================================
//  MenuScene
// ============================================================
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: "MenuScene" }) }

    preload() {
        this.load.setPath("./assets/")

        // Player Sprites
        this.load.image("PlayerShip1", "playerShip1_blue.png")
        this.load.image("PlayerShip2", "playerShip2_blue.png")
        this.load.image("PlayerShip3", "playerShip3_blue.png")
        this.load.image("PlayerBullet", "laserBlue16.png")
        this.load.image("PlayerBullet2", "laserBlue08.png")
        this.load.image("PlayerLife", "playerLife1_blue.png")
        this.load.image("PlayerShieldPowerUp", "powerupBlue_shield.png")
        this.load.image("PlayerShield", "shield3.png")
        this.load.image("PlayerHealthPowerUp", "pill_red.png")

        // Enemy Sprites
        this.load.image("EnemyShip1", "enemyRed1.png")
        this.load.image("EnemyShip1_Upgraded", "enemyRed3.png")
        this.load.image("EnemyShip2", "enemyBlue2.png")
        this.load.image("EnemyShip2_Upgraded", "enemyBlue4.png")
        this.load.image("EnemyShip3", "enemyGreen3.png")
        this.load.image("EnemyShip3_Upgraded", "enemyGreen5.png")
        this.load.image("EnemyBullet", "laserRed16.png")

        // Boss Sprites
        this.load.image("cockpitBlue", "cockpitBlue_0.png")
        this.load.image("wingBlue", "wingBlue_4.png")

        this.load.image("cockpitYellow", "cockpitYellow_4.png")
        this.load.image("wingYellow", "wingYellow_0.png")

        this.load.image("cockpitRed", "cockpitRed_3.png")
        this.load.image("wingRed", "wingRed_7.png")

        this.load.image("gun00", "gun00.png")
        this.load.image("gun05", "gun05.png")
        this.load.image("beam", "beam6.png")

        // SFX
        this.load.audio("sfxHit", "impactMetal_004.ogg")
        this.load.audio("sfxLaser", "laserSmall_004.ogg")
        this.load.audio("sfxShield", "forceField_003.ogg")
        this.load.audio("sfxDeath", "explosionCrunch_000.ogg")
        this.load.audio("sfxUpgrade", "upgrade_sfx.mp3")
    }

    create() {
        const w = this.scale.width
        const h = this.scale.height

        this.add.rectangle(0, 0, w, h, 0x000011).setOrigin(0)
        this._makeStars(120)

        this.add.text(w / 2, h * 0.16, "Space Wars", {
            fontSize: "54px", fontFamily: "monospace",
            color: "#ffffff", stroke: "#4488ff", strokeThickness: 6
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.26, "Defeat all three bosses", {
            fontSize: "25px", fontFamily: "monospace", color: "#8899ff"
        }).setOrigin(0.5)

        // Controls box
        const bx = w / 2, by = h * 0.51
        this.add.rectangle(bx, by, 360, 210, 0x001133, 0.85).setStrokeStyle(1, 0x334466)
        this.add.text(bx, by - 85, "CONTROLS", {
            fontSize: "18px", fontFamily: "monospace", color: "#4488ff"
        }).setOrigin(0.5)

        const controls = [
            ["ARROW KEYS / WASD", "Move"],
            ["SPACE",             "Shoot"],
            ["E",                 "Activate shield"],
            ["SHIFT",             "Slow / precision move"],
        ]
        controls.forEach(([key, desc], i) => {
            const y = by - 52 + i * 36
            this.add.text(bx - 158, y, key,  { fontSize: "13px", fontFamily: "monospace", color: "#ccddff" })
            this.add.text(bx + 8,   y, desc, { fontSize: "13px", fontFamily: "monospace", color: "#667799" })
        })

        // Play button
        const btn = this.add.rectangle(w / 2, h * 0.79, 220, 52, 0x113366)
            .setStrokeStyle(2, 0x4488ff).setInteractive({ useHandCursor: true })
        const btnTxt = this.add.text(w / 2, h * 0.79, "▶  PLAY", {
            fontSize: "22px", fontFamily: "monospace", color: "#ffffff"
        }).setOrigin(0.5)

        btn.on("pointerover",  () => { btn.setFillStyle(0x224488); btnTxt.setColor("#88ccff") })
        btn.on("pointerout",   () => { btn.setFillStyle(0x113366); btnTxt.setColor("#ffffff") })
        btn.on("pointerdown",  () => this._goto("MainScene"))

        this.input.keyboard.once("keydown-ENTER", () => this._goto("MainScene"))
        this.input.keyboard.once("keydown-SPACE", () => this._goto("MainScene"))

        this.cameras.main.fadeIn(600, 0, 0, 0)
    }

    _goto(key) {
        this.cameras.main.fadeOut(400, 0, 0, 0)
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(key))
    }

    _makeStars(count) {
        this.stars = []
        const w = this.scale.width, h = this.scale.height
        for (let i = 0; i < count; i++) {
            const sz = Math.random() < 0.3 ? 2 : 1
            const s  = this.add.rectangle(Math.random() * w, Math.random() * h, sz, sz, 0xffffff, 0.3 + Math.random() * 0.6)
            this.stars.push({ obj: s, speed: 0.3 + Math.random() * 0.8 })
        }
    }

    update() {
        for (const s of this.stars) {
            s.obj.y += s.speed
            if (s.obj.y > this.scale.height + 4) s.obj.y = -4
        }
    }
}

// ============================================================
//  GameOverScene
// ============================================================
class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: "GameOverScene" }) }

    create(data) {
        const w = this.scale.width, h = this.scale.height
        const score = data?.score ?? 0

        this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0)
        this._makeStars(100)
        this.autoPlayer = new AutoPlayer(this)
        this.add.rectangle(0, 0, w, h, 0x330000, 0.4).setOrigin(0)

        this.add.text(w / 2, h * 0.28, "GAME OVER", {
            fontSize: "62px", fontFamily: "monospace",
            color: "#ff2222", stroke: "#000000", strokeThickness: 8
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.42, "You were defeated.", {
            fontSize: "19px", fontFamily: "monospace", color: "#ff8888"
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.50, `SCORE: ${score}`, {
            fontSize: "22px", fontFamily: "monospace", color: "#ffaaaa"
        }).setOrigin(0.5)

        this._makeButton(w / 2, h * 0.64, "↩  RETRY",  () => this._goto("MainScene"))
        this._makeButton(w / 2, h * 0.75, "⌂  MENU",   () => this._goto("MenuScene"))

        this.add.text(w / 2, h * 0.88, "R  retry  ·  M  menu", {
            fontSize: "13px", fontFamily: "monospace", color: "#664444"
        }).setOrigin(0.5)

        this.input.keyboard.on("keydown-R", () => this._goto("MainScene"))
        this.input.keyboard.on("keydown-M", () => this._goto("MenuScene"))

        this.cameras.main.fadeIn(500, 0, 0, 0)
    }

    _makeButton(x, y, label, cb) {
        const btn = this.add.rectangle(x, y, 240, 48, 0x330011).setStrokeStyle(2, 0xff3333).setInteractive({ useHandCursor: true })
        const txt = this.add.text(x, y, label, { fontSize: "20px", fontFamily: "monospace", color: "#ffffff" }).setOrigin(0.5)
        btn.on("pointerover",  () => { btn.setFillStyle(0x660022); txt.setColor("#ff8888") })
        btn.on("pointerout",   () => { btn.setFillStyle(0x330011); txt.setColor("#ffffff") })
        btn.on("pointerdown",  cb)
    }

    _makeStars(count) {
        this.stars = []
        const w = this.scale.width, h = this.scale.height
        for (let i = 0; i < count; i++) {
            const sz = Math.random() < 0.3 ? 2 : 1
            const s  = this.add.rectangle(Math.random() * w, Math.random() * h, sz, sz, 0xffffff, 0.3 + Math.random() * 0.5)
            this.stars.push({ obj: s, speed: 0.4 + Math.random() * 1.0 })
        }
    }

    _goto(key) {
        this.cameras.main.fadeOut(400, 0, 0, 0)
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(key))
    }

    update(time, delta) {
        for (const s of this.stars) { s.obj.y += s.speed; if (s.obj.y > this.scale.height + 4) s.obj.y = -4 }
        this.autoPlayer.update(delta)
    }
}

// ============================================================
//  WinScene
// ============================================================
class WinScene extends Phaser.Scene {
    constructor() { super({ key: "WinScene" }) }

    create(data) {
        const w = this.scale.width, h = this.scale.height
        const score = data?.score ?? 0

        this.add.rectangle(0, 0, w, h, 0x000008).setOrigin(0)
        this._makeStars(120)
        this.autoPlayer = new AutoPlayer(this)
        this.add.rectangle(0, 0, w, h, 0x221100, 0.3).setOrigin(0)

        this.add.text(w / 2, h * 0.20, "YOU WIN!", {
            fontSize: "66px", fontFamily: "monospace",
            color: "#ffdd00", stroke: "#000000", strokeThickness: 8
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.34, "All bosses defeated.", {
            fontSize: "19px", fontFamily: "monospace", color: "#ffcc66"
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.43, `FINAL SCORE: ${score}`, {
            fontSize: "24px", fontFamily: "monospace", color: "#ffee88"
        }).setOrigin(0.5)

        this.add.text(w / 2, h * 0.51, "The galaxy is safe... for now.", {
            fontSize: "15px", fontFamily: "monospace", color: "#998855"
        }).setOrigin(0.5)

        // Starburst
        this.sparks = []
        for (let i = 0; i < 28; i++) {
            const angle = (Math.PI * 2 / 28) * i
            this.sparks.push({
                obj:  this.add.rectangle(w / 2, h * 0.20, 3, 3, 0xffee44, 0.9),
                vx:   Math.cos(angle) * (60 + Math.random() * 80),
                vy:   Math.sin(angle) * (60 + Math.random() * 80),
                life: 1.0
            })
        }

        this._makeButton(w / 2, h * 0.65, "↺  PLAY AGAIN", () => this._goto("MainScene"))
        this._makeButton(w / 2, h * 0.76, "⌂  MENU",       () => this._goto("MenuScene"))

        this.add.text(w / 2, h * 0.89, "R  play again  ·  M  menu", {
            fontSize: "13px", fontFamily: "monospace", color: "#665533"
        }).setOrigin(0.5)

        this.input.keyboard.on("keydown-R", () => this._goto("MainScene"))
        this.input.keyboard.on("keydown-M", () => this._goto("MenuScene"))

        this.cameras.main.fadeIn(600, 0, 0, 0)
    }

    _makeButton(x, y, label, cb) {
        const btn = this.add.rectangle(x, y, 260, 48, 0x332200).setStrokeStyle(2, 0xffcc00).setInteractive({ useHandCursor: true })
        const txt = this.add.text(x, y, label, { fontSize: "19px", fontFamily: "monospace", color: "#ffffff" }).setOrigin(0.5)
        btn.on("pointerover",  () => { btn.setFillStyle(0x664400); txt.setColor("#ffdd88") })
        btn.on("pointerout",   () => { btn.setFillStyle(0x332200); txt.setColor("#ffffff") })
        btn.on("pointerdown",  cb)
    }

    _makeStars(count) {
        this.stars = []
        const w = this.scale.width, h = this.scale.height
        for (let i = 0; i < count; i++) {
            const sz = Math.random() < 0.3 ? 2 : 1
            const s  = this.add.rectangle(Math.random() * w, Math.random() * h, sz, sz, 0xffffff, 0.3 + Math.random() * 0.6)
            this.stars.push({ obj: s, speed: 0.3 + Math.random() * 0.8 })
        }
    }

    _goto(key) {
        this.cameras.main.fadeOut(400, 0, 0, 0)
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(key))
    }

    update(time, delta) {
        const dt = delta / 1000
        for (const s of this.stars) { s.obj.y += s.speed; if (s.obj.y > this.scale.height + 4) s.obj.y = -4 }
        for (const sp of this.sparks) {
            sp.obj.x += sp.vx * dt; sp.obj.y += sp.vy * dt
            sp.vy += 40 * dt; sp.life -= dt * 0.4
            sp.obj.setAlpha(Math.max(0, sp.life))
        }
        this.autoPlayer.update(delta)
    }
}