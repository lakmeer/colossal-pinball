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
  let u_tex_face:HTMLImageElement;
  let u_tex_hair:HTMLImageElement;
  let u_tex_bump:HTMLImageElement;
  let u_tex_drop:HTMLImageElement;
  let u_tex_logo:HTMLImageElement;
  let u_tex_text:HTMLImageElement;
  let u_tex_misc:HTMLImageElement;
  let u_tex_rings:HTMLImageElement;
  let u_tex_lanes:HTMLImageElement;
  let u_tex_labels:HTMLImageElement;
  let u_tex_plastics:HTMLImageElement;

  onMount(async () => {

    // Load layers
    u_tex_rtk      = await loadImage('/layers/RolloversTargetsKickers.webp');
    u_tex_base     = await loadImage('/layers/Base.webp');
    u_tex_face     = await loadImage('/layers/Faces.webp');
    u_tex_hair     = await loadImage('/layers/Hair.webp');
    u_tex_text     = await loadImage('/layers/LabelText.webp');
    u_tex_bump     = await loadImage('/layers/Bumpers.webp');
    u_tex_drop     = await loadImage('/layers/DropTargetSlots.webp');
    u_tex_logo     = await loadImage('/layers/Logo.webp');
    u_tex_rings    = await loadImage('/layers/Rings.webp');
    u_tex_lanes    = await loadImage('/layers/Lanes.webp');
    u_tex_labels   = await loadImage('/layers/ScoringLabels.webp');
    u_tex_misc     = await loadImage('/layers/Combined.webp');
    u_tex_plastics = await loadImage('/layers/Plastics.webp');

  });

</script>


<div class="LayerRenderer">
  <Vader auto
    {u_tex_rtk}
    {u_tex_misc}
    {u_tex_base}
    {u_tex_text}
    {u_tex_face}
    {u_tex_hair}
    {u_tex_bump}
    {u_tex_logo}
    {u_tex_drop}
    {u_tex_rings}
    {u_tex_lanes}
    {u_tex_labels}
    {u_tex_plastics}

    u_ball_pos={[ ballPos.x * width, height - ballPos.y * height ]}

    {shader}
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
