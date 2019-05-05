export class Texture {

  constructor(texture) {
    this.texture = texture;
  }

  bindTexture() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  bindLocation(location) {
    gl.activeTexture(gl.TEXTURE0 + location);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }
}
