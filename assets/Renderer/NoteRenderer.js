import {
  AbstractRenderer
} from './AbstractRenderer.js';

import {
  Note,
  HoldNote,
  HoldNoteTick,
  TailNote
} from '../Beatmap/Beatmap.js';

import {
  Key
} from '../Key.js';

export class NoteRenderer extends AbstractRenderer {
  constructor(shader) {
    super(shader);
    //this.ext = gl.getExtension('OES_element_index_uint');
    this.positionAttribute = gl.getAttribLocation(shader.program, 'vertPosition');
    this.texCoordAttribute = gl.getAttribLocation(shader.program, 'vertTexCoord');

    this.verticesBuffer = gl.createBuffer();
    this.uvsBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    if(game.beatmap.keys == 4) {
      game.renderer.textureManager.loadTexture('red_left', './assets/Notes4K/RedLeft.png');
      game.renderer.textureManager.loadTexture('red_right', './assets/Notes4K/RedRight.png');
      game.renderer.textureManager.loadTexture('blue_up', './assets/Notes4K/BlueUp.png');
      game.renderer.textureManager.loadTexture('blue_down', './assets/Notes4K/BlueDown.png');

      game.renderer.textureManager.loadTexture('red_body', './assets/Notes4K/LNBodyRed.png');
      game.renderer.textureManager.loadTexture('red_tail', './assets/Notes4K/LNTailRed.png');
      game.renderer.textureManager.loadTexture('blue_body', './assets/Notes4K/LNBodyBlue.png');
      game.renderer.textureManager.loadTexture('blue_tail', './assets/Notes4K/LNTailBlue.png');
    } else if(game.beatmap.keys == 7) {
      game.renderer.textureManager.loadTexture('blue_left', './assets/Notes7K/Left.png');
      game.renderer.textureManager.loadTexture('blue_right', './assets/Notes7K/Right.png');
      game.renderer.textureManager.loadTexture('blue_up', './assets/Notes7K/Up.png');
      game.renderer.textureManager.loadTexture('blue_down', './assets/Notes7K/Down.png');

      game.renderer.textureManager.loadTexture('center', './assets/Notes7K/Center.png');

      game.renderer.textureManager.loadTexture('red_upleft', './assets/Notes7K/Upleft.png');
      game.renderer.textureManager.loadTexture('red_upright', './assets/Notes7K/Upright.png');

      game.renderer.textureManager.loadTexture('red_body', './assets/Notes7K/UprightL.png');
      game.renderer.textureManager.loadTexture('red_tail', './assets/Notes7K/UprightT.png');
      game.renderer.textureManager.loadTexture('center_body', './assets/Notes7K/CenterL.png');
      game.renderer.textureManager.loadTexture('center_tail', './assets/Notes7K/CenterT.png');
      game.renderer.textureManager.loadTexture('blue_body', './assets/Notes7K/UpL.png');
      game.renderer.textureManager.loadTexture('blue_tail', './assets/Notes7K/UpT.png');
    }

    this.vertices = [
    //  X  Y
        0, 0,
        0, 1,
        1, 1,
        1, 0
    ];

    this.uvs = [
      0, 1,
      0, 0,
      1, 0,
      1, 1
    ];

    this.indices = [
      0, 1, 2,
      0, 2, 3
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
  }

  render() {
    gl.enableVertexAttribArray(this.positionAttribute);
    gl.enableVertexAttribArray(this.texCoordAttribute);

    this.shader.setVec2('texCoordScale', [1.0, 1.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvsBuffer);
    gl.vertexAttribPointer(this.texCoordAttribute, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var middle = (game.renderer.sr.width - game.keys.length * Key.width) / 2;
    var now = game.now();

    for(var note of game.beatmap.hitObjects) {
      //var note = game.beatmap.hitObjects[i];
      var texture = this.getTexture(note);
      var y = note.time - now;
      var x = middle + note.column * Key.width;

      y *= game.scrollSpeed / 16;
      y += Key.height / 2;

      if(y > game.height) {
        break;
      }

      if(note instanceof HoldNote) {
        this.renderHoldNote(note, x, y, Key.height - Key.width);
        if(note.pressed) {
          this.renderNote(note, x, Key.height - Key.width);
        } else {
          this.renderNote(note, x, y);
        }
      } else {
        this.renderNote(note, x, y);
      }
    }

    gl.enableVertexAttribArray(this.texCoordAttribute);
    gl.disableVertexAttribArray(this.positionAttribute);
  }

  renderNote(note, x, y) {
    var texture = this.getTexture(note);

    this.shader.setVec2('offset', [x, y]);
    this.shader.setVec2('size', [Key.width, Key.width]);

    texture.bindTexture();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  renderHoldNote(note, x, y, offset) {
    var texture = this.getTickTexture(note);
    var scale = game.scrollSpeed / 16;
    if(note.pressed) {
      var size = Math.max(y - offset + note.duration * scale, 0);
      var pos = Key.width / 2 + offset;
      this.shader.setVec2('offset', [x, pos]);
      this.shader.setVec2('size', [Key.width, size]);
    } else {
      var size = note.duration * scale;
      var pos = y + Key.width / 2;
      this.shader.setVec2('offset', [x, pos]);
      this.shader.setVec2('size', [Key.width, size]);
    }

    texture.bindTexture();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    var tail = note.tailNote;
    var texture = this.getTexture(tail);
    var pos = y + Key.width + note.duration * scale;
    if(note.pressed && pos <= Key.width + offset) {
      var pos = Key.width + offset;
    }
    this.shader.setVec2('clip', [0.0, 0.5]);
    this.shader.setVec2('offset', [x, pos]);
    this.shader.setVec2('size', [Key.width, -Key.width]);

    texture.bindTexture();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    this.shader.setVec2('clip', [0.0, 0.0]);
  }

  getTickTexture(note) {
    var texture;
    if(game.beatmap.keys == 4) {
      switch(note.column) {
        case 0: case 3: {
          texture = game.renderer.textureManager.getTexture('red_body');
          break;
        }
        case 1: case 2: {
          texture = game.renderer.textureManager.getTexture('blue_body');
          break;
        }
      }
    } else if(game.beatmap.keys == 7) {
      switch(note.column) {
        case 1: case 5: {
          texture = game.renderer.textureManager.getTexture('red_body');
          break;
        }
        case 3: {
          texture = game.renderer.textureManager.getTexture('center_body');
          break;
        }
        case 0: case 2: case 4: case 6:{
          texture = game.renderer.textureManager.getTexture('blue_body');
          break;
        }
      }
    }

    return texture;
  }

  getTexture(note) {
    var texture;

    if(game.beatmap.keys == 4) {
      if(note instanceof TailNote) {
        switch(note.column) {
          case 0: case 3: {
            texture = game.renderer.textureManager.getTexture('red_tail');
            break;
          }
          case 1: case 2: {
            texture = game.renderer.textureManager.getTexture('blue_tail');
            break;
          }
        }

        return texture;
      }

      switch(note.column) {
        case 0: {
          texture = game.renderer.textureManager.getTexture('red_left');
          break;
        }
        case 1: {
          texture = game.renderer.textureManager.getTexture('blue_down');
          break;
        }
        case 2: {
          texture = game.renderer.textureManager.getTexture('blue_up');
          break;
        }
        case 3: {
          texture = game.renderer.textureManager.getTexture('red_right');
          break;
        }
      }
    } else if(game.beatmap.keys == 7) {
      if(note instanceof TailNote) {
        switch(note.column) {
          case 0: case 2: case 4: case 6: {
            texture = game.renderer.textureManager.getTexture('blue_tail');
            break;
          }
          case 3: {
            texture = game.renderer.textureManager.getTexture('center_tail');
            break;
          }
          case 1: case 5: {
            texture = game.renderer.textureManager.getTexture('red_tail');
            break;
          }
        }

        return texture;
      }

      switch(note.column) {
        case 0: {
          texture = game.renderer.textureManager.getTexture('blue_left');
          break;
        }
        case 1: {
          texture = game.renderer.textureManager.getTexture('red_upleft');
          break;
        }
        case 2: {
          texture = game.renderer.textureManager.getTexture('blue_down');
          break;
        }
        case 3: {
          texture = game.renderer.textureManager.getTexture('center');
          break;
        }
        case 4: {
          texture = game.renderer.textureManager.getTexture('blue_up');
          break;
        }
        case 5: {
          texture = game.renderer.textureManager.getTexture('red_upright');
          break;
        }
        case 6: {
          texture = game.renderer.textureManager.getTexture('blue_right');
          break;
        }
      }
    }

    return texture;
  }
}
