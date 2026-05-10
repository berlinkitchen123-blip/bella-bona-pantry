import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, ShieldCheck, Apple, Wheat, Droplets } from 'lucide-react';
import { useOrders } from '../context/OrderContext';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: "Hello! I'm your Bella & Bona Pantry AI. How can I help you today? (Try asking: 'Which snacks are gluten-free?')" }
  ]);
  const [input, setInput] = useState('');
  const { catalog } = useOrders();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Simulated AI Logic
    setTimeout(() => {
      let response = "I'm not sure about that, but I can check our catalog for dietary info!";
      const query = userMsg.toLowerCase();

      if (query.includes('gluten')) {
        const gf = catalog.filter(i => i.dietary === 'gluten-free').map(i => i.name).slice(0, 3);
        response = `We have several gluten-free options! Examples include ${gf.join(', ')} and our fresh fruit boxes. You can see the [GF] tag on their cards.`;
      } else if (query.includes('vegan')) {
        const v = catalog.filter(i => i.dietary === 'vegan').length;
        response = `We currently have ${v} 100% vegan products available. Look for the green leaf icon 🌱 in the catalog!`;
      } else if (query.includes('delivery')) {
        response = "Standard delivery is free with your daily lunch! For specific morning slots, there is an €89 priority delivery fee.";
      } else if (query.includes('healthy') || query.includes('diet')) {
        response = "We prioritize wellness! 80% of our snacks have a Nutri-Score of A or B. I recommend the Mixed Nuts 🥜 or any item from the Fruits category.";
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] font-sans">
      {/* Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-brand-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
        >
          <div className="absolute inset-0 rounded-full bg-brand-900 animate-ping opacity-20" />
          <MessageCircle className="w-8 h-8 relative z-10" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full animate-bounce-in" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-surface-100 animate-slide-up">
          {/* Header */}
          <div className="bg-brand-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-800 rounded-2xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-brand-300" />
              </div>
              <div>
                <p className="text-sm font-black flex items-center gap-1.5 uppercase tracking-widest">
                  Bella AI Assistant <Sparkles className="w-3 h-3 text-brand-300" />
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                   <span className="text-[10px] font-bold">Online & Analyzing</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-brand-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="px-4 py-3 bg-brand-50/50 border-b border-brand-100 flex gap-2 overflow-x-auto no-scrollbar">
             <button onClick={() => setInput('Check Gluten-Free')} className="shrink-0 px-3 py-1.5 bg-white border border-brand-100 rounded-full text-[10px] font-black text-brand-900 uppercase flex items-center gap-1.5 hover:bg-brand-900 hover:text-white transition-all">
                <Wheat className="w-3 h-3" /> Gluten-Free
             </button>
             <button onClick={() => setInput('Vegan Options')} className="shrink-0 px-3 py-1.5 bg-white border border-brand-100 rounded-full text-[10px] font-black text-brand-900 uppercase flex items-center gap-1.5 hover:bg-brand-900 hover:text-white transition-all">
                <Apple className="w-3 h-3" /> Vegan
             </button>
             <button onClick={() => setInput('Lactose-Free')} className="shrink-0 px-3 py-1.5 bg-white border border-brand-100 rounded-full text-[10px] font-black text-brand-900 uppercase flex items-center gap-1.5 hover:bg-brand-900 hover:text-white transition-all">
                <Droplets className="w-3 h-3" /> No Dairy
             </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' ? 'bg-brand-900 text-white rounded-tr-none' : 'bg-white text-surface-700 border border-surface-100 rounded-tl-none font-medium'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-surface-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask about snacks, allergens, logistics..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="w-full bg-surface-50 border-2 border-transparent focus:border-brand-900 rounded-2xl py-3.5 pl-5 pr-14 text-sm font-medium transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-900 text-white rounded-xl flex items-center justify-center hover:bg-brand-800 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 opacity-30 grayscale pointer-events-none">
               <ShieldCheck className="w-3 h-3" />
               <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Bella & Bona AI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
