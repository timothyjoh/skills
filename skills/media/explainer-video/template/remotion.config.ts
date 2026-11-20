import { Config } from "@remotion/cli/config";

// ANGLE gives three.js a working WebGL context in headless Chrome on macOS and Linux.
Config.setChromiumOpenGlRenderer("angle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
