import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, ImageStyle, StyleProp } from 'react-native';

type Props = {
  imageUri: string;
  onImageLoad: (imageUri: string) => void;
  readyImageUris: string[];
  style: StyleProp<ImageStyle>;
};

const BACKGROUND_CROSSFADE_DURATION_MS = 220;

const AffirmationBackgroundImage: React.FC<Props> = ({
  imageUri,
  onImageLoad,
  readyImageUris,
  style,
}) => {
  const [visibleImageUri, setVisibleImageUri] = useState(imageUri);
  const [settledOverlayUri, setSettledOverlayUri] = useState<string | null>(
    null,
  );
  const requestedImageUriRef = useRef(imageUri);
  const startedTransitionUriRef = useRef<string | null>(null);
  const incomingTransition = useMemo(
    () => ({ imageUri, opacity: new Animated.Value(0) }),
    [imageUri],
  );
  const incomingOpacity = incomingTransition.opacity;
  const isTransitioning = imageUri !== visibleImageUri;
  const incomingImageUri = isTransitioning ? imageUri : settledOverlayUri;
  const isVisibleImageReady = readyImageUris.includes(visibleImageUri);

  requestedImageUriRef.current = imageUri;

  useEffect(
    () => () => {
      incomingOpacity.stopAnimation();
    },
    [incomingOpacity],
  );

  const startCrossfade = useCallback(() => {
    if (
      !isTransitioning ||
      startedTransitionUriRef.current === imageUri
    ) {
      return;
    }

    startedTransitionUriRef.current = imageUri;
    Animated.timing(incomingOpacity, {
      duration: BACKGROUND_CROSSFADE_DURATION_MS,
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && requestedImageUriRef.current === imageUri) {
        setSettledOverlayUri(imageUri);
        setVisibleImageUri(imageUri);
      }
    });
  }, [imageUri, incomingOpacity, isTransitioning]);

  useEffect(() => {
    if (isTransitioning && readyImageUris.includes(imageUri)) {
      startCrossfade();
    }
  }, [imageUri, isTransitioning, readyImageUris, startCrossfade]);

  return (
    <>
      <Animated.Image
        accessibilityIgnoresInvertColors
        onLoad={() => {
          onImageLoad(visibleImageUri);
          if (settledOverlayUri === visibleImageUri) {
            setSettledOverlayUri(null);
          }
        }}
        resizeMode="cover"
        source={{ uri: visibleImageUri }}
        style={[style, !isVisibleImageReady && { opacity: 0 }]}
        testID="image-affirmation-background"
      />
      {incomingImageUri !== null ? (
        <Animated.Image
          accessibilityIgnoresInvertColors
          key={incomingImageUri}
          onLoad={() => {
            onImageLoad(incomingImageUri);
            startCrossfade();
          }}
          resizeMode="cover"
          source={{ uri: incomingImageUri }}
          style={[style, { opacity: incomingOpacity }]}
          testID="image-affirmation-background-incoming"
        />
      ) : null}
    </>
  );
};

export default AffirmationBackgroundImage;
