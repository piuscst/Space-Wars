const WAVES = [
    // --- Act 1 ---
    { enemies: 6,  speed: 300, formation: "line",  shootRate: 2500, hp: 1, points: 100 },
    { enemies: 10, speed: 300, formation: "v",     shootRate: 2000, hp: 1, points: 150 },
    { enemies: 12, speed: 300, formation: "line",  shootRate: 1800, hp: 2, points: 200, composition: [
        { type: "shooter", count: 4, row: 0 },
        { type: "drift",   count: 8, row: 1 },
    ]},
    { enemies: 14, speed: 300, formation: "box",   shootRate: 2500, hp: 1, points: 100, composition: [
        { type: "charger", count: 4, row: 0 },
        { type: "drift",   count: 10, row: 1 },
    ]},
    { enemies: 18, speed: 300, formation: "line",  shootRate: 1500, hp: 2, points: 250, composition: [
        { type: "shooter", count: 6, row: 0 },
        { type: "charger", count: 4, row: 1 },
        { type: "drift",   count: 8, row: 2 },
    ]},
    { boss: true, bossType: "Boss1" },

    // --- Act 2 ---
    { enemies: 14, speed: 240, formation: "box",   shootRate: 1400, hp: 2, points: 300 },
    { enemies: 16, speed: 250, formation: "v",     shootRate: 1300, hp: 2, points: 300, composition: [
        { type: "shooter", count: 6,  row: 0 },
        { type: "charger", count: 4,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { enemies: 18, speed: 260, formation: "line",  shootRate: 1200, hp: 3, points: 350, composition: [
        { type: "shooter", count: 6,  row: 0 },
        { type: "charger", count: 6,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { enemies: 20, speed: 270, formation: "line",  shootRate: 1100, hp: 3, points: 400, composition: [
        { type: "shooter", count: 8,  row: 0 },
        { type: "charger", count: 6,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { enemies: 20, speed: 280, formation: "box",   shootRate: 1000, hp: 3, points: 400, composition: [
        { type: "shooter", count: 6,  row: 0 },
        { type: "charger", count: 8,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { boss: true, bossType: "Boss2" },

    // --- Act 3 ---
    { enemies: 18, speed: 290, formation: "line",  shootRate: 900,  hp: 3, points: 450, composition: [
        { type: "shooter", count: 6,  row: 0 },
        { type: "charger", count: 6,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { enemies: 20, speed: 300, formation: "v",     shootRate: 850,  hp: 4, points: 500, composition: [
        { type: "shooter", count: 6,  row: 0 },
        { type: "charger", count: 8,  row: 1 },
        { type: "drift",   count: 6,  row: 2 },
    ]},
    { enemies: 22, speed: 310, formation: "line",  shootRate: 800,  hp: 4, points: 550, composition: [
        { type: "shooter", count: 8,  row: 0 },
        { type: "charger", count: 6,  row: 1 },
        { type: "drift",   count: 8,  row: 2 },
    ]},
    { enemies: 24, speed: 320, formation: "line",  shootRate: 750,  hp: 4, points: 600, composition: [
        { type: "shooter", count: 8,  row: 0 },
        { type: "charger", count: 8,  row: 1 },
        { type: "drift",   count: 8,  row: 2 },
    ]},
    { enemies: 24, speed: 330, formation: "line",  shootRate: 700,  hp: 5, points: 650, composition: [
        { type: "shooter", count: 8,  row: 0 },
        { type: "charger", count: 8,  row: 1 },
        { type: "drift",   count: 8,  row: 2 },
    ]},
    { boss: true, bossType: "Boss3" },
]