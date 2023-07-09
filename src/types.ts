import type Vec2 from "$lib/Vec2";
import type { EventType } from "$lib/Thing";

export type Scalar = number;

export type Tuple2 = [ number, number ];
export type Tuple3 = [ number, number, number ];
export type Tuple4 = [ number, number, number, number ];

export type InputState = {
  left: boolean;
  right: boolean;
}

export type EventQueue = Array<[ string, EventType ]>;


