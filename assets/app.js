import {
  Game
} from './Game.js';

import {
  Beatmap
} from './Beatmap/Beatmap.js';

import {
  BeatmapLoader
} from './Beatmap/BeatmapLoader.js';

import {
  ScaledResolution
} from './ScaledResolution.js';

zip.workerScriptsPath = "./assets/lib/";

var keys = [];
var loaded_maps = [];

var lDiff = function(blob) {
  return new Promise((resolve, reject) => {
    BeatmapLoader.loadDifficulties(blob, (difficulties) => {
      resolve(difficulties);
    });
  });
};

var lMap = function(blob, key) {
  return new Promise((resolve, reject) => {
    BeatmapLoader.loadMap(blob, key, (beatmap) => {
      resolve(beatmap);
    });
  });
};

/*var loadMaps = function() {
  var blob = [];
  return new Promise(async (resolve, reject) => {
    console.time('start load');
    var promises = [];
    for(var i in maps) {
      await fetch(`songs/${maps[i]}`).then(async (response) => {
        return response.blob();
      }).then(async (blob) => {
        promises.push(BeatmapLoader.loadMapSet(blob));
      });
      //document.write("<a href = '" + maps[i] + "'>" + maps[i] + "</a><br>");
    }

    await Promise.all(promises).then(p => {
      for(var i in p) {
        var m = p[i];
        for(var j in m) {
          var map = m[j];
          loaded_maps[`${map.title}-${map.difficulty}`] = map;
          document.getElementById('songs').innerHTML += `<a class="map" data-map="${map.title}-${map.difficulty}">${map.title} [${map.difficulty}]</a><br>`;
        }
      }
    });
    resolve(true);
  });
};*/

var loadMaps = function() {
  return new Promise((resolve, reject) => {
    fetch('songs.php').then(resp => {
      return resp.json();
    }).then(json => {
      maps = json;

      maps['songs'].forEach(map => {
        document.getElementById('songs').innerHTML += `
        <div class="map">
          <img class="thumb" src="${map.background}" width="100" height="80">
          <span class="title">
            <a data-title="${map.title}" data-version="${map.version}">${map.title} [${map.version}] (${map.keys}K) ${map.difficulty.toFixed(2)} Stars</a>
          </span>
        </div><br>`;
      });

      resolve(true);
    });
  });
}

var init = function() {

  window.canvas = document.getElementById('game-surface');
  window.gl = canvas.getContext('webgl');

  if (!gl) {
    console.log('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
  }

  if (!gl) {
    alert('Your browser does not support WebGL');
  }

  canvas.onclick = function() {
    canvas.requestPointerLock();
  }

  window.game = new Game(0, 0);

  game.audioHandler.init();
  //var INVERSE_MAX_FPS = 1 / 60;
  //var frameDelta = 0;
  //var lastUpdate = Date.now();
  let curFrameTime = 0;
  const frameRate = 60;
  const frameDelta = 1000 / 240;
  var rendered = 0;

  var loop = function(time) {
    //mat4.translate(transformMatrix, transformMatrix, translation);

    var sr = new ScaledResolution(game.width, game.height);

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    //console.log(sr.width);
    /*var now = Date.now();

    frameDelta += now - lastUpdate;
    lastUpdate = now;*/


    // Run as many physics updates as we have missed
    while (curFrameTime < time) {
      //console.log(time);\
      game.update();
      curFrameTime += frameDelta;
    }

    var interpolation = (time + frameDelta - curFrameTime) / frameDelta;
    //console.log(interpolation);
    game.render(sr, interpolation);


    //gl.clearColor(0.75, 0.85, 0.8, 1.0);
    //gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);

  document.addEventListener('keydown', (e) => {
    if (e.repeat || keys[e.which]) {
      return;
    }
    keys[e.which] = true;
    game.handleKeyboardInput(e.which, true);
  });

  document.addEventListener('keyup', (e) => {
    if (keys[e.which]) {
      keys[e.which] = false;
      game.handleKeyboardInput(e.which, false);
    }
  });

  window.onresize = function() {
    game.resize(window.innerWidth, window.innerHeight);
  }
};

document.getElementById('beatmap').addEventListener('change', (e) => {
  var x = document.getElementById("beatmap");

  BeatmapLoader.loadDifficulties(x.files[0], (difficulties) => {
    document.getElementById('difficulty').innerHTML = '';
    for (var key in difficulties) {
      console.log(key);
      document.getElementById('difficulty').innerHTML += `<option value="${key}">${key}</option>`;
      //console.log(`${key} name ${maps[key]} map`);
    }
  });
});

document.getElementById('play').addEventListener('click', (e) => {
  var x = document.getElementById("beatmap");
  var diff = document.getElementById('difficulty').value;
  BeatmapLoader.loadMap(x.files[0], diff, (beatmap) => {
    console.log(beatmap);

    start_game(beatmap);
    //beatmap.song.playSound();
  });
});

var start_game = function(beatmap) {
  var scroll = document.getElementById('scroll').value;
  var speed = document.getElementById('speed').value;
  document.getElementById('time').style = 'visibility: visible;';
  document.getElementById('combo').style = 'visibility: visible;';
  document.getElementById('score').style = 'visibility: visible;';
  document.getElementById('acc').style = 'visibility: visible;';

  document.getElementById('menu').style = 'display: none;';

  game.scrollSpeed = scroll;
  game.speed = speed;
  game.setBeatmap(beatmap);
  game.init(() => {
    game.play();
  });
};

document.getElementById('start').addEventListener('click', async (e) => {
  init();
  await loadMaps();

  document.getElementById('load').style = 'display: none';
  document.getElementById('menu').style = 'display: block;';
  document.getElementById('game').style = 'display: block;';

  Array.from(document.getElementsByClassName('map')).forEach(element => {
    element.addEventListener('click', (e) => {
      //console.log(e);
      var data = maps['songs'].filter(map => map.title == e.target.getAttribute('data-title') && map.version == e.target.getAttribute('data-version'))[0];
      var beatmap = new Beatmap();

      fetch(data.file).then(resp => {
        return resp.text();
      }).then(async file => {
        beatmap.parse(file);
        var audio = await game.audioHandler.loadSound(data.audio, data.audio, true);
        console.log('Audio successfully loaded');
        beatmap.audio = audio;

        //var keySound = await game.audioHandler.loadSound("key_sound", data.dir + "/" + beatmap.keySound, true);
        //beatmap.s = keySound;
        
        var texture = game.renderer.textureManager.loadTexture(data.background, data.background);
        beatmap.texture = texture;
        console.log(beatmap);
        start_game(beatmap);
      });
      //start_game(loaded_maps[e.target.getAttribute('data-map')]);
    });
  });
});
