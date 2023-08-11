
# TODO

- Whole game state as object, pass to renderer, make reactive
- Spatial binning?
- Table definition
  - Remove string-indexing helper function, reference object by variable
- Tilting
- Graphics
  - Proper launcher graphic
    - Move launcher color to it's own layer (or extras layer)
  - All black outlines
  - Chrome ball
    - Shader-only? Fake reflections from playfield graphic
  - Targets and droptargets
  - Improve colorscheme
  - Layers with spare channels:
      - Lanes: green
      - DroptargetSlots: blue
      - TargetRolloverKicker: red
        - Outlane kickers probably not going to be drawn
        - Potential spare red channel
  - Separate face and hair masks per-face?
  - Make outer wall fatter
  - New combined extra/bumper/slot/logo layer has wrong dimensions
- Drop CanvasRenderer
  - Move score display into main page as HTML

- Basic sound fx

