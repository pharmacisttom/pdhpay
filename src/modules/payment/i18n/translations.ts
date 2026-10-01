export type SupportedLocale = "th" | "zh-CN" | "my" | "km";

export interface TranslationDict {
  localeName: string;
  nativeName: string;
  hospitalName: string;
  departmentName: string;
  steps: {
    language: string;
    review: string;
    pay: string;
    upload: string;
    confirm: string;
    result: string;
  };
  headers: {
    selectLanguage: string;
    paymentPoint: string;
    billingDetails: string;
    makePayment: string;
    attachSlip: string;
    confirmSubmission: string;
    submissionSuccess: string;
    trackingTitle: string;
  };
  patientInfo: {
    title: string;
    hnLabel: string;
    hnPlaceholder: string;
    vnAnLabel: string;
    patientNameLabel: string;
    patientNamePlaceholder: string;
    payerNameLabel: string;
    payerNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    declaredAmountLabel: string;
    billedAmountLabel: string;
    declaredAmountHelp: string;
    billedAmountHelp: string;
    currency: string;
    sourceBankLabel: string;
    sourceBankPlaceholder: string;
    transferDateTimeLabel: string;
    noteLabel: string;
    notePlaceholder: string;
  };
  bankDetails: {
    receivingAccountTitle: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    promptPayQr: string;
    promptPayHelp: string;
    pointQrVsPaymentQrNotice: string;
    saveQrButton: string;
    saveQrInstructions: string;
  };
  receipt: {
    title: string;
    receiptNoLabel: string;
    dateLabel: string;
    cashierLabel: string;
    paymentMethodLabel: string;
    paymentMethodValue: string;
  };
  slipUpload: {
    title: string;
    instructions: string;
    takePhoto: string;
    chooseGallery: string;
    changeImage: string;
    removeImage: string;
    previewTitle: string;
    supportedFormats: string;
    heicWarning: string;
    refreshWarning: string;
    unsupportedFileError: string;
  };
  actions: {
    next: string;
    back: string;
    edit: string;
    confirmSubmit: string;
    submitting: string;
    checkStatus: string;
    copyTrackingLink: string;
    linkCopied: string;
    resubmit: string;
    retryUpload: string;
  };
  status: {
    submitted: string;
    pendingVerify: string;
    verified: string;
    receipted: string;
    amountMismatch: string;
    possibleDuplicate: string;
    invalidSlip: string;
    rejected: string;
    cancelled: string;
    receivedMessage: string;
    receiptDisclaimer: string;
    resubmitReasonHeader: string;
    trackingCodeLabel: string;
    notFound: string;
    notFoundHelp: string;
    expiredPoint: string;
  };
  reasons: {
    AMOUNT_MISMATCH: string;
    WRONG_RECEIVER: string;
    UNREADABLE_IMAGE: string;
    DUPLICATE_TRANSACTION: string;
    VERIFICATION_FAILED: string;
  };
  validation: {
    requiredHN: string;
    requiredPatientName: string;
    requiredAmount: string;
    invalidAmount: string;
    requiredBank: string;
    requiredTransferTime: string;
    requiredSlip: string;
    fileTooLarge: string;
    futureTime: string;
  };
}

