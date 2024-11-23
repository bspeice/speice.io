/**
 * @param choices array of [weight, value] pairs
 * @returns pair of [index, value]
 */
export function randomChoice<T>(choices: [number, T][]): [number, T] {
    const weightSum = choices.reduce(
        (current, [weight, _]) => current + weight,
        0
    );
    var choice = Math.random() * weightSum;

    for (var i = 0; i < choices.length; i++) {
        const [weight, t] = choices[i];
        if (choice < weight) {
            return [i, t];
        }

        choice -= weight;
    }

    throw "unreachable";
}