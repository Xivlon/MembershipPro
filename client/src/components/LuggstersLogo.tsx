import luggstersLogoPath from "@assets/luggsters-logo_1750795585461.png";

interface LuggstersLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LuggstersLogo({ className = "", size = "md" }: LuggstersLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12", 
    lg: "h-16"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={luggstersLogoPath} 
        alt="Luggsters - Worry Free Travel" 
        className={`${sizeClasses[size]} w-auto`}
      />
    </div>
  );
}
