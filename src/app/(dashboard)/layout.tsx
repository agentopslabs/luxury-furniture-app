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
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
    };

    removeWidget();

    const observer = new MutationObserver(removeWidget);
    observer.observe(document.body, { childList: true, subtree: false });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
