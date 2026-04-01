import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion } from 'motion/react';
import { getSimulation } from '../utils/storage';
import { Simulation } from '../types/simulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { EncryptedImageGuard } from './EncryptedImageGuard';

export function CompareMode() {
  const { id } = useParams();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [curtainPosition, setCurtainPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      getSimulation(id).then(sim => {
        if (sim) setSimulation(sim);
      });
    }
  }, [id]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setCurtainPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setCurtainPosition(Math.max(0, Math.min(100, percentage)));
  };

  if (!simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">시뮬레이션을 찾을 수 없습니다</p>
      </div>
    );
  }

  if (!simulation.originalImage) {
    return <EncryptedImageGuard />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  돌아가기
                </Button>
              </Link>
              <div>
                <h1 className="text-xl text-slate-800">비교 모드</h1>
                <p className="text-sm text-slate-500">{simulation.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="side-by-side" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="side-by-side">나란히 보기</TabsTrigger>
            <TabsTrigger value="curtain">커튼 뷰</TabsTrigger>
          </TabsList>

          {/* Side by Side View */}
          <TabsContent value="side-by-side">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] bg-slate-100">
                    <img
                      src={simulation.originalImage}
                      alt="Before"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-4 py-2 rounded-lg">
                      <p className="text-sm mb-1">Before</p>
                      <p className="text-xs text-slate-300">원본 이미지</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] bg-slate-100">
                    <img
                      src={simulation.resultImage}
                      alt="After"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-4 py-2 rounded-lg">
                      <p className="text-sm mb-1">After</p>
                      <p className="text-xs text-blue-100">시뮬레이션 결과</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Modification Details */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="mb-4 text-slate-800">적용된 수정사항</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {simulation.modifications.map(mod => {
                    const part = simulation.faceParts.find(p => p.id === mod.partId);
                    if (!part) return null;
                    return (
                      <div
                        key={mod.partId}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: part.color }}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{part.name}</p>
                          <p className="text-xs text-slate-500">강도: {mod.intensity}%</p>
                        </div>
                      </div>
                    );
                  })}
                  {simulation.modifications.length === 0 && (
                    <p className="text-sm text-slate-500 col-span-full">
                      수정사항이 없습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curtain View */}
          <TabsContent value="curtain">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden max-w-2xl mx-auto">
                <CardContent className="p-0">
                  <div
                    ref={containerRef}
                    className="relative aspect-[3/4] bg-slate-100 cursor-col-resize select-none"
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleTouchMove}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                  >
                    {/* After Image (Full) */}
                    <img
                      src={simulation.resultImage}
                      alt="After"
                      className="absolute inset-0 w-full h-full object-contain"
                    />

                    {/* Before Image (clip-path으로 오른쪽을 잘라냄) */}
                    <img
                      src={simulation.originalImage}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ clipPath: `inset(0 ${100 - curtainPosition}% 0 0)` }}
                    />

                    {/* Divider */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                      style={{ left: `${curtainPosition}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-slate-600 rotate-45" />
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1.5 rounded text-sm pointer-events-none">
                      Before
                    </div>
                    <div className="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-1.5 rounded text-sm pointer-events-none">
                      After
                    </div>

                    {/* Instruction */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-slate-700 pointer-events-none">
                      드래그하여 비교하기
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Position Indicator */}
              <div className="max-w-2xl mx-auto mt-4 px-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>원본</span>
                  <span className="text-blue-600">{Math.round(curtainPosition)}%</span>
                  <span>결과</span>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
