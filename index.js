// BigFloat32 = require("bigfloat").BigFloat32;

const gridSize = document.getElementById("myCanvas").getAttribute("width");
const scaledGridSize = document.getElementById("myCanvas").offsetWidth;
const inteval = 1;
const maxIteration = 100;
const zoomFactor = 10;

// Graph ranges
let xMin = -2;
let xMax = 0.47;
let yMin = -1.12;
let yMax = 1.12;

const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");

document.getElementById("myCanvas").addEventListener("contextmenu", zoomOut);
document.getElementById("myCanvas").addEventListener("wheel", scrollEvent);

let mouseDownX;
let mouseDownY;
let mouseDown = false;
document.getElementById("myCanvas").addEventListener("mousedown", (event) => {
  event.preventDefault();
  if (event.button === 2) {
    return;
  }
  mouseDown = true;
  // Convert mouse coords from scaled canvas to actual canvas width
  mouseDownX = convertRange2(event.offsetX, 0, 0, scaledGridSize, gridSize);
  mouseDownY = convertRange2(event.offsetY, 0, 0, scaledGridSize, gridSize);
  // Convert actual canvas coords into mandelbrot space coords
  mouseDownX = convertRange2(mouseDownX, 0, xMin, gridSize, xMax);
  mouseDownY = convertRange2(mouseDownY, 0, yMax, gridSize, yMin);
});
document.getElementById("myCanvas").addEventListener("mouseup", (event) => {
  console.log(event);
  if (event.button === 2) {
    return;
  }
  event.preventDefault();
  mouseDown = false;
});
document.getElementById("myCanvas").addEventListener("mousemove", (event) => {
  if (mouseDown) {
    // Convert mouse coords from scaled canvas to actual canvas width
    mouseUpX = convertRange2(event.offsetX, 0, 0, scaledGridSize, gridSize);
    mouseUpY = convertRange2(event.offsetY, 0, 0, scaledGridSize, gridSize);
    // Convert actual canvas coords into mandelbrot space coords
    mouseUpX = convertRange2(mouseUpX, 0, xMin, gridSize, xMax);
    mouseUpY = convertRange2(mouseUpY, 0, yMax, gridSize, yMin);
    const xDifference = mouseDownX - mouseUpX;
    const yDifference = mouseDownY - mouseUpY;
    xMin += xDifference;
    xMax += xDifference;
    yMin += yDifference;
    yMax += yDifference;
    drawGraph();
  }
});

function scrollEvent(event) {
  event.preventDefault();
  if (event.deltaY < 0) {
    zoomIn(event);
  } else {
    zoomOut(event);
  }
}

drawGraph();

function zoomIn(event) {
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  let oldXCentreScaled = convertRange2(xCentre, 0, 0, scaledGridSize, gridSize);
  let oldYCentreScaled = convertRange2(yCentre, 0, 0, scaledGridSize, gridSize);
  // In mandelbrot space, coords of the mouse pre zoom
  oldXCentreScaled = convertRange2(oldXCentreScaled, 0, xMin, gridSize, xMax);
  oldYCentreScaled = convertRange2(oldYCentreScaled, 0, yMax, gridSize, yMin);

  const xRangeDistance = Math.abs(xMax - xMin) / 2;
  const yRangeDistance = Math.abs(yMax - yMin) / 2;

  xMin = xMin + xRangeDistance / zoomFactor;
  xMax = xMax - xRangeDistance / zoomFactor;
  yMin = yMin + yRangeDistance / zoomFactor;
  yMax = yMax - yRangeDistance / zoomFactor;

  // Coords of the mouse post zoom
  const newXCentreScaled = convertRange2(xCentre, 0, xMin, gridSize, xMax);
  const newYCentreScaled = convertRange2(yCentre, 0, yMax, gridSize, yMin);

  const xDifference = newXCentreScaled - oldXCentreScaled;
  const yDifference = newYCentreScaled - oldYCentreScaled;
  xMin -= xDifference;
  xMax -= xDifference;
  yMin -= yDifference;
  yMax -= yDifference;
  drawGraph();
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function zoomOut(event) {
  // drawGraph();
  event.preventDefault();
  const xCentre = event.offsetX;
  const yCentre = event.offsetY;
  // Convert mouse coords from scaled canvas to actual canvas width
  const xCentreScaled = convertRange2(xCentre, 0, 0, scaledGridSize, gridSize);
  const yCentreScaled = convertRange2(yCentre, 0, 0, scaledGridSize, gridSize);
  // In mandelbrot space, coords of the mouse pre zoom
  const oldXCentreScaled = convertRange2(
    xCentreScaled,
    0,
    xMin,
    gridSize,
    xMax
  );
  const oldYCentreScaled = convertRange2(
    yCentreScaled,
    0,
    yMax,
    gridSize,
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
    gridSize,
    xMax
  );
  const newYCentreScaled = convertRange2(
    yCentreScaled,
    0,
    yMax,
    gridSize,
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
function convertRange(value) {
  const newValue = [];
  newValue.push(((value[0] - 0) * (xMax - xMin)) / (gridSize - 0) + xMin);
  newValue.push(((value[1] - 0) * (yMax - yMin)) / (gridSize - 0) + yMin);
  return newValue;
}

function convertRange2(value, oldMin, newMin, oldMax, newMax) {
  return ((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}

function drawGraph() {
  for (let i = 0; i < gridSize; i += inteval) {
    for (let j = 0; j < gridSize; j += inteval) {
      const c = convertRange([i, j]);
      let x = 0;
      let y = 0;
      let iteration = 0;
      let breakBounds = false;
      while (iteration < maxIteration) {
        if (Math.sqrt(x ** 2 - y ** 2) > 4) {
          breakBounds = true;
          break;
        }
        // zn = zn-1 + c
        // (a + b) (c + d) = (ac - bd) + (ad + bc)
        const tempX = x ** 2 - y ** 2 + c[0];
        y = 2 * (x * y) + c[1];
        x = tempX;
        iteration++;
      }
      if (breakBounds) {
        const rgb = scale(iteration);
        context.fillStyle = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
        context.fillRect(i, gridSize - j, 1, 1);
      } else {
        context.fillStyle = "black";
        context.fillRect(i, gridSize - j, 1, 1);
      }
    }
  }
}

function scale(x) {
  // https://stackoverflow.com/questions/39059921/how-can-i-convert-a-number-scale-into-color-lightness-using-javascript
  return [
    Math.round(0xff * (1 - x / maxIteration)),
    0,
    Math.round(0xff * (x / maxIteration)),
  ];
}
