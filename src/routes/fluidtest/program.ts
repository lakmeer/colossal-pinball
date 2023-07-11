
export default class Program {

  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;

  constructor (gl, vertexShader, fragmentShader) {
    this.gl = gl;
    this.program = this.createProgram(vertexShader, fragmentShader);
    this.uniforms = this.getUniforms(this.program);
  }

  createProgram (vertexShader, fragmentShader) {
    let program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) console.trace(this.gl.getProgramInfoLog(program));
    return program;
  }

  getUniforms (program) {
    let uniforms = {}
    let uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
      let uniformName = this.gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  bind () {
    this.gl.useProgram(this.program);
  }

}
