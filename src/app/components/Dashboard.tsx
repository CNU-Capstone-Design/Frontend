import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Trash2, Eye, Shield, Lock, User as UserIcon, LogOut, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion } from 'motion/react';
import { getSimulations, deleteSimulation } from '../utils/storage';
import { Simulation } from '../types/simulation';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from './ui/alert-dialog';
import { getCurrentUser, logout } from '../utils/auth';
import { setEncryptionPassword, getEncryptionPassword, api, hashEncryptionPassword } from '../utils/api';

export function Dashboard() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [encInput, setEncInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    // 이미 세션에 비밀번호가 있으면 바로 잠금 해제
    if (getEncryptionPassword()) {
      setUnlocked(true);
      loadSimulations();
    }
  }, []);

  const loadSimulations = async () => {
    try {
      const data = await getSimulations();
      setSimulations(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err: any) {
      toast.error(err.message ?? '갤러리를 불러오지 못했습니다.');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encInput.trim()) return;

    try {
      // SHA-256 해시로 변환 후 서버 검증 (원문은 서버로 전송 안 됨)
      const hashed = await hashEncryptionPassword(encInput.trim());
      await api.post('/auth/verify-encryption-password', {
        encryption_password: hashed,
      });
      // 검증 성공 → 세션 메모리에 저장
      setEncryptionPassword(encInput.trim());
      setUnlocked(true);
      setEncInput('');
      await loadSimulations();
    } catch (err: any) {
      toast.error('암호화 비밀번호가 올바르지 않습니다.');
      setEncInput('');
    }
  };

  const handleLock = () => {
    setEncryptionPassword('');
    setUnlocked(false);
    setSimulations([]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSimulation(id);
      await loadSimulations();
      toast.success('시뮬레이션이 삭제되었습니다');
    } catch (err: any) {
      toast.error(err.message ?? '삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('로그아웃되었습니다');
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 text-slate-800">AI 성형 시뮬레이션</h1>
              <p className="text-slate-600">전문적인 시뮬레이션으로 미래의 모습을 미리 확인하세요</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">AES-256 암호화</span>
              </div>
              {unlocked ? (
                <button onClick={handleLock}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">잠그기</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-700">잠김</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <UserIcon className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700">{user?.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 새 시뮬레이션 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-8 bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl mb-2">새로운 시뮬레이션 시작</h2>
                  <p className="text-blue-100">얼굴 사진을 업로드하고 원하는 부위를 선택해 시뮬레이션을 시작하세요</p>
                </div>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate('/workspace')}>
                  <Plus className="w-5 h-5 mr-2" />
                  시작하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AES 비밀번호 입력 / 잠금 해제 */}
        {!unlocked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">갤러리 잠금 해제</p>
                <p className="text-sm text-amber-700">이미지 암호화 비밀번호를 입력해야 사진을 볼 수 있습니다.</p>
              </div>
            </div>
            <form onSubmit={handleUnlock} className="flex gap-3">
              <input
                type="password"
                placeholder="이미지 암호화 비밀번호"
                value={encInput}
                onChange={e => setEncInput(e.target.value)}
                className="flex-1 px-4 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                <Lock className="w-4 h-4 mr-2" />
                잠금 해제
              </Button>
            </form>
          </motion.div>
        )}

        {/* 갤러리 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-slate-800">내 갤러리</h2>
            <p className="text-slate-600 mt-1">저장된 시뮬레이션: {simulations.length}개</p>
          </div>
        </div>

        {simulations.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-slate-400">
              <Eye className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">{unlocked ? '아직 시뮬레이션이 없습니다' : '비밀번호를 입력하면 시뮬레이션이 표시됩니다'}</p>
              <p className="text-sm">{unlocked ? '새로운 시뮬레이션을 시작해보세요' : ''}</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map((sim, index) => (
              <motion.div key={sim.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 border-slate-200">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {sim.originalImage ? (
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 relative">
                          <img src={sim.originalImage} alt="Before" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded">Before</div>
                        </div>
                        <div className="flex-1 relative">
                          <img src={sim.resultImage} alt="After" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded">After</div>
                        </div>
                      </div>
                    ) : (
                      /* 비밀번호 미입력 시 경고 placeholder */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 gap-3">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                        <p className="text-sm text-slate-600 text-center px-4">
                          암호화 비밀번호를 입력해야<br />이미지를 볼 수 있습니다
                        </p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 text-slate-800">{sim.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {new Date(sim.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex gap-2">
                      <Link to={`/workspace/${sim.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">편집</Button>
                      </Link>
                      <Link to={`/compare/${sim.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <Eye className="w-4 h-4 mr-1" />비교
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>시뮬레이션 삭제</AlertDialogTitle>
                            <AlertDialogDescription>이 시뮬레이션을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(sim.id)} className="bg-red-600 hover:bg-red-700">삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
