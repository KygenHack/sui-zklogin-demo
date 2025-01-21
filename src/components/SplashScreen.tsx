import  { useState, useEffect } from 'react';
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
      gradient: "from-blue-400 to-purple-600",
    },
    {
      title: "Fast & Scalable",
      description: "Experience lightning-fast transactions and unlimited scalability with SUI.",
      image: sui,
      gradient: "from-green-400 to-blue-500",
    },
    {
      title: "Secure & Reliable",
      description: "Built with advanced cryptography and security measures to protect your assets.",
      image: sui,
      gradient: "from-yellow-400 to-orange-500",
    },
    {
      title: "User-Friendly",
      description: "Designed for both beginners and advanced users. Start your journey with ease.",
      image: sui,
      gradient: "from-pink-400 to-red-500",
    },
  ];


  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevSlide) => {
        if (prevSlide < slides.length - 1) {
          return prevSlide + 1;
        } else {
          clearInterval(slideInterval);
          onComplete();
          return prevSlide;
        }
      });
    }, 5000); // Change slide every 5 seconds

    const progressInterval = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 100 / (slides.length * 50);
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressInterval);
    };
  }, [slides.length, onComplete]);

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
            className={`space-y-6 p-8 rounded-2xl bg-gradient-to-br ${slides[currentSlide].gradient}`}
          >
            <img src={slides[currentSlide].image} alt={slides[currentSlide].title} className="w-40 h-40 mx-auto drop-shadow-2xl" />
            <h1 className="text-4xl font-bold text-white">{slides[currentSlide].title}</h1>
            <p className="text-white/90 text-lg">{slides[currentSlide].description}</p>
          </motion.div>

        </AnimatePresence>
        <div className="pt-8">
          <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-white/80">
            <span>Loading...</span>
            <span>{`${Math.round(progress)}%`}</span>
          </div>
          <p className="text-sm text-white/60 mt-2 italic">Preparing your staking adventure...</p>
        </div>


       
      </div>
    </div>
  );
};

export default SplashScreen;