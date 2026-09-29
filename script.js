/* ==========================================================================
   «عَبَرنا» — فيلم وثائقي حرب أكتوبر ١٩٧٣
   Single source of truth: SCENES drives the page render, the timeline strip,
   the film progress rail and the film engine.
   No dependencies. Works from file://
   ========================================================================== */
(function () {
'use strict';

/* ---------- tiny helpers -------------------------------------------------- */
var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var IMG = 'img/';
var AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

function ar(n) {
  return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
}
/* group the ASCII digits first: \d only matches 0-9, so the separator has to
   be applied before converting to Arabic-Indic numerals */
function arSep(n) {
  return ar(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

var REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
var state = {
  reduced: REDUCED_MQ.matches,
  muted: false,
  volume: 0.55
};

/* ---------- narration chunks (used by BOTH the voice and the subtitles) --- */
function splitChunks(text) {
  if (!text) return [];
  var parts = String(text).split(/(?<=[.؟!…])\s+/);
  var out = [];
  parts.forEach(function (p) {
    p = p.trim();
    if (!p) return;
    if (p.length > 88) {
      var subs = p.split(/(?<=،)\s*/);
      var buf = '';
      subs.forEach(function (s) {
        if ((buf + ' ' + s).trim().length > 88 && buf) { out.push(buf.trim()); buf = s; }
        else { buf = (buf + ' ' + s).trim(); }
      });
      if (buf) out.push(buf.trim());
    } else { out.push(p); }
  });
  return out.filter(Boolean).map(function (t) {
    return { text: t, chars: t.replace(/\s/g, '').length, words: t.split(/\s+/), dur: 0 };
  }).map(function (c) {
    c.dur = Math.max(1.7, c.chars / 6.5);       /* estimated reading speed (s) */
    return c;
  });
}

/* ---------- 1. THE FILM — data ------------------------------------------- */
/* kind: full | mosaic | split | quote | people | stats | map | memorial | stage */
var SCENES = [
  {
    id: 'ch00', num: '00', tc: '02:05', time: 'فجر ٦ أكتوبر', kind: 'full', mood: 'sand',
    kicker: '٠٢:٠٥ · ٢٢٢ طائرة تعبر القناة في ٢٠ دقيقة',
    title: 'فجر ٦ أكتوبر',
    hero: 'centurion-fire.jpg',
    body: [
      'هذه كانت أكبر عملية جوية من نوعها تعبر قناة في تاريخ الحرب. كانت الطائرات تطير منخفضًا لدرجة أن مياه القناة تتقطّع خلفها، وصار فوق القاهرة كلّه صوتًا واحدًا لا يهدأ.',
      'على الأرض، مدّ الجيش <strong>خمسة جسور عائمة</strong> في نحو ساعتين، ثم بدأ أكثر من <strong>ثمانين ألف جندي</strong> يعبرون. الجبهة كانت ٢٥٠ كيلومترًا. لم يكن هذا اختبارًا ولا تدريبًا؛ كان التطبيق الكامل لخطة اتُّقنت في سرّية تامة.'
    ],
    narration: 'الساعة اتنين وخمسة الصبح. صوت الطائرات لفّ فوق القاهرة كلها. في عشرين دقيقة بس، اتنين مئتين واثنين وعشرين طائرة مصرية عدّت فوق قناة السويس في خمس مسارات، على طول جبهة ٢٥٠ كيلومتر. تحتيها، أكثر من ألفي دبابة اشتبكت. على الأرض، اتمدّت خمس جسور عائمة في ساعتين تقريبًا، وبدأ ثمانين ألف جندي يعبروا. الطايرة كانت نازلة لدرجة إن مياه القناة نفسها اتقطّعت. في تاريخ الحرب كله، ماكانش فيه عملية على قناة بالحجم ده.',
    sfx: ['aircraft', 'artillery'],
    facts: [
      { v: '٢٢٢', l: 'طائرة عبرت القناة في ٢٠ دقيقة' },
      { v: '٥', l: 'مسارات متجاورة للعبور' },
      { v: '٥', l: 'جسور عائمة في نحو ساعتين' },
      { v: '٨٠٬٠٠٠', l: 'جندي في الموجة الأولى' }
    ],
    images: [{ f: 'soldiers-tanks.jpg', alt: 'جنود مصريون أمام دبابات مدمّرة في سيناء، أكتوبر ١٩٧٣', cap: 'أكتوبر ١٩٧٣ · سيناء', tint: '#221a12' }]
  },
  {
    id: 'ch01', num: '01', tc: '1967', time: '١٩٦٧ · الجرح', kind: 'mosaic', mood: 'steel',
    kicker: 'خمس سنوات من الصبر قبل أن تقرَّر الخطوة',
    title: 'الجرح الذي لم يُغلق',
    body: [
      'خلال خمسة أعوام لم تستسلم مصر للوضع الجديد. كانت تخطط بصمت، وتبني قوتها، وتدرك أن الحساب القادم لن يُحسب بالكلام.',
      'وفي ١٩٦٩ بدأ ما سمّاه المصريون <strong>«حرب الإرهاق»</strong>: قصف يومي على طول القناة. والقرار الذي نضج بعد ذلك كان واضحًا: أي عبور لازم يكون <em>عبورًا كاملًا</em>، وإلا رُدَّ إلى القناة.'
    ],
    narration: 'خمس سنين سبقت ٦ أكتوبر. في ١٩٦٧ خسرت مصر، واتاخدت سيناء، ووقفت الجبهة على خط بارليف. خمس سنين كاملة، مصر وقفت عنده، واستنّت. مش عشان تناور. لأ. عشان لو هتعدّي، لازم تعدّي كله. في ١٩٦٩ بدأ «حرب الإرهاق»، قصف يومي على القناة. والقرار اللي اتاخد كان: أي عبور لازم يكون عبور كامل.',
    sfx: ['wind', 'radio'],
    images: [
      { f: 'montage.png', alt: 'لوحة مركّبة من صور حرب أكتوبر ١٩٧٣', cap: 'لوحة مركّبة · حرب أكتوبر', tint: '#17171a' },
      { f: 'october-war.jpg', alt: 'صورة من أرشيف حرب أكتوبر ١٩٧٣', cap: 'أرشيف حرب أكتوبر', tint: '#1b1a17' },
      { f: 'portal.jpg', alt: 'منظر عام لنصب تذكاري لحرب أكتوبر', cap: 'نصب تذكاري', tint: '#191a1d' }
    ]
  },
  {
    id: 'ch02', num: '02', tc: '2 YRS', time: 'سنتان · التخطيط', kind: 'quote', mood: 'sand',
    kicker: 'معسكرات في الصحراء الغربية · عقيدة عسكرية جديدة',
    title: 'سنتان في الظل',
    quote: {
      q: 'ولنسجل في تاريخنا أن هذا جيل من أبناء مصر هو الذي أُعيدت إليه الأرض بعد أن احتلها العدو…',
      cite: 'الرئيس أنور السادات — خطاب ٦ أكتوبر ٢٠٠١، القاهرة'
    },
    body: [
      'سنتان من التحضير. في معسكرات الصحراء الغربية تدرب الضباط على أساليب عبور لم تكن معروفة من قبل. وصاغت القيادة المصرية فكرة جريئة: <em>لا جبهة متصلة تُخترق، بل خط حصون يُلغى نقطة بعد نقطة</em>.',
      'نُسبت الخطة إلى رئيس الأركان الفريق <strong>سعد الدين الشاذلي</strong>، وتتولى قيادتها الميدانية الفريق <strong>أحمد إسماعيل علي</strong>. وأُنشئت وحدات ردّ فعل صُنعت في الظل: الوحدات ١ و٢ و٣. وحين بلغ أكتوبر، كان مجموع الاستعدادات نحو <strong>ألفي مدفع</strong>، و<strong>ألف هاون</strong>، وأكثر من <strong>ألف و١٠٠ طائرة</strong>، وقرابة <strong>ألفي دبابة</strong>.'
    ],
    narration: 'سنتين كاملين في السر. معسكرات في الصحراء الغربية، والناس بتتدرّب على حاجة مجرّبتش قبل كده. الخطة كانت للشاذلي، والفريق أحمد إسماعيل علي هو اللي قاد العمليات الميدانية. ووحدات ردّ الفعل — واحد وتلاتة — اتكوّنت من ناس ما تعرفش بعضها. في نص أكتوبر، مصر كان عندها قرابة ألفي مدفع، وألف هاون، وأكتر من ألف وميان طائرة، وألفي دبابة. كل ده كان مستني. وأسلوب واحد بس: يا تعدّي كل حاجة، يا تعدّي ولا حاجة.',
    sfx: ['bridgeHum', 'radio'],
    images: [
      { f: 'shazly-message.jpg', alt: 'رسالة الفريق سعد الدين الشاذلي إلى الضباط والجنود قبل الحرب', cap: 'رسالة الشاذلي قبل الحرب', tint: '#1c1a15', ratio: 'wide' },
      { f: 'leaders.jpg', alt: 'قادة الجيش المصري في حرب أكتوبر', cap: 'قادة الجيش المصري', tint: '#1a1a1d' },
      { f: 'leaders-ops.jpg', alt: 'الرئيس أنور السادات مع قادة حرب أكتوبر', cap: 'السادات مع القادة', tint: '#1a1815' }
    ]
  },
  {
    id: 'ch03', num: '03', tc: '14:05', time: '٦ أكتوبر · ١٤:٠٥', kind: 'mosaic', mood: 'sand',
    kicker: 'الموجة الأولى · ٨٠٬٠٠٠ جندي في أقل من ٢٠ دقيقة',
    title: 'العبور',
    body: [
      'في الساعة ١٤:٠٥ من ظهر ٦ أكتوبر، عبرت الموجة الأولى على الجسور الخمسة. يمتد العبور من <strong>الإسماعيلية</strong> في الشمال إلى <strong>بحيرات المرّ</strong> في الجنوب، وقد رُفعت الجسور العائمة أمام الموجة مباشرة، فشكّلت نقاط الثبات الأولى على الضفة الشرقية.',
      'وكان <strong>محمد أنور السادات</strong> في ذلك الحين قائد القوة الجوية، ولم يتولَّ القيادة العامة إلا في <strong>٢٥ أكتوبر</strong>، بعد وفاة الفريق صديقي محمود.'
    ],
    narration: 'في اتنين وخمسة بعد الضهر، يوم ٦ أكتوبر. الموجة الأولى عدّت. نحو ثمانين ألف جندي، في أقل من عشرين دقيقة. الجسور كانت موجودة، ومهندسين رفعوها. العبور امتد من الإسماعيلية لحد بحيرات المرّ في الجنوب. ومبارك وقتها كان قائد القوة الجوية، وماحدش تولى القيادة العامة غير في ٢٥ أكتوبر، بعد وفاة الفريق صديقي محمود.',
    sfx: ['bridgeHum', 'aircraft'],
    images: [
      { f: 'israeli-tanks-canal.jpg', alt: 'دبابات إسرائيلية تعبر قناة السويس', cap: 'الدبابات على القناة', tint: '#161c22' },
      { f: 'destroyed-tank.jpg', alt: 'دبابة مدمّرة في سيناء ١٩٧٣', cap: 'دبابة مدمّرة · سيناء', tint: '#1c1a16' },
      { f: 'sadat-front.png', alt: 'الرئيس أنور السادات على الجبهة المصرية', cap: 'السادات على الجبهة', tint: '#1b1913' }
    ]
  },
  {
    id: 'ch04', num: '04', tc: 'SADEHI', time: 'جبهة سيناء · خط بارليف', kind: 'split', mood: 'steel', flip: true,
    kicker: 'خط بارليف · الممرات · صواريخ S-2',
    title: 'جبهة سيناء',
    body: [
      'واجهت الموجة الأولى على الجبهة الشرقية خط بارليف. وكان الدخول كما صُمِّم: عبر <em>ممرات محدودة</em> تفتح طريقها إلى عمق سيناء، لا عبر خط متصل يُخترق في نقطة واحدة.',
      'ولم تُؤخذ كل الأهداف في اليوم الأول. هذه الحقيقة تُقال كما هي: العبور كان بداية المعركة، لا نهايتها.',
      'لكن في الساعات الأولى حدث ما لم يحدث من قبل: مصر كانت <strong>أول دولة في التاريخ</strong> تستخدم صواريخ مضادة للطائرات في القتال. بطاريات <strong>س-٢</strong> صدّت الضربة الجوية الإسرائيلية فوق القناة. وفي اليوم نفسه، جرى <strong>أول استخدام قتالي للقنابل الموجّهة بالليزر</strong> في تاريخ الحرب.'
    ],
    narration: 'على الجبهة الشرقية، الموجة الأولى لاقت خط بارليف. والدخول كان من ممرات محددة، مش من جبهة كلها. وبالمناسبة، اليوم الأول ما اتاخدتش كل الأهداف، وده كلام لازم يتقال. بس في نفس الساعات دي حصل حاجة ما حصلتش قبل كده: مصر بقت أول دولة في تاريخ البشرية تستخدم صواريخ مضادة للطائرات في القتال. بطاريات أس اتنين صدّت الضربة الإسرائيلية فوق القناة. وفي اليوم نفسه، أول استخدام قتالي للقنابل الليزرية في تاريخ الحرب.',
    sfx: ['artillery', 'radio'],
    images: [
      { f: 'destroyed-tank.jpg', alt: 'دبابة مدمّرة على خط بارليف', cap: 'خط بارليف', tint: '#1c1a16' },
      { f: 'hulikat.jpg', alt: 'صورة أرشيفية توثّق ضحايا حرب أكتوبر في مصر', cap: 'أرشيف الضحايا', tint: '#15161a' }
    ]
  },
  {
    id: 'ch05', num: '05', tc: '20 DAYS', time: 'بورسعيد · دابور', kind: 'mosaic', mood: 'steel',
    kicker: 'دابور · الفرقة ١٦ مشاة · ٢٠ يومًا',
    title: 'بورسعيد · الساحل',
    body: [
      'في قطاع <strong>دابور</strong> شمال القناة، اشتعل اشتباك مدرع طويل بين الضفتين. قاده الميجور جنرال <strong>حاتم علي</strong>، وثبّتت <strong>الفرقة ١٦ مشاة</strong> ضفاف القناة وبورسعيد أكثر من <strong>عشرين يومًا</strong>.',
      'وعلى جانب التصوير، صور وثائقية لجنود إسرائيليين في الحفظ المصرية. وقائع موثّقة بالأرشيف، لا مبالغة ولا استعراض.'
    ],
    narration: 'في دابور، شمال القناة، الاشتباك كان تصميم. الفرقة ستة عشر مشاة ثبّتت ضفاف القناة ومدينة بورسعيد أكتر من عشرين يومًا، والقيادة كانت للميجور جنرال حاتم علي. اشتباك مدرع على الضفتين. وفي الصور الموثّقة، جنود إسرائيليين أسارى في الحفظ المصرية. وده تصوير مؤرّخ، مش كلام.',
    sfx: ['wind', 'radio'],
    images: [
      { f: 'pow.jpg', alt: 'جنود إسرائيليون أسارى تحت الحراسة المصرية قرب القاهرة', cap: 'أسرى في الحفظ المصرية', tint: '#191a1c' },
      { f: 'israeli-tanks-canal.jpg', alt: 'دبابات إسرائيلية على ضفاف قناة السويس', cap: 'الضفة الشمالية', tint: '#161c22' },
      { f: 'destroyed-tank.jpg', alt: 'دبابة مدمّرة قرب القناة', cap: 'بقايا المعركة', tint: '#1c1a16' }
    ]
  },
  {
    id: 'ch06', num: '06', tc: '14 OCT', time: '١٤ أكتوبر · الزحف المضاد', kind: 'full', mood: 'red',
    kicker: 'عملية «كَرمّي» المضادة · ١٦ أكتوبر',
    title: 'الزحف المضاد',
    hero: 'collage.png',
    body: [
      'في <strong>١٤ أكتوبر ١٩٧٣</strong>، أطلقت إسرائيل عملية <strong>«كَرمّي»</strong> (כרמי — «الكَرْمة») المضادة باتجاه السويس. وفي <strong>١٦ أكتوبر</strong>، كاد الجيش المصري الثالث أن يطوّقها. التقت التشكيلات المدرعة عندئذٍ في منطقة واحدة.',
      'هذه أقرب لحظة في الحرب: تحرّك مدرع كبير من ناحية، وتطويق مدرع من ناحية أخرى. وفي التلامس المباشر تحطّمت مئات الدبابات في يومين.'
    ],
    narration: 'في ١٤ أكتوبر، بدأت ردة الفعل الإسرائيلية. عملية اسمها «كرمي» — ومعناها الكرمة — باتجاه السويس. وفي ١٦ أكتوبر، الجيش المصري الثالث كاد يقفل عليها. لما كل التشكيلات اتقابلت في المكان ده، كانت أقرب لحظة في الحرب. وبعدها ب يومين بس، كانت واحدة من أكبر معارك الدبابات في تاريخ المنطقة.',
    sfx: ['artillery', 'aircraft'],
    images: [{ f: 'centurion-fire.jpg', alt: 'صف دبابات سنترين في خط إطلاق نار', cap: 'الاشتباك الأكبر', tint: '#1a1712' }]
  },
  {
    id: 'ch07', num: '07', tc: '18 OCT', time: '١٨ أكتوبر · حرب الدبابات', kind: 'split', mood: 'steel',
    kicker: 'الممرات بين الجيشين الثاني والثالث',
    title: 'حرب الدبابات',
    body: [
      'في <strong>١٨ أكتوبر</strong>، دارت اشتباكات التقاء في الممرات بين الجيشين الثاني والثالث. أكبر معركة مدرّعة في صحراء المنطقة منذ عقود، وحين تلامس الدبابات في مساحات ضيقة يصبح الحسم مسألة كثافة لا مهارة.',
      'وهنا بدأ الميزان يتبدّل. ليس في يوم واحد، لكن بوضوح. والممرات، التي كانت الطريق الوحيد للعبور، صارت أثمن منطقة يمكن أن تخسرها حرب، فضلًا عن أن تكون بوابتها.'
    ],

    narration: 'في ١٨ أكتوبر، اشتباك في الممرات بين الجيشين التاني والتالت. أكبر معركة مدرعة في الصحراء من عقود. ومن هنا الميزان بدأ يميل. مش في يوم واحد. لكن بوضوح. وبعدها، كل يوم كان أهم من اللي قبله.',
    sfx: ['artillery', 'wind'],
    images: [
      { f: 'centurion-fire.jpg', alt: 'صف دبابات سنترين في خط إطلاق نار، ١٣ أكتوبر ١٩٧٣', cap: 'خط إطلاق النار', tint: '#1a1712' },
      { f: 'destroyed-tank.jpg', alt: 'دبابة مدمّرة في الممرات', cap: 'الممرات', tint: '#1c1a16' }
    ]
  },
  {
    id: 'ch08', num: '08', tc: '22 OCT', time: '٢٢ أكتوبر · العودة', kind: 'stage', mood: 'sand',
    kicker: 'العودة عبر القناة · راية على بور فؤاد',
    title: 'العودة عبر القناة',
    body: [
      'في <strong>٢٢ أكتوبر ١٩٧٣</strong>، عبرت تقدّمات الجيش الثالث قناة الديفرسوار عائدًا إلى الضفة المصرية. وفي <strong>٢٣ أكتوبر</strong>، رُفعت راية القوات المسلحة على <strong>بور فؤاد</strong>.',
      'راية مصرية فوق أرض مصرية. الصورة لا تحتاج إلى تعليق.'
    ],
    narration: 'في ٢٢ أكتوبر ١٩٧٣، تقدّمات الجيش الثالث عبرت قناة الديفرسوار، ورجعوا إلى الضفة المصرية. وفي ٢٣ أكتوبر، رُفعت راية القوات المسلحة على بور فؤاد. راية مصرية فوق أرض مصرية. الصورة بتحكي الباقي.',
    sfx: ['wind'],
    duration: 13,
    images: [
      { f: 'flag-sinai.png', alt: 'جنود مصريون يرفعون راية القوات المسلحة في سيناء، أكتوبر ١٩٧٣', cap: 'راية القوات المسلحة · سيناء ١٩٧٣', tint: '#1c1810' },
      { f: 'soldiers-tanks.jpg', alt: 'جنود مصريون بين دبابات مدمّرة في سيناء', cap: 'سيناء · أكتوبر ١٩٧٣', tint: '#221a12' }
    ]
  },
  {
    id: 'ch09', num: '09', tc: '08 OCT', time: '٨ أكتوبر · الأزهر', kind: 'people', mood: 'sand',
    kicker: 'خطاب في الأزهر · ١٫٣ مليار جنيه · التبرعات الشعبية',
    title: 'عشر دقائق في الأزهر',
    body: [
      'في الثامنة من أكتوبر، ألقى الرئيس <strong>أنور السادات</strong> خطابًا في الأزهر. كانت كلماته القليلة بالغة الأثر: الناس واقفة على المخابز من الفجر، والطرق مزدحمة، وبعضهم يحمل ما يملك من <strong>ذهب وحُلي</strong> إلى الدولة، وآخرون يضعون ما ادّخروا من مال.',
      'واسمحت الدولة بسداد فروق الأسعار، حتى لا يترك أحد عمله ولا بيته. وعشرات الآلاف قدّموا أنفسهم متطوعين: جنودًا في الميدان، وكتبة، وعمالًا في المعسكرات والمصانع. لم يكن الشعب ينتظر قرارًا. كان قد سبق القرار بسنوات.',
      'الشعب لم يزرع جبهة… بل زرع جبهته.'
    ],
    narration: 'في ٨ أكتوبر، السادات وقف في الأزهر. قال كلام قصير، بسه غيّر كل حاجة. الناس كانت واقفة في المخابز من الفجر. الطرق مليانة. ناس رايحة بأحسنها — ذهب وحُلي — عشان الدولة. ناس تانية حطت كل فلوسها. والدولة سدّدت الفرق عشان محدش يخسر رزقه ولا بيته. وعشرات الآلاف اتطوعوا: جنود وكتبة وعمال. الشعب لم يزرع جبهة. بل زرع جبهته.',
    sfx: ['crowd', 'radio'],
    images: [{ f: 'portal.jpg', alt: 'منظر عام لنصب تذكاري لحرب أكتوبر', cap: 'نصب تذكاري · من الذاكرة', tint: '#191a1d' }]
  },
  {
    id: 'ch10', num: '10', tc: 'NUMBERS', time: 'أرقام الحرب', kind: 'stats', mood: 'steel',
    kicker: 'ما الذي كلّفته هذه الحرب؟',
    title: 'أرقام الحرب',
    body: [
      'من الواجب أن تُقال كما هي: لم تكن هذه انتصارًا حاسمًا في الميدان. كانت <em>انتصارًا سياسيًا</em>. وكانت أول حرب بين العرب وإسرائيل يُعاد فيها أرضٌ أُتفاوض عليها إلى أصحابها.'
    ],
    narration: 'دي أرقام الحرب. خمس جسور. ثمانين ألف جندي في الموجة الأولى. اتنين مئتين وعشرين طائرة. ألفي دبابة. اتنين وعشرين يومًا. أربعة عشر ألف وستمائة وستة وخمسين شهيدًا. ومن الناحية التانية، حوالي ألفين وسبعمائة. وبالمناسبة، دي مش انتصار حاسم في الميدان. دي انتصار سياسي. وأرض اتفاوض عليها رجعت لأهلها — وده أول مرة في تاريخ الحرب بين العرب وإسرائيل.',
    sfx: ['wind'],
    stats: [
      { n: 5, l: 'جسور عائمة' },
      { n: 80000, l: 'جندي في الموجة الأولى' },
      { n: 220, l: 'طائرة عبرت القناة' },
      { n: 2000, l: 'دبابة اشتبكت' },
      { n: 22, l: 'يوماً من الحرب' },
      { n: 14656, l: 'شهيداً — رقم رسمي مصري' },
      { n: 2700, l: 'تقريبًا — خسائر الطرف الآخر' }
    ]
  },
  {
    id: 'ch11', num: '11', tc: 'FRONT', time: 'الجبهة · الخريطة', kind: 'map', mood: 'steel',
    kicker: 'اسحب الخط · ٦ أكتوبر ← ٢٤ أكتوبر',
    title: 'الجبهة على الخريطة',
    body: [
      'على اليمين: خط الجبهة في <strong>٦ أكتوبر ١٩٧٣</strong> — خط بارليف على حدود القناة. وعلى اليسار: الخط نفسه في <strong>٢٤ أكتوبر</strong>.',
      'اسحب المقبض يمينًا ويسارًا. الجبهة كلها تتغيّر. في أقل من ثلاثة أسابيع، انتقلت من حافة القناة إلى عمق سيناء، ثم إلى ما بعد خط بارليف من الجهة الشرقية.'
    ],
    narration: 'دي الجبهة في ٦ أكتوبر. خط بارليف على حدود القناة. ودي الجبهة في ٢٤ أكتوبر. خط مختلف تمامًا، بعيد كله عنه. في أقل من تلات أسابيع، الجبهة اتقلبت من ضفة القناة لعمق سيناء. اسحب الخط، وشوف بنفسك.',
    sfx: ['wind'],
    map: true
  },
  {
    id: 'ch12', num: '12', tc: 'PEACE', time: 'الطريق إلى السلام', kind: 'split', mood: 'sand', flip: true,
    kicker: '١٩٧٣ ← ١٩٧٩ · من الحرب إلى معاهدة السلام',
    title: 'الطريق إلى السلام',
    body: [
      'في <strong>٢٢ أكتوبر ١٩٧٣</strong>، وصل هنري كيسنجر إلى القاهرة، ومعه مذكّرة عن شروط لم تكن مقبولة. أُجبر тогда على بدء المفاوضات.',
      'في <strong>١٩٧٤</strong> تم الفصل. وفي <strong>١٩٧٥</strong> وُقّعت اتفاقية سيناء الثانية. وفي أبريل ١٩٧٤ أعلن السادات في خطابه أن ما أنقذ مصر هو ثمن المدافع، لا شيء آخر. وفي <strong>نوفمبر ١٩٧٧</strong> زار القدس. وفي <strong>١٧ سبتمبر ١٩٧٨</strong> وقّع كامب ديفيد، وفي <strong>١٩٧٩</strong> معاهدة السلام.',
      'من حرب إلى سلام، في أقل من ست سنوات.'
    ],
    narration: 'في ٢٢ أكتوبر ١٩٧٣، كيسنجر وصل القاهرة. مذكّرته كانت صادمة، والمفاوضات لازم تبدأ. في ١٩٧٤ تم الفصل. في ١٩٧٥ اتوقّعت اتفاقية سيناء التانية. في نوفمبر ١٩٧٧، السادات زار القدس. في ١٩٧٨، كامب ديفيد. وفي ١٩٧٩، معاهدة السلام. من حرب إلى سلام، في أقل من ست سنين.',
    sfx: ['crowd', 'radio'],
    images: [
      { f: 'sadat-kissinger.jpg', alt: 'الرئيس أنور السادات وهنري كيسنجر', cap: 'القاهرة ١٩٧٣', tint: '#1a1a1c' },
      { f: 'sadat-mubarak.jpg', alt: 'الرئيس أنور السادات ونائبه محمد أنور السادات', cap: 'السادات ومبارك', tint: '#1b1913' },
      { f: 'sadat.jpg', alt: 'الرئيس أنور السادات، ١٩٧٣', cap: 'أنور السادات', tint: '#1a1815' }
    ]
  },
  {
    id: 'ch13', num: '13', tc: 'MEMORY', time: 'الشهداء', kind: 'memorial', mood: 'cold', silent: true,
    kicker: 'صمت · تمثال الجندي المجهول · أحمد حمدي',
    title: 'الشهداء',
    body: [
      'كل حرب لها ثمن. هذا ثمن حربنا.',
      'عند تمثال <strong>الجندي المجهول</strong> في القاهرة — الشهيد <strong>أحمد حمدي</strong> — تتوقف كل الأرقام، لأنها تعود إلى أسماء.',
      'وراء كل رقم اسم. أسماء كثيرة لم تُحصَ، ولم يُكتب عنها شيء.'
    ],
    narration: 'كل حرب لها ثمن. وده ثمن حربنا. قدّام تمثال الجندي المجهول في القاهرة، الشهيد أحمد حمدي، الأرقام كلها بتقف. لأنها بترجع لأسماء. وأسماء كتير محدش عدّاها، ومحدش كتب عنها حاجة.',
    duration: 14,
    sfx: ['silence'],
    mem: [
      { v: '١٤٬٦٥٦', l: 'شهيدًا — رقم رسمي مصري' },
      { v: '٣٢٬١٩٦', l: 'جريحًا — رقم رسمي مصري' },
      { v: '١٫٣ مليار', l: 'جنيه مصري — تكلفة الحرب' },
      { v: '~١٠', l: 'مليارات دولار — تعادل آنذاك' }
    ],
    images: [{ f: 'hulikat.jpg', alt: 'صورة أرشيفية توثّق ضحايا حرب أكتوبر في مصر', cap: '', tint: '#0e1013' }]
  },
  {
    id: 'ch14', num: '14', tc: '1981', time: '٦ أكتوبر ١٩٨١', kind: 'mosaic', mood: 'red',
    kicker: 'اغتيال الرئيس السادات · جائزة نوبل ١٩٧٨',
    title: '٦ أكتوبر ١٩٨١',
    body: [
      'في <strong>٦ أكتوبر ١٩٨١</strong>، وأثناء استعراض عسكري في القاهرة، قُتل الرئيس <strong>أنور السادات</strong> في عملية اغتيال. وقد اختار التاريخ لهذا اليوم تاريخ حرب أكتوبر، لأنه كان الرئيس الذي صنعها.',
      'وفي <strong>١٩٧٨</strong>، تشارك السادات ومناحيم بيغن في <strong>جائزة نوبل للسلام</strong>.',
      'الحديث عن ذلك اليوم ليس انتقامًا. إنه تذكير بأن رجلًا واحدًا يستطيع أن يغيّر مسار بلد — وأن الثمن قد يكونه هو.'
    ],
    narration: 'في ٦ أكتوبر ١٩٨١، وأثناء استعراض عسكري في القاهرة، الرئيس أنور السادات اتقتل. والتاريخ اختار ليه اليوم ده، تبعًا لذكرى حرب أكتوبر. لأنه كان الرئيس اللي عملها. وفي ١٩٧٨، هو ومناحيم بيغن تشاركوا في جائزة نوبل للسلام. الكلام عن النهارده مش انتقام. الكلام إن رجل واحد يقدر يغيّر مسار بلد، وإن الثمن ممكن يبقى هو.',
    sfx: ['wind', 'silence'],
    images: [
      { f: 'sadat.jpg', alt: 'الرئيس أنور السادات، ١٩٧٣', cap: 'الرئيس أنور السادات', tint: '#1a1815' },
      { f: 'leaders-ops.jpg', alt: 'الرئيس أنور السادات مع قادة حرب أكتوبر', cap: 'السادات مع القادة', tint: '#1a1815' },
      { f: 'leaders.jpg', alt: 'قادة الجيش المصري في حرب أكتوبر', cap: 'قادة حرب أكتوبر', tint: '#1a1a1d' }
    ]
  }
];

/* derive narration chunks + estimated duration for every chapter */
SCENES.forEach(function (s) {
  s.chunks = splitChunks(s.narration);
  s.dur = s.duration || Math.max(6, s.chunks.reduce(function (a, c) { return a + c.dur; }, 0) + 0.7);
});

/* the film's opening and closing are scenes too */
var PRE  = { id: 'pre',  num: '◆',  tc: '00:00',  time: 'المقدمة',   title: 'شريحة العنوان',  el: '#titlecard', dur: 5.2, chunks: [], sfx: ['silence'] };
var POST = { id: 'post', num: '◆',  tc: 'END',   time: 'الخاتمة',   title: 'الوعد',          el: '#closing',   dur: 12, chunks: [], sfx: ['wind'], mood: 'sand' };
var FILM = [PRE].concat(SCENES, [POST]);

/* ---------- 2. Timeline strip -------------------------------------------- */
var TIMELINE = [
  { l: '٦ أكتوبر',    y: '1973', to: 'ch00' },
  { l: '٨ أكتوبر',    y: '1973', to: 'ch09' },
  { l: '١٤ أكتوبر',   y: '1973', to: 'ch06' },
  { l: '١٦ أكتوبر',   y: '1973', to: 'ch06' },
  { l: '١٨ أكتوبر',   y: '1973', to: 'ch07' },
  { l: '٢٢ أكتوبر',   y: '1973', to: 'ch08' },
  { l: '٢٣ أكتوبر',   y: '1973', to: 'ch08' },
  { l: 'فصل القنوات', y: '1974', to: 'ch12' },
  { l: 'سيناء ٢',     y: '1975', to: 'ch12' },
  { l: 'زيارة القدس', y: '1977', to: 'ch12' },
  { l: 'كامب ديفيد',  y: '1978', to: 'ch12' }
];

/* ---------- 3. Image attributions (المصادر) ------------------------------ */
var SOURCES = [
  { f: 'portal.jpg', t: 'منظر عام لنصب تذكاري / بانوراما لحرب أكتوبر ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD', n: '' },
  { f: 'centurion-fire.jpg', t: 'صف دبابات سنترين في خط إطلاق نار، ١٣ أكتوبر ١٩٧٣', s: 'Israel Defense Forces photo collection · ويكيميديا كومنز', l: 'CC BY-SA', n: '' },
  { f: 'israeli-tanks-canal.jpg', t: 'دبابات إسرائيلية تعبر قناة السويس', s: 'Israel Defense Forces photo collection · ويكيميديا كومنز', l: 'CC BY-SA', n: '' },
  { f: 'soldiers-tanks.jpg', t: 'جنود مصريون أمام دبابات مدمّرة، أكتوبر ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'flag-sinai.png', t: 'رفع راية القوات المسلحة المصرية في سيناء، أكتوبر ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'destroyed-tank.jpg', t: 'دبابة مدمّرة في سيناء ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'october-war.jpg', t: 'صورة من أرشيف حرب أكتوبر ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'montage.png', t: 'لوحة مركّبة (montage) لحرب أكتوبر / حرب كيبور', s: 'ويكيميديا كومنز', l: 'CC BY-SA 3.0', n: 'ملف كبير (٢٫٤ ميجابايت) — راجع صفحة الملف للتأكد من الرخصة.' },
  { f: 'collage.png', t: 'لوحة مركّبة (collage) لحرب أكتوبر ١٩٧٣', s: 'ويكيميديا كومنز', l: 'CC BY-SA 3.0', n: 'ملف كبير (١٫٨ ميجابايت) — راجع صفحة الملف للتأكد من الرخصة.' },
  { f: 'leaders.jpg', t: 'قادة الجيش المصري في حرب أكتوبر (منهم الرئيس أنور السادات)', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'leaders-ops.jpg', t: 'الرئيس أنور السادات مع قادة حرب أكتوبر', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'shazly-message.jpg', t: 'رسالة الفريق سعد الدين الشاذلي إلى الضباط والجنود قبل الحرب', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'sadat.jpg', t: 'الرئيس أنور السادات، ١٩٧٣', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'sadat-front.png', t: 'الرئيس أنور السادات على الجبهة المصرية', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'sadat-kissinger.jpg', t: 'الرئيس أنور السادات وهنري كيسنجر', s: 'U.S. Central Intelligence Agency · أرشيف عام', l: 'PD', n: '' },
  { f: 'sadat-mubarak.jpg', t: 'الرئيس أنور السادات ونائبه محمد أنور السادات', s: 'U.S. Central Intelligence Agency · أرشيف عام', l: 'PD', n: '' },
  { f: 'pow.jpg', t: 'جنود إسرائيليون أسارى في الحفظ المصرية قرب القاهرة', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'hulikat.jpg', t: 'صورة أرشيفية توثّق ضحايا حرب أكتوبر في مصر', s: 'ويكيميديا كومنز', l: 'PD/CC', n: '' },
  { f: 'map-front-6oct.svg', local: 'map-front-6oct.png', t: 'خريطة خط الجبهة في سيناء، ٦ أكتوبر ١٩٧٣', s: 'Rr016 · ويكيميديا كومنز', l: 'CC BY-SA', n: 'الملف الأصلي على كومنز بصيغة SVG؛ النسخة المحلية محفوظة بنفس البيانات.' },
  { f: 'map-front-24oct.svg', local: 'map-front-24oct.png', t: 'خريطة خط الجبهة في سيناء، ٢٤ أكتوبر ١٩٧٣', s: 'Rr016 · ويكيميديا كومنز', l: 'CC BY-SA', n: 'الملف الأصلي على كومنز بصيغة SVG؛ النسخة المحلية محفوظة بنفس البيانات.' },
  { f: 'flag-egypt.svg', local: 'flag-egypt.png', t: 'علم جمهورية مصر العربية', s: 'Public domain', l: 'PD', n: 'النسخة المحلية محفوظة بنفس البيانات.' }
];

/* ---------- 4. Historical references -------------------------------------- */
var REFS = [
  { t: 'ويكيبيديا العربية — حرب أكتوبر', d: 'مدخل عربي مرجعي لتاريخ الحرب وأرقامها الأساسية.', u: 'https://ar.wikipedia.org/wiki/حرب_أكتوبر' },
  { t: 'Wikipedia — Yom Kippur War', d: 'المدخل الإنكليزي، وفيه قوائم تفصيلية للعمليات والقيادات.', u: 'https://en.wikipedia.org/wiki/Yom_Kippur_War' },
  { t: 'ويكيميديا كومنز — Category: Yom Kippur War', d: 'كل الصور المستخدمة هنا معروضة في هذه المجموعة.', u: 'https://commons.wikimedia.org/wiki/Category:Yom_Kippur_War' },
  { t: 'خطاب الرئيس أنور السادات، ٦ أكتوبر ٢٠٠١', d: 'مصدر الاقتباس الوارد في الفصل ٠٢ عن «جيل أبناء مصر».', u: 'https://ar.wikipedia.org/wiki/أنور_السادات' },
  { t: 'Arabic Wikipedia — سعد الدين الشاذلي', d: 'دور رئيس الأركان في التخطيط للعبور.', u: 'https://ar.wikipedia.org/wiki/سعد_الدين_الشاذلي' },
  { t: 'Arabic Wikipedia — عملية كَرمّي', d: 'العملية المضادة الإسرائيلية في ١٤ أكتوبر ١٩٧٣.', u: 'https://ar.wikipedia.org/wiki/حرب_أكتوبر' },
  { t: 'Israel State Archives / IDF Photo Collection', d: 'مصدر صور الجيش الإسرائيلي (دبابات سنترين ودبابات القناة).', u: 'https://www.archives.gov.il/' },
  { t: 'U.S. Central Intelligence Agency — Photo Library', d: 'مصدر صور السادات وكيسنجر (أرشيف عام).', u: 'https://www.cia.gov/resources/csi/' }
];

/* ---------- 5. Names crawl (real, attested) -------------------------------- */
var NAMES = [
  { n: 'أنور السادات', r: 'رئيس جمهورية مصر العربية' },
  { n: 'سعد الدين الشاذلي', r: 'رئيس أركان الجيش المصري' },
  { n: 'أحمد إسماعيل علي', r: 'قائد العمليات الميدانية' },
  { n: 'حاتم علي', r: 'قائد القطاع الشمالي — دابور' },
  { n: 'صديقي محمود', r: 'رئيس أركان الجيش ١٩٧٣' },
  { n: 'محمد أنور السادات', r: 'قائد القوة الجوية ١٩٧٣' },
  { n: 'أحمد حمدي', r: 'الجندي المجهول' }
];

/* ==========================================================================
   RENDERERS
   ========================================================================== */
function photo(im, extra) {
  return '<figure class="photo m-' + (im.mood || 'sand') + (extra || '') + '" style="--tint:' + (im.tint || '#1b1a1f') + '">' +
    '<img src="' + IMG + im.f + '" alt="' + esc(im.alt) + '" loading="lazy" decoding="async"' +
    ' style="background:' + (im.tint || '#1b1a1f') + '">' +
    (im.cap ? '<figcaption class="cap">' + esc(im.cap) + '</figcaption>' : '') +
    '</figure>';
}
function paras(s, cls) {
  return '<div class="sbody ' + (cls || '') + '">' +
    s.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>';
}
function head(s) {
  return '<header class="shead"><span class="shead__num">' + s.num + '</span><div class="shead__txt">' +
    '<span class="shead__tc">' + esc(s.tc) + '</span><h2>' + esc(s.title) + '</h2>' +
    '<p class="shead__kicker">' + esc(s.kicker || '') + '</p></div></header>';
}
function facts(f) {
  if (!f || !f.length) return '';
  return '<div class="factgrid rv" data-d="3">' + f.map(function (x) {
    return '<div class="fact"><b>' + x.v + '</b><span>' + esc(x.l) + '</span></div>';
  }).join('') + '</div>';
}

var LAYOUT = {
  /* full-bleed chapter */
  full: function (s) {
    return '<div class="fullbleed"><div class="fullbleed__bg"><img src="' + IMG + s.hero + '" alt="" aria-hidden="true" loading="lazy" decoding="async"></div>' +
      '<div class="scene__wrap">' + head(s) + paras(s) + facts(s.facts) +
      (s.images && s.images.length ? '<div style="max-width:420px;margin-top:40px">' + photo(s.images[0], ' kb') + '</div>' : '') +
      '</div></div>';
  },
  /* asymmetric split */
  split: function (s) {
    var im = s.images[0] || {};
    var rest = (s.images || []).slice(1).map(function (i) { return photo(i); }).join('');
    return '<div class="split' + (s.flip ? ' split--flip' : '') + (im.ratio === 'tall' ? ' split--tall' : '') + '">' +
      '<div class="split__text rv">' + paras(s) + facts(s.facts) + '</div>' +
      '<div class="split__media rv" data-d="2">' + photo(im, ' kb' + (s.flip ? ' kb-alt' : '')) +
      '<span class="offsettag">' + esc(s.tc) + '</span>' +
      (rest ? '<div class="mosaic" style="margin-top:16px">' + rest + '</div>' : '') + '</div></div>';
  },
  /* editorial mosaic + text */
  mosaic: function (s) {
    return '<div class="split"><div class="split__text rv">' + paras(s) + facts(s.facts) + '</div>' +
      '<div class="split__media rv" data-d="2"><div class="mosaic">' +
      (s.images || []).map(function (i, n) { return photo(i, n === 0 ? ' kb' : ''); }).join('') +
      '</div></div></div>';
  },
  /* quote-led */
  quote: function (s) {
    return '<div class="quotegrid"><div class="quoteblock rv">' +
      '<span class="quotemark" aria-hidden="true">❝</span>' +
      '<q>' + esc(s.quote.q) + '</q><cite>' + esc(s.quote.cite) + '</cite></div>' +
      '<div class="split__media rv" data-d="2">' + (s.images || []).map(function (i, n) {
        return n === 0 ? photo(i, ' kb') : photo(i);
      }).join('<div style="height:16px"></div>') + '</div></div>' +
      '<div class="rule"></div>' + paras(s) + facts(s.facts);
  },
  /* the people — personal photo slots */
  people: function (s) {
    return paras(s) +
      '<div class="slots rv" data-d="3">' +
      /* ------------------------------------------------------------------
         To show your own photo here: save the file as  img/mine-1.jpg
         (next to index.html, inside img). The placeholder below is
         replaced automatically the moment the file exists — if it doesn't,
         the dashed "ضع صورتك هنا" frame simply stays.
      ------------------------------------------------------------------ */
      '<figure class="slot" data-mine="img/mine-1.jpg"><div class="slot__ph"><b>ضع صورتك هنا</b>صورة من ذاكرتك عن أكتوبر<small>img/mine-1.jpg</small></div></figure>' +
      '<figure class="slot" data-mine="img/mine-2.jpg"><div class="slot__ph"><b>ضع صورتك هنا</b>صورة من ٦ أكتوبر ١٩٧٣<small>img/mine-2.jpg</small></div></figure>' +
      '<figure class="slot" data-mine="img/mine-3.jpg"><div class="slot__ph"><b>ضع صورتك هنا</b>صورة عائلية قديمة<small>img/mine-3.jpg</small></div></figure>' +
      '</div><p class="mapnote" style="margin-top:16px"><b>←</b> ضع صورك في مجلد <span style="font-family:var(--f-mono);direction:ltr">img/</span> وسمِّها mine-1.jpg لتظهر هنا تلقائيًا.</p>' +
      facts(s.facts);
  },
  /* animated count-up stats */
  stats: function (s) {
    return paras(s) + '<div class="statgrid rv" data-d="2">' + s.stats.map(function (x, i) {
      return '<div class="stat"><b data-count="' + x.n + '" data-d="' + i + '">٠</b><span>' + esc(x.l) + '</span></div>';
    }).join('') + '</div>' +
    '<p class="mapnote" style="margin-top:20px"><b>ملاحظة:</b> أرقام الخسائر من الناحيتين تقديرية، وتختلف بين المصادر.</p>';
  },
  /* before / after front map */
  map: function (s) {
    return paras(s) +
      '<div class="mapsec rv" data-d="2"><div class="mapcmp" id="mapcmp">' +
      '<img class="mapcmp__base" src="' + IMG + 'map-front-24oct.png" alt="خط الجبهة في سيناء بتاريخ ٢٤ أكتوبر ١٩٧٣" loading="lazy" decoding="async">' +
      '<img class="mapcmp__top" src="' + IMG + 'map-front-6oct.png" alt="خط الجبهة في سيناء بتاريخ ٦ أكتوبر ١٩٧٣" loading="lazy" decoding="async">' +
      '<span class="mapcmp__grad"></span>' +
      '<span class="mapcmp__tag mapcmp__tag--a">٦ أكتوبر ١٩٧٣</span>' +
      '<span class="mapcmp__tag mapcmp__tag--b">٢٤ أكتوبر ١٩٧٣</span>' +
      '<span class="mapcmp__bar"></span>' +
      '<button class="mapcmp__grip" id="mapGrip" type="button" role="slider" aria-label="خط الجبهة بين ٦ أكتوبر و٢٤ أكتوبر" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="٦ أكتوبر ١٩٧٣">‹›</button>' +
      '</div><div><p class="mapnote"><b>اسحب</b> المقبض يمينًا ويسارًا، أو استخدم مفاتيح الأسهم وهو مُركَّز. الخريطتان بنفس الأبعاد تمامًا، فالمقارنة دقيقة البكسل.</p></div></div>';
  },
  /* stage — a single image given room to breathe */
  stage: function (s) {
    return '<div class="split' + (s.flip ? ' split--flip' : '') + '">' +
      '<div class="split__text rv">' + paras(s) + '</div>' +
      '<div class="split__media rv" data-d="2" style="display:flex;gap:16px;align-items:flex-start">' +
      (s.images || []).map(function (i, n) {
        return '<div style="flex:' + (n === 0 ? '1.25' : '0.75') + '">' + photo(i, ' kb' + (n ? ' kb-alt' : '')) + '</div>';
      }).join('') + '</div></div>';
  },
  /* memorial — deliberately silent */
  memorial: function (s) {
    return '<div style="position:relative;overflow:hidden;overflow:clip">' +
      '<div style="position:absolute;inset:-40px -20px;z-index:-1;overflow:hidden;opacity:.16;pointer-events:none">' +
      '<img src="' + IMG + s.images[0].f + '" alt="" aria-hidden="true" loading="lazy" decoding="async" class="kb" style="width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.1) brightness(.5)">' +
      '</div>' + head(s) + paras(s) +
      '<div class="memgrid rv" data-d="3">' + s.mem.map(function (m) {
        return '<div><b>' + m.v + '</b><span>' + esc(m.l) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="memonial rv" data-d="4">أحمد حمدي<small>الجندي المجهول · نصبته في ميدان التحرير بالقاهرة</small></p>' +
      '<p class="memonial" style="display:none"></p>' +
      '</div>';
  }
};

function renderReel() {
  var reel = $('#reel');
  reel.innerHTML = SCENES.map(function (s) {
    var cls = 'scene rv' + (s.kind === 'full' ? ' scene--full' : '') + (s.kind === 'memorial' ? ' scene--memorial' : '');
    return '<section class="' + cls + '" id="' + s.id + '" data-scene="' + s.id + '" aria-label="فصل ' + s.num + ' — ' + esc(s.title) + '">' +
      '<div class="scene__wrap">' + (LAYOUT[s.kind] || LAYOUT.split)(s) + '</div></section>';
  }).join('');
}

function renderTimeline() {
  $('#timelineTrack').innerHTML = TIMELINE.map(function (t) {
    return '<a class="tl" href="#' + t.to + '" data-tl="' + t.to + '">' + esc(t.l) + ' <u>' + t.y + '</u></a>';
  }).join('');
}

function renderNav() {
  $('#navLinks').innerHTML = SCENES.map(function (s) {
    return '<a href="#' + s.id + '" data-nav="' + s.id + '" title="' + esc(s.title) + '">' + s.num + '</a>';
  }).join('');
}

function renderCredits() {
  $('#srcList').innerHTML = SOURCES.map(function (s) {
    var local = s.local || s.f;
    var url = 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(s.f);
    var lic = s.l === 'PD' ? 'tag--pd' : 'tag--cc';
    return '<article class="src">' +
      '<div class="src__file"><img class="src__thumb" src="' + IMG + local + '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +
      '<span class="src__name">' + esc(local) + '</span></div>' +
      '<p class="src__title">' + esc(s.t) + '</p>' +
      '<div class="src__meta"><span class="tag">المصدر: ' + esc(s.s) + '</span><span class="tag ' + lic + '">' + esc(s.l) + '</span></div>' +
      '<a class="src__link" href="' + url + '" target="_blank" rel="noopener noreferrer">صفحة الملف على كومنز ↗</a>' +
      (s.n ? '<p class="src__note">' + esc(s.n) + '</p>' : '') +
      '</article>';
  }).join('');

  $('#refList').innerHTML = REFS.map(function (r) {
    return '<li><b>' + esc(r.t) + '</b>' + esc(r.d) +
      ' <a href="' + r.u + '" target="_blank" rel="noopener noreferrer">' + esc(r.u) + '</a></li>';
  }).join('');

  $('#crawl').innerHTML = NAMES.concat(NAMES).map(function (p) {
    return '<span class="crawl__item"><b>' + esc(p.n) + '</b><span>' + esc(p.r) + '</span></span>';
  }).join('');
}

function renderPledge() {
  $('#pledge').innerHTML =
    '<p>عبرنا القناة مرّة واحدة. وكانت المرّة تلك ضرورية.</p>' +
    '<p>أمّا العبور الثاني — لو جاء — فلا بدّ أن يكون بالسلام، لا بالسلاح.</p>' +
    '<p>نحن لم نبنِ هذا ليأخذنا إلى الحرب مرّة أخرى. نحن نكتبه بالحرف.</p>';
  /* the Egyptian flag, from Commons (public domain) */
  $('#closing').insertAdjacentHTML('afterbegin',
    '<img src="' + IMG + 'flag-egypt.png" alt="" aria-hidden="true" loading="lazy" decoding="async"' +
    ' style="position:absolute;top:0;inset-inline:0;width:100%;height:100%;object-fit:cover;opacity:.05;filter:grayscale(.5)">');
}

/* personal photo slots — probe without ever logging a 404 */
function hydrateSlots() {
  $$('[data-mine]').forEach(function (slot) {
    var probe = new Image();
    probe.onload = function () {
      var img = document.createElement('img');
      img.src = slot.getAttribute('data-mine');
      img.alt = 'صورة شخصية وضعها صاحب الموقع';
      img.loading = 'lazy';
      slot.appendChild(img);
      slot.classList.add('is-filled');
    };
    probe.onerror = function () { /* file absent — keep the placeholder */ };
    probe.src = slot.getAttribute('data-mine');
  });
}

/* ==========================================================================
   SFX — everything synthesized with Web Audio. No audio files.
   Nothing is created until a real user gesture unlocks the context.
   ========================================================================== */
var SFX = (function () {
  var ctx = null, master = null, noiseBuf = null, nodes = [], bed = null;

  function boot() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = state.muted ? 0 : state.volume * 0.5;
    master.connect(ctx.destination);
    /* 2 s of white noise, reused by everything */
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function setMute(m) {
    state.muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : state.volume * 0.5, ctx.currentTime, 0.05);
  }
  function setVolume(v) {
    state.volume = v;
    if (master && !state.muted) master.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.05);
  }
  function keep(n) { nodes.push(n); return n; }
  function noise() { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; }
  function env(g, t0, a, peak, d, sus) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t0 + a + d);
  }
  function sweep(p, t0, f0, f1, dur) {
    p.frequency.setValueAtTime(f0, t0);
    p.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  }

  var CUES = {
    /* aircraft drone over Cairo */
    aircraft: function (dur) {
      var t = ctx.currentTime, out = ctx.createGain();
      out.gain.value = 1; out.connect(master);
      var g = ctx.createGain(); g.connect(out);
      env(g, t, 1.1, 0.26, dur * 0.7, 0.02);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
      bp.connect(g); sweep(bp.frequency, t, 180, 520, dur * 0.6); sweep(bp.frequency, t + dur * 0.6, 520, 200, dur * 0.4);
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.14;
      var lg = ctx.createGain(); lg.gain.value = 110; lfo.connect(lg); lg.connect(bp.frequency);
      var n = noise(); var ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(bp); n.start(t); lfo.start(t);
      [55, 82.5, 110.3].forEach(function (f, i) {
        var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        var og = ctx.createGain(); og.gain.value = 0.1 / (i + 1);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + dur);
      });
      n.stop(t + dur);
    },
    /* artillery: noise burst -> lowpass, exponential decay + sub boom */
    artillery: function () {
      var t = ctx.currentTime, dur = 2.9;
      var out = ctx.createGain(); out.connect(master);
      var n = noise(); n.playbackRate.value = 0.55;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      sweep(lp.frequency, t, 1400, 180, dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      n.connect(lp); lp.connect(g); g.connect(out); n.start(t); n.stop(t + dur);
      var sub = ctx.createOscillator(); sub.type = 'sine';
      sweep(sub.frequency, t, 74, 32, dur * 0.6);
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(0.7, t);
      sg.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.7);
      sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(t + dur * 0.7);
    },
    /* the crossing: low saw + slow filter sweep */
    bridgeHum: function (dur) {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      var g = ctx.createGain(); env(g, t, 1.4, 0.2, dur, 0.02); g.connect(out);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
      sweep(lp.frequency, t, 180, 820, dur * 0.5); sweep(lp.frequency, t + dur * 0.5, 820, 220, dur * 0.5);
      lp.connect(g);
      [58, 87, 116].forEach(function (f, i) {
        var o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
        var og = ctx.createGain(); og.gain.value = 0.12 / (i + 1);
        o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur);
      });
      var n = noise(); var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      var ng = ctx.createGain(); ng.gain.value = 0.035;
      n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + dur);
    },
    /* radio: click bursts + a high beep */
    radio: function () {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      for (var i = 0; i < 3; i++) {
        var ts = t + i * 0.17;
        var n = noise(); var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.22, ts); g.gain.exponentialRampToValueAtTime(0.0005, ts + 0.05);
        n.connect(hp); hp.connect(g); g.connect(out); n.start(ts); n.stop(ts + 0.06);
      }
      var b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = 1180;
      var bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t + 0.58);
      bg.gain.exponentialRampToValueAtTime(0.1, t + 0.62);
      bg.gain.setValueAtTime(0.1, t + 0.78);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.86);
      b.connect(bg); bg.connect(out); b.start(t + 0.58); b.stop(t + 0.9);
    },
    /* the people: pink-ish noise swell */
    crowd: function (dur) {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      var g = ctx.createGain(); env(g, t, dur * 0.4, 0.17, dur * 0.6, 0.02); g.connect(out);
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.7;
      sweep(bp.frequency, t, 380, 760, dur * 0.7);
      bp.connect(g);
      var n = noise(); n.playbackRate.value = 0.35;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      n.connect(lp); lp.connect(bp); n.start(t); n.stop(t + dur);
    },
    /* Sinai wind: noise through a sweeping highpass */
    wind: function (dur) {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      var g = ctx.createGain(); env(g, t, dur * 0.35, 0.13, dur * 0.65, 0.02); g.connect(out);
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass';
      sweep(hp.frequency, t, 260, 1500, dur * 0.5); sweep(hp.frequency, t + dur * 0.5, 1500, 300, dur * 0.5);
      hp.connect(g);
      var n = noise(); n.playbackRate.value = 0.85; n.connect(hp); n.start(t); n.stop(t + dur);
    },
    /* very quiet film-mechanism click between scenes */
    projectorClick: function () {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      var n = noise(); var bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 3200; bp.Q.value = 2.2;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.045);
      n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.05);
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 2600;
      var og = ctx.createGain();
      og.gain.setValueAtTime(0.05, t); og.gain.exponentialRampToValueAtTime(0.0004, t + 0.03);
      o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.04);
    },
    pageTurn: function () {
      var t = ctx.currentTime, out = ctx.createGain(); out.connect(master);
      var n = noise(); var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      sweep(bp.frequency, t, 700, 2600, 0.26);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 0.3);
      n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + 0.32);
    },
    /* deliberate silence — stop everything */
    silence: function () { stopAll(); }
  };

  function stopAll() {
    if (bed) { try { bed.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25); } catch (e) {} }
    nodes.forEach(function (n) { try { n.stop(ctx.currentTime + 0.35); } catch (e) {} });
    nodes = [];
  }
  function stopBed() {
    if (bed) { try { bed.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2); } catch (e) {} bed = null; }
  }
  /* a very low ambient bed, different character per chapter mood */
  function bedFor(mood) {
    if (!ctx) return;
    stopBed();
    var t = ctx.currentTime;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 2.4);
    g.connect(master);
    var base = mood === 'red' ? 41.2 : mood === 'cold' ? 32.7 : mood === 'steel' ? 49 : 43.6;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 1.2;
    lp.connect(g);
    [base, base * 1.5, base * 2].forEach(function (f, i) {
      var o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = f;
      var og = ctx.createGain(); og.gain.value = 0.5 / (i + 1);
      o.connect(og); og.connect(lp); o.start(t);
    });
    bed = { g: g, os: [] };
  }
  function play(name, dur) {
    if (!ctx || state.muted) return;
    var fn = CUES[name];
    if (!fn) return;
    try { fn(dur || 4.2); } catch (e) { /* audio is decorative — never break the film */ }
  }
  return { boot: boot, play: play, stopAll: stopAll, stopBed: stopBed, bedFor: bedFor, setMute: setMute, setVolume: setVolume,
    get ready() { return !!ctx; } };
})();

