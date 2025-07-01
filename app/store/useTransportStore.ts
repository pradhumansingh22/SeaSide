import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TransportParams {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
}

interface ClientIdType {
  clientId: string;
  setClientId: (clientId: string) => void;
}

interface TransportStore {
  producerParams: TransportParams | null;
  consumerParams: TransportParams | null;
  setProducerParams: (params: TransportParams) => void;
  setConsumerParams: (params: TransportParams) => void;
}

export const useTransportStore = create<TransportStore>((set) => ({
  producerParams: null,
  consumerParams: null,
  setProducerParams: (producerParams) => set({ producerParams }),
  setConsumerParams: (consumerParams) => set({ consumerParams }),
}));

export const useClientIdStore = create<ClientIdType>()(
  persist(
    (set) => ({
      clientId: "",
      setClientId: (clientId) => set({ clientId }),
    }),
    { name: "client-id-storage" }
  )
);
