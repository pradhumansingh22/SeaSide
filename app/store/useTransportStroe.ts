import { create } from "zustand";

interface TransportParams {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
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
