import { useState, useRef, useEffect } from 'react';
import { HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperAirplane } from 'react-icons/hi';
import api from '../lib/api';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  actions?: { label: string; query: string }[];
}

const FAQ_ENTRIES: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['create event', 'how to create', 'new event', 'make event', 'publish event'],
    answer:
      'To create an event:\n1. Sign up or log in as a Creator\n2. Click "Create Event" from your dashboard\n3. Fill in the event details (title, date, location, price, capacity)\n4. Add images and set ticket types if needed\n5. Click "Publish" to make it live, or "Save as Draft" to finish later',
  },
  {
    keywords: ['buy ticket', 'purchase', 'payment', 'pay', 'get ticket', 'how to buy'],
    answer:
      'To buy a ticket:\n1. Browse events and click on the one you like\n2. Select a ticket type (if available)\n3. Apply a promo code if you have one\n4. Click "Buy Ticket" and complete payment via Paystack\n5. Your ticket with QR code will appear in "My Tickets"',
  },
  {
    keywords: ['promo code', 'discount', 'coupon'],
    answer:
      'Promo codes give you discounts on tickets!\n\n**As an attendee:** On the event page, click "Have a promo code?", enter the code, and click Apply. The discounted price will show before checkout.\n\n**As a creator:** Go to "Promo Codes" in the nav menu to create percentage or fixed-amount discount codes for your events.',
  },
  {
    keywords: ['transfer ticket', 'give ticket', 'send ticket'],
    answer:
      'To transfer a ticket to someone:\n1. Go to "My Tickets"\n2. Find the ticket you want to transfer\n3. Click the "Transfer" button\n4. Enter the recipient\'s email address\n5. The ticket will be transferred instantly and both parties will be notified',
  },
  {
    keywords: ['qr code', 'verify', 'scan', 'check in', 'checkin'],
    answer:
      'To verify tickets at your event:\n1. Go to "Verify Ticket" from the Manage menu\n2. Use the "Scan QR Code" tab to scan with your camera\n3. Or use the "Enter Manually" tab to type the token\n4. The system will instantly verify if the ticket is valid and mark it as used',
  },
  {
    keywords: ['refund', 'cancel', 'cancellation', 'money back'],
    answer:
      'Currently, refunds are handled directly between the event creator and the attendee. If an event is cancelled, all ticket holders are notified via email. Please contact the event organizer for refund requests.',
  },
  {
    keywords: ['password', 'forgot', 'reset password', 'can\'t login', 'cant login'],
    answer:
      'To reset your password:\n1. Go to the Login page\n2. Click "Forgot password?"\n3. Enter your email address\n4. Check your inbox for the reset link\n5. Click the link and set a new password\n\nThe link expires in 1 hour. If you signed up with Google or GitHub, use those buttons to log in instead.',
  },
  {
    keywords: ['contact', 'support', 'help', 'reach', 'email'],
    answer:
      'You can reach us through:\n- The contact form at the bottom of the homepage\n- Email: belloibrahimolawale@gmail.com\n\nWe typically respond within 24 hours.',
  },
  {
    keywords: ['dark mode', 'theme', 'light mode', 'switch theme'],
    answer:
      'To toggle dark/light mode, click the sun/moon icon in the top navigation bar. Your preference is saved automatically.',
  },
  {
    keywords: ['waitlist', 'sold out', 'full event', 'no tickets'],
    answer:
      'If an event is sold out, you can join the waitlist! Click "Join Waitlist" on the event page. You\'ll see your position in the queue. If a ticket becomes available, you\'ll be notified automatically so you can purchase it.',
  },
  {
    keywords: ['bookmark', 'save event', 'saved events', 'favorite'],
    answer:
      'To save an event, click the bookmark icon on any event card or event detail page. View all your saved events from "Saved" in the My Events menu.',
  },
  {
    keywords: ['recurring', 'series', 'repeat', 'weekly event', 'monthly event'],
    answer:
      'Creators can create recurring event series! When creating an event, toggle "Recurring Event" and choose Weekly, Biweekly, or Monthly with the number of occurrences (2-52). Each occurrence is a separate event linked together.',
  },
  {
    keywords: ['category', 'categories', 'browse category', 'type of event'],
    answer:
      'You can browse events by category! Click "Categories" in the navigation to see all categories with event counts. Click any category to see its events. Categories include Music, Tech, Sports, Art, Food, Business, and more.',
  },
];

