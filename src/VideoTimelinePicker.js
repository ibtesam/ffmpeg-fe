import React, { useState } from "react";
import { set, format } from "date-fns";
import TimeRange from "react-video-timelines-slider";
import { utilService } from "./utils";
import moment from "moment";

const now = new Date();
const { getSeconds } = utilService;

const getTodayAtSpecificTime = (
  hour = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
) =>
  set(now, {
    hours: hour,
    minutes: minutes,
    seconds: seconds,
    milliseconds: milliseconds,
  });

const VideoTimelinePicker = ({
  videoDuration,
  setSelectedInterval,
  list,
  updateTime,
}) => {
  const { hours, minutes, seconds, milliseconds } = videoDuration;
  const [disabledTrack, setDisabledTrack] = useState();
  const [error, setError] = useState(false);
  const onUpdateCallback = (e) => {
    if (e.time[0] != "Invalid Date") {
      setDisabledTrack(e.time[0]);
      if (moment(disabledTrack).add(1, "seconds") != e.time[0]) {
        console.log(
          moment(disabledTrack).add(1, "seconds") == e.time[0],
          moment(disabledTrack).add(1, "second1"),
          e.time[0]
        );
        updateTime(getSeconds(e.time[0]));
      } else updateTime(getSeconds(e.time[1]));
    }
  };

  const onChangeCallback = (selectedInterval) => {
    if (selectedInterval[0] != "Invalid Date") {
      const start = selectedInterval[0];
      const end = selectedInterval[1];
      setSelectedInterval({
        start,
        end,
        startTime: format(start, "HH:mm:ss"),
        endTime: format(end, "HH:mm:ss"),
        startingSeconds: getSeconds(start),
        endingSeconds: getSeconds(end),
      });
    }
  };

  return (
    <TimeRange
      step={1}
      error={error}
      ticksNumber={10}
      showTooltip={true}
      showTimelineError={false}
      selectedInterval={[
        getTodayAtSpecificTime(),
        getTodayAtSpecificTime(0, 0, 4),
      ]}
      timelineInterval={[
        getTodayAtSpecificTime(),
        getTodayAtSpecificTime(hours, minutes, seconds, milliseconds),
      ]}
      disabledIntervals={list}
      onUpdateCallback={onUpdateCallback}
      onChangeCallback={onChangeCallback}
      formatTick={(ms) => format(ms, "HH:mm:ss")}
      formatTooltip={(ms) => format(ms, "HH:mm:ss.SSS")}
    />
  );
};

export default VideoTimelinePicker;
