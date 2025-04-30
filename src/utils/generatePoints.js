export function generatePoints(count, width, height) {
  const points = [];
  for (let i = 1; i <= count; i++) {
    points.push({
      key: `${Date.now()}-${i}-${Math.random()}`,
      number: i,
      left: Math.random() * (width - 40),
      top: Math.random() * (height - 40),
      countdown: 3.0
    });
  }
  return points;
}
