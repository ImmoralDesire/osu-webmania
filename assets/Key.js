let width = 128;
let height = width * 1.4;

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

        //this.width = 100;
        //this.height = this.width * 1.4;
    }

    static get width() {
      return width;
    }

    static get height() {
      return height;
    }

    static set width(w) {
      width = w;
    }

    static set height(h) {
      height = h;
    }
}
