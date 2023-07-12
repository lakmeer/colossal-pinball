
export default class Pointer {

  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;

  constructor () {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
  }

  onDown (canvas, posX, posY) {
    this.down = true;
    this.moved = false;

    let { x, y } = this.mapCoords(canvas, posX, posY);

    this.texcoordX = x;
    this.texcoordY = y;
    this.prevTexcoordX = this.texcoordX;
    this.prevTexcoordY = this.texcoordY;
    this.deltaX = 0;
    this.deltaY = 0;
  }

  onMove (canvas, posX, posY) {
    this.prevTexcoordX = this.texcoordX;
    this.prevTexcoordY = this.texcoordY;

    let { x, y } = this.mapCoords(canvas, posX, posY);

    this.texcoordX = x;
    this.texcoordY = y;
    this.deltaX = this.correctX(canvas, this.texcoordX - this.prevTexcoordX);
    this.deltaY = this.correctY(canvas, this.texcoordY - this.prevTexcoordY);
    this.moved = Math.abs(this.deltaX) > 0 || Math.abs(this.deltaY) > 0;
  }

  onUp () {
    this.down = false;
  }

  mapCoords (canvas, x, y) {
    return {
      x: x / canvas.width,
      y: 1.0 - y / canvas.height
    }
  }

  correctX (canvas, delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
  }

  correctY (canvas, delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
  }

}

