
import type { Scalar, Tuple2 } from "$types";

const { cos, sin, hypot, atan2 } = Math;


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
    return hypot(this.x, this.y);
  }

  norm ():Vec2 {
    return this.scale(1 / this.len());
  }

  perp ():Vec2 {
    return new Vec2(-this.y, this.x);
  }

  dist (v:Vec2):Scalar {
    return hypot(this.x - v.x, this.y - v.y);
  }

  angle (v:Vec2):Scalar {
    return atan2(this.y, this.x) - atan2(v.y, v.x);
  }

  rotate (a:Scalar):Vec2 {
    return new Vec2(
      this.x * Math.cos(a) - this.y * Math.sin(a),
      this.x * Math.sin(a) + this.y * Math.cos(a)
    );
  }

  face (v:Vec2):Vec2 {
    return this.rotate(this.angle(v));
  }

  towards (v:Vec2, s = 1):Vec2 {
    return this.add(v.sub(this).withLen(s));
  }

  lerp (v:Vec2, t:Scalar):Vec2 {
    return this.add(v.sub(this).scale(t));
  }

  withLen (s:Scalar):Vec2 {
    return this.norm().scale(s);
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

  setLen (s:Scalar):Vec2 {
    return this.scaleSelf(s / this.len());
  }

  setAngle (a:Scalar):Vec2 {
    const len = this.len();
    this[0] = cos(a) * len;
    this[1] = sin(a) * len;
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

  static fromXY (x:number, y:number):Vec2 {
    return new Vec2(x, y);
  }

  static fromAngle (a:Scalar, len:Scalar):Vec2 {
    return new Vec2(cos(a) * len, sin(a) * len);
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


