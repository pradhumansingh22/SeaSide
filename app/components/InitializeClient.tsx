"use client";

import { useEffect } from "react";
import { useClientIdStore } from "../store/useTransportStore";

export function InitializeClient() {
  const { setClientId, clientId } = useClientIdStore();

  useEffect(() => {
    const newId = crypto.randomUUID();
      setClientId(newId);
  }, []);


  return null; 
}
