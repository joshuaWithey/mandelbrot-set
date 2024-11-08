onmessage = function (message) {
  //   console.log(message);
  postMessage("done");
  // for (let i = 0; i < gridWidth; i++) {
  //   for (let j = 0; j < gridHeight; j++) {
  //     const oldX = (i * (xMax - xMin)) / (gridWidth - 1) + xMin;
  //     const oldY = (j * (yMax - yMin)) / (gridHeight - 1) + yMin;
  //     let x = 0;
  //     let y = 0;
  //     let iteration = 0;
  //     let breakBounds = false;
  //     while (iteration < maxIteration) {
  //       if (x * x + y * y > 2 * 2) {
  //         breakBounds = true;
  //         break;
  //       }
  //       // zn = zn-1 + c
  //       // (a + b) (c + d) = (ac - bd) + (ad + bc)
  //       const tempX = x ** 2 - y ** 2 + oldX;
  //       y = 2 * x * y + oldY;
  //       x = tempX;
  //       iteration++;
  //     }
  //     if (breakBounds) {
  //       const brightness = Math.sqrt(iteration / maxIteration);
  //       ctx.fillStyle = `rgba(0,0,255,brightness)`;
  //       ctx.fillRect(i, gridHeight - j, 1, 1);
  //       // this.color(0, 0, 1, brightness);
  //     } else {
  //       // ctx.fillRect(0, 0, 100, 100);
  //       // this.color(0, 0, 0, 1);
  //     }
  //   }
  // }
};
