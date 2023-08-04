<script lang="ts">
  import { onMount } from 'svelte';
  import { lerp, loadImage } from "$lib/utils";

  import Vader from '$src/vader';

  import shader from '$src/shaders/table.glsl?raw';

  let u_tex_base:HTMLImageElement;
  let u_tex_face:HTMLImageElement;
  let u_tex_hair:HTMLImageElement;
  let u_tex_bump:HTMLImageElement;
  let u_tex_misc:HTMLImageElement;

  onMount(async () => {

    // Load layers
    u_tex_base = await loadImage('/layers/Base.webp');
    u_tex_face = await loadImage('/layers/Faces.webp');
    u_tex_hair = await loadImage('/layers/Hair.webp');
    u_tex_bump = await loadImage('/layers/Bumpers.webp');
    u_tex_misc = await loadImage('/layers/Combined.webp');

  });
</script>


<div class="LayerRenderer">
  <Vader auto
    {u_tex_base}
    {u_tex_face}
    {u_tex_hair}
    {u_tex_bump}
    {u_tex_misc}

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
