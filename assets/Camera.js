export class Camera {
  constructor(pos, fov, aspect, zNear, zFar, ortho) {
    this.viewMatrix = new Float32Array(16);
    this.projMatrix = new Float32Array(16);

    this.fov = fov;
    this.aspect = aspect;
    this.zNear = zNear;
    this.zFar = zFar;

    this.pos = pos;
    this.forward = [0, 1, 0];
    this.up = [0, 1, 0];

    this.yaw = 0;
    this.pitch = 0;

    if(!this.ortho) {
      //                           [0, 0, 60], [0, 0, 0]. [0, 1, 0]
      mat4.lookAt(this.viewMatrix, this.pos, vec3.add(vec3.create(), this.forward, this.pos), this.up);
      mat4.perspective(this.projMatrix, this.fov, this.aspect, this.zNear, this.zFar);
    } else {
      mat4.identity(this.viewMatrix);
      mat4.ortho(this.projMatrix, 0, game.width, 0, game.height, -1000.0, 1000.0);
    }
  }

  getViewProjection() {
    return this.getProjection() * this.getView();
  }

  getView() {
    if(!this.ortho) {
      mat4.lookAt(this.viewMatrix, this.pos, vec3.add(vec3.create(), this.forward, this.pos), this.up);
    } else {
      mat4.identity(this.viewMatrix);
    }
    return this.viewMatrix;
  }

  getProjection() {
    if(!this.ortho) {
      mat4.perspective(this.projMatrix, this.fov, this.aspect, this.zNear, this.zFar);
    } else {
      mat4.ortho(this.projMatrix, 0, game.width, 0, game.height, -1000.0, 1000.0);
    }
    return this.projMatrix;
  }

  update(entity) {
    this.pos = entity.pos;
  }

  getPos() { return this.pos; }
  getForward() { return this.forward; }
  getUp() { return this.up; }

  setPos(pos) { this.pos = pos; }
  setForward(forward) { thi.forward = forward; }
  setUp(up) { this.up = up; }
  setAspect(aspect) { this.aspect = aspect; }
}
