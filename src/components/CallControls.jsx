import { Mic, PhoneOff } from "lucide-react";

export const CallControls = ({
  callStarted,
  ready,
  onStartCall,
  onEndCall,
}) => {
  return (
    <div className="space-y-4 w-[140px]">
      {callStarted ? (
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          onClick={onEndCall}
        >
          <PhoneOff className="w-5 h-5" />
          <span>End call</span>
        </button>
      ) : (
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            ready
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-blue-100 text-blue-700 opacity-50 cursor-not-allowed"
          }`}
          onClick={onStartCall}
          disabled={!ready}
        >
          <Mic className="w-5 h-5" />
          <span>Start call</span>
        </button>
      )}
    </div>
  );
};
export default CallControls;
