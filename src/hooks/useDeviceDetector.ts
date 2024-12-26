// navigator.maxTouchPoints is always = 1 on dev tool simulation mode

import { observeUserAgentChange, ObserveUserAgentChangeCb } from "@/utils";
import { useCallback, useEffect, useState } from "react";

export type DeviceEnvironmentChangeCb = ObserveUserAgentChangeCb;

export const useDeviceDetector = (params?: {
  cb?: DeviceEnvironmentChangeCb;
}) => {
  const [stateUserAgent, setStateUserAgent] = useState<string>(() =>
    typeof navigator === "undefined" ? "SSR" : navigator.userAgent,
  );

  useEffect(() => {
    const disconnect = observeUserAgentChange({
      cb: ({ prevUserAgent, curUserAgent }) => {
        setStateUserAgent(curUserAgent);
        params?.cb?.({ prevUserAgent, curUserAgent });
      },
    });

    return () => {
      disconnect();
    };
  }, [params, params?.cb]);

  const getDeviceDetector = useCallback(() => {
    const getIsSSR = () => Boolean(stateUserAgent.match(/SSR/i));
    const isSSR = getIsSSR();

    const getIsAndroid = () =>
      !isSSR &&
      Boolean(stateUserAgent.match(/Android/i)) &&
      navigator?.maxTouchPoints !== 1;
    const getIsIos = () =>
      !isSSR &&
      Boolean(stateUserAgent.match(/iPhone|iPad|iPod/i)) &&
      navigator?.maxTouchPoints !== 1;
    const getIsOperaMini = () => Boolean(stateUserAgent.match(/Opera Mini/i));
    const getIsWindowsPhone = () =>
      !isSSR &&
      Boolean(stateUserAgent.match(/IEMobile|windows phone/i)) &&
      navigator?.maxTouchPoints !== 1;
    const getIsBlackberryPhone = () =>
      !isSSR &&
      Boolean(stateUserAgent.match(/blackberry/i)) &&
      navigator?.maxTouchPoints !== 1;

    const getIsEmulatorWebkit = () => stateUserAgent.indexOf("Mobile") !== -1;

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
        stateUserAgent.match(
          /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i,
        ),
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
  }, [stateUserAgent]);

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
