import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, MapPin, Clock, ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOrder } from '@/store/OrderContext';
import { formatPrice } from '@/lib/utils';

const statusMap: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: '待付款', color: 'text-amber-600', step: 0 },
  paid: { label: '待发货', color: 'text-blue-600', step: 1 },
  shipped: { label: '运输中', color: 'text-brand-600', step: 2 },
  delivered: { label: '已完成', color: 'text-green-600', step: 3 },
  cancelled: { label: '已取消', color: 'text-ink-400', step: 0 },
};

export default function OrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const { orders } = useOrder();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="container-app py-24 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">订单不存在</h1>
        <p className="text-ink-500 mb-6">未找到订单号 {id}</p>
        <Link to="/account"><Button variant="outline">返回账户中心</Button></Link>
      </div>
    );
  }

  const statusInfo = statusMap[order.status] || statusMap.pending;

  const timeline = [
    { step: 0, title: '订单已提交', desc: '等待买家付款', icon: CheckCircle, time: order.createdAt },
    { step: 1, title: '付款成功', desc: '商家正在备货中', icon: Package, time: order.createdAt },
    { step: 2, title: '商品已发出', desc: '快递员正在配送', icon: Truck, time: order.updatedAt },
    { step: 3, title: '确认收货', desc: '感谢您的购买，期待再次光临', icon: CheckCircle, time: order.updatedAt },
  ];

  const currentStep = statusInfo.step;

  // Mock logistics data
  const logistics = [
    { time: '2026-09-16 14:30', desc: '【沈阳市】快件已被 大连金普新区 快递驿站 签收，签收人：本人', done: order.status === 'delivered' },
    { time: '2026-09-16 09:15', desc: '【大连市】快件正在配送中，配送员：张师傅 138****1234', done: order.status === 'delivered' },
    { time: '2026-09-15 22:00', desc: '【大连市】快件已到达 大连金普新区中转场', done: order.status !== 'pending' && order.status !== 'cancelled' },
    { time: '2026-09-15 18:45', desc: '【沈阳市】快件已从 沈阳总集散中心 发出', done: order.status !== 'pending' && order.status !== 'cancelled' },
    { time: '2026-09-15 10:20', desc: '【深圳市】商家已发货，快递单号：SF1234567890', done: order.status === 'shipped' || order.status === 'delivered' },
  ];

  return (
    <div className="container-app py-6">
      <div className="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-brand-600"><Home size={14} /></Link>
        <ChevronLeft size={14} />
        <Link to="/account" className="hover:text-brand-600">我的订单</Link>
        <ChevronLeft size={14} />
        <span className="text-ink-900">物流跟踪</span>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-ink-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-ink-900">订单号 {order.id}</h1>
              <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <p className="text-ink-500 text-sm">下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
          </div>
          <Link to="/cart">
            <Button variant="outline">继续购物</Button>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-ink-100 -z-0" />
          <div
            className="absolute top-5 left-0 h-1 bg-brand-500 -z-0 transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
          {timeline.map((item, i) => (
            <div key={i} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                i <= currentStep ? 'bg-brand-500' : 'bg-ink-200'
              }`}>
                <item.icon size={18} />
              </div>
              <div className={`text-sm font-medium mt-2 text-center ${i <= currentStep ? 'text-ink-900' : 'text-ink-400'}`}>
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics Detail + Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logistics Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-ink-100 p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
            <Truck size={20} className="text-brand-500" /> 物流跟踪
          </h2>
          <div className="relative pl-6">
            {logistics.map((log, i) => (
              <div key={i} className="relative pb-6 last:pb-0">
                {i < logistics.length - 1 && (
                  <div className={`absolute left-[-18px] top-2 w-0.5 h-full ${log.done ? 'bg-brand-300' : 'bg-ink-100'}`} />
                )}
                <div className={`absolute left-[-22px] top-1.5 w-3 h-3 rounded-full ${log.done ? 'bg-brand-500' : 'bg-ink-300'}`} />
                <div className={`text-sm ${log.done ? 'text-ink-900' : 'text-ink-400'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className={log.done ? 'text-ink-500' : 'text-ink-300'} />
                    <span className="text-xs text-ink-500">{log.time}</span>
                  </div>
                  <p className={log.done ? 'font-medium' : ''}>{log.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h3 className="text-base font-bold text-ink-900 mb-4">订单信息</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">订单编号</dt>
                <dd className="text-ink-900 font-mono text-xs">{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">下单时间</dt>
                <dd className="text-ink-900">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">支付方式</dt>
                <dd className="text-ink-900">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">订单金额</dt>
                <dd className="text-brand-600 font-bold">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h3 className="text-base font-bold text-ink-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-brand-500" /> 收货地址
            </h3>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-ink-900">{order.address.name}</span>
                <span className="text-ink-500">{order.address.phone}</span>
              </div>
              <p className="text-ink-600 leading-relaxed">
                {order.address.region} {order.address.detail}
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-ink-100 p-6">
            <h3 className="text-base font-bold text-ink-900 mb-4">商品清单</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-ink-100 flex items-center justify-center text-2xl shrink-0">
                    {item.product.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-900 truncate">{item.product.name}</div>
                    <div className="text-xs text-ink-500">× {item.quantity}</div>
                  </div>
                  <div className="text-sm text-brand-600 font-bold">{formatPrice(item.product.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