/* ==========================================================================
   VOICEOVER — Web Speech, with a genuine "silent cinema" fallback
   ========================================================================== */
var VOICE = (function () {
  var voices = [], pick = null, silentMode = false, warned = false;
  var PREF = ['microsoft hoda', 'microsoft arabic', 'google عربية', 'google arabic'];

  function score(v) {
    var n = (v.name || '').toLowerCase(), l = (v.lang || '').toLowerCase().replace('_', '-');
    if (!/^ar\b|^ar-/.test(l)) return -1;
    var s = 10;
    if (l.indexOf('ar-eg') === 0) s += 40;
    else if (l.indexOf('ar') === 0) s += 22;
    if (v.localService) s += 6;
    PREF.forEach(function (p, i) { if (n.indexOf(p) === 0) s += 30 - i * 5; });
    return s;
  }
  function load() {
    if (!window.speechSynthesis) return;
    voices = (window.speechSynthesis.getVoices() || []).filter(function (v) { return score(v) >= 0; });
    voices.sort(function (a, b) { return score(b) - score(a); });
    pick = voices[0] || null;
    silentMode = !pick;
    if (pick) applyPick(pick);
    paintSelect();
    if (silentMode && !warned) { warned = true; toast('وضع السينما الصامتة — لا يوجد صوت عربي على الجهاز'); }
  }
  function applyPick(v) { if (VOICE._onpick) VOICE._onpick(v); }
  function paintSelect() {
    var sel = $('#voiceSel');
    if (!sel) return;
    if (silentMode) { sel.innerHTML = '<option>لا يوجد صوت عربي على هذا الجهاز</option>'; sel.disabled = true; return; }
    sel.disabled = false;
    sel.innerHTML = voices.map(function (v, i) {
      return '<option value="' + i + '"' + (v === pick ? ' selected' : '') + '>' + esc(v.name) + ' — ' + esc(v.lang) + '</option>';
    }).join('');
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = load;
    if (window.speechSynthesis.getVoices().length) load();
    else setTimeout(load, 250), setTimeout(load, 1200);
  } else { silentMode = true; }

  return {
    speak: function (text, onboundary, onend) {
      if (silentMode || !window.speechSynthesis || !pick) { onend && onend(); return false; }
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.voice = pick; u.lang = pick.lang || 'ar-EG';
        u.rate = 0.94; u.pitch = 0.92; u.volume = state.muted ? 0 : 1;
        u.onboundary = onboundary || null;
        u.onend = function () { onend && onend(); };
        u.onerror = function () { onend && onend(); };
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { onend && onend(); return false; }
    },
    pause: function () { try { window.speechSynthesis.pause(); } catch (e) {} },
    resume: function () { try { window.speechSynthesis.resume(); } catch (e) {} },
    stop: function () { try { window.speechSynthesis.cancel(); } catch (e) {} },
    get silent() { return silentMode; },
    get available() { return !silentMode; },
    get count() { return voices.length; },
    setIndex: function (i) { if (voices[i]) { pick = voices[i]; applyPick(pick); silentMode = false; paintSelect(); } },
    _onpick: null
  };
})();

