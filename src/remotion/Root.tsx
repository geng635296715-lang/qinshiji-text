import React from 'react';
import {Composition} from 'remotion';
import {QingShijiLoop} from './QingShijiLoop';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="QingShijiLoop"
      component={QingShijiLoop}
      durationInFrames={1800}
      fps={30}
      width={1672}
      height={940}
    />
  );
};
