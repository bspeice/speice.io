import {useColorMode} from "@docusaurus/theme-common";

export default function isDarkMode() {
    const {colorMode} = useColorMode();
    return colorMode === "dark";
}