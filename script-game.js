class ActionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ActionScene' });
    }
    preload() {
    }
    create() {
        console.log('Run Create');
    }
    update() {
    }
}

const game = new Phaser.Game({
    parent: "game",
    type: Phaser.AUTO,
    width: 96,
    height: 96,
    pixelArt: true,
    scene: ActionScene,
    physics: {
        default: "arcade",
        arcade : {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
});

