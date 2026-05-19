"use client";

import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const removeWidget = () => {
      const selectors = [
        "#chat-widget-container",
        "#lc-compound-widget-container",
        "[data-widget-id='6a01ef3b205bf897ae837633']",
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

    removeWidget();
    const interval = setInterval(removeWidget, 500);
    const observer = new MutationObserver(removeWidget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
