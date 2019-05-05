import {
  Beatmap
} from './Beatmap.js';

export class BeatmapLoader {
  constructor() {

  }

  static loadDifficulties(file, callback) {
    zip.createReader(new zip.BlobReader(file), async (zipReader) => {
      zipReader.getEntries(async (entries) => {

        var maps = [];
        var entryLength = entries.length;
        for (var i = 0; i < entryLength; i++) {
          var entry = entries[i];

          var fileName = entry.filename.substring(entry.filename.lastIndexOf("/") + 1); //if inside folder
          var ext = fileName.split(".").pop().toLowerCase();
          if(ext.toLowerCase() == 'osu') {
            var data = await this.getData(new zip.TextWriter(), entry);
            var title = data.match(/Title:(.*)/)[1].trim();
            var match = data.match(/Version:(.*)/);
            var difficulty = 'No Difficulty Name';
            if(match != null) {
              difficulty = match[1].trim();
            }
            console.log(title);
            maps[difficulty] = entry;
          }
        }

        callback(maps);
      });
    }, function(error) {
      console.log(error);
    });
  }

  static async loadMapSet(file) {
    return new Promise((resolve, reject) => {
      zip.createReader(new zip.BlobReader(file), async (zipReader) => {
        var imgs = [];
        var songs = [];

        var beatmaps = [];
        var promises = [];


        zipReader.getEntries(async (entries) => {

          var entryLength = entries.length;
          for (var i = 0; i < entryLength; i++) {
            var entry = entries[i];

            var fileName = entry.filename.substring(entry.filename.lastIndexOf("/") + 1); //if inside folder
            var ext = fileName.split(".").pop().toLowerCase();
            switch(ext.toLowerCase()) {
              case 'osu': {
                promises.push(
                  this.getData(new zip.TextWriter(), entry).then(data => {
                    var beatmap = new Beatmap();
                    beatmap.parse(data);
                    if(beatmap.mode == 3) {
                      beatmaps.push(beatmap);
                    }
                  })
                );

                break;
              }

              case 'mp3': {
                await this.getData(new zip.BlobWriter(), entry).then(data => {
                  songs[fileName] = data;
                });

                break;
              }

              case 'jpg': case 'png': {
                await this.getData(new zip.Data64URIWriter(), entry).then(data => {
                  imgs[fileName] = data;
                });
                //var texture = game.renderer.textureManager.loadTexture('bg', data);

                break;
              }

              default: {
                break;
              }
            }
          }

          await Promise.all(promises);
          console.log(imgs);
          for(var i in beatmaps) {
            var beatmap = beatmaps[i];
            var audio;
            var texture;

            console.log(beatmap.song);
            if(typeof game.audioHandler.tracks[beatmap.title + "_" + beatmap.song] !== 'undefined') {
              var audio = game.audioHandler.tracks[beatmap.title + "_" + beatmap.song];
            } else {
              var audio = await game.audioHandler.loadSound(beatmap.title + "_" + beatmap.song, songs[beatmap.song]);
            }
            console.log('Audio successfully loaded');
            beatmap.audio = audio;
            texture = game.renderer.textureManager.loadTexture(beatmap.title + "_" + beatmap.bg, imgs[beatmap.bg]);
            beatmap.texture = texture;
          }
          //console.log(maps);
          console.log('Beatmap successfully loaded');

          resolve(beatmaps);
        });
      });
    });
  }

  static loadMap(file, difficulty, callback) {
    var beatmap = new Beatmap();

    zip.createReader(new zip.BlobReader(file), async (zipReader) => {
      zipReader.getEntries(async (entries) => {

        var imgs = [];
        var songs = [];

        var entryLength = entries.length;
        for (var i = 0; i < entryLength; i++) {
          var entry = entries[i];

          var fileName = entry.filename.substring(entry.filename.lastIndexOf("/") + 1); //if inside folder
          var ext = fileName.split(".").pop().toLowerCase();
          switch(ext.toLowerCase()) {
            case 'osu': {
              var data = await this.getData(new zip.TextWriter(), entry);
              var title = data.match(/Title:(.*)/)[1].trim();
              var match = data.match(/Version:(.*)/);
              var diff = 'No Difficulty Name';
              if(match != null) {
                diff = match[1].trim();
              }

              if(difficulty == diff) {
                beatmap.difficulty = diff;

                beatmap.parse(data);
                console.log('Beatmap successfully loaded');
              }
              break;
            }

            case 'mp3': {
              var data = await this.getData(new zip.BlobWriter(), entry);
              songs[fileName] = data;
              break;
            }

            case 'jpg': case 'png': {
              var data = await this.getData(new zip.Data64URIWriter(), entry);
              //var texture = game.renderer.textureManager.loadTexture('bg', data);
              imgs[fileName] = data;
            }

            default: {
              break;
            }
          }
        }
        console.log(beatmap.song);
        var audio = await game.audioHandler.loadSound(beatmap.song,songs[beatmap.song]);
        console.log('Audio successfully loaded');
        beatmap.audio = audio;

        var texture = game.renderer.textureManager.loadTexture('bg', imgs[beatmap.bg]);
        beatmap.texture = texture;
        //console.log(maps);

        callback(beatmap);
      });
    });
  }

  static getData(writer, entry) {
    return new Promise((resolve, reject) => {
         entry.getData(writer, (file) => {
           resolve(file);
         });
     });
  }
}
