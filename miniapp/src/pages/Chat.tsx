import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, X, Mic, AlertCircle } from "lucide-react";
import axios from "axios";
import TTS from "../components/TTS";

interface Message {
  id: number;
  text: string;
  translation: string;
  audio: string;
  isUser: boolean;
  accuracy?: number;
  wordAccuracy?: WordCheck[];
}

interface Response {
  id: number;
  text: string;
  translation: string;
  audio?: string;
}

interface WordCheck {
  thai: string;
  english: string;
  color: string;
}

interface ResponseOption {
  label: string;
  range: string;
  color: string;
}

interface AgentCardProps {
  avatarSrc: string;
  name: string;
  role: string;
  spokenLanguage: string;
  conversationalTone: string;
}

interface PracticeModalProps {
  responseOption: Response;
  onClose: () => void;
  onConfirm: (response: Response) => void;
}

interface ResponseModalProps {
  response: Response;
  onClose: () => void;
  onPractice: () => void;
  onEditResponse: () => void;
}

interface EditResponseModalProps {
  response: Response;
  onClose: () => void;
  onContinue: (response: Response) => void;
  onSubmit: (response: Response) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ avatarSrc, name, role }) => {
  return (
    <article className="flex gap-2 items-center justify-center px-2 py-3 bg-[#0B6D61] rounded-3xl border border-[#159D8C] border-solid max-w-[370px] shadow-[0px_4px_0px_rgba(10,61,55,1)]">
      <button
        onClick={() => window.history.back()}
        className="flex justify-center items-center w-6 h-6 bg-teal-700 rounded-lg border border-teal-600 shadow-md"
        aria-label="Go back"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <div className="flex flex-col justify-center self-stretch my-auto min-w-[240px]">
        <div className="flex gap-3 items-center">
          <div className="relative w-[70px] h-[70px] rounded-2xl border-4 border-black bg-[#DAEFD5] shadow-[0px_4px_0px_rgba(0,0,0,1)]">
            <div className="absolute inset-0 bg-[#DAEFD5] rounded-xl" />
            <img
              loading="lazy"
              src={avatarSrc}
              alt="Agent avatar"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] object-contain z-10"
            />
          </div>
          <div className="flex flex-col self-stretch my-auto">
            <h2 className="text-xl font-semibold text-white inline-block drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] [text-shadow:_0_1px_0_rgb(0_0_0_/_40%)]">
              {name} - {role}
            </h2>
          </div>
        </div>
      </div>
    </article>
  );
};

const ResponseOptionComponent: React.FC<ResponseOption> = ({
  label,
  range,
  color,
}) => (
  <div className="flex flex-col items-center">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <p className="mt-1 text-center">
      <span className="block">{label}</span>
      <span className="block opacity-60">{range}</span>
    </p>
  </div>
);

const WordCheckComponent: React.FC<WordCheck> = ({ thai, english, color }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex flex-col gap-1">
      <p className="text-white text-sm">{thai}</p>
      <p className="text-neutral-400 text-sm">{english}</p>
    </div>
    <div className={`w-3 h-3 rounded-full ${color}`} />
  </div>
);

