import {
  Renderer
} from './Renderer/Renderer.js';

import {
  Beatmap,
  Note,
  HoldNote,
  HoldNoteTick,
  TailNote
} from './Beatmap/Beatmap.js';

import {
  Key
} from './Key.js';

import {
  ScaledResolution
} from './ScaledResolution.js';

import {
  AudioHandler
} from './Audio/AudioHandler.js';

export class KeyEvent {

  constructor(keyCode, time, state) {
    this.keyCode = keyCode;
    this.time = time;
    this.state = state;
  }
}

export class HitResult {
  constructor(name, value, range, bonusValue, bonus, punishment) {
    this.name = name;
    this.value = value;
    this.range = range;
    this.bonusValue = bonusValue;
    this.bonus = bonus;
    this.punishment = punishment;
  }
}

export class HitWindow {
  static getResult(time) {
    var latestHit = HitResults.MISS;

    for (var x in HitResults) {
      var result = HitResults[x];

      if (time > (result.range / 2 - result.range) && time < result.range / 2) {
        if (result.range < latestHit.range) {
          latestHit = result;
        }
      }
    }

    return latestHit;
  }
}

export const HitResults = {
  PERFECT: new HitResult("Perfect", 320, 50, 32, 2, 0),
  GREAT: new HitResult("Great", 300, 125, 32, 1, 0),
  GOOD: new HitResult("Good", 200, 200, 16, 0, 8),
  OK: new HitResult("Ok", 100, 250, 8, 0, 24),
  MEH: new HitResult("Meh", 50, 300, 4, 0, 44),
  MISS: new HitResult("Miss", 0, 375, 0, 0, 100),
  HOLD_TICK: new HitResult("Tick", 0, 0, 0, 0, 0),
};

export class Score {
  constructor() {
    this.MAX_SCORE = 1000000;
    this.combo = 0;
    this.maxCombo = 0;
    this.misses = 0;
    this.perfect = 0;
    this.great = 0;
    this.good = 0;
    this.ok = 0;
    this.meh = 0;
    this.score = 0;
    this.bonus = 100;
    this.result = null;
    this.lastResult = null;
    this.hitTime = 0;
    this.acc = 100;
  }
}

export class Game {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.beatmap = new Beatmap();
    this.audioHandler = new AudioHandler();
    this.renderer = new Renderer();

    this.scrollSpeed = 24;
    this.speed = 1;

    this.keyEvents = new Set();

    this.clickableNotes = new Set();

    this.playing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setBeatmap(beatmap) {
    this.beatmap = beatmap;
    this.audioHandler.currentTrack = this.beatmap.audio;
  }

  init(callback) {
    this.state = 2;
    this.score = new Score();
    switch (this.beatmap.keys) {
      case 4:
        {
          this.keys = [
            new Key('Left', 0, 68),
            new Key('Down', 1, 70),
            new Key('Up', 2, 74),
            new Key('Right', 3, 75)
          ];
          break;
        }
      case 7:
        {
          this.keys = [
            new Key('Left', 0, 83),
            new Key('UpLeft', 1, 68),
            new Key('Down', 2, 70),
            new Key('Center', 3, 32),
            new Key('Up', 4, 74),
            new Key('UpRight', 5, 75),
            new Key('Right', 6, 76)
          ];
          break;
        }
    }

    this.renderer.init();

    this.resize(window.innerWidth, window.innerHeight);

    //await this.sleep(2000);
    //this.beatmap.song.playSound();
    callback();
  }

  async play() {
    //await this.sleep(3000);
    this.audioHandler.playSound();
    console.log(this.audioHandler.getCurrentTime());
    this.playing = true;
  }

  resize(width, height) {
    if (this.state != 2) return;

    var target_height = 1080;

    canvas.width = width;
    canvas.height = height;
    this.width = width;
    this.height = height;

    Key.width = (this.height / target_height) * 128;
    Key.height = Key.width * 1.4;

    this.renderer.resize();
  }

  now() {
    return this.audioHandler.getCurrentTime();
  }

  update() {
    if (this.state != 2) return;

    if(this.beatmap.hitObjects.size == 0 && this.playing) {
      this.playing = false;
      document.getElementById('load').style = 'display: none';
      document.getElementById('menu').style = 'display: block;';
      document.getElementById('game').style = 'display: none;';

      console.log(this.score);

      this.state = 1;
    }

    this.audioHandler.update();

    var now = this.now();

    //console.log(this.getNotes(now));

    document.getElementById('time').innerHTML = now;

    this.clickableNotes = this.getNotes(now);

    var clicked = [];

    if (this.clickableNotes.size > 0 && this.keyEvents.size > 0) {
      for (var event of this.keyEvents) {
        //var event = this.keyEvents[j];
        var key = this.getKeyByKeycode(event.keyCode);

        for (var note of this.clickableNotes) {
          //var note = this.clickableNotes[i];

          if (note.column == key.column) {
            var error = note.time - event.time;
            //console.log(error + " : " + HitWindow.getResult(error).name);
            var result = HitWindow.getResult(error);

            if (event.state == true) {
              if (note instanceof HoldNote) {
                if (!note.pressed) {
                  this.applyResult(HitResults.HOLD_TICK);
                  note.pressed = true;
                  note.nodes.shift();
                }
              } else {
                this.applyResult(result);
                this.clickableNotes.delete(note);
                this.beatmap.hitObjects.delete(note);
                //this.clickableNotes = this.clickableNotes.filter(e => e != note);
                //this.beatmap.hitObjects = this.beatmap.hitObjects.filter(e => e !== note);
              }
            } else {
              if (note instanceof HoldNote) {
                if (note.pressed && note.nodes[0] instanceof TailNote) {
                  error = note.endTime - event.time;
                  error /= 1.5;
                  result = HitWindow.getResult(error);
                  if (result.range > HitResults.GOOD.range) {
                    result = HitResults.GOOD;
                  }

                  this.applyResult(result);
                  this.clickableNotes.delete(note);
                  this.beatmap.hitObjects.delete(note);
                  //this.clickableNotes = this.clickableNotes.filter(e => e != note);
                  //this.beatmap.hitObjects = this.beatmap.hitObjects.filter(e => e !== note);
                } else {
                  note.pressed = false;
                }
              }
            }

            break;
          }
        }
      }
    }

    this.keyEvents.clear();
    this.clickableNotes.clear();
  }

