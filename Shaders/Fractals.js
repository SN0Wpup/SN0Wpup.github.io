const t = [1.0,1.0];
const mv = [0.0,0.0];
canvas.addEventListener('contextmenu', (evt)=> {
  t[0]*=1.2;
  t[1]*=1.2;
  evt.preventDefault();
});
addEventListener('click',(event)=>{
    t[0]= t[0]/1.2;
    t[1]= t[1]/1.2;
})
/*addEventListener('mousemove', (event)=>{
  mv[0] = -(event.clientX-(window.innerWidth*0.5))/window.innerWidth;
  mv[1] = (event.clientY-(window.innerHeight*0.5))/window.innerHeight;
  mv[0] *= t[0];
  mv[1] *= t[1];
})*/
addEventListener('keydown', function(event) {
  const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
  if(key == "ArrowRight")
    mv[0] += -0.4*t[0];
  else if(key == "ArrowLeft")
    mv[0] += 0.4*t[0];
  if(key == "ArrowUp")
    mv[1] += -0.4*t[1];
  else if(key == "ArrowDown")
    mv[1] += 0.4*t[1];
  console.log();
});
main();
//
// start here
//
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");
  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    uniform vec2 zoom;
    uniform vec2 move;
    varying mediump vec2 textCoord;
    
    void main() {
      gl_Position = aVertexPosition;
      textCoord = -aVertexPosition.xy * zoom + move;
    }
`;

  const fsSource = `
    precision mediump float;
    varying mediump vec2 textCoord;
    void main() {
      lowp vec2 coord = textCoord.xy;
      float x = textCoord.x;
      float y = textCoord.y;
      float zx = coord.x;
      float zy = coord.y;
      float iteration = 0.0;
      const float maxIteration = 1024.0;
      for (int i = 0; i<int(maxIteration);i++){
          float xtemp = zx*zx - zy*zy + x;
          zy = abs(2.0*zx*zy) + y;
          zx = xtemp;
          iteration += 1.0;   
          if (zx*zx + zy*zy < 16.0)
          gl_FragColor = vec4(0.2*iteration,0.1*iteration,0.8*iteration,1.0);
          if(iteration > maxIteration ||zx*zx + zy*zy > 16.0 )
            break;
      }
      if (iteration == maxIteration)
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      Zoom: gl.getUniformLocation(
        shaderProgram,
        "zoom"
      ),
      Move: gl.getUniformLocation(shaderProgram,"move"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Draw the scene
  //while(true){
    drawScene(gl, programInfo, buffers);
    //10fps
    setInterval(() => {
      
      drawScene(gl, programInfo, buffers);
      
    }, 100);
  
  //}
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
function drawScene(gl, programInfo, buffers) {
  const canvas = document.querySelector("#glcanvas");
  canvas.height = window.innerHeight-40;
  canvas.width = window.innerWidth;
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  //gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const aspect = window.innerWidth / window.innerHeight;

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  setPositionAttribute(gl, buffers, programInfo);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  // Set the shader uniforms
  gl.uniform2fv(
    programInfo.uniformLocations.Zoom,
    t
  );
  gl.uniform2fv(
    programInfo.uniformLocations.Move,
    mv
  )
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 2 // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}
function initBuffers(gl) {
  const positionBuffer = initPositionBuffer(gl);

  return {
    position: positionBuffer,
  };
}

function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

