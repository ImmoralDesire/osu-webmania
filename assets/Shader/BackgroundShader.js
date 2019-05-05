import {
  Shader
} from './Shader.js';

export class BackgroundShader extends Shader {
  constructor() {
    super('background');

    this.addUniform('projectionMatrix');
    this.addUniform('texCoordScale');
    this.addUniform('screen');
  }
}
