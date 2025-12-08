"use client";

import { useEffect, useState } from "react";

export function useJupiterPrice(priceFeedId) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (!priceFeedId) return;

    const ws = new WebSocket("wss://price.jup.ag/v4/ws");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          price_feed_ids: [priceFeedId],
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      // pyth price format
      if (data?.price && data.price.price) {
        setPrice(data.price.price);
      }
    };

    return () => ws.close();
  }, [priceFeedId]);

  return price;
}
