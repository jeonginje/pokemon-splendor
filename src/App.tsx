import { useState, useEffect } from 'react';
import type { GameState } from './types/game';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { RulesModal } from './components/RulesModal';
import { AdminStudioModal } from './components/AdminStudioModal';
import { LoadingScreen } from './components/LoadingScreen';
import { subscribeToOnlineRoom, initFirebase } from './services/firebase';

export function App() {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // 앱 로드시 Firebase 초기화 시도
  useEffect(() => {
    initFirebase();
  }, []);

  // 온라인 룸 구독
  useEffect(() => {
    if (!isOnline || !gameState?.roomId) return;

    const unsubscribe = subscribeToOnlineRoom(gameState.roomId, (updated) => {
      setGameState(updated);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline, gameState?.roomId]);

  const handleStartGame = (state: GameState, online: boolean, playerId: string) => {
    setGameState(state);
    setIsOnline(online);
    setMyPlayerId(playerId);
  };

  const handleExitGame = () => {
    setGameState(null);
    setIsOnline(false);
    setMyPlayerId('');
  };

  if (!isAssetsLoaded) {
    return <LoadingScreen onComplete={() => setIsAssetsLoaded(true)} />;
  }

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 transition-colors duration-500 ${gameState ? 'bg-slate-950' : 'animated-lobby-bg'}`}>
      <main className="flex-1 flex flex-col justify-center">
        {gameState ? (
          <Board
            gameState={gameState}
            isOnline={isOnline}
            myPlayerId={myPlayerId}
            onExit={handleExitGame}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        ) : (
          <div className="py-8 px-4 flex items-center justify-center min-h-[90vh]">
            <Lobby
              onStartGame={handleStartGame}
              onOpenRules={() => setIsRulesOpen(true)}
              onOpenAdmin={() => setIsAdminOpen(true)}
            />
          </div>
        )}
      </main>

      {/* 룰북 모달 */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* 관리자 그림 교체 스튜디오 모달 */}
      <AdminStudioModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

export default App;
