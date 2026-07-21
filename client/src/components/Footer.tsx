import React, { useState } from 'react';
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin, ArrowUp, Send, ShieldCheck, HeartHandshake, Compass, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

export const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setStatus('error');
      setErrorMsg(t('footer.newsletterError'));
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  return (
    <footer id="footer" className="relative bg-[#050505] pt-16 pb-8 border-t border-white/10 overflow-hidden">
      {/* Background cyber grid pattern and radial glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">

        {/* Core Value Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-white/10 mb-12">
          <div className="flex items-center gap-4 p-5 rounded-2xl glass-2026 border border-white/10 hover:border-neon/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              <Compass size={24} />
            </div>
            <div>
              <h6 className="font-bold text-white text-sm">Flexible Journeys</h6>
              <p className="text-gray-400 text-xs mt-0.5">Explore Da Nang at your own pace</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 rounded-2xl glass-2026 border border-white/10 hover:border-neon/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h6 className="font-bold text-white text-sm">Premium Fleet</h6>
              <p className="text-gray-400 text-xs mt-0.5">Fully inspected & well-maintained bikes</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 rounded-2xl glass-2026 border border-white/10 hover:border-neon/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h6 className="font-bold text-white text-sm">24/7 Assistance</h6>
              <p className="text-gray-400 text-xs mt-0.5">We are always ready to support you</p>
            </div>
          </div>
        </div>

        {/* Main Footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">

          {/* Column 1: Brand Info */}
          <div className="lg:col-span-4">
            <Link to="/" className="font-display font-black text-3xl text-neon mb-6 block tracking-tight neon-text-glow">
              Motov
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('footer.desc')}
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Facebook size={18} />, link: 'https://facebook.com', label: 'Facebook • Founder & CEO' },
                { icon: <Twitter size={18} />, link: 'https://twitter.com', label: 'Twitter / X • Motov Official' },
                { icon: <Instagram size={18} />, link: 'https://instagram.com', label: 'Instagram • Motov Community' }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center text-gray-300 hover:text-neon hover:border-neon/60 hover:bg-neon/10 transition-all duration-300 shadow-md cursor-pointer"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2">
            <h5 className="font-display font-bold text-white mb-6 uppercase tracking-wider text-xs border-l-2 border-neon pl-3">
              {t('footer.quickLinks')}
            </h5>
            <ul className="space-y-3 text-gray-400 text-sm">
              {[
                { to: '/', label: t('footer.home') },
                { to: '/bikes', label: t('footer.bikes') },
                { to: '/bookings', label: t('footer.myBookings') },
                { to: '#', label: t('footer.guide') }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.to}
                    className="group flex items-center hover:text-neon transition-colors duration-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neon mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact details */}
          <div className="lg:col-span-3">
            <h5 className="font-display font-bold text-white mb-6 uppercase tracking-wider text-xs border-l-2 border-neon pl-3">
              {t('footer.contact')}
            </h5>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-neon shrink-0 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-neon shrink-0" />
                <a href="tel:0987654321" className="hover:text-neon transition-colors">098 765 4321</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-neon shrink-0" />
                <a href="mailto:hello@motov.com" className="hover:text-neon transition-colors">hello@motov.com</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Premium Newsletter Signup */}
          <div className="lg:col-span-3">
            <h5 className="font-display font-bold text-white mb-6 uppercase tracking-wider text-xs border-l-2 border-neon pl-3">
              {t('footer.newsletterTitle')}
            </h5>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              {t('footer.newsletterDesc')}
            </p>

            <div className="relative min-h-[50px]">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-neon/5 border border-neon/30 text-white text-xs relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_95%,rgba(204,255,0,0.15)_95%)] bg-[size:100%_20px] pointer-events-none opacity-20" />

                    <div className="w-9 h-9 rounded-lg bg-neon/15 border border-neon/40 flex items-center justify-center shrink-0 text-neon shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                      <Check size={18} strokeWidth={3} className="neon-text-glow" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-display font-black text-neon tracking-wider text-xs uppercase neon-text-glow">
                        {t('footer.newsletterSuccessHeader')}
                      </span>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        {t('footer.newsletterSuccess')}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <form onSubmit={handleSubscribe} className="relative flex items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === 'error') setStatus('idle');
                        }}
                        disabled={status === 'loading'}
                        placeholder={t('footer.newsletterPlaceholder')}
                        className={`w-full bg-dark/85 border rounded-lg py-2.5 pl-4 pr-12 text-xs text-white placeholder-gray-500 outline-none transition-all duration-300 ${status === 'error'
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-gray-800 focus:border-neon focus:ring-1 focus:ring-neon'
                          }`}
                      />
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="absolute right-1 w-8 h-8 rounded-md bg-neon hover:bg-white text-black flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50"
                      >
                        {status === 'loading' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>

                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-[10px] mt-1.5 pl-1"
                      >
                        {errorMsg}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 border-t border-gray-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} - Motov Da Nang. {t('footer.rightsReserved')}</p>
          <div className="flex items-center gap-6">
            <p>{t('footer.designBy')}</p>
            <motion.button
              onClick={scrollToTop}
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-lg bg-dark border border-gray-800 flex items-center justify-center text-gray-400 hover:text-neon hover:border-neon/50 transition-all duration-300 cursor-pointer"
              title="Scroll to top"
            >
              <ArrowUp size={14} />
            </motion.button>
          </div>
        </div>

      </div>
    </footer>
  );
};
