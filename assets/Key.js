const width = 75;
const height = 105;

export class Key {

    /**
     * @param {String} name e.g. Left
     * @param {int} column e.g. 1
     * @param {int} keyCode e.g. 100
     */
    constructor(name, column, keyCode) {
        this.name = name;
        this.column = column;
        this.keyCode = keyCode;

        this.pressed = false;

        this.width = 100;
        this.height = 140;
    }

    static get width() {
      return width;
    }

    static get height() {
      return height;
    }
}
