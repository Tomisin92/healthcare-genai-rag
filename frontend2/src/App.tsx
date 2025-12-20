// // src/App.tsx
// import { useState, useMemo, useEffect, useRef } from "react";
// import { Conversation, Message, ChatResponse } from "./types/chat";
// import { chatAPI } from "./services/api";
// import { v4 as uuid } from "uuid";
// import ReactMarkdown from "react-markdown";
// import "./App.css";

// // Icons (using Unicode for simplicity)
// const Icons = {
//   Plus: () => <span className="text-lg">+</span>,
//   Download: () => <span>⬇</span>,
//   Heart: () => <span>❤️</span>,
//   Send: () => <span>→</span>,
//   Bot: () => <span>🤖</span>,
//   User: () => <span>👤</span>,
//   Document: () => <span>📄</span>,
// };

// function App() {
//   // ---- STATE ----
//   const [conversations, setConversations] = useState<Conversation[]>(() => {
//     const now = new Date();
//     return [
//       {
//         id: uuid(),
//         title: "Hypertension Consultation",
//         createdAt: now,
//         updatedAt: now,
//         messages: [
//           {
//             id: uuid(),
//             role: "assistant",
//             content:
//               "👋 Hello! I'm your Healthcare AI Assistant. I can help you with:\n\n• Hypertension management protocols\n• Vaccination guidelines\n• Clinical follow-up procedures\n• Blood pressure management\n\nFeel free to ask me any clinical questions!",
//             timestamp: now,
//             sourceDocuments: [],
//           },
//         ],
//       },
//     ];
//   });

//   const [activeConversationId, setActiveConversationId] = useState(
//     () => conversations[0].id,
//   );
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // ---- DERIVED STATE ----
//   const activeConversation = useMemo(
//     () => conversations.find((c) => c.id === activeConversationId)!,
//     [conversations, activeConversationId],
//   );

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [activeConversation.messages]);

//   // ---- HELPERS ----
//   const handleStartNewCase = () => {
//     const now = new Date();
//     const conv: Conversation = {
//       id: uuid(),
//       title: `New Consultation`,
//       createdAt: now,
//       updatedAt: now,
//       messages: [
//         {
//           id: uuid(),
//           role: "assistant",
//           content:
//             "👋 Hello! How can I assist you with your clinical questions today?",
//           timestamp: now,
//           sourceDocuments: [],
//         },
//       ],
//     };
//     setConversations((prev) => [conv, ...prev]);
//     setActiveConversationId(conv.id);
//   };

//   const addMessage = (
//     role: "user" | "assistant",
//     content: string,
//     sources?: any[],
//   ) => {
//     const now = new Date();
//     const msg: Message = {
//       id: uuid(),
//       role,
//       content,
//       timestamp: now,
//       sourceDocuments: sources || [],
//     };

//     setConversations((prev) =>
//       prev.map((c) =>
//         c.id === activeConversationId
//           ? {
//               ...c,
//               messages: [...c.messages, msg],
//               updatedAt: now,
//               // Auto-update title from first user message
//               title:
//                 c.messages.length === 1 && role === "user"
//                   ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
//                   : c.title,
//             }
//           : c,
//       ),
//     );
//   };

//   const isChitChatQuestion = (q: string) => {
//     const lower = q.toLowerCase().trim();
//     return (
//       lower === "hi" ||
//       lower === "hello" ||
//       lower === "hey" ||
//       lower === "good morning" ||
//       lower === "good afternoon" ||
//       lower === "good evening" ||
//       lower.includes("thank you") ||
//       lower.includes("thanks") ||
//       lower.includes("bye") ||
//       lower.includes("goodbye") ||
//       lower.includes("that is all") ||
//       lower.includes("end the chat")
//     );
//   };

//   // ---- SEND HANDLER ----
//   const handleSend = async () => {
//     const question = input.trim();
//     if (!question || loading) return;

