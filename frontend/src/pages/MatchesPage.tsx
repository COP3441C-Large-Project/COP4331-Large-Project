import React, { useState, useCallback } from "react";
import { Match } from "../types";
import MatchList from "../components/MatchList/MatchList";
import ChatWindow from "../components/ChatWindow/ChatWindow";
import { useChat } from "../hooks/useChat";

// TODO: fetch from /api/matches
const MOCK_MATCHES: Match[] = [
  {
    id: "stranger_01",
    username: "stranger_01",
    interests: ["art", "film"],
    matchPercentage: 92,
    isOnline: true,
  },
  {
    id: "user_two",
    username: "user_two",
    interests: ["philosophy", "music"],
    matchPercentage: 87,
    lastMessage: "i disagree...",
    isOnline: false,
  },
  {
    id: "random_person",
    username: "random_person",
    interests: ["travel", "ethics"],
    matchPercentage: 81,
    isOnline: false,
  },
  {
    id: "user_four",
    username: "user_four",
    interests: ["design", "food"],
    matchPercentage: 76,
    lastMessage: "hear me out!!",
    isOnline: false,
  },
];

// TODO: replace with actual auth — pull from session/context
const CURRENT_USER_ID = "current_user";

const MatchesPage: React.FC = () => {
  const [matches] = useState<Match[]>(MOCK_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(MOCK_MATCHES[0]);
  const [activeSection, setActiveSection] = useState<"matches" | "interests">("matches");

  const { messages, sendMessage, connectionStatus, isTyping } = useChat({
    matchId: selectedMatch?.id ?? null,
    userId: CURRENT_USER_ID,
  });

  const handleSelectMatch = useCallback((match: Match) => {
    setSelectedMatch(match);
    setActiveSection("matches");
  }, []);

  return (
    <main className="flex h-[calc(100vh-56px)] overflow-hidden bg-[var(--color-bg)]">
      <MatchList
        matches={matches}
        selectedMatchId={selectedMatch?.id ?? null}
        onSelectMatch={handleSelectMatch}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <ChatWindow
        match={selectedMatch}
        messages={messages}
        onSendMessage={sendMessage}
        isTyping={isTyping}
        connectionStatus={connectionStatus}
      />
    </main>
  );
};

export default MatchesPage;