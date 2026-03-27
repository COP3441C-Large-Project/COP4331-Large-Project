import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "../types";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseChatOptions {
  matchId: string | null;
  userId: string;
  onMessage?: (message: Message) => void;
}

interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string) => void;
  connectionStatus: ConnectionStatus;
  isTyping: boolean;
}

// Stub: replace WS_URL with your actual WebSocket server endpoint
const WS_URL = ""; // e.g. "wss://your-api.example.com/chat"

export function useChat({ matchId, userId, onMessage }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Seed with mock messages so the UI looks alive ────────────────────────
  useEffect(() => {
    if (!matchId) {
      setMessages([]);
      return;
    }

    const mockSeed: Message[] = [
      {
        id: "1",
        senderId: matchId,
        content: "hi, you're interested in film too?",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isOwn: false,
      },
      {
        id: "2",
        senderId: userId,
        content: "yeah, i've been trying to expand my film genres lately",
        timestamp: new Date(Date.now() - 24 * 60 * 1000),
        isOwn: true,
      },
      {
        id: "3",
        senderId: matchId,
        content: "have you checked out..",
        timestamp: new Date(Date.now() - 21 * 60 * 1000),
        isOwn: false,
      },
      {
        id: "4",
        senderId: userId,
        content: "yeah, i didn't love their last movie, though",
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        isOwn: true,
      },
    ];
    setMessages(mockSeed);
  }, [matchId, userId]);

  // ── WebSocket connection ─────────────────────────────────────────────────
  useEffect(() => {
    if (!matchId || !WS_URL) {
      // WS_URL not configured yet — stay in mock/offline mode
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const ws = new WebSocket(`${WS_URL}?matchId=${matchId}&userId=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);

        if (data.type === "message") {
          const incoming: Message = {
            id: data.id ?? crypto.randomUUID(),
            senderId: data.senderId,
            content: data.content,
            timestamp: new Date(data.timestamp),
            isOwn: data.senderId === userId,
          };
          setMessages((prev) => [...prev, incoming]);
          onMessage?.(incoming);
        }

        if (data.type === "typing") {
          setIsTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      } catch {
        // malformed frame — ignore
      }
    };

    ws.onerror = () => setConnectionStatus("error");
    ws.onclose = () => setConnectionStatus("disconnected");

    return () => {
      ws.close();
      wsRef.current = null;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [matchId, userId, onMessage]);

  // ── Send a message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !matchId) return;

      const newMessage: Message = {
        id: crypto.randomUUID(),
        senderId: userId,
        content: content.trim(),
        timestamp: new Date(),
        isOwn: true,
      };

      // Optimistic local update
      setMessages((prev) => [...prev, newMessage]);

      // Send over WebSocket when connected, otherwise queue for REST fallback
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            matchId,
            senderId: userId,
            content: content.trim(),
            timestamp: newMessage.timestamp.toISOString(),
          })
        );
      } else {
        // TODO: replace with your REST endpoint when WS is not available
        // fetch("/api/messages", { method: "POST", body: JSON.stringify({ matchId, content }) })
      }
    },
    [matchId, userId]
  );

  return { messages, sendMessage, connectionStatus, isTyping };
}