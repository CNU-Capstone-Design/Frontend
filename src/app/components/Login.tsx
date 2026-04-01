import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Lock, User, Mail, Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { login, register } from '../utils/auth';

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerEncPassword, setRegisterEncPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error('아이디와 비밀번호를 입력해주세요');
      return;
    }
    setIsLoading(true);
    try {
      await login(loginUsername, loginPassword);
      toast.success('로그인 성공!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message ?? '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword) {
      toast.error('아이디와 비밀번호를 입력해주세요');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }
    if (!registerEncPassword) {
      toast.error('이미지 암호화 비밀번호를 입력해주세요');
      return;
    }
    setIsLoading(true);
    try {
      await register(registerUsername, registerPassword, registerEncPassword, registerEmail || undefined);
      toast.success('회원가입 성공!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message ?? '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl mb-2 text-slate-800">AI 성형 시뮬레이션</h1>
          <p className="text-slate-600">안전하고 전문적인 시뮬레이션 플랫폼</p>
        </div>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">시작하기</CardTitle>
            <CardDescription className="text-center">
              로그인 또는 회원가입하여 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="register">회원가입</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">아이디</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="login-username" type="text" placeholder="아이디를 입력하세요"
                        value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 입력하세요" value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)} className="pl-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">아이디</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="register-username" type="text" placeholder="아이디를 입력하세요"
                        value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">이메일 (선택)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="register-email" type="email" placeholder="이메일을 입력하세요"
                        value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">로그인 비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="register-password" type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 입력하세요" value={registerPassword}
                        onChange={e => setRegisterPassword(e.target.value)} className="pl-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">로그인 비밀번호 확인</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="register-confirm-password" type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 다시 입력하세요" value={registerConfirmPassword}
                        onChange={e => setRegisterConfirmPassword(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  {/* AES 암호화 비밀번호 */}
                  <div className="pt-1 border-t border-slate-100">
                    <div className="space-y-2">
                      <Label htmlFor="register-enc-password" className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-blue-600" />
                        이미지 암호화 비밀번호
                      </Label>
                      <Input id="register-enc-password" type="password"
                        placeholder="이미지를 암호화할 별도 비밀번호"
                        value={registerEncPassword} onChange={e => setRegisterEncPassword(e.target.value)} />
                      <p className="text-xs text-slate-500">
                        로그인 비밀번호와 달라도 됩니다. 갤러리 이미지 열람에 사용됩니다.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '가입 중...' : '회원가입'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="mb-1">AES-256 이미지 암호화</p>
                  <p className="text-xs text-blue-600">
                    업로드된 사진은 암호화 비밀번호로 암호화되어 저장됩니다
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          로그인하시면 <span className="text-blue-600">서비스 이용약관</span> 및{' '}
          <span className="text-blue-600">개인정보처리방침</span>에 동의하는 것으로 간주됩니다
        </p>
      </motion.div>
    </div>
  );
}
