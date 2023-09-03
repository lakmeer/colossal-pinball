<script lang="ts">

  /*
  Derived from: github.com/PavelDoGreat/WebGL-Fluid-Simulation

  MIT License

    Copyright (c) 2017 Pavel Dobryakov

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
  */

  import type { Lamp, Flipper } from '$lib/Thing';
  import type { FxConfig } from "$src/types";
  import type Rect from '$lib/Rect';
  import type Table from "$lib/tables";
  import type Ball from "$lib/Ball";

  type GameState = Table['gameState'];

  import { onMount } from 'svelte';

  import {
    getResolution,
    createTextureAsync,
    createTextureRGBA,
    getWebGLContext,
    isMobile,
  } from "$lib/fluid/functions";

  import * as SHADER_SRC from "$lib/fluid/shaders";

  import Program from "$lib/fluid/program";
  import Pointer from "$lib/fluid/pointer";

  import type { Texture, FBO, DoubleFBO } from "$lib/fluid/types";

  import tabletShaderSrc from '$src/shaders/table.glsl?raw';


  // State

  let canvas:HTMLCanvasElement;
  let rafref = 0;

  export let width = 512;
  export let height = 512;
  export let balls:Ball[] = [];

  let pointers = [];

  export let world:Rect;
  export let fx:FxConfig;
  export let gameState:GameState;

  $: lampState = Object.values(gameState.lamps).map((lamp:Lamp) => ([
    lamp.shape.pos.x,
    lamp.shape.pos.y,
    lamp.state.active ? 1 : 0,
  ]));

  $: flipperState = Object.values(gameState.flippers).map((flip:Flipper) => ([
    flip.shape.pos.x, flip.shape.pos.y, flip.shape.tip.x, flip.shape.tip.y,
  ]));

  // TODO
  let u_flippers;
  let u_num_lamps;
  let u_lamps;

  let u_score_phase = 0

  let tex_rtk:Texture;
  let tex_base:Texture;
  let tex_hair:Texture;
  let tex_text:Texture;
  let tex_misc:Texture;
  let tex_face1:Texture;
  let tex_face2:Texture;
  let tex_wood:Texture;
  let tex_lanes:Texture;
  let tex_walls:Texture;
  let tex_extra:Texture;
  let tex_rails:Texture;
  let tex_indic:Texture;
  let tex_labels:Texture;
  let tex_lights:Texture;
  let tex_plastics:Texture;

  let tex_noise:Texture;

  let start = performance.now();
  let t = performance.now();

  let playfieldTexLower:Texture;
  let playfieldTexUpper:Texture;

  function toCanvasCoords(ball: Ball): [ number, number, number ] {
    let x = (ball.pos.x - world.left)   / world.w * width;
    let y = (ball.pos.y - world.bottom) / world.h * height;
    return [ ball.id, x, height - y ];
  }


  // Simulation section

  //@ts-ignore shut up
  onMount(async () => {

    let lastUpdateTime = performance.now();

    let config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      DENSITY_DISSIPATION:  1.3,  // small values make smoke linger
      VELOCITY_DISSIPATION: 1.1,  // large values move pixels further
      PRESSURE: 0.9,              // pressure > 1 explodes simulation
      PRESSURE_ITERATIONS: 20,    // sim steps, default 20
      CURL: 50,                   // default 30. > ~150 explodes simulation. might be fun to vary
      SPLAT_RADIUS: 0.05,          // bigger radius is brighter but drags more pixels
      SPLAT_FORCE: 630,           // drags pixels further before fading but creates wavefronts
    }


    // Functions depending on the implicit `gl` context

    function compileShader (type, source, keywords = []) {
      keywords.forEach(keyword => {
        source = '#define ' + keyword + '\n' + source;
      });

      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader));
      return shader;
    };


    //
    // Framebuffer stuff
    //

    function initFramebuffers () {
      let simRes = getResolution(gl, config.SIM_RESOLUTION);
      let dyeRes = getResolution(gl, config.DYE_RESOLUTION);

      const texType = ext.halfFloatTexType;
      const rgba    = ext.formatRGBA;
      const rg      = ext.formatRG;
      const r       = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

      gl.disable(gl.BLEND);

      if (dye == null) {
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      } else {
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      }

      if (velocity == null) {
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      } else {
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      }

      divergence = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl       = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure   = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

      gl.enable(gl.BLEND);

      const z = 0.1;
      upper = createFBO(canvas.width * z, canvas.height * z, r.internalFormat, r.format, texType, filtering);
      lower = createFBO(canvas.width * z, canvas.height * z, r.internalFormat, r.format, texType, filtering);
    }

    function createFBO (w:number, h:number, internalFormat, format, type, param):FBO {
      gl.activeTexture(gl.TEXTURE0);
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let texelSizeX = 1.0 / w;
      let texelSizeY = 1.0 / h;

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach (id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        }
      };
    }

    function createDoubleFBO (w, h, internalFormat, format, type, param):DoubleFBO {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);

      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read () { return fbo1; },
        set read (value) { fbo1 = value; },
        get write () { return fbo2; },
        set write (value) { fbo2 = value; },
        swap () {
          let temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        }
      }
    }

    function resizeFBO (target, w, h, internalFormat, format, type, param) {
      let newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      gl.uniform1f(copyProgram.uniforms.uFactor, 1.0);
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO (target, w, h, internalFormat, format, type, param) {
      if (target.width == w && target.height == h)
      return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w;
      target.height = h;
      target.texelSizeX = 1.0 / w;
      target.texelSizeY = 1.0 / h;
      return target;
    }

    function calcDeltaTime () {
      let now = performance.now();
      let dt = (now - lastUpdateTime)/1000;
      dt = Math.min(dt, 0.016666);
      lastUpdateTime = now;
      return dt;
    }

    function resizeCanvas () {
      if (!canvas) return;

      let w = canvas.clientWidth;
      let h = canvas.clientHeight;

      if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
        return true;
      }

      return false;
    }

    function step (dt) {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      let velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering) {
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      }
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);

      dye.swap();
    }

    function splatPointer (pointer) {
      let dx = pointer.deltaX * config.SPLAT_FORCE;
      let dy = pointer.deltaY * config.SPLAT_FORCE;
      textureSplat(pointer.texcoordX, pointer.texcoordY, dx, dy);
    }

    function textureSplat (x, y, dx, dy) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
      blit(velocity.write);
      velocity.swap();

      splatTexProgram.bind();
      gl.uniform1i(splatTexProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform1i(splatTexProgram.uniforms.uTexture, lower.attach(1));
      gl.uniform1f(splatTexProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatTexProgram.uniforms.point, x, y);
      gl.uniform3f(splatTexProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatTexProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
      blit(dye.write);
      dye.swap();
    }

    function correctRadius (radius) {
      let aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1)
      radius *= aspectRatio;
      return radius;
    }


    //
    // Main Update
    //

    function update () {

      // TODO: inject playfield rendering in between
      // TODO: provide render loop externally
      // TODO: scale splat radius by velocity

      const dt = calcDeltaTime();
      if (resizeCanvas()) initFramebuffers();

      // Always supply 4 balls to the shader even if we're not using em all
      let ballCoords = [
        [ 0, 0, 0 ],
        [ 0, 0, 0 ],
        [ 0, 0, 0 ],
        [ 0, 0, 0 ],
      ];

      // Update pointer locations from ball coords
      if (canvas) {
        balls
          .map((ball, id) => {
            ballCoords[id] = [ ball.pos.x, ball.pos.y, 1 ];

            const coords = toCanvasCoords(ball);

            let pointer = pointers.find(p => p.id === id);

            if (!pointer) {
              pointer = new Pointer(id);
              pointers.push(pointer);
            }
            pointer.onMove(canvas, coords[1], coords[2]);
          });
      }

      // Splat from pointers
      pointers.forEach(p => {
        if (p.moved) {
          splatPointer(p);
          p.moved = false;
        }
      });

      // Simulation
      step(dt);

      // Render
      if (false) {
        displayMaterial.bind();
        gl.uniform1i(displayMaterial.uniforms.uTexture,  dye.read.attach(0));
        gl.uniform1i(displayMaterial.uniforms.uVelocity, velocity.read.attach(1));
        gl.uniform1i(displayMaterial.uniforms.bgTexture, lower.attach(2));
        blit(null);
      } else {
        lowerTableProgram.bind();
        gl.uniform2f(lowerTableProgram.uniforms.u_resolution, canvas?.width, canvas?.height);
        gl.uniform4f(lowerTableProgram.uniforms.u_world, ...world.asTuple());
        gl.uniform1f(lowerTableProgram.uniforms.u_time, lastUpdateTime/1000);

        gl.uniform1i(lowerTableProgram.uniforms.u_tex_wood,     tex_wood.attach(0));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_wood,     tex_wood.attach(1));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_rtk,      tex_rtk .attach(2));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_base,     tex_base.attach(3));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_face1,    tex_face1.attach(4));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_face2,    tex_face2.attach(5));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_hair,     tex_hair.attach(6));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_text,     tex_text.attach(7));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_lanes,    tex_lanes.attach(8));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_lights,   tex_lights.attach(9));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_labels,   tex_labels.attach(10));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_indic,    tex_indic.attach(11));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_misc,     tex_misc.attach(12));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_plastics, tex_plastics.attach(13));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_walls,    tex_walls.attach(14));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_rails,    tex_rails.attach(15));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_extra,    tex_extra.attach(16));
        gl.uniform1i(lowerTableProgram.uniforms.u_tex_noise,    tex_noise.attach(17));

        gl.uniform1f(lowerTableProgram.uniforms.u_holo,    fx.holo);
        gl.uniform1f(lowerTableProgram.uniforms.u_hypno,   fx.hypno);
        gl.uniform1f(lowerTableProgram.uniforms.u_melt,    fx.melt);
        gl.uniform1f(lowerTableProgram.uniforms.u_hyper,   fx.hyper);
        gl.uniform1f(lowerTableProgram.uniforms.u_beat,    fx.beat);
        gl.uniform1f(lowerTableProgram.uniforms.u_rgb,     fx.rgb);
        gl.uniform1f(lowerTableProgram.uniforms.u_face,    fx.face);
        gl.uniform1f(lowerTableProgram.uniforms.u_swim,    fx.swim);
        gl.uniform1f(lowerTableProgram.uniforms.u_light,   fx.light);
        gl.uniform1f(lowerTableProgram.uniforms.u_paint,   fx.paint);
        gl.uniform1f(lowerTableProgram.uniforms.u_scroll,  fx.scroll);
        gl.uniform1f(lowerTableProgram.uniforms.u_invert,  fx.invert);
        gl.uniform1f(lowerTableProgram.uniforms.u_prelude, fx.prelude);

        gl.uniform4f(lowerTableProgram.uniforms.u_flipper_left,  ...flipperState[0]);
        gl.uniform4f(lowerTableProgram.uniforms.u_flipper_right, ...flipperState[1]);

        //gl.uniform3fv(lowerTableProgram.uniforms.u_ball_pos, ballCoords);
        gl.uniform3f(lowerTableProgram.uniforms.u_ball_main, ...ballCoords[0]);

        gl.uniform1f(lowerTableProgram.uniforms.u_light, fx.light);
        blit(null);
      }

      // Loop
      rafref = requestAnimationFrame(update);
    }


    //
    // Main start
    //

    const { gl, ext } = getWebGLContext(canvas);

    const blit = (() => {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      return (target) => {
        if (target == null) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }

        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE) {
          console.trace("Framebuffer error: " + status);
        }

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }
    })();

    // Downgrade capabilities
    if (isMobile() || !ext.supportLinearFiltering) config.DYE_RESOLUTION = 512;

    // Framebuffers to be constructed
    let dye:        DoubleFBO | null;
    let velocity:   DoubleFBO | null;
    let divergence: FBO | null;
    let curl:       FBO | null;
    let pressure:   DoubleFBO | null;

    let upper:      FBO | null;
    let lower:      FBO | null;

    // Compile shaders
    const baseVertexShader       = compileShader(gl.VERTEX_SHADER,   SHADER_SRC.baseVertex);
    const copyShader             = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.copy);
    const clearShader            = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.clear);
    const splatShader            = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.splat);
    const advectionShader        = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.advection, ext.supportLinearFiltering ? [] : ['MANUAL_FILTERING']);
    const divergenceShader       = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.divergence);
    const curlShader             = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.curl);
    const vorticityShader        = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.vorticity);
    const pressureShader         = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.pressure);
    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.gradientSubtract);
    const splatTexShader         = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.splatTex);
    const debugShader            = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.debug);

    const lowerTableShader       = compileShader(gl.FRAGMENT_SHADER, tabletShaderSrc);

    // Build shader programs
    const copyProgram            = new Program(gl, baseVertexShader, copyShader);
    const clearProgram           = new Program(gl, baseVertexShader, clearShader);
    const splatProgram           = new Program(gl, baseVertexShader, splatShader);
    const advectionProgram       = new Program(gl, baseVertexShader, advectionShader);
    const divergenceProgram      = new Program(gl, baseVertexShader, divergenceShader);
    const curlProgram            = new Program(gl, baseVertexShader, curlShader);
    const vorticityProgram       = new Program(gl, baseVertexShader, vorticityShader);
    const pressureProgram        = new Program(gl, baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(gl, baseVertexShader, gradientSubtractShader);
    const splatTexProgram        = new Program(gl, baseVertexShader, splatTexShader);
    const debugProgram           = new Program(gl, baseVertexShader, debugShader);

    const lowerTableProgram      = new Program(gl, baseVertexShader, lowerTableShader);

    // Main display material
    const displayShader = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.display);
    const displayMaterial = new Program(gl, baseVertexShader, displayShader);

    // Playfield step begin
    tex_wood     = createTextureRGBA(gl, '/wood1.jpg');
    tex_rtk      = createTextureRGBA(gl, '/layers/RolloversTargetsKickers.webp');
    tex_base     = createTextureRGBA(gl, '/layers/Base.webp');
    tex_face1    = createTextureRGBA(gl, '/layers/Faces1.webp');
    tex_face2    = createTextureRGBA(gl, '/layers/Faces2.webp');
    tex_hair     = createTextureRGBA(gl, '/layers/Hair.webp');
    tex_text     = createTextureRGBA(gl, '/layers/LabelTextAndSkirts.webp');
    tex_lanes    = createTextureRGBA(gl, '/layers/Lanes.webp');
    tex_lights   = createTextureRGBA(gl, '/layers/LightingBlurred.webp');
    tex_labels   = createTextureRGBA(gl, '/layers/ScoringLabels.webp');
    tex_indic    = createTextureRGBA(gl, '/layers/Indicators.webp');
    tex_misc     = createTextureRGBA(gl, '/layers/LampsEyesPlasticWhite.webp');
    tex_plastics = createTextureRGBA(gl, '/layers/Plastics.webp');
    tex_walls    = createTextureRGBA(gl, '/layers/Walls.webp');
    tex_rails    = createTextureRGBA(gl, '/layers/LaneRails.webp');
    tex_extra    = createTextureRGBA(gl, '/layers/ExtraBumperSlotsLogo.webp');
    tex_noise    = createTextureRGBA(gl, '/noise.png');

    // Begin
    initFramebuffers();
    update();

    // Destroy
    return () => { cancelAnimationFrame(rafref); };
  });
</script>


<div class="FluidBG" style="width:{width}px;height:{height}px;">
  <canvas bind:this={canvas} />
</div>


<style>
  .FluidBG {
    position: relative;
  }

  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
