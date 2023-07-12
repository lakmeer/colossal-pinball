
import type Vec2  from "$lib/Vec2";
import type Rect  from "$lib/Rect";
import type Thing from "$lib/Thing";

import type { InputState } from "$types";



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
  };

  process (input: InputState) { }

  onRequestNewBall (fn) { }
}

