// Set canvas to window size
let canvas = document.getElementById("myCanvas");
// const canvas = DOM.canvas(500, 500);
const windowHeight = window.innerHeight;

// Render width of the canvas
const gridWidth = 1000;
const aspectRatio = window.innerHeight / window.innerWidth;

const gridHeight = Math.round(gridWidth * aspectRatio);
canvas.setAttribute("width", gridWidth);
canvas.setAttribute("height", gridHeight);
const gl = canvas.getContext("webgl2", { premultipliedAlpha: false });
const scaledGridWidth = canvas.offsetWidth;
const scaledGridHeight = canvas.offsetHeight;
const inteval = 1;
const maxIteration = 1000;
const zoomFactor = 10;

// Graph ranges
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

const context = canvas.getContext("2d");

document.getElementById("myCanvas").addEventListener("contextmenu", zoomOut);
document.getElementById("myCanvas").addEventListener("wheel", scrollEvent);

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
  context: gl,
});
// gl.enable(gl.BLEND);
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
const createCanvas = gpu.createKernel(
  function (xArray, yArray, xMin, xMax, yMin, yMax, canvas) {
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
    // this.constants.context.fillStyle = "black";
    // this.constants.context.fillRect(i, gridHeight - j, 1, 1);
    // return iteration / this.constants.maxIteration;
    if (breakBounds) {
      const brightness = iteration / this.constants.maxIteration;
      // const brightness = convertRange2(
      //   iteration,
      //   0,
      //   0,
      //   this.constants.maxIteration,
      //   1
      // );
      // return [0, 0, 0, 1];
      this.color(0, 0, 1, brightness);
      // const brightness = scale(iteration);
      // console.log(brightness);
      // context.fillStyle = `rgb(0,0,255,${brightness})`;
      // context.fillStyle = "red";
      // context.fillRect(i, gridHeight - j, 1, 1);
    } else {
      // return [255, 255, 255, 1];
      this.color(0, 0, 0, 1);
      // context.fillStyle = "black";
      // context.fillRect(i, gridHeight - j, 1, 1);
    }
    // this.color(0, 0, 0, 1);
    // return oldX;
  },
  {
    output: [gridWidth, gridHeight],
    constants: {
      gridWidth: gridWidth,
      gridHeight: gridHeight,
      maxIteration: maxIteration,
    },
    functions: {
      convertRange2,
    },
    graphical: true,
  }
);
function drawGraph2() {
  // context.clearRect(0, 0, canvas.width, canvas.height);
  const colors = createCanvas(xArray, yArray, xMin, xMax, yMin, yMax, canvas);
  const canvas2 = createCanvas.canvas;
  canvas2.id = "myCanvas";
  canvas2.style = style = "width: 100%";
  canvas.parentNode.replaceChild(canvas2, canvas);
  canvas = document.getElementById("myCanvas");
  document.getElementsByTagName("body")[0].appendChild(canvas2);
  // Update event listeners
  document.getElementById("myCanvas").addEventListener("contextmenu", zoomOut);
  document.getElementById("myCanvas").addEventListener("wheel", scrollEvent);
  document.getElementById("myCanvas").addEventListener("mousemove", mousePan);
  document.getElementById("myCanvas").addEventListener("mouseup", mouseUp);
  document
    .getElementById("myCanvas")
    .addEventListener("mousedown", mouseDownEvent);
}

let mouseDownX;
let mouseDownY;
let mouseDown = false;
document
  .getElementById("myCanvas")
  .addEventListener("mousedown", mouseDownEvent);
document.getElementById("myCanvas").addEventListener("mouseup", mouseUp);
document.getElementById("myCanvas").addEventListener("mousemove", mousePan);

