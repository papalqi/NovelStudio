export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, wait = 300) => {
  let timer: number | undefined
  return (...args: Args) => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => fn(...args), wait)
  }
}
