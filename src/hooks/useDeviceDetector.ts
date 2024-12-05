// navigator.maxTouchPoints is always = 1 on dev tool simulation mode

import { useCallback } from "react";

export const getDeviceDetector = () => {
  const userAgent =
    typeof navigator === "undefined" ? "SSR" : navigator.userAgent;
  // console.log(userAgent);

  const getIsSSR = () => Boolean(userAgent.match(/SSR/i));
  const isSSR = getIsSSR();

  const getIsAndroid = () =>
    !isSSR &&
    Boolean(userAgent.match(/Android/i)) &&
    navigator?.maxTouchPoints !== 1;
  const getIsIos = () =>
    !isSSR &&
    Boolean(userAgent.match(/iPhone|iPad|iPod/i)) &&
    navigator?.maxTouchPoints !== 1;
  const getIsOperaMini = () => Boolean(userAgent.match(/Opera Mini/i));
  const getIsWindowsPhone = () =>
    !isSSR &&
    Boolean(userAgent.match(/IEMobile|windows phone/i)) &&
    navigator?.maxTouchPoints !== 1;
  const getIsBlackberryPhone = () =>
    !isSSR &&
    Boolean(userAgent.match(/blackberry/i)) &&
    navigator?.maxTouchPoints !== 1;

  const getIsEmulatorWebkit = () => userAgent.indexOf("Mobile") !== -1;

  const getIsMobile = () =>
    !isSSR &&
    (getIsAndroid() ||
      getIsIos() ||
      getIsOperaMini() ||
      getIsWindowsPhone() ||
      getIsBlackberryPhone());
  const getIsTablet = () =>
    !isSSR &&
    Boolean(
      userAgent.match(/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i),
    ) &&
    navigator?.maxTouchPoints !== 1;

  const getIsDesktop = () =>
    (!isSSR && !getIsMobile() && !getIsTablet()) || getIsEmulatorWebkit();
  const getIsTouchDevice = () =>
    !isSSR && (getIsMobile() || getIsTablet() || getIsEmulatorWebkit());

  return {
    getIsSSR,
    getIsAndroid,
    getIsIos,
    getIsOperaMini,
    getIsWindowsPhone,
    getIsBlackberryPhone,
    getIsEmulatorWebkit,
    getIsMobile,
    getIsTablet,
    getIsDesktop,
    getIsTouchDevice,
  };
};

export const useDeviceDetector = () => {
  // const [detector, setDetector] = useState<ReturnType<typeof getDetector>>(
  //   getDetector(userAgent)
  // );
  // useIsomorphicLayoutEffect(() => {
  //   userAgent = typeof navigator === "undefined" ? "SSR" : navigator.userAgent;
  //   setDetector(getDetector(userAgent));
  // }, []);

  const detector = getDeviceDetector();

  const isSSR = detector.getIsSSR();
  const isAndroid = detector.getIsAndroid();
  const isIos = detector.getIsIos();
  const isWindowsPhone = detector.getIsWindowsPhone();
  const isBlackberryPhone = detector.getIsBlackberryPhone();
  const isMobile = detector.getIsMobile();
  const isTablet = detector.getIsTablet();
  const isDesktop = detector.getIsDesktop();

  const debugDeviceDetector = useCallback(() => {
    console.log("isSSR", detector.getIsSSR());
    console.log("isAndroid", detector.getIsAndroid());
    console.log("isIos", detector.getIsIos());
    console.log("isWindowsPhone", detector.getIsWindowsPhone());
    console.log("isBlackberryPhone", detector.getIsBlackberryPhone());
    console.log("isMobile", detector.getIsMobile());
    console.log("isTablet", detector.getIsTablet());
    console.log("isDesktop", detector.getIsDesktop());
  }, [detector]);

  return {
    isSSR,
    isAndroid,
    isIos,
    isWindowsPhone,
    isBlackberryPhone,
    isMobile,
    isTablet,
    isDesktop,
    getDeviceDetector,
    debugDeviceDetector,
  };
};