//     addMessage("user", question);
//     setInput("");
//     setLoading(true);

//     try {
//       const res: ChatResponse = await chatAPI.sendMessage({
//         query: question,
//       });

//       const usedKb =
//         Array.isArray(res.source_documents) &&
//         res.source_documents.length > 0 &&
//         !isChitChatQuestion(question);

//       addMessage(
//         "assistant",
//         res.answer,
//         usedKb ? res.source_documents : [],
//       );
//     } catch (e) {
//       addMessage(
//         "assistant",
//         "⚠️ There was an error contacting the backend. Please check your connection and try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle Enter key
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   // ---- DOWNLOAD CHAT ----
//   const handleDownloadChat = () => {
//     const conv = activeConversation;
//     const lines: string[] = [];
//     lines.push(`Healthcare AI Assistant - ${conv.title}`);
//     lines.push(`Created: ${conv.createdAt.toLocaleString()}`);
//     lines.push(`Updated: ${conv.updatedAt.toLocaleString()}`);
//     lines.push("\n" + "=".repeat(80) + "\n");

//     conv.messages.forEach((m) => {
//       const ts = m.timestamp.toLocaleString();
//       lines.push(`[${ts}] ${m.role === "user" ? "You" : "Assistant"}:`);
//       lines.push(m.content);
//       if (m.sourceDocuments && m.sourceDocuments.length > 0) {
//         lines.push("\nSources:");
//         m.sourceDocuments.forEach((doc, idx) => {
//           lines.push(`  ${idx + 1}. ${doc.metadata?.source || "Document"}`);
//         });
//       }
//       lines.push("\n" + "-".repeat(80) + "\n");
//     });

//     const blob = new Blob([lines.join("\n")], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${conv.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   // ---- RENDER ----
//   return (
//     <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* LEFT SIDEBAR */}
//       <aside className="w-80 border-r border-gray-200 bg-white shadow-lg flex flex-col">
//         {/* Sidebar Header */}
//         <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
//           <div className="flex items-center gap-2 text-white mb-3">
//             <Icons.Heart />
//             <h1 className="font-bold text-lg">Healthcare AI</h1>
//           </div>
//           <button
//             onClick={handleStartNewCase}
//             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
//           >
//             <Icons.Plus />
//             <span>New Consultation</span>
//           </button>
//         </div>

//         {/* Conversations List */}
//         <div className="flex-1 overflow-y-auto p-3 space-y-2">
//           {conversations.length === 0 && (
//             <div className="text-center text-gray-400 text-sm py-8">
//               No conversations yet
//             </div>
//           )}
//           {conversations.map((c) => {
//             const isActive = c.id === activeConversationId;
//             return (
//               <button
//                 key={c.id}
//                 onClick={() => setActiveConversationId(c.id)}
//                 className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
//                   isActive
//                     ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
//                     : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
//                 }`}
//               >
//                 <div className="font-semibold text-sm text-gray-900 truncate mb-1">
//                   {c.title}
//                 </div>
//                 <div className="text-xs text-gray-500 flex items-center gap-2">
//                   <span>{c.messages.length} messages</span>
//                   <span>•</span>
//                   <span>
//                     {c.updatedAt.toLocaleDateString([], {
//                       month: "short",
//                       day: "numeric",
//                     })}
//                   </span>
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-200 bg-gray-50">
//           <div className="text-xs text-gray-500 text-center">
//             <p className="font-medium text-gray-700 mb-1">
//               ⚕️ For Educational Use Only
//             </p>
//             <p>Not a substitute for professional medical advice</p>
//           </div>
//         </div>
//       </aside>

//       {/* RIGHT SIDE */}
//       <div className="flex-1 flex flex-col">
//         {/* HEADER */}
//         <header className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
//           <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
//                 <Icons.Bot />
//               </div>
//               <div>
//                 <div className="font-bold text-gray-900">
//                   {activeConversation.title}
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   Evidence-based answers from clinical protocols
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={handleDownloadChat}
//               className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
//             >
//               <Icons.Download />
//               <span>Download</span>
//             </button>
//           </div>
//         </header>