/* ==========================================================================
   FILM ENGINE
   ========================================================================== */
var FILM_ = (function () {
  var active = false, playing = false, i = -1, chunk = 0;
  var clock = 0, chunkClock = 0, pending = false, extra = 0;
  var wordMode = 'clock', lastWord = -1;
  var raf = { anim: 0, scroll: 0 }, sceneEls = [], last = 0;

  function letterbox() {
    var lb = Math.max(22, Math.min(88, Math.round(window.innerHeight * 0.078)));
    document.documentElement.style.setProperty('--lb', lb + 'px');
  }
  function setScrim(v) { document.body.classList.toggle('film', v); }

  /* cinematic eased scroll (constant-ish feel, unlike native smooth) */
  function scrollTo_px(target, ms) {
    if (state.reduced) { window.scrollTo(0, target); return; }
    var start = window.pageYOffset, delta = target - start, t0 = performance.now();
    ms = ms || 1500;
    if (Math.abs(delta) < 2) return;
    cancelAnimationFrame(raf.scroll);
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, start + delta * e);
      if (p < 1) raf.scroll = requestAnimationFrame(step);
    })(t0);
  }
  function targetFor(el) {
    var r = el.getBoundingClientRect();
    return window.pageYOffset + r.top - Math.max(90, window.innerHeight * 0.14);
  }

  function sceneEl(scene) {
    return scene.el ? $(scene.el) : $('#' + scene.id);
  }
  function setLive(i) {
    sceneEls.forEach(function (el) { el.classList.toggle('is-live', +el.dataset.idx === i); });
  }
  function paintRail() {
    FILM.forEach(function (s, k) {
      var c = railCells[k]; if (!c) return;
      c.classList.toggle('is-active', k === i);
      c.classList.toggle('is-done', k < i);
      var f = k < i ? 1 : k === i ? progress() : 0;
      c.querySelector('.rail__fill').style.width = (f * 100).toFixed(2) + '%';
    });
    var s = FILM[i];
    if (s) {
      $('#railNum').textContent = s.num;
      $('#railTitle').textContent = s.title;
      $('#railTc').textContent = s.tc;
    }
    $('#railSilent').hidden = !VOICE.silent || !active;
  }
  /* cheap per-frame update: only the active cell fill moves */
  function paintFill() {
    var c = railCells[i];
    if (c) c.querySelector('.rail__fill').style.width = (progress() * 100).toFixed(2) + '%';
  }
  function progress() {
    var s = FILM[i]; if (!s) return 0;
    var c = s.chunks && s.chunks[chunk];
    if (c) return Math.min(1, (chunk + chunkClock / c.dur) / s.chunks.length);
    return Math.min(1, clock / s.dur);
  }
  function globalProgress() {
    var before = 0;
    for (var k = 0; k < i; k++) before += FILM[k].dur;
    return (before + progress() * FILM[i].dur) / total();
  }
  function total() { return FILM.reduce(function (a, s) { return a + s.dur; }, 0); }

  /* --- subtitles ------------------------------------------------------ */
  var subsText = null;
  function showChunk(text) {
    if (!subsText) subsText = $('#subsText');
    subsText.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
  }
  function lightUp(upto) {
    var ws = subsText ? subsText.querySelectorAll('.w') : [];
    for (var k = 0; k < ws.length; k++) {
      ws[k].classList.toggle('on', k === upto);
      ws[k].classList.toggle('past', k < upto);
    }
    lastWord = upto;
  }

  /* --- scene flow ----------------------------------------------------- */
  function go(k, opts) {
    opts = opts || {};
    k = Math.max(0, Math.min(FILM.length - 1, k));
    var s = FILM[k], changed = k !== i;
    i = k;
    chunk = opts.chunk != null ? Math.max(0, Math.min(s.chunks.length - 1, opts.chunk)) : 0;
    clock = 0; chunkClock = 0; extra = 0; pending = false;
    VOICE.stop();

    var el = sceneEl(s);
    if (el) { scrollTo_px(targetFor(el), changed ? 1650 : 300); setLive(k); }
    if (changed) { flash(); SFX.play('projectorClick'); }

    /* per-scene soundscape */
    SFX.stopAll();
    (s.sfx || []).forEach(function (cue, n) {
      var wait = n * 900;
      if (wait) setTimeout(function () { if (active && i === k) SFX.play(cue, s.dur); }, wait);
      else SFX.play(cue, s.dur);
    });
    if (VOICE.available && !s.silent) SFX.bedFor(s.mood);
    else SFX.stopBed();

    paintRail();
    if (s.chunks && s.chunks.length) {
      showChunk(s.chunks[chunk].text);
      lightUp(-1);
      if (playing) speakChunk();
    } else if (subsText) {
      subsText.innerHTML = '';
    }
  }
  /* Speaks the current sentence. Narration drives the voice; the clock below
     drives pacing, so a missing/slow TTS engine can never stall the film. */
  function speakChunk() {
    var s = FILM[i];
    if (!s || !s.chunks || !s.chunks.length) return;
    if (chunk >= s.chunks.length) { finish(); return; }
    if (s.silent || !VOICE.available || !playing) { wordMode = 'clock'; return; }
    var c = s.chunks[chunk];
    wordMode = 'engine';
    VOICE.speak(c.text, function (ev) {
      if (!ev || ev.name && ev.name !== 'word' && ev.charIndex === undefined) return;
      if (chunk >= s.chunks.length) return;
      var upto = 0, acc = 0, at = ev.charIndex || 0;
      var words = s.chunks[chunk].words;
      for (var k = 0; k < words.length; k++) {
        if (acc <= at) { upto = k; acc += words[k].length + 1; } else break;
      }
      lightUp(upto);
    }, null);
  }
  function nextChunk() {
    var s = FILM[i];
    if (!s || !s.chunks || !s.chunks.length) { finish(); return; }
    VOICE.stop();
    chunk++; chunkClock = 0; extra = 0; wordMode = 'clock'; lastWord = -1;
    if (chunk >= s.chunks.length) { finish(); return; }
    showChunk(s.chunks[chunk].text);
    lightUp(-1);
    paintRail();
    if (playing) speakChunk();
  }
  function finish() {
    if (pending) return;
    pending = true;
    paintRail();
    if (!playing) return;
    if (state.reduced) { pending = false; return; }   /* stepped manual advance */
    setTimeout(function () {
      pending = false;
      if (i >= FILM.length - 1) { stop(); toast('انتهى الفيلم — شكرًا لمشاهدتك'); return; }
      go(i + 1);
    }, 900);
  }

  function flash() {
    if (state.reduced) return;
    var f = $('#flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  /* --- main loop ------------------------------------------------------ */
  /* Clock-authoritative pacing. Each sentence has an estimated duration; when
     it elapses we advance, but if the speech engine is still talking we grant
     up to 1.5x extra so a slow voice is never cut off, then move on. */
  function tick(now) {
    if (!active) return;
    var dt = Math.min(0.25, (now - last) / 1000 || 0);
    last = now;
    var s = FILM[i];
    if (s && playing) {
      if (s.chunks && s.chunks.length) {
        var c = s.chunks[chunk];
        if (c) {
          chunkClock += dt;
          /* word timing: prefer real boundary events, but if the speech engine
             never reports one, fall back to estimating from the clock */
          if (wordMode === 'engine' && chunkClock > Math.max(0.9, c.dur * 0.3)) wordMode = 'clock';
          if (wordMode === 'clock') {
            var nw = c.words.length;
            var upto = nw ? Math.min(nw - 1, Math.floor((chunkClock / c.dur) * nw)) : -1;
            if (upto !== lastWord) lightUp(upto);
          }
          if (chunkClock >= c.dur + extra) {
            var talking = !s.silent && VOICE.available && window.speechSynthesis &&
              window.speechSynthesis.speaking && window.speechSynthesis.pending;
            if (talking && extra < c.dur * 1.5) extra += c.dur * 0.5;
            else nextChunk();
          }
        }
      } else {
        clock += dt;
        if (clock >= s.dur) { clock = s.dur; finish(); }
      }
      paintFill();
    }
    raf.anim = requestAnimationFrame(tick);
  }

  /* --- transport ------------------------------------------------------ */
  function play() {
    if (!active) start();
    if (i < 0) go(0);
    playing = true;
    var s = FILM[i];
    if (s && s.chunks && s.chunks.length && chunk < s.chunks.length) {
      speakChunk();
    }
    syncPlayBtn();
  }
  function pause() {
    playing = false;
    VOICE.pause();
    syncPlayBtn();
  }
  function syncPlayBtn() {
    var b = $('#cPlay');
    b.textContent = playing ? '❚❚' : '▶';
    b.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل');
  }
  function next() { if (i < FILM.length - 1) go(i + 1); else { finish(); } }
  function prev() { go(Math.max(0, i - 1)); }

  function start() {
    SFX.boot();
    setScrim(true);
    document.body.classList.add('filmdust-on');
    letterbox();
    active = true; last = performance.now();
    if (!sceneEls.length) sceneEls = $$('.scene');
    buildRail();
    paintRail();
    cancelAnimationFrame(raf.anim);
    raf.anim = requestAnimationFrame(tick);
    playing = true;
    go(0);
    syncPlayBtn();
    $('#railSilent').hidden = !VOICE.silent;
  }
  function stop() {
    active = false; playing = false;
    cancelAnimationFrame(raf.anim);
    VOICE.stop();
    SFX.stopAll();
    document.body.classList.remove('film', 'filmdust-on');
    setLive(-1);
    var rs = $('#railSilent'); if (rs) rs.hidden = true;
  }

  /* --- rail ----------------------------------------------------------- */
  var railCells = [];
  function buildRail() {
    var rail = $('#rail');
    rail.innerHTML = '';
    railCells = FILM.map(function (s, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'rail__cell' + (s.silent ? ' is-mem' : '');
      b.setAttribute('aria-label', 'الفصل ' + s.num + ' — ' + s.title);
      b.title = s.num + ' · ' + s.title + ' · ' + s.tc;
      b.innerHTML = '<span class="rail__fill"></span><span class="rail__n">' + s.num + '</span>';
      b.addEventListener('click', function () { go(k); if (!playing) { playing = true; syncPlayBtn(); } });
      rail.appendChild(b);
      return b;
    });
  }
  /* draggable / clickable seek on the rail */
  function railSeek(clientX) {
    var rail = $('#rail'), r = rail.getBoundingClientRect();
    /* the rail is RTL, so the right edge is the start of the film and the
       left edge is the end: frac 0 at right -> 1 at left */
    var frac = (clientX - r.left) / r.width;
    frac = Math.max(0, Math.min(1, frac));
    var t = frac * total(), acc = 0, k = 0;
    for (; k < FILM.length; k++) { if (t < acc + FILM[k].dur) break; acc += FILM[k].dur; }
    k = Math.min(FILM.length - 1, k);
    var local = (t - acc) / FILM[k].dur;
    var s = FILM[k];
    var c = s.chunks && s.chunks.length ? Math.floor(local * s.chunks.length) : 0;
    go(k, { chunk: c });
  }
  function bindRailDrag() {
    var rail = $('#rail'), dragging = false;
    function down(e) { if (!active) return; dragging = true; railSeek(e.clientX); e.preventDefault(); }
    rail.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', function (e) { if (dragging) railSeek(e.clientX); });
    window.addEventListener('pointerup', function () { dragging = false; });
    rail.addEventListener('keydown', function (e) {
      if (!active) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
  }

  /* --- keyboard ------------------------------------------------------- */
  function keys(e) {
    if (!active) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    switch (e.key) {
      case ' ': case 'Spacebar': e.preventDefault(); playing ? pause() : play(); break;
      case 'ArrowRight': e.preventDefault(); next(); break;
      case 'ArrowLeft': e.preventDefault(); prev(); break;
      case 'Escape': e.preventDefault(); stop(); toast('خرجت من وضع الفيلم'); break;
      case 'm': case 'M': e.preventDefault(); toggleMute(); break;
    }
  }
  function toggleMute() {
    SFX.setMute(!state.muted);
    var b = $('#cMute');
    b.textContent = state.muted ? '🔇' : '🔊';
    b.classList.toggle('is-off', state.muted);
    b.setAttribute('aria-label', state.muted ? 'إلغاء الكتم' : 'كتم الصوت');
    var ck = $('#muteChk'); if (ck) ck.checked = state.muted;
  }

  return {
    start: start, stop: stop, play: play, pause: pause,
    next: next, prev: prev, toggleMute: toggleMute,
    buildRail: buildRail, bindRailDrag: bindRailDrag, keys: keys, letterbox: letterbox, go: go,
    get active() { return active; },
    get playing() { return playing; },
    setScene: function (k) { if (active) go(k); }
  };
})();

/* ==========================================================================
   SCROLL PLUMBING: reveal, progress, live scene, timeline highlight
   ========================================================================== */
function initReveal() {
  var els = $$('.rv');
  if (!('IntersectionObserver' in window) || state.reduced) {
    els.forEach(function (e) { e.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  els.forEach(function (e) { io.observe(e); });
}

function initCountUp() {
  var stats = $$('[data-count]');
  if (!stats.length) return;
  function run(el) {
    var target = +el.getAttribute('data-count');
    var dur = 1500, t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = arSep(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!('IntersectionObserver' in window)) { stats.forEach(run); return; }
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { run(x.target); io.unobserve(x.target); } });
  }, { threshold: 0.4 });
  stats.forEach(function (e) { io.observe(e); });
}

function initScroll() {
  var bar = $('#scrollBar');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.pageYOffset / h) * 100 : 0) + '%';
      var mid = window.pageYOffset + window.innerHeight * 0.35, best = -1, bestD = Infinity;
      $$('.scene').forEach(function (el) {
        var d = Math.abs(el.offsetTop - mid);
        if (d < bestD) { bestD = d; best = +el.dataset.idx; }
      });
      if (best >= 0 && best !== initScroll.cur) {
        initScroll.cur = best;
        $$('.scene').forEach(function (el) { el.classList.toggle('is-live', +el.dataset.idx === best); });
        var id = el0(best);
        $$('.tl').forEach(function (t) { t.classList.toggle('is-active', t.dataset.tl === id); });
        $$('.navlinks a').forEach(function (a) { a.classList.toggle('is-active', a.dataset.nav === id); });
        /* In Film Mode the engine is the director: it drives scrolling and
           scene changes. Letting the scroll position also call setScene()
           makes scenes fire out of order mid-transition, so skip it here. */
        if (FILM_.active) { initScroll.cur = best; return; }
      }
    });
  }
  function el0(k) { var e = $$('.scene')[k]; return e ? e.dataset.scene : null; }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   MAP SLIDER
   ========================================================================== */
