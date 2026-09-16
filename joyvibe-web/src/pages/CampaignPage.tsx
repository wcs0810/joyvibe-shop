import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Gift, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(target: Date): Countdown {
  const [time, setTime] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);
  return time;
}

const formatNum = (n: number) => n.toString().padStart(2, '0');

export default function CampaignPage() {
  const target = new Date();
  target.setDate(target.getDate() + 2);
  target.setHours(target.getHours() + 14, 25, 30, 0);
  const time = useCountdown(target);
  const navigate = useNavigate();

  const campaigns = [
    { icon: Gift, title: '满 300 减 50', desc: '全场通用 · 不限品类', gradient: 'from-brand-500 to-brand-600', cta: '立即领取' },
    { icon: Zap, title: '秒杀专场', desc: '每日 10 点 · 限时抢购', gradient: 'from-amber-500 to-orange-500', cta: '进入会场' },
    { icon: Crown, title: '会员日', desc: '每月 9 日 · 专享 8 折', gradient: 'from-gold-500 to-amber-500', cta: '查看权益' },
    { icon: Sparkles, title: '数码盛典', desc: '大牌好物 · 低至 5 折', gradient: 'from-emerald-500 to-teal-500', cta: '立即抢购' },
    { icon: Flame, title: '家居焕新', desc: '家装节 · 满 1000 减 100', gradient: 'from-rose-500 to-pink-500', cta: '进入会场' },
    { icon: Gift, title: '新人专享', desc: '首单立减 · 1 分钱拿走', gradient: 'from-violet-500 to-purple-500', cta: '立即领取' },
  ];

  return (
    <div className="container-app py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 p-10 md:p-14 text-white mb-10">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute right-20 -top-10 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4 backdrop-blur-sm">
            <Flame size={14} /> 限时活动
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">夏日焕新季</h1>
          <p className="text-lg opacity-90 mb-6">全场 5 折起 · 满 300 减 50 · 会员专享 8 折</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: '天', value: time.days },
              { label: '时', value: time.hours },
              { label: '分', value: time.minutes },
              { label: '秒', value: time.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 text-center min-w-[64px]">
                <div className="text-2xl font-bold tabular-nums">{formatNum(t.value)}</div>
                <div className="text-xs opacity-80">{t.label}</div>
              </div>
            ))}
          </div>
          <Button
            size="lg"
            className="bg-white text-red-600 hover:bg-ink-50"
            onClick={() => navigate('/categories')}
          >
            立即抢购 <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Campaign Grid */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900 mb-6">进行中的活动</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="group rounded-xl border border-ink-100 bg-white overflow-hidden hover:shadow-elevation transition-all cursor-pointer"
                onClick={() => navigate('/categories')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/categories'); }}
              >
                <div className={`h-36 bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white`}>
                  <Icon size={56} strokeWidth={1.5} />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-ink-900 text-lg mb-1">{c.title}</h3>
                  <p className="text-sm text-ink-500 mb-3">{c.desc}</p>
                  <span className="text-sm text-brand-600 font-medium group-hover:text-brand-700 flex items-center gap-1">
                    {c.cta} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rules */}
      <section className="mt-12 rounded-xl border border-ink-100 bg-white p-6">
        <h3 className="font-semibold text-ink-900 mb-4">活动规则</h3>
        <ul className="space-y-2 text-sm text-ink-600 list-disc list-inside">
          <li>活动时间：2026 年 9 月 1 日 00:00 - 2026 年 9 月 30 日 23:59</li>
          <li>满减优惠可与会员折扣叠加，单品最高立省 60%</li>
          <li>秒杀商品数量有限，抢完即止，每人限购 1 件</li>
          <li>如有疑问，请联系客服 400-888-8888</li>
        </ul>
      </section>
    </div>
  );
}
