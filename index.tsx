import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Icons ---
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"></path></svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const PodcastIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V6a5 5 0 0 0-5-5z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

// --- Types ---
type Message = {
  role: "user" | "model";
  text: string;
  isStreaming?: boolean;
  groundingSources?: Array<{
    uri: string;
    title: string;
  }>;
};

// --- API Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Je bent de exclusieve AI-assistent van 'Studio Nieuwe Tijd'. Je put je kennis DIRECT uit het YouTube-kanaal (@nieuwetijdpodcast5843) van Niels.
Je taak is om de gebruiker te informeren alsof je alle transcripts hebt gelezen.

**BELANGRIJKSTE INSTRUCTIE:**
Voor ELKE vraag moet je de 'googleSearch' tool gebruiken om actief te zoeken naar de inhoud van video's op het kanaal '@nieuwetijdpodcast5843'.
Zoek naar termen zoals "site:youtube.com/@nieuwetijdpodcast5843 [onderwerp]" of "Studio Nieuwe Tijd podcast transcript [onderwerp]".

**Jouw Identiteit:**
- **Toon:** Wakker, nuchter, diepgaand, en verbindend. Gebruik geen zweverige taal zonder inhoud, maar spreek de taal van de 'nieuwe tijd' (soevereiniteit, waarheid, transformatie).
- **Inhoud:** Je baseert je antwoorden op de visie van Niels over geopolitiek, spiritualiteit, gezondheid en de maatschappelijke transitie ('The Great Reset' vs 'The Great Awakening').
- **Vorm:** Geef duidelijke samenvattingen van wat er in de video's gezegd wordt. Verwijs indien mogelijk naar specifieke afleveringen.

