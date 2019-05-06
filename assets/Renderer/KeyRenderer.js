import {
  AbstractRenderer
} from './AbstractRenderer.js';

import {
  Key
} from '../Key.js';

export class KeyRenderer extends AbstractRenderer {
  constructor(shader) {
    super(shader);
    //this.ext = gl.getExtension('OES_element_index_uint');
    this.positionAttribute = gl.getAttribLocation(shader.program, 'vertPosition');
    this.texCoordAttribute = gl.getAttribLocation(shader.program, 'vertTexCoord');

    this.verticesBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    if(game.beatmap.keys == 4) {
      game.renderer.textureManager.loadTexture('key_left', './assets/Keys4K/Left.png');
      game.renderer.textureManager.loadTexture('key_up', './assets/Keys4K/Up.png');
      game.renderer.textureManager.loadTexture('key_right', './assets/Keys4K/Right.png');
      game.renderer.textureManager.loadTexture('key_down', './assets/Keys4K/Down.png');

      game.renderer.textureManager.loadTexture('key_left_pressed', './assets/Keys4K/LeftPressed.png');
      game.renderer.textureManager.loadTexture('key_up_pressed', './assets/Keys4K/UpPressed.png');
      game.renderer.textureManager.loadTexture('key_right_pressed', './assets/Keys4K/RightPressed.png');
      game.renderer.textureManager.loadTexture('key_down_pressed', './assets/Keys4K/DownPressed.png');
    } else if(game.beatmap.keys == 7) {
      game.renderer.textureManager.loadTexture('key_left', './assets/Keys7K/Left.png');
      game.renderer.textureManager.loadTexture('key_upleft', './assets/Keys7K/Upleft.png');
      game.renderer.textureManager.loadTexture('key_down', './assets/Keys7K/Down.png');
      game.renderer.textureManager.loadTexture('key_center', './assets/Keys7K/Center.png');
      game.renderer.textureManager.loadTexture('key_up', './assets/Keys7K/Up.png');
      game.renderer.textureManager.loadTexture('key_upright', './assets/Keys7K/Upright.png');
      game.renderer.textureManager.loadTexture('key_right', './assets/Keys7K/Right.png');

      game.renderer.textureManager.loadTexture('key_left_pressed', './assets/Keys7K/LeftPressed.png');
      game.renderer.textureManager.loadTexture('key_upleft_pressed', './assets/Keys7K/UpleftPressed.png');
      game.renderer.textureManager.loadTexture('key_down_pressed', './assets/Keys7K/DownPressed.png');
      game.renderer.textureManager.loadTexture('key_center_pressed', './assets/Keys7K/CenterPressed.png');
      game.renderer.textureManager.loadTexture('key_up_pressed', './assets/Keys7K/UpPressed.png');
      game.renderer.textureManager.loadTexture('key_upright_pressed', './assets/Keys7K/UprightPressed.png');
      game.renderer.textureManager.loadTexture('key_right_pressed', './assets/Keys7K/RightPressed.png');
    }

    this.vertices = [
    //        X           Y  U  V
              0,          0, 0, 1,
              0, 1, 0, 0,
      1, 1, 1, 0,
      1,          0, 1, 1
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


    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, gl.FALSE, 4 * 4, 0);
    gl.vertexAttribPointer(this.texCoordAttribute, 2, gl.FLOAT, gl.FALSE, 4 * 4, 2 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var x = (game.renderer.sr.width - game.keys.length * Key.width) / 2;

    for(var i in game.keys) {
      var key = game.keys[i];
      var name = key.name.toLowerCase();
      var pressed = key.pressed ? '_pressed' : '';

      this.shader.setVec2('offset', [x + i * Key.width, 0]);
      this.shader.setVec2('size', [Key.width, Key.height]);

      game.renderer.textureManager.getTexture('key_' + name + pressed).bindTexture();

      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    gl.enableVertexAttribArray(this.texCoordAttribute);
    gl.disableVertexAttribArray(this.positionAttribute);
  }
}
