export class Beatmap {
  constructor() {
    this.title = '';
    this.author = '';
    this.difficulty = '';
    this.song = '';
    this.maps = [];

    this.totalNotes = 0;

    this.bg = '';
    this.keys = 4;

    this.texture;
    this.audio;

    this.keySound;

    this.timingPoints = [];
    this.hitObjects = new Set();
    this.bpm = 0;
  }


  parse(file) {
    var parse = false;
    var meta = false;
    var bg = false;
    var objects = new Set();

    var bg = file.match(/0,0,"(.*?)"/)[1];
    this.bg = bg;

    var song = file.match(/AudioFilename:(.*)/)[1].trim();
    this.song = song;

    var keys = parseInt(file.match(/CircleSize:(.*)/)[1].trim());
    this.keys = keys;

    var title = file.match(/Title:(.*)/)[1].trim();
    this.title = title;

    var difficulty = file.match(/Version:(.*)/)[1].trim();
    this.difficulty = difficulty;

    var mode = file.match(/Mode:(.*)/)[1].trim();
    this.mode = parseInt(mode);

    file.split('\n').forEach((line) => {
      line = line.trim();

      if (parse && line.length != 0) {
        /*
         * x, y, time, type, hitSound, endTime
         *
         * column width = 512 / columns
         * column = floor(x / column width)
         *
         * time in milliseconds
         *
         * type: 1 for circle, 128 for long note
         *
         * endTime: end of long note in milliseconds
         */
        var tags = line.split(',');
        var columnWidth = 512 / this.keys;
        var column = Math.min(Math.floor(tags[0] / columnWidth), this.keys - 1);
        var time = parseInt(tags[2]);
        var sustain = tags[3] == 128;
        var endTime = parseInt(tags[5].split(':')[0]);
        //var hitSound = tags[5].split(':').pop();

        //if(hitSound.includes("wav")) {
          //this.keySound = hitSound;
        //}

        var note = new Note(column, time);

        if (sustain) {
          note = new HoldNote(column, time, endTime);
        }
        //console.log(note);
        objects.add(note);
      } else {
        parse = false;
      }

      if(line == '[Metadata]') {
        meta = false;
      }

      if(line == '[HitObjects]') {
        parse = true;
      }
    });

    this.hitObjects = objects;
    this.totalNotes = this.hitObjects.size;
  }
}

export class Note {
  constructor(column, time) {
    this.column = column;
    this.time = time;
  }
}

export class HoldNote extends Note {

  constructor(column, time, endTime) {
    super(column, time);

    this.tickSpacing = 100;
    this.endTime = endTime;
    this.duration = endTime - time;

    this.pressed = false;

    this.headNote = new Note(column, time);
    this.tailNote = new TailNote(column, endTime);

    this.nodes = [];

    this.nodes.push(this.headNote);
    this.createTicks();
    this.nodes.push(this.tailNote);
  }

  createTicks() {
    for (var t = this.time + this.tickSpacing; t <= this.endTime - this.tickSpacing; t += this.tickSpacing) {
      this.nodes.push(new HoldNoteTick(this.column, t));
    }
  }
}

export class HoldNoteTick extends Note {
  constructor(column, time) {
    super(column, time);
  }
}

export class TailNote extends Note {
  constructor(column, time) {
    super(column, time);
  }
}
