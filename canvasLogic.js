// Canvas and WebGL setup
const canvas = document.getElementById('canvas');
const gl = canvas?.getContext('webgl');

if (!gl) {
  alert('WebGL not supported by your browser. Please try another browser.');
  throw new Error('WebGL not supported');
}

// DOM elements
const lineWidthInput = document.getElementById('lineWidth');
const addSegmentButton = document.getElementById('addSegment');
const addCoordinateButton = document.getElementById('addCoordinate');
const coordinateInput = document.getElementById('coordinateInput');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const resizeCanvasButton = document.getElementById('resizeCanvas');

// Ensure all required DOM elements are present
if (!canvas || !lineWidthInput || !addSegmentButton || !addCoordinateButton || !coordinateInput || !canvasWidthInput || !canvasHeightInput || !resizeCanvasButton) {
  alert('One or more required DOM elements are missing. Please check your HTML.');
  throw new Error('One or more required DOM elements are missing. Please check your HTML.');
}

let points = [
  [0, 0], [50, 50]
];
let lineWidth = parseFloat(lineWidthInput.value);

// Shaders
const vsSource = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fsSource = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black color
  }
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Event Listeners
lineWidthInput.addEventListener('input', (e) => {
  lineWidth = parseFloat(e.target.value);
  drawScene();
});

addSegmentButton.addEventListener('click', () => {
  const newPoint = [
    Math.random() * canvas.width,
    Math.random() * canvas.height,
  ];
  points.push(newPoint);
  drawSceneWithAnimation();
});

addCoordinateButton.addEventListener('click', () => {
  const input = coordinateInput.value.split(',');
  if (input.length === 2) {
    const x = parseFloat(input[0].trim());
    const y = parseFloat(input[1].trim());
    if (!isNaN(x) && !isNaN(y) && x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
      points.push([x, y]);
      drawSceneWithAnimation();
    } else {
      alert('Please enter valid coordinates within the canvas bounds.');
    }
  } else {
    alert('Please enter coordinates in the format: x,y');
  }
});

resizeCanvasButton.addEventListener('click', () => {
  const newWidth = parseInt(canvasWidthInput.value);
  const newHeight = parseInt(canvasHeightInput.value);

  if (newWidth >= 400 && newHeight >= 400) {
    canvas.width = newWidth;
    canvas.height = newHeight;
    drawScene();
  } else {
    alert('Canvas width and height must be at least 400 pixels.');
  }
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  points.push([x, y]);
  drawSceneWithAnimation();
});

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Look up where the vertex data needs to go.
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');

  // Create a buffer to put positions in
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Convert points to Float32Array
  const positions = points.flat();
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Set the resolution
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  // Set up how to pull the data from the buffer
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Set the line width
  gl.lineWidth(lineWidth);

  // Draw the line segments
  gl.drawArrays(gl.LINE_STRIP, 0, points.length);
}

function drawSceneWithAnimation() {
  let i = 0;
  function animate() {
    if (i <= points.length) {
      drawScene();
      i++;
      requestAnimationFrame(animate);
    }
  }
  animate();
}


drawScene();

// CSS changes for responsive flex-direction
window.addEventListener('resize', () => {
  const controls = document.getElementById('controls');
  if (window.innerWidth < 1300) {
    controls.style.flexDirection = 'column';
  } else {
    controls.style.flexDirection = 'row';
  }
});

// Initial check for flex-direction based on window size
const controls = document.getElementById('controls');
if (window.innerWidth < 1300) {
  controls.style.flexDirection = 'column';
} else {
  controls.style.flexDirection = 'row';
}
