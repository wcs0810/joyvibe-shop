import { AlertTriangle, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/AuthContext';

export function LogoutFlow() {
  const { logoutPhase, user, cancelLogout, confirmLogout, completeLogout } = useAuth();

  // Phase 1: Confirmation dialog
  if (logoutPhase === 'confirm') {
    return (
      <Modal
        open={true}
        onClose={cancelLogout}
        closeOnBackdrop={true}
        closeOnEsc={true}
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">确认退出登录？</h3>
          <p className="text-sm text-ink-500 leading-relaxed max-w-sm mx-auto">
            退出后需要重新登录才能查看个人信息、购物车和订单。
          </p>
          {user && (
            <div className="mt-5 p-3 rounded-lg bg-ink-50 border border-ink-100 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold shrink-0">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-900 truncate">{user.username}</div>
                <div className="text-xs text-ink-500">{user.phone}</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-11" onClick={cancelLogout}>
            取消
          </Button>
          <Button className="flex-1 h-11 bg-red-500 hover:bg-red-600" onClick={confirmLogout}>
            <LogOut size={16} /> 确认退出
          </Button>
        </div>
      </Modal>
    );
  }

  // Phase 2: Clearing data (in-progress)
  if (logoutPhase === 'clearing' || logoutPhase === 'redirecting') {
    const isClearing = logoutPhase === 'clearing';
    return (
      <Modal open={true} onClose={() => {}} closeOnBackdrop={false} closeOnEsc={false} size="sm" footer={null}>
        <div className="text-center py-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-5">
            <Loader2 size={40} className="text-brand-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-ink-900 mb-2">
            {isClearing ? '正在清除会话数据...' : '正在安全退出...'}
          </h3>
          <p className="text-sm text-ink-500">{isClearing ? '请稍候，正在保护您的账户安全' : '即将跳转至首页'}</p>
          <div className="mt-6 space-y-2">
            {[
              { label: '清除登录凭证', done: !isClearing },
              { label: '清理购物车数据', done: !isClearing },
              { label: '安全跳转', done: !isClearing && logoutPhase === 'redirecting' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                    step.done ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-400',
                  )}
                >
                  {step.done ? (
                    <CheckCircle size={12} strokeWidth={3} />
                  ) : isClearing && i === 0 ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                <span className={cn(step.done ? 'text-emerald-600' : 'text-ink-500')}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  // Phase 3: Success (briefly show before redirect)
  if (logoutPhase === 'success') {
    return (
      <Modal open={true} onClose={completeLogout} closeOnBackdrop={false} closeOnEsc={false} size="sm" footer={null}>
        <div className="text-center py-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 animate-fade-in">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-ink-900 mb-2">已安全退出</h3>
          <p className="text-sm text-ink-500 mb-6">您已成功退出悦界 JoyVibe</p>
          <Button size="lg" className="w-full h-12" onClick={completeLogout}>
            返回首页
          </Button>
        </div>
      </Modal>
    );
  }

  return null;
}
