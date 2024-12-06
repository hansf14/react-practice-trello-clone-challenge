import { css } from "styled-components";

export const CssScrollbar = css`
  @supports (
    selector(&::-webkit-scrollbar) or selector(&::-webkit-scrollbar-thumb)
  ) {
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      border: 1px solid white;
    }
    &::-webkit-scrollbar-thumb {
      background-color: white;
    }

    /* &::-webkit-scrollbar:horizontal {
      height: 0;
    } */
  }
  @supports not (
    selector(&::-webkit-scrollbar) or selector(&::-webkit-scrollbar-thumb)
  ) {
    scrollbar-color: white transparent;
    scrollbar-width: thin;
  }
`;
