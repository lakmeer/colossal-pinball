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

  import { onMount } from 'svelte';

  import {
    getResolution,
    createTextureAsync,
    scaleByPixelRatio,
    getWebGLContext,
    isMobile,
  } from "$lib/fluid/functions";

  import * as SHADER_SRC from "$lib/fluid/shaders";

  import Program from "$lib/fluid/program";
  import Pointer from "$lib/fluid/pointer";


  // State

  let canvas;
  let rafref = 0;

  export let bgSource = "/now.png";
  export let width = 512;
  export let height = 512;
  export let pointerX = 0;
  export let pointerY = 0;

  let syntheticPointer = new Pointer();


  // Simulation section

  onMount(async () => {

    let lastUpdateTime = Date.now();

    let config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      DENSITY_DISSIPATION: 2.0,   // small values make smoke linger
      VELOCITY_DISSIPATION: 1.1,
      PRESSURE: 0.8,              // pressure > 1 explodes simulation
      PRESSURE_ITERATIONS: 20,    // sim steps, default 20
      CURL: 20,                   // default 30. > ~150 explodes simulation. might be fun to vary
      SPLAT_RADIUS: 0.1, // bigger radius is brighter but drags more pixels
      SPLAT_FORCE: 630,  // drags pixels further before fading but creates wavefronts
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
    }

    function createFBO (w, h, internalFormat, format, type, param) {
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

    function createDoubleFBO (w, h, internalFormat, format, type, param) {
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

    function update () {

      // TODO: provide render loop externally

      const dt = calcDeltaTime();
      if (resizeCanvas()) initFramebuffers();

      if (canvas) {
        syntheticPointer.onMove(canvas,
          canvas.width/2  + canvas.width/4 * Math.sin(Date.now()/500),
          canvas.height/2 + canvas.width/4 * Math.cos(Date.now()/500));
      }

      if (syntheticPointer.moved) {
        syntheticPointer.moved = false;
        splatPointer(syntheticPointer);
      }

      step(dt);

      // Render
      displayMaterial.bind();
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      gl.uniform1i(displayMaterial.uniforms.bgTexture, bgTexture.attach(6));
      blit(null);

      // Loop
      rafref = requestAnimationFrame(update);
    }

    function calcDeltaTime () {
      let now = Date.now();
      let dt = (now - lastUpdateTime) / 1000;
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
      gl.uniform1i(splatTexProgram.uniforms.uTexture, bgTexture.attach(1));
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
    // Event Listeners
    //

    canvas.addEventListener('mousedown', e => {
    console.log('x');
      syntheticPointer.onDown(canvas, e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', e => {
    console.log('y');
      syntheticPointer.onMove(canvas, e.offsetX, e.offsetY);
    });

    window.addEventListener('mouseup', () => {
      syntheticPointer.onUp();
    });

    /*
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const touches = e.targetTouches;
      while (touches.length >= pointers.length)
      pointers.push(new Pointer());
      for (let i = 0; i < touches.length; i++) {
        let posX = scaleByPixelRatio(touches[i].pageX);
        let posY = scaleByPixelRatio(touches[i].pageY);
        updatePointerDownData(canvas, pointers[i + 1], touches[i].identifier, posX, posY);
      }
    });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i + 1];
        if (!pointer.down) continue;
        let posX = scaleByPixelRatio(touches[i].pageX);
        let posY = scaleByPixelRatio(touches[i].pageY);
        updatePointerMoveData(canvas, pointer, posX, posY);
      }
    }, false);

    window.addEventListener('touchend', e => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        let pointer = pointers.find(p => p.id == touches[i].identifier);
        if (pointer == null) continue;
        updatePointerUpData(canvas, pointer);
      }
    });
    */


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
    let dye;
    let velocity;
    let divergence;
    let curl;
    let pressure;

    // Load textures
    let bgTexture = createTextureAsync(gl, bgSource);

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

    // Main display material
    const displayShader = compileShader(gl.FRAGMENT_SHADER, SHADER_SRC.display);
    const displayMaterial = new Program(gl, baseVertexShader, displayShader);

    // Default points
    let pointers = [ new Pointer() ];

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
