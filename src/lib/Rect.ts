
import type { Tuple4 } from "$types";


//
// Rect
//
// Is in World-Y by default (Y increasing upwards);
// toBounds() returns bbox in Screen-Y (Y increasing downwards).
//

export default class Rect {

  x:number;
  y:number;
  w:number;
  h:number;

  constructor (x:number, y:number, w:number, h:number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get x1():number { return this.x - this.w/2; }
  get y1():number { return this.y + this.h/2; }
  get x2():number { return this.x + this.w/2; }
  get y2():number { return this.y - this.h/2; }

  get top():number    { return this.y1; }
  get left():number   { return this.x1; }
  get right():number  { return this.x2; }
  get bottom():number { return this.y2; }

  toBounds ():Tuple4 { // Screen Y
    return [ this.x1, this.y2, this.w, this.h ];
  }

  toRange ():Tuple4 { // World Y
    return [ this.x1, this.x2, this.y1, this.y2 ];
  }

}

