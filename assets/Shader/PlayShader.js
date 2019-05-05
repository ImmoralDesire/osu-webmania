import {
  Shader
} from './Shader.js';

export class PlayShader extends Shader {
  constructor() {
    super('play');

    this.addUniform('projectionMatrix');
    this.addUniform('texCoordScale');
    this.addUniform('vertTransform');
  }
}
