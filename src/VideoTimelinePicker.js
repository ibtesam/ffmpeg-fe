import moment from "moment";
import React, { useState } from "react";
import { set } from "date-fns";
import TimeRange from "react-video-timelines-slider";
import { utilService } from "./utils";

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

const VideoTimelinePicker = ({ videoDuration, setSelectedInterval, list }) => {
  const { hours, minutes, seconds, milliseconds } = videoDuration;

  const [error, setError] = useState(false);
  const errorHandler = ({ error }) => setError(error);

  const onChangeCallback = (selectedInterval) => {
    if (selectedInterval[0] != "Invalid Date") {
      const start = selectedInterval[0];
      const end = selectedInterval[1];
      
      setSelectedInterval({
        start,
        end,
        startTime: moment(start).format("HH:mm:ss"),
        endTime: moment(end).format("HH:mm:ss"),
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
      onUpdateCallback={errorHandler}
      onChangeCallback={onChangeCallback}
      formatTick={(ms) => moment(ms).format("HH:mm:ss")}
      formatTooltip={(ms) => moment(ms).format("HH:mm:ss.SSS")}
    />
  );
};

export default VideoTimelinePicker;
