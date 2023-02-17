import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useStopwatch } from "react-timer-hook";
import "./App.css";

const WebcamStreamCapture = ({ loadData }) => {
  const { seconds, minutes, start } = useStopwatch({ autoStart: false });
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    start();
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleFinish = useCallback(() => {
    if (recordedChunks.length) {
      loadData(recordedChunks);
      setRecordedChunks([]);
    }
  }, [loadData, recordedChunks]);

  const videoConstraints = {
    width: 800,
    height: 450,
    facingMode: "user",
  };

  return (
    <div className="recorder_container">
      <div className="webcam_video">
        <Webcam
          audio={true}
          ref={webcamRef}
          muted={true}
          width={800}
          height={450}
          videoConstraints={videoConstraints}
        />
        {capturing ? (
          <div className="video_duration">
            {" "}
            <span>REC </span> {minutes}:{seconds}
          </div>
        ) : null}
      </div>
      <div className="button__wrapper">
        {capturing ? (
          <button onClick={handleStopCaptureClick}>Stop Capture</button>
        ) : (
          <button onClick={handleStartCaptureClick}>Start Capture</button>
        )}
        {recordedChunks.length > 0 && (
          <button className="finish_btn" onClick={handleFinish}>
            Finish
          </button>
        )}
      </div>
    </div>
  );
};
export default WebcamStreamCapture;
