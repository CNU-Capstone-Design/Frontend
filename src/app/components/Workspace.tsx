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
import { parseFace } from '../utils/mockAI';
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
  const [showMasks, setShowMasks] = useState(false);
  const [segmentMasks, setSegmentMasks] = useState<Record<string, string> | null>(null);
  const [isFetchingMasks, setIsFetchingMasks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // FacePart id 가 모델 region 이름과 동일하므로 그대로 사용
  const PART_TO_REGION: Record<string, string> = {
    skin:  'skin',
    brow:  'brow',
    eye:   'eye',
    nose:  'nose',
    mouth: 'mouth',
    hair:  'hair',
    ear:   'ear',
    neck:  'neck',
  };

  useEffect(() => {
    if (originalImage && canvasRef.current && originalImageRef.current) {
      const img = originalImageRef.current;
      if (img.complete) drawMasks();
      else img.onload = () => drawMasks();
    }
  }, [originalImage, faceParts, showMasks, segmentMasks, selectedPart]);

  const drawMasks = async () => {
    if (!canvasRef.current || !originalImageRef.current) return;

    const canvas = canvasRef.current;
    const img    = originalImageRef.current;
    const W      = img.naturalWidth  || img.width  || 256;
    const H      = img.naturalHeight || img.height || 256;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    if (!showMasks || !segmentMasks) return;

    const partsToShow = faceParts.filter(p => p.selected);

    for (const part of partsToShow) {
      const regionName = PART_TO_REGION[part.id];
      const maskB64    = segmentMasks[regionName];
      if (!maskB64) continue;

      await new Promise<void>(resolve => {
        const maskImg = new window.Image();
        maskImg.onload = () => {
          // 오프스크린에 마스크 그리기
          const off    = document.createElement('canvas');
          off.width    = W;
          off.height   = H;
          const offCtx = off.getContext('2d')!;
          offCtx.drawImage(maskImg, 0, 0, W, H);

          // 마스크 픽셀 → part color 로 채운 오버레이 생성
          const maskPx  = offCtx.getImageData(0, 0, W, H);
          const overlay = offCtx.createImageData(W, H);
          const hex = part.color.replace('#', '');
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);

          for (let i = 0; i < maskPx.data.length; i += 4) {
            if (maskPx.data[i] > 128) {
              overlay.data[i]     = r;
              overlay.data[i + 1] = g;
              overlay.data[i + 2] = b;
              overlay.data[i + 3] = 150;
            }
          }

          // 오프스크린에 overlay 얹은 뒤 메인 캔버스에 합성 (이전 마스크 위에 누적)
          offCtx.putImageData(overlay, 0, 0);
          ctx.drawImage(off, 0, 0);   // putImageData 대신 drawImage → 누적 합성
          resolve();
        };
        maskImg.onerror = () => resolve();
        maskImg.src = `data:image/png;base64,${maskB64}`;
      });
    }
  };

  const handleMaskToggle = async (checked: boolean) => {
    setShowMasks(checked);
    if (!checked || !imageId || segmentMasks) return;

    setIsFetchingMasks(true);
    try {
      const res = await api.get<{
        masks: Record<string, string>;
        aligned_image: string | null;
      }>(`/images/${imageId}/segment`);

      setSegmentMasks(res.masks);

      // FFHQ aligned 이미지로 원본 패널 교체 → 마스크와 정렬 맞춤
      if (res.aligned_image) {
        const alignedDataUrl = `data:image/jpeg;base64,${res.aligned_image}`;
        setOriginalImage(alignedDataUrl);
        if (resultImage === originalImage) setResultImage(alignedDataUrl);
      }
    } catch (err: any) {
      toast.error(err.message ?? '마스크를 불러올 수 없습니다. 인퍼런스 서버가 켜져 있는지 확인하세요.');
      setShowMasks(false);
    } finally {
      setIsFetchingMasks(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPendingFile(file);
  };

  // ✅ 여기가 핵심 수정 부분
  const handleImageUpload = async () => {
    if (!pendingFile) return;

    if (!getEncryptionPassword()) {
      toast.error('먼저 갤러리에서 암호화 비밀번호를 입력해주세요.');
      navigate('/');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 백엔드에 업로드 (EXIF 보정 후 저장됨)
      const formData = new FormData();
      formData.append('file', pendingFile);
      const res = await api.upload<{ image_id: string }>('/images/upload', formData);
      setImageId(res.image_id);

      // 2. 백엔드에서 보정된 이미지 받아오기 (EXIF 제거된 버전)
      const imageRes = await api.get<{ data_url: string }>(`/images/${res.image_id}/base64`);
      const correctedImageData = imageRes.data_url;

      // 3. 얼굴 파싱
      const result = await parseFace(correctedImageData);
      if (!result.success) {
        setErrorMessage(result.message || '얼굴을 인식할 수 없습니다.');
        setShowErrorDialog(true);
        return;
      }

      // 4. 보정된 이미지로 화면 표시
      setOriginalImage(correctedImageData);
      setResultImage(correctedImageData);
      setShowUploadDialog(false);
      setPendingFile(null);
      toast.success('얼굴 파싱이 완료되었습니다');

    } catch (err: any) {
      toast.error(err.message ?? '업로드에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
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
      const updatedMods = existing
        ? mods.map(m => m.partId === selectedPart ? { ...m, intensity: value[0] } : m)
        : [...mods, { partId: selectedPart, intensity: value[0] }];
      // 참조 이미지가 있을 때만 디바운스 프리뷰
      if (updatedMods.find(m => m.partId === selectedPart)?.referenceImage) {
        triggerPreviewDebounced(updatedMods);
      }
      return updatedMods;
    });
  };

  // ── 실시간 AI 프리뷰 ────────────────────────────────────
  const MAX_DONORS = 3;

  /** 현재 선택된 부위 + 참조 이미지 기준으로 swap 프리뷰를 요청합니다. */
  const triggerPreview = async (updatedMods?: Modification[]) => {
    if (!imageId) return;
    const mods = updatedMods ?? modifications;

    // 선택된 부위 중 참조 이미지가 있는 것만 수집
    const regionDonors: Record<string, { image: string; intensity: number }> = {};
    for (const mod of mods) {
      const part = faceParts.find(p => p.id === mod.partId && p.selected);
      if (part && mod.referenceImage) {
        // data URL → base64 only
        const b64 = mod.referenceImage.includes(',')
          ? mod.referenceImage.split(',')[1]
          : mod.referenceImage;
        regionDonors[mod.partId] = {
          image:     b64,
          intensity: (mod.intensity ?? 85) / 100,
        };
      }
    }

    if (Object.keys(regionDonors).length === 0) {
      setResultImage(originalImage);
      return;
    }

    setIsPreviewLoading(true);
    try {
      const res = await api.post<{ result: string; similarity_score: number | null }>(
        '/simulate/preview',
        { image_id: imageId, region_donors: regionDonors },
      );
      setResultImage(`data:image/jpeg;base64,${res.result}`);
    } catch (err: any) {
      toast.error(err.message ?? 'AI 프리뷰에 실패했습니다.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /** intensity 슬라이더용 디바운스 프리뷰 (300ms) */
  const triggerPreviewDebounced = (updatedMods: Modification[]) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => triggerPreview(updatedMods), 300);
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPart) return;

    // 최대 3개 제한 — 이미 이 부위에 donor 가 있으면 교체이므로 허용
    const donorCount = modifications.filter(
      m => m.referenceImage && m.partId !== selectedPart &&
           faceParts.find(p => p.id === m.partId && p.selected)
    ).length;
    if (donorCount >= MAX_DONORS) {
      toast.error(`최대 ${MAX_DONORS}개의 부위만 동시에 수정할 수 있습니다.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setModifications(mods => {
        const existing = mods.find(m => m.partId === selectedPart);
        const updatedMods = existing
          ? mods.map(m => m.partId === selectedPart ? { ...m, referenceImage: imageData } : m)
          : [...mods, { partId: selectedPart, intensity: 85, referenceImage: imageData }];
        triggerPreview(updatedMods);
        return updatedMods;
      });
      toast.success('참조 이미지 업로드됨 — AI 처리 중...');
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
          {/* Left: Original Image */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">원본 이미지</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mask-toggle" className="text-sm cursor-pointer">마스크</Label>
                  {isFetchingMasks
                    ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    : <Switch
                        id="mask-toggle"
                        checked={showMasks}
                        onCheckedChange={handleMaskToggle}
                        disabled={!imageId}
                      />
                  }
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
                    style={{ imageOrientation: 'none' }}
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
                            setModifications(mods => {
                              const updatedMods = mods.map(m =>
                                m.partId === selectedPart
                                  ? { ...m, referenceImage: undefined }
                                  : m
                              );
                              triggerPreview(updatedMods);
                              return updatedMods;
                            });
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
                    className={`w-full h-full object-contain transition-opacity duration-200 ${isPreviewLoading ? 'opacity-40' : 'opacity-100'}`}
                    style={{ imageOrientation: 'none' }}
                  />
                  {isPreviewLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 rounded-xl px-4 py-3 flex items-center gap-2 shadow">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm text-slate-700">AI 처리 중...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      실시간 프리뷰
                    </div>
                  )}
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
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button className="w-full" onClick={handleImageUpload}>
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