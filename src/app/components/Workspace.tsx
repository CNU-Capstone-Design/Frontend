import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { api, getEncryptionPassword } from '../utils/api';
import {
  ArrowLeft,
  Upload,
  Save,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Image as ImageIcon,
  Lock,
  Shield,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FACE_PARTS, FacePart, Simulation, Modification } from '../types/simulation';
import { getSimulation, saveSimulation } from '../utils/storage';
import { parseFace, generateMockMask } from '../utils/mockAI';
import { EncryptedImageGuard } from './EncryptedImageGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';

export function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [imageId, setImageId] = useState<string | null>(null);
  const [faceParts, setFaceParts] = useState<FacePart[]>(
    FACE_PARTS.map(part => ({ ...part, selected: false }))
  );
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [showMasks, setShowMasks] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(!id);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (id) {
      getSimulation(id).then(sim => {
        if (sim) {
          setSimulation(sim);
          setOriginalImage(sim.originalImage);
          setResultImage(sim.resultImage);
          setFaceParts(sim.faceParts);
          setModifications(sim.modifications);
          setShowUploadDialog(false);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (originalImage && canvasRef.current && originalImageRef.current) {
      const img = originalImageRef.current;
      img.onload = () => {
        drawMasks();
      };
    }
  }, [originalImage, faceParts, showMasks]);

  const drawMasks = () => {
    if (!canvasRef.current || !originalImageRef.current) return;
    
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (showMasks) {
      faceParts.forEach(part => {
        if (part.selected || selectedPart === part.id) {
          generateMockMask(canvas, part.id, canvas.width, canvas.height);
        }
      });
    }
  };

  // 파일 선택 시 state에만 저장 (비밀번호 입력 대기)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPendingFile(file);
  };

  const handleImageUpload = async () => {
    if (!pendingFile) return;

    // 갤러리 잠금 해제(암호화 비밀번호 입력) 없이는 업로드 불가
    if (!getEncryptionPassword()) {
      toast.error('먼저 갤러리에서 암호화 비밀번호를 입력해주세요.');
      navigate('/');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setIsProcessing(true);

      const result = await parseFace(imageData);
      if (!result.success) {
        setIsProcessing(false);
        setErrorMessage(result.message || '얼굴을 인식할 수 없습니다.');
        setShowErrorDialog(true);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', pendingFile);
        const res = await api.upload<{ image_id: string }>('/images/upload', formData);
        setImageId(res.image_id);
      } catch (err: any) {
        console.warn('이미지 백엔드 업로드 실패:', err.message);
      }

      setOriginalImage(imageData);
      setResultImage(imageData);
      setShowUploadDialog(false);
      setIsProcessing(false);
      setPendingFile(null);
      toast.success('얼굴 파싱이 완료되었습니다');
    };
    reader.readAsDataURL(pendingFile);
  };

  const handlePartToggle = (partId: string) => {
    setFaceParts(parts =>
      parts.map(part =>
        part.id === partId ? { ...part, selected: !part.selected } : part
      )
    );
    setSelectedPart(partId);
  };

  const handleIntensityChange = (value: number[]) => {
    if (!selectedPart) return;
    
    setModifications(mods => {
      const existing = mods.find(m => m.partId === selectedPart);
      if (existing) {
        return mods.map(m =>
          m.partId === selectedPart ? { ...m, intensity: value[0] } : m
        );
      }
      return [...mods, { partId: selectedPart, intensity: value[0] }];
    });
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPart) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setModifications(mods => {
        const existing = mods.find(m => m.partId === selectedPart);
        if (existing) {
          return mods.map(m =>
            m.partId === selectedPart ? { ...m, referenceImage: imageData } : m
          );
        }
        return [...mods, { partId: selectedPart, intensity: 50, referenceImage: imageData }];
      });
      toast.success('참조 이미지가 업로드되었습니다');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!originalImage) {
      toast.error('이미지를 먼저 업로드해주세요');
      return;
    }

    const newSimulation: Simulation = {
      id: simulation?.id || `sim_${Date.now()}`,
      name: simulation?.name || `시뮬레이션 ${new Date().toLocaleDateString('ko-KR')}`,
      createdAt: simulation?.createdAt || new Date(),
      originalImage,
      resultImage,
      faceParts,
      modifications,
    };

    try {
      await saveSimulation(newSimulation, imageId ?? undefined);
      toast.success('시뮬레이션이 저장되었습니다');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message ?? '저장에 실패했습니다.');
    }
  };

  // 기존 시뮬레이션 편집인데 이미지가 없으면 → 비밀번호 오류
  if (id && simulation && !originalImage) {
    return <EncryptedImageGuard />;
  }

  const selectedPartData = faceParts.find(p => p.id === selectedPart);
  const selectedModification = modifications.find(m => m.partId === selectedPart);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  돌아가기
                </Button>
              </Link>
              <div>
                <h1 className="text-xl text-slate-800">AI 워크스페이스</h1>
                <p className="text-sm text-slate-500">부위를 선택하고 수정을 적용하세요</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {simulation && (
                <>
                  <Link to={`/compare/${simulation.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      비교 모드
                    </Button>
                  </Link>
                  <Link to={`/medical/${simulation.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      의료진 모드
                    </Button>
                  </Link>
                </>
              )}
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Left: Original Image with Masks */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">원본 이미지</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mask-toggle" className="text-sm cursor-pointer">마스크</Label>
                  <Switch
                    id="mask-toggle"
                    checked={showMasks}
                    onCheckedChange={setShowMasks}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {originalImage ? (
                <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    ref={originalImageRef}
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                    <p>이미지를 업로드하세요</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Middle: Controls */}
          <Card className="lg:col-span-1 overflow-auto">
            <CardHeader>
              <CardTitle className="text-lg">부위 선택 및 조절</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Face Parts Selection */}
              <div>
                <Label className="mb-3 block">얼굴 부위 선택</Label>
                <div className="space-y-2">
                  {faceParts.map(part => (
                    <motion.div
                      key={part.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => handlePartToggle(part.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          part.selected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${selectedPart === part.id ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: part.color }}
                        />
                        <span className="flex-1 text-left text-sm">{part.name}</span>
                        {part.selected && (
                          <Badge variant="secondary" className="text-xs">선택됨</Badge>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Modification Controls */}
              {selectedPart && selectedPartData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div>
                    <h3 className="mb-3 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: selectedPartData.color }}
                      />
                      {selectedPartData.name} 수정
                    </h3>
                  </div>

                  {/* Reference Image Upload */}
                  <div>
                    <Label className="mb-2 block text-sm">참조 이미지 업로드</Label>
                    {selectedModification?.referenceImage ? (
                      <div className="relative">
                        <img
                          src={selectedModification.referenceImage}
                          alt="Reference"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setModifications(mods =>
                              mods.map(m =>
                                m.partId === selectedPart
                                  ? { ...m, referenceImage: undefined }
                                  : m
                              )
                            );
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceUpload}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm text-slate-600">클릭하여 참조 이미지 업로드</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Intensity Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">적용 강도</Label>
                      <span className="text-sm text-slate-600">
                        {selectedModification?.intensity || 0}%
                      </span>
                    </div>
                    <Slider
                      value={[selectedModification?.intensity || 0]}
                      onValueChange={handleIntensityChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Right: Result Preview */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">결과 프리뷰</CardTitle>
            </CardHeader>
            <CardContent>
              {resultImage ? (
                <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={resultImage}
                    alt="Result"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    실시간 프리뷰
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Eye className="w-16 h-16 mx-auto mb-4" />
                    <p>편집 결과가 여기에 표시됩니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>얼굴 사진 업로드</DialogTitle>
            <DialogDescription>
              정면을 바라보는 선명한 얼굴 사진을 업로드해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 파일 선택 */}
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                pendingFile ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              }`}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-10 h-10 mx-auto mb-3 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-600">얼굴을 분석하고 있습니다...</p>
                  </>
                ) : pendingFile ? (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-blue-700 font-medium">{pendingFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">클릭하여 다시 선택</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 mb-1">클릭하여 이미지 업로드</p>
                    <p className="text-xs text-slate-400">JPG, PNG 형식 지원</p>
                  </>
                )}
              </div>
            </label>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  회원가입 시 설정한 암호화 비밀번호로 자동 암호화됩니다.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleImageUpload}
              disabled={!pendingFile || isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />분석 중...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />업로드 및 분석</>
              )}
            </Button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                  <li>정면을 바라보는 사진</li>
                  <li>충분한 조명 / 얼굴이 가려지지 않은 사진</li>
                  <li>고해상도 이미지 권장</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              얼굴 인식 실패
            </DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-3">다음을 확인해주세요:</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                <li>정면을 바라보는 사진인가요?</li>
                <li>얼굴이 선명하게 보이나요?</li>
                <li>조명이 충분한가요?</li>
                <li>얼굴이 가려지지 않았나요?</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowErrorDialog(false)}
              >
                취소
              </Button>
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button className="w-full">
                  다시 시도
                </Button>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
