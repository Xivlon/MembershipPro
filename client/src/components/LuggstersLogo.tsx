import { Luggage, Sparkles } from "lucide-react";

interface LuggstersLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LuggstersLogo({ className = "", size = "md" }: LuggstersLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };

  const taglineSize = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm"
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-luggsters-green-400 to-luggsters-green-600 rounded-lg flex items-center justify-center shadow-lg`}>
          <Luggage className="text-white text-lg" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
      <div>
        <h1 className={`${textSizeClasses[size]} font-bold text-white`}>Luggsters</h1>
        <p className={`text-luggsters-green-400 ${taglineSize[size]} font-medium tracking-wide`}>
          WORRY FREE TRAVEL
        </p>
      </div>
    </div>
  );
}
