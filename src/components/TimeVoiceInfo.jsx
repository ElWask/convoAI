import { VoiceSelector } from "./VoiceSelector";

export const TimeVoiceInfo = ({
  voices,
  selectedVoice,
  elapsedTime,
  ready,
  onVoiceChange,
}) => {
  return (
    <div className="text-green-700 w-[140px]">
      <div className="text-xl font-bold flex justify-between">
        {voices?.[selectedVoice]?.name}
        <span className="font-normal text-gray-500">{elapsedTime}</span>
      </div>
      <VoiceSelector
        voices={voices}
        selectedVoice={selectedVoice}
        ready={ready}
        onVoiceChange={onVoiceChange}
      />
    </div>
  );
};
export default TimeVoiceInfo;
