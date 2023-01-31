import { Line } from "rc-progress";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import React, { useEffect, useRef, useState } from "react";

import play from "./play.svg";
import pause from "./pause.svg";
import video from "./video4.mp4";
import CrossIcon from "./cross.svg";
import { utilService } from "./utils";
import VideoTimelinePicker from "./VideoTimelinePicker";

import "./App.css";
import WebcamStreamCapture from "./VideoRecorder";

const { convertSeconds, getMergeVideoSeconds } = utilService;

const TrimVideo = () => {
  const [ffmpeg] = useState(
    createFFmpeg({
      log: false,
      progress: (e) => setProgress(e),
    })
  );

  const [selectedInterval, setSelectedInterval] = useState({
    startTime: null,
    endTime: null,
  });
  const [videoRuntime, setVideoRuntime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const videoEl = useRef(null);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState({ ratio: 0, time: 0 });
  const [trimList, setTrimList] = useState([]);
  const [videoSrc, setVideoSrc] = useState(video);
  const [sliderColor, setSliderColor] = useState("#ddd");
  const [sliderPosition, setSliderPosition] = useState(0);
  const [mergedVideoSeconds, setMergedSeconds] = useState(1);
  const [videoTotalDuration, setVideoDuration] = useState(0);
  const [selectedTrimItem, setSelectedTrimItem] = useState(null);
  const [recordVideo, setRecordVideo] = useState(false);

  useEffect(() => {
    const LoadFFmpegWasm = async () => {
      await ffmpeg?.load();
    };
    LoadFFmpegWasm();
  }, [ffmpeg]);

  // ** COMMANDS **
  const mergeVideos = async (files) => {
    setMessage("Merging...");
    const inputPaths = [];
    for (const file of files) {
      ffmpeg.FS("writeFile", file.name, await fetchFile(file.file));
      inputPaths.push(`file ${file.name}`);
    }
    ffmpeg.FS("writeFile", "concat_list.txt", inputPaths.join("\n"));
    await ffmpeg.run(
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat_list.txt",
      "-vcodec",
      "copy",
      "output.mp4"
    );
    const data = ffmpeg.FS("readFile", "output.mp4");
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    );
    setMessage(null);
  };

  const trimVideo = async (startTime = "00:00:00", endTime = "00:00:05") => {
    setMessage("Trimming...");
    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoSrc));
    await ffmpeg.run(
      "-ss",
      startTime,
      "-to",
      endTime,
      "-i",
      "input.mp4",
      "-c",
      "copy",
      "output1.mp4"
    );
    const data = ffmpeg.FS("readFile", "output1.mp4");
    setMessage(null);
    return URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
  };

  // ** FUNCTION HANDLERS **
  const handleLoadedMetadata = () => {
    const video = videoEl.current;
    setVideoDuration(video.duration);
    const videoDuration = convertSeconds(video.duration);
    setVideoRuntime((prev) => {
      return {
        ...prev,
        hours: videoDuration.hours,
        minutes: videoDuration.minutes,
        seconds: videoDuration.seconds,
      };
    });
    if (!video) return;
  };

  const handleLoadVideo = (videoUrl) => {
    const video = videoEl.current;
    video.src = URL.createObjectURL(new Blob(videoUrl, { type: "video/webm" }));
    video.currentTime = 86400;
    setTimeout(() => {
      video.currentTime = 0;

      setVideoDuration(video.duration);
      const videoDuration = convertSeconds(video.duration);
      setVideoRuntime((prev) => {
        return {
          ...prev,
          hours: videoDuration.hours,
          minutes: videoDuration.minutes,
          seconds: videoDuration.seconds,
        };
      });
    }, 1000);

    if (!video) return;
  };

  const handleAddToTrimList = () => {
    if (selectedInterval.startTime != null) {
      setTrimList((prev) => [
        ...prev,
        {
          ...selectedInterval,
          id: trimList.length > 0 ? trimList[trimList.length - 1].id + 1 : 0,
        },
      ]);

      setSelectedInterval({
        startTime: null,
        endTime: null,
      });
    }
  };

  const handleRemoveItem = (id) => {
    let newList = [...trimList];
    newList = newList.filter((item) => item.id !== id);
    setTrimList(newList);
    setSelectedTrimItem(null);
    setSliderPosition(0);
    setSliderColor("#ddd");
  };

  const recursiveListing = (list, item, index) => {
    if (
      item.length + 1 === index ||
      (index - 1 >= 0 &&
        item[index - 1].endTime === convertSeconds(videoTotalDuration).time)
    ) {
      return;
    }
    recursiveListing(list, item, index + 1);
    if (index === 0 && item[index].startTime !== "00:00:00") {
      list.push({
        ...item[index],
        endTime: item[index].startTime,
        startTime: "00:00:00",
      });
    } else if (index > 0) {
      list.push({
        ...item[index],
        endTime:
          index === item.length
            ? convertSeconds(videoTotalDuration).time
            : item[index].startTime,
        startTime: item[index - 1].endTime,
      });
    }
    return;
  };

  const handleTrimAndMerge = async () => {
    let trimmedVideos = [];
    let mutatedList = [];

    recursiveListing(mutatedList, trimList, 0);

    mutatedList = mutatedList.sort((a, b) => {
      return (
        new Date("1970/01/01 " + a.startTime) -
        new Date("1970/01/01 " + b.startTime)
      );
    });

    setMergedSeconds(getMergeVideoSeconds(mutatedList));

    for (let i = 0; i < mutatedList.length; i++) {
      const url = await trimVideo(
        mutatedList[i].startTime,
        mutatedList[i].endTime
      );
      trimmedVideos.push({ file: url, name: `video${i}.mp4` });
    }

    mergeVideos(trimmedVideos);
    setTimeout(() => {
      setTrimList([]);
    }, 1000);
  };

  const handleUpdateTime = (seconds) => {
    videoEl.current.currentTime = seconds;
  };

  const handlePlayTrimmedPart = (item) => {
    if (!selectedTrimItem) {
      videoEl.current.currentTime = item.startingSeconds;
      videoEl.current.play();
      setSelectedTrimItem(item);
    } else {
      setSelectedTrimItem(null);
      setSliderPosition(0);
      setSliderColor("#ddd");
    }
  };

  const handleListenTimeUpdate = (e) => {
    if (selectedTrimItem) {
      if (videoEl.current.currentTime >= selectedTrimItem.endingSeconds) {
        videoEl.current.pause();
      }
      const currentTime = e.target.currentTime;
      if (
        currentTime >= selectedTrimItem.startingSeconds &&
        currentTime <= selectedTrimItem.endingSeconds
      ) {
        setSliderColor("red");
      } else {
        setSliderColor("#ddd");
      }
      setSliderPosition(
        (currentTime / e.target.duration -
          selectedTrimItem.startingSeconds / e.target.duration) *
          100
      );
    }
  };

  // ** CONDITIONS **
  const progressCondition =
    (progress.ratio ? progress.ratio : progress.time / mergedVideoSeconds) *
    100;

  return (
    <div className="container">
      <div className="video-wrapper">
        <div className={`recorder-screen ${recordVideo == true && "visible"}`}>
          {recordVideo && (
            <WebcamStreamCapture
              loadData={handleLoadVideo}
            />
          )}
        </div>
        <div className="mv-20">
          <button
            className="w-200"
            onClick={() => setRecordVideo((prev) => !prev)}
          >
            {!recordVideo ? "Show Video Recorder" : "Hide Video recorder"}
          </button>
        </div>

        <video
          controls
          width={800}
          height={450}
          ref={videoEl}
          src={videoSrc}
          title="Processed"
          onTimeUpdate={handleListenTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        <div className="progress-timeline-wrapper">
          <div
            style={{
              marginLeft: `${
                selectedTrimItem
                  ? (selectedTrimItem.startingSeconds / videoTotalDuration) *
                    100
                  : 0
              }%`,
              width: `${sliderPosition}%`,
              backgroundColor: sliderColor,
            }}
            className="custom-progress"
          />
          <VideoTimelinePicker
            list={trimList}
            videoDuration={videoRuntime}
            setSelectedInterval={setSelectedInterval}
            updateTime={handleUpdateTime}
            selectedTrim={selectedTrimItem}
          />
        </div>
        <div className="display-flex">
          {trimList.map((item, index) => {
            return (
              <div
                className={`trimmed-video-box ${
                  item.id === selectedTrimItem?.id ? "selected-video-box" : null
                }`}
                key={`${item.startTime + item.endTime}-${index}`}
              >
                <span
                  className="flex-center"
                  onClick={() => handlePlayTrimmedPart(item)}
                >
                  <img
                    alt="play icon"
                    src={item.id === selectedTrimItem?.id ? pause : play}
                  />
                  <p className="m-0">Trim No: {item.id + 1}</p>
                </span>
                <img
                  alt="cross icon"
                  className="cross-icon"
                  src={CrossIcon}
                  width={25}
                  height={25}
                  onClick={() => handleRemoveItem(item.id)}
                />
              </div>
            );
          })}
        </div>
        <div className="video-btn-wrapper">
          <button
            onClick={handleAddToTrimList}
            disabled={selectedTrimItem || selectedInterval.startTime == null}
          >
            Add to trim list
          </button>
          <button
            onClick={handleTrimAndMerge}
            disabled={selectedTrimItem || trimList.length === 0}
          >
            Trim Video
          </button>
        </div>
        <div className="progress-bar-wrapper">
          <>
            {message && <p>{message}</p>}
            <p>
              {`Progress: ${
                progressCondition > 0 && progressCondition <= 100
                  ? progressCondition.toFixed(0)
                  : 0
              }`}
              %
            </p>
            <Line
              percent={progressCondition}
              strokeWidth={8}
              strokeColor="#32a852"
              trailWidth={8}
              trailColor="#32a85288"
            />
          </>
        </div>
      </div>
    </div>
  );
};

export default TrimVideo;
