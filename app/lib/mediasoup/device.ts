"use client";

import { WebSocketContextType } from "@/app/context/WebSocketContext";
import { useClientIdStore } from "@/app/store/useTransportStore";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/types";

let device: Device | null = null;
let rtpCapabilities: RtpCapabilities | null = null;

export const getMediasoupDevice = async (socket: WebSocketContextType,clientId:string) => {
  if (device && rtpCapabilities) {
    console.log("returning...jhj");
    return { device, rtpCapabilities };
  }
  console.log("cleiintitdd",clientId)

  socket.sendMessage("getRtpCapabilities", clientId);

  const capabilities = await new Promise<any>((resolve) => {
    const listener = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      console.log("message-->", msg);
      if (msg.action === "rtpCapabilities") {
        socket.socket?.removeEventListener("message", listener);
        resolve(msg.data);
      }
    };
    socket.socket?.addEventListener("message", listener);
  });

  device = new Device();
  rtpCapabilities = capabilities;
  if (rtpCapabilities) {
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    console.log("device created");
  }

  return { device, rtpCapabilities };
};
