import {
  Camera
} from '../Camera.js';

import {
  TextureManager
} from '../Texture/TextureManager.js';

import {
  ScaledResolution
} from '../ScaledResolution.js';

import {
  PlayShader
} from '../Shader/PlayShader.js';

import {
  KeyRenderer
} from './KeyRenderer.js';

import {
  NoteRenderer
} from './NoteRenderer.js';

import {
  BoardRenderer
} from './BoardRenderer.js';

import {
  BackgroundShader
} from '../Shader/BackgroundShader.js';

import {
  BackgroundRenderer
} from './BackgroundRenderer.js';

import {
  ScoreShader
} from '../Shader/ScoreShader.js';

import {
  ScoreRenderer
} from './ScoreRenderer.js';

/**
 * Master renderer class
 */
export class Renderer {
  constructor() {
    //this.camera = new Camera([0, 0, 1], glMatrix.toRadian(60), game.width / game.height, 0.1, 1000.0);
    this.projectionMatrix = new Float32Array(16);

    this.textureManager = new TextureManager();
    this.playShader = new PlayShader();
    this.backgroundShader = new BackgroundShader();
    this.scoreShader = new ScoreShader();
  }

  init() {
    this.keyRenderer = new KeyRenderer(this.playShader);
    this.noteRenderer = new NoteRenderer(this.playShader);
    this.boardRenderer = new BoardRenderer(this.playShader);
    this.backgroundRenderer = new BackgroundRenderer(this.backgroundShader);
    this.scoreRenderer = new ScoreRenderer(this.scoreShader);

    this.sr = new ScaledResolution(game.width, game.height);
    //this.camera.setAspect(game.width / game.height);

    gl.viewport(0, 0, game.width, game.height);
    mat4.ortho(this.projectionMatrix, 0, game.width, 0, game.height, -1000.0, 1000.0);

    this.playShader.setMat4('projectionMatrix', this.projectionMatrix);
    this.backgroundShader.setMat4('projectionMatrix', this.projectionMatrix);
    this.scoreShader.setMat4('projectionMatrix', this.projectionMatrix);
    //this.modelShader.bind();
    //gl.uniformMatrix4fv(this.modelShader.uniforms.projectionMatrix, gl.FALSE, this.camera.getProjection());
  }

  resize() {
    this.sr = new ScaledResolution(game.width, game.height);
    //this.camera.setAspect(game.width / game.height);
    var aspect = game.width / game.height;
    gl.viewport(0, 0, game.width, game.height);
    //gl.viewport(0, 0, game.width, game.height);
    mat4.ortho(this.projectionMatrix, 0, game.width, 0, game.height, -1000.0, 1000.0);

    this.playShader.setMat4('projectionMatrix', this.projectionMatrix);
    this.backgroundShader.setMat4('projectionMatrix', this.projectionMatrix);
    this.scoreShader.setMat4('projectionMatrix', this.projectionMatrix);
    //this.modelShader.bind();
    //gl.uniformMatrix4fv(this.modelShader.uniforms.projectionMatrix, gl.FALSE, this.camera.getProjection());
  }

  update() {
    //this.playShader.bind();
    //gl.uniformMatrix4fv(this.modelShader.uniforms.viewMatrix, gl.FALSE, this.camera.getView());

    //this.worldShader.bind();
    //gl.uniformMatrix4fv(this.worldShader.uniforms.viewMatrix, gl.FALSE, this.camera.getView());
  }

  render(interpolation) {

    this.backgroundShader.bind();
    this.backgroundRenderer.render();

    this.playShader.bind();
    this.boardRenderer.render();
    this.keyRenderer.render();
    this.noteRenderer.render();

    this.scoreShader.bind();
    this.scoreRenderer.render();
  }
}
