import { useEffect, useState, useRef } from "react";
import { INPUT_SAMPLE_RATE } from "./constants";
import { CallInterface } from "./components/CallInterface";

import WORKLET from "./play-worklet.js";

export default function App() {
  const [callStartTime, setCallStartTime] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [voice, setVoice] = useState("af_heart");
  const [voices, setVoices] = useState([]);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningScale, setListeningScale] = useState(1);
  const [speakingScale, setSpeakingScale] = useState(1);
  const [ripples, setRipples] = useState([]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const worker = useRef(null);

  const micStreamRef = useRef(null);
  const node = useRef(null);

  useEffect(() => {
    worker.current?.postMessage({
      type: "set_voice",
      voice,
    });
  }, [voice]);

  useEffect(() => {
    if (!callStarted) {
      // Reset worker state after call ends
      worker.current?.postMessage({
        type: "end_call",
      });
    }
  }, [callStarted]);

  useEffect(() => {
    if (callStarted && callStartTime) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = String(Math.floor(diff / 60)).padStart(2, "0");
        const seconds = String(diff % 60).padStart(2, "0");
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("00:00");
    }
  }, [callStarted, callStartTime]);

  useEffect(() => {
    worker.current ??= new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    const onMessage = ({ data }) => {
      if (data.error) {
        return onError(data.error);
      }

      switch (data.type) {
        case "status":
          if (data.status === "recording_start") {
            setIsListening(true);
            setIsSpeaking(false);
          } else if (data.status === "recording_end") {
            setIsListening(false);
          } else if (data.status === "ready") {
            setVoices(data.voices);
            setReady(true);
          }
          break;
        case "output":
          if (!playing) {
            node.current?.port.postMessage(data.result.audio);
            setPlaying(true);
            setIsSpeaking(true);
            setIsListening(false);
          }
          break;
      }
    };
    const onError = (err) => setError(err.message);

    worker.current.addEventListener("message", onMessage);
    worker.current.addEventListener("error", onError);

    return () => {
      worker.current.removeEventListener("message", onMessage);
      worker.current.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (!callStarted) return;

    let worklet;
    let inputAudioContext;
    let source;
    let ignore = false;

    let outputAudioContext;
    const audioStreamPromise = Promise.resolve(micStreamRef.current);

    audioStreamPromise
      .then(async (stream) => {
        if (ignore) return;

        inputAudioContext = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: INPUT_SAMPLE_RATE,
        });

        const analyser = inputAudioContext.createAnalyser();
        analyser.fftSize = 256;
        source = inputAudioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const inputDataArray = new Uint8Array(analyser.frequencyBinCount);

        function calculateRMS(array) {
          let sum = 0;
          for (let i = 0; i < array.length; ++i) {
            const normalized = array[i] / 128 - 1;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / array.length);
          return rms;
        }

        await inputAudioContext.audioWorklet.addModule(
          new URL("./vad-processor.js", import.meta.url),
        );
        worklet = new AudioWorkletNode(inputAudioContext, "vad-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: 1,
          channelCountMode: "explicit",
          channelInterpretation: "discrete",
        });

        source.connect(worklet);
        worklet.port.onmessage = (event) => {
          const { buffer } = event.data;
          worker.current?.postMessage({ type: "audio", buffer });
        };

        outputAudioContext = new AudioContext({
          sampleRate: 24000,
        });
        outputAudioContext.resume();

        const blob = new Blob([`(${WORKLET.toString()})()`], {
          type: "application/javascript",
        });
        const url = URL.createObjectURL(blob);
        await outputAudioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);

        node.current = new AudioWorkletNode(
          outputAudioContext,
          "buffered-audio-worklet-processor",
        );

        node.current.port.onmessage = (event) => {
          if (event.data.type === "playback_ended") {
            setPlaying(false);
            setIsSpeaking(false);
            worker.current?.postMessage({ type: "playback_ended" });
          }
        };

        const outputAnalyser = outputAudioContext.createAnalyser();
        outputAnalyser.fftSize = 256;

        node.current.connect(outputAnalyser);
        outputAnalyser.connect(outputAudioContext.destination);

        const outputDataArray = new Uint8Array(
          outputAnalyser.frequencyBinCount,
        );

        function updateVisualizers() {
          analyser.getByteTimeDomainData(inputDataArray);
          const rms = calculateRMS(inputDataArray);
          const targetScale = 1 + Math.min(1.25 * rms, 0.25);
          setListeningScale((prev) => prev + (targetScale - prev) * 0.25);

          outputAnalyser.getByteTimeDomainData(outputDataArray);
          const outputRMS = calculateRMS(outputDataArray);
          const targetOutputScale = 1 + Math.min(1.25 * outputRMS, 0.25);
          setSpeakingScale((prev) => prev + (targetOutputScale - prev) * 0.25);

          requestAnimationFrame(updateVisualizers);
        }
        updateVisualizers();
      })
      .catch((err) => {
        setError(err.message);
        console.error(err);
      });

    return () => {
      ignore = true;
      audioStreamPromise.then((s) => s.getTracks().forEach((t) => t.stop()));
      source?.disconnect();
      worklet?.disconnect();
      inputAudioContext?.close();

      outputAudioContext?.close();
    };
  }, [callStarted]);

  useEffect(() => {
    if (!callStarted) return;
    const interval = setInterval(() => {
      const id = Date.now();
      setRipples((prev) => [...prev, id]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r !== id));
      }, 1500);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStarted]);

  const handleStartCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
          sampleRate: INPUT_SAMPLE_RATE,
        },
      });
      micStreamRef.current = stream;

      setCallStartTime(Date.now());
      setCallStarted(true);
      worker.current?.postMessage({ type: "start_call" });
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div className="h-screen min-h-[240px] flex items-center justify-center bg-gray-50 p-4 relative">
      <CallInterface
        // Voice and timer props
        voices={voices}
        selectedVoice={voice}
        elapsedTime={elapsedTime}
        onVoiceChange={setVoice}
        // Audio visualizer props
        callStarted={callStarted}
        ripples={ripples}
        error={error}
        ready={ready}
        speakingScale={speakingScale}
        listeningScale={listeningScale}
        isListening={isListening}
        isSpeaking={isSpeaking}
        // Call controls props
        onStartCall={handleStartCall}
        onEndCall={() => {
          setCallStarted(false);
          setCallStartTime(null);
          setPlaying(false);
          setIsListening(false);
          setIsSpeaking(false);
        }}
      />

      <div className="absolute bottom-4 text-sm">
        Built with{" "}
        <a
          href="https://github.com/huggingface/transformers.js"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          🤗 Transformers.js
        </a>
        Strongly inspired from{" "}
        <a
          href="https://github.com/huggingface/transformers.js-examples/tree/main/conversational-webgpu"
          rel="noopener noreferrer"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Xenova's work
        </a>
      </div>
    </div>
  );
}
