export class Entity {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vel = vec3.fromValues(0, 0, 0);
    this.pos = vec3.fromValues(x, y, z);
    this.prevPos = vec3.fromValues(x, y, z);
  }

  update() {
    //console.log('update position: ' + this.vel);
    this.prevPos = this.pos.slice(0);

    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.pos[2] += this.vel[2];
    this.vel[0] *= 0.6;
    this.vel[1] = 0;
    this.vel[2] *= 0.6;
    
  }
}
