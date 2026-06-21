/**
 * SimPhiEmbed - Embeddable Phigros simulator player
 *
 * Usage:
 *   import { SimPhiEmbed } from './embed';
 *   const player = new SimPhiEmbed(document.getElementById('container'), {
 *     baseUrl: './',  // path to sim-phi deployment
 *   });
 *   await player.loadChart({ chart: 'chart.json', bgm: 'bgm.ogg', background: 'bg.png' });
 *   player.play();
 *   player.onPause(() => console.log('paused'));
 */

export interface EmbedChartConfig {
  chart: string;      // URL or key to chart file
  bgm?: string;       // URL or key to audio file
  background?: string; // URL or key to background image
  name?: string;
  artist?: string;
  charter?: string;
  illustrator?: string;
  level?: string;
  offset?: number;    // ms offset
}

export interface EmbedOptions {
  baseUrl?: string;      // Base URL of sim-phi deployment (default: './')
  width?: string;        // CSS width (default: '100%')
  height?: string;       // CSS height (default: '100%')
  autoplay?: boolean;    // Auto-play on load (default: false)
  showTransition?: boolean; // Show transition animation (default: true)
  speed?: number;        // Playback speed (default: 1)
}

export interface StatusMessage {
  type: 'status';
  state: 'play' | 'pause' | 'stop';
  time: number;
  duration: number;
  score: number;
  combo: number;
  maxcombo: number;
}

type StatusCallback = (status: StatusMessage) => void;
type EventCallback = () => void;

export class SimPhiEmbed {
  private iframe: HTMLIFrameElement;
  private container: HTMLElement;
  private options: Required<EmbedOptions>;
  private _ready = false;
  private _state: 'stop' | 'play' | 'pause' = 'stop';
  private statusCallbacks: StatusCallback[] = [];
  private pauseCallbacks: EventCallback[] = [];
  private playCallbacks: EventCallback[] = [];
  private stopCallbacks: EventCallback[] = [];
  private readyCallbacks: EventCallback[] = [];
  private messageHandler: ((evt: MessageEvent) => void) | null = null;

  constructor(container: HTMLElement, options: EmbedOptions = {}) {
    this.container = container;
    this.options = {
      baseUrl: options.baseUrl || './',
      width: options.width || '100%',
      height: options.height || '100%',
      autoplay: options.autoplay || false,
      showTransition: options.showTransition !== false,
      speed: options.speed || 1
    };

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = `border:none;width:${this.options.width};height:${this.options.height};`;
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    this.iframe.setAttribute('allow', 'autoplay; fullscreen');
    this.iframe.src = `${this.options.baseUrl}?iframe`;
    this.container.appendChild(this.iframe);

    // Listen for messages from iframe
    this.messageHandler = (evt: MessageEvent) => {
      if (evt.source !== this.iframe.contentWindow) return;
      if (typeof evt.data === 'string') {
        if (evt.data === 'full') {
          // Handle fullscreen request from iframe
        }
      } else if (typeof evt.data === 'object' && evt.data !== null) {
        const msg = evt.data as Record<string, unknown>;
        if (msg.type === 'status') {
          this._state = msg.state as typeof this._state;
          const status = msg as unknown as StatusMessage;
          this.statusCallbacks.forEach(cb => cb(status));
        }
      }
    };
    window.addEventListener('message', this.messageHandler);

    // Wait for iframe to load
    this.iframe.addEventListener('load', () => {
      this._ready = true;
      this.readyCallbacks.forEach(cb => cb());
    });
  }

  /** Whether the iframe is loaded and ready */
  get ready(): boolean {
    return this._ready;
  }

  /** Current playback state */
  get state(): 'stop' | 'play' | 'pause' {
    return this._state;
  }

  /** Send a message to the iframe */
  post(data: unknown): void {
    this.iframe.contentWindow?.postMessage(data, '*');
  }

