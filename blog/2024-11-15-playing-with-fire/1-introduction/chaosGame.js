function Gasket() {
    // Hint: try increasing the iteration count
    const iterations = 10000;

    // Hint: negating `x` and `y` creates some interesting images
    const transforms = [
        (x, y) => [x / 2, y / 2],
        (x, y) => [(x + 1) / 2, y / 2],
        (x, y) => [x / 2, (y + 1) / 2]
    ]

    const image = new ImageData(600, 600);

    function* chaosGame() {
        var [x, y] = [randomBiUnit(), randomBiUnit()];

        for (var count = 0; count < iterations; count++) {
            const i = randomInteger(0, transforms.length);
            [x, y] = transforms[i](x, y);

            if (count > 20)
                plot(x, y, image);

            if (count % 1000 === 0)
                yield image;
        }
    }

    return (
        <Canvas
            width={image.width}
            height={image.height}
            painter={chaosGame()}/>
    )
}
render(<Gasket/>)
