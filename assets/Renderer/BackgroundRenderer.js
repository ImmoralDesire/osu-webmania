import {
  AbstractRenderer
} from './AbstractRenderer.js';

import {
  Note,
  HoldNote
} from '../Beatmap/Beatmap.js';

import {
  Key
} from '../Key.js';

export class BackgroundRenderer extends AbstractRenderer {
  constructor(shader) {
    super(shader);
    //this.ext = gl.getExtension('OES_element_index_uint');
    this.positionAttribute = gl.getAttribLocation(shader.program, 'vertPosition');
    this.texCoordAttribute = gl.getAttribLocation(shader.program, 'vertTexCoord');

    this.verticesBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    this.vertices = [
    //  X    Y  U  V
        0, 0, 0, 1,
        0, 1, 0, 0,
        1, 1, 1, 0,
        1, 0, 1, 1
    ];

    this.indices = [
      0, 1, 2,
      0, 2, 3
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
  }

  render() {
    gl.enableVertexAttribArray(this.positionAttribute);
    gl.enableVertexAttribArray(this.texCoordAttribute);

    this.shader.setVec2('texCoordScale', [1.0, 1.0]);
    this.shader.setVec2('screen', [game.width, game.height]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, gl.FALSE, 4 * 4, 0);
    gl.vertexAttribPointer(this.texCoordAttribute, 2, gl.FLOAT, gl.FALSE, 4 * 4, 2 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    game.beatmap.texture.bindTexture();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(this.texCoordAttribute);
    gl.disableVertexAttribArray(this.positionAttribute);
  }
}
