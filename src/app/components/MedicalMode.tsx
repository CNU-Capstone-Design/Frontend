import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, FileText, Printer, Clock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getSimulation } from '../utils/storage';
import { Simulation } from '../types/simulation';
import { Separator } from './ui/separator';
import { EncryptedImageGuard } from './EncryptedImageGuard';

export function MedicalMode() {
  const { id } = useParams();
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [consultationDate, setConsultationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    if (id) {
      getSimulation(id).then(sim => {
        if (sim) setSimulation(sim);
      });
    }
  }, [id]);

  const handleGeneratePDF = () => {
    // In a real implementation, this would generate a PDF
    toast.success('PDF 리포트가 생성되었습니다');
  };

  const handlePrint = () => {
    window.print();
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
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
                <h1 className="text-xl text-slate-800">의료진 전용 모드</h1>
                <p className="text-sm text-slate-500">상담용 리포트 작성</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                인쇄
              </Button>
              <Button size="sm" onClick={handleGeneratePDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Patient Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  환자 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="patient-name">환자명</Label>
                    <Input
                      id="patient-name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient-age">나이</Label>
                    <Input
                      id="patient-age"
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="consultation-date">상담일</Label>
                    <Input
                      id="consultation-date"
                      type="date"
                      value={consultationDate}
                      onChange={(e) => setConsultationDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="doctor-name">담당 의사</Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="김의사"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Simulation Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  시뮬레이션 결과
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Image */}
                  <div>
                    <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={simulation.originalImage}
                        alt="Before"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 text-white px-3 py-1.5 rounded text-sm">
                        수술 전 (Before)
                      </div>
                    </div>
                  </div>

                  {/* After Image */}
                  <div>
                    <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={simulation.resultImage}
                        alt="After"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 right-3 bg-blue-600/90 text-white px-3 py-1.5 rounded text-sm">
                        예상 결과 (After)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applied Modifications */}
                <Separator className="my-6" />
                <div>
                  <h3 className="mb-4 text-slate-800">시뮬레이션 적용 부위</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {simulation.modifications.map((mod) => {
                      const part = simulation.faceParts.find(p => p.id === mod.partId);
                      if (!part) return null;
                      return (
                        <div
                          key={mod.partId}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: part.color }}
                            />
                            <span className="text-sm text-slate-800">{part.name}</span>
                          </div>
                          <span className="text-sm text-slate-600">강도: {mod.intensity}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clinical Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>상담 노트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">상담 내용</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="환자 상담 내용을 입력하세요..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="recommendations">권장사항 및 계획</Label>
                  <Textarea
                    id="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="수술 계획, 주의사항, 권장사항 등을 입력하세요..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>생성일: {new Date(simulation.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="text-xs">
                    문서 ID: {simulation.id}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Print-only Footer */}
          <div className="hidden print:block mt-8 pt-8 border-t border-slate-200">
            <div className="text-center text-sm text-slate-600">
              <p className="mb-2">본 리포트는 시뮬레이션 결과로, 실제 수술 결과와 다를 수 있습니다.</p>
              <p>본 자료는 상담용으로만 사용되며, 의료적 판단의 근거가 되지 않습니다.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
