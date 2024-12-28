import { css } from "styled-components";

export type GetCssScrollbarParams = {
  width?: string;
  height?: string;
  border?: string;
  outline?: string;
  margin?: string;
  thumbBackground?: string;
  trackBackground?: string;
};

export const getCssScrollbar = (params?: GetCssScrollbarParams) => {
  const {
    width = "10px",
    height = "10px",
    border = "1px solid white",
    outline = "none",
    margin = "0",
    thumbBackground = "#ccc",
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
        // Add margin if outline is set.
        margin: ${margin};
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

// https://stackoverflow.com/questions/9251354/css-customized-scroll-bar-in-div/14150577#14150577
// https://stackoverflow.com/questions/50817727/change-scrollbar-height/53221672#53221672
//  /* pseudo elements */
//  ::-webkit-scrollbar              {  }
//  ::-webkit-scrollbar-button       {  }
//  ::-webkit-scrollbar-track        {  }
//  ::-webkit-scrollbar-track-piece  {  }
//  ::-webkit-scrollbar-thumb        {  }
//  ::-webkit-scrollbar-corner       {  }
//  ::-webkit-resizer                {  }

//  /* pseudo class selectors */
//  :horizontal
//  :vertical
//  :decrement
//  :increment
//  :start
//  :end
//  :double-button
//  :single-button
//  :no-button
//  :corner-present
//  :window-inactive
