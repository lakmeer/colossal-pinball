
import type Vec2  from "$lib/Vec2";
import type Rect  from "$lib/Rect";
import type Thing from "$lib/Thing";

import type { InputState } from "$types";
import type { Lamp, Flipper } from "$lib/Thing";



// Table Type

export default class Table {

  name:  string;
  things:  Record<string,Thing>;
  config: {
    bounds:  Rect;
    ballRad: number;
    gravity: number;
  };
  gameState: {
    score:       number;
    ballStock:   number;
    ballsInPlay: number;
    awaitNewBall: boolean;
    lamps:      Record<string,Lamp>;
    flippers:   Record<string,Flipper>;
  };

  process (input: InputState) { }

  onRequestNewBall (fn) { }
}

