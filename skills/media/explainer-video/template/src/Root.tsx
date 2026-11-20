import React from "react";
import { Composition, Folder } from "remotion";
import project from "./data/project.json";
import { styles } from "./styles";
import { StyleFrame } from "./lib/StyleFrame";
import { Compare, compareSize } from "./Compare";

export const RemotionRoot: React.FC = () => {
  const { width, height, fps, durationInFrames } = project;
  const ids = project.styles.filter((id) => styles[id]);
  const cmp = compareSize(ids.length, width, height);
  return (
    <>
      <Folder name="styles">
        {ids.map((id) => (
          <Composition
            key={id}
            id={id}
            component={StyleFrame}
            defaultProps={{ styleId: id }}
            width={width}
            height={height}
            fps={fps}
            durationInFrames={durationInFrames}
          />
        ))}
      </Folder>
      {ids.length > 1 ? (
        <Composition
          id="compare"
          component={Compare}
          defaultProps={{ ids }}
          width={cmp.width}
          height={cmp.height}
          fps={fps}
          durationInFrames={durationInFrames}
          calculateMetadata={({ props }) => compareSize(props.ids.length, width, height)}
        />
      ) : null}
    </>
  );
};
