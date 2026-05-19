"use client";

import { useEffect } from "react";

const WIDGET_CSS_ID = "hide-chat-widget-style";

const HIDE_CSS = `
  #chat-widget-container,
  #lc-compound-widget-container,
  [data-widget-id='6a01ef3b205bf897ae837633'],
  .lc-chat-widget,
  #leadconnector-chat-widget,
  iframe[src*='leadconnectorhq'],
  iframe[src*='widgets.leadconnectorhq'],
  div[id*='chat-widget'],
  div[class*='chat-widget'],
  div[id^='lc-'],
  div[class^='lc-'] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inject a CSS rule that instantly hides the widget — faster than DOM removal
    if (!document.getElementById(WIDGET_CSS_ID)) {
      const style = document.createElement("style");
      style.id = WIDGET_CSS_ID;
      style.textContent = HIDE_CSS;
      document.head.appendChild(style);
    }

    // Also actively remove elements so they don't linger in the DOM
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
        "div[id^='lc-']",
        "div[class^='lc-']",
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      // Also stop any loaded widget scripts from re-injecting
      document.querySelectorAll(`script[src*='leadconnectorhq'], script[src*='msgsndr']`).forEach(s => s.remove());
    };

    removeWidget();
    const interval = setInterval(removeWidget, 300);
    const observer = new MutationObserver(removeWidget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      // Remove the CSS block when leaving dashboard (back to landing page)
      document.getElementById(WIDGET_CSS_ID)?.remove();
    };
  }, []);

  return <>{children}</>;
}
