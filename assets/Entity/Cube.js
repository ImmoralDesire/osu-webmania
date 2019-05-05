import {
  Entity
} from './Entity.js';

export class Cube extends Entity {
  constructor(x, y, z) {
    super(x, y, z);
    this.size = vec3.fromValues(1.0, 1.0, 1.0);
  }
}
