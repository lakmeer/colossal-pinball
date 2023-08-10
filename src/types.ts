import type Vec2 from "$lib/Vec2";
import type { EventType } from "$lib/Thing";

export type Scalar = number;

export type Tuple2 = [ number, number ];
export type Tuple3 = [ number, number, number ];
export type Tuple4 = [ number, number, number, number ];

export type InputState = {
  left: boolean;
  right: boolean;
  launch: boolean;
}

export type EventQueue = Array<[ string, EventType ]>;

export type FxConfig = {
  hyper: number;
  holo: number;
  rainbow: number;
  distort: number;
  hypno: number;
  beat: number;
}

