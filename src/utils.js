export const utilService = {
  convertSeconds,
  addPadding,
};

function addPadding(num) {
  return ("0" + num).slice(-2);
}

function convertSeconds(seconds) {
  seconds = parseInt(seconds);
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  // return `${addPadding(hours)}:${addPadding(minutes)}:${addPadding(seconds)}`;
  return { hours, minutes, seconds };
}
