
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

  const bounds = Rect.from(0, 0, 432, 768);
  const colliders:Record<string,Collider> = {};
  const zones:Record<string,Zone> = {};


  // Vars

  let flipperSize = 27;

  let ballRad     = 5;
  let ballSize    = ballRad * 2;
  let chuteWall   = 6;
  let chuteWidth  = ballSize + 2;

  let tableWidth  = bounds.w - chuteWidth - chuteWall;
  let middle      = tableWidth/2 + bounds.left;
  let drainWidth  = ballSize * 2;

  let upperLaneCenter = middle - 14;
  let upperLaneStride = 22;


  // Adds a collider to the field based on the shape

  const _ = (name:string, shape:Shape, color = Color.static()) => {
    colliders[name] = new Collider(shape, color);
  }


  //
  // Playfield Elements
  //

  // Launch chute and right wall

  console.log("Table complete:", Object.values(colliders).length, "elements total");


  // Central drain

  zones.drain = Drain.from(Box.fromBounds(bounds.left, 0, bounds.right - chuteWidth - chuteWall, 15));


  // Final Table

  return {
    bounds,
    zones,
    colliders,
    template: null,
    templateSrc: "/now.png",
    flippers: {
      left: new Flipper(Vec2.fromXY(middle - drainWidth/2 - flipperSize, 46), 4, flipperSize, 0  - PI/6,  PI/4, 50),
      right: new Flipper(Vec2.fromXY(middle + drainWidth/2 + flipperSize, 46), 4, flipperSize, PI + PI/6, -PI/4, 50),
    }
  }
}