const AccuracyModal: React.FC<{
  onClose: () => void;
  wordChecks: WordCheck[];
}> = ({ onClose, wordChecks }) => {
  const responseOptions: ResponseOption[] = [
    { label: "Poor", range: "(0-30%)", color: "bg-red-500" },
    { label: "Good", range: "(30-60%)", color: "bg-blue-400" },
    { label: "Best", range: "(60-100%)", color: "bg-lime-400" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <section className="flex relative flex-col p-3 bg-teal-700 rounded-3xl border-2 border-teal-600 border-solid w-[330px] shadow-[0px_4px_0px_rgba(10,61,55,1)]">
        <h2 className="w-full text-xl font-semibold text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
          Word Accuracy
        </h2>

        <div className="flex z-0 gap-6 justify-between items-start p-3 mt-3 w-full text-sm bg-emerald-800 rounded-xl text-neutral-300">
          {responseOptions.map((option, index) => (
            <ResponseOptionComponent key={index} {...option} />
          ))}
        </div>

        <div className="flex z-0 flex-col mt-3 w-full max-h-[300px] overflow-y-auto scrollbar-hide">
          {wordChecks.map((check, index) => (
            <React.Fragment key={index}>
              <WordCheckComponent {...check} />
              {index < wordChecks.length - 1 && (
                <div className="w-full border-t border-teal-600" />
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 z-0 w-8 h-8 top-[13px] rounded-full bg-emerald-800 hover:bg-emerald-700 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </section>
    </div>
  );
};

const PracticeModal: React.FC<PracticeModalProps> = ({
  responseOption,
  onClose,
  onConfirm,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
    } else {
      setIsRecording(true);
    }
  };

  const handleConfirm = async () => {
    if (!hasRecorded) {
      setShowError(true);
      return;
    }

    await onConfirm(responseOption);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <section className="relative flex flex-col p-3 bg-teal-700 rounded-3xl border-2 border-teal-600 border-solid w-[400px] shadow-[0px_4px_0px_rgba(10,61,55,1)]">
        <h2 className="w-full text-xl font-semibold text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
          Respond with...
        </h2>

        <div className="flex z-0 gap-2.5 items-start px-2 py-1.5 mt-4 w-full bg-emerald-900 rounded-xl border border-solid border-neutral-400 shadow-[0px_3px_0px_rgba(10,61,55,1)]">
          <div className="flex flex-col flex-1 shrink w-full basis-0 min-w-[240px]">
            <p className="text-base font-semibold text-white">
              {responseOption.text}
            </p>
            <p className="mt-2 text-base font-semibold text-neutral-400">
              {responseOption.translation}
            </p>
            <TTS
              message={{
                id: responseOption.id,
                text: responseOption.text,
                translation: responseOption.translation,
                isUser: true,
                audio: responseOption.audio,
              }}
              className="bg-transparent shadow-none text-white"
            />
          </div>
        </div>

        <div className="flex z-0 gap-2 items-start mt-4 w-full">
          <div className="object-contain shrink-0 rounded-xl aspect-square w-[54px] bg-emerald-800" />
          <div className="flex-1 h-12 bg-emerald-800 rounded-xl" />
        </div>

        <button
          onClick={handleRecord}
          className={`z-0 self-center mt-4 w-[74px] h-[74px] rounded-full bg-emerald-600 flex items-center justify-center shadow-[0px_4px_0px_rgba(0,0,0,1)] ${
            isRecording ? "bg-red-500" : ""
          }`}
        >
          <Mic className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 z-0 w-8 h-8 top-[13px] rounded-full bg-emerald-800 hover:bg-emerald-700 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <p className="z-0 self-center mt-4 text-base font-semibold text-center text-neutral-400">
          {isRecording
            ? "Recording..."
            : "Press the microphone to start recording"}
        </p>

        <button
          onClick={handleConfirm}
          disabled={!hasRecorded}
          className={`overflow-hidden px-16 py-2 mt-4 w-full text-base font-medium tracking-normal whitespace-nowrap rounded-xl border border-white shadow-[0px_4px_0px_rgba(0,0,0,1)] ${
            hasRecorded
              ? "bg-emerald-500 text-white"
              : "bg-neutral-500 text-white text-opacity-30"
          }`}
        >
          Confirm
        </button>

        {showError && (
          <div className="mt-2 text-red-500 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Please record your response before confirming.</span>
          </div>
        )}
      </section>
    </div>
  );
};

const ResponseModal: React.FC<ResponseModalProps> = ({
  response,
  onClose,
  onPractice,
  onEditResponse,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <section className="relative flex flex-col p-3 bg-teal-700 rounded-3xl border-2 border-teal-600 border-solid w-[400px] shadow-[0px_4px_0px_rgba(10,61,55,1)]">
        <h2 className="w-full text-xl font-semibold text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
          Respond with...
        </h2>

        <div className="flex z-0 gap-2.5 items-start px-2 py-1.5 mt-4 w-full bg-emerald-900 rounded-xl border border-solid border-neutral-400 shadow-[0px_3px_0px_rgba(10,61,55,1)]">
          <div className="flex flex-col flex-1 shrink w-full basis-0 min-w-[240px]">
            <p className="text-sm font-semibold leading-none text-white">
              {response.text}
            </p>
            <p className="mt-2 text-base font-semibold text-neutral-400">
              {response.translation}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-start mt-4 w-full text-base font-medium tracking-normal text-white">
          <button
            onClick={onPractice}
            className="flex-1 px-6 py-3 rounded-xl bg-[#869881] hover:bg-[#869881]/90 transition-colors border border-white/50 shadow-[0px_2px_0px_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none"
          >
            Practice
          </button>
          <button
            onClick={onEditResponse}
            className="flex-1 px-6 py-3 rounded-xl bg-[#576752] hover:bg-[#576752]/90 transition-colors border border-white/50 shadow-[0px_2px_0px_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none"
          >
            Edit Response
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 z-0 w-8 h-8 top-[13px] rounded-full bg-emerald-800 hover:bg-emerald-700 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </section>
    </div>
  );
};

const EditResponseModal: React.FC<EditResponseModalProps> = ({
  response,
  onClose,
  onContinue,
}) => {
  const [editInstruction, setEditInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(response);

  const handleSubmit = async () => {
    if (!editInstruction.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const editResponse = await axios.post(
        "https://dott-delta.vercel.app/api/edit",
        {
          input: editInstruction,
          selectedResponse: currentMessage.text,
        }
      );

      console.log("Edit API Response:", editResponse.data);

      if (editResponse.data.success && editResponse.data.data) {
        const editedResponse: Response = {
          ...currentMessage,
          text: editResponse.data.data.Thai,
          translation: editResponse.data.data.English,
          id: Date.now(),
        };
        console.log("Created edited response:", editedResponse);
        setCurrentMessage(editedResponse);
        setEditInstruction(""); // Clear input after successful edit
      } else {
        setError("Failed to edit response");
      }
    } catch (err) {
      console.error("Edit API Error:", err);
      setError("Something went wrong while editing the response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <section className="relative flex flex-col p-3 bg-teal-700 rounded-3xl border-2 border-teal-600 border-solid w-[400px] shadow-[0px_4px_0px_rgba(10,61,55,1)]">
        <h2 className="w-full text-xl font-semibold text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
          Edit Response
        </h2>

        {/* Current Message Display */}
        <div className="flex z-0 gap-2.5 items-start px-2 py-1.5 mt-4 w-full bg-emerald-900 rounded-xl border border-solid border-neutral-400 shadow-[0px_3px_0px_rgba(10,61,55,1)]">
          <div className="flex flex-col flex-1 shrink w-full basis-0 min-w-[240px]">
            <p className="text-sm font-semibold leading-none text-white">
              {currentMessage.text}
            </p>
            <p className="mt-2 text-base font-semibold text-neutral-400">
              {currentMessage.translation}
            </p>
          </div>
        </div>

        {/* Edit Input Area */}
        <div className="mt-4">
          <textarea
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            className="w-full px-3 py-2 bg-emerald-800 rounded-xl text-white placeholder-white/50 outline-none resize-none h-20"
            placeholder="Enter edit instructions (e.g. 'make it more polite')"
          />
        </div>

        {error && (
          <div className="mt-2 text-red-400 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !editInstruction.trim()}
            className={`w-full px-6 py-3 rounded-xl border border-white/50 text-white font-medium
              ${
                isLoading || !editInstruction.trim()
                  ? "bg-emerald-800 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } 
              transition-colors shadow-[0px_2px_0px_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Editing...
              </div>
            ) : (
              "Edit Response"
            )}
          </button>

          <button
            onClick={() => onContinue(currentMessage)}
            className="w-full px-6 py-3 rounded-xl bg-[#869881] hover:bg-[#869881]/90 
              transition-colors border border-white/50 text-white font-medium
              shadow-[0px_2px_0px_rgba(0,0,0,0.3)] active:translate-y-[1px] active:shadow-none"
          >
            Continue to Practice
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 z-0 w-8 h-8 top-[13px] rounded-full bg-emerald-800 hover:bg-emerald-700 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </section>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex relative gap-2.5 justify-center items-start px-2 py-1.5 max-w-full bg-emerald-100 rounded-xl shadow-[0px_3px_0px_rgba(10,61,55,1)] w-[80px]">
    <div className="flex gap-1 items-center p-2">
      <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-emerald-800 rounded-full animate-bounce" />
    </div>
    <div className="flex absolute -bottom-0.5 -left-0.5 z-0 shrink-0 self-start w-2.5 h-2.5 bg-emerald-100 rounded-full" />
  </div>
);

const ChatScreen: React.FC = () => {
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showEditResponseModal, setShowEditResponseModal] = useState(false);
  const [currentPracticeResponse, setCurrentPracticeResponse] =
    useState<Response | null>(null);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dummyCharacter = {
    avatarSrc: "/agent1.png",
    name: "Somchai",
    role: "Street Food",
    spokenLanguage: "Thai",
    conversationalTone: "Friendly",
  };

  // Remove the static responses array and make it dynamic
  const [responses, setResponses] = useState<Response[]>([
    {
      id: 1,
      text: "สวัสดีครับ/ค่ะ",
      translation: "Hello",
    },
    {
      id: 2,
      text: "สวัสดตอนเช้าครับ/่ะ",
      translation: "Good morning",
    },
    {
      id: 3,
      text: "ขอโทษนะครับ/คะ วัสดีครับ/ค่ะ",
      translation: "Excuse me, hello",
    },
  ]);

  const userId = "f2058966-689c-47c0-a1c7-8312f6611b2e"; // TODO: Replace with actual user ID from auth
  const [threadId, setThreadId] = useState<string | null>(null);

  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  // Add a state to track if we're past the greeting phase
  const [isGreetingPhase, setIsGreetingPhase] = useState(true);

  // Add debug logging to track greeting phase
  useEffect(() => {
    console.log("Current greeting phase:", isGreetingPhase);
  }, [isGreetingPhase]);

  // Modify the initial conversation setup
  useEffect(() => {
    const initiateConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.post(
          "https://dott-delta.vercel.app/api/thread",
          {
            userId,
            input: "",
            ...(threadId && { threadId }),
          }
        );

        if (response.data.success) {
          console.log("Raw API Response:", response.data);

          const apiResponse = response.data.data[0];
          console.log("First message data:", apiResponse);

          if (response.data.threadId) {
            setThreadId(response.data.threadId);
          }

          try {
            const textContent = JSON.parse(apiResponse.text.value);
            console.log("Parsed text content:", textContent);

            const initialMessage: Message = {
              id: Date.now(),
              text: textContent.Thai || "",
              translation: textContent.English || "",
              isUser: false,
              audio: "",
            };

            setMessages([initialMessage]);

            // After initial message, fetch first set of recommendations
            await fetchRecommendations(initialMessage.text);

            // Exit greeting phase after initial setup
            setIsGreetingPhase(false);
          } catch (parseError) {
            console.error("Error parsing text content:", parseError);
            setError("Error processing response content");
          }
        } else {
          setError("Failed to initialize conversation");
        }
      } catch (err) {
        console.error("API Error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initiateConversation();
  }, [userId]);

  // Modify the fetchRecommendations function
  const fetchRecommendations = async (context: string) => {
    if (isGreetingPhase) return;

    try {
      setIsLoadingRecommendations(true);

      console.log("Fetching recommendations for context:", context);

      const response = await axios.post(
        "https://dott-delta.vercel.app/api/recommend",
        {
          response: context,
          threadId: threadId,
        }
      );

      console.log("Raw recommendations response:", response.data);

      if (
        response.data.success &&
        response.data.recommendations?.recommendations
      ) {
        const recommendationsArray =
          response.data.recommendations.recommendations;
        console.log("Recommendations array:", recommendationsArray);

        // Make sure each recommendation has both Thai and English text
        const newResponses: Response[] = recommendationsArray
          .filter((rec: any) => rec.Thai && rec.English) // Only include complete recommendations
          .map((rec: any, index: number) => ({
            id: Date.now() + index,
            text: rec.Thai,
            translation: rec.English,
          }));

        if (newResponses.length > 0) {
          console.log("Setting new responses:", newResponses);
          setResponses(newResponses);
        } else {
          console.warn("No valid recommendations received");
        }
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Make sure handleAIResponse also triggers recommendations
  const handleAIResponse = async (aiData: any) => {
    const aiMessage: Message = {
      id: Date.now() + 1,
      text: aiData.Thai || "",
      translation: aiData.English || "",
      audio: "",
      isUser: false,
    };

    setMessages((prev) => [...prev, aiMessage]);

    console.log("Fetching recommendations for:", aiMessage.text);
    await fetchRecommendations(aiMessage.text);

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    return aiMessage;
  };

  // First, let's fix the sendMessage function to properly handle recommendation responses
  const sendMessage = async (text: string, translation: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Sending message:", { text, translation });

      // Create user message first
      const userMessage: Message = {
        id: Date.now(),
        text: text,
        translation: translation,
        isUser: true,
        audio: "",
      };

      // Add user message to chat
      setMessages((prev) => [...prev, userMessage]);

      // Show typing indicator
      setIsAITyping(true);

      const response = await axios.post(
        "https://dott-delta.vercel.app/api/thread",
        {
          userId,
          input: text, // Send the Thai text to the API
          threadId: threadId,
        }
      );

      setIsAITyping(false);

      if (response.data.success) {
        const aiData = Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data;

        await handleAIResponse(aiData);
      } else {
        setError("Failed to get response");
      }
    } catch (err) {
      setIsAITyping(false);
      console.error("API Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove audio handling from handleResponseClick
  const handleResponseClick = (index: number) => {
    const selectedResp = responses[index];
    setSelectedResponse(index);
    setCurrentPracticeResponse(selectedResp);
    setShowResponseModal(true);
  };

  // Add audio generation to handlePractice
  const handlePractice = async () => {
    if (currentPracticeResponse) {
      // No need to generate audio here - TTS will handle it
      setShowResponseModal(false);
      setShowPracticeModal(true);
    }
  };

  // Add the missing modal handlers
  const handleClosePracticeModal = () => {
    setShowPracticeModal(false);
    setCurrentPracticeResponse(null);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setCurrentPracticeResponse(null);
  };

  const handleCloseEditResponseModal = () => {
    setShowEditResponseModal(false);
    setCurrentPracticeResponse(null);
  };

  const handleConfirmPractice = async (response: Response) => {
    setShowPracticeModal(false);
    await sendMessage(response.text, response.translation);
    setCurrentPracticeResponse(null);
  };

  // Update the handleEditResponse function to maintain the audio URL
  const handleEditResponse = () => {
    if (currentPracticeResponse) {
      setShowResponseModal(false);
      setShowEditResponseModal(true);
    }
  };

  // Update the handleSubmitEditedResponse function to maintain the audio URL
  const handleSubmitEditedResponse = (editedResponse: Response) => {
    // Keep the existing audio URL if it exists
    const updatedResponse = {
      ...editedResponse,
      audio: currentPracticeResponse?.audio || "",
    };
    setCurrentPracticeResponse(updatedResponse);
    setShowEditResponseModal(false);
    setShowPracticeModal(true);
  };

  // Update the handleEditContinue function to maintain the audio URL
  const handleEditContinue = (response: Response) => {
    const updatedResponse = {
      ...response,
      audio: currentPracticeResponse?.audio || "",
    };
    setCurrentPracticeResponse(updatedResponse);
    setShowEditResponseModal(false);
    setShowPracticeModal(true);
  };

  // const handleAccuracyClick = (message: Message) => {
  //   if (message.wordAccuracy) {
  //     setSelectedMessage(message)
  //     setShowAccuracyModal(true)
  //   }
  // }

  // const AccuracyMeter: React.FC<{ message: Message }> = ({ message }) => (
  //   <div
  //     className="flex items-center gap-2 mt-1 cursor-pointer hover:opacity-80"
  //     onClick={() => handleAccuracyClick(message)}
  //   >
  //     <span className="text-xs text-white">Accuracy %</span>
  //     <div className="flex-1 h-1.5 bg-emerald-800 rounded-full overflow-hidden">
  //       <div
  //         className="h-full bg-neutral-500 rounded-full transition-all duration-300"
  //         style={{ width: `${message.accuracy}%` }}
  //       />
  //     </div>
  //   </div>
  // )

  // Add new ref for the messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the messages container is scrollable
    const ensureScrollable = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const isScrollable = container.scrollHeight > container.clientHeight;

        if (!isScrollable) {
          container.style.setProperty(
            "height",
            `${container.clientHeight + 1}px`,
            "important"
          );
        }
      }
    };

    // Prevent scroll collapse
    const preventCollapse = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        if (container.scrollTop === 0) {
          container.scrollTo(0, 1);
        }
      }
    };

    // Add event listeners
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("touchstart", preventCollapse);
      window.addEventListener("resize", ensureScrollable);
      ensureScrollable();
    }

    // Cleanup
    return () => {
      if (container) {
        container.removeEventListener("touchstart", preventCollapse);
        window.removeEventListener("resize", ensureScrollable);
      }
    };
  }, []);

  // Add new state for typing indicator
  const [isAITyping, setIsAITyping] = useState(false);

  // Add this useEffect to monitor responses changes
  useEffect(() => {
    console.log("Current responses:", responses);
  }, [responses]);

  const handleAudioUrlGenerated = useCallback(
    (messageId: number, audioUrl: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, audio: audioUrl } : msg
        )
      );
    },
    []
  );

  if (!dummyCharacter) {
    return null;
  }

  return (
    <div className="h-[100dvh] bg-[#00584E] flex flex-col overflow-hidden">
      <div className="w-full max-w-[440px] mx-auto h-full flex flex-col bg-[#00584E]">
        <div className="sticky top-0 left-0 right-0 p-2 flex justify-center z-50 bg-[#00584E]">
          <div className="w-full max-w-[400px] mx-auto">
            <AgentCard
              avatarSrc={dummyCharacter.avatarSrc}
              name={dummyCharacter.name}
              role={dummyCharacter.role}
              spokenLanguage={dummyCharacter.spokenLanguage}
              conversationalTone={dummyCharacter.conversationalTone}
            />
          </div>
        </div>

        <section
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto min-h-0 z-0 overscroll-contain"
        >
          <div className="flex flex-col w-full pt-4 px-2.5 space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${message.isUser ? "ml-auto" : ""}`}
              >
                <TTS
                  message={message}
                  className={
                    message.isUser ? "bg-emerald-900" : "bg-emerald-100"
                  }
                  onAudioUrlGenerated={(url) =>
                    handleAudioUrlGenerated(message.id, url)
                  }
                />
              </div>
            ))}

            {isAITyping && (
              <div className="flex items-start">
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        <div className="sticky bottom-0 w-full bg-[#00584E] z-50">
          <section className="flex overflow-hidden flex-col justify-center px-5 py-2 text-base font-semibold text-white bg-emerald-700 rounded-t-2xl">
            <div className="flex gap-6 items-center w-full">
              <div className="flex gap-2 items-center self-stretch my-auto">
                <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[#90A99C]">
                  ✓
                </span>
                <span className="self-stretch my-auto">34%</span>
              </div>
              <div className="flex gap-2 items-center self-stretch my-auto">
                <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[#90A99C]">
                  💬
                </span>
                <span className="self-stretch my-auto">08/10</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col px-2.5 pt-3 pb-7 font-semibold bg-emerald-800 border-t border-neutral-400">
            <h2 className="text-sm leading-none text-emerald-100">
              Pick a response
            </h2>
            <div className="overflow-x-auto touch-pan-x scrollbar-hide mt-3">
              <div className="flex gap-2 min-w-min">
                {isLoadingRecommendations ? (
                  // Loading state
                  <div className="flex-none flex flex-col justify-center items-center px-2 py-3 bg-emerald-900 rounded-xl border border-solid border-neutral-400 h-[140px] w-[120px]">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : responses.length > 0 ? (
                  // Show responses if available
                  responses.map((response, index) => (
                    <button
                      key={response.id}
                      onClick={() => handleResponseClick(index)}
                      disabled={isLoading}
                      className={`flex-none flex flex-col justify-between px-2 py-3 bg-emerald-900 rounded-xl border border-solid border-neutral-400 h-[140px] w-[120px] cursor-pointer shadow-[0px_3px_0px_rgba(10,61,55,1)] hover:bg-emerald-900/90 transition-colors ${
                        selectedResponse === index
                          ? "bg-emerald-900 border-emerald-600"
                          : "bg-emerald-900/80"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex flex-col w-full text-left">
                        <h3 className="text-sm leading-tight text-white">
                          {response.text}
                        </h3>
                        <p className="mt-2 text-sm text-neutral-400">
                          {response.translation}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  // Show default message if no responses
                  <div className="flex-none flex flex-col justify-center items-center px-2 py-3 bg-emerald-900 rounded-xl border border-solid border-neutral-400 h-[140px] w-[120px]">
                    <p className="text-sm text-white text-center">
                      No responses available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {showEditResponseModal && currentPracticeResponse && (
          <EditResponseModal
            response={currentPracticeResponse}
            onClose={handleCloseEditResponseModal}
            onContinue={handleEditContinue}
            onSubmit={handleSubmitEditedResponse}
          />
        )}

        {showPracticeModal && currentPracticeResponse && (
          <PracticeModal
            responseOption={currentPracticeResponse}
            onClose={handleClosePracticeModal}
            onConfirm={handleConfirmPractice}
          />
        )}

        {showResponseModal && currentPracticeResponse && (
          <ResponseModal
            response={currentPracticeResponse}
            onClose={handleCloseResponseModal}
            onPractice={handlePractice}
            onEditResponse={handleEditResponse}
          />
        )}

        {showAccuracyModal && selectedMessage?.wordAccuracy && (
          <AccuracyModal
            wordChecks={selectedMessage.wordAccuracy}
            onClose={() => {
              setShowAccuracyModal(false);
              setSelectedMessage(null);
            }}
          />
        )}
      </div>
      {error && <div className="text-red-500 text-center p-2">{error}</div>}
    </div>
  );
};

export default ChatScreen;