const WELCOME_MESSAGE: Message = {
  id: 0,
  text: 'Hi! I\'m the Eventful assistant. How can I help you today?',
  sender: 'bot',
  actions: [
    { label: 'How to buy tickets', query: 'how to buy ticket' },
    { label: 'Create an event', query: 'how to create event' },
    { label: 'Promo codes', query: 'promo code' },
    { label: 'Contact support', query: 'contact support' },
  ],
};

function findAnswer(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  for (const entry of FAQ_ENTRIES) {
    if (entry.keywords.some((kw) => lowerQuery.includes(kw))) {
      return entry.answer;
    }
  }
  return null;
}

export default function ChatBot() {
  const [open, setOpen] = useState(() => {
    try { return sessionStorage.getItem('chatbot-open') === 'true'; } catch { return false; }
  });
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    try { sessionStorage.setItem('chatbot-open', String(open)); } catch {}
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'bot' | 'user', actions?: Message['actions']) => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { id, text, sender, actions }]);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage(trimmed, 'user');
    setInput('');

    const answer = findAnswer(trimmed);
    if (answer) {
      setTimeout(() => addMessage(answer, 'bot'), 300);
    } else {
      setTimeout(() => {
        addMessage(
          "I don't have a specific answer for that. Would you like to send a message to our support team?",
          'bot',
          [
            { label: 'Yes, contact support', query: '__support__' },
            { label: 'No, thanks', query: '__close_support__' },
          ]
        );
      }, 300);
    }
  };

  const handleAction = (query: string) => {
    if (query === '__support__') {
      setSupportMode(true);
      return;
    }
    if (query === '__close_support__') {
      addMessage("No problem! Feel free to ask me anything else.", 'bot');
      return;
    }
    addMessage(query, 'user');
    setInput('');
    const answer = findAnswer(query);
    if (answer) {
      setTimeout(() => addMessage(answer, 'bot'), 300);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', supportForm);
      setSupportMode(false);
      setSupportForm({ name: '', email: '', message: '' });
      addMessage("Your message has been sent to our support team! We'll get back to you via email.", 'bot');
    } catch {
      addMessage("Sorry, I couldn't send your message. Please try the contact form on the homepage.", 'bot');
      setSupportMode(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          open
            ? 'bg-gray-700 text-white rotate-0'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
        }`}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <HiOutlineX className="w-6 h-6" />
        ) : (
          <HiOutlineChatAlt2 className="w-6 h-6" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <HiOutlineChatAlt2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Eventful Assistant</p>
              <p className="text-emerald-100 text-xs">Ask me anything about the platform</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === 'bot'
                      ? 'bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] rounded-bl-md'
                      : 'bg-emerald-600 text-white rounded-br-md ml-auto'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.actions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleAction(action.query)}
                        className="text-xs px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Support form or input */}
          {supportMode ? (
            <form onSubmit={handleSupportSubmit} className="border-t border-[rgb(var(--border-primary))] p-3 space-y-2">
              <p className="text-xs text-[rgb(var(--text-secondary))] font-medium">Send a message to support:</p>
              <input
                type="text"
                required
                placeholder="Your name"
                value={supportForm.name}
                onChange={(e) => setSupportForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="email"
                required
                placeholder="Your email"
                value={supportForm.email}
                onChange={(e) => setSupportForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <textarea
                required
                rows={2}
                placeholder="Your message (min 10 chars)"
                value={supportForm.message}
                onChange={(e) => setSupportForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setSupportMode(false)}
                  className="px-3 py-1.5 text-sm bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-primary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-[rgb(var(--border-primary))] p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a question..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                aria-label="Send message"
              >
                <HiOutlinePaperAirplane className="w-4 h-4 rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
