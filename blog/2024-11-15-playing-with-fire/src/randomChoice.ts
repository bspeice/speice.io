export function randomChoice<T>(choices: [number, T][]): [number, T] {
    const weightSum = choices.reduce((sum, [weight, _]) => sum + weight, 0);
    let choice = Math.random() * weightSum;

    for (const [index, element] of choices.entries()) {
        const [weight, t] = element;
        if (choice < weight) {
            return [index, t];
        }
        choice -= weight;
    }

    const index = choices.length - 1;
    return [index, choices[index][1]];
}