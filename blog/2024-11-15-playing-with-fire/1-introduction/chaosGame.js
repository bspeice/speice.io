// Hint: try changing the iteration count
const iterations = 100000;

// Hint: negating `x` and `y` creates some cool images
const xforms = [
  (x, y) => [x / 2, y / 2],
  (x, y) => [(x + 1) / 2, y / 2],
  (x, y) => [x / 2, (y + 1) / 2]
]

function* chaosGame({width, height}) {
  const step = 1000;
  let img = new ImageData(width, height);
  let [x, y] = [
    randomBiUnit(),
    randomBiUnit()
  ];

  for (let c = 0; c < iterations; c++) {
    const i = randomInteger(0, xforms.length);
    [x, y] = xforms[i](x, y);

    if (c > 20)
      plot(x, y, img);

    if (c % step === 0)
      yield img;
  }

  yield img;
}

// Wiring so the code above displays properly
render(<Gasket f={chaosGame}/>)
