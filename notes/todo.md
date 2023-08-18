
# TODO

- Asset manager / preloader
- Bundle physics loop and table deinifiion closer together
  - Assemble game engine, renderer, audio engine, asset manager, and debug panel in +pagw
  - Communicate via Table.gameState
- Invert control of tracks
  - List of 'Stages'
  - Each stage has a Track, an FxSpec, loaded state
- Sync music start to launch event
  - Double-time beat pulses
- Constant time score incrementer
- Spatial binning?
- Table definition
  - Implement combo mechanics (DT)
- Graphics
  - Integrate smoke layer
  - FX
    - Paint splash
    - Tears
    - Perlin mask
    - Invert
    - Transition to Hyper
  - Proper launcher graphic
    - Move launcher color to it's own layer (or extras layer)
  - All black outlines
    - Shader-only? Fake reflections from playfield graphic
  - Improved colorscheme?
  - Targets and droptargets
  - Layers with spare channels:
      - Lanes: green
      - DroptargetSlots: blue
      - TargetRolloverKicker: red
        - Outlane kickers probably not going to be drawn
        - Potential spare red channel
  - See if removing Vader helps with performance on laptop
- Get some basic sound fx
- Music in layers instead of clips
  - Second mode maybe

# In progress

- Chrome ball
- Tilting
