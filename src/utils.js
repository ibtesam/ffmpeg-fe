import moment from "moment";

export const utilService = {
  addPadding,
  convertSeconds,
  timeStringToSeconds,
  getSeconds,
  getMergeVideoSeconds,
};

function addPadding(num) {
  return ("0" + num).slice(-2);
}

// function convertSeconds(seconds) {
//   seconds = parseInt(seconds);
//   let minutes = Math.floor(seconds / 60);
//   seconds = seconds % 60;
//   const hours = Math.floor(minutes / 60);
//   minutes = minutes % 60;
//   const time = `${addPadding(hours)}:${addPadding(minutes)}:${addPadding(
//     seconds
//   )}`;
//   return { hours, minutes, seconds, time };
// }

function convertSeconds(value) {
  let [sec, milliseconds] = value.toFixed(3).toString().split(".");
  let seconds = +sec;
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  const time = `${addPadding(hours)}:${addPadding(minutes)}:${addPadding(
    seconds
  )}.${milliseconds}`;
  return { hours, minutes, seconds, time };
}

function timeStringToSeconds(time) {
  time = time.split(":");
  const seconds =
    parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(time[2]);
  return seconds;
}

function getSeconds(time) {
  return timeStringToSeconds(moment(time).format("HH:mm:ss"));
}

function getMergeVideoSeconds(list) {
  let seconds = 0;

  list.forEach((item) => {
    seconds +=
      timeStringToSeconds(item.endTime) - timeStringToSeconds(item.startTime);
  });

  return seconds;
}
