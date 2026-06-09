
// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.AUTO,
    render: { pixelArt: true},
    width: 832,
    height: 832,
    scene: [MenuScene, Main, GameOverScene, WinScene],
    backgroundColor: 0x030303,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
}

const game = new Phaser.Game(config);