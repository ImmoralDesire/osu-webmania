import {
  AbstractRenderer
} from './AbstractRenderer.js';

import {
  Key
} from '../Key.js';

export class ScoreRenderer extends AbstractRenderer {
  constructor(shader) {
    super(shader);
    //this.ext = gl.getExtension('OES_element_index_uint');
    this.positionAttribute = gl.getAttribLocation(shader.program, 'vertPosition');
    this.texCoordAttribute = gl.getAttribLocation(shader.program, 'vertTexCoord');

    this.verticesBuffer = gl.createBuffer();
    this.uvsBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    game.renderer.textureManager.loadTexture('miss', './assets/Scores/mania-hit0.png');
    game.renderer.textureManager.loadTexture('meh', './assets/Scores/mania-hit50.png');
    game.renderer.textureManager.loadTexture('ok', './assets/Scores/mania-hit100.png');
    game.renderer.textureManager.loadTexture('good', './assets/Scores/mania-hit200.png');
    game.renderer.textureManager.loadTexture('great', './assets/Scores/mania-hit300.png');
    game.renderer.textureManager.loadTexture('perfect', './assets/Scores/mania-hit300g.png');

    this.vertices = [
    //        X           Y  U  V
      0,    0,
      0,   54,
      288, 54,
      288,  0
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

    this.scale = new Float32Array(16);
    this.identity = new Float32Array(16);
    mat4.identity(this.identity);
  }

  render() {
    var time = game.now() - game.score.hitTime;
    if(game.score.result == null || time > 300) return;
    var s = (300 - time) / 300;
    if(s <= 0.9) {
      s = 0.9;
    }

    mat4.scale(this.scale, this.identity, [s, s, 1.0]);
    this.shader.setMat4('transformMatrix', this.scale);
    //mat4.mul(transform, scale, transform);

    //console.log(transform);
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

    var x = (game.renderer.sr.width - 288) / 2;

    this.shader.setVec2('offset', [x, game.renderer.sr.height / 3]);

    game.renderer.textureManager.getTexture(game.score.result.name.toLowerCase()).bindTexture();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(this.texCoordAttribute);
    gl.disableVertexAttribArray(this.positionAttribute);
  }
}
