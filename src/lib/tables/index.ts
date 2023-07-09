
import type Rect  from "$lib/Rect";
import type Thing from "$lib/Thing";



// Table Type

export default class Table {
  name:       string;
  bounds:     Rect;
  ballRad:    number;
  things:     Record<string,Thing>;
  process:    (events:any[]) => void;
  template:   null | HTMLImageElement;
  templateSrc: string;
}

