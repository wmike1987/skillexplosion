var vsource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aWorldPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      gl_Position.x += aWorldPosition.x;
      gl_Position.y += aWorldPosition.y;
    }
`;

var fsource = `
    void main() {
      gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
    }
`;

function main() {
    const canvas = document.querySelector("#glCanvas");

    // Initialize the GL context
    const gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
        //create our shaders
        var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsource);
        var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsource);

        //create the shader program
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        // Collect all the info needed to use the shader program.
        // Look up which attribute our shader program is using
        // for aVertexPosition and look up uniform locations.
        const programInfo = {
          program: shaderProgram,
          attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            worldPosition: gl.getAttribLocation(shaderProgram, 'aWorldPosition'),
          },
          uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
          },
        };

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        const buffers = initBuffers(gl);

        // Draw the scene
        drawScene(gl, programInfo, buffers);
    };

var loadShader = function(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

var initBuffers = function(gl) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [-1.0, 1.0, 0.0, 0.0,
                     1.0, 1.0, 0.0, 0.0,
                     -1.0, -1.0, 0.0, 0.0,
                     1.0, -1.0, 0.0, 0.0,

                     -1.0, 1.0, 5.0, 5.0,
                      1.0, 1.0, 5.0, 5.0,
                      -1.0, -1.0, 5.0, 5.0,
                      1.0, -1.0, 5.0, 5.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return {position: positionBuffer};
};

var drawScene = function(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
                 fieldOfView,
                 aspect,
                 zNear,
                 zFar);
     const modelViewMatrix = mat4.create();
     mat4.translate(modelViewMatrix,     // destination matrix
                    modelViewMatrix,     // matrix to translate
                    [-0.0, 0.0, -12.0]);  // amount to translate

    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 16;         // how many bytes to get from one set of values to the next
                                  // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            0);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);

        gl.vertexAttribPointer(
            programInfo.attribLocations.worldPosition,
            numComponents,
            type,
            normalize,
            stride,
            8);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.worldPosition);
      }

        // Tell WebGL to use our program when drawing
        gl.useProgram(programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        {
          const offset = 0;
          const vertexCount = 8;
          gl.drawArrays(gl.LINES, offset, vertexCount);
        }
}

window.onload = main;
