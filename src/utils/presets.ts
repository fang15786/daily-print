export interface PresetCategory {
  id: string;
  name: string;
  items: {
    label: string;
    text: string;
    mode?: 'stroke_order' | 'continuous' | 'stroke_basic';
  }[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: 'grade1_up',
    name: '一年级上册生字',
    items: [
      { label: '识字一：天地人你我他', text: '天地人你我他' },
      { label: '识字二：金木水火土', text: '一二三四五上下' },
      { label: '识字三：口耳目手足', text: '口耳目手足站坐' },
      { label: '识字四：日月水火山石田禾', text: '日月水火山石田禾' },
      { label: '课文生字：秋天', text: '秋气了大树叶片' },
      { label: '课文生字：小小的船', text: '的船两头在里看见闪' },
      { label: '课文生字：江南', text: '江南采莲何间东西北' },
      { label: '课文生字：四季', text: '尖说春青蛙夏弯地' }
    ]
  },
  {
    id: 'grade1_down',
    name: '一年级下册生字',
    items: [
      { label: '第一单元：春夏秋冬', text: '春风冬雪花飞入' },
      { label: '姓氏歌', text: '姓什么李张古吴赵钱孙' },
      { label: '小青蛙', text: '清晴眼睛保护害事情' },
      { label: '猜字谜', text: '相遇喜欢怕言互令动' },
      { label: '精选生字表（一）', text: '吃叫主江住没以会走门' },
      { label: '精选生字表（二）', text: '广北京走门广会走过各' }
    ]
  },
  {
    id: 'poetry',
    name: '经典古诗（唐诗精选）',
    items: [
      {
        label: '《静夜思》李白',
        text: '床前明月光疑是地上霜举头望明月低头思故乡',
        mode: 'continuous'
      },
      {
        label: '《春晓》孟浩然',
        text: '春眠不觉晓处处闻啼鸟夜来风雨声花落知多少',
        mode: 'continuous'
      },
      {
        label: '《登鹳雀楼》王之涣',
        text: '白日依山尽黄河入海流欲穷千里目更上一层楼',
        mode: 'continuous'
      },
      {
        label: '《咏鹅》骆宾王',
        text: '鹅鹅鹅曲项向天歌白毛浮绿水红掌拨清波',
        mode: 'continuous'
      },
      {
        label: '《悯农》李绅',
        text: '锄禾日当午汗滴禾下土谁知盘中餐粒粒皆辛苦',
        mode: 'continuous'
      }
    ]
  },
  {
    id: 'idiom',
    name: '成语励志名句',
    items: [
      { label: '自强不息 厚德载物', text: '自强不息厚德载物' },
      { label: '温故知新 学而不厌', text: '温故知新学而不厌' },
      { label: '千里之行 始于足下', text: '千里之行始于足下' },
      { label: '持之以恒 锲而不舍', text: '持之以恒锲而不舍' },
      { label: '海纳百川 有容乃大', text: '海纳百川有容乃大' }
    ]
  },
  {
    id: 'strokes',
    name: '基础笔画与控笔',
    items: [
      {
        label: '八大基础笔画',
        text: '一丨丿丶乀乛亅乚',
        mode: 'stroke_order'
      },
      {
        label: '永字八法字根',
        text: '永国水木福学书法',
        mode: 'stroke_order'
      }
    ]
  }
];
