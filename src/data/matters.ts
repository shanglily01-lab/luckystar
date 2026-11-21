export type Matter = {
  id: string;
  name: string;
  hint: string;
  /** 黄历里用来对上宜忌的词 */
  keys: string[];
  /** 用户随口问时用来对上这件事的词 */
  words: string[];
  /** 这件事五行上更吃哪一类气 */
  element: '木' | '火' | '土' | '金' | '水';
  /** 求财类：日主克事项五行为得财，方向相反 */
  wealth: boolean;
};

export const MATTERS: Matter[] = [
  { id: 'travel', name: '出行远行', hint: '赶路、出差、旅行', keys: ['出行', '远行', '移徙'], words: ['出行', '远行', '出差', '旅行', '赶路', '出门', '航班', '高铁'], element: '木', wealth: false },
  { id: 'wealth', name: '求财开市', hint: '收款、进货、开门做生意', keys: ['开市', '纳财', '交易', '立券'], words: ['求财', '收款', '进货', '做生意', '开市', '赚钱', '回款'], element: '金', wealth: true },
  { id: 'invest', name: '投资理财', hint: '买入、加仓、签理财', keys: ['纳财', '交易', '开市'], words: ['投资', '理财', '买入', '加仓', '股票', '基金'], element: '金', wealth: true },
  { id: 'contract', name: '签约合作', hint: '合同、合伙、订约', keys: ['立券', '交易', '订盟'], words: ['签约', '合同', '合作', '合伙', '订约', '协议'], element: '金', wealth: false },
  { id: 'job', name: '求职面试', hint: '投递、面试、谈薪', keys: ['上官', '赴任', '求职'], words: ['求职', '面试', '谈薪', '跳槽', '入职', '简历'], element: '水', wealth: false },
  { id: 'exam', name: '考试进修', hint: '考试、答辩、入学', keys: ['入学', '习艺', '上官'], words: ['考试', '进修', '答辩', '入学', '学习', '考证'], element: '水', wealth: false },
  { id: 'love', name: '表白约会', hint: '见面、告白、重修旧好', keys: ['会友', '结亲', '嫁娶', '纳采'], words: ['表白', '约会', '告白', '恋爱', '复合', '见面'], element: '火', wealth: false },
  { id: 'marry', name: '订婚结婚', hint: '提亲、订婚、婚礼', keys: ['嫁娶', '纳采', '订盟', '安床'], words: ['订婚', '结婚', '婚礼', '提亲', '领证'], element: '火', wealth: false },
  { id: 'meet', name: '见家长会友', hint: '家宴、介绍认识', keys: ['会友', '宴会', '宴请'], words: ['家长', '见家长', '聚会', '宴请', '朋友', '聚餐'], element: '火', wealth: false },
  { id: 'move', name: '搬家入宅', hint: '搬迁、入住、换房', keys: ['移徙', '入宅', '安香'], words: ['搬家', '入宅', '搬迁', '入住', '换房'], element: '土', wealth: false },
  { id: 'open', name: '开业挂牌', hint: '开张、上线、挂匾', keys: ['开市', '挂匾', '开业'], words: ['开业', '开张', '挂牌', '上线', '开店'], element: '火', wealth: true },
  { id: 'build', name: '装修动土', hint: '动工、改造、安门', keys: ['动土', '修造', '竖柱', '盖屋'], words: ['装修', '动土', '施工', '改造', '动工'], element: '土', wealth: false },
  { id: 'health', name: '就医养生', hint: '就诊、复查、调理', keys: ['求医', '治病', '疗目'], words: ['就医', '看病', '医院', '复查', '调理', '手术'], element: '土', wealth: false },
  { id: 'lawsuit', name: '协商诉讼', hint: '对质、调解、递材料', keys: ['词讼', '诉讼'], words: ['官司', '诉讼', '起诉', '调解', '仲裁', '协商'], element: '金', wealth: false },
  { id: 'shop', name: '置产购物', hint: '买房、大件、签约付款', keys: ['置产', '纳财', '交易', '立券'], words: ['买房', '置产', '购物', '大件', '付款', '下单'], element: '土', wealth: true },
  { id: 'groom', name: '理发裁衣', hint: '形象、裁衣、拍照', keys: ['理发', '整手足甲', '裁衣'], words: ['理发', '剪发', '拍照', '形象', '裁衣'], element: '木', wealth: false },
];
