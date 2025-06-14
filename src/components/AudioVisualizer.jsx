export const AudioVisualizer = ({
  callStarted,
  ripples,
  error,
  ready,
  speakingScale,
  listeningScale,
  isListening,
  isSpeaking,
}) => {
  const getStatusText = () => {
    if (error) return error;
    if (!ready) return "Loading...";
    if (isListening) return "Listening...";
    if (isSpeaking) return "Speaking...";
    return "";
  };

  const getRingColor = (shade = 200) => {
    // Since Tailwind scans your source files as plain text,
    // it has no way of understanding string concatenation or interpolation.
    switch (shade) {
      case 300:
        return error ? "bg-red-300" : "bg-green-300";
      default:
        return error ? "bg-red-200" : "bg-green-200";
    }
  };

  const getTextColor = () => {
    return error ? "text-red-700" : "text-gray-700";
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0 aspect-square">
      {/* Ripples */}
      {callStarted &&
        ripples.map((id) => (
          <div
            key={id}
            className="absolute inset-0 rounded-full border-2 border-green-200 pointer-events-none"
            style={{ animation: "ripple 1.5s ease-out forwards" }}
          />
        ))}

      {/* Pulsing loader while initializing */}
      <div
        className={`absolute w-32 h-32 rounded-full bg-green-200 ${getRingColor()} ${!ready ? "animate-ping opacity-75" : ""}`}
        style={{ animationDuration: "1.5s" }}
      />

      {/* Main rings */}
      <div
        className={`absolute w-32 h-32 rounded-full shadow-inner transition-transform duration-300 ease-out ${getRingColor(300)} ${!ready ? "opacity-0" : ""}`}
        style={{ transform: `scale(${speakingScale})` }}
      />

      <div
        className={`absolute w-32 h-32 rounded-full shadow-inner transition-transform duration-300 ease-out ${getRingColor()} ${!ready ? "opacity-0" : ""}`}
        style={{ transform: `scale(${listeningScale})` }}
      />

      {/* Center status text */}
      <div className={`absolute z-10 text-lg text-center ${getTextColor()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};
export default AudioVisualizer;
