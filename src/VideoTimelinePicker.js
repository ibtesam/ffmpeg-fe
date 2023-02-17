import React, { useRef, useState } from "react";
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
  selectedTrim,
}) => {
  const { hours, minutes, seconds, milliseconds } = videoDuration;
  const [disabledTrack, setDisabledTrack] = useState();
  const error = useRef(false);

  const onUpdateCallback = (e) => {
    error.current = e.error;
    if (e.time[0] != "Invalid Date" && selectedTrim == null) {
      setDisabledTrack(e.time[0]);
      if (
        moment(disabledTrack).format("HH:mm:ss.SSSS") !=
        moment(e.time[0]).format("HH:mm:ss.SSSS")
      ) {
        updateTime(getSeconds(e.time[0]));
      } else updateTime(getSeconds(e.time[1]));
    }
  };

  const onChangeCallback = (selectedInterval) => {
    if (selectedInterval[0] != "Invalid Date" && error.current == false) {
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
    } else if (selectedInterval[0] != "Invalid Date" && error.current == true) {
      setSelectedInterval({ startTime: null, endTime: null });
    }
  };

  return (
    <>
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
        formatTooltip={(ms) => format(ms, "HH:mm:ss")}
      />

      {error.current && (
        <p className="note-sign">
          *The selected Trim is not valid and might cause issues while merging
        </p>
      )}
    </>
  );
};

export default VideoTimelinePicker;