  applyResult(result) {
    if(result == HitResults.HOLD_TICK) {
      this.score.combo++;
    } else {
      this.score.lastResult = this.score.result;
      this.score.result = result;
      this.score.hitTime = this.now();
      if(result == HitResults.MISS) {
        this.score.combo = 0;
        this.score.misses++;
      } else {
        this.score.combo++;
        switch (result) {
          case HitResults.PERFECT:
            {
              this.score.perfect++;
              break;
            }
          case HitResults.GREAT:
            {
              this.score.great++;
              break;
            }
          case HitResults.GOOD:
            {
              this.score.good++;
              break;
            }
          case HitResults.MEH:
            {
              this.score.meh++;
              break;
            }
          case HitResults.OK:
            {
              this.score.ok++;
              break;
            }
        }
      }

      var baseScore = (this.score.MAX_SCORE * 1 * 0.5 / this.beatmap.totalNotes) * (result.value / 320);
      var bonusScore = (this.score.MAX_SCORE * 1 * 0.5 / this.beatmap.totalNotes) * (result.bonusValue * Math.sqrt(this.score.bonus) / 320);
      if(result == HitResult.MISS) {
        this.score.bonus = 0;
      } else {
        this.score.bonus = this.score.bonus + result.bonus - result.punishment;
      }

      this.score.bonus = Math.min(Math.max(this.score.bonus, 0), 100);
      this.score.score += ~~(baseScore + bonusScore);

      this.score.acc = Math.min(Math.max(
        ((
        this.score.perfect * 300 +
        this.score.great * 300 +
        this.score.good * 200 +
        this.score.meh * 100 +
        this.score.ok * 50) / (
        (
          this.score.perfect +
          this.score.great +
          this.score.good +
          this.score.meh +
          this.score.ok +
          this.score.misses
        ) * 300
      )), 0), 1) * 100;
    }

    document.getElementById('score').innerHTML = (this.score.score + '').padStart(7, '0');
    document.getElementById('acc').innerHTML = (this.score.acc).toFixed(2);

    if (this.score.combo == 0) {
      document.getElementById('combo').innerHTML = '';
    } else {
      document.getElementById('combo').innerHTML = this.score.combo;
    }
  }

  getNotes(time) {
    var notes = [];

    for (var note of this.beatmap.hitObjects) {
      //var note = this.beatmap.hitObjects[i];

      var diff = note.time - time;
      if (note instanceof HoldNote) {
        if (note.nodes.length > 0) {
          var topNode = note.nodes[0];
          if (topNode instanceof HoldNoteTick) {
            var nodeDiff = topNode.time - time;

            if (nodeDiff <= 0) {
              note.nodes.shift();
              if (note.pressed) {
                this.applyResult(HitResults.HOLD_TICK);

                if (note.nodes.length == 0) {
                  this.beatmap.hitObjects.delete(note);
                  //this.beatmap.hitObjects = this.beatmap.hitObjects.filter(e => e !== note);
                  continue;
                }
              } else {
                this.applyResult(HitResults.MISS);
              }
            }
          } else if (topNode instanceof Note) {
            if (diff < -HitResults.MISS.range / 2 && !note.pressed) {
              note.nodes.shift();
              this.applyResult(HitResults.MISS);
              continue;
            }
          }
        }

        diff = note.endTime - time;

        if (diff < -HitResults.GOOD.range / 2) {
          if (note.pressed) {
            this.beatmap.hitObjects.delete(note);
            //this.beatmap.hitObjects = this.beatmap.hitObjects.filter(e => e !== note);
            this.applyResult(HitResults.GOOD);
          }
        }
      }

      if (diff < -HitResults.MISS.range / 2) {
        this.beatmap.hitObjects.delete(note);
        //this.beatmap.hitObjects = this.beatmap.hitObjects.filter(e => e !== note);
        if (!(note instanceof HoldNote)) {
          this.applyResult(HitResults.MISS);
          continue;
        }
      }
      diff = note.time - time;
      //if(note instanceof HoldNote) {
      //diff = note.endTime - time;
      //}

      if (diff > HitResults.MISS.range / 2) {
        break;
      }

      if (!notes.some(e => e.column == note.column)) {
        notes.push(note);
      }
    }

    return new Set(notes);
  }

  render(sr, interpolation) {
    if (this.state != 2) return;

    this.renderer.update();
    this.renderer.render(interpolation);
  }

  getKeyByKeycode(keyCode) {
    for (var i in this.keys) {
      var key = this.keys[i];

      if (key.keyCode == keyCode) {
        return key;
      }
    }

    return null;
  }

  handleKeyboardInput(keyCode, state) {
    if (this.state != 2) return;

    if(keyCode == 13 && !this.playing) {
      this.play();
    }

    for (var i in this.keys) {
      var key = this.keys[i];

      if (key.keyCode == keyCode) {
        key.pressed = state;
        if(state) {
          //this.beatmap.s.play();
        }
        var a = new KeyEvent(keyCode, this.audioHandler.getCurrentTime(), state);
        this.keyEvents.add(a);
      }
    }

    //this.keyEvents[keyCode] = state;
  }
}
