
import type { Tuple4 } from '$types';

import { randFrom } from '$lib/utils';

const { floor } = Math;

const RED    = [ 0.9, 0.2, 0.4, 1 ] as Tuple4;
const GREEN  = [ 0.2, 0.9, 0.4, 1 ] as Tuple4;
const BLUE   = [ 0.2, 0.4, 0.9, 1 ] as Tuple4;
const PURPLE = [ 0.8, 0.2, 0.9, 1 ] as Tuple4;
const YELLOW = [ 0.9, 0.8, 0.2, 1 ] as Tuple4;

const COLORS:Tuple4[] = [ RED, GREEN, BLUE, PURPLE, YELLOW ];


//
// Color
//

export default class Color extends Array {

  constructor (r:number, g:number, b:number, a:number) {
    // This works but typescript doesn't get it
    // @ts-ignore
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

  get spread ():Tuple4 {
    return [this.r, this.g, this.b, this.a];
  }

  toString () {
    return `rgba(${floor(this.r*255)}, ${floor(this.g*255)}, ${floor(this.b*255)}, ${this.a})`;
  }

  static random () {
    const c = randFrom(COLORS);
    return new Color(...c);
  }

}
