import moment from "moment";

export const utilService = {
  addPadding,
  convertSeconds,
  getSeconds,
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
  return { hours, minutes, seconds };
}

function getSeconds(time) {
  time = moment(time).format("HH:mm:ss");
  time = time.split(":");
  const seconds = parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(2);
  return seconds;
}
