import Svg, { Path, Rect } from "react-native-svg";
import { theme } from "./theme";
/** Aquamundo's outlined triangle mark scales without raster assets. */
export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="1" y="1" width="62" height="62" rx="9" fill={theme.colors.ink} />
      <Path
        d="M30.3 16.4C31 15.1 33 15.1 33.7 16.4L47.2 42.6C47.9 44 47 45.5 45.5 45.5H18.5C17 45.5 16.1 44 16.8 42.6L30.3 16.4Z"
        stroke="white"
        strokeWidth="3.4"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M32 24L40.3 40H24.2L32 24Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
