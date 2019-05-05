import {
  Entity
} from './Entity.js';

export class Enemy extends Entity {
  constructor(x, y, z) {
    super(x, y, z);
    //this.size = new AABB(0.0, 0.0, 0.0, 0.6, 1.8, 0.925);
    this.eyeHeight = 1.62;
    //this.size = vec3.fromValues(20.0, 20.0, 20.0);
  }

  update() {
    //console.log('Player pos and vel: ' + this.pos + ' , vel: ' + this.vel);
    super.update();
  }
}