function mouseDownEvent(event) {
  event.preventDefault();
  if (event.button === 2) {
    return;
  }
  mouseDown = true;
  // Convert mouse coords from scaled canvas to actual canvas width
  mouseDownX = convertRange2(event.offsetX, 0, 0, scaledGridWidth, gridWidth);
  mouseDownY = convertRange2(event.offsetY, 0, 0, scaledGridHeight, gridHeight);
  // Convert actual canvas coords into mandelbrot space coords
  mouseDownX = convertRange2(mouseDownX, 0, xMin, gridWidth, xMax);
  mouseDownY = convertRange2(mouseDownY, 0, yMax, gridHeight, yMin);
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
    mouseUpX = convertRange2(event.offsetX, 0, 0, scaledGridWidth, gridWidth);
    mouseUpY = convertRange2(event.offsetY, 0, 0, scaledGridHeight, gridHeight);
    // Convert actual canvas coords into mandelbrot space coords
    mouseUpX = convertRange2(mouseUpX, 0, xMin, gridWidth, xMax);
    mouseUpY = convertRange2(mouseUpY, 0, yMax, gridHeight, yMin);
    const xDifference = mouseDownX - mouseUpX;
    const yDifference = mouseDownY - mouseUpY;
    xMin += xDifference;
    xMax += xDifference;
    yMin += yDifference;
    yMax += yDifference;
    drawGraph2();
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

drawGraph2();

function zoomIn(event) {
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  let xCentreScaled = convertRange2(xCentre, 0, 0, scaledGridWidth, gridWidth);
  let yCentreScaled = convertRange2(
    yCentre,
    0,
    0,
    scaledGridHeight,
    gridHeight
  );
  // In mandelbrot space, coords of the mouse pre zoom
  const oldXCentreScaled = convertRange2(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const oldYCentreScaled = convertRange2(
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
  const newXCentreScaled = convertRange2(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const newYCentreScaled = convertRange2(
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
  drawGraph2();
}

function zoomOut(event) {
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  const xCentreScaled = convertRange2(
    xCentre,
    0,
    0,
    scaledGridWidth,
    gridWidth
  );
  const yCentreScaled = convertRange2(
    yCentre,
    0,
    0,
    scaledGridHeight,
    gridHeight
  );
  // In mandelbrot space, coords of the mouse pre zoom
  const oldXCentreScaled = convertRange2(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const oldYCentreScaled = convertRange2(
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

  // // Coords of the mouse post zoom
  const newXCentreScaled = convertRange2(
    xCentreScaled,
    0,
    xMin,
    gridWidth,
    xMax
  );
  const newYCentreScaled = convertRange2(
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
  drawGraph2();
}

// x0 := scaled x coordinate of pixel (scaled to lie in the Mandelbrot X scale (-2.00, 0.47))
// y0 := scaled y coordinate of pixel (scaled to lie in the Mandelbrot Y scale (-1.12, 1.12))

// NewValue = (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin
function convertRange(value) {
  const newValue = [];
  newValue.push(((value[0] - 0) * (xMax - xMin)) / (gridWidth - 0) + xMin);
  newValue.push(((value[1] - 0) * (yMax - yMin)) / (gridHeight - 0) + yMin);
  return newValue;
}

function convertRange2(value, oldMin, newMin, oldMax, newMax) {
  return ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}

// console.log(canvas2);
// console.log(multiplyMatrix());

function drawGraph() {
  return;
  // return;
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < gridWidth; i += inteval) {
    for (let j = 0; j < gridHeight; j += inteval) {
      const c = convertRange([i, j]);
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
        const tempX = x ** 2 - y ** 2 + c[0];
        y = 2 * x * y + c[1];
        x = tempX;
        iteration++;
      }
      if (breakBounds) {
        // console.log(iteration);
        // const rgb = scale(iteration);
        // context.fillStyle = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
        const brightness = scale(iteration);
        // console.log(brightness);
        context.fillStyle = `rgb(0,0,255,${brightness})`;
        // context.fillStyle = "red";
        context.fillRect(i, gridHeight - j, 1, 1);
      } else {
        context.fillStyle = "black";
        context.fillRect(i, gridHeight - j, 1, 1);
      }
    }
  }
}

function scale(x) {
  // // https://stackoverflow.com/questions/39059921/how-can-i-convert-a-number-scale-into-color-lightness-using-javascript
  // return [
  //   Math.round(0xff * (1 - x / maxIteration)),
  //   0,
  //   Math.round(0xff * (x / maxIteration)),
  // ];
  // scale x from 0 - maxIteration into 0 - 1
  return convertRange2(x, 0, 0, maxIteration, 1);
}
