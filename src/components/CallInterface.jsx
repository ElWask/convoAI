import { TimeVoiceInfo } from "./TimeVoiceInfo";
import { AudioVisualizer } from "./AudioVisualizer";
import { CallControls } from "./CallControls";

export const CallInterface = ({
  // Voice and timer props
  voices,
  selectedVoice,
  elapsedTime,
  onVoiceChange,

  // Audio visualizer props
  callStarted,
  ripples,
  error,
  ready,
  speakingScale,
  listeningScale,
  isListening,
  isSpeaking,

  // Call controls props
  onStartCall,
  onEndCall,
}) => {
  return (
    <div className="h-full max-h-[320px] w-[640px] bg-white rounded-xl shadow-lg p-8 flex items-center justify-between space-x-16">
      <TimeVoiceInfo
        voices={voices}
        selectedVoice={selectedVoice}
        elapsedTime={elapsedTime}
        ready={ready}
        onVoiceChange={onVoiceChange}
      />

      <AudioVisualizer
        callStarted={callStarted}
        ripples={ripples}
        error={error}
        ready={ready}
        speakingScale={speakingScale}
        listeningScale={listeningScale}
        isListening={isListening}
        isSpeaking={isSpeaking}
      />

      <CallControls
        callStarted={callStarted}
        ready={ready}
        onStartCall={onStartCall}
        onEndCall={onEndCall}
      />
    </div>
  );
};
export default CallInterface;
