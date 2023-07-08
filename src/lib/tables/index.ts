
import type Collider from "$lib/Collider";
import type Rect     from "$lib/Rect";
import type Zone     from "$lib/Zone";
import type Deco     from "$lib/Deco";
import type Shape    from "$lib/Shape";
import type Flipper  from "$lib/Flipper";


// Table Type

export default class Table {
  bounds:     Rect;
  zones:      Record<string,Zone>;
  decos:      Record<string,Deco>;
  colliders:  Record<string,Collider>;
  ballRad:    number;
  template:   null | HTMLImageElement;
  templateSrc: string;
  flippers: {
    left:  Flipper;
    right: Flipper;
  }
}
