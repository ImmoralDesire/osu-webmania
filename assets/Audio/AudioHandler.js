import {
  Audio
} from './Audio.js';

export class AudioHandler {
  constructor() {
    this.offset = -40;

    this.currentTrack = '';
    this.tracks = [];

    this.offsets = [];
    this.sum = 0;
  }

  init() {
    try {
      this.context = new(window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log("Your browser doesn't support Web Audio API");
    }

    this.update();
  }

  loadSound(name, data, url) {
    let audio = new Audio();
    audio.source = this.context.createBufferSource();
    //connect it to the destination so you can hear it.
    return new Promise((resolve, reject) => {
      if (!url) {
        var fileReader = new FileReader();
        fileReader.onloadend = () => {
          audio.source.connect(this.context.destination);
          this.context.decodeAudioData(fileReader.result, (buffer) => {
            // save buffer, to not load again
            //saved = buffer;
            audio.buffer = buffer;
            audio.source.buffer = buffer;
            this.tracks[name] = audio;
            this.setTrack();
            resolve(audio);
            //And off we go! .start(0) should play asap.
          });
        };

        fileReader.readAsArrayBuffer(data);
      } else {
        var request = new XMLHttpRequest();
        request.open('GET', data, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
          audio.source.connect(this.context.destination);
          this.context.decodeAudioData(request.response, (buffer) => {
            audio.buffer = buffer;
            audio.source.buffer = buffer;
            this.tracks[name] = audio;
            this.setTrack();
            resolve(audio);
          });
        };

        request.send();
      }
    });

  }

  setTrack() {
    this.currentTrack = this.tracks[0];
  }

  getTrack() {
    return this.currentTrack;
  }

  playSound() {
    this.currentTrack.startTime = this.time;
    console.log(this.currentTrack.startTime);
    this.currentTrack.source.playbackRate.value = game.speed;
    this.currentTrack.source.start(this.context.currentTime + 2);
    this.currentTrack.playing = true;
    this.currentTrack.offset = this.time;
    console.log(this.currentTrack.offset);
  }

  update() {
    let realTime = window.performance.now();
    let delta = realTime - this.context.currentTime * 1000;
    this.offsets.push(delta)
    this.sum += delta
    while (this.offsets.length > 60) {
      this.sum -= this.offsets.shift();
    }

    this.time = (realTime - this.sum / this.offsets.length);
  }

  getCurrentTime() {
    //console.log("GAYT:" + (this.offset));
    if (!this.currentTrack.playing) {
      return -2000;
    }


    return (this.time - this.currentTrack.offset + this.offset) * game.speed - 2000; //this.context.currentTime * 1000 - this.offset;
  }
}
