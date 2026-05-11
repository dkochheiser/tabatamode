import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Smartphone, Scale, ArrowLeft } from 'lucide-react';

interface PrivacyViewProps {
  onBack: () => void;
  key?: string;
}

export function PrivacyView({ onBack }: PrivacyViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto w-full p-8 lg:p-12"
    >
      <div className="flex flex-col gap-12">
        <header className="flex flex-col gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group w-fit"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Back to Training</span>
          </button>
          <div className="flex flex-col gap-2">
            <h1 className="text-6xl lg:text-8xl font-display uppercase italic tracking-tighter leading-none">
              PRIVACY<span className="text-neon-lime">POLICY</span>
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.4em]">SYSTEM_LEGAL_DOC_V1.0</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-zinc-400 font-mono text-sm leading-relaxed">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center text-neon-lime">
                  <Shield size={18} />
                </div>
                <h2 className="text-xl font-display uppercase italic tracking-tight">Zero Tracking Policy</h2>
              </div>
              <p>
                TABATAMODE is built on the principle of absolute privacy. We do not use cookies, tracking pixels, or any third-party analytics services. Your activity is your business.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center text-neon-lime">
                  <Lock size={18} />
                </div>
                <h2 className="text-xl font-display uppercase italic tracking-tight">Data Sovereignty</h2>
              </div>
              <p>
                No personal information, workout history, or configuration data is ever uploaded to our servers or any cloud service. We do not have a backend database for user data.
              </p>
            </section>Section Content
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center text-neon-lime">
                  <Smartphone size={18} />
                </div>
                <h2 className="text-xl font-display uppercase italic tracking-tight">On-Device Storage</h2>
              </div>
              <p>
                All information, including your custom routines and workout history, is stored exclusively on your device using LocalStorage. Clearing your browser data will permanently remove this information.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center text-neon-lime">
                  <Scale size={18} />
                </div>
                <h2 className="text-xl font-display uppercase italic tracking-tight">Legal Notice</h2>
              </div>
              <p>
                © {new Date().getFullYear()} TABATAMODE. All rights reserved. The TABATAMODE name and identity are trademarked. Unauthorized reproduction of the system interface or core logic is strictly prohibited.
              </p>
            </section>
          </div>
        </div>

        <div className="pt-12 border-t border-zinc-900 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.5em] font-bold">
            TABATAMODE IS A PRODUCT OF RED POINT APPS // DESIGNED FOR HUMAN PERFORMANCE
          </p>
        </div>
      </div>
    </motion.div>
  );
}
