import {
  AbstractRenderer
} from './AbstractRenderer.js';

import {
  Key
} from '../Key.js';

export class BoardRenderer extends AbstractRenderer {
  constructor(shader) {
    super(shader);
    //this.ext = gl.getExtension('OES_element_index_uint');
    this.positionAttribute = gl.getAttribLocation(shader.program, 'vertPosition');
    this.texCoordAttribute = gl.getAttribLocation(shader.program, 'vertTexCoord');

    this.verticesBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    var width = game.keys.length * Key.width;
    this.vertices = [
      -width / 2, 0,
      -width / 2, 1,
      width / 2, 1,
      width / 2, 0
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
    this.shader.setVec2('offset', [game.width / 2, 0.0]);
    this.shader.setVec2('size', [1.0, game.height]);

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, gl.FALSE, 2 * 4, 0);
    gl.vertexAttrib1f(this.texCoordAttribute, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(this.texCoordAttribute);
    gl.disableVertexAttribArray(this.positionAttribute);
  }
}
