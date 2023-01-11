import "./App.css";
import { Line } from "rc-progress";
import React, { useEffect, useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import VideoTimelinePicker from "./VideoTimelinePicker";
import { utilService } from "./utils";

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

function App() {
  const videoEl = useRef(null);
  const [ffmpeg] = useState(
    createFFmpeg({
      log: false,
      progress: (e) => setProgress(e.ratio),
    })
  );
  const [image, setImage] = useState("");
  const [videoRuntime, setVideoRuntime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const [progress, setProgress] = useState(0);
  const [videoSrc, setVideoSrc] = useState("");
  const [ogVideoSrc, setOgVideoSrc] = useState("");
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

  const mergeVideos = async () => {
    setUnderProcess(VIDEO_ENUMS.MERGE);
    const files = [
      { file: "/video4.mp4", name: "video1.mp4" },
      { file: "/video5.mp4", name: "video2.mp4" },
    ];
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

  const trimVideo = async () => {
    setUnderProcess(VIDEO_ENUMS.TRIMMING);
    const startTime = "00:05:20";
    const endTime = "00:05:25";
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
    setVideoSrc(
      URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    );
    setUnderProcess(VIDEO_ENUMS.NONE);
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
    // setOgVideoSrc(
    //   URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
    // );
    setUnderProcess(VIDEO_ENUMS.NONE);
  };

  const handleLoadedMetadata = () => {
    const video = videoEl.current;
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
    console.log(
      `The video is ${video.duration} - ${convertSeconds(video.duration)} long.`
    );
  };

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          margin: "30px auto",
          justifyContent: "space-evenly",
        }}
      >
        <video
          controls
          width={800}
          height={450}
          src={ogVideoSrc}
          title="Original"
        />
        <video
          controls
          width={800}
          height={450}
          ref={videoEl}
          src={videoSrc}
          title="Processed"
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
      <div
        style={{
          display: "flex",
          width: "60%",
          justifyContent: "space-between",
          margin: "50px auto 0",
        }}
      >
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
      </div>
      {/* <img src={image} width={100} height={50} /> */}
      <VideoTimelinePicker videoDuration={videoRuntime} />
    </div>
  );
}

export default App;
