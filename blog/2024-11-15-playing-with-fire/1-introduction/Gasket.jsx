// Hint: try increasing the iteration count
const iterations = 10000;

// Hint: negating `x` and `y` creates some interesting images
const functions = [
    (x, y) => [x / 2, y / 2],
    (x, y) => [(x + 1) / 2, y / 2],
    (x, y) => [x / 2, (y + 1) / 2]
]

function chaosGame(image) {
    var plotter = new Plotter(image.width, image.height);
    var [x, y] = [randomBiUnit(), randomBiUnit()];

    for (var count = 0; count < iterations; count++) {
        const i = randomInteger(0, functions.length);
        [x, y] = functions[i](x, y);

        if (count > 20) {
            plotter.plot(x, y);
        }
    }

    plotter.paint(image);
}

render(<Canvas renderFn={chaosGame}/>)
