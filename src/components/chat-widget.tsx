"use client";

import { useEffect } from "react";

const WIDGET_ID = "6a01ef3b205bf897ae837633";
const SCRIPT_ID = "ghl-chat-widget-script";

export default function ChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://widgets.leadconnectorhq.com/loader.js";
    script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
    script.setAttribute("data-widget-id", WIDGET_ID);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) existingScript.remove();

      const selectors = [
        "#chat-widget-container",
        "#lc-compound-widget-container",
        `[data-widget-id='${WIDGET_ID}']`,
        ".lc-chat-widget",
        "#leadconnector-chat-widget",
        "iframe[src*='leadconnectorhq']",
        "iframe[src*='widgets.leadconnectorhq']",
        "div[id*='chat-widget']",
        "div[class*='chat-widget']",
        "div[id*='lc-']",
        "div[class*='lc-']",
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
    };
  }, []);

  return null;
}
