"use client";

import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { getMediasoupDevice } from "../lib/mediasoup/device";
import {
  useClientIdStore,
  useTransportStore,
} from "../store/useTransportStore";
import { Device } from "mediasoup-client";

export default function Consume() {
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [rtpCapabilities, setRtpCapabilities] = useState<any>(null);
  const [consumerTransport, setConsumerTransport] = useState<any>(null);
  const [producerClientId, setProducerClientId] = useState<string>("");
  const [device, setDevice] = useState<Device | null>(null);
  const { consumerParams, setConsumerParams } = useTransportStore();
  const { clientId } = useClientIdStore();

  const socket = useWebSocket();

  useEffect(() => {
    const loadDevice = async () => {
      const { device: newDevice, rtpCapabilities: capabilities } =
        await getMediasoupDevice(socket, clientId);
      setDevice(newDevice);
      setRtpCapabilities(capabilities);
    };
    if (!device && socket.socket?.readyState == WebSocket.OPEN) {
      loadDevice();
    }
    const handleNewProducer = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.action === "newProducer") {
        setProducerClientId(msg.data.producerClientId);
        socket.socket?.removeEventListener("message", handleNewProducer);
      }
    };
    socket.socket?.addEventListener("message", handleNewProducer);
  }, [socket.socket?.readyState, clientId]);

  const handleConsume = () => {
    if (!device || !rtpCapabilities) return;

    const onTransportsCreated = async (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.action === "transportsCreated") {
        console.log("tfff");
        socket.socket?.removeEventListener("message", onTransportsCreated);

        const consumerParams = msg.data.consumer;
        setConsumerParams(consumerParams);

        const transport = device.createRecvTransport(consumerParams);
        console.log("Recv transport created:", transport.id);

        setConsumerTransport(transport);

        transport.on("connect", async ({ dtlsParameters }, callback) => {
          console.log("connected to consumer transport")
          socket.sendMessage(
            "connectConsumerTransport",
            clientId,
            dtlsParameters
          );
          callback();
        });
        console.log("sending consume mess")
        socket.sendMessage("consume", clientId, {
          rtpCapabilities,
          producerClientId,
        });


        const onConsumerCreated = async (event: MessageEvent) => {
          const msg = JSON.parse(event.data);
          if (msg.action === "consumerCreated") {
            console.log("consumer creaed")
            socket.socket?.removeEventListener("message", onConsumerCreated);

            const { id, kind, rtpParameters, producerId } = msg.data;

            const consumer = await transport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
            });
            console.log("id", id);
            console.log("producerId", producerId);
            console.log("kind", kind);
            console.log("rtpParameters", rtpParameters);

            const stream = new MediaStream();
            stream.addTrack(consumer.track);
            console.log("Stream tracks:", stream.getTracks());
            console.log("Video tracks:", stream.getVideoTracks());
            console.log("Audio tracks:", stream.getAudioTracks());
            const videoTrack = stream.getVideoTracks()[0];
            console.log("🎥 Track readyState:", videoTrack.readyState);
            console.log("🎥 Track muted:", videoTrack.muted); 

            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              remoteVideoRef.current.play();
            }
          }
        };

        socket.socket?.addEventListener("message", onConsumerCreated);
      }
    };

    socket.socket?.addEventListener("message", onTransportsCreated);
    socket.sendMessage("createTransports", clientId);
  };

  return (
    <div className="flex justify-center items-center">
      <div>
        <video
          className="bg-gray-400 mt-5 rounded-lg"
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "300px" }}
        />
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer mt-4 "
            onClick={handleConsume}
          >
            Start Consuming
          </button>
        </div>
      </div>
    </div>
  );
}
