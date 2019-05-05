export class Shader {
  /**
   * @param {String} type e.g hand
   */
  constructor(type) {
    var vertexShaderText = document.getElementById(type + '-vertex-shader').innerHTML;

    var fragmentShaderText = document.getElementById(type + '-fragment-shader').innerHTML;

    this.VBO = gl.createBuffer();
    this.IBO = gl.createBuffer();
    //
    // Create shaders
    //
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
      return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
      return;
    }

    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ERROR linking program!', gl.getProgramInfoLog(program));
      return;
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      console.error('ERROR validating program!', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    this.program = program;

    this.attributes = {};
    this.uniforms = {};
  }

  bind() {
    gl.useProgram(this.program);
  }

  addUniform(location) {
    this.uniforms[location] = gl.getUniformLocation(this.program, location);
  }

  setVec2(location, value) {
    this.bind();
    if(!(location in this.uniforms)) {
      this.addUniform(location);
    }
    gl.uniform2fv(this.uniforms[location], value);
  }

  setVec3(location, value) {
    this.bind();
    if(!(location in this.uniforms)) {
      this.addUniform(location);
    }
    gl.uniform3fv(this.uniforms[location], value);
  }

  setMat4(location, value) {
    this.bind();
    if(!(location in this.uniforms)) {
      this.addUniform(location);
    }
    gl.uniformMatrix4fv(this.uniforms[location], gl.FALSE, value);
  }

  setFloat(location, value) {
    this.bind();
    if(!(location in this.uniforms)) {
      this.addUniform(location);
    }
    gl.uniform1f(this.uniforms[location], value);
  }

  setInt(location, value) {
    this.bind();
    if(!(location in this.uniforms)) {
      this.addUniform(location);
    }
    gl.uniform1i(this.uniforms[location], value);
  }
}
