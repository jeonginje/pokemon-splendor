import React, { useState } from 'react';
import type { FirebaseConfig } from '../services/firebase';
import { getStoredFirebaseConfig, saveStoredFirebaseConfig, initFirebase } from '../services/firebase';
import { Flame, Check, X } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const current = getStoredFirebaseConfig();

  const [rawText, setRawText] = useState('');
  const [apiKey, setApiKey] = useState(current?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(current?.authDomain || '');
  const [databaseURL, setDatabaseURL] = useState(current?.databaseURL || '');
  const [projectId, setProjectId] = useState(current?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(current?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(current?.messagingSenderId || '');
  const [appId, setAppId] = useState(current?.appId || '');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Firebase 콘솔의 const firebaseConfig = { ... } 코드를 자동 파싱
  const handleParseRawText = () => {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').replace(/;$/, '').trim();
      }
      // JSON 객체 파싱 또는 키-값 매칭
      const extract = (key: string) => {
        const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
        const match = cleaned.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extract('apiKey');
      const extractedProjectId = extract('projectId');
      const extractedDbUrl = extract('databaseURL');

      if (extractedApiKey && (extractedProjectId || extractedDbUrl)) {
        setApiKey(extractedApiKey);
        setAuthDomain(extract('authDomain'));
        setProjectId(extractedProjectId);
        setDatabaseURL(
          extractedDbUrl || (extractedProjectId ? `https://${extractedProjectId}-default-rtdb.firebaseio.com` : '')
        );
        setStorageBucket(extract('storageBucket'));
        setMessagingSenderId(extract('messagingSenderId'));
        setAppId(extract('appId'));
        setMsg({ type: 'success', text: 'Firebase 설정 정보가 자동으로 인식되었습니다!' });
      } else {
        setMsg({ type: 'error', text: '올바른 Firebase Config 형식을 인식하지 못했습니다.' });
      }
    } catch {
      setMsg({ type: 'error', text: '파싱 중 오류가 발생했습니다.' });
    }
  };

  const handleSave = () => {
    if (!apiKey || !projectId) {
      setMsg({ type: 'error', text: 'apiKey와 projectId는 필수 입력 항목입니다.' });
      return;
    }

    const newConfig: FirebaseConfig = {
      apiKey,
      authDomain,
      databaseURL: databaseURL.trim() || (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : ''),
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    saveStoredFirebaseConfig(newConfig);
    const db = initFirebase(newConfig);

    if (db) {
      setMsg({ type: 'success', text: 'Firebase Realtime Database 연결이 성공적으로 저장되었습니다!' });
      setTimeout(() => {
        onConfigSaved();
        onClose();
      }, 700);
    } else {
      setMsg({ type: 'error', text: 'Firebase 초기화에 실패했습니다. 키를 확인해주세요.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-amber-400 mb-2">
          <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />
          <h2 className="text-xl font-black text-white">Firebase Realtime DB 연동 설정</h2>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          친구들과 원격에서 실시간으로 방을 만들어 플레이하려면 Firebase Realtime Database 설정이 필요합니다.
          <br />
          <span className="text-slate-400">
            (index.html의 script에 설정하거나, 아래에 firebaseConfig 코드를 복사·붙여넣기하세요.)
          </span>
        </p>

        {msg && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* 간편 붙여넣기 영역 */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 mb-1">
            간편 붙여넣기 (firebaseConfig 객체 통째로 붙여넣기)
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="const firebaseConfig = { apiKey: '...', databaseURL: '...', projectId: '...' };"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleParseRawText}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              분석 적용
            </button>
          </div>
        </div>

        {/* 개별 입력 필드 */}
        <div className="space-y-2 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">API Key *</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">Database URL (선택, 미입력 시 자동추론)</label>
            <input
              type="text"
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
              placeholder="https://your-app-default-rtdb.firebaseio.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">Project ID *</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="pokemon-splendor"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">Auth Domain</label>
            <input
              type="text"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              placeholder="pokemon-splendor.firebaseapp.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
