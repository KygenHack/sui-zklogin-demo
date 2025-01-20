import  { useState, useEffect } from 'react';
import { Button, LinearProgress } from "@mui/material";
import { suistakeLogo, sui } from "../images";
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const slides = [
    {
      title: "Welcome to SUI Stake It",
      description: "Discover the power of staking with SUI. Earn rewards and grow your assets.",
      image: suistakeLogo,
    },
    {
      title: "Fast & Scalable",
      description: "Experience lightning-fast transactions and unlimited scalability with SUI.",
      image: sui,
    },
    {
      title: "Secure & Reliable",
      description: "Built with advanced cryptography and security measures to protect your assets.",
      image: sui,
    },
    {
      title: "User-Friendly",
      description: "Designed for both beginners and advanced users. Start your journey with ease.",
      image: sui,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 100 / (slides.length * 50);
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [slides.length]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#1A1A2F] text-white p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <img src={slides[currentSlide].image} alt={slides[currentSlide].title} className="w-40 h-40 mx-auto drop-shadow-2xl" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">{slides[currentSlide].title}</h1>
            <p className="text-white/80 text-lg">{slides[currentSlide].description}</p>
          </motion.div>
        </AnimatePresence>
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-[#0066FF] via-blue-500 to-blue-600 hover:from-[#0052cc] hover:via-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-lg font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
        >
          {currentSlide < slides.length - 1 ? "Next" : "Get Started"}
        </Button>
        <div className="pt-4">
          <LinearProgress variant="determinate" value={progress} className="rounded-full" />
          <p className="text-sm text-white/60 mt-2">{`${Math.round(progress)}% Complete`}</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;