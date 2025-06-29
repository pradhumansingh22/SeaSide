import { useWebSocket } from "@/app/context/WebSocketContext";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/types";

let device: Device | null = null;
let rtpCapabilities: RtpCapabilities | null = null;

export const getMediasoupDevice = async () => {
  if (device && rtpCapabilities) return { device, rtpCapabilities };
  const socket = useWebSocket();
  socket.sendMessage("getRtpCapabilities", "123");

  const msg = socket.lastMessage;
  if (msg.action === "rtpCapabilities") {
    device = new Device();
    rtpCapabilities = msg.data;
    if (rtpCapabilities)
      await device.load({ routerRtpCapabilities: rtpCapabilities });
  }
  return { device, rtpCapabilities };
};
