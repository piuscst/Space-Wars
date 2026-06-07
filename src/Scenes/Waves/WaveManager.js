class WaveManager {
    constructor(scene) {
        this.scene = scene
        this.currentWave = 0
        this.enemies = []
        this.waveInProgress = false
        this.waveComplete = false
        this.expectedEnemies = 0
        this.spawnedEnemies = 0
    }

    startNextWave() {
        if (this.currentWave >= WAVES.length) return
        const config = WAVES[this.currentWave]
        this.currentWave++
        this.waveInProgress = true
        this.spawnWave(config)
    }

    spawnWave(config) {
        if (config.boss) {
            this.spawnBoss(config.bossType)
            return
        }

        if (config.composition) {
            this.spawnComposition(config)
            return
        }

        const positions = this.getFormationPositions(config.formation, config.enemies)
        this.expectedEnemies = positions.length  // track how many we expect
        this.spawnedEnemies = 0                  // track how many have actually spawned

        for (let i = 0; i < positions.length; i++) {
            const { x, y } = positions[i]

            this.scene.time.delayedCall(i * 150, () => {
                const homeY = 80 + Math.abs(y + 40)
                const enemy = new DriftEnemy(
                    this.scene, x, y,
                    config.speed,
                    config.shootRate,
                    config.hp,
                    config.points,
                    i,
                    homeY,
                    config.upgraded
                )
                this.enemies.push(enemy)
                this.spawnedEnemies++  // increment as each one spawns
            })
        }
    }

    spawnComposition(config) {
        let globalIndex = 0
        let delay = 0

        this.expectedEnemies = config.composition.reduce((total, group) => total + group.count, 0)
        this.spawnedEnemies = 0

        for (const group of config.composition) {
            // Each group gets its own full-width positions
            const positions = this.getFormationPositions("line", group.count)
            const homeY = 80 + group.row * 80

            for (let i = 0; i < group.count; i++) {
                const spawnDelay = delay + i * 200
                const pos = positions[i]

                this.scene.time.delayedCall(spawnDelay, () => {
                    let enemy
                    if (group.type === "shooter") {
                        enemy = new ShooterEnemy(
                            this.scene, pos.x, -40,
                            config.speed, config.shootRate,
                            config.hp, config.points,
                            globalIndex, homeY, config.upgraded
                        )
                    } else if (group.type === "charger") {
                        enemy = new ChargerEnemy(
                            this.scene, pos.x, -40,
                            config.speed,           // no shootRate as its a Charger
                            config.hp, config.points,
                            globalIndex, homeY, config.upgraded
                        )
                    } else {
                        enemy = new DriftEnemy(
                            this.scene, pos.x, -40,
                            config.speed, config.shootRate,
                            config.hp, config.points,
                            globalIndex, homeY, config.upgraded
                        )
                    }
                    this.enemies.push(enemy)
                    this.spawnedEnemies++
                    globalIndex++
                })
            }

            delay += group.count * 200 + 1000
        }
    }

    getFormationPositions(formation, count) {
        const positions = []
        const w = this.scene.scale.width
        const margin = 80

        // Formations (help from Claude Code)
        if (formation === "line") {
            const spacing = (w - margin * 2) / (count - 1)
            for (let i = 0; i < count; i++) {
                positions.push({ x: margin + i * spacing, y: -40 })
            }

        } else if (formation === "v") {
            const half = Math.ceil(count / 2)
            const spacing = (w - margin * 2) / (half + 1)
            for (let i = 0; i < count; i++) {
                const side = i < half ? i : count - 1 - i
                const depth = Math.abs(i - half + 0.5)
                positions.push({
                    x: margin + spacing * (i % half + 1),
                    y: -40 - depth * 45
                })
            }

        } else if (formation === "box") {
            const cols = Math.ceil(Math.sqrt(count))  // square-ish grid based on count
            const spacingX = (w - margin * 2) / (cols - 1)
            const spacingY = 70
            for (let i = 0; i < count; i++) {
                const col = i % cols
                const row = Math.floor(i / cols)
                positions.push({
                    x: margin + col * spacingX,
                    y: -40 - row * spacingY
                })
            }

        } else if (formation === "spread") {
            for (let i = 0; i < count; i++) {
                positions.push({
                    x: Phaser.Math.Between(margin, w - margin),
                    y: Phaser.Math.Between(-120, -40)
                })
            }

        } else if (formation === "swarm") {
            const cols = Math.ceil(count / 3)  // 3 rows, scale cols to count
            for (let i = 0; i < count; i++) {
                const col = i % cols
                const row = Math.floor(i / cols)
                positions.push({
                    x: margin + (col / (cols - 1)) * (w - margin * 2),
                    y: -40 - row * 60
                })
            }
        }

        return positions
    }

    spawnBoss(type) {
        if (type === "Boss1") {
            const boss = new Boss1(this.scene, this.scene.scale.width / 2, 120)
            this.enemies.push(boss)
            this.expectedEnemies = 1
            this.spawnedEnemies = 1
        }
    }

    update(time, delta) {
        for (const e of this.enemies) {
            e.update(time, delta)
        }

        this.enemies = this.enemies.filter(e => {
            if (!e.alive) {
                
                return false
            }
            return true
        })

        // Only complete wave once all enemies have spawned AND all are dead
        const allSpawned = this.spawnedEnemies >= this.expectedEnemies
        if (this.waveInProgress && allSpawned && this.enemies.length === 0) {
            this.waveInProgress = false
            this.waveComplete = true
        }
    }
}