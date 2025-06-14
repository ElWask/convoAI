const MIN_CHUNK_SIZE = 512;
let globalPointer = 0;
let globalBuffer = new Float32Array(MIN_CHUNK_SIZE);

class VADProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const buffer = inputs[0][0];
    if (!buffer) return true; // Keep processor alive

    if (buffer.length >= MIN_CHUNK_SIZE) {
      // Changed > to >=
      // Send a copy of the buffer
      this.port.postMessage({ buffer: new Float32Array(buffer) });
    } else {
      const remaining = MIN_CHUNK_SIZE - globalPointer;
      if (buffer.length >= remaining) {
        globalBuffer.set(buffer.subarray(0, remaining), globalPointer);

        // Send a copy of the global buffer
        this.port.postMessage({ buffer: new Float32Array(globalBuffer) });

        globalBuffer.fill(0);
        globalBuffer.set(buffer.subarray(remaining), 0);
        globalPointer = buffer.length - remaining;
      } else {
        globalBuffer.set(buffer, globalPointer);
        globalPointer += buffer.length;
      }
    }

    return true;
  }
}

registerProcessor("vad-processor", VADProcessor);
