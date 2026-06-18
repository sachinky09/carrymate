// Centralized logger. Always prints the originating file name with the error
// so failures are traceable directly from the console.

export function logError(fileName, error) {
  const message = error && error.message ? error.message : String(error);
  console.error(`[ERROR] file=${fileName} message=${message}`);
  if (error && error.stack) {
    console.error(error.stack);
  }
}

export function logInfo(fileName, message) {
  console.log(`[INFO] file=${fileName} message=${message}`);
}
