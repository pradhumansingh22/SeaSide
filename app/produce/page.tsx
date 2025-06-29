import { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import { useWebSocket } from "../context/WebSocketContext";
import { getMediasoupDevice } from "../lib/mediasoup/device";
import { useTransportStore } from "../store/useTransportStroe";

export default function Produce() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [params, setParams] = useState({
    encoding: [
      { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
      { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
      { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
    ],
    codecOptions: { videoGoogleStartBitrate: 1000 },
  });
  const [device, setDevice] = useState<Device | null>(null);
  const [producerTransport, setProducerTransport] = useState<any>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<any>(null);
  const socket = useWebSocket();
  const { setProducerParams, setConsumerParams } = useTransportStore();

  useEffect(() => {
    const loadDevice = async () => {
      const { device: newDevice, rtpCapabilities: capabilities } =
        await getMediasoupDevice();
      setDevice(newDevice);
      setRtpCapabilities(capabilities);
    };
    loadDevice();
  }, []);

  const handleProduce = async () => {
    socket.sendMessage("createTransports", "123");
    setTimeout(async () => {
      const msg = socket.lastMessage;
      if (msg.action === "transportsCreated") {
        const producerParams = msg.data.producer;
        const consumerParams = msg.data.consumer;
        setProducerParams(producerParams);
        setConsumerParams(consumerParams);
        const transport = device?.createSendTransport(producerParams);
        setProducerTransport(transport);

        transport?.on("connect", ({ dtlsParameters }, callback) => {
          socket.sendMessage("connectProducerTransport", "123", {
            dtlsParameters,
          });
          callback();
        });

        transport?.on("produce", ({ kind, rtpParameters }, callback) => {
          socket.sendMessage("produce", "123", {
            transportId: transport.id,
            kind,
            rtpParameters,
          });
          setTimeout(() => {
            const msg = socket.lastMessage;
            if (msg.action === "newProducer") {
              callback({ id: msg.data.id });
            }
          }, 200);
        });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const track = stream.getVideoTracks()[0];
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        await transport?.produce({
          track,
          encodings: params.encoding,
          codecOptions: params.codecOptions,
        });
      }
    }, 200);
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "300px" }}
      />
      <button onClick={handleProduce}>Start Producing</button>
    </div>
  );
}
