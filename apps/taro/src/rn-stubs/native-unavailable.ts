/**
 * RN 平台「不可用原生模块」占位桩
 * ============================================================================
 * 为什么需要它:
 *   @tarojs/components-rn 与 @tarojs/taro-rn 的 barrel 文件会无差别 re-export
 *   全部组件 / 全部 API, 其中一部分依赖重量级原生模块:
 *     expo-camera / expo-av / expo-sensors / expo-file-system / expo-image-picker
 *     expo-location / expo-brightness / expo-keep-awake / expo-barcode-scanner
 *     react-native-maps / react-native-webview / react-native-pager-view
 *     @react-native-community/slider / @react-native-camera-roll/camera-roll
 *   metro 是静态依赖图 —— 只要 barrel 里有一行 import, 它就必须能被解析,
 *   否则整个 RN bundle 直接构建失败, 与我们是否真的用到该组件无关。
 *
 *   而 FormulaLab 的移动端只用了 View / Text / Input / Textarea / ScrollView
 *   这几个纯 RN 组件, 上面那批原生模块一个都用不到。
 *   装了它们 = 多一堆 Gradle 原生编译 + Expo 运行时依赖, 只会拖慢构建、抬高失败率。
 *
 * 做法:
 *   在 config/index.ts 的 rn.alias 里, 把这些包名统一指向本文件。
 *   组件代码在 import 期只做属性读取, 不会在模块初始化时调用这些 API,
 *   因此桩对象可以是空壳; 真到了调用时抛「未实现」错误, 语义清晰。
 *
 * 将来若确实要用某个能力 (比如扫码 / 地图 / 音视频),
 * 把对应包名从 rn.alias 里删掉, 改回真装依赖即可。
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const notImplemented = (name: string) => () => {
  throw new Error(
    `[FormulaLab] RN 平台未启用 ${name} —— 该能力依赖的原生模块在 config/index.ts 的 rn.alias 中被桩替换。`
  )
}

// ---- expo-camera ----------------------------------------------------------
export const Camera: any = {
  requestCameraPermissionsAsync: notImplemented('Camera.requestCameraPermissionsAsync'),
  getCameraPermissionsAsync: notImplemented('Camera.getCameraPermissionsAsync'),
  takePictureAsync: notImplemented('Camera.takePictureAsync'),
}
export const CameraType: any = { back: 'back', front: 'front' }
export const PermissionStatus: any = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
}

// ---- expo-av --------------------------------------------------------------
export const Audio: any = {
  requestRecordingPermissionsAsync: notImplemented('Audio.requestRecordingPermissionsAsync'),
  setAudioModeAsync: notImplemented('Audio.setAudioModeAsync'),
}
export const ResizeMode: any = { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' }
export const Video: any = {}

// ---- expo-sensors ---------------------------------------------------------
export const Accelerometer: any = {
  setUpdateInterval: notImplemented('Accelerometer.setUpdateInterval'),
  addListener: notImplemented('Accelerometer.addListener'),
}
export const DeviceMotion: any = {
  setUpdateInterval: notImplemented('DeviceMotion.setUpdateInterval'),
  addListener: notImplemented('DeviceMotion.addListener'),
}
export const Gyroscope: any = {
  setUpdateInterval: notImplemented('Gyroscope.setUpdateInterval'),
  addListener: notImplemented('Gyroscope.addListener'),
}

// ---- expo-file-system (namespace 导入) ------------------------------------
export const documentDirectory: string = ''
export const cacheDirectory: string = ''
export const readAsStringAsync: any = notImplemented('FileSystem.readAsStringAsync')
export const writeAsStringAsync: any = notImplemented('FileSystem.writeAsStringAsync')
export const getInfoAsync: any = notImplemented('FileSystem.getInfoAsync')
export const makeDirectoryAsync: any = notImplemented('FileSystem.makeDirectoryAsync')
export const readDirectoryAsync: any = notImplemented('FileSystem.readDirectoryAsync')
export const deleteAsync: any = notImplemented('FileSystem.deleteAsync')
export const copyAsync: any = notImplemented('FileSystem.copyAsync')
export const moveAsync: any = notImplemented('FileSystem.moveAsync')
export const uploadAsync: any = notImplemented('FileSystem.uploadAsync')
export const downloadAsync: any = notImplemented('FileSystem.downloadAsync')

// ---- expo-image-picker ----------------------------------------------------
export const getMediaLibraryPermissionsAsync: any = notImplemented(
  'ImagePicker.getMediaLibraryPermissionsAsync'
)
export const requestMediaLibraryPermissionsAsync: any = notImplemented(
  'ImagePicker.requestMediaLibraryPermissionsAsync'
)
export const launchCameraAsync: any = notImplemented('ImagePicker.launchCameraAsync')
export const launchImageLibraryAsync: any = notImplemented('ImagePicker.launchImageLibraryAsync')
export const MediaTypeOptions: any = { Images: 'Images', Video: 'Video', All: 'All' }
export type ImagePickerAsset = any

// ---- expo-location --------------------------------------------------------
export const getForegroundPermissionsAsync: any = notImplemented(
  'Location.getForegroundPermissionsAsync'
)
export const requestForegroundPermissionsAsync: any = notImplemented(
  'Location.requestForegroundPermissionsAsync'
)
export const getCurrentPositionAsync: any = notImplemented('Location.getCurrentPositionAsync')
export const watchPositionAsync: any = notImplemented('Location.watchPositionAsync')

// ---- expo-brightness (namespace 导入) -------------------------------------
export const setBrightnessAsync: any = notImplemented('Brightness.setBrightnessAsync')
export const getBrightnessAsync: any = notImplemented('Brightness.getBrightnessAsync')
export const setSystemBrightnessAsync: any = notImplemented('Brightness.setSystemBrightnessAsync')
export const getSystemBrightnessAsync: any = notImplemented('Brightness.getSystemBrightnessAsync')

// ---- expo-keep-awake ------------------------------------------------------
export const activateKeepAwake: any = notImplemented('KeepAwake.activateKeepAwake')
export const deactivateKeepAwake: any = notImplemented('KeepAwake.deactivateKeepAwake')

// ---- expo-barcode-scanner -------------------------------------------------
export const BarCodeScanner: any = {}
export const requestPermissionsAsync: any = notImplemented('BarCodeScanner.requestPermissionsAsync')

// ---- @react-native-camera-roll/camera-roll --------------------------------
export const CameraRoll: any = {
  getPhotos: notImplemented('CameraRoll.getPhotos'),
  save: notImplemented('CameraRoll.save'),
}

// ---- react-native-maps ----------------------------------------------------
export const Callout: any = {}
export const Circle: any = {}
export const Marker: any = {}
export const Polygon: any = {}
export const Polyline: any = {}

// ---- react-native-webview -------------------------------------------------
export const WebView: any = {}

// ---- react-native-pager-view ---------------------------------------------
export const ViewPager: any = {}

// ---- @react-native-community/slider ---------------------------------------
export const Slider: any = {}

// ---- react-native-svg (components-rn/Image 里 require) --------------------
export const SvgXml: any = {}
export const SvgCssUri: any = {}

// ---- @bam.tech/react-native-image-resizer ----------------------------------
export const ImageResizer: any = {
  createResizedImage: notImplemented('ImageResizer.createResizedImage'),
}

// ---- @react-native-clipboard/clipboard -------------------------------------
export const Clipboard: any = {
  getString: notImplemented('Clipboard.getString'),
  setString: notImplemented('Clipboard.setString'),
}

// ---- @react-native-community/geolocation -----------------------------------
export const Geolocation: any = {
  getCurrentPosition: notImplemented('Geolocation.getCurrentPosition'),
  requestAuthorization: notImplemented('Geolocation.requestAuthorization'),
  watchPosition: notImplemented('Geolocation.watchPosition'),
}

// ---- @react-native-community/netinfo ---------------------------------------
export const NetInfoStateType: any = {
  unknown: 'unknown',
  none: 'none',
  cellular: 'cellular',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  ethernet: 'ethernet',
  other: 'other',
}
export const NetInfo: any = {
  fetch: notImplemented('NetInfo.fetch'),
  addEventListener: notImplemented('NetInfo.addEventListener'),
  configure: notImplemented('NetInfo.configure'),
}

// ---- react-native-image-zoom-viewer ----------------------------------------
export const ImageViewer: any = {}

export default {
  Camera,
  CameraType,
  PermissionStatus,
  Audio,
  ResizeMode,
  Video,
  Accelerometer,
  DeviceMotion,
  Gyroscope,
  FileSystem: {
    documentDirectory,
    cacheDirectory,
    readAsStringAsync,
    writeAsStringAsync,
    getInfoAsync,
    makeDirectoryAsync,
    readDirectoryAsync,
    deleteAsync,
    copyAsync,
    moveAsync,
    uploadAsync,
    downloadAsync,
  },
  ImagePicker: {
    getMediaLibraryPermissionsAsync,
    requestMediaLibraryPermissionsAsync,
    launchCameraAsync,
    launchImageLibraryAsync,
  },
  Location: {
    getForegroundPermissionsAsync,
    requestForegroundPermissionsAsync,
    getCurrentPositionAsync,
    watchPositionAsync,
  },
  Brightness: {
    setBrightnessAsync,
    getBrightnessAsync,
    setSystemBrightnessAsync,
    getSystemBrightnessAsync,
  },
  KeepAwake: { activateKeepAwake, deactivateKeepAwake },
  BarCodeScanner: { BarCodeScanner, requestPermissionsAsync },
  CameraRoll,
  MapView: {},
  Callout,
  Circle,
  Marker,
  Polygon,
  Polyline,
  WebView,
  ViewPager,
  Slider,
  SvgXml,
  SvgCssUri,
  ImageResizer,
  Clipboard,
  Geolocation,
  NetInfo,
  NetInfoStateType,
  ImageViewer,
}
