function Gasket(props) {
    const iterations = 1000;
    const functions = [
        (x, y) => [x / 2, y / 2],
        (x, y) => [(x + 1) / 2, y / 2],
        (x, y) => [x / 2, (y + 1) / 2]
    ]

    function chaosGame(image) {
        var [x, y] = [randomBiUnit(), randomBiUnit()];

        for (var i = 0; i < iterations; i++) {
            const f = functions[randomInteger(0, functions.length)];
            [x, y] = f(x, y);

            if (i > 20) {
                plot(x, y, image);
            }
        }
    }

    function onClickRender() {
        /** @type{HTMLCanvasElement} */
        const canvas = document.getElementById('canvas-gasket');
        const context = canvas.getContext('2d');
        const image = context.createImageData(canvas.width, canvas.height);
        chaosGame(image);
        context.putImageData(image, 0, 0);
    }

    return <div style={{width: '100%'}}>
        <center>
            <button onClick={onClickRender}>Play chaos game</button>
            <hr/>
        </center>
        <div>
            <canvas
                id={'canvas-gasket'}
                style={{width: '100%', aspectRatio: '1 / 1'}}
            />
        </div>
    </div>
}
