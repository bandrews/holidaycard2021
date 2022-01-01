// Global dependencies which return no modules
require('./lib/canvasRenderingContext2DExtensions');
require('./lib/extenders');
require('./lib/plugins');

// External dependencies
var Hammer = require('hammerjs');
var Mousetrap = require('br-mousetrap');

// Method modules
var isMobileDevice = require('./lib/isMobileDevice');

// Game Objects
var SpriteArray = require('./lib/spriteArray');
var Monster = require('./lib/monster');
var Sprite = require('./lib/sprite');
var Snowboarder = require('./lib/snowboarder');
var Skier = require('./lib/skier');
var InfoBox = require('./lib/infoBox');
var Game = require('./lib/game');

// Local variables for starting the game
var mainCanvas = document.getElementById('skifree-canvas');
var dContext = mainCanvas.getContext('2d');
var imageSources = ['sprite-characters.png', 'skifree-objects.png'];
var global = this;
var infoBoxControls = 'Figure out how to control the player.';
//if (isMobileDevice()) infoBoxControls = 'Tap or drag on the piste to control the player';
var sprites = require('./spriteInfo');

var pixelsPerMetre = 18;
var distanceTravelledInMetres = 0;
var lastLedSentAt = 0;
var nextSpawnThreshold = 100;
var isMonsterSpawned = false;

var amIShown = false;

var spawns = {
	100: {
		sprites: [{ sprite: sprites.jump, pos: 4, val: 0 },  /*m*/
			{ sprite: sprites.jump, pos: 6, val: 1 }, 
			{ sprite: sprites.jump, pos: 8, val: 1 },
			{ sprite: sprites.jump, pos: 10, val: 0 },
			{ sprite: sprites.jump, pos: 12, val: 1 }],
		next: 250
	},
	250: {
		sprites: [{ sprite: sprites.jump, pos: 4, val: 0 },  /*e*/
			{ sprite: sprites.jump, pos: 6, val: 0 }, 
			{ sprite: sprites.jump, pos: 8, val: 1 },
			{ sprite: sprites.jump, pos: 10, val: 0 },
			{ sprite: sprites.jump, pos: 12, val: 1 }],
		next: 500
	},
	500: {
		sprites: [{ sprite: sprites.jump, pos: 4, val: 1 },  /*r*/
			{ sprite: sprites.jump, pos: 6, val: 0 }, 
			{ sprite: sprites.jump, pos: 8, val: 0 },
			{ sprite: sprites.jump, pos: 10, val: 1 },
			{ sprite: sprites.jump, pos: 12, val: 0 }],
		next: 1000
	},
	1000: {
		sprites: [{ sprite: sprites.jump, pos: 4, val: 1 },  /*r*/
			{ sprite: sprites.jump, pos: 6, val: 0 }, 
			{ sprite: sprites.jump, pos: 8, val: 0 },
			{ sprite: sprites.jump, pos: 10, val: 1 },
			{ sprite: sprites.jump, pos: 12, val: 0 }],
		next: 1500
	},
	1500: {
		sprites: [{ sprite: sprites.jump, pos: 4, val: 1 },  /*y*/
			{ sprite: sprites.jump, pos: 6, val: 1 }, 
			{ sprite: sprites.jump, pos: 8, val: 0 },
			{ sprite: sprites.jump, pos: 10, val: 0 },
			{ sprite: sprites.jump, pos: 12, val: 1 }],
		next: 9999
	},
}

var monsterDistanceThreshold = 1525;
var livesLeft = 5;
var highScore = 0;
var loseLifeOnObstacleHit = true;
var dropRates = { smallTree: 4, tallTree: 2, jump: 1, thickSnow: 1, rock: 1 };
if (localStorage.getItem('highScore')) highScore = localStorage.getItem('highScore');

function loadImages(sources, next) {
	var loaded = 0;
	var images = {};

	function finish() {
		loaded += 1;
		if (loaded === sources.length) {
			next(images);
		}
	}

	sources.each(function (src) {
		var im = new Image();
		im.onload = finish;
		im.src = src;
		dContext.storeLoadedImage(src, im);
	});
}

function monsterHitsSkierBehaviour(monster, skier) {
	skier.isEatenBy(monster, function () {
		sendRGB(255,0,0,0,10);
		livesLeft -= 1;
		monster.isFull = true;
		monster.isEating = false;
		skier.isBeingEaten = false;
		monster.setSpeed(skier.getSpeed()*4);
		//monster.stopFollowing();
		var randomPositionAbove = dContext.getRandomMapPositionAboveViewport();
		monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1]);
	});
}

