// Hint: try changing the iteration count
const iterations = 100000;

// Hint: negating `x` and `y` creates some cool images
const xforms = [
  (x, y) => [x / 2, y / 2],
  (x, y) => [(x + 1) / 2, y / 2],
  (x, y) => [x / 2, (y + 1) / 2]
];

function* chaosGame({ width, height }) {
  let img =
    new ImageData(width, height);
  let [x, y] = [
    randomBiUnit(),
    randomBiUnit()
  ];

  for (let i = 0; i < iterations; i++) {
    const index =
      randomInteger(0, xforms.length);
    [x, y] = xforms[index](x, y);

    if (i > 20)
      plot(x, y, img);

    if (i % 1000 === 0)
      yield img;
  }

  yield img;
}

render(<Gasket f={chaosGame} />);