function initMap() {
  var box = $('#mapcmp'), grip = $('#mapGrip');
  if (!box || !grip) return;
  var split = 50, dragging = false;
  function set(v, announce) {
    split = Math.max(0, Math.min(100, v));
    box.style.setProperty('--split', split + '%');
    grip.setAttribute('aria-valuenow', Math.round(split));
    grip.setAttribute('aria-valuetext', split > 50 ? '٦ أكتوبر ١٩٧٣ — خط بارليف' : (split > 12 ? 'الجبهة بين ٦ و٢٤ أكتوبر' : '٢٤ أكتوبر ١٩٧٣'));
  }
  /* --split is the width of the ٦ أكتوبر layer measured from the right, so
     the right edge is 100% and the left edge is 0%. */
  function fromX(x) {
    var r = box.getBoundingClientRect();
    set(((x - r.left) / r.width) * 100);
  }
  box.addEventListener('pointerdown', function (e) { dragging = true; box.setPointerCapture(e.pointerId); fromX(e.clientX); });
  box.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
  box.addEventListener('pointerup', function () { dragging = false; });
  box.addEventListener('pointercancel', function () { dragging = false; });
  grip.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 10 : 3, used = true;
    if (e.key === 'ArrowRight') set(split + step);
    else if (e.key === 'ArrowLeft') set(split - step);
    else if (e.key === 'Home') set(100);
    else if (e.key === 'End') set(0);
    else used = false;
    if (used) e.preventDefault();
  });
  set(50);
}