function startNeverEndingGame(images) {
	var player;
	var startSign;
	var infoBox;
	var game;

	function resetGame() {
		sendRGB(0,0,0,0,10);
		distanceTravelledInMetres = 0;
		lastLedSentAt = 0;
		nextSpawnThreshold = 100;
		isMonsterSpawned = false;
		livesLeft = 5;
		highScore = localStorage.getItem('highScore');
		game.reset();
		game.addStaticObject(startSign);
	}

	function detectEnd() {
		if (!game.isPaused()) {
			highScore = localStorage.setItem('highScore', distanceTravelledInMetres);
			infoBox.setLines([
				'Game over!',
				'Hit space to restart'
			]);
			game.pause();
			game.cycle();
		}
	}

	function randomlySpawnNPC(spawnFunction, dropRate) {
		var rateModifier = Math.max(800 - mainCanvas.width, 0);
		if (Number.random(1000 + rateModifier) <= dropRate) {
			spawnFunction();
		}
	}

	function spawnMonster() {
		var newMonster = new Monster(sprites.monster);
		var randomPosition = dContext.getRandomMapPositionAboveViewport();
		newMonster.setMapPosition(randomPosition[0], randomPosition[1]);
		newMonster.follow(player);
		newMonster.setSpeed(player.getStandardSpeed() * 3);
		newMonster.onHitting(player, monsterHitsSkierBehaviour);

		game.addMovingObject(newMonster, 'monster');
	}

	function spawnBoarder() {
		var newBoarder = new Snowboarder(sprites.snowboarder);
		var randomPositionAbove = dContext.getRandomMapPositionAboveViewport();
		var randomPositionBelow = dContext.getRandomMapPositionBelowViewport();
		newBoarder.setMapPosition(randomPositionAbove[0], randomPositionAbove[1]);
		newBoarder.setMapPositionTarget(randomPositionBelow[0], randomPositionBelow[1]);
		newBoarder.onHitting(player, sprites.snowboarder.hitBehaviour.skier);

		game.addMovingObject(newBoarder);
	}

	player = new Skier(sprites.skier);
	player.setMapPosition(0, 0);
	player.setMapPositionTarget(0, -10);
	if (loseLifeOnObstacleHit) {
		player.setHitObstacleCb(function () {
			livesLeft -= 1;
		});
	}

	game = new Game(mainCanvas, player);

	startSign = new Sprite(sprites.signStart);
	game.addStaticObject(startSign);
	startSign.setMapPosition(-50, 0);
	dContext.followSprite(player);

	infoBox = new InfoBox({
		initialLines: [
			infoBoxControls,
			'Travelled 0m',
			'High Score: ' + highScore,
			'Skiers left: ' + livesLeft,
			'Original code by Dan Hough (@basicallydan)'
		],
		position: {
			top: 150,
			right: 10
		}
	});

	window.addEventListener('message', function (e) {
		// Get the sent data
		const data = e.data;
	
		if (data === "show")
		{
			resetGame();
			setSendFreq(250);
			amIShown = true;
		}
		else if (data === "hide")
		{
			game.pause();
			setSendFreq(1000000);
			amIShown = false;
		}

	});

	game.beforeCycle(function () {
		var newObjects = [];
		if (player.isMoving) {
			newObjects = Sprite.createObjects([
				{ sprite: sprites.smallTree, dropRate: dropRates.smallTree },
				{ sprite: sprites.tallTree, dropRate: dropRates.tallTree },
				//{ sprite: sprites.jump, dropRate: dropRates.jump },
				{ sprite: sprites.thickSnow, dropRate: dropRates.thickSnow },
				{ sprite: sprites.rock, dropRate: dropRates.rock },
			], {
				rateModifier: Math.max(800 - mainCanvas.width, 0),
				position: function () {
					return dContext.getRandomMapPositionBelowViewport();
				},
				player: player
			});
		}
		if (!game.isPaused()) {
			game.addStaticObjects(newObjects);

			randomlySpawnNPC(spawnBoarder, 0.1);
			distanceTravelledInMetres = parseFloat(player.getPixelsTravelledDownMountain() / pixelsPerMetre).toFixed(1);

			if (distanceTravelledInMetres > monsterDistanceThreshold && !isMonsterSpawned) {
				spawnMonster();
				isMonsterSpawned = true;
			}

			if (distanceTravelledInMetres > nextSpawnThreshold) {
				lastLedSentAt = distanceTravelledInMetres;
				sendRGB(0,128,0,0,10);
				if (spawns[nextSpawnThreshold]) {
					spawns[nextSpawnThreshold].sprites.map(item => {
						let add = (item, x) => {game.addStaticObject(Sprite.createSpecificObject(item, function () { return dContext.SixteenClicksToPosition(item.pos, x); }, player));};
						if (item.val == 0)
						{
							add(item, 0);
						}
						else
						{
							add(item, 0);
							add(item, 10);
							add(item, 20);
						}
					
					});

					nextSpawnThreshold = spawns[nextSpawnThreshold].next;
				}
			}
			else if (lastLedSentAt != -1 && distanceTravelledInMetres > (lastLedSentAt + 25))
			{
				sendRGB(0,0,0,0,10);
				lastLedSentAt = -1;
			}

			infoBox.setLines([
				infoBoxControls,
				'Travelled ' + distanceTravelledInMetres + 'm',
				'Skiers left: ' + livesLeft,
				'High Score: ' + highScore,
				'Current Speed: ' + player.getSpeed(),
				'Original code by Dan Hough (@basicallydan)'/*
				'Skier Map Position: ' + player.mapPosition[0].toFixed(1) + ', ' + player.mapPosition[1].toFixed(1),
				'Mouse Map Position: ' + mouseMapPosition[0].toFixed(1) + ', ' + mouseMapPosition[1].toFixed(1)*/
			]);
		}
	});

	game.afterCycle(function () {
		if (livesLeft === 0) {
			detectEnd();
		}
	});

	game.addUIElement(infoBox);

	$(mainCanvas)
		/*.mousemove(function (e) {
			game.setMouseX(e.pageX);
			game.setMouseY(e.pageY);
			player.resetDirection();
			player.startMovingIfPossible();
		})
		.bind('click', function (e) {
			game.setMouseX(e.pageX);
			game.setMouseY(e.pageY);
			player.resetDirection();
			player.startMovingIfPossible();
		})*/
		.focus(); // So we can listen to events immediately

	//Mousetrap.bind('f', player.speedBoost);
	//Mousetrap.bind('t', player.attemptTrick);
	/*Mousetrap.bind(['w', 'up'], function () {
		player.stop();
	});
	Mousetrap.bind(['a', 'left'], function () {
		if (player.direction === 270) {
			player.stepWest();
		} else {
			player.turnWest();
		}
	});
	Mousetrap.bind(['s', 'down'], function () {
		player.setDirection(180);
		player.startMovingIfPossible();
	});
	Mousetrap.bind(['d', 'right'], function () {
		if (player.direction === 90) {
			player.stepEast();
		} else {
			player.turnEast();
		}
	});*/
	//Mousetrap.bind('m', spawnMonster);
	//Mousetrap.bind('b', spawnBoarder);
	Mousetrap.bind('space', resetGame);

	/*var hammertime = Hammer(mainCanvas).on('press', function (e) {
		e.preventDefault();
		game.setMouseX(e.gesture.center.x);
		game.setMouseY(e.gesture.center.y);
	}).on('tap', function (e) {
		game.setMouseX(e.gesture.center.x);
		game.setMouseY(e.gesture.center.y);
	}).on('pan', function (e) {
		game.setMouseX(e.gesture.center.x);
		game.setMouseY(e.gesture.center.y);
		player.resetDirection();
		player.startMovingIfPossible();
	}).on('doubletap', function (e) {
		player.speedBoost();
	});*/

	document.addEventListener("cardConnect", function () {
		console.log("CONNECT");
		if (amIShown) {
			setSendFreq(250);
		}
	});


	document.addEventListener("card", function (e) {
		let status = e.detail;

		player.setDirectionFromY(e.detail.imu.y);
		if (e.detail.imu.x < -0.3) {
			player.startMovingIfPossible();
		}
		else if (e.detail.imu.x > 0.3) {
			player.stop();
		}
	});

	player.isMoving = false;
	player.setDirection(270);

	game.start();
}

function resizeCanvas() {
	mainCanvas.width = window.innerWidth;
	mainCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas, false);

resizeCanvas();

loadImages(imageSources, startNeverEndingGame);

this.exports = window;
