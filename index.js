// Set canvas to window size
let canvas = document.getElementById("myCanvas");
const windowHeight = window.innerHeight;

// Render width of the canvas
const gridWidth = 500;
const aspectRatio = window.innerHeight / window.innerWidth;

let mouseDownX;
let mouseDownY;
let mouseDown = false;

const gridHeight = Math.round(gridWidth * aspectRatio);
canvas.setAttribute("width", gridWidth);
canvas.setAttribute("height", gridHeight);
// const gl = canvas.getContext("webgl2", { premultipliedAlpha: false });
const ctx = canvas.getContext("2d");
const scaledGridWidth = canvas.offsetWidth;
const scaledGridHeight = canvas.offsetHeight;
const inteval = 1;
const maxIteration = 1000;
const zoomFactor = 10;

// Initial graph ranges
let xMin = -2;
let xMax = 0.47;
let yMin = -1.12;
let yMax = 1.12;

if (gridWidth > gridHeight) {
  // Window is landscape, need to pad left and right
  // Ammount that x is greater than y on each side
  const difference = (scaledGridWidth - scaledGridHeight) / 2;
  const xDifference = xMax - xMin;
  // Amount to pad mandelbrot coords by
  const padding = (difference / scaledGridHeight) * xDifference;
  xMin -= padding;
  xMax += padding;
} else if (gridWidth < gridHeight) {
  // Window is portrait, need to pad top and bottom
  const difference = (scaledGridHeight - scaledGridWidth) / 2;
  const yDifference = yMax - yMin;
  // Amount to pad mandelbrot coords by
  const padding = (difference / scaledGridWidth) * yDifference;
  yMin -= padding;
  yMax += padding;
}

const xArray = [];
const yArray = [];
for (let i = 0; i < gridWidth; i++) {
  xArray.push(i);
}
for (let i = 0; i < gridHeight; i++) {
  yArray.push(i);
}

const gpu = new window.GPU.GPU({
  canvas,
  // context: gl,
});
const createCanvas = gpu.createKernel(
  function (xArray, yArray, xMin, xMax, yMin, yMax) {
    const oldX =
      (xArray[this.thread.x] * (xMax - xMin)) / (this.constants.gridWidth - 1) +
      xMin;
    const oldY =
      (yArray[this.thread.y] * (yMax - yMin)) /
        (this.constants.gridHeight - 1) +
      yMin;
    let x = 0;
    let y = 0;
    let iteration = 0;
    let breakBounds = false;
    while (iteration < this.constants.maxIteration) {
      if (x * x + y * y > 2 * 2) {
        breakBounds = true;
        break;
      }
      // zn = zn-1 + c
      // (a + b) (c + d) = (ac - bd) + (ad + bc)
      const tempX = x ** 2 - y ** 2 + oldX;
      y = 2 * x * y + oldY;
      x = tempX;
      iteration++;
    }
    if (breakBounds) {
      const brightness = Math.sqrt(iteration / this.constants.maxIteration);
      this.color(0, 0, 1, brightness);
    } else {
      this.color(0, 0, 0, 1);
    }
  },
  {
    output: [gridWidth, gridHeight],
    constants: {
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      maxIteration: maxIteration,
    },
    graphical: true,
  }
);
function CPUCreateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      const oldX = (i * (xMax - xMin)) / (gridWidth - 1) + xMin;
      const oldY = (j * (yMax - yMin)) / (gridHeight - 1) + yMin;
      let x = 0;
      let y = 0;
      let iteration = 0;
      let breakBounds = false;
      while (iteration < maxIteration) {
        if (x * x + y * y > 2 * 2) {
          breakBounds = true;
          break;
        }
        // zn = zn-1 + c
        // (a + b) (c + d) = (ac - bd) + (ad + bc)
        const tempX = x ** 2 - y ** 2 + oldX;
        y = 2 * x * y + oldY;
        x = tempX;
        iteration++;
      }
      if (breakBounds) {
        const brightness = Math.sqrt(iteration / maxIteration);
        ctx.fillStyle = `rgba(0,0,255,brightness)`;
        ctx.fillRect(i, gridHeight - j, 1, 1);
        // this.color(0, 0, 1, brightness);
      } else {
        // ctx.fillRect(0, 0, 100, 100);
        // this.color(0, 0, 0, 1);
      }
    }
  }
}
function drawGraph() {
  CPUCreateCanvas();
  // createCanvas(xArray, yArray, xMin, xMax, yMin, yMax);
  // canvas = document.getElementById("myCanvas");
  // const newCanvas = createCanvas.canvas;
  // newCanvas.id = "myCanvas";
  // newCanvas.style = "width: 100%";
  // canvas.parentNode.replaceChild(newCanvas, canvas);
  const newCanvas = canvas;
  // Update event listeners
  newCanvas.addEventListener("wheel", scrollEvent);
  newCanvas.addEventListener("mousemove", mousePan);
  newCanvas.addEventListener("mouseup", mouseUp);
  newCanvas.addEventListener("mousedown", mouseDownEvent);
}
drawGraph();

