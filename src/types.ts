import type Vec2 from "$lib/Vec2";

export type Scalar = number;

export type Tuple2 = [ number, number ];
export type Tuple3 = [ number, number, number ];
export type Tuple4 = [ number, number, number, number ];

export type Circle = {
  pos:Vec2,
  rad:number
}

export type Capsule ={
  a:Vec2,
  b:Vec2,
  rad:number
}
