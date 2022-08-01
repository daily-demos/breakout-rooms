export const shuffle = (arr: any[]) => {
  let count = arr.length,
    random,
    temp;
  while (count) {
    random = (Math.random() * count--) | 0;
    temp = arr[count];
    arr[count] = arr[random];
    arr[random] = temp;
  }
  return arr;
};
