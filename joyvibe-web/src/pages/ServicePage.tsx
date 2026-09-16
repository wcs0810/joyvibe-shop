import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, HelpCircle, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Headphones, Mail, Clock, FileText, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const faqs = [
  {
    category: '订单与支付',
    items: [
      { q: '如何修改收货地址？', a: '下单后2小时内可在「我的订单」中点击「修改地址」按钮自行修改；超过2小时请联系在线客服协助处理，若商品已发出则无法修改。' },
      { q: '支持哪些支付方式？', a: '目前支持微信支付、支付宝、银行卡支付、悦界余额及白条分期付款。订单金额满99元可享受包邮服务。' },
      { q: '如何申请退款？', a: '进入「我的订单」，找到对应订单点击「申请退款/退货」，填写退款原因提交即可。商家审核通过后，款项将在1-3个工作日内原路返回。' },
    ],
  },
  {
    category: '物流配送',
    items: [
      { q: '多久可以发货？', a: '现货商品通常在付款后24小时内发货，预售商品以页面标注的发货时间为准。发货后会通过短信通知您快递单号。' },
      { q: '可以指定配送时间吗？', a: '部分城市支持「预约送达」服务，下单时可选择具体日期时段，配送员会在指定时间内送达，偏远地区暂不支持。' },
      { q: '快递到了但不在家怎么办？', a: '配送员会先电话联系您，可选择放在快递驿站、邻居代收或改约配送时间。' },
    ],
  },
  {
    category: '售后服务',
    items: [
      { q: '商品有质量问题怎么办？', a: '签收后7天内发现质量问题，可申请7天无理由退换货；15天内可申请换货；一年内享受厂家保修服务（具体以商品保修卡为准）。' },
      { q: '退换货运费谁承担？', a: '质量问题由商家承担运费；非质量问题的个人原因退换，运费由买家承担（购买运费险可获理赔）。' },
      { q: '如何评价商品？', a: '确认收货后可在订单详情页发表评价，优质评价（含图片/视频）有机会获得平台积分奖励。' },
    ],
  },
];

export default function ServicePage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: '您好，我是悦界智能客服小悦，请问有什么可以帮您？' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [formDone, setFormDone] = useState(false);

  const toggleFaq = (key: string) => setOpenFaq((prev) => (prev === key ? null : key));

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setTimeout(() => {
      const reply = msg.includes('退款')
        ? '您可以在「我的订单」中找到对应订单，点击「申请退款」按钮提交申请，审核通过后款项将在1-3个工作日内原路返回。'
        : msg.includes('发货')
        ? '现货商品通常在付款后24小时内发货，您可在订单详情中查看物流状态。如有疑问可转人工客服。'
        : '收到您的问题，正在为您查询... 如需人工服务请拨打 400-888-0000，工作时间 9:00-22:00。';
      setChatMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    }, 600);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormDone(true);
  };

  return (
    <div className="container-app py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">帮助中心</h1>
        <p className="text-white/90 mb-6">7×24小时在线，随时为您解答购物疑问</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <Headphones size={24} className="mx-auto mb-2" />
            <div className="text-sm">在线客服</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <Mail size={24} className="mx-auto mb-2" />
            <div className="text-sm">邮件咨询</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <Clock size={24} className="mx-auto mb-2" />
            <div className="text-sm">7×24小时</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <FileText size={24} className="mx-auto mb-2" />
            <div className="text-sm">自助表单</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {faqs.map((group) => (
            <div key={group.category} className="bg-white rounded-xl border border-ink-100 p-6">
              <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                <HelpCircle size={20} className="text-brand-500" /> {group.category}
              </h2>
              <div className="space-y-2">
                {group.items.map((item, i) => {
                  const key = `${group.category}-${i}`;
                  const open = openFaq === key;
                  return (
                    <div key={key} className="border border-ink-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(key)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-ink-50 transition-colors"
                      >
                        <span className="font-medium text-ink-900">{item.q}</span>
                        {open ? <ChevronUp size={18} className="text-ink-400" /> : <ChevronDown size={18} className="text-ink-400" />}
                      </button>
                      {open && (
                        <div className="px-4 pb-4 text-sm text-ink-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* After-sales form */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
              <RotateCcw size={20} className="text-brand-500" /> 售后申请
            </h2>
            {formDone ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
                <p className="text-ink-900 font-medium mb-1">提交成功！</p>
                <p className="text-ink-500 text-sm">客服将在1个工作日内与您联系</p>
              </div>
            ) : (
              <form onSubmit={submitForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">问题类型 *</label>
                    <select required className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-brand-400">
                      <option value="">请选择</option>
                      <option>退款申请</option>
                      <option>退货换货</option>
                      <option>物流问题</option>
                      <option>商品质量</option>
                      <option>发票问题</option>
                      <option>其他投诉</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-ink-600 mb-1.5">订单编号</label>
                    <input className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-brand-400" placeholder="请输入订单号" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-ink-600 mb-1.5">问题描述 *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-brand-400 resize-none"
                    placeholder="请详细描述您遇到的问题，以便我们更快为您解决..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                    <input type="file" multiple className="hidden" />
                    <span className="inline-flex items-center gap-1 px-3 h-9 rounded-lg border border-ink-200 hover:border-brand-400 transition-colors cursor-pointer">
                      📷 上传凭证
                    </span>
                  </label>
                  <span className="text-xs text-ink-400">支持 JPG/PNG，最多6张</span>
                </div>
                <Button type="submit">提交申请</Button>
              </form>
            )}
          </div>
        </div>

        {/* Right - Contact + Quick links */}
        <div className="space-y-6">
          {/* Contact card */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4">联系客服</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
                  <Headphones size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-900">在线客服</div>
                  <div className="text-xs text-ink-500">9:00 - 22:00</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-900">客服电话</div>
                  <div className="text-xs text-ink-500">400-888-0000</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-900">邮箱</div>
                  <div className="text-xs text-ink-500">service@joyvibe.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4">快捷入口</h2>
            <div className="space-y-1">
              {[
                { icon: RotateCcw, text: '退换货申请', to: '/account' },
                { icon: FileText, text: '我的订单', to: '/account' },
                { icon: AlertTriangle, text: '投诉建议', to: '#' },
                { icon: HelpCircle, text: '平台规则', to: '#' },
              ].map((item, i) => (
                <Link key={i} to={item.to} className="flex items-center justify-between p-3 rounded-lg hover:bg-ink-50 transition-colors">
                  <span className="flex items-center gap-2 text-sm text-ink-700">
                    <item.icon size={16} className="text-ink-400" /> {item.text}
                  </span>
                  <ChevronRight size={14} className="text-ink-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition-colors flex items-center justify-center"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-ink-100 overflow-hidden flex flex-col" style={{ height: '480px' }}>
          <div className="bg-brand-500 text-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">悦</div>
            <div className="flex-1">
              <div className="font-medium">智能客服小悦</div>
              <div className="text-xs text-white/80">在线 · 平均响应 30 秒</div>
            </div>
            <button onClick={() => setChatOpen(false)} className="hover:bg-white/10 rounded-full p-1">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-900'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-ink-100 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入您的问题..."
              className="flex-1 h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:border-brand-400"
            />
            <Button onClick={sendMessage}>发送</Button>
          </div>
        </div>
      )}
    </div>
  );
}
