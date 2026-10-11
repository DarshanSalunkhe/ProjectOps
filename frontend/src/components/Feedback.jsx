import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const FeedbackContext = createContext(() => {});
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);
  const dismiss = useCallback(id => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setMessages(current => current.filter(message => message.id !== id));
  }, []);
  const notify = useCallback((text, tone = 'success') => {
    const id = ++nextId.current;
    setMessages(current => [...current, { id, text, tone }].slice(-4));
    if (tone !== 'error') timers.current.set(id, setTimeout(() => dismiss(id), 6500));
  }, [dismiss]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  return <FeedbackContext.Provider value={notify}>
    {children}
    <div className="toast-stack" aria-label="Notifications">
      {messages.map(message => <div key={message.id} className={`toast toast-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>
        <span className="toast-symbol" aria-hidden="true">{message.tone === 'error' ? '!' : '✓'}</span>
        <p>{message.text}</p>
        <button onClick={() => dismiss(message.id)} aria-label="Dismiss notification">×</button>
      </div>)}
    </div>
  </FeedbackContext.Provider>;
}
