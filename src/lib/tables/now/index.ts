
import type Shape from "$lib/Shape";
import type Table from "$lib/tables";
import type Zone  from "$lib/Zone";

import Vec2     from "$lib/Vec2";
import Rect     from "$lib/Rect";
import Color    from "$lib/Color";
import Flipper  from "$lib/Flipper";
import Collider from "$lib/Collider";

import { Segment, Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";
import { Drain } from "$lib/Zone";

import { PI, TAU } from "$lib/utils";


//
// Generate the Now table
//

export default ():Table => {

  const name = "NOW";
  const bounds = new Rect(-216, 768, 216, 0);
  const colliders:Record<string,Collider> = {};
  const zones:Record<string,Zone> = {};
  const flippers = {} as Table["flippers"];


  // Vars

  let flipperSize = 27;

  let ballRad     = 5;
  let ballSize    = ballRad * 2;
  let chuteWall   = 6;
  let chuteWidth  = ballSize + 2;


  // Shorthands

  const L  = bounds.left;
  const R  = bounds.right;
  const W  = bounds.w;
  const H  = bounds.h;
  const TW = bounds.w - chuteWidth - chuteWall; // table width except chute
  const TR = L + TW;  // rightmost position excluding chute
  const M  = TW/2 + L; // middle line of playfield
  

  // Adds a collider to the field based on the shape

  const _ = (name:string, shape:Shape, color = Color.static()) => {
    colliders[name] = new Collider(shape, color);
  }


  //
  // Playfield Elements
  //

  // Launch chute and right wall


  // Central drain

  console.log(L, TR, TW, M);
  zones.drain = Drain.from(Box.from(L, 80, TR, 0));
  console.log(zones.drain);


  // Flippers

  flippers.left  = new Flipper(Vec2.fromXY(M - 20 - flipperSize, 46), 4, flipperSize, 0  - PI/6,  PI/4, 50);
  flippers.right = new Flipper(Vec2.fromXY(M + 20 + flipperSize, 46), 4, flipperSize, PI + PI/6, -PI/4, 50);


  // Done

  console.log(`Loaded table '${name}':
  ${Object.values(zones).length} zones
  ${Object.values(colliders).length} colliders
  ${Object.values(flippers).length} flippers`);

  return {
    bounds,
    zones,
    flippers,
    colliders,
    template: null,
    templateSrc: "/now.png",
    ballRad: ballSize/2,
  }
}

