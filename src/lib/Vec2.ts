
import type { Scalar, Tuple2 } from "$types";


//
// Vec2
//

export default class Vec2 extends Array {

  constructor (x:number, y:number) {
    // This works but typescript doesn't get it
    // @ts-ignore
    super(x, y);
  }

  get x():number { return this[0]; }
  get y():number { return this[1]; }

  set x(v:number) { this[0] = v; }
  set y(v:number) { this[1] = v; }

  get spread ():Tuple2 {
    return [this.x, this.y];
  }


  // Immutable

  clone ():Vec2 {
    return new Vec2(this.x, this.y);
  }

  add (v:Vec2):Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub (v:Vec2):Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale (s:Scalar):Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  dot (v:Vec2):Scalar {
    return this.x * v.x + this.y * v.y;
  }

  len ():Scalar {
    return Math.sqrt(this.dot(this));
  }

  norm ():Vec2 {
    return this.scale(1 / this.len());
  }

  dist (v:Vec2):Scalar {
    return this.sub(v).len();
  }

  angle (v:Vec2):Scalar {
    return Math.atan2(this.y, this.x);
  }

  rotate (a:Scalar):Vec2 {
    return new Vec2(
      this.x * Math.cos(a) - this.y * Math.sin(a),
      this.x * Math.sin(a) + this.y * Math.cos(a)
    );
  }

  lerp (v:Vec2, t:Scalar):Vec2 {
    return this.add(v.sub(this).scale(t));
  }

  raw ():Float32Array {
    return new Float32Array(this);
  }


  // Mutable

  set (v:Vec2):Vec2 {
    this[0] = v[0];
    this[1] = v[1];
    return this;
  }

  set2 (x:number, y:number):Vec2 {
    this[0] = x;
    this[1] = y;
    return this;
  }

  addSelf (v:Vec2):Vec2 {
    this[0] += v[0];
    this[1] += v[1];
    return this;
  }

  subSelf (v:Vec2):Vec2 {
    this[0] -= v[0];
    this[1] -= v[1];
    return this;
  }

  scaleSelf (s:Scalar):Vec2 {
    this[0] *= s;
    this[1] *= s;
    return this;
  }

  normSelf ():Vec2 {
    return this.scaleSelf(1 / this.len());
  }


  // Static

  static from (x:number, y:number):Vec2 {
    return new Vec2(x, y);
  }

  static random (minX:Scalar, maxX:Scalar, minY?:Scalar, maxY?:Scalar):Vec2 {
    if (minY === undefined) minY = minX;
    if (maxY === undefined) maxY = maxX;

    return new Vec2(
      Math.random() * (maxX - minX) + minX,
      Math.random() * (maxY - minY) + minY
    );
  }
}


