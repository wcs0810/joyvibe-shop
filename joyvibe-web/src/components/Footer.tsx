import { Link } from 'react-router-dom';
import { Shield, Truck, RotateCcw, Headphones, CreditCard } from 'lucide-react';

const services = [
  { icon: Shield, title: '正品保障', desc: '假一赔十' },
  { icon: Truck, title: '极速物流', desc: '次日达' },
  { icon: RotateCcw, title: '7天无理由', desc: '退换无忧' },
  { icon: Headphones, title: '专属客服', desc: '7×24小时' },
  { icon: CreditCard, title: '安全支付', desc: 'PCI DSS' },
];

const linkGroups = [
  {
    title: '购物指南',
    links: [
      { label: '购物流程', to: '/service' },
      { label: '会员介绍', to: '#' },
      { label: '生活旅行', to: '#' },
      { label: '常见问题', to: '/service' },
    ],
  },
  {
    title: '配送方式',
    links: [
      { label: '上门自提', to: '#' },
      { label: '211限时达', to: '#' },
      { label: '配送服务查询', to: '#' },
      { label: '海外配送', to: '#' },
    ],
  },
  {
    title: '支付方式',
    links: [
      { label: '货到付款', to: '#' },
      { label: '在线支付', to: '#' },
      { label: '分期付款', to: '#' },
      { label: '公司转账', to: '#' },
    ],
  },
  {
    title: '售后服务',
    links: [
      { label: '售后政策', to: '/service' },
      { label: '价格保护', to: '#' },
      { label: '退款说明', to: '/service' },
      { label: '返修退换货', to: '/service' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300 mt-16">
      {/* Service guarantee strip */}
      <div className="border-b border-ink-800">
        <div className="container-app py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-ink-800 flex items-center justify-center text-brand-400 shrink-0">
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{s.title}</div>
                    <div className="text-xs text-ink-400">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand + QR */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                悦
              </div>
              <span className="font-bold text-xl text-white">悦界 JoyVibe</span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed mb-5">
              悦享生活，触手可及。品质生活方式品牌购物平台，为你精选每一件好物。
            </p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-ink-100 to-ink-200 rounded flex flex-col items-center justify-center text-ink-400">
                    <span className="text-2xl">📱</span>
                    <span className="text-[10px] mt-1">扫码下载</span>
                  </div>
                </div>
                <div className="text-xs text-ink-400 mt-1.5">下载APP</div>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-ink-100 to-ink-200 rounded flex flex-col items-center justify-center text-ink-400">
                    <span className="text-2xl">💬</span>
                    <span className="text-[10px] mt-1">微信公众号</span>
                  </div>
                </div>
                <div className="text-xs text-ink-400 mt-1.5">关注我们</div>
              </div>
            </div>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{group.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="hover:text-brand-400 transition-colors text-ink-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div className="mt-10 pt-8 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 text-sm text-ink-400">
            <div className="flex items-center gap-2">
              <Headphones size={16} className="text-brand-400" />
              <span>客服热线 <span className="text-white font-bold">400-888-0000</span></span>
            </div>
            <div className="text-ink-500">工作时间 9:00 - 22:00</div>
          </div>
          <div className="flex gap-6 text-xs text-ink-500">
            <Link to="/service" className="hover:text-ink-300">帮助中心</Link>
            <a href="#" className="hover:text-ink-300">用户协议</a>
            <a href="#" className="hover:text-ink-300">隐私政策</a>
            <a href="#" className="hover:text-ink-300">关于我们</a>
          </div>
        </div>
      </div>

      {/* Filing info */}
      <div className="border-t border-ink-800 bg-ink-950">
        <div className="container-app py-5 text-center text-xs text-ink-500 space-y-2">
          <p>© 2026 悦界 JoyVibe 版权所有 · 辽ICP备2026000000号-1 · 辽公网安备 21020000000000号</p>
          <p>
            营业执照 | 增值电信业务经营许可证 | 食品经营许可证 | 网络文化经营许可证 | 出版物经营许可证
          </p>
          <p className="text-ink-600">
            本平台仅提供商品信息展示服务，交易行为由入驻商家独立完成并承担相应法律责任。
          </p>
        </div>
      </div>
    </footer>
  );
}
