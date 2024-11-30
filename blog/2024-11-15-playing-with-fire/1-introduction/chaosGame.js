// Hint: try increasing the iteration count
const iterations = 10000;

// Hint: negating `x` and `y` creates some interesting images
const transforms = [
    (x, y) => [x / 2, y / 2],
    (x, y) => [(x + 1) / 2, y / 2],
    (x, y) => [x / 2, (y + 1) / 2]
]

function* chaosGame() {
    let image = new ImageData(500, 500);
    let [x, y] = [randomBiUnit(), randomBiUnit()];

    for (var count = 0; count < iterations; count++) {
        const i = randomInteger(0, transforms.length);
        [x, y] = transforms[i](x, y);

        if (count > 20)
            plot(x, y, image);

        if (count % 1000 === 0)
            yield image;
    }

    yield image;
}

// Wiring so the code above displays properly
render(<Gasket f={chaosGame()}/>)
