// Speech Synthesis Helper for Cinematic Mission Narration
class MissionNarrator {
  constructor() {
    this.isMuted = false;
    this.currentUtterance = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  }

  speak(text, onEnd) {
    if (this.isMuted || !this.synth) {
      if (onEnd) setTimeout(onEnd, 3500);
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98; // Slightly deliberate planetarium cadence
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a high quality English voice (Google US English or Samantha/Alex/Natural)
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('English')) && v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }
}

export const narrator = new MissionNarrator();
