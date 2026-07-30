import {
  EVIWebAudioPlayer,
  HumeClient,
  convertBlobToBase64,
  ensureSingleValidAudioTrack,
  getBrowserSupportedMimeType,
} from "hume";

globalThis.BlueOriginHumeSDK = Object.freeze({
  EVIWebAudioPlayer,
  HumeClient,
  convertBlobToBase64,
  ensureSingleValidAudioTrack,
  getBrowserSupportedMimeType,
});
