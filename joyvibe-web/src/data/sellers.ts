import type { Seller } from '@/types';

export const sellers: Seller[] = [
  {
    id: 's001',
    name: '悦界官方旗舰店',
    logo: '悦',
    rating: 4.9,
    sales: 128000,
    location: '广东 深圳',
    description: '悦界 JoyVibe 品牌官方直营，正品保障，7天无理由退换，假一赔十。',
    established: '2018-03-15',
    isOfficial: true,
  },
  {
    id: 's002',
    name: '数码精品专营店',
    logo: '数',
    rating: 4.7,
    sales: 86000,
    location: '江苏 南京',
    description: '专注数码电器12年，精选全球优质数码产品，专业售后团队。',
    established: '2012-06-01',
    isOfficial: false,
  },
  {
    id: 's003',
    name: '家居美学馆',
    logo: '家',
    rating: 4.8,
    sales: 42000,
    location: '浙江 杭州',
    description: '品味生活，从家居开始。精选北欧风、日式、新中式家居好物。',
    established: '2015-09-20',
    isOfficial: false,
  },
  {
    id: 's004',
    name: '臻选美食汇',
    logo: '食',
    rating: 4.9,
    sales: 156000,
    location: '四川 成都',
    description: '源头直采，新鲜直达。覆盖全国地方特色美食与进口零食。',
    established: '2016-01-10',
    isOfficial: false,
  },
  {
    id: 's005',
    name: '风尚服饰旗舰店',
    logo: '衣',
    rating: 4.6,
    sales: 98000,
    location: '广东 广州',
    description: '紧跟潮流趋势，提供高性价比时尚服饰，涵盖男女童装。',
    established: '2014-11-05',
    isOfficial: false,
  },
  {
    id: 's006',
    name: '美妆严选官方店',
    logo: '美',
    rating: 4.9,
    sales: 203000,
    location: '上海',
    description: '全球美妆品牌授权经营，100%正品，过敏无忧赔付。',
    established: '2013-04-18',
    isOfficial: false,
  },
];

export function getSellerById(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}
