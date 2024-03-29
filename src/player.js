import { play, stop, download, getNextSegment } from "@zerochain/zus-sdk";

export const stopPlay = async ({ videoElement }) => {
  if (!videoElement) {
    throw new Error("video element is required");
  }

  await stop();

  videoElement.pause();
  URL.revokeObjectURL(videoElement.src);
};

export const startPlay = async ({
  allocationId,
  videoElement,
  remotePath,
  authTicket = "",
  lookupHash = "",
  mimeType = "",
  isLive = false,
}) => {
  if (!videoElement) {
    throw new Error("video element is required");
  }

  await play(allocationId, remotePath, authTicket, lookupHash, isLive);

  if (isLive) {
    return playStream({
      videoElement,
      allocationId,
      remotePath,
      authTicket,
      lookupHash,
    });
  }

  // first segment
  const buf = await getNextSegment();

  const { isFragmented, mimeCodecs } = getMimeCodecs({ mimeType, buf });

  // const mimeCodecs = `${mimeType};
  // codecs="${muxjs.mp4.probe.tracks(buf).map(t => t.codec).join(",")}"`;
  // console.log(
  //   `playlist: isFragmented:${isFragmented} mimeCodecs:${mimeCodecs}`
  // );

  if (isFragmented && MediaSource.isTypeSupported(mimeCodecs)) {
    return playChunks({ videoElement, buf, mimeCodecs });
  }

  stop();
  // allocationID, remotePath, authTicket, lookupHash string,
  // downloadThumbnailOnly, autoCommit bool
  const { url } = await download(
    allocationId,
    remotePath,
    authTicket,
    lookupHash,
    false,
    false
  );

  videoElement.src = url;
  videoElement.crossOrigin = "anonymous";
  videoElement.play();
};

export const playStream = async ({
  videoElement,
  allocationId,
  remotePath,
  authTicket,
  lookupHash,
}) => {
  await play(allocationId, remotePath, authTicket, lookupHash, true);

  const mimeCodecs = 'video/mp4; codecs="mp4a.40.2,avc1.64001f"';

  if ("MediaSource" in window && MediaSource.isTypeSupported(mimeCodecs)) {
    let sourceBuffer;

    const transmuxer = new muxjs.mp4.Transmuxer();
    const mediaSource = new MediaSource();

    const getNextFileSegment = async () => {
      try {
        const buf = await getNextSegment();

        if (buf?.length > 0) {
          transmuxer.push(new Uint8Array(buf));
          transmuxer.flush();
        }
      } catch (err) {
        getNextFileSegment();
      }
    };

    transmuxer.on("data", (segment) => {
      const data = new Uint8Array(
        segment.initSegment.byteLength + segment.data.byteLength
      );
      data.set(segment.initSegment, 0);
      data.set(segment.data, segment.initSegment.byteLength);
      // To inspect data use =>
      // console.log(muxjs.mp4.tools.inspect(data));
      sourceBuffer.appendBuffer(data);
    });

    mediaSource.addEventListener("sourceopen", async () => {
      sourceBuffer = mediaSource.addSourceBuffer(mimeCodecs);
      sourceBuffer.mode = "sequence";
      sourceBuffer.addEventListener("updateend", getNextFileSegment);

      await getNextFileSegment();

      videoElement.play();

      URL.revokeObjectURL(videoElement.src);
    });

    videoElement.src = URL.createObjectURL(mediaSource);
    videoElement.crossOrigin = "anonymous";
  } else {
    throw new Error("Unsupported MIME type or codec: ", mimeCodecs);
  }
};

export const playChunks = async ({ videoElement, buf, mimeCodecs }) => {
  let sourceBuffer;

  const mediaSource = new MediaSource();

  videoElement.src = URL.createObjectURL(mediaSource);
  videoElement.crossOrigin = "anonymous";

  const getNextFileSegment = async () => {
    try {
      const buffer = await getNextSegment();

      if (buffer?.length > 0) {
        sourceBuffer.appendBuffer(new Uint8Array(buffer));
      } else {
        if (!sourceBuffer.updating && mediaSource.readyState === "open") {
          mediaSource.endOfStream();
        }
      }
    } catch (err) {
      getNextFileSegment();
    }
  };

  mediaSource.addEventListener("sourceopen", async () => {
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodecs);
    sourceBuffer.mode = "sequence";
    sourceBuffer.addEventListener("updateend", getNextFileSegment);
    sourceBuffer.appendBuffer(buf);
    videoElement.play();
  });
};

export const detectMp4 = ({ mimeType, buf }) => {
  const isFragmented =
    muxjs.mp4.probe.findBox(buf, ["moov", "mvex"]).length > 0 ? true : false;

  return {
    isFragmented,
    mimeCodecs: `${mimeType}; codecs="${muxjs.mp4.probe
      .tracks(buf)
      .map((t) => t.codec)
      .join(",")}"`,
  };
};

export const detectWebm = ({ mimeType, buf }) => {
  const decoder = new EBML.Decoder();
  const codecs = decoder
    .decode(buf)
    .filter((it) => it.name == "CodecID")
    .map((it) => it.value.replace(/^(V_)|(A_)/, "").toLowerCase())
    .join(",");
  return {
    isFragmented: true,
    mimeCodecs: `${mimeType}; codecs="${codecs}"`,
  };
};

const detectors = {
  "video/mp4": detectMp4,
  "audio/mp4": detectMp4,
  "video/webm": detectWebm,
  "audio/webm": detectWebm,
};

export const getMimeCodecs = ({ mimeType, buf }) => {
  const detect = detectors[mimeType];
  if (detect) {
    return detect({ mimeType, buf });
  }
  return mimeType;
};