/* ==========================================================================
   TOAST
   ========================================================================== */
var toastTimer = 0;
function toast(msg) {
  var t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 4200);
}

/* ==========================================================================
   TYPEWRITER TAGLINE
   ========================================================================== */
function initTypewriter() {
  var el = $('#tagline');
  var full = el.getAttribute('data-full') || '';
  if (state.reduced) { el.textContent = full; return; }
  var i = 0;
  setTimeout(function () {
    var t = setInterval(function () {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) clearInterval(t);
    }, 78);
  }, 900);
}

/* ==========================================================================
   BOOT
   ========================================================================== */
function init() {
  if (state.reduced) document.body.classList.add('nomotion');

  renderReel();
  renderTimeline();
  renderNav();
  renderCredits();
  renderPledge();
  hydrateSlots();

  /* index scenes so the scroll handler can map position -> scene */
  $$('.scene').forEach(function (el, k) { el.dataset.idx = k; });

  initReveal();
  initCountUp();
  initScroll();
  initMap();
  initTypewriter();

  /* ---------- nav + film entry points ---------- */
  $('#playFilm').addEventListener('click', function () { FILM_.start(); });
  $('#navFilm').addEventListener('click', function () {
    if (FILM_.active) { FILM_.play(); return; }
    window.scrollTo({ top: 0, behavior: state.reduced ? 'auto' : 'smooth' });
    setTimeout(function () { FILM_.start(); }, state.reduced ? 0 : 420);
  });
  $('#browseFree').addEventListener('click', function () {
    $('#reel').scrollIntoView({ behavior: state.reduced ? 'auto' : 'smooth' });
  });
  $('#brand').addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- film chrome ---------- */
  $('#cPlay').addEventListener('click', function () { FILM_.playing ? FILM_.pause() : FILM_.play(); });
  $('#cPrev').addEventListener('click', function () { FILM_.prev(); });
  $('#cNext').addEventListener('click', function () { FILM_.next(); });
  $('#cMute').addEventListener('click', function () { FILM_.toggleMute(); });
  $('#cExit').addEventListener('click', function () { FILM_.stop(); toast('خرجت من وضع الفيلم'); });
  FILM_.buildRail();
  FILM_.bindRailDrag();
  document.addEventListener('keydown', FILM_.keys);
  window.addEventListener('resize', FILM_.letterbox);

  /* clicking a rail chip / timeline chip outside film mode starts that scene */
  $('#timelineTrack').addEventListener('click', function (e) {
    var a = e.target.closest('.tl');
    if (a) setTimeout(function () {
      if (!FILM_.active) { var id = a.dataset.tl; var k = SCENES.findIndex(function (s) { return s.id === id; }); if (k >= 0) initScroll.cur = -1; }
    }, 0);
  });

  /* ---------- settings ---------- */
  var st = $('#settings'), sb = $('#settingsBtn');
  sb.addEventListener('click', function () {
    st.classList.toggle('is-open');
    sb.setAttribute('aria-expanded', st.classList.contains('is-open'));
  });
  document.addEventListener('click', function (e) {
    if (!st.contains(e.target) && e.target !== sb && !sb.contains(e.target)) st.classList.remove('is-open');
  });
  $('#voiceSel').addEventListener('change', function (e) { VOICE.setIndex(+e.target.value); toast('تم تغيير صوت التعليق'); });
  $('#volSel').addEventListener('input', function (e) { SFX.setVolume(+e.target.value / 100); });
  $('#muteChk').addEventListener('change', function (e) { FILM_.toggleMute(); e.target.checked = state.muted; });
  $('#motionChk').addEventListener('change', function (e) {
    state.reduced = e.target.checked;
    document.body.classList.toggle('nomotion', state.reduced);
    toast(state.reduced ? 'تم تفعيل تقليل الحركة — التقدّم يدويًا الآن' : 'عاد الحركة الكاملة');
  });
  $('#motionChk').checked = state.reduced;

  /* voice availability notice once film mode is on */
  VOICE._onpick = function () { $('#railSilent').hidden = !VOICE.silent; };

  /* reduced-motion media query changes */
  if (REDUCED_MQ.addEventListener) {
    REDUCED_MQ.addEventListener('change', function (e) {
      state.reduced = e.matches;
      document.body.classList.toggle('nomotion', state.reduced);
      $('#motionChk').checked = state.reduced;
    });
  }

  /* unlock audio on the very first gesture anywhere */
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function once() {
      SFX.boot();
      window.removeEventListener(ev, once);
    }, { once: true, passive: true });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* expose for debugging / verification */
window.__film = { SCENES: SCENES, FILM: FILM, FILM_: FILM_, VOICE: VOICE, SFX: SFX, state: state };

})();