//         {/* CHAT AREA */}
//         <main className="flex-1 overflow-hidden flex justify-center bg-gradient-to-b from-gray-50 to-white">
//           <div className="flex-1 max-w-4xl w-full flex flex-col">
//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
//               {activeConversation.messages.map((m) => {
//                 const isUser = m.role === "user";
//                 return (
//                   <div
//                     key={m.id}
//                     className={`flex gap-3 ${
//                       isUser ? "flex-row-reverse" : "flex-row"
//                     }`}
//                   >
//                     {/* Avatar */}
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
//                         isUser
//                           ? "bg-blue-600 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       }`}
//                     >
//                       {isUser ? <Icons.User /> : <Icons.Bot />}
//                     </div>

//                     {/* Message Bubble */}
//                     <div className="flex-1 max-w-2xl">
//                       <div
//                         className={`rounded-2xl px-5 py-4 shadow-md ${
//                           isUser
//                             ? "bg-blue-600 text-white"
//                             : "bg-white text-gray-900 border border-gray-200"
//                         }`}
//                       >
//                         <div className="prose prose-sm max-w-none">
//                           {isUser ? (
//                             <p className="text-white m-0">{m.content}</p>
//                           ) : (
//                             <ReactMarkdown className="text-gray-800">
//                               {m.content}
//                             </ReactMarkdown>
//                           )}
//                         </div>

//                         {/* Sources (only if we attached them) */}
//                         {m.sourceDocuments && m.sourceDocuments.length > 0 && (
//                           <div className="mt-4 pt-3 border-t border-gray-200">
//                             <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
//                               <Icons.Document />
//                               <span>
//                                 Sources ({m.sourceDocuments.length})
//                               </span>
//                             </div>
//                             <div className="space-y-2">
//                               {m.sourceDocuments
//                                 .slice(0, 3)
//                                 .map((doc: any, idx: number) => (
//                                   <div
//                                     key={idx}
//                                     className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-200"
//                                   >
//                                     <p className="font-medium text-gray-900 mb-1">
//                                       {doc.metadata?.source
//                                         ?.split("/")
//                                         .pop() || "Document"}
//                                       {doc.metadata?.page !== undefined &&
//                                         ` (Page ${
//                                           (doc.metadata.page as number) + 1
//                                         })`}
//                                     </p>
//                                     <p className="text-gray-600 line-clamp-2">
//                                       {doc.content}
//                                     </p>
//                                   </div>
//                                 ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Timestamp */}
//                         <div className="mt-2 text-xs opacity-70">
//                           {m.timestamp.toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}

//               {/* Loading Indicator */}
//               {loading && (
//                 <div className="flex gap-3">
//                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
//                     <Icons.Bot />
//                   </div>
//                   <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <div className="flex gap-1">
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "0ms" }}
//                         />
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "150ms" }}
//                         />
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "300ms" }}
//                         />
//                       </div>
//                       <span className="text-sm">Searching documents...</span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>

//             {/* INPUT AREA */}
//             <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
//               <div className="max-w-4xl mx-auto">
//                 <div className="flex gap-3 items-end">
//                   <textarea
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     rows={2}
//                     placeholder="Ask about hypertension protocols, vaccinations, or clinical procedures..."
//                     className="flex-1 resize-none rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
//                     disabled={loading}
//                   />
//                   <button
//                     onClick={handleSend}
//                     disabled={loading || !input.trim()}
//                     className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
//                   >
//                     <span>{loading ? "Sending..." : "Send"}</span>
//                     {!loading && <Icons.Send />}
//                   </button>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-2 text-center">
//                   Press Enter to send • Shift+Enter for new line
//                 </p>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;


