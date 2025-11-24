import * as Speech from 'expo-speech';

class VoiceService {
  private isEnabled: boolean = true;

  constructor() {
    // Optional: Check permissions or initialize
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  stop() {
    Speech.stop();
  }

  speak(text: string) {
    if (!this.isEnabled) return;
    
    // Stop previous speech to avoid overlapping queues if updates come fast
    Speech.stop(); 
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9, // Slightly slower for clarity
    });
  }

  /**
   * Announces turn based on angle change
   * @param angleChange Change in bearing (positive = right, negative = left)
   */
  announceTurn(angleChange: number) {
    // Normalize angle to [-180, 180]
    let angle = angleChange;
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;

    if (Math.abs(angle) < 20) {
      this.speak("Continue straight.");
    } else if (angle > 20 && angle < 160) {
        if (angle > 45) this.speak("Turn sharp right.");
        else this.speak("Turn right.");
    } else if (angle < -20 && angle > -160) {
        if (angle < -45) this.speak("Turn sharp left.");
        else this.speak("Turn left.");
    } else {
      this.speak("Make a U-turn.");
    }
  }

  announceArrival(destinationName?: string) {
    if (destinationName) {
      this.speak(`You have arrived at ${destinationName}.`);
    } else {
      this.speak("You have arrived at your destination.");
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;

