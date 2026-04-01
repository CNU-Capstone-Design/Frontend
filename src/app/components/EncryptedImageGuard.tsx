import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from './ui/button';

export function EncryptedImageGuard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl text-slate-800 mb-3">이미지를 복원할 수 없습니다</h2>
        <p className="text-slate-500 mb-2">
          암호화 비밀번호가 올바르지 않거나 입력되지 않아
        </p>
        <p className="text-slate-500 mb-8">
          이미지를 불러올 수 없습니다.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">해결 방법</p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>갤러리로 돌아가세요</li>
            <li>올바른 이미지 암호화 비밀번호를 입력하세요</li>
            <li>다시 시도해주세요</li>
          </ol>
        </div>
        <Link to="/">
          <Button className="w-full">갤러리로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
