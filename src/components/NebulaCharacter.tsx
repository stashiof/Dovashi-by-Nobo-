import React, { useEffect, useRef, useState } from 'react';

interface NebulaCharacterProps {
  tutorState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'dancing';
  audioLevel?: number;
}

const mouthShapes = [
  { rx: 12, ry: 3, tongue: "M 152,218 Q 160,219 168,218 Q 160,221 152,218 Z" }, // ম, ব, প (বন্ধ)
  { rx: 10, ry: 8, tongue: "M 154,217 Q 160,221 166,217 Q 160,223 154,217 Z" }, // আ, এ
  { rx: 14, ry: 5, tongue: "M 150,218 Q 160,219 170,218 Q 160,222 150,218 Z" }, // ই, ঈ
  { rx: 8, ry: 10, tongue: "M 155,216 Q 160,222 165,216 Q 160,224 155,216 Z" }, // ও, উ
  { rx: 10, ry: 12, tongue: "M 154,215 Q 160,223 166,215 Q 160,225 154,215 Z" }  // বড় স্বর
];

export const NebulaCharacter: React.FC<NebulaCharacterProps> = ({ tutorState, audioLevel }) => {
  const mouthTalkRef = useRef<SVGEllipseElement>(null);
  const tongueRef = useRef<SVGPathElement>(null);
  const pupilLeftRef = useRef<SVGCircleElement>(null);
  const pupilRightRef = useRef<SVGCircleElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 3000;
      timeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 120);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Pupil Tracking Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!charRef.current) return;
      const rect = charRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(Math.hypot(dx, dy) / 50, 4);
      const moveX = Math.cos(angle) * distance;
      const moveY = Math.sin(angle) * distance;

      if (pupilLeftRef.current) pupilLeftRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      if (pupilRightRef.current) pupilRightRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Lip Sync Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tutorState === 'speaking') {
      let lastShape = 0;
      interval = setInterval(() => {
        let nextShape;
        do {
          nextShape = Math.floor(Math.random() * mouthShapes.length);
        } while (nextShape === lastShape);
        lastShape = nextShape;
        const shape = mouthShapes[nextShape];
        
        if (mouthTalkRef.current) {
          mouthTalkRef.current.setAttribute('rx', shape.rx.toString());
          mouthTalkRef.current.setAttribute('ry', shape.ry.toString());
        }
        if (tongueRef.current) {
          tongueRef.current.setAttribute('d', shape.tongue);
        }
      }, 90);
    } else {
      if (mouthTalkRef.current) {
        mouthTalkRef.current.setAttribute('rx', '12');
        mouthTalkRef.current.setAttribute('ry', '3');
      }
    }
    return () => clearInterval(interval);
  }, [tutorState]);

  const stageClasses = [
    'nebula-stage',
    tutorState === 'speaking' ? 'speaking' : '',
    tutorState === 'thinking' ? 'thinking' : '',
    isBlinking ? 'blinking' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="nebula-wrapper relative w-full max-w-[320px] aspect-square mx-auto rounded-3xl overflow-hidden skin-ocean flex items-center justify-center">
      <style>{`
        .nebula-wrapper {
          --skin-primary: #00B4D8;
          --skin-secondary: #0077B6;
          --skin-dark: #03045E;
          --skin-accent: #90E0EF;
          --skin-belly: #CAF0F8;
          --skin-eye: #00F5D4;
          --skin-eye-deep: #005F73;
          --skin-aura: rgba(0, 119, 182, 0.4);
          --skin-inner-mouth: #03045E;
        }
        .nebula-space-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 50% at 20% 10%, var(--skin-aura), transparent 60%), linear-gradient(180deg, #0B0C15 0%, #05060A 100%);
          z-index: 0;
        }
        .nebula-stars-layer {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(1px 1px at 20px 30px, white, transparent), radial-gradient(1px 1px at 40px 70px, white, transparent), radial-gradient(1px 1px at 90px 40px, white, transparent);
          background-size: 200px 200px;
          opacity: 0.3;
          animation: nebula-twinkle-bg 4s ease-in-out infinite;
        }
        @keyframes nebula-twinkle-bg { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }
        
        .nebula-orb { position: absolute; border-radius: 50%; background: radial-gradient(circle, var(--skin-accent) 0%, transparent 70%); opacity: 0.6; z-index: 1; filter: blur(2px); animation: nebula-float-orb 8s ease-in-out infinite; }
        .nebula-orb.o1 { width: 15px; height: 15px; top: 15%; left: 10%; } 
        .nebula-orb.o2 { width: 10px; height: 10px; top: 25%; right: 15%; animation-delay: 3s; } 
        .nebula-orb.o3 { width: 12px; height: 12px; bottom: 25%; left: 20%; animation-delay: 6s; }
        @keyframes nebula-float-orb { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; } 50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; } }

        .nebula-stage { position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        
        .nebula-platform-base { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); width: 180px; height: 30px; background: radial-gradient(ellipse at center, var(--skin-accent) 0%, transparent 70%); filter: blur(5px); opacity: 0.6; z-index: 1; border-radius: 50%; }
        .nebula-platform-ring { position: absolute; bottom: 11%; left: 50%; transform: translateX(-50%); width: 160px; height: 20px; border: 2px solid var(--skin-accent); border-radius: 50%; opacity: 0.4; z-index: 1; box-shadow: 0 0 15px var(--skin-accent); }

        .nebula-aura-container { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; pointer-events: none; }
        .nebula-aura-ring { position: absolute; top: 50%; left: 50%; border-radius: 50%; border: 1px solid var(--skin-primary); transform: translate(-50%, -50%) scale(0.8); opacity: 0; transition: all 0.5s; }
        .nebula-aura-r1 { width: 200px; height: 200px; } .nebula-aura-r2 { width: 250px; height: 250px; } .nebula-aura-r3 { width: 300px; height: 300px; }
        .nebula-stage.speaking .nebula-aura-ring, .nebula-stage.thinking .nebula-aura-ring { opacity: 1; animation: nebula-pulse-ring 2.5s ease-out infinite; }
        .nebula-stage.speaking .nebula-aura-r2 { animation-delay: 0.6s; } .nebula-stage.speaking .nebula-aura-r3 { animation-delay: 1.2s; }
        @keyframes nebula-pulse-ring { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; } 100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; } }

        .nebula-character { width: 280px; height: 320px; position: relative; animation: char-float 6s ease-in-out infinite; filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.5)); z-index: 5; margin-bottom: 20px; }
        @keyframes char-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .nebula-stage.thinking .nebula-character { animation: char-think 2s ease-in-out infinite; }
        @keyframes char-think { 0%, 100% { transform: rotate(0deg) translateY(0); } 50% { transform: rotate(4deg) translateY(-5px); } }
        .nebula-stage.speaking .nebula-character { animation: char-speak 0.5s ease-in-out infinite; }
        @keyframes char-speak { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

        .nebula-ear-left { transform-origin: 120px 140px; animation: ear-l-idle 6s ease-in-out infinite; }
        .nebula-ear-right { transform-origin: 200px 140px; animation: ear-r-idle 6s ease-in-out infinite 1s; }
        .nebula-body-group { transform-origin: 160px 220px; animation: body-breathe 5s ease-in-out infinite; }
        .nebula-head-group { transform-origin: 160px 160px; animation: head-breathe 5s ease-in-out infinite; }
        
        @keyframes ear-l-idle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(-7deg); } }
        @keyframes ear-r-idle { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(7deg); } }
        @keyframes body-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(0.98, 1.03); } }
        @keyframes head-breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        
        .nebula-stage.speaking .nebula-ear-left { animation: ear-l-talk 0.3s ease-in-out infinite; }
        .nebula-stage.speaking .nebula-ear-right { animation: ear-r-talk 0.3s ease-in-out infinite; }
        @keyframes ear-l-talk { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(-14deg); } }
        @keyframes ear-r-talk { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(14deg); } }

        .nebula-eye-l-grp, .nebula-eye-r-grp { transform-origin: center top; transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1); }
        .nebula-stage.blinking .nebula-eye-l-grp, .nebula-stage.blinking .nebula-eye-r-grp { transform: scaleY(0.05); }
        .nebula-lid-line-l, .nebula-lid-line-r { opacity: 0; transition: opacity 0.08s; }
        .nebula-stage.blinking .nebula-lid-line-l, .nebula-stage.blinking .nebula-lid-line-r { opacity: 1; transition-delay: 0.04s; }

        .nebula-mouth-smile { transition: opacity 0.2s; }
        .nebula-mouth-talk-grp { opacity: 0; transition: opacity 0.1s; }
        .nebula-stage.speaking .nebula-mouth-smile { opacity: 0; }
        .nebula-stage.speaking .nebula-mouth-talk-grp { opacity: 1; }
        
        #mouth-talk { transition: rx 0.08s ease-out, ry 0.08s ease-out; }
        #tongue { transition: d 0.08s ease-out; }
      `}</style>

      <div className="nebula-space-bg">
        <div className="nebula-stars-layer"></div>
        <div className="nebula-orb o1"></div>
        <div className="nebula-orb o2"></div>
        <div className="nebula-orb o3"></div>
      </div>

      <div className="nebula-platform-base"></div>
      <div className="nebula-platform-ring"></div>
      
      <div className="nebula-aura-container">
        <div className="nebula-aura-ring nebula-aura-r1"></div>
        <div className="nebula-aura-ring nebula-aura-r2"></div>
        <div className="nebula-aura-ring nebula-aura-r3"></div>
      </div>

      <div className={stageClasses}>
        <div className="nebula-character" ref={charRef}>
          <svg viewBox="0 0 320 400" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="bodyGrad" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="var(--skin-primary)" />
                <stop offset="70%" stopColor="var(--skin-secondary)" />
                <stop offset="100%" stopColor="var(--skin-dark)" />
              </radialGradient>
              <radialGradient id="bellyGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="var(--skin-belly)" />
              </radialGradient>
              <linearGradient id="earInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--skin-accent)" />
                <stop offset="100%" stopColor="var(--skin-primary)" />
              </linearGradient>
              <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--skin-accent)" />
                <stop offset="40%" stopColor="var(--skin-eye)" />
                <stop offset="80%" stopColor="var(--skin-eye-deep)" />
                <stop offset="100%" stopColor="#05060A" />
              </radialGradient>
              <radialGradient id="scleraGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E0D8C8" />
              </radialGradient>
              <linearGradient id="noseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--skin-secondary)" />
                <stop offset="100%" stopColor="var(--skin-dark)" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFADF" />
                <stop offset="50%" stopColor="var(--skin-accent)" />
                <stop offset="100%" stopColor="var(--skin-primary)" />
              </linearGradient>
              <filter id="furTexture" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
              </filter>
              <clipPath id="eyeClipLeft">
                <ellipse cx="125" cy="160" rx="25" ry="28" />
              </clipPath>
              <clipPath id="eyeClipRight">
                <ellipse cx="195" cy="160" rx="25" ry="28" />
              </clipPath>
            </defs>

            <path d="M 80,180 C 20,160 0,200 30,230 C 60,200 70,190 80,180 Z" fill="var(--skin-primary)" opacity="0.6" filter="url(#glow)" />
            <path d="M 240,180 C 300,160 320,200 290,230 C 260,200 250,190 240,180 Z" fill="var(--skin-primary)" opacity="0.6" filter="url(#glow)" />

            <g className="nebula-ear-left">
              <path d="M 120,140 C 70,60 80,20 120,10 C 160,10 170,60 140,120 Z" fill="url(#bodyGrad)" filter="url(#furTexture)" />
              <path d="M 125,130 C 90,70 100,35 125,30 C 150,30 155,70 135,110 Z" fill="url(#earInnerGrad)" opacity="0.9" />
            </g>
            <g className="nebula-ear-right">
              <path d="M 200,140 C 250,60 240,20 200,10 C 160,10 150,60 180,120 Z" fill="url(#bodyGrad)" filter="url(#furTexture)" />
              <path d="M 195,130 C 230,70 220,35 195,30 C 170,30 165,70 185,110 Z" fill="url(#earInnerGrad)" opacity="0.9" />
            </g>

            <g className="nebula-body-group">
              <path d="M 160,100 C 230,100 260,150 260,210 C 260,260 220,290 160,290 C 100,290 60,260 60,210 C 60,150 90,100 160,100 Z" fill="url(#bodyGrad)" filter="url(#furTexture)" />
              <path d="M 160,150 C 200,150 230,180 230,220 C 230,260 200,280 160,280 C 120,280 90,260 90,220 C 90,180 120,150 160,150 Z" fill="url(#bellyGrad)" filter="url(#softShadow)" />
              <path d="M 95,175 Q 160,195 225,175" stroke="url(#goldGrad)" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#glow)" />
              <polygon points="160,190 164,202 176,202 166,210 170,222 160,214 150,222 154,210 144,202 156,202" fill="url(#goldGrad)" filter="url(#glow)" />
              <ellipse cx="95" cy="240" rx="20" ry="15" fill="url(#bodyGrad)" transform="rotate(-25 95 240)" filter="url(#softShadow)" />
              <ellipse cx="225" cy="240" rx="20" ry="15" fill="url(#bodyGrad)" transform="rotate(25 225 240)" filter="url(#softShadow)" />
            </g>

            <g className="nebula-head-group">
              <ellipse cx="160" cy="210" rx="45" ry="30" fill="url(#bellyGrad)" filter="url(#softShadow)" />
              
              <g className="nebula-normal-eyes">
                <g className="nebula-eye-l-grp" style={{ transformOrigin: '125px 135px' }}>
                  <ellipse cx="125" cy="160" rx="25" ry="28" fill="url(#scleraGrad)" filter="url(#softShadow)" />
                  <g clipPath="url(#eyeClipLeft)">
                    <g className="nebula-pupils" ref={pupilLeftRef as any}>
                      <circle cx="125" cy="160" r="16" fill="url(#irisGrad)" />
                      <circle cx="125" cy="160" r="8" fill="#05060A" />
                      <circle cx="130" cy="155" r="5" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="120" cy="165" r="2.5" fill="#FFFFFF" opacity="0.8" />
                    </g>
                  </g>
                </g>
                <path className="nebula-lid-line-l" d="M 102,160 Q 125,168 148,160" stroke="var(--skin-dark)" strokeWidth="4" fill="none" strokeLinecap="round" />
                
                <g className="nebula-eye-r-grp" style={{ transformOrigin: '195px 135px' }}>
                  <ellipse cx="195" cy="160" rx="25" ry="28" fill="url(#scleraGrad)" filter="url(#softShadow)" />
                  <g clipPath="url(#eyeClipRight)">
                    <g className="nebula-pupils" ref={pupilRightRef as any}>
                      <circle cx="195" cy="160" r="16" fill="url(#irisGrad)" />
                      <circle cx="195" cy="160" r="8" fill="#05060A" />
                      <circle cx="200" cy="155" r="5" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="190" cy="165" r="2.5" fill="#FFFFFF" opacity="0.8" />
                    </g>
                  </g>
                </g>
                <path className="nebula-lid-line-r" d="M 172,160 Q 195,168 218,160" stroke="var(--skin-dark)" strokeWidth="4" fill="none" strokeLinecap="round" />
              </g>

              <path className="nebula-brow-normal" d="M 100,125 Q 125,115 150,125" stroke="var(--skin-dark)" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path className="nebula-brow-normal" d="M 170,125 Q 195,115 220,125" stroke="var(--skin-dark)" strokeWidth="5" fill="none" strokeLinecap="round" />

              <ellipse cx="90" cy="190" rx="15" ry="10" fill="#FF4B6E" opacity="0.3" filter="url(#glow)" />
              <ellipse cx="230" cy="190" rx="15" ry="10" fill="#FF4B6E" opacity="0.3" filter="url(#glow)" />

              <path d="M 152,195 Q 160,205 168,195 Q 166,210 160,210 Q 154,210 152,195 Z" fill="url(#noseGrad)" filter="url(#softShadow)" />
              
              {/* Smile */}
              <path className="nebula-mouth-smile" d="M 140,215 Q 160,230 180,215" stroke="url(#noseGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
              
              {/* Talk Mouth */}
              <g className="nebula-mouth-talk-grp">
                 <ellipse id="mouth-talk" ref={mouthTalkRef} cx="160" cy="218" rx="10" ry="2" fill="var(--skin-inner-mouth)" filter="url(#softShadow)" />
                 <path id="tongue" ref={tongueRef} d="M 152,218 Q 160,220 168,218 Q 160,222 152,218 Z" fill="#F2789F" opacity="0.9" />
                 <path d="M 150,212 Q 160,210 170,212" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
              </g>
            </g>
            <polygon points="160,50 166,70 186,70 170,82 176,102 160,90 144,102 150,82 134,70 154,70" fill="url(#goldGrad)" filter="url(#glow)" />
          </svg>
        </div>
      </div>
    </div>
  );
};
