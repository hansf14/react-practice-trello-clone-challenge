import { css } from "styled-components";

export type GetCssScrollbarParams = {
  width?: string;
  height?: string;
  border?: string;
  outline?: string;
  thumbBackground?: string;
  trackBackground?: string;
};

export const getCssScrollbar = (params?: GetCssScrollbarParams) => {
  const {
    width = "10px",
    height = "10px",
    border = "1px solid white",
    outline = "none",
    thumbBackground = "white",
    trackBackground = "transparent",
  } = params ?? {};
  return css`
    @supports (
      selector(&::-webkit-scrollbar) or selector(&::-webkit-scrollbar-thumb)
    ) {
      &::-webkit-scrollbar {
        width: ${width};
        height: ${height};
        border: ${border};
        outline: ${outline};
      }
      &::-webkit-scrollbar-thumb {
        background: ${thumbBackground};
      }
      &::-webkit-scrollbar-track {
        background: ${trackBackground};
      }

      /* &::-webkit-scrollbar:horizontal {
        height: 0;
      } */
    }
    @supports not (
      selector(&::-webkit-scrollbar) or selector(&::-webkit-scrollbar-thumb)
    ) {
    }
  `;
};
// scrollbar-color: ${thumbBackground} ${trackBackground};
// scrollbar-width: thin;
