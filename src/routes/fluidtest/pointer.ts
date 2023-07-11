
export default class Pointer {
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
}

function correctDeltaX (canvas, delta) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 1) delta *= aspectRatio;
  return delta;
}

function correctDeltaY (canvas, delta) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1) delta /= aspectRatio;
  return delta;
}

export function updatePointerDownData (canvas, pointer, id, posX, posY) {
  pointer.id = id;
  pointer.down = true;
  pointer.moved = false;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.deltaX = 0;
  pointer.deltaY = 0;
}

export function updatePointerMoveData (canvas, pointer, posX, posY) {
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.deltaX = correctDeltaX(canvas, pointer.texcoordX - pointer.prevTexcoordX);
  pointer.deltaY = correctDeltaY(canvas, pointer.texcoordY - pointer.prevTexcoordY);
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

export function updatePointerUpData (canvas, pointer) {
  pointer.down = false;
}

