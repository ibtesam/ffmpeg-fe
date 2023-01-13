import "./App.css";
import { Line } from "rc-progress";
import React, { useEffect, useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import VideoTimelinePicker from "./VideoTimelinePicker";
import video from "./video4.mp4";
import { utilService } from "./utils";
import CrossIcon from "./cross.svg";

const { convertSeconds } = utilService;

const VIDEO_ENUMS = {
  NONE: 0,
  TRANSCODE: 1,
  MERGE: 2,
  SNIPPING: 3,
  TRIMMING: 4,
  SUBTITLE: 5,
  SNAP: 7,
};

const App = () => {
  const [ffmpeg] = useState(
    createFFmpeg({
      log: false,
      progress: (e) => setProgress(e.ratio),
    })
  );

  const [videoDuration, setVideoDuration] = useState(0);
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
  const [image, setImage] = useState();
  const [progress, setProgress] = useState(0);
  const [trimList, setTrimList] = useState([]);
  const [videoSrc, setVideoSrc] = useState(video);
  const [ogVideoSrc, setOgVideoSrc] = useState("");
  const [selectedTrimItem, setSelectedTrimItem] = useState(null);
  const [underProcess, setUnderProcess] = useState(VIDEO_ENUMS.NONE);

  useEffect(() => {
    const LoadFFmpegWasm = async () => {
      await ffmpeg?.load();
    };
    LoadFFmpegWasm();
  }, [ffmpeg]);

  const doTranscode = async () => {
    setUnderProcess(VIDEO_ENUMS.TRANSCODE);
    ffmpeg.FS("writeFile", "test.txt", await fetchFile("/video4.mp4"));
    await ffmpeg.run("-i", "test.txt", "-vcodec", "copy", "output.mp4");
    const data = ffmpeg.FS("readFile", "output.mp4");
    setOgVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    );
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

  const mergeVideos = async (files) => {
    setUnderProcess(VIDEO_ENUMS.MERGE);
    // const files = [
    //   { file: "/video4.mp4", name: "video1.mp4" },
    //   { file: "/video5.mp4", name: "video2.mp4" },
    // ];
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
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

  const addSubtitle = async () => {
    setUnderProcess(VIDEO_ENUMS.SUBTITLE);
    ffmpeg.FS("writeFile", "video4.mp4", await fetchFile("/video3.mp4"));
    ffmpeg.FS("writeFile", "subtitle.srt", await fetchFile("/subtitle.srt"));
    await ffmpeg.run(
      "-i",
      "video4.mp4",
      "-vf",
      "subtitles=subtitle.srt",
      "output3.mp4"
    );
    const data = ffmpeg.FS("readFile", "output3.mp4");
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    );
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

  const trimVideo = async (startTime = "00:05:20", endTime = "00:05:25") => {
    setUnderProcess(VIDEO_ENUMS.TRIMMING);
    ffmpeg.FS("writeFile", "input.mp4", await fetchFile("/video4.mp4"));
    // ----------------------------------- trimming by inputting starting point and length
    // await ffmpeg.run(
    //   "-i",
    //   "input.mp4",
    //   "-ss",
    //   "00:05:20",
    //   "-t",
    //   "00:10:00",
    //   "-c:v",
    //   "copy",
    //   "-c:a",
    //   "copy",
    //   "output1.mp4"
    // );

    // ----------------------------------- trimming by inputting starting point and ending point

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
    // setVideoSrc(
    //   URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    // );
    setUnderProcess(VIDEO_ENUMS.NONE);
    return URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
  };

  const snipVideo = async () => {
    setUnderProcess(VIDEO_ENUMS.SNIPPING);
    ffmpeg.FS("writeFile", "video.mp4", await fetchFile("/video4.mp4"));
    // await ffmpeg.run(
    //   "-i",
    //   "video.mp4",
    //   "-filter:v",
    //   // '"crop=out_w:out_h:x:y"',
    //   "crop=500:350:20:20",
    //   "output.mp4"
    // );

    await ffmpeg.run(
      "-i",
      "video.mp4",
      // "-vf",
      "-filter:v",
      "crop=500:350:20:20",
      // "-threads",
      // "4",
      "-preset",
      "ultrafast",
      "-strict",
      "-2",
      "output.mp4"
    );
    const data = ffmpeg.FS("readFile", "output.mp4");
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    );
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

  const createSnap = async () => {
    setUnderProcess(VIDEO_ENUMS.SNAP);

    ffmpeg.FS("writeFile", "video.mp4", await fetchFile("/video3.mp4"));
    await ffmpeg.run("-i", "video.mp4", "-vf", "fps=1", "output%06d.png");
    const data = ffmpeg.FS("readFile", "output.png");

    setImage(
      URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }))
    );
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

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

  const handleAddToTrimList = () => {
    if (selectedInterval.startTime != null) {
      setTrimList((prev) => [
        ...prev,
        {
          ...selectedInterval,
          id: trimList.length > 0 ? trimList[trimList.length - 1].id + 1 : 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (id) => {
    let newList = [...trimList];
    newList = newList.filter((item) => item.id != id);
    setTrimList(newList);
  };

  const recursiveListing = (list, item, index) => {
    if (
      item.length + 1 == index ||
      (index - 1 >= 0 && item[index - 1].endTime == "00:16:17")
    ) {
      return;
    }
    recursiveListing(list, item, index + 1);
    if (index == 0 && item[index].startTime != "00:00:00") {
      list.push({
        ...item[index],
        endTime: item[index].startTime,
        startTime: "00:00:00",
      });
    } else if (index > 0) {
      list.push({
        ...item[index],
        endTime: index == item.length ? "00:16:17" : item[index].startTime,
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

  const updateTime = (seconds) => {
    videoEl.current.currentTime = seconds;
  };

  const playTrimmedPart = (item) => {
    videoEl.current.currentTime = item.startingSeconds;
    videoEl.current.play();
    setSelectedTrimItem(item);
  };

  const [sliderColor, setSliderColor] = useState("#ddd");
  const [sliderPosition, setSliderPosition] = useState(0);

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

  const [drag, setDrag] = useState(false);

  const handleMouseDown = (e) => {
    setDrag(true);
  };
  const handleMouseMove = (e) => {
    if (selectedTrimItem) {
      if (
        videoEl.current.currentTime >= selectedTrimItem.endingSeconds &&
        drag
      ) {
        e.preventDefault();
      }
    }
  };

  // const handleSeeked = (e) => {
  //   if (videoEl.current.currentTime >= selectedTrimItem.endingSeconds) {
  //     videoEl.current.ontimeupdate = null;
  //   }
  // }
  
  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          margin: "30px auto",
          justifyContent: "space-evenly",
        }}
      >
        {/* 
          <video
            controls
            width={800}
            height={450}
            src={ogVideoSrc}
            title="Original"
          /> 
        */}
        <div className="video-wrapper">
          <video
            controls
            width={800}
            height={450}
            onTimeUpdate={handleListenTimeUpdate}
            ref={videoEl}
            src={videoSrc}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            title="Processed"
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="progress-timeline-wrapper">
            <div
              style={{
                marginLeft: `${
                  selectedTrimItem
                    ? (selectedTrimItem.startingSeconds / videoDuration) * 100
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
              updateTime={updateTime}
            />
          </div>
          <div className="display-flex">
            {trimList.map((item, index) => {
              return (
                <div
                  className="trimmed-video-box"
                  key={`${item.startTime + item.endTime}-${index}`}
                >
                  <p className="m-0" onClick={() => playTrimmedPart(item)}>
                    Trim No: {item.id + 1}
                  </p>
                  <img
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
            <button onClick={handleAddToTrimList}>Add to trim list</button>
            <button onClick={handleTrimAndMerge}>Trim Video</button>
          </div>
          <div className="progress-bar-wrapper">
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          </div>
        </div>
      </div>

      {/* <div className="button-wrapper">
        <div>
          <button onClick={doTranscode}>Start</button>
          {underProcess === VIDEO_ENUMS.TRANSCODE && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
        <div>
          <button onClick={mergeVideos}>Merge</button>
          {underProcess === VIDEO_ENUMS.MERGE && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
        <div>
          <button onClick={addSubtitle}>Add subtitle</button>
          {underProcess === VIDEO_ENUMS.SUBTITLE && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
        <div>
          <button onClick={trimVideo}>Trim</button>
          {underProcess === VIDEO_ENUMS.TRIMMING && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
        <div>
          <button onClick={snipVideo}>Snip</button>
          {underProcess === VIDEO_ENUMS.SNIPPING && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
        <div>
          <button onClick={createSnap}>Create Snap</button>
          {underProcess === VIDEO_ENUMS.SNAP && (
            <>
              <p>Progress: {(progress * 100).toFixed(0)}%</p>
              <Line
                percent={progress * 100}
                strokeWidth={8}
                strokeColor="#32a852"
                trailWidth={8}
                trailColor="#32a85288"
              />
            </>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default App;