function mouseDownEvent(event) {
  event.preventDefault();
  if (event.button === 2) {
    return;
  }
  mouseDown = true;
  // Convert mouse coords from scaled canvas to actual canvas width
  mouseDownX = convertRange(event.offsetX, 0, 0, scaledGridWidth, gridWidth);
  mouseDownY = convertRange(event.offsetY, 0, 0, scaledGridHeight, gridHeight);
  // Convert actual canvas coords into mandelbrot space coords
  mouseDownX = convertRange(mouseDownX, 0, xMin, gridWidth, xMax);
  mouseDownY = convertRange(mouseDownY, 0, yMax, gridHeight, yMin);
}

function mouseUp(event) {
  if (event.button === 2) {
    return;
  }
  event.preventDefault();
  mouseDown = false;
}

function mousePan(event) {
  if (mouseDown) {
    // Convert mouse coords from scaled canvas to actual canvas width
    let mouseUpX = convertRange(
      event.offsetX,
      0,
      0,
      scaledGridWidth,
      gridWidth
    );
    let mouseUpY = convertRange(
      event.offsetY,
      0,
      0,
      scaledGridHeight,
      gridHeight
    );
    // Convert actual canvas coords into mandelbrot space coords
    mouseUpX = convertRange(mouseUpX, 0, xMin, gridWidth, xMax);
    mouseUpY = convertRange(mouseUpY, 0, yMax, gridHeight, yMin);
    const xDifference = mouseDownX - mouseUpX;
    const yDifference = mouseDownY - mouseUpY;
    xMin += xDifference;
    xMax += xDifference;
    yMin += yDifference;
    yMax += yDifference;
    drawGraph();
  }
}

function scrollEvent(event) {
  event.preventDefault();
  if (event.deltaY < 0) {
    zoomIn(event);
  } else {
    zoomOut(event);
  }
}

function zoomIn(event) {
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  let xCentreScaled = convertRange(xCentre, 0, 0, scaledGridWidth, gridWidth);
  let yCentreScaled = convertRange(yCentre, 0, 0, scaledGridHeight, gridHeight);
  // In mandelbrot space, coords of the mouse pre zoom
  const oldXCentreScaled = convertRange(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const oldYCentreScaled = convertRange(
    yCentreScaled,
    0,
    yMax,
    gridHeight,
    yMin
  );

  const xRangeDistance = Math.abs(xMax - xMin) / 2;
  const yRangeDistance = Math.abs(yMax - yMin) / 2;

  xMin = xMin + xRangeDistance / zoomFactor;
  xMax = xMax - xRangeDistance / zoomFactor;
  yMin = yMin + yRangeDistance / zoomFactor;
  yMax = yMax - yRangeDistance / zoomFactor;

  // Coords of the mouse post zoom
  const newXCentreScaled = convertRange(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const newYCentreScaled = convertRange(
    yCentreScaled,
    0,
    yMax,
    gridHeight,
    yMin
  );

  const xDifference = newXCentreScaled - oldXCentreScaled;
  const yDifference = newYCentreScaled - oldYCentreScaled;
  xMin -= xDifference;
  xMax -= xDifference;
  yMin -= yDifference;
  yMax -= yDifference;
  drawGraph();
}

function zoomOut(event) {
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  const xCentreScaled = convertRange(xCentre, 0, 0, scaledGridWidth, gridWidth);
  const yCentreScaled = convertRange(
    yCentre,
    0,
    0,
    scaledGridHeight,
    gridHeight
  );
  // In mandelbrot space, coords of the mouse pre zoom
  const oldXCentreScaled = convertRange(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const oldYCentreScaled = convertRange(
    yCentreScaled,
    0,
    yMax,
    gridHeight,
    yMin
  );

  const xRangeDistance = Math.abs(xMax - xMin) / 2;
  const yRangeDistance = Math.abs(yMax - yMin) / 2;

  xMin = xMin - xRangeDistance / zoomFactor;
  xMax = xMax + xRangeDistance / zoomFactor;
  yMin = yMin - yRangeDistance / zoomFactor;
  yMax = yMax + yRangeDistance / zoomFactor;

  // Coords of the mouse post zoom
  const newXCentreScaled = convertRange(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const newYCentreScaled = convertRange(
    yCentreScaled,
    0,
    yMax,
    gridHeight,
    yMin
  );

  const xDifference = newXCentreScaled - oldXCentreScaled;
  const yDifference = newYCentreScaled - oldYCentreScaled;
  xMin -= xDifference;
  xMax -= xDifference;
  yMin -= yDifference;
  yMax -= yDifference;
  drawGraph();
}

// x0 := scaled x coordinate of pixel (scaled to lie in the Mandelbrot X scale (-2.00, 0.47))
// y0 := scaled y coordinate of pixel (scaled to lie in the Mandelbrot Y scale (-1.12, 1.12))

// NewValue = (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
function convertRange(value, oldMin, newMin, oldMax, newMax) {
  return ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}