// // src/App.tsx
// import { useState, useMemo, useEffect, useRef } from "react";
// import { Conversation, Message, ChatResponse } from "./types/chat";
// import { chatAPI } from "./services/api";
// import { v4 as uuid } from "uuid";
// import ReactMarkdown from "react-markdown";
// import "./App.css";

// // Icons (using Unicode for simplicity)
// const Icons = {
//   Plus: () => <span className="text-lg">+</span>,
//   Download: () => <span>⬇</span>,
//   Heart: () => <span>❤️</span>,
//   Send: () => <span>→</span>,
//   Bot: () => <span>🤖</span>,
//   User: () => <span>👤</span>,
//   Document: () => <span>📄</span>,
//   ClipboardIcon: () => (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
//         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//     </svg>
//   ),
// };

// function App() {
//   // ---- STATE ----
//   const [conversations, setConversations] = useState<Conversation[]>(() => {
//     const now = new Date();
//     return [
//       {
//         id: uuid(),
//         title: "Hypertension Consultation",
//         createdAt: now,
//         updatedAt: now,
//         messages: [
//           {
//             id: uuid(),
//             role: "assistant",
//             content:
//               "👋 Hello! I'm your Healthcare AI Assistant. I can help you with:\n\n• Hypertension management protocols\n• Vaccination guidelines\n• Clinical follow-up procedures\n• Blood pressure management\n\nFeel free to ask me any clinical questions!",
//             timestamp: now,
//             sourceDocuments: [],
//           },
//         ],
//       },
//     ];
//   });

//   const [activeConversationId, setActiveConversationId] = useState(
//     () => conversations[0].id,
//   );
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // ---- DERIVED STATE ----
//   const activeConversation = useMemo(
//     () => conversations.find((c) => c.id === activeConversationId)!,
//     [conversations, activeConversationId],
//   );

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [activeConversation.messages]);

//   // ---- HELPERS ----
//   const handleStartNewCase = () => {
//     const now = new Date();
//     const conv: Conversation = {
//       id: uuid(),
//       title: `New Consultation`,
//       createdAt: now,
//       updatedAt: now,
//       messages: [
//         {
//           id: uuid(),
//           role: "assistant",
//           content:
//             "👋 Hello! How can I assist you with your clinical questions today?",
//           timestamp: now,
//           sourceDocuments: [],
//         },
//       ],
//     };
//     setConversations((prev) => [conv, ...prev]);
//     setActiveConversationId(conv.id);
//   };

//   const addMessage = (
//     role: "user" | "assistant",
//     content: string,
//     sources?: any[],
//   ) => {
//     const now = new Date();
//     const msg: Message = {
//       id: uuid(),
//       role,
//       content,
//       timestamp: now,
//       sourceDocuments: sources || [],
//     };

//     setConversations((prev) =>
//       prev.map((c) =>
//         c.id === activeConversationId
//           ? {
//               ...c,
//               messages: [...c.messages, msg],
//               updatedAt: now,
//               // Auto-update title from first user message
//               title:
//                 c.messages.length === 1 && role === "user"
//                   ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
//                   : c.title,
//             }
//           : c,
//       ),
//     );
//   };

//   const isChitChatQuestion = (q: string) => {
//     const lower = q.toLowerCase().trim();
//     return (
//       lower === "hi" ||
//       lower === "hello" ||
//       lower === "hey" ||
//       lower === "good morning" ||
//       lower === "good afternoon" ||
//       lower === "good evening" ||
//       lower.includes("thank you") ||
//       lower.includes("thanks") ||
//       lower.includes("bye") ||
//       lower.includes("goodbye") ||
//       lower.includes("that is all") ||
//       lower.includes("end the chat")
//     );
//   };

//   // ---- SEND HANDLER ----
//   const handleSend = async () => {
//     const question = input.trim();
//     if (!question || loading) return;

//     addMessage("user", question);
//     setInput("");
//     setLoading(true);

//     try {
//       const res: ChatResponse = await chatAPI.sendMessage({
//         query: question,
//       });