Als je iets niet kunt vinden op het kanaal, geef dit dan eerlijk aan, maar probeer altijd een relevant thema van Niels te vinden dat erbij past.
`;

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Welkom bij Studio Nieuwe Tijd. Ik heb toegang tot de wijsheid uit alle podcast afleveringen. Waar mag ik je vandaag inzicht in geven?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    
    if (!textToSend.trim() || isLoading) return;

    setInput("");
    setIsLoading(true);

    // Add user message to state
    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);

    try {
      const model = "gemini-2.5-flash"; 
      
      const streamResult = await ai.models.generateContentStream({
        model: model,
        contents: [
          ...messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: textToSend }] },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", isStreaming: true, groundingSources: [] },
      ]);

      let fullText = "";
      let groundingSources: Array<{ uri: string; title: string }> = [];

      for await (const chunk of streamResult) {
        const chunkText = chunk.text || "";
        fullText += chunkText;
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          chunks.forEach((c: any) => {
            if (c.web?.uri && c.web?.title) {
              if (!groundingSources.some(s => s.uri === c.web.uri)) {
                groundingSources.push({ uri: c.web.uri, title: c.web.title });
              }
            }
          });
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          lastMessage.text = fullText;
          lastMessage.groundingSources = groundingSources;
          return newMessages;
        });
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.isStreaming = false;
        return newMessages;
      });

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Er is een verbindingstoring in het veld. Probeer het later opnieuw.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#e2e8f0] font-sans overflow-hidden relative selection:bg-[#d4af37] selection:text-black">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#d4af37] opacity-[0.03] blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Header - Centered, Big, Gold */}
      <header className="flex-none pt-12 pb-6 flex flex-col items-center justify-center z-10 relative px-4">
        
        {/* Logo Container with Light Effects */}
        <div className="relative flex items-center justify-center mb-6">
            
            {/* Layer 1: Clockwise Rotating Gold Rays */}
            <div className="absolute w-[180%] h-[180%] rounded-full bg-[conic-gradient(from_0deg,transparent_0%,#d4af37_10%,transparent_20%,#b8860b_30%,transparent_40%,#d4af37_50%,transparent_60%,#b8860b_70%,transparent_80%,#d4af37_90%,transparent_100%)] opacity-15 animate-rotate-cw blur-xl pointer-events-none"></div>
            
            {/* Layer 2: Counter-Clockwise Rotating Rays (Interference pattern) */}
            <div className="absolute w-[150%] h-[150%] rounded-full bg-[conic-gradient(from_180deg,transparent_0%,#f1c40f_10%,transparent_20%,#d4af37_30%,transparent_40%,#f1c40f_50%,transparent_60%,#d4af37_70%,transparent_80%,#f1c40f_90%,transparent_100%)] opacity-10 animate-rotate-ccw blur-lg pointer-events-none"></div>

            {/* Layer 3: Central Gold Pulse */}
            <div className="absolute inset-0 bg-[#d4af37] rounded-full animate-pulse-gold pointer-events-none opacity-20"></div>

            {/* Layer 4: The Logo Image */}
            <img
              src="https://studionieuwetijd.nl/wp-content/uploads/2021/03/cropped-Logo-Studio-Nieuwe-Tijd.png"
              alt="Studio Nieuwe Tijd Logo"
              className="h-40 md:h-52 w-auto relative z-20 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
            />
        </div>
        
        {/* Text Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#f1c40f] to-[#b5952f] tracking-[0.2em] font-serif uppercase text-center drop-shadow-sm relative z-20">
          Studio Nieuwe Tijd
        </h1>
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent mt-4 mb-2 relative z-20"></div>
        <p className="text-[#888] text-[10px] md:text-xs uppercase tracking-[0.4em] font-light relative z-20">
          Podcast Intelligentie
        </p>
      </header>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pb-4 overflow-hidden flex flex-col z-10">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent pb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex w-full ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative max-w-[85%] md:max-w-[80%] rounded-2xl px-6 py-5 shadow-xl backdrop-blur-md border ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black font-medium border-[#f1c40f]/20 rounded-br-none"
                    : "bg-[#111] bg-opacity-80 text-gray-200 border-[#333] rounded-bl-none"
                }`}
              >
                {/* Text */}
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.text}
                </div>

                {/* Sources */}
                {msg.role === "model" && msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[#888] mb-2 flex items-center gap-2">
                      <SearchIcon />
                      Geverifieerde Bronnen
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingSources.map((source, i) => (
                        <a
                          key={i}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-black/40 hover:bg-[#d4af37]/20 hover:text-[#d4af37] transition-all text-gray-400 px-3 py-1.5 rounded-md border border-white/5 hover:border-[#d4af37]/30 truncate max-w-[220px] flex items-center gap-1"
                          title={source.title}
                        >
                          <span className="w-1 h-1 rounded-full bg-[#d4af37] inline-block mr-1"></span>
                          {source.title || new URL(source.uri).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#111] bg-opacity-80 border border-[#333] rounded-2xl rounded-bl-none px-6 py-5 flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest mr-2">Zoeken</span>
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="mt-4 flex flex-col gap-3">
            {/* Quick Suggestions - Horizontal Scroll */}
            {messages.length < 3 && (
                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center">
                    <button
                        onClick={() => handleSend("Wat is de laatste aflevering van Studio Nieuwe Tijd?")}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a]/80 border border-[#333] hover:border-[#d4af37]/50 rounded-full text-xs text-gray-400 hover:text-[#d4af37] transition-all whitespace-nowrap backdrop-blur-sm"
                    >
                        <PodcastIcon /> Laatste aflevering
                    </button>
                    <button
                        onClick={() => handleSend("Wat zegt Niels over de huidige tijdgeest?")}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a]/80 border border-[#333] hover:border-[#d4af37]/50 rounded-full text-xs text-gray-400 hover:text-[#d4af37] transition-all whitespace-nowrap backdrop-blur-sm"
                    >
                        <SparklesIcon /> Tijdgeest & Transformatie
                    </button>
                     <button
                        onClick={() => handleSend("Vertel me meer over soevereiniteit.")}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a]/80 border border-[#333] hover:border-[#d4af37]/50 rounded-full text-xs text-gray-400 hover:text-[#d4af37] transition-all whitespace-nowrap backdrop-blur-sm"
                    >
                        <InfoIcon /> Soevereiniteit
                    </button>
                 </div>
            )}

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37]/20 to-[#b8860b]/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center bg-[#111] rounded-full border border-[#333] focus-within:border-[#d4af37]/50 shadow-2xl transition-all">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Stel je vraag aan de podcast..."
                    className="w-full bg-transparent text-gray-100 placeholder-gray-600 px-6 py-4 focus:outline-none text-sm md:text-base"
                    disabled={isLoading}
                    />
                    <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="mr-2 p-3 bg-[#d4af37] hover:bg-[#c5a028] text-black rounded-full transition-all disabled:opacity-50 disabled:scale-90 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                    >
                    <SendIcon />
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-[#444] font-medium tracking-wide">
                AI gegenereerd op basis van @nieuwetijdpodcast5843 content
            </p>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);