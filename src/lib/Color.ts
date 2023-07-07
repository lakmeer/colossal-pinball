
import type { Tuple4 } from '$types';

import { randFrom } from '$lib/utils';

const { floor } = Math;

const RED    = [ 0.9, 0.2, 0.4, 1 ] as Tuple4;
const ORANGE = [ 0.9, 0.5, 0.2, 1 ] as Tuple4;
const YELLOW = [ 0.9, 0.8, 0.2, 1 ] as Tuple4;
const GREEN  = [ 0.2, 0.9, 0.3, 1 ] as Tuple4;
const CYAN   = [ 0.2, 0.8, 0.8, 1 ] as Tuple4;
const BLUE   = [ 0.2, 0.4, 0.9, 1 ] as Tuple4;
const PURPLE = [ 0.8, 0.2, 0.9, 1 ] as Tuple4;
const WHITE  = [ 0.9, 0.9, 0.9, 1 ] as Tuple4;
const LIGHT  = [ 0.6, 0.6, 0.6, 1 ] as Tuple4;
const DARK   = [ 0.3, 0.3, 0.3, 1 ] as Tuple4;

const COLORS:Tuple4[] = [ RED, ORANGE, YELLOW, GREEN, CYAN, BLUE, PURPLE ];


//
// Color
//

export default class Color extends Array {

  constructor (r:number, g:number, b:number, a:number) {
    // @ts-ignore - This works but typescript doesn't get it
    super(r, g, b, a);
  }

  get r():number { return this[0]; }
  get g():number { return this[1]; }
  get b():number { return this[2]; }
  get a():number { return this[3]; }

  set r(v:number) { this[0] = v; }
  set g(v:number) { this[1] = v; }
  set b(v:number) { this[2] = v; }
  set a(v:number) { this[3] = v; }

  get spread():Tuple4 {
    return [this.r, this.g, this.b, this.a];
  }

  alpha(a:number):Color {
    return new Color(this.r, this.g, this.b, a);
  }

  toString() {
    return `rgba(${floor(this.r*255)}, ${floor(this.g*255)}, ${floor(this.b*255)}, ${this.a})`;
  }

  to8bit():Tuple4 {
    return [floor(this.r*255), floor(this.g*255), floor(this.b*255), floor(this.a*255)];
  }

  static random () {
    const c = randFrom(COLORS);
    return new Color(...c);
  }

  static fromRgb (r:number, g:number, b:number) {
    return new Color(r/255, g/255, b/255, 1);
  }


  // Default colors for certain purposes

  static interactive () {
    return new Color(...CYAN);
  }

  static static () {
    return new Color(...BLUE);
  }

  static zone () {
    return new Color(...GREEN).alpha(0.3);
  }
}