//       const usedKb =
//         Array.isArray(res.source_documents) &&
//         res.source_documents.length > 0 &&
//         !isChitChatQuestion(question);

//       addMessage(
//         "assistant",
//         res.answer,
//         usedKb ? res.source_documents : [],
//       );
//     } catch (e) {
//       addMessage(
//         "assistant",
//         "⚠️ There was an error contacting the backend. Please check your connection and try again.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle Enter key
//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   // ---- DOWNLOAD CHAT ----
//   const handleDownloadChat = () => {
//     const conv = activeConversation;
//     const lines: string[] = [];
//     lines.push(`Healthcare AI Assistant - ${conv.title}`);
//     lines.push(`Created: ${conv.createdAt.toLocaleString()}`);
//     lines.push(`Updated: ${conv.updatedAt.toLocaleString()}`);
//     lines.push("\n" + "=".repeat(80) + "\n");

//     conv.messages.forEach((m) => {
//       const ts = m.timestamp.toLocaleString();
//       lines.push(`[${ts}] ${m.role === "user" ? "You" : "Assistant"}:`);
//       lines.push(m.content);
//       if (m.sourceDocuments && m.sourceDocuments.length > 0) {
//         lines.push("\nSources:");
//         m.sourceDocuments.forEach((doc, idx) => {
//           lines.push(`  ${idx + 1}. ${doc.metadata?.source || "Document"}`);
//         });
//       }
//       lines.push("\n" + "-".repeat(80) + "\n");
//     });

//     const blob = new Blob([lines.join("\n")], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${conv.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   // ---- RENDER ----
//   return (
//     <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* LEFT SIDEBAR */}
//       <aside className="w-80 border-r border-gray-200 bg-white shadow-lg flex flex-col">
//         {/* Sidebar Header */}
//         <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
//           <div className="flex items-center gap-2 text-white mb-3">
//             <Icons.Heart />
//             <h1 className="font-bold text-lg">Healthcare AI</h1>
//           </div>
//           <button
//             onClick={handleStartNewCase}
//             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
//           >
//             <Icons.Plus />
//             <span>New Consultation</span>
//           </button>
//         </div>

//         {/* Conversations List */}
//         <div className="flex-1 overflow-y-auto p-3 space-y-2">
//           {conversations.length === 0 && (
//             <div className="text-center text-gray-400 text-sm py-8">
//               No conversations yet
//             </div>
//           )}
//           {conversations.map((c) => {
//             const isActive = c.id === activeConversationId;
//             return (
//               <button
//                 key={c.id}
//                 onClick={() => setActiveConversationId(c.id)}
//                 className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
//                   isActive
//                     ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
//                     : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
//                 }`}
//               >
//                 <div className="font-semibold text-sm text-gray-900 truncate mb-1">
//                   {c.title}
//                 </div>
//                 <div className="text-xs text-gray-500 flex items-center gap-2">
//                   <span>{c.messages.length} messages</span>
//                   <span>•</span>
//                   <span>
//                     {c.updatedAt.toLocaleDateString([], {
//                       month: "short",
//                       day: "numeric",
//                     })}
//                   </span>
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-200 bg-gray-50">
//           <div className="text-xs text-gray-500 text-center">
//             <p className="font-medium text-gray-700 mb-1">
//               ⚕️ For Educational Use Only
//             </p>
//             <p>Not a substitute for professional medical advice</p>
//           </div>
//         </div>
//       </aside>

//       {/* RIGHT SIDE */}
//       <div className="flex-1 flex flex-col">
//         {/* HEADER - OPTION 1: Medical Professional Style */}
//         <header className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
//           <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
//             {/* Option 1 Header Content */}
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg">
//                 <Icons.ClipboardIcon />
//               </div>
//               <div>
//                 <div className="font-bold text-gray-900 text-lg">
//                   Clinical Consultation
//                 </div>
//                 <div className="text-xs text-gray-500 flex items-center gap-2">
//                   <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
//                     Active
//                   </span>
//                   <span>•</span>
//                   <span>{activeConversation.messages.length} messages</span>
//                 </div>
//               </div>
//             </div>

