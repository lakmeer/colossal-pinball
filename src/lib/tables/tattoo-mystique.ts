// TODO: Update to new schema
/*
import type Rect  from "$lib/Rect";
import type Shape from "$lib/Shape";
import type Table from "$lib/tables";
import type Zone  from "$lib/Zone";

import Vec2     from "$lib/Vec2";
import Color    from "$lib/Color";
import Flipper  from "$lib/Flipper";
import Collider from "$lib/Collider";

import { Segment, Circle, Capsule, Arc, Fence, Box } from "$lib/Shape";
import { Drain } from "$lib/Zone";

import { PI, TAU } from "$lib/utils";


//
// Generate the Tattoo Mystique debug table
//

export default (world:Rect):Table => {

  const colliders:Collider[] = [];
  const zones:Zone[] = [];


  // Vars

  let flipperSize = 27;

  let ballRad     = 5;
  let ballSize    = ballRad * 2;
  let chuteWall   = 6;
  let chuteWidth  = ballSize + 2;

  let tableWidth  = world.w - chuteWidth - chuteWall;
  let middle      = tableWidth/2 + world.left;
  let drainWidth  = ballSize * 2;

  let upperLaneCenter = middle - 14;
  let upperLaneStride = 22;


  // Adds a collider to the field based on the shape

  const _ = (shape:Shape) => {
    colliders.push(new Collider(shape, Color.static()));
  }


  //
  // Playfield Elements
  //

  // Launch chute and right wall
  _(Capsule.at(world.right - chuteWidth - chuteWall/2, 290, world.right - chuteWidth - chuteWall/2, 0, chuteWall/2));
  _(Arc.at(world.right - 59, 290, 60, TAU/7));
  _(Fence.at(
    middle + tableWidth/2 - 0,  264,
    middle + tableWidth/2 - 12, 268,
    middle + tableWidth/2 - 20, 250,
    middle + tableWidth/2 - 31, 243,
    middle + tableWidth/2 - 32, 255,
    middle + tableWidth/2 - 12, 306,
    middle + tableWidth/2 - 1,  304,
    middle + tableWidth/2 + 5,  290,
  ));
  _(Circle.at(middle + 60, 242, 5));
  _(Circle.at(middle + 64, 234, 3));

  // Lower walls
  _(Capsule.at(middle - 38, 46, middle - 57, 57, 5));
  _(Capsule.at(middle + 38, 46, middle + 74, 70, 5));

  // Drain and lower wall
  _(Segment.at(middle + tableWidth/2, 57, middle + drainWidth - 3, 16, true));
  _(Segment.at(middle - tableWidth/2, 57, middle - drainWidth + 3, 16, false));

  // Lower slingshots
  _(Fence.at(middle + 46, 84, middle + 58, 128, middle + 60, 94).close());
  _(Fence.at(middle - 45, 79, middle - 57, 116, middle - 57, 94).close().flipNormals());

  // Upper bumpers
  _(Circle.at(middle -  7, 251, 15));
  _(Circle.at(middle - 28, 286, 15));
  _(Circle.at(middle + 13, 299, 15));

  // Upper wall
  _(Arc.at(middle + 56, 352, 35, TAU/4 + TAU/14, -TAU/14));
  _(Fence.at(middle + 56, 352 + 35, world.left + 25, 352 + 35));

  // Upper rollover lanes
  _(Capsule.fromAngle(upperLaneCenter - upperLaneStride * 1.5, 315, TAU/4, 25, 5));
  _(Capsule.fromAngle(upperLaneCenter - upperLaneStride * 0.5, 320, TAU/4, 25, 5));
  _(Capsule.fromAngle(upperLaneCenter + upperLaneStride * 0.5, 325, TAU/4, 25, 5));
  _(Capsule.fromAngle(upperLaneCenter + upperLaneStride * 1.5, 330, TAU/4, 25, 5));

  // Left wall
  _(Fence.at(
    world.left, 290,
    world.left + 20, 240,
    world.left + 12, 163,
    world.left + 21, 135,
  ));
  _(Arc.at(world.left + 35, 100, 38, TAU/6, TAU/4 + TAU/16));
  _(Arc.at(world.left + 15, 84, 16, TAU/4, TAU/2));
  _(Segment.at(world.left + 15, 68, world.left + 15, 50));

  // Left outlane
  _(Capsule.at(middle - 76, 107, middle - 76, 82, 1));

  // Right outlane
  _(Capsule.at(middle + 78, 120, middle + 78, 70, 1));
  _(Arc.at(middle + 48, 93, 30, TAU/8, -TAU/8));

  // Right target assembly
  _(Capsule.at( middle + tableWidth/2 - 22, 198, middle + tableWidth/2 - 0,  240, 3));
  _(Fence.at(
    middle + tableWidth/2 - 0,  130,
    middle + tableWidth/2 - 7,  130,
    middle + tableWidth/2 - 20, 165,
    middle + tableWidth/2 - 0,  205,
    middle + tableWidth/2 - 14, 212,
  ));

  // Upper-left lock lane
  _(Capsule.at(middle - 66, 300, middle - 66, 386, 1));
  _(Capsule.at(middle - 64, 374, middle - 38, 371, 2));
  _(Arc.at(middle - 38, 341, 28, 8*TAU/32, 8*TAU/32 ));
  _(Arc.at(middle - 79, 384, 13, TAU/2, 0));

  // Upper-right target assembly
  _(Arc.at(middle + 43, 352, 25, 11*TAU/32, -1*TAU/32));
  _(Capsule.at(middle + 33, 373, middle + 66, 348, 3));

  // Central bumpers
  _(Fence.at(
    middle - 25, 222,
    middle - 16, 240,
    middle +  2, 240,
    middle +  9, 236,
    middle + 12, 216,
  ).close());

  console.log("Table complete:", colliders.length, "elements total");


  // Central drain

  zones.push(Drain.from(Box.fromBounds(world.left, 0, world.right - chuteWidth - chuteWall, 15)));


  // Final Table

  return {
    bounds: world,
    zones,
    colliders,
    flippers: {
      left: new Flipper(Vec2.fromXY(middle - drainWidth/2 - flipperSize, 46), 4, flipperSize, 0  - PI/6,  PI/4, 50),
      right: new Flipper(Vec2.fromXY(middle + drainWidth/2 + flipperSize, 46), 4, flipperSize, PI + PI/6, -PI/4, 50),
    }
  }
}
*/
