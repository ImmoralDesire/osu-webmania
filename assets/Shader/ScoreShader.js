import {
  Shader
} from './Shader.js';

export class ScoreShader extends Shader {
  constructor() {
    super('score');

    this.addUniform('projectionMatrix');
    this.addUniform('texCoordScale');
    this.addUniform('vertTransform');
  }
}