//             {/* Download Button */}
//             <button
//               onClick={handleDownloadChat}
//               className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
//             >
//               <Icons.Download />
//               <span>Download</span>
//             </button>
//           </div>
//         </header>

//         {/* CHAT AREA */}
//         <main className="flex-1 overflow-hidden flex justify-center bg-gradient-to-b from-gray-50 to-white">
//           <div className="flex-1 max-w-4xl w-full flex flex-col">
//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
//               {activeConversation.messages.map((m) => {
//                 const isUser = m.role === "user";
//                 return (
//                   <div
//                     key={m.id}
//                     className={`flex gap-3 ${
//                       isUser ? "flex-row-reverse" : "flex-row"
//                     }`}
//                   >
//                     {/* Avatar */}
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
//                         isUser
//                           ? "bg-blue-600 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       }`}
//                     >
//                       {isUser ? <Icons.User /> : <Icons.Bot />}
//                     </div>

//                     {/* Message Bubble */}
//                     <div className="flex-1 max-w-2xl">
//                       <div
//                         className={`rounded-2xl px-5 py-4 shadow-md ${
//                           isUser
//                             ? "bg-blue-600 text-white"
//                             : "bg-white text-gray-900 border border-gray-200"
//                         }`}
//                       >
//                         <div className="prose prose-sm max-w-none">
//                           {isUser ? (
//                             <p className="text-white m-0">{m.content}</p>
//                           ) : (
//                             <ReactMarkdown className="text-gray-800">
//                               {m.content}
//                             </ReactMarkdown>
//                           )}
//                         </div>

//                         {/* Sources */}
//                         {m.sourceDocuments && m.sourceDocuments.length > 0 && (
//                           <div className="mt-4 pt-3 border-t border-gray-200">
//                             <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
//                               <Icons.Document />
//                               <span>
//                                 Sources ({m.sourceDocuments.length})
//                               </span>
//                             </div>
//                             <div className="space-y-2">
//                               {m.sourceDocuments
//                                 .slice(0, 3)
//                                 .map((doc: any, idx: number) => (
//                                   <div
//                                     key={idx}
//                                     className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-200"
//                                   >
//                                     <p className="font-medium text-gray-900 mb-1">
//                                       {doc.metadata?.source
//                                         ?.split("/")
//                                         .pop() || "Document"}
//                                       {doc.metadata?.page !== undefined &&
//                                         ` (Page ${
//                                           (doc.metadata.page as number) + 1
//                                         })`}
//                                     </p>
//                                     <p className="text-gray-600 line-clamp-2">
//                                       {doc.content}
//                                     </p>
//                                   </div>
//                                 ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Timestamp */}
//                         <div className="mt-2 text-xs opacity-70">
//                           {m.timestamp.toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}

//               {/* Loading Indicator */}
//               {loading && (
//                 <div className="flex gap-3">
//                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
//                     <Icons.Bot />
//                   </div>
//                   <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
//                     <div className="flex items-center gap-2 text-gray-600">
//                       <div className="flex gap-1">
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "0ms" }}
//                         />
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "150ms" }}
//                         />
//                         <span
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "300ms" }}
//                         />
//                       </div>
//                       <span className="text-sm">Searching documents...</span>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>

//             {/* INPUT AREA */}
//             <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
//               <div className="max-w-4xl mx-auto">
//                 <div className="flex gap-3 items-end">
//                   <textarea
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     rows={2}
//                     placeholder="Ask about hypertension protocols, vaccinations, or clinical procedures..."
//                     className="flex-1 resize-none rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
//                     disabled={loading}
//                   />
//                   <button
//                     onClick={handleSend}
//                     disabled={loading || !input.trim()}
//                     className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
//                   >
//                     <span>{loading ? "Sending..." : "Send"}</span>
//                     {!loading && <Icons.Send />}
//                   </button>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-2 text-center">
//                   Press Enter to send • Shift+Enter for new line
//                 </p>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;


