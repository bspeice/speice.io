import {useColorMode} from "@docusaurus/theme-common";
import React from "react";

interface Props {
    srcLight: string;
    srcDark: string;
    alt: string;
}
const DualImage = ({srcLight, srcDark, alt}: Props) => {
    const {colorMode} = useColorMode();
    return <img src={colorMode === "dark" ? srcDark : srcLight} alt={alt} />
}
export default DualImage;