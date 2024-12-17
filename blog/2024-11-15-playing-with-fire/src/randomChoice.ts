export function randomChoice<T>(
  choices: [number, T][]
): [number, T] {
  const weightSum = choices.reduce(
      (sum, [weight, _]) => sum + weight,
      0
  );
  let choice = Math.random() * weightSum;

  for (const entry of choices.entries()) {
    const [idx, elem] = entry;
    const [weight, t] = elem;
    if (choice < weight) {
      return [idx, t];
    }
    choice -= weight;
  }

  const index = choices.length - 1;
  return [index, choices[index][1]];
}