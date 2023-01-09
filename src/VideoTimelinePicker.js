import React, { useState } from "react";
import { endOfToday, set } from "date-fns";
import moment from "moment";
import TimeRange from "react-video-timelines-slider";

const now = new Date();
const getTodayAtSpecificHour = (
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

const selectedStart = getTodayAtSpecificHour(12);
const selectedEnd = getTodayAtSpecificHour(14);

const startTime = getTodayAtSpecificHour(7);
const endTime = endOfToday();

const disabledIntervals = [
  { start: getTodayAtSpecificHour(16), end: getTodayAtSpecificHour(17) },
  { start: getTodayAtSpecificHour(7), end: getTodayAtSpecificHour(12) },
  { start: getTodayAtSpecificHour(20), end: getTodayAtSpecificHour(24) },
];

const VideoTimelinePicker = () => {
  const [error, setError] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState([
    selectedStart,
    selectedEnd,
  ]);

  const errorHandler = ({ error }) => setError(error);

  const onChangeCallback = (selectedInterval) =>
    setSelectedInterval(selectedInterval);

  return (
    <TimeRange
      error={error}
      ticksNumber={20}
      step={1}
      // selectedInterval={[moment("12:00:00"), moment("14:30:14")]}
      timelineInterval={[moment(), endTime]}
      onUpdateCallback={errorHandler}
      onChangeCallback={() => onChangeCallback}
      disabledIntervals={disabledIntervals}
      //   formatTick={(ms) => format(new Date(ms), "HH:mm:ss")}
      //   formatTooltip={(ms) => format(new Date(ms), "HH:mm:ss.SSS")}
      showTooltip={true}
      showTimelineError={false}
    />
  );
};

export default VideoTimelinePicker;
