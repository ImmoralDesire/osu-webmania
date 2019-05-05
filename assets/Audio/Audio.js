export class Audio {
  constructor() {

    this.startTime = window.performance.now();

    this.source;
    this.buffer;
    this.playing = false;
    this.offset = 0;
    this.currentTime = 0;
  }

  play() {
    this.source.disconnect();
    this.source = game.audioHandler.context.createBufferSource();
    this.source.connect(game.audioHandler.context.destination);
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = game.speed;
    this.source.start(0);
    this.playing = true;
    this.offset = game.audioHandler.time;
  }
}
