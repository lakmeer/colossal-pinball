
//
// Half-assed Types
//

export type Texture = {
  texture:WebGLTexture,
  width: number,
  height: number,
  attach (id:number):number
}

export type FBO = {
  texture:WebGLTexture
  fbo:WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach (id:number): number
}

export type DoubleFBO = {
  width:number
  height:number
  texelSizeX:number
  texelSizeY:number
  get read (): FBO
  set read (WebGLFramebuffer)
  get write (): FBO
  set write (WebGLFramebuffer)
  swap (): void
}

