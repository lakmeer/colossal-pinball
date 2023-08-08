<script lang="ts">
  import Vec2 from '$lib/Vec2';

  import { onMount } from 'svelte';
  import { lerp, loadImage } from "$lib/utils";

  import Vader from '$src/vader';

  import shader from '$src/shaders/table.glsl?raw';

  export let ballPos:Vec2 = Vec2.zero; // In screen space
  export let width:number;
  export let height:number;

  let u_tex_rtk:HTMLImageElement;
  let u_tex_base:HTMLImageElement;
  let u_tex_hair:HTMLImageElement;
  let u_tex_bump:HTMLImageElement;
  let u_tex_drop:HTMLImageElement;
  let u_tex_logo:HTMLImageElement;
  let u_tex_text:HTMLImageElement;
  let u_tex_misc:HTMLImageElement;
  let u_tex_face1:HTMLImageElement;
  let u_tex_face2:HTMLImageElement;
  let u_tex_rings:HTMLImageElement;
  let u_tex_wood:HTMLImageElement;
  let u_tex_lanes:HTMLImageElement;
  let u_tex_indic:HTMLImageElement;
  let u_tex_skirts:HTMLImageElement;
  let u_tex_labels:HTMLImageElement;
  let u_tex_plastics:HTMLImageElement;

  let u_tex_noise:HTMLImageElement;


  let start = performance.now();
  let t = performance.now();

  onMount(async () => {

    // Load layers
    u_tex_wood     = await loadImage('/wood1.jpg');
    u_tex_rtk      = await loadImage('/layers/RolloversTargetsKickers.webp');
    u_tex_base     = await loadImage('/layers/Base.webp');
    u_tex_face1    = await loadImage('/layers/Faces1.webp');
    u_tex_face2    = await loadImage('/layers/Faces2.webp');
    u_tex_hair     = await loadImage('/layers/Hair.webp');
    u_tex_text     = await loadImage('/layers/LabelText.webp');
    u_tex_bump     = await loadImage('/layers/Bumpers.webp');
    u_tex_drop     = await loadImage('/layers/DropTargetSlots.webp');
    u_tex_logo     = await loadImage('/layers/Logo.webp');
    u_tex_rings    = await loadImage('/layers/Rings.webp');
    u_tex_lanes    = await loadImage('/layers/Lanes.webp');
    u_tex_labels   = await loadImage('/layers/ScoringLabels.webp');
    u_tex_skirts   = await loadImage('/layers/PlasticSkirts.webp');
    u_tex_indic    = await loadImage('/layers/Indicators.webp');
    u_tex_misc     = await loadImage('/layers/Combined.webp');
    u_tex_plastics = await loadImage('/layers/Plastics.webp');

    u_tex_noise    = await loadImage('/noise.png');

  });
</script>


<div class="LayerRenderer">
  <Vader auto {shader}
    {u_tex_rtk}
    {u_tex_misc}
    {u_tex_base}
    {u_tex_text}
    {u_tex_face1}
    {u_tex_face2}
    {u_tex_hair}
    {u_tex_bump}
    {u_tex_wood}
    {u_tex_logo}
    {u_tex_drop}
    {u_tex_rings}
    {u_tex_lanes}
    {u_tex_labels}
    {u_tex_indic}
    {u_tex_skirts}
    {u_tex_plastics}

    {u_tex_noise}

    u_ball_pos={[ ballPos.x * width, height - ballPos.y * height ]}
    u_beat={((t - start)/500 % 1) * 0 + 1}
    u_holo={0.0}
    u_hypno={0.0}
    u_distort={0.0}
    u_hyper={0.0}

    onFrame={() => t = performance.now()}
    label="test">
  </Vader>
</div>


<style>
  .LayerRenderer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: grey;
  }

  .LayerRenderer :global(canvas) {
    position: relative;
    margin: auto;
    width: auto;
    height: 100vh;
  }

</style>
