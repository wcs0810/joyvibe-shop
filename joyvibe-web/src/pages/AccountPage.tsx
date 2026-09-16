import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, Gift, Settings, MapPin, Bell, CreditCard, ChevronRight, Edit2, Trash2, Check, Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/store/ToastContext';
import { useAuth } from '@/store/AuthContext';
import { useOrder } from '@/store/OrderContext';
import { useNotification } from '@/store/NotificationContext';
import { useWishlist } from '@/store/WishlistContext';
import { formatPrice, cn } from '@/lib/utils';

type TabKey = 'orders' | 'profile' | 'address' | 'settings';

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'orders', label: '我的订单', icon: Package },
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'address', label: '收货地址', icon: MapPin },
  { key: 'settings', label: '账户设置', icon: Settings },
];

interface Profile {
  username: string;
  phone: string;
  email: string;
  birthday: string;
  gender: '男' | '女' | '保密';
  avatar: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

const STORAGE_KEY_PROFILE = 'jy_profile';
const STORAGE_KEY_ADDRESS = 'jy_addresses';

const defaultProfile: Profile = {
  username: '李同学',
  phone: '133****5831',
  email: 'student@upln.cn',
  birthday: '2003-05-20',
  gender: '男',
  avatar: '李',
};

const defaultAddresses: Address[] = [
  {
    id: 'addr-default',
    name: '李同学',
    phone: '1335831',
    region: '辽宁省 / 大连市 / 金普新区',
    detail: '金石滩金石路 39 号 鲁迅美术学院大连校区',
    isDefault: true,
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ============ Address Form Modal ============

interface AddressFormData {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const emptyAddressForm: AddressFormData = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
};

function AddressFormModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Address | null;
  onClose: () => void;
  onSubmit: (data: Omit<Address, 'id'>) => void;
}) {
  const [form, setForm] = useState<AddressFormData>(emptyAddressForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const [province, city, district] = initial.region.split(' / ');
      setForm({
        name: initial.name,
        phone: initial.phone.replace(/\*/g, ''),
        province: province ?? '',
        city: city ?? '',
        district: district ?? '',
        detail: initial.detail,
        isDefault: initial.isDefault,
      });
    } else {
      setForm(emptyAddressForm);
    }
    setErrors({});
  }, [open, initial]);

  const update = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof AddressFormData, string>> = {};
    if (!form.name.trim()) e.name = '请输入收货人姓名';
    if (!form.phone.trim()) e.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) e.phone = '请输入有效的 11 位手机号';
    if (!form.province.trim()) e.province = '请选择省份';
    if (!form.city.trim()) e.city = '请选择城市';
    if (!form.detail.trim()) e.detail = '请输入详细地址';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      region: [form.province, form.city, form.district].filter(Boolean).join(' / '),
      detail: form.detail.trim(),
      isDefault: form.isDefault,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑收货地址' : '添加新地址'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>{initial ? '保存修改' : '确认添加'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="收货人"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
            placeholder="请输入姓名"
            maxLength={20}
          />
          <Input
            label="手机号"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
            error={errors.phone}
            placeholder="11 位手机号"
            maxLength={11}
            inputMode="numeric"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">省份</label>
            <select
              value={form.province}
              onChange={(e) => update('province', e.target.value)}
              className={cn(
                'h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                errors.province && 'border-red-400',
              )}
            >
              <option value="">请选择</option>
              {['北京市', '上海市', '广东省', '浙江省', '江苏省', '辽宁省', '四川省', '湖北省'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.province && <p className="text-xs text-red-500">{errors.province}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">城市</label>
            <select
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className={cn(
                'h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                errors.city && 'border-red-400',
              )}
            >
              <option value="">请选择</option>
              {['大连市', '沈阳市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
          </div>
          <Input
            label="区县"
            value={form.district}
            onChange={(e) => update('district', e.target.value)}
            placeholder="选填"
          />
        </div>
        <Input
          label="详细地址"
          value={form.detail}
          onChange={(e) => update('detail', e.target.value)}
          error={errors.detail}
          placeholder="街道、门牌号、楼层等"
          maxLength={100}
        />
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => update('isDefault', e.target.checked)}
            className="w-4 h-4 accent-brand-500 rounded"
          />
          设为默认收货地址
        </label>
      </div>
    </Modal>
  );
}

// ============ Profile Form Modal ============

interface ProfileFormData {
  username: string;
  phone: string;
  email: string;
  birthday: string;
  gender: '男' | '女' | '保密';
  avatar: string;
}

function ProfileFormModal({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: Profile;
  onClose: () => void;
  onSubmit: (data: ProfileFormData) => void;
}) {
  const [form, setForm] = useState<ProfileFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const update = (field: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value as ProfileFormData[typeof field] }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!form.username.trim()) e.username = '请输入用户名';
    else if (form.username.trim().length < 2) e.username = '用户名至少 2 个字符';
    if (!form.phone.trim()) e.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone.trim().replace(/\*/g, '0'))) e.phone = '请输入有效的 11 位手机号';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '邮箱格式不正确';
    if (!form.birthday) e.birthday = '请选择生日';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="修改个人资料"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>保存修改</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-white border border-brand-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {form.avatar || form.username.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-ink-900 mb-1">更换头像</div>
            <p className="text-xs text-ink-500 mb-2">选择一个字符作为你的头像（暂不支持图片上传）</p>
            <div className="flex gap-1.5">
              {['李', '王', '张', '刘', '陈', '杨', 'V', 'U'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, avatar: ch }))}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                    form.avatar === ch ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300',
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Input
          label="用户名"
          value={form.username}
          onChange={(e) => update('username', e.target.value)}
          error={errors.username}
          maxLength={12}
        />
        <Input
          label="手机号"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
          error={errors.phone}
          maxLength={11}
          inputMode="numeric"
        />
        <Input
          label="邮箱（选填）"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          placeholder="your@email.com"
        />
        <Input
          label="生日"
          type="date"
          value={form.birthday}
          onChange={(e) => update('birthday', e.target.value)}
          error={errors.birthday}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">性别</label>
          <div className="flex gap-2">
            {(['男', '女', '保密'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                className={cn(
                  'px-5 h-10 rounded-lg text-sm font-medium transition-all border',
                  form.gender === g
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
                aria-pressed={form.gender === g}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============ Main AccountPage ============

export default function AccountPage() {
  const { show } = useToast();
  const { openLogoutConfirm, isAuthenticated, user, login } = useAuth();
  const { orders, updateStatus: _updateStatus } = useOrder();
  const { add: addNotification } = useNotification();
  const { products: wishlistProducts, remove: removeWishlist } = useWishlist();
  const navigate = useNavigate();

  // Wrap updateStatus to add notifications and handle async
  const updateStatus = async (orderId: string, status: any) => {
    await _updateStatus(orderId, status);
    if (status === 'delivered') {
      addNotification({
        type: 'order',
        title: '订单已完成',
        message: `订单 ${orderId} 已确认收货，感谢您的购买！`,
      });
    } else if (status === 'paid') {
      addNotification({
        type: 'order',
        title: '支付成功',
        message: `订单 ${orderId} 已支付，商家正在火速发货中`,
      });
    }
    show(status === 'delivered' ? '已确认收货' : status === 'paid' ? '支付成功' : '状态已更新', 'success');
  };
  const [activeTab, setActiveTab] = useState<TabKey>('orders');

  // Profile state — sync with AuthContext.user when available
  const [profile, setProfile] = useState<Profile>(() => {
    if (user) {
      return {
        username: user.username,
        phone: user.phone,
        email: user.email ?? '',
        birthday: user.birthday ?? '',
        gender: user.gender ?? '男',
        avatar: user.avatar,
      };
    }
    return loadFromStorage(STORAGE_KEY_PROFILE, defaultProfile);
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>(() => loadFromStorage(STORAGE_KEY_ADDRESS, defaultAddresses));
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Settings state
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

  const favoriteProducts = wishlistProducts;

  // Persist on change
  useEffect(() => saveToStorage(STORAGE_KEY_PROFILE, profile), [profile]);
  useEffect(() => saveToStorage(STORAGE_KEY_ADDRESS, addresses), [addresses]);

  // Reset local state when auth is lost (logout)
  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(defaultProfile);
      setAddresses(defaultAddresses);
      setActiveTab('orders');
    }
  }, [isAuthenticated]);

  // --- Profile handlers ---
  const handleProfileSave = useCallback((data: ProfileFormData) => {
    setProfile((prev) => ({ ...prev, ...data }));
    setProfileModalOpen(false);
    show('个人资料已更新', 'success');
  }, [show]);

  // --- Address handlers ---
  const handleAddressSubmit = useCallback((data: Omit<Address, 'id'>) => {
    if (editingAddress) {
      setAddresses((prev) => prev.map((a) => {
        if (a.id === editingAddress.id) {
          return { ...a, ...data };
        }
        if (data.isDefault) return { ...a, isDefault: false };
        return a;
      }));
      show('地址已更新', 'success');
    } else {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        ...data,
      };
      setAddresses((prev) => {
        const next = data.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
        return [...next, newAddr];
      });
      show('地址已添加', 'success');
    }
    setAddressModalOpen(false);
    setEditingAddress(null);
  }, [editingAddress, show]);

  const handleDeleteAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const target = prev.find((a) => a.id === id);
      const next = prev.filter((a) => a.id !== id);
      if (target?.isDefault && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
    setDeleteConfirm(null);
    show('地址已删除', 'info');
  }, [show]);

  const handleSetDefault = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    show('已设为默认地址', 'success');
  }, [show]);

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressModalOpen(true);
  };

  // --- Settings handlers ---
  // Logout handled via useAuth().openLogoutConfirm — see AccountPage bottom button

  // Guest state: redirect / show login CTA when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container-app py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="text-7xl mb-6">👋</div>
          <h1 className="text-3xl font-bold text-ink-900 mb-3">登录后查看个人中心</h1>
          <p className="text-ink-500 mb-8 leading-relaxed">
            登录悦界 JoyVibe，查看订单、管理收货地址、领取会员专属优惠券
          </p>
          <div className="flex gap-3 justify-center mb-10">
            <Button size="lg" onClick={async () => { await login('guest', 'guest'); show('欢迎回来！', 'success'); }}>
              立即登录
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              先逛逛
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-ink-100">
            {[
              { icon: '📦', label: '专属订单管理' },
              { icon: '🎁', label: '会员专属优惠' },
              { icon: '📍', label: '快速下单' },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <div className="text-3xl mb-2">{f.icon}</div>
                <div className="text-xs text-ink-500">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50 to-white p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.avatar ?? profile.avatar ?? profile.username.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-ink-900">{user?.username ?? profile.username}</div>
                <div className="text-xs text-ink-500 mt-0.5">VIP 3 黄金会员</div>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-brand-600">1280</div>
                <div className="text-xs text-ink-500">积分</div>
              </div>
              <div>
                <div className="text-xl font-bold text-ink-900">5</div>
                <div className="text-xs text-ink-500">优惠券</div>
              </div>
              <div>
                <div className="text-xl font-bold text-ink-900">8</div>
                <div className="text-xs text-ink-500">订单</div>
              </div>
            </div>
          </div>

          <nav aria-label="账户导航">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ' +
                    (activeTab === tab.key
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50')
                  }
                  aria-current={activeTab === tab.key ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ================ ORDERS ================ */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-6">我的订单</h2>
              {orders.length === 0 ? (
                <div className="rounded-xl border border-ink-100 bg-white p-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="font-semibold text-ink-900 mb-2">暂无订单</h3>
                  <p className="text-sm text-ink-500 mb-6">快去挑选心仪的商品吧</p>
                  <Button onClick={() => navigate('/categories')}>去购物</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const statusInfo = {
                      pending: { label: '待付款', variant: 'danger' as const },
                      paid: { label: '待发货', variant: 'brand' as const },
                      shipped: { label: '运输中', variant: 'brand' as const },
                      delivered: { label: '已完成', variant: 'success' as const },
                      cancelled: { label: '已取消', variant: 'default' as const },
                    }[order.status];
                    return (
                      <div key={order.id} className="rounded-xl border border-ink-100 bg-white overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-ink-50 border-b border-ink-100">
                          <span className="text-xs text-ink-500">订单号：{order.id}</span>
                          <span className="text-xs text-ink-400">{new Date(order.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {order.items.map((item) => (
                          <div key={item.product.id} className="p-5 flex items-center gap-4">
                            <ProductImage
                              imageUrl={item.product.imageUrl}
                              fallback={item.product.image}
                              alt={item.product.name}
                              containerClassName="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-ink-900 truncate">{item.product.name}</div>
                              <div className="text-xs text-ink-500 mt-0.5">× {item.quantity}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold text-brand-600 tabular-nums">{formatPrice(item.product.price * item.quantity)}</div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
                          <div className="text-sm">
                            <span className="text-ink-500">实付 </span>
                            <span className="font-bold text-brand-600 text-lg tabular-nums">{formatPrice(order.total)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            {order.status === 'pending' && (
                              <Button size="sm" onClick={() => updateStatus(order.id, 'paid')}>立即付款</Button>
                            )}
                            {order.status === 'shipped' && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'delivered')}>确认收货</Button>
                            )}
                            {order.status === 'delivered' && (
                              <Button size="sm" variant="ghost">再次购买</Button>
                            )}
                            {order.status !== 'pending' && (
                              <Link to={`/order/${order.id}/track`}>
                                <Button size="sm" variant="outline">查看物流</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className="text-lg font-semibold text-ink-900 mt-10 mb-4 flex items-center gap-2">
                <Heart size={18} className="text-brand-500" /> 我的收藏
                <span className="text-sm text-ink-400 font-normal">({favoriteProducts.length})</span>
              </h3>
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-ink-200">
                  <div className="text-4xl mb-3">💝</div>
                  <p className="text-ink-500 text-sm mb-3">还没有收藏的商品</p>
                  <Link to="/categories">
                    <Button size="sm" variant="outline">去逛逛</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {favoriteProducts.map((p) => (
                    <div
                      key={p.id}
                      className="relative rounded-xl border border-ink-100 bg-white p-3 hover:shadow-md hover:border-brand-200 transition-all group"
                    >
                      <Link to={`/products/${p.id}`} className="block">
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-ink-50 to-ink-100 flex items-center justify-center text-5xl mb-2 group-hover:scale-105 transition-transform overflow-hidden">
                          {p.image}
                        </div>
                        <div className="text-sm font-medium text-ink-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{p.name}</div>
                        <div className="text-brand-600 font-semibold text-sm mt-1">{formatPrice(p.price)}</div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => { removeWishlist(p.id); show('已取消收藏', 'info'); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                        aria-label="取消收藏"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================ PROFILE ================ */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-6">个人资料</h2>

              {/* Avatar card */}
              <div className="rounded-xl border border-ink-100 bg-white p-6 mb-4">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-3xl font-bold">
                      {profile.avatar || profile.username.charAt(0)}
                    </div>
                    <button
                      type="button"
                      onClick={() => { show('暂不支持图片上传，可在资料中更换字符头像', 'info'); setProfileModalOpen(true); }}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-ink-200 flex items-center justify-center text-ink-500 hover:text-brand-600 hover:border-brand-300 transition-colors shadow-sm"
                      aria-label="修改头像"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-ink-900">{profile.username}</div>
                    <div className="text-sm text-ink-500 mt-0.5">手机号 {profile.phone}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setProfileModalOpen(true)}>
                    <Edit2 size={14} /> 编辑资料
                  </Button>
                </div>
              </div>

              {/* Info list */}
              <div className="rounded-xl border border-ink-100 bg-white divide-y divide-ink-100">
                {[
                  { label: '用户名', value: profile.username },
                  { label: '手机号', value: profile.phone },
                  { label: '邮箱', value: profile.email || '未绑定' },
                  { label: '生日', value: profile.birthday || '未设置' },
                  { label: '性别', value: profile.gender },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm text-ink-500">{row.label}</span>
                    <span className="text-sm font-medium text-ink-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================ ADDRESS ================ */}
          {activeTab === 'address' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink-900">收货地址</h2>
                <Button size="sm" onClick={openAddAddress}>
                  <Plus size={16} /> 添加新地址
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-xl border border-ink-100 bg-white p-12 text-center">
                  <div className="text-5xl mb-4">📍</div>
                  <h3 className="font-semibold text-ink-900 mb-2">暂无收货地址</h3>
                  <p className="text-sm text-ink-500 mb-6">添加收货地址，下单更快捷</p>
                  <Button onClick={openAddAddress}>
                    <Plus size={16} /> 添加新地址
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  {addresses.map((addr) => (
                    <article
                      key={addr.id}
                      className={cn(
                        'relative rounded-xl border bg-white p-5 transition-all group',
                        addr.isDefault ? 'border-brand-200 bg-brand-50/40' : 'border-ink-100 hover:border-ink-200 hover:shadow-card',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={20}
                          className={cn('mt-0.5 shrink-0', addr.isDefault ? 'text-brand-600' : 'text-ink-400')}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-ink-900">{addr.name}</span>
                            <span className="text-sm text-ink-500">{addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                            {addr.isDefault && <Badge variant="brand">默认</Badge>}
                          </div>
                          <p className="text-sm text-ink-600 leading-relaxed">
                            {addr.region} · {addr.detail}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-ink-100">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr.id)}
                                className="px-3 h-8 rounded-md text-xs font-medium text-ink-600 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> 设为默认
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditAddress(addr)}
                              className="px-3 h-8 rounded-md text-xs font-medium text-ink-600 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1"
                            >
                              <Edit2 size={12} /> 编辑
                            </button>
                            {deleteConfirm === addr.id ? (
                              <div className="flex items-center gap-1 bg-red-50 rounded-md px-2">
                                <span className="text-xs text-red-600 mr-1">确认删除？</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="px-2 h-7 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                                >
                                  删除
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 h-7 text-xs text-ink-600 hover:bg-ink-100 rounded transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(addr.id)}
                                className="px-3 h-8 rounded-md text-xs font-medium text-ink-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} /> 删除
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  <button
                    type="button"
                    onClick={openAddAddress}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-ink-200 bg-white text-ink-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/40 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus size={18} /> 添加新地址
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================ SETTINGS ================ */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-6">账户设置</h2>

              {/* Notification toggles */}
              <div className="rounded-xl border border-ink-100 bg-white mb-4">
                <div className="px-6 py-4 border-b border-ink-100 flex items-center gap-2">
                  <Bell size={18} className="text-ink-400" />
                  <span className="font-semibold text-ink-900">消息通知</span>
                </div>
                {[
                  { label: '订单状态变更通知', value: notificationsOn, onChange: setNotificationsOn },
                  { label: '营销活动邮件', value: emailOn, onChange: setEmailOn },
                  { label: '促销短信', value: smsOn, onChange: setSmsOn },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-6 py-4 border-b border-ink-100 last:border-0">
                    <span className="text-sm text-ink-700">{item.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.value}
                      onClick={() => item.onChange(!item.value)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                        item.value ? 'bg-brand-500' : 'bg-ink-200',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                          item.value && 'translate-x-5',
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Other settings */}
              <div className="rounded-xl border border-ink-100 bg-white mb-4 divide-y divide-ink-100">
                <button type="button" className="w-full flex items-center gap-4 p-4 text-left hover:bg-ink-50 transition-colors">
                  <CreditCard size={18} className="text-ink-400" />
                  <span className="flex-1 text-sm font-medium text-ink-900">支付方式</span>
                  <span className="text-sm text-ink-500">微信支付</span>
                  <ChevronRight size={16} className="text-ink-400" />
                </button>
                <button type="button" className="w-full flex items-center gap-4 p-4 text-left hover:bg-ink-50 transition-colors">
                  <Gift size={18} className="text-ink-400" />
                  <span className="flex-1 text-sm font-medium text-ink-900">积分设置</span>
                  <span className="text-sm text-ink-500">自动累积</span>
                  <ChevronRight size={16} className="text-ink-400" />
                </button>
                <button type="button" className="w-full flex items-center gap-4 p-4 text-left hover:bg-ink-50 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-ink-900">关于悦界 JoyVibe</span>
                  <span className="text-sm text-ink-500">v1.0.0</span>
                  <ChevronRight size={16} className="text-ink-400" />
                </button>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-ink-100 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={openLogoutConfirm}
                  className="w-full flex items-center justify-center gap-2 p-4 text-sm text-ink-600 hover:text-brand-600 hover:bg-ink-50 transition-colors"
                >
                  退出登录
                </button>
                <button
                  type="button"
                  onClick={() => show('请联系客服注销账户', 'info')}
                  className="w-full flex items-center justify-center gap-2 p-4 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-ink-100"
                >
                  注销账户
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======== Modals ======== */}
      <ProfileFormModal
        open={profileModalOpen}
        initial={profile}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={handleProfileSave}
      />
      <AddressFormModal
        open={addressModalOpen}
        initial={editingAddress}
        onClose={() => { setAddressModalOpen(false); setEditingAddress(null); }}
        onSubmit={handleAddressSubmit}
      />
    </div>
  );
}