// src/App.tsx
// src/App.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Conversation, Message, ChatResponse } from "./types/chat";
import { chatAPI } from "./services/api";
import { v4 as uuid } from "uuid";
import ReactMarkdown from "react-markdown";
import "./App.css";

// Icons (using Unicode for simplicity)
const Icons = {
  Plus: () => <span className="text-lg">+</span>,
  Download: () => <span>⬇</span>,
  Heart: () => <span>❤️</span>,
  Send: () => <span>→</span>,
  Bot: () => <span>🤖</span>,
  User: () => <span>👤</span>,
  Document: () => <span>📄</span>,
  ClipboardIcon: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

function App() {
  // ---- STATE ----
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const now = new Date();
    return [
      {
        id: uuid(),
        title: "Hypertension Consultation",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: uuid(),
            role: "assistant",
            content:
              "👋 Hello! I'm your Healthcare AI Assistant. I can help you with:\n\n• Hypertension management protocols\n• Vaccination guidelines\n• Clinical follow-up procedures\n• Blood pressure management\n\nFeel free to ask me any clinical questions!",
            timestamp: now,
            sourceDocuments: [],
          },
        ],
      },
    ];
  });

  const [activeConversationId, setActiveConversationId] = useState(
    () => conversations[0].id,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---- DERIVED STATE ----
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId)!,
    [conversations, activeConversationId],
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation.messages]);

  // ---- HELPERS ----
  const handleStartNewCase = () => {
    const now = new Date();
    const conv: Conversation = {
      id: uuid(),
      title: `New Consultation`,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: uuid(),
          role: "assistant",
          content:
            "👋 Hello! How can I assist you with your clinical questions today?",
          timestamp: now,
          sourceDocuments: [],
        },
      ],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(conv.id);
  };

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    sources?: any[],
  ) => {
    const now = new Date();
    const msg: Message = {
      id: uuid(),
      role,
      content,
      timestamp: now,
      sourceDocuments: sources || [],
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, msg],
              updatedAt: now,
              // Auto-update title from first user message
              title:
                c.messages.length === 1 && role === "user"
                  ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
                  : c.title,
            }
          : c,
      ),
    );
  };

  const isChitChatQuestion = (q: string) => {
    const lower = q.toLowerCase().trim();
    return (
      lower === "hi" ||
      lower === "hello" ||
      lower === "hey" ||
      lower === "good morning" ||
      lower === "good afternoon" ||
      lower === "good evening" ||
      lower.includes("thank you") ||
      lower.includes("thanks") ||
      lower.includes("bye") ||
      lower.includes("goodbye") ||
      lower.includes("that is all") ||
      lower.includes("end the chat")
    );
  };

  // ---- SEND HANDLER ----
  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    addMessage("user", question);
    setInput("");
    setLoading(true);

    try {
      const res: ChatResponse = await chatAPI.sendMessage({
        query: question,
      });

      const usedKb =
        Array.isArray(res.source_documents) &&
        res.source_documents.length > 0 &&
        !isChitChatQuestion(question);

      addMessage(
        "assistant",
        res.answer,
        usedKb ? res.source_documents : [],
      );
    } catch (e) {
      addMessage(
        "assistant",
        "⚠️ There was an error contacting the backend. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- DOWNLOAD CHAT ----
  const handleDownloadChat = () => {
    const conv = activeConversation;
    const lines: string[] = [];
    lines.push(`Healthcare AI Assistant - ${conv.title}`);
    lines.push(`Created: ${conv.createdAt.toLocaleString()}`);
    lines.push(`Updated: ${conv.updatedAt.toLocaleString()}`);
    lines.push("\n" + "=".repeat(80) + "\n");

    conv.messages.forEach((m) => {
      const ts = m.timestamp.toLocaleString();
      lines.push(`[${ts}] ${m.role === "user" ? "You" : "Assistant"}:`);
      lines.push(m.content);
      if (m.sourceDocuments && m.sourceDocuments.length > 0) {
        lines.push("\nSources:");
        m.sourceDocuments.forEach((doc, idx) => {
          lines.push(`  ${idx + 1}. ${doc.metadata?.source || "Document"}`);
        });
      }
      lines.push("\n" + "-".repeat(80) + "\n");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- RENDER ----
  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-80 border-r border-gray-200 bg-white shadow-lg flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2 text-white mb-3">
            <Icons.Heart />
            <h1 className="font-bold text-lg">Healthcare AI</h1>
          </div>
          <button
            onClick={handleStartNewCase}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
          >
            <Icons.Plus />
            <span>New Consultation</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              No conversations yet
            </div>
          )}
          {conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-100 border-2 border-blue-500 shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <div className="font-semibold text-sm text-gray-900 truncate mb-1">
                  {c.title}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{c.messages.length} messages</span>
                  <span>•</span>
                  <span>
                    {c.updatedAt.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium text-gray-700 mb-1">
              ⚕️ For Educational Use Only
            </p>
            <p>Not a substitute for professional medical advice</p>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col">
        {/* HEADER - RAG-Powered Healthcare Assistant */}
        <header className="shrink-0 border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* RAG-Powered Healthcare Assistant Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg">
                <Icons.ClipboardIcon />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base leading-tight">
                  RAG-Powered
                </div>
                <div className="font-bold text-gray-900 text-lg leading-tight">
                  Healthcare Assistant
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    Active
                  </span>
                  <span>•</span>
                  <span>{activeConversation.messages.length} messages</span>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadChat}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Icons.Download />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* CHAT AREA */}
        <main className="flex-1 overflow-hidden flex justify-center bg-gradient-to-b from-gray-50 to-white">
          <div className="flex-1 max-w-4xl w-full flex flex-col">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {activeConversation.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {isUser ? <Icons.User /> : <Icons.Bot />}
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1 max-w-2xl">
                      <div
                        className={`rounded-2xl px-5 py-4 shadow-md ${
                          isUser
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          {isUser ? (
                            <p className="text-white m-0">{m.content}</p>
                          ) : (
                            <ReactMarkdown className="text-gray-800">
                              {m.content}
                            </ReactMarkdown>
                          )}
                        </div>

                        {/* Sources */}
                        {m.sourceDocuments && m.sourceDocuments.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 mb-2">
                              Sources ({
                                Array.from(
                                  new Set(
                                    m.sourceDocuments.map((doc: any) => 
                                      `${doc.metadata?.source?.split("/").pop() || "Document"}${
                                        doc.metadata?.page !== undefined 
                                          ? ` (Page ${(doc.metadata.page as number) + 1})` 
                                          : ""
                                      }`
                                    )
                                  )
                                ).length
                              })
                            </div>
                            <div className="text-xs text-gray-700 space-y-1">
                              {Array.from(
                                new Set(
                                  m.sourceDocuments.map((doc: any) => 
                                    `${doc.metadata?.source?.split("/").pop() || "Document"}${
                                      doc.metadata?.page !== undefined 
                                        ? ` (Page ${(doc.metadata.page as number) + 1})` 
                                        : ""
                                    }`
                                  )
                                )
                              ).map((source: string, idx: number) => (
                                <div key={idx}>{source}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="mt-2 text-xs opacity-70">
                          {m.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Icons.Bot />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span className="text-sm">Searching documents...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    placeholder="Ask about hypertension protocols, vaccinations, or clinical procedures..."
                    className="flex-1 resize-none rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <span>{loading ? "Sending..." : "Send"}</span>
                    {!loading && <Icons.Send />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;