  /** Load a chart from URLs */
  async loadChart(config: EmbedChartConfig): Promise<void> {
    // If files are URLs on the same server, fetch and send them
    // The iframe's FileEmitter accepts File objects via postMessage
    const files: Array<{ name: string; buffer: ArrayBuffer }> = [];

    const fetchFile = async (url: string, name: string) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buffer = await resp.arrayBuffer();
        files.push({ name, buffer });
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err);
      }
    };

    // Fetch all files in parallel
    const promises: Promise<void>[] = [];
    if (config.chart) promises.push(fetchFile(config.chart, config.chart.split('/').pop() || 'chart.json'));
    if (config.bgm) promises.push(fetchFile(config.bgm, config.bgm.split('/').pop() || 'bgm.ogg'));
    if (config.background) promises.push(fetchFile(config.background, config.background.split('/').pop() || 'bg.png'));
    await Promise.all(promises);

    // Send files to iframe
    for (const file of files) {
      const blob = new Blob([file.buffer]);
      const fileObj = new File([blob], file.name);
      this.post(fileObj);
    }

    // Wait a moment for processing, then set metadata
    await new Promise(r => setTimeout(r, 500));

    // Set metadata if provided
    if (config.offset !== undefined) {
      this.postMessage_({ action: 'seek', time: config.offset / 1000 });
    }
  }

  /** Send a post action */
  private postMessage_(data: Record<string, unknown>): void {
    this.post(data);
  }

  /** Start or resume playback. Always sends play action; iframe handles current state. */
  play(): void {
    this.post({ action: 'play' });
  }

  /** Pause playback */
  pause(): void {
    if (this._state === 'play') {
      this.post({ action: 'pause' });
    }
  }

  /** Toggle play/pause */
  togglePause(): void {
    this.post({ action: 'pause' });
  }

  /** Stop playback and reset */
  stop(): void {
    if (this._state !== 'stop') {
      this.post({ action: 'stop' });
    }
  }

  /** Seek to time in seconds */
  seek(timeSec: number): void {
    this.postMessage_({ action: 'seek', time: timeSec });
  }

  /** Set playback speed (0.25 - 4.0) */
  setSpeed(speed: number): void {
    this.postMessage_({ action: 'setSpeed', speed });
  }

  /** Toggle auto-play mode */
  setAutoPlay(auto: boolean): void {
    this.postMessage_({ action: 'setAutoPlay', auto });
  }

  /** Request current status from iframe */
  getStatus(): void {
    this.post({ action: 'getStatus' });
  }

  /** Register callback for status updates */
  onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const idx = this.statusCallbacks.indexOf(callback);
      if (idx !== -1) this.statusCallbacks.splice(idx, 1);
    };
  }

  /** Register callback for pause events */
  onPause(callback: EventCallback): () => void {
    this.pauseCallbacks.push(callback);
    return () => {
      const idx = this.pauseCallbacks.indexOf(callback);
      if (idx !== -1) this.pauseCallbacks.splice(idx, 1);
    };
  }

  /** Register callback for play events */
  onPlay(callback: EventCallback): () => void {
    this.playCallbacks.push(callback);
    return () => {
      const idx = this.playCallbacks.indexOf(callback);
      if (idx !== -1) this.playCallbacks.splice(idx, 1);
    };
  }

  /** Register callback for stop events */
  onStop(callback: EventCallback): () => void {
    this.stopCallbacks.push(callback);
    return () => {
      const idx = this.stopCallbacks.indexOf(callback);
      if (idx !== -1) this.stopCallbacks.splice(idx, 1);
    };
  }

  /** Register callback for ready event */
  onReady(callback: EventCallback): () => void {
    if (this._ready) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
    return () => {
      const idx = this.readyCallbacks.indexOf(callback);
      if (idx !== -1) this.readyCallbacks.splice(idx, 1);
    };
  }

  /** Destroy the embed and clean up */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
    this.iframe.remove();
    this.statusCallbacks = [];
    this.pauseCallbacks = [];
    this.playCallbacks = [];
    this.stopCallbacks = [];
    this.readyCallbacks = [];
  }
}

// Export for CDN / script tag usage
if (typeof window !== 'undefined') {
  (window as any).SimPhiEmbed = SimPhiEmbed;
}
