class TutorialScene extends Phaser.Scene {
    constructor() {
        super("tutorialScene")
    }

    create() {
        const title = this.add.text(416, 180, "UNDEAD SHOOTER", {
            fontFamily: 'Nosifer', fontSize: "65px", fill: "#ff0000"
        }).setOrigin(0.5).setAlpha(0)

        const move = this.add.text(416, 320, "A / D — Move", {
            fontFamily: 'Creepster', fontSize: "42px", fill: "#ffffff"
        }).setOrigin(0.5).setAlpha(0)

        const shoot = this.add.text(416, 380, "Space — Shoot", {
            fontFamily: 'Creepster', fontSize: "42px", fill: "#ffffff"
        }).setOrigin(0.5).setAlpha(0)

        const survive = this.add.text(416, 440, "Survive 25 Waves", {
            fontFamily: 'Creepster', fontSize: "42px", fill: "#ffff00"
        }).setOrigin(0.5).setAlpha(0)

        const press = this.add.text(416, 580, "Press SPACE to begin", {
            fontFamily: 'Creepster', fontSize: "36px", fill: "#aaaaaa"
        }).setOrigin(0.5).setAlpha(0)

        const fadeIn = (target, delay) => {
            this.time.delayedCall(delay, () => {
                this.tweens.add({
                    targets: target,
                    alpha: 1,
                    duration: 600,
                    ease: 'Power2'
                })
            })
        }

        fadeIn(title, 0)
        fadeIn(move, 800)
        fadeIn(shoot, 1500)
        fadeIn(survive, 2300)
        fadeIn(press, 2900)

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("mainScene")
        })
    }
}