'use client';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
type RawProduct = {
  title: string;
  price: number;
  currency: string;
  url: string;
  image_url: string;
};
type Message =
  | { sender: 'user' | 'bot'; text: string }
  | { sender: 'carousel'; cards: ProductCard[] };
type ProductCard = {
  id: number;
  name: string;
  price: string;
  currency: string;
  permalink: string;
  image: string;
};
export default function Home() {
  const [open, setOpen] = useState(false);
  const [ip, setIp] = useState<string>("");
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setIp(data.ip);
      } catch (err) {
        console.error("Failed to fetch IP:", err);
      }
    };
    fetchIP();
  }, []);
  const [sessionId, setSessionId] = useState<string>("");
  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hi! Ask me for products or help 😊" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("https://demo3.devspandas.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: input, ip: ip || "unknown" }),
      });
      const data = await res.json();
      console.log("API response:", data);
      const botText = data.content || "No reply found.";
      setMessages(prev => [...prev, { sender: "bot", text: botText }]);
      if (Array.isArray(data.products) && data.products.length > 0) {
        const cards: ProductCard[] = (data.products as RawProduct[]).map(
          (p: RawProduct, idx: number) => ({
            id: idx,
            name: p.title,
            price: String(p.price),
            currency: p.currency,
            permalink: p.url,
            image: p.image_url,
          })
        );
        setMessages(prev => [...prev, { sender: "carousel", cards }]);
      }
    } catch (err) {
      console.error("Bot fetch failed:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setTyping(false);
    }
  };
  return (
    <div className="relative min-h-screen">
      <motion.button
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-50"
        onClick={() => setOpen(prev => !prev)}
      >
        💬
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-6 w-[360px] min-h-[70vh] max-h-[70vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200"
          >
            <div className="bg-blue-600 text-white px-4 py-3 font-semibold">🛍️ Ecom ChatBot</div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {messages.map((msg, idx) =>
                msg.sender === "carousel" ? (
                  <div key={idx} className="bg-gray-50 p-2 rounded-xl shadow-inner">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={20}
                      slidesPerView={1.1}
                      navigation={{
                        nextEl: `.swiper-button-next-${idx}`,
                        prevEl: `.swiper-button-prev-${idx}`
                      }}
                      className="pb-6 relative"
                    >
                      {msg.cards.map((product) => (
                        <SwiperSlide key={product.id}>
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            className="bg-white p-4 rounded-2xl shadow-lg transition-all duration-300 border border-gray-200 hover:shadow-xl"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-44 object-cover rounded-xl mb-3"
                            />
                            <div className="text-center space-y-1">
                              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                              <p className="text-blue-600 font-bold text-sm">
                                {product.price} {product.currency}
                              </p>
                              <a
                                href={product.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all"
                              >
                                🛒 View Product
                              </a>
                            </div>
                          </motion.div>
                        </SwiperSlide>
                      ))}
                      <button
                        className={`swiper-button-prev-${idx} absolute top-1/2 -left-0 z-10 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-blue-100 transition cursor-pointer`}
                      >
                        <span className="text-xl text-gray-700 p-1">←</span>
                      </button>
                      <button
                        className={`swiper-button-next-${idx} absolute top-1/2 -right-0 z-10 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-blue-100 transition cursor-pointer`}
                      >
                        <span className="text-xl text-gray-700 p-1">→</span>
                      </button>
                    </Swiper>
                  </div>
                ) : (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.sender === "bot" ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
                  >
                    <div className={`px-4 py-2 rounded-xl max-w-[75%] ${msg.sender === "bot" ? "bg-gray-200" : "bg-blue-600 text-white"}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )
              )}
              {typing && (
                <div className="flex justify-start">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-sm"
                  >
                    <span className="inline-block animate-pulse">Typing...</span>
                  </motion.div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>
            <div className="border-t flex px-3 py-2 bg-white">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-full border border-gray-300 text-sm outline-none"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}