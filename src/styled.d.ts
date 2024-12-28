import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    background: string;
    scrollbarBorder: string;
    scrollbarOutline: string;
    scrollbarThumbBackground: string;
    scrollbarTrackBackground: string;
  }
}
