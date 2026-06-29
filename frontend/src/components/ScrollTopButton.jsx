import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggle);
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primaryHover text-white w-12 h-12 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all hover:scale-110"
      aria-label="YukarÄ± Ã§Ä±k"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}