export const translations: Record<SupportedLocale, TranslationDict> = {
  th: {
    localeName: "Thai",
    nativeName: "ไทย",
    hospitalName: "โรงพยาบาลปลวกแดง",
    departmentName: "ฝ่ายการเงิน โรงพยาบาลปลวกแดง",
    steps: {
      language: "1. ภาษา",
      review: "2. ตรวจสอบรายการ",
      pay: "3. ชำระเงิน",
      upload: "4. แนบสลิป",
      confirm: "5. ยืนยันข้อมูล",
      result: "6. ผลการส่ง",
    },
    headers: {
      selectLanguage: "เลือกภาษา / Select Language",
      paymentPoint: "จุดรับชำระเงิน",
      billingDetails: "รายละเอียดรายการชำระเงิน",
      makePayment: "ชำระเงินผ่าน QR / บัญชีธนาคาร",
      attachSlip: "แนบหลักฐานการโอนเงิน (สลิป)",
      confirmSubmission: "ตรวจสอบข้อมูลก่อนส่งหลักฐาน",
      submissionSuccess: "ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว",
      trackingTitle: "ติดตามสถานะการชำระเงิน",
    },
    patientInfo: {
      title: "ข้อมูลผู้รับบริการและการชำระเงิน",
      hnLabel: "เลขประจำตัวผู้ป่วย (HN)",
      hnPlaceholder: "ระบุ HN เช่น 67xxxx",
      vnAnLabel: "เลข VN / AN (ถ้ามี)",
      patientNameLabel: "ชื่อ–นามสกุล ผู้ป่วย",
      patientNamePlaceholder: "ชื่อ-นามสกุล ผู้ป่วยตามบัตรโรงพยาบาล",
      payerNameLabel: "ชื่อผู้โอนเงิน",
      payerNamePlaceholder: "ชื่อผู้โอนเงินตามสลิป",
      phoneLabel: "เบอร์โทรศัพท์ติดต่อ",
      phonePlaceholder: "08x-xxx-xxxx",
      declaredAmountLabel: "ยอดเงินที่ผู้ชำระแจ้ง (บาท)",
      billedAmountLabel: "ยอดเงินเรียกเก็บตามระบบ (บาท)",
      declaredAmountHelp: "*กรอกยอดเงินจริงตามสลิปโอนเงิน (เจ้าหน้าที่จะตรวจสอบกับรายการเรียกเก็บอีกครั้ง)",
      billedAmountHelp: "*ยอดเงินได้รับการยืนยันจากระบบโรงพยาบาลแล้ว",
      currency: "บาท (THB)",
      sourceBankLabel: "ธนาคารต้นทางที่โอน",
      sourceBankPlaceholder: "เลือกหรือพิมพ์ชื่อธนาคาร เช่น กสิกรไทย, ไทยพาณิชย์",
      transferDateTimeLabel: "วันและเวลาโอนเงิน",
      noteLabel: "หมายเหตุเพิ่มเติม (ถ้ามี)",
      notePlaceholder: "ข้อมูลเพิ่มเติมถึงเจ้าหน้าที่การเงิน",
    },
    bankDetails: {
      receivingAccountTitle: "บัญชีรับเงิน โรงพยาบาลปลวกแดง",
      bankName: "ธนาคารผู้รับ",
      accountNumber: "เลขที่บัญชี",
      accountName: "ชื่อบัญชี",
      promptPayQr: "QR Code สแกนโอนเงิน (PromptPay)",
      promptPayHelp: "สแกน QR Code นี้เพื่อโอนเงินผ่านแอปพลิเคชันธนาคาร",
      pointQrVsPaymentQrNotice: "⚠️ QR Code นี้สำหรับโอนเงินเข้าบัญชีโรงพยาบาล (คนละ QR Code กับที่สแกนเปิดหน้าจุดบริการนี้)",
      saveQrButton: "บันทึกรูป QR Code ชำระเงิน",
      saveQrInstructions: "หากไม่สามารถบันทึกได้โดยตรง ให้กดค้างที่รูป QR Code แล้วเลือก 'บันทึกรูปภาพ'",
    },
    receipt: {
      title: "ใบเสร็จรับเงิน",
      receiptNoLabel: "เลขที่ใบเสร็จ",
      dateLabel: "วันที่",
      cashierLabel: "ผู้รับเงิน",
      paymentMethodLabel: "ช่องทางการชำระเงิน",
      paymentMethodValue: "รับชำระผ่าน QR Code (PromptPay)",
    },
    slipUpload: {
      title: "แนบรูปถ่ายหรือไฟล์สลิปโอนเงิน",
      instructions: "กรุณาแนบภาพสลิปที่เห็น ยอดเงิน, ชื่อบัญชีผู้รับ, วันที่-เวลาโอน และเลขอ้างอิง ชัดเจน",
      takePhoto: "ถ่ายภาพสลิปด้วยกล้อง",
      chooseGallery: "เลือกรูปจากคลังภาพ",
      changeImage: "เปลี่ยนรูปสลิป",
      removeImage: "ลบรูปสลิป",
      previewTitle: "ตัวอย่างสลิปที่เลือก",
      supportedFormats: "รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 10 MB",
      heicWarning: "หากใช้รูปไฟล์ HEIC (จาก iPhone) กรุณาแปลงเป็น JPG/PNG หรือเลือกไฟล์รูปภาพอื่น",
      refreshWarning: "หากรีเฟรชหรือโหลดหน้าจอใหม่ กรุณาเลือกไฟล์สลิปใหม่อีกครั้ง",
      unsupportedFileError: "รูปแบบไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ WEBP",
    },
    actions: {
      next: "ถัดไป",
      back: "ย้อนกลับ",
      edit: "แก้ไขข้อมูล",
      confirmSubmit: "ยืนยันส่งหลักฐานการชำระเงิน",
      submitting: "กำลังส่งหลักฐาน กรุณารอสักครู่...",
      checkStatus: "ตรวจสถานะการชำระเงิน",
      copyTrackingLink: "คัดลอกลิงก์ติดตามสถานะ",
      linkCopied: "คัดลอกลิงก์แล้ว",
      resubmit: "ส่งหลักฐานใหม่อีกครั้ง",
      retryUpload: "ลองส่งใหม่อีกครั้ง",
    },
    status: {
      submitted: "ส่งหลักฐานแล้ว (รอตรวจสอบ)",
      pendingVerify: "อยู่ระหว่างตรวจสอบยอด",
      verified: "ยืนยันรับเงินเรียบร้อยแล้ว",
      receipted: "ออกใบรับ/ใบเสร็จเรียบร้อยแล้ว",
      amountMismatch: "ยอดเงินไม่ตรงกับรายการเรียกเก็บ",
      possibleDuplicate: "พบรายการสลิปซ้ำ (รอเจ้าหน้าที่ตรวจสอบ)",
      invalidSlip: "หลักฐานไม่ชัดเจน / ขอหลักฐานใหม่",
      rejected: "ปฏิเสธการรับเงิน",
      cancelled: "ยกเลิกรายการชำระ",
      receivedMessage: "ระบบได้รับหลักฐานการชำระเงินของท่านเรียบร้อยแล้ว",
      receiptDisclaimer: "⚠️ หมายเหตุ: การแนบสลิปนี้เป็นการแจ้งส่งหลักฐานเท่านั้น ยังไม่ใช่ใบเสร็จรับเงินทางการ จนกว่าเจ้าหน้าที่การเงินจะตรวจสอบและยืนยันยอดเรียบร้อย",
      resubmitReasonHeader: "เหตุผลที่เจ้าหน้าที่ขอให้ส่งหลักฐานใหม่:",
      trackingCodeLabel: "รหัสติดตามสถานะ (Tracking Reference):",
      notFound: "ไม่พบรายการชำระเงิน",
      notFoundHelp: "กรุณาตรวจสอบลิงก์ หรือติดต่อเจ้าหน้าที่การเงินประจำจุดรับชำระ",
      expiredPoint: "จุดรับชำระเงินปิดทำการหรือไม่อยู่ในเวลาให้บริการ",
    },
    reasons: {
      AMOUNT_MISMATCH: "ยอดเงินในสลิปไม่ตรงกับยอดที่แจ้ง",
      WRONG_RECEIVER: "ชื่อบัญชีผู้รับเงินไม่ถูกต้อง",
      UNREADABLE_IMAGE: "ภาพสลิปไม่ชัดเจน ไม่เห็นยอดเงิน วันที่ หรือเลขอ้างอิง",
      DUPLICATE_TRANSACTION: "พบรายการโอนเงินซ้ำในระบบ",
      VERIFICATION_FAILED: "ไม่สามารถตรวจสอบรายการโอนเงินกับธนาคารได้",
    },
    validation: {
      requiredHN: "กรุณาระบุเลขประจำตัวผู้ป่วย (HN)",
      requiredPatientName: "กรุณาระบุชื่อ-นามสกุล ผู้ป่วย",
      requiredAmount: "กรุณาระบุยอดเงินที่โอน",
      invalidAmount: "ยอดเงินต้องมากกว่า 0 บาท",
      requiredBank: "กรุณาระบุธนาคารที่โอน",
      requiredTransferTime: "กรุณาระบุวันและเวลาโอนเงิน",
      requiredSlip: "กรุณาแนบไฟล์สลิปการโอนเงิน",
      fileTooLarge: "ขนาดไฟล์สลิปใหญ่เกิน 10 MB",
      futureTime: "เวลาโอนเงินไม่สามารถเป็นเวลาในอนาคตได้",
    },
  },

  "zh-CN": {
    localeName: "Chinese (Simplified)",
    nativeName: "中文(简体)",
    hospitalName: "普罗登医院",
    departmentName: "普罗登医院 财务部",
    steps: {
      language: "1. 语言",
      review: "2. 账单明细",
      pay: "3. 付款",
      upload: "4. 上传凭证",
      confirm: "5. 确认信息",
      result: "6. 提交结果",
    },
    headers: {
      selectLanguage: "选择语言 / Select Language",
      paymentPoint: "付款窗口",
      billingDetails: "付款明细信息",
      makePayment: "通过 QR 码 / 银行账户付款",
      attachSlip: "上传转账凭证 (Slip)",
      confirmSubmission: "提交前核对信息",
      submissionSuccess: "凭证已成功提交",
      trackingTitle: "查询付款状态",
    },
    patientInfo: {
      title: "患者与付款信息",
      hnLabel: "患者医院编号 (HN)",
      hnPlaceholder: "请输入 HN，例如 67xxxx",
      vnAnLabel: "VN / AN 编号 (如有)",
      patientNameLabel: "患者姓名",
      patientNamePlaceholder: "请输入患者完整姓名",
      payerNameLabel: "汇款人姓名",
      payerNamePlaceholder: "凭证上的汇款人姓名",
      phoneLabel: "联系电话",
      phonePlaceholder: "08x-xxx-xxxx",
      declaredAmountLabel: "付款人声明金额 (泰铢)",
      billedAmountLabel: "系统账单应付金额 (泰铢)",
      declaredAmountHelp: "*请输入转账凭证上的实际金额（财务人员将核对账单）",
      billedAmountHelp: "*此金额已由医院系统核实确认",
      currency: "泰铢 (THB)",
      sourceBankLabel: "转出银行",
      sourceBankPlaceholder: "请选择或输入银行名称",
      transferDateTimeLabel: "转账日期与时间",
      noteLabel: "备注说明 (选填)",
      notePlaceholder: "向财务人员说明的附加信息",
    },
    bankDetails: {
      receivingAccountTitle: "普罗登医院 收款账户",
      bankName: "收款银行",
      accountNumber: "银行账号",
      accountName: "账户名称",
      promptPayQr: "扫码付款二维码 (PromptPay QR)",
      promptPayHelp: "请使用银行 App 扫描此 QR 码完成转账",
      pointQrVsPaymentQrNotice: "⚠️ 此 QR 码用于转账至医院账户（与您扫码打开本窗口页面的 QR 码不同）。",
      saveQrButton: "保存付款二维码图片",
      saveQrInstructions: "如无法直接保存，请长按二维码图片并选择“保存图片”",
    },
    receipt: {
      title: "收款收据",
      receiptNoLabel: "收据编号",
      dateLabel: "日期",
      cashierLabel: "收款人",
      paymentMethodLabel: "付款方式",
      paymentMethodValue: "通过 QR 码 (PromptPay) 付款",
    },
    slipUpload: {
      title: "上传转账凭证图片或文件",
      instructions: "请上传清晰显示金额、收款人、转账时间和交易单号的凭证图片",
      takePhoto: "拍照上传",
      chooseGallery: "从相册选择",
      changeImage: "更换图片",
      removeImage: "删除图片",
      previewTitle: "已选凭证预览",
      supportedFormats: "支持 JPG、PNG、WEBP 格式，大小不超过 10 MB",
      heicWarning: "如使用 iPhone HEIC 格式图片，请转换为 JPG/PNG 后上传",
      refreshWarning: "若刷新页面，请重新选择转账凭证文件",
      unsupportedFileError: "不支持的文件格式，请选择 JPG、PNG 或 WEBP 图片",
    },
    actions: {
      next: "下一步",
      back: "返回",
      edit: "修改信息",
      confirmSubmit: "确认提交转账凭证",
      submitting: "正在提交，请稍候...",
      checkStatus: "查询付款状态",
      copyTrackingLink: "复制状态追踪链接",
      linkCopied: "链接已复制",
      resubmit: "重新提交凭证",
      retryUpload: "重试提交",
    },
    status: {
      submitted: "已提交凭证 (等待审核)",
      pendingVerify: "财务核对中",
      verified: "已确认收款",
      receipted: "已开具收据",
      amountMismatch: "金额与账单不符",
      possibleDuplicate: "发现重复凭证 (待人工核查)",
      invalidSlip: "凭证模糊 / 需重新提交",
      rejected: "付款已被拒绝",
      cancelled: "交易已取消",
      receivedMessage: "系统已收到您的转账凭证",
      receiptDisclaimer: "⚠️ 注意：上传凭证仅表示提交通知，在财务人员核实前不作为正式收据使用。",
      resubmitReasonHeader: "财务人员要求重新提交的原因：",
      trackingCodeLabel: "跟踪编号 (Tracking Reference)：",
      notFound: "未找到相关付款记录",
      notFoundHelp: "请检查链接或联系现场财务工作人员",
      expiredPoint: "付款窗口已暂停或非营业时间",
    },
    reasons: {
      AMOUNT_MISMATCH: "凭证金额与声明金额不一致",
      WRONG_RECEIVER: "收款账户名称不正确",
      UNREADABLE_IMAGE: "凭证图片模糊，无法识别金额或单号",
      DUPLICATE_TRANSACTION: "系统中已存在相同交易单号",
      VERIFICATION_FAILED: "无法向银行验证此笔转账",
    },
    validation: {
      requiredHN: "请输入患者医院编号 (HN)",
      requiredPatientName: "请输入患者姓名",
      requiredAmount: "请输入转账金额",
      invalidAmount: "转账金额必须大于 0",
      requiredBank: "请选择转出银行",
      requiredTransferTime: "请输入转账时间",
      requiredSlip: "请上传转账凭证图片",
      fileTooLarge: "凭证文件不能超过 10 MB",
      futureTime: "转账时间不能晚于当前时间",
    },
  },

  my: {
    localeName: "Burmese",
    nativeName: "မြန်မာ",
    hospitalName: "ပလွက်ဒဲင် ဆေးရုံ",
    departmentName: "ပလွက်ဒဲင် ဆေးရုံ ဘဏ္ဍာရေးဌာန",
    steps: {
      language: "၁. ဘာသာစကား",
      review: "၂. အသေးစိတ်",
      pay: "၃. ငွေပေးချေရန်",
      upload: "၄. ပြေစာ တင်ရန်",
      confirm: "၅. အတည်ပြုရန်",
      result: "၆. ရလဒ်",
    },
    headers: {
      selectLanguage: "เลือกภาษา / Select Language",
      paymentPoint: "ငွေလက်ခံသည့် နေရာ",
      billingDetails: "ငွေပေးချေမှု အသေးစိတ်",
      makePayment: "QR / ဘဏ်အကောင့်ဖြင့် ငွေလွှဲရန်",
      attachSlip: "ငွေလွှဲပြေစာ (Slip) တင်ပါ",
      confirmSubmission: "မတင်မီ အချက်အလက် စစ်ဆေးပါ",
      submissionSuccess: "ပြေစာ တင်သွင်းပြီးပါပြီ",
      trackingTitle: "ငွေပေးချေမှု အခြေအနေ စစ်ဆေးရန်",
    },
    patientInfo: {
      title: "လူနာနှင့် ငွေပေးချေမှု အချက်အလက်",
      hnLabel: "လူနာနံပါတ် (HN)",
      hnPlaceholder: "HN နံပါတ် ထည့်ပါ (ဥပမာ 67xxxx)",
      vnAnLabel: "VN / AN နံပါတ် (ရှိပါက)",
      patientNameLabel: "လူနာအမည်",
      patientNamePlaceholder: "လူနာ၏ အမည်အပြည့်အစုံ",
      payerNameLabel: "ငွေလွှဲသူအမည်",
      payerNamePlaceholder: "ပြေစာပေါ်ရှိ ငွေလွှဲသူအမည်",
      phoneLabel: "ဖုန်းနံပါတ်",
      phonePlaceholder: "08x-xxx-xxxx",
      declaredAmountLabel: "လွှဲပြောင်းသည့် ပမာဏ (ဘတ်)",
      billedAmountLabel: "ကျသင့်ငွေ ပမာဏ (ဘတ်)",
      declaredAmountHelp: "*ပြေစာပေါ်ရှိ အမှန်တကယ် လွှဲပြောင်းငွေကို ထည့်ပါ",
      billedAmountHelp: "*ဆေးရုံစနစ်မှ အတည်ပြုထားသော ပမာဏဖြစ်သည်",
      currency: "ဘတ် (THB)",
      sourceBankLabel: "ငွေလွှဲသည့် ဘဏ်",
      sourceBankPlaceholder: "ဘဏ်အမည် ရွေးချယ်ပါ သို့မဟုတ် ရိုက်ထည့်ပါ",
      transferDateTimeLabel: "ငွေလွှဲသည့် ရက်စွဲနှင့် အချိန်",
      noteLabel: "မှတ်ချက် (ရှိပါက)",
      notePlaceholder: "ဘဏ္ဍာရေး ဝန်ထမ်းထံ အကြောင်းကြားစာ",
    },
    bankDetails: {
      receivingAccountTitle: "ပလွက်ဒဲင် ဆေးရုံ လက်ခံအကောင့်",
      bankName: "လက်ခံသည့် ဘဏ်",
      accountNumber: "အကောင့်နံပါတ်",
      accountName: "အကောင့်အမည်",
      promptPayQr: "ငွေလွှဲရန် QR Code (PromptPay)",
      promptPayHelp: "ဘဏ် App ဖြင့် ဤ QR Code ကို စကန်ဖတ်၍ ငွေလွှဲပါ",
      pointQrVsPaymentQrNotice: "⚠️ ဤ QR Code သည် ဆေးရုံသို့ ငွေလွှဲရန်ဖြစ်သည် (ဤစာမျက်နှာကို ဖွင့်သည့် QR Code နှင့် သီးခြားစီဖြစ်သည်)။",
      saveQrButton: "QR Code ပုံ သိမ်းဆည်းပါ",
      saveQrInstructions: "တိုက်ရိုက်မသိမ်းနိုင်ပါက QR ပုံကို နှိပ်ထားပြီး 'Save Image' ကို ရွေးပါ",
    },
    receipt: {
      title: "ငွေလက်ခံပြေစာ",
      receiptNoLabel: "ပြေစာနံပါတ်",
      dateLabel: "ရက်စွဲ",
      cashierLabel: "ငွေလက်ခံသူ",
      paymentMethodLabel: "ငွေပေးချေမှု နည်းလမ်း",
      paymentMethodValue: "QR Code (PromptPay) ဖြင့် ပေးချေသည်",
    },
    slipUpload: {
      title: "ငွေလွှဲပြေစာ ပုံ သို့မဟုတ် ဖိုင် တင်ပါ",
      instructions: "ပမာဏ၊ လက်ခံသူ၊ ရက်စွဲနှင့် လုပ်ငန်းစဉ်နံပါတ် ရှင်းလင်းစွာ မြင်ရသော ပုံကို တင်ပါ",
      takePhoto: "ဓာတ်ပုံရိုက်မည်",
      chooseGallery: "ပုံများထဲမှ ရွေးမည်",
      changeImage: "ပုံပြောင်းမည်",
      removeImage: "ပုံဖျက်မည်",
      previewTitle: "ရွေးချယ်ထားသော ပြေစာပုံ",
      supportedFormats: "JPG, PNG, WEBP ဖိုင်များ (10 MB ထက်မပိုရ)",
      heicWarning: "iPhone HEIC ပုံဖြစ်ပါက JPG/PNG သို့ ပြောင်းလဲ၍ တင်ပါ",
      refreshWarning: "စာမျက်နှာ ပြန်ဖွင့်ပါက ပြေစာဖိုင်ကို ပြန်လည်ရွေးချယ်ပါ",
      unsupportedFileError: "ဖိုင်အမျိုးအစား မှားယွင်းနေပါသည်။ JPG, PNG သို့မဟုတ် WEBP ကို သုံးပါ",
    },
    actions: {
      next: "ရှေ့သို့",
      back: "နောက်သို့",
      edit: "ပြင်ဆင်မည်",
      confirmSubmit: "ပြေစာ အတည်ပြု တင်သွင်းမည်",
      submitting: "ခဏစောင့်ပါ...",
      checkStatus: "အခြေအနေ စစ်ဆေးမည်",
      copyTrackingLink: "လင့်ခ် ကူးယူမည်",
      linkCopied: "လင့်ခ် ကူးယူပြီးပါပြီ",
      resubmit: "ပြေစာ အသစ်ပြန်တင်မည်",
      retryUpload: "ပြန်လည် ကြိုးစားမည်",
    },
    status: {
      submitted: "ပြေစာ တင်ပြီးပါပြီ (စစ်ဆေးဆဲ)",
      pendingVerify: "ဘဏ္ဍာရေး စစ်ဆေးနေပါသည်",
      verified: "ငွေလက်ခံမှု အတည်ပြုပြီးပါပြီ",
      receipted: "ပြေစာ ထုတ်ပေးပြီးပါပြီ",
      amountMismatch: "ငွေပမာဏ မကိုက်ညီပါ",
      possibleDuplicate: "ပြေစာထပ်နေပါသည် (စစ်ဆေးဆဲ)",
      invalidSlip: "ပြေစာ မရှင်းလင်းပါ / ပြန်တင်ပေးပါ",
      rejected: "ငွေလက်ခံမှုကို ငြင်းပယ်သည်",
      cancelled: "ပယ်ဖျက်လိုက်ပါပြီ",
      receivedMessage: "သင်၏ ငွေလွှဲပြေစာကို လက်ခံရရှိပြီးပါပြီ",
      receiptDisclaimer: "⚠️ မှတ်ချက် - ဤပြေစာတင်ခြင်းသည် အကြောင်းကြားခြင်းသာဖြစ်ပြီး တရားဝင် ပြေစာမဟုတ်သေးပါ။",
      resubmitReasonHeader: "ပြန်လည်တင်ခိုင်းသည့် အကြောင်းအရင်း -",
      trackingCodeLabel: "စစ်ဆေးရန် နံပါတ် (Tracking Reference) -",
      notFound: "အချက်အလက် ရှာမတွေ့ပါ",
      notFoundHelp: "လင့်ခ်ကို စစ်ဆေးပါ သို့မဟုတ် ဝန်ထမ်းကို ဆက်သွယ်ပါ",
      expiredPoint: "ငွေလက်ခံဌာန ပိတ်ထားပါသည်",
    },
    reasons: {
      AMOUNT_MISMATCH: "ပြေစာပါ ငွေပမာဏနှင့် ဖြည့်စွက်ငွေ မကိုက်ညီပါ",
      WRONG_RECEIVER: "လက်ခံသူ အကောင့်အမည် မှားယွင်းနေပါသည်",
      UNREADABLE_IMAGE: "ပုံ မရှင်းလင်းပါ (ပမာဏ သို့မဟုတ် ရက်စွဲ မမြင်ရပါ)",
      DUPLICATE_TRANSACTION: "စနစ်ထဲတွင် ဤငွေလွှဲနံပါတ် ရှိပြီးသားဖြစ်သည်",
      VERIFICATION_FAILED: "ဘဏ်နှင့် ငွေလွှဲမှုကို စစ်ဆေး၍ မရပါ",
    },
    validation: {
      requiredHN: "လူနာနံပါတ် (HN) ထည့်ပါ",
      requiredPatientName: "လူနာအမည် ထည့်ပါ",
      requiredAmount: "ငွေပမာဏ ထည့်ပါ",
      invalidAmount: "ငွေပမာဏသည် 0 ထက် ကြီးရမည်",
      requiredBank: "ငွေလွှဲသည့် ဘဏ် ရွေးပါ",
      requiredTransferTime: "ငွေလွှဲသည့် အချိန် ထည့်ပါ",
      requiredSlip: "ငွေလွှဲပြေစာပုံ တင်ပါ",
      fileTooLarge: "ဖိုင်ဆိုဒ် 10 MB ထက် မကြီးရပါ",
      futureTime: "ငွေလွှဲချိန်သည် အနာဂတ်အချိန် မဖြစ်ရပါ",
    },
  },

  km: {
    localeName: "Khmer",
    nativeName: "ខ្មែរ",
    hospitalName: "មន្ទីរពេទ្យផ្លួកដែង",
    departmentName: "ផ្នែកហិរញ្ញវត្ថុ មន្ទីរពេទ្យផ្លួកដែង",
    steps: {
      language: "១. ភាសា",
      review: "២. ព័ត៌មាន",
      pay: "៣. បង់ប្រាក់",
      upload: "៤. ភ្ជាប់បង្កាន់ដៃ",
      confirm: "៥. ផ្ទៀងផ្ទាត់",
      result: "៦. លទ្ធផល",
    },
    headers: {
      selectLanguage: "เลือกภาษา / Select Language",
      paymentPoint: "កន្លែងទទួលប្រាក់",
      billingDetails: "ព័ត៌មានលម្អិតនៃការទូទាត់",
      makePayment: "បង់ប្រាក់តាម QR / គណនីធនាគារ",
      attachSlip: "ភ្ជាប់ភស្តុតាងការផ្ទេរប្រាក់ (Slip)",
      confirmSubmission: "ពិនិត្យព័ត៌មានមុនពេលផ្ញើ",
      submissionSuccess: "បានផ្ញើភស្តុតាងជោគជ័យ",
      trackingTitle: "តាមដានស្ថានភាពការទូទាត់",
    },
    patientInfo: {
      title: "ព័ត៌មានអ្នកជំងឺ និងការទូទាត់",
      hnLabel: "លេខសម្គាល់អ្នកជំងឺ (HN)",
      hnPlaceholder: "បញ្ចូល HN ឧទាហរណ៍ 67xxxx",
      vnAnLabel: "លេខ VN / AN (បើមាន)",
      patientNameLabel: "ឈ្មោះអ្នកជំងឺ",
      patientNamePlaceholder: "បញ្ចូលឈ្មោះអ្នកជំងឺពេញលេញ",
      payerNameLabel: "ឈ្មោះអ្នកផ្ទេរប្រាក់",
      payerNamePlaceholder: "ឈ្មោះនៅលើបង្កាន់ដៃ",
      phoneLabel: "លេខទូរស័ព្ទ",
      phonePlaceholder: "08x-xxx-xxxx",
      declaredAmountLabel: "ចំនួនប្រាក់ដែលបានផ្ទេរ (បាត)",
      billedAmountLabel: "ចំនួនប្រាក់ត្រូវបង់តាមប្រព័ន្ធ (បាត)",
      declaredAmountHelp: "*បញ្ចូលចំនួនប្រាក់ពិតប្រាកដនៅលើបង្កាន់ដៃ",
      billedAmountHelp: "*ចំនួនប្រាក់ដែលបានបញ្ជាក់ដោយប្រព័ន្ធមន្ទីរពេទ្យ",
      currency: "បាត (THB)",
      sourceBankLabel: "ធនាគារផ្ទេរចេញ",
      sourceBankPlaceholder: "ជ្រើសរើស ឬវាយបញ្ចូលឈ្មោះធនាគារ",
      transferDateTimeLabel: "ថ្ងៃ និងម៉ោងផ្ទេរប្រាក់",
      noteLabel: "ចំណាំបន្ថែម (បើមាន)",
      notePlaceholder: "ព័ត៌មានបន្ថែមជូនបុគ្គលិកហិរញ្ញវត្ថុ",
    },
    bankDetails: {
      receivingAccountTitle: "គណនីទទួលប្រាក់ មន្ទីរពេទ្យផ្លួកដែង",
      bankName: "ធនាគារទទួល",
      accountNumber: "លេខគណនី",
      accountName: "ឈ្មោះគណនី",
      promptPayQr: "QR Code សម្រាប់ស្កែនផ្ទេរប្រាក់ (PromptPay)",
      promptPayHelp: "ស្កែន QR Code នេះតាមកម្មវិធីធនាគារដើម្បីផ្ទេរប្រាក់",
      pointQrVsPaymentQrNotice: "⚠️ QR Code នេះគឺសម្រាប់ផ្ទេរប្រាក់ចូលគណនីមន្ទីរពេទ្យ (ខុសពី QR Code ដែលបានស្កែនដើម្បីបើកទំព័រនេះ)។",
      saveQrButton: "រក្សាទុកឡូហ្គោ QR Code",
      saveQrInstructions: "ប្រសិនបមិនអាចរក្សាទុកបាន សូមចុចលើរូប QR ឱ្យជាប់ រួចជ្រើសរើស 'Save Image'",
    },
    receipt: {
      title: "វិក្កយបត្រទទួលប្រាក់",
      receiptNoLabel: "លេខវិក្កយបត្រ",
      dateLabel: "កាលបរិច្ឆេទ",
      cashierLabel: "អ្នកទទួលប្រាក់",
      paymentMethodLabel: "វិធីសាស្ត្រទូទាត់",
      paymentMethodValue: "ទូទាត់តាម QR Code (PromptPay)",
    },
    slipUpload: {
      title: "ភ្ជាប់រូបថត ឬឯកសារបង្កាន់ដៃផ្ទេរប្រាក់",
      instructions: "សូមភ្ជាប់រូបភាពដែលមើលឃើញ ចំនួនប្រាក់ ឈ្មោះអ្នកទទួល កាលបរិច្ឆេទ និងលេខយោងច្បាស់លាស់",
      takePhoto: "ថតរូបបង្កាន់ដៃ",
      chooseGallery: "ជ្រើសរើសពីរូបភាព",
      changeImage: "ផ្លាស់ប្តូររូបភាព",
      removeImage: "លុបរូបភាព",
      previewTitle: "មើលគំរូរូបភាពដែលបានជ្រើសរើស",
      supportedFormats: "ទ្រទ្រង់ឯកសារ JPG, PNG, WEBP ទំហំមិនលើសពី 10 MB",
      heicWarning: "ប្រសិនបើប្រើរូបភាព HEIC (iPhone) សូមផ្លាស់ប្តូរទៅ JPG/PNG មុននឹងបន្ត",
      refreshWarning: "ប្រសិនបើបើកទំព័រឡើងវិញ សូមជ្រើសរើសឯកសារបង្កាន់ដៃម្តងទៀត",
      unsupportedFileError: "ទម្រង់ឯកសារមិនត្រឹមត្រូវ សូមជ្រើសរើស JPG, PNG ឬ WEBP",
    },
    actions: {
      next: "បន្ទាប់",
      back: "ត្រឡប់ក្រោយ",
      edit: "កែប្រែព័ត៌មាន",
      confirmSubmit: "បញ្ជាក់ការផ្ញើភស្តុតាង",
      submitting: "កំពុងផ្ញើ សូមរង់ចាំ...",
      checkStatus: "ពិនិត្យស្ថានភាព",
      copyTrackingLink: "ចម្លងតំណតាមដាន",
      linkCopied: "បានចម្លងតំណរួចរាល់",
      resubmit: "ផ្ញើភស្តុតាងម្តងទៀត",
      retryUpload: "ព្យាយាមម្តងទៀត",
    },
    status: {
      submitted: "បានផ្ញើភស្តុតាង (រង់ចាំការពិនិត្យ)",
      pendingVerify: "កំពុងផ្ទៀងផ្ទាត់ចំនួនប្រាក់",
      verified: "បានបញ្ជាក់ការទទួលប្រាក់រួចរាល់",
      receipted: "បានចេញបង្កាន់ដៃរួចរាល់",
      amountMismatch: "ចំនួនប្រាក់មិនត្រូវគ្នានឹងវិក្កយបត្រ",
      possibleDuplicate: "រកឃើញបង្កាន់ដៃស្ទួន (រង់ចាំការពិនិត្យ)",
      invalidSlip: "រូបភាពមិនច្បាស់ / សូមផ្ញើម្តងទៀត",
      rejected: "បានបដិសេធការទទួលប្រាក់",
      cancelled: "បានលុបចោលប្រតិបត្តិការ",
      receivedMessage: "ប្រព័ន្ធបានទទួលភស្តុតាងការទូទាត់របស់អ្នករួចរាល់ហើយ",
      receiptDisclaimer: "⚠️ ចំណាំ៖ ការផ្ញើបង្កាន់ដៃនេះមិនទាន់ជាវិក្កយបត្រផ្លូវការទេ រហូតដល់បុគ្គលិកហិរញ្ញវត្ថុបានពិនិត្យ និងបញ្ជាក់រួចរាល់។",
      resubmitReasonHeader: "មូលហេតុដែលបុគ្គលិកសុំឱ្យផ្ញើម្តងទៀត៖",
      trackingCodeLabel: "លេខសម្គាល់តាមដាន (Tracking Reference)៖",
      notFound: "រកមិនឃើញព័ត៌មានទូទាត់",
      notFoundHelp: "សូមពិនិត្យមើលតំណ ឬទាក់ទងបុគ្គលិកហិរញ្ញវត្ថុ",
      expiredPoint: "កន្លែងទទួលប្រាក់ត្រូវបានបិទ ឬផុតម៉ោងសេវាកម្ម",
    },
    reasons: {
      AMOUNT_MISMATCH: "ចំនួនប្រាក់នៅលើបង្កាន់ដៃមិនត្រូវគ្នានឹងចំនួនដែលបានប្រកាស",
      WRONG_RECEIVER: "ឈ្មោះគណនីអ្នកទទួលប្រាក់មិនត្រឹមត្រូវ",
      UNREADABLE_IMAGE: "រូបភាពមិនច្បាស់ មិនឃើញចំនួនប្រាក់ កាលបរិច្ឆេទ ឬលេខយោង",
      DUPLICATE_TRANSACTION: "រកឃើញប្រតិបត្តិការស្ទួននៅក្នុងប្រព័ន្ធ",
      VERIFICATION_FAILED: "មិនអាចផ្ទៀងផ្ទាត់ប្រតិបត្តិការជាមួយធនាគារបានទេ",
    },
    validation: {
      requiredHN: "សូមបញ្ចូលលេខសម្គាល់អ្នកជំងឺ (HN)",
      requiredPatientName: "សូមបញ្ចូលឈ្មោះអ្នកជំងឺ",
      requiredAmount: "សូមបញ្ចូលចំនួនប្រាក់",
      invalidAmount: "ចំនួនប្រាក់ត្រូវតែច្រើនជាង 0",
      requiredBank: "សូមជ្រើសរើសធនាគារផ្ទេរចេញ",
      requiredTransferTime: "សូមបញ្ចូលម៉ោងផ្ទេរប្រាក់",
      requiredSlip: "សូមភ្ជាប់រូបភាពបង្កាន់ដៃផ្ទេរប្រាក់",
      fileTooLarge: "ទំហំឯកសារធំជាង 10 MB",
      futureTime: "ម៉ោងផ្ទេរប្រាក់មិនអាចជានាពេលអនាគតបានទេ",
    },
  },
};

export function getTranslation(locale: SupportedLocale): TranslationDict {
  return translations[locale] || translations.th;
}

export function formatDate(date: Date | string, locale: SupportedLocale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (locale === "th") {
    const day = d.getDate();
    const monthsTh = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const month = monthsTh[d.getMonth()];
    const yearBe = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${yearBe} ${hours}:${mins} น.`;
  }

  if (locale === "zh-CN") {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${year}年${month}月${day}日 ${hours}:${mins}`;
  }

  // my or km or default en/AD format
  const year = d.getFullYear();
  const monthsEn = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthsEn[d.getMonth()];
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${mins}`;
}
