class SoundManagerClass {
  private enabled = true;
  setEnabled(v: boolean) {
    this.enabled = v;
  }
  playClick() {
    if (!this.enabled) return;
    // optional: play a short beep via Web Audio or silent
  }
}
export const soundManager = new SoundManagerClass();
