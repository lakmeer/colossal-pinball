<script lang="ts">
  import Vec2 from '$lib/Vec2';
  import type Rect from '$lib/Rect';
  import type { Lamp, Flipper } from '$lib/Thing';
  import type { FxConfig } from "$src/types";
  import type Table from "$lib/tables";

  type GameState = Table['gameState'];

  import { onMount } from 'svelte';
  import { loadImage } from "$lib/utils";

  import Vader from '$src/vader';
  import shader from '$src/shaders/table.glsl?raw';

  export let ballPos:Vec2 = Vec2.zero; // In world space
  export let world:Rect;
  export let fx:FxConfig;
  export let gameState:GameState;

  let u_tex_rtk:HTMLImageElement;
  let u_tex_base:HTMLImageElement;
  let u_tex_hair:HTMLImageElement;
  let u_tex_text:HTMLImageElement;
  let u_tex_misc:HTMLImageElement;
  let u_tex_face1:HTMLImageElement;
  let u_tex_face2:HTMLImageElement;
  let u_tex_wood:HTMLImageElement;
  let u_tex_lanes:HTMLImageElement;
  let u_tex_walls:HTMLImageElement;
  let u_tex_extra:HTMLImageElement;
  let u_tex_rails:HTMLImageElement;
  let u_tex_indic:HTMLImageElement;
  let u_tex_labels:HTMLImageElement;
  let u_tex_lights:HTMLImageElement;
  let u_tex_plastics:HTMLImageElement;

  let u_tex_noise:HTMLImageElement;

  let start = performance.now();
  let t = performance.now();

  $: lampState = Object.values(gameState.lamps).map((lamp:Lamp) => ([
    lamp.shape.pos.x,
    lamp.shape.pos.y,
    lamp.state.active ? 1 : 0,
  ]));

  $: flipperState = Object.values(gameState.flippers).map((flip:Flipper) => ([
    flip.shape.pos.x, flip.shape.pos.y, flip.shape.tip.x, flip.shape.tip.y,
  ]));

  $: u_ball_pos = [ ballPos.x, ballPos.y ];

  onMount(async () => {

    // Load layers
    u_tex_wood     = await loadImage('/wood1.jpg');
    u_tex_rtk      = await loadImage('/layers/RolloversTargetsKickers.webp');
    u_tex_base     = await loadImage('/layers/Base.webp');
    u_tex_face1    = await loadImage('/layers/Faces1.webp');
    u_tex_face2    = await loadImage('/layers/Faces2.webp');
    u_tex_hair     = await loadImage('/layers/Hair.webp');
    u_tex_text     = await loadImage('/layers/LabelTextAndSkirts.webp');
    u_tex_lanes    = await loadImage('/layers/Lanes.webp');
    u_tex_lights   = await loadImage('/layers/LightingBlurred.webp');
    u_tex_labels   = await loadImage('/layers/ScoringLabels.webp');
    u_tex_indic    = await loadImage('/layers/Indicators.webp');
    u_tex_misc     = await loadImage('/layers/LampsEyesPlasticWhite.webp');
    u_tex_plastics = await loadImage('/layers/Plastics.webp');
    u_tex_walls    = await loadImage('/layers/Walls.webp');
    u_tex_rails    = await loadImage('/layers/LaneRails.webp');
    u_tex_extra    = await loadImage('/layers/ExtraBumperSlotsLogo.webp');
    u_tex_noise    = await loadImage('/noise.png');

  });
</script>


<div class="LayerRenderer">
  <Vader auto scale={0.5} {shader}

    {u_tex_rtk}
    {u_tex_misc}
    {u_tex_base}
    {u_tex_text}
    {u_tex_face1}
    {u_tex_face2}
    {u_tex_hair}
    {u_tex_wood}
    {u_tex_lanes}
    {u_tex_walls}
    {u_tex_extra}
    {u_tex_rails}
    {u_tex_labels}
    {u_tex_indic}
    {u_tex_lights}
    {u_tex_plastics}

    {u_tex_noise}

    u_ball_pos={u_ball_pos}
    u_world={world.asTuple()}
    u_beat_time={(t - start)/500 % 1}
    u_holo={fx.holo}
    u_hypno={fx.hypno}
    u_melt={fx.melt}
    u_hyper={fx.hyper}
    u_beat={fx.beat}
    u_rgb={fx.rgb}
    u_face={fx.face}
    u_swim={fx.swim}
    u_light={fx.light}

    u_flippers={flipperState}
    u_num_lamps={lampState.length}
    u_lamps={lampState}
    u_score_phase={0}

    onFrame={() => {
      t = performance.now();
      gameState = gameState;
      ballPos = ballPos;
    }}
    label="test">
  </Vader>
</div>


<style>

  .LayerRenderer :global(.Vader) {
    height: 100%;
    width: 100%;
  }

  .LayerRenderer :global(canvas) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

</style>
