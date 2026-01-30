/**
 * Web Audio API로 짧은 클릭음 재생.
 * 사용자 제스처 후 첫 재생 시 AudioContext를 생성/재개함.
 */
class SoundManagerClass {
  private enabled = true;
  private ctx: AudioContext | null = null;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined" || !window.AudioContext) return null;
    if (!this.ctx) this.ctx = new window.AudioContext();
    return this.ctx;
  }

  playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const play = () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch {
        /* ignore */
      }
    };
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(play)
        .catch(() => {});
    } else {
      play();
    }
  }

  /** 블록 배치 등 게임 액션용 짧은 톤 */
  playPlace() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const play = () => {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } catch {
        /* ignore */
      }
    };
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(play)
        .catch(() => {});
    } else {
      play();
    }
  }
}

export const soundManager = new SoundManagerClass();
