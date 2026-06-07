
// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: { pixelArt: true, roundPixels: true },
    width: 832,
    height: 832,
    scene: [Main],
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