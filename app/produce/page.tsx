"use client";

import { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import { useWebSocket } from "../context/WebSocketContext";
import { getMediasoupDevice } from "../lib/mediasoup/device";
import {
  useClientIdStore,
  useTransportStore,
} from "../store/useTransportStore";

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
  const { clientId } = useClientIdStore();

  useEffect(() => {
    console.log("cleintid ",clientId)
    const loadDevice = async () => {
      const { device: newDevice, rtpCapabilities: capabilities } =
        await getMediasoupDevice(socket,clientId);
      setDevice(newDevice);
      setRtpCapabilities(capabilities);
    };
    if (clientId && !device && socket.socket?.readyState == WebSocket.OPEN) {
      loadDevice();
    }
  }, [socket.socket?.readyState, clientId]);

  const handleProduce = async () => {
    if (!device || !rtpCapabilities) { 
      console.log("returning")
      return;
    } 

    const handleMessage = async (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.action === "transportsCreated") {
        socket.socket?.removeEventListener("message", handleMessage);

        const producerParams = msg.data.producer;
        const consumerParams = msg.data.consumer;
        console.log("producerParams", producerParams);
        console.log("consumerParams", consumerParams);
        setProducerParams(producerParams);
        setConsumerParams(consumerParams);

        const transport = device.createSendTransport(producerParams);
        setProducerTransport(transport);

        transport.on("connect", ({ dtlsParameters }, callback) => {
          socket.sendMessage(
            "connectProducerTransport",
            clientId,
            dtlsParameters
          );
          callback();
        });

        transport.on("produce", ({ kind, rtpParameters }, callback) => {
          socket.sendMessage("produce", clientId, { kind, rtpParameters });
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const track = stream.getVideoTracks()[0];

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        await transport.produce({
          track,
          encodings: params.encoding,
          codecOptions: params.codecOptions,
        });
      }
    };

    socket.socket?.addEventListener("message", handleMessage);
    socket.sendMessage("createTransports", clientId);
  };

  return (
    <div className="flex justify-center items-center">
      <div>
        <video
          className="bg-gray-400 mt-5 rounded-lg"
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "300px" }}
        />
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer mt-4 "
            onClick={handleProduce}
          >
            Start Producing
          </button>
        </div>
      </div>
    </div>
  );
}
