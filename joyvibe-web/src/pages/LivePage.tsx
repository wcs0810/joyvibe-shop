import { Play, Users, Radio, Heart, Share2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const featuredLive = {
  title: '夏日数码盛典 · 5 折起售',
  host: '悦界官方 · 数码达人小杨',
  viewers: 23456,
  emoji: '📱',
};

const liveRooms = [
  { title: '家居焕新专场', host: '主播小美', viewers: 12000, emoji: '🏠' },
  { title: '美妆大赏专场', host: '主播丽丽', viewers: 8500, emoji: '💄' },
  { title: '美食探店专场', host: '吃货阿杰', viewers: 6200, emoji: '🍜' },
];

const hotLives = [
  { title: '数码新品首发', host: '数码君', viewers: 32000, emoji: '📱' },
  { title: '夏日穿搭指南', host: '时尚姐', viewers: 18000, emoji: '👗' },
  { title: '智能手表专场', host: '科技喵', viewers: 9500, emoji: '⌚' },
  { title: '礼品文创推荐', host: '文创姐', viewers: 7300, emoji: '🎁' },
];

const formatViewers = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return n.toLocaleString();
};

export default function LivePage() {
  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">直播专区</h1>

      {/* Featured */}
      <section className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 relative group rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-900 aspect-video flex items-center justify-center cursor-pointer">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> 直播中
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm">
              <Users size={12} /> {formatViewers(featuredLive.viewers)} 观看
            </span>
          </div>
          <div className="text-[160px] opacity-30 group-hover:scale-110 transition-transform duration-700">
            {featuredLive.emoji}
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">{featuredLive.title}</h2>
              <p className="text-sm opacity-80">{featuredLive.host}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="bg-white text-emerald-700 hover:bg-ink-50">
                <Play size={14} /> 进入直播间
              </Button>
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Heart size={14} /> 关注
              </Button>
            </div>
          </div>
        </div>

        {/* Side live rooms */}
        <div className="space-y-3">
          {liveRooms.map((room) => (
            <div
              key={room.title}
              className="flex gap-3 p-3 rounded-xl border border-ink-100 bg-white hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-28 h-20 rounded-lg bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center text-4xl shrink-0 relative">
                {room.emoji}
                <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="font-medium text-sm text-ink-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {room.title}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">{room.host}</div>
                </div>
                <div className="text-xs text-ink-500 flex items-center gap-1">
                  <Users size={12} /> {formatViewers(room.viewers)} 观看
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hot lives grid */}
      <section>
        <h2 className="text-xl font-bold text-ink-900 mb-4 flex items-center gap-2">
          <Radio size={20} className="text-brand-500" /> 热门直播
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {hotLives.map((room) => (
            <div
              key={room.title}
              className="group rounded-xl border border-ink-100 bg-white overflow-hidden hover:shadow-elevation hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="aspect-video bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center text-6xl relative">
                {room.emoji}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 text-white text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> 直播中
                </span>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 text-white text-xs backdrop-blur-sm">
                  <Users size={12} /> {formatViewers(room.viewers)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-ink-900 text-sm mb-1 truncate group-hover:text-brand-600 transition-colors">
                  {room.title}
                </h3>
                <p className="text-xs text-ink-500 mb-3">{room.host}</p>
                <div className="flex gap-2">
                  <Badge variant="brand" className="text-[11px]">限时优惠</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live benefits */}
      <section className="mt-12 rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50 to-white p-8">
        <h3 className="font-semibold text-ink-900 mb-6 flex items-center gap-2">
          <Gift size={20} className="text-brand-500" /> 看直播专属福利
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🎁', title: '专属优惠券', desc: '直播间领取专属优惠券，力度更大' },
            { icon: '🏆', title: '抽奖互动', desc: '观看直播参与抽奖，赢取好礼' },
            { icon: '💰', title: '限时秒杀', desc: '直播间专属秒杀价，手慢无' },
          ].map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shrink-0">
                {benefit.icon}
              </div>
              <div>
                <div className="font-semibold text-ink-900 mb-1">{benefit.title}</div>
                <p className="text-sm text-ink-500">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline">
            <Share2 size={16} /> 分享直播
          </Button>
          <Button>
            <Play size={16} /> 立即观看
          </Button>
        </div>
      </section>
    </div>
  );
}
