/**
 * Execute an async function with a retry with exponential backoff in case of failures.
 * @param fn The function to execute
 * @param [backoff] Backoff in milliseconds (will be used as backoff * 2 ** call) (default 250ms)
 * @param [retries] The maximum amount of retries to do in case of failure (default 5)
 * @param [initialDelay] Initial delay before first execution (default 0)
 * @param [call] The current call (this is for recursion and should not be set by the user)
 */
export async function backoffRetry<T>(
  fn: () => Promise<T>,
  backoff = 250,
  retries = 5,
  initialDelay = 0,
  call = 0
): Promise<T> {
  if (call === 0 && initialDelay !== 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Set initial delay to 0 so it does not get used again
        backoffRetry(fn, backoff, retries, 0, 0)
          .then(resolve).catch(reject)
      }, initialDelay)
    })
  }

  if (call === retries) {
    return fn()
  } else {
    return fn()
      .catch(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            backoffRetry(fn, backoff, retries, initialDelay, call + 1)
              .then(resolve).catch(reject)
          }, backoff * Math.pow(2, call))
        })
      })
  }
}
