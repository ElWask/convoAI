import { ChevronDown } from "lucide-react";

export const VoiceSelector = ({
  voices,
  selectedVoice,
  ready,
  onVoiceChange,
}) => {
  return (
    <div className="text-base relative">
      <button
        type="button"
        disabled={!ready}
        className={`w-full flex items-center justify-between border border-gray-300 rounded-md transition-colors ${
          ready
            ? "bg-transparent hover:border-gray-400"
            : "bg-gray-100 opacity-50 cursor-not-allowed"
        }`}
      >
        <span className="px-2 py-1">Select voice</span>
        <ChevronDown className="absolute right-2" />
      </button>
      <select
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={!ready}
      >
        {Object.entries(voices).map(([key, v]) => (
          <option key={key} value={key}>
            {`${v.name} (${v.language === "en-us" ? "American" : v.language} ${
              v.gender
            })`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;
