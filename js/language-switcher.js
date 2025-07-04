document.addEventListener('DOMContentLoaded', function() {
    const translations = {
        'ENG': {
            'nav-about': 'About',
            'nav-approach': 'Our Approach',
            'nav-services': 'Services',
            'nav-testimonials': 'Testimonials',
            'nav-contact': 'Contact',
            'start-consultation': 'Start Consultation',
            'hero-title': 'Global Healthcare at Your Fingertips',
            'hero-subtitle': 'Connect with world-class doctors remotely from anywhere, anytime.',
            'about-title': 'About Strive & Fit Co.',
            'about-subtitle': "We're bridging geographical gaps in healthcare through innovative telemedicine solutions.",
            'mission-title': 'Our Mission',
            'mission-text': 'At Strive & Fit Co., we believe that quality healthcare should be accessible to everyone, regardless of location. Our mission is to connect patients with the best medical professionals globally through secure, reliable telemedicine technology.',
            'story-title': 'Our Story',
            'story-text': 'Founded by a team of healthcare professionals and technology experts, Strive & Fit Co. was born from the desire to eliminate geographical barriers to healthcare access and provide patients with more options for specialized care.',
            'approach-title': 'Our Approach',
            'approach-subtitle': 'A seamless process designed to provide quality healthcare remotely',
            'step1-title': 'Patient Registration',
            'step1-text': 'Create your secure profile with medical history and current health concerns.',
            'step2-title': 'Doctor Matching',
            'step2-text': 'Our system matches you with specialists suited to your specific health needs.',
            'step3-title': 'Virtual Consultation',
            'step3-text': 'Connect with your doctor through our secure, high-definition video platform.',
            'step4-title': 'Ongoing Care',
            'step4-text': 'Receive prescriptions, follow-up appointments, and continuous support through our platform.',
            'services-title': 'Our Services',
            'services-subtitle': 'Comprehensive telemedicine solutions for global healthcare',
            'service1-title': 'Primary Care',
            'service1-text': 'General consultations for common illnesses, preventive care, and health maintenance.',
            'service2-title': 'Specialist Consultations',
            'service2-text': 'Connect with specialists in cardiology, dermatology, psychiatry, and more.',
            'service3-title': 'Second Opinions',
            'service3-text': 'Get additional expert perspectives on diagnoses and treatment plans from global specialists.',
            'learn-more': 'Learn More',
            'testimonials-title': 'Patient Success Stories',
            'testimonials-subtitle': 'Real experiences from our global patient network',
            'contact-title': 'Ready to Access Global Healthcare?',
            'contact-text': 'Schedule a demonstration of our platform or speak with our patient care team to learn how we can connect you with world-class medical professionals.',
            'email-label': 'Email',
            'phone-label': 'Phone',
            'address-label': 'Address',
            'name-label': 'Name',
            'message-label': 'Message',
            'send-message': 'Send Message',
            'company-label': 'Company',
            'resources-label': 'Resources',
            'connect-label': 'Connect',
            'blog-link': 'Health Blog',
            'faq-link': 'FAQ',
            'privacy-link': 'Privacy Policy',
            'terms-link': 'Terms of Service',
            'copyright': '© 2023 Strive & Fit Co. All rights reserved.',
            'lang-english': 'English',
            'lang-chinese': '中文',
            'lang-arabic': 'العربية',
            'login-title': 'Access Your Medical Records',
            'login-dob': 'Date of Birth (YYYY-MM-DD)',
            'login-account': 'Account Number',
            'login-button': 'Access Records',
            'login-no-account': "Don't have an account?",
            'login-generate': 'Generate Account',
            'generate-title': 'Generate New Account',
            'generate-dob': 'Date of Birth (YYYY-MM-DD)',
            'generate-warning': '⚠️ Important: You will need both your date of birth and the generated account number to access your records. Save them securely!',
            'generate-button': 'Generate Account Number',
            'account-generated': 'Your Account Number:',
            'save-instructions': 'Please save this account number along with your date of birth in a secure location. This is the only way to access your medical records.',
            'copy-account': 'Copy Account Number',
            'have-account': 'Already have an account?',
            'back-login': 'Back to Login',
            'dob-hint': 'Enter your date of birth in YYYY-MM-DD format',
            
            // Dashboard translations
            'dashboard-title': 'Medical Records Dashboard',
            'account-label': 'Account',
            'logout': 'Logout',
            'upload-documents': 'Upload Documents',
            'upload-title': 'Upload Medical Documents',
            'upload-subtitle': 'Drag and drop files here or click to browse',
            'documents-title': 'Your Documents',
            'search-placeholder': 'Search documents...',
            'selected-count': '{0} selected',
            'download-selected': 'Download Selected',
            'delete-selected': 'Delete Selected',
            'process-selected': 'Process Selected',
            'document-name': 'Document Name',
            'upload-date': 'Upload Date',
            'size': 'Size',
            'status': 'Status',
            'actions': 'Actions',
            'process': 'Process',
            'download': 'Download',
            'delete': 'Delete',
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Completed',
            'failed': 'Failed',
            'original': 'Original',
            'processed': 'Processed',
            'translated': 'Translated',
            'no-documents': 'No documents found. Upload your first document to get started.',
            'upload-progress': 'Uploading...',
            'processing-status': 'Processing Status',
            'total-documents': 'Total:',
            'last-update': 'Last update:',
            'never': 'Never'
        },
        'CHN': {
            'nav-about': '关于我们',
            'nav-approach': '我们的方法',
            'nav-services': '服务',
            'nav-testimonials': '成功案例',
            'nav-contact': '联系我们',
            'start-consultation': '开始咨询',
            'hero-title': '全球医疗保健触手可及',
            'hero-subtitle': '随时随地与世界一流的医生进行远程联系。',
            'about-title': '关于 Strive & Fit Co.',
            'about-subtitle': '我们通过创新的远程医疗解决方案，弥合医疗保健领域的地域差距。',
            'mission-title': '我们的使命',
            'mission-text': '在 Strive & Fit Co.，我们相信无论身在何处，每个人都应享有优质的医疗保健。我们的使命是通过安全、可靠的远程医疗技术，将患者与全球最优秀的医疗专业人员联系起来。',
            'story-title': '我们的故事',
            'story-text': 'Strive & Fit Co. 由一支医疗保健专业人员和技术专家团队创立，旨在消除医疗保健服务的地域障碍，为患者提供更多专科护理选择。',
            'approach-title': '我们的方法',
            'approach-subtitle': '旨在提供优质远程医疗保健的无缝流程',
            'step1-title': '患者注册',
            'step1-text': '创建您的安全个人资料，包括病史和当前的健康问题。',
            'step2-title': '医生匹配',
            'step2-text': '我们的系统会根据您的特定健康需求，为您匹配合适的专家。',
            'step3-title': '虚拟咨询',
            'step3-text': '通过我们的安全高清视频平台与您的医生联系。',
            'step4-title': '持续护理',
            'step4-text': '通过我们的平台接收处方、后续预约和持续支持。',
            'services-title': '我们的服务',
            'services-subtitle': '面向全球医疗保健的综合远程医疗解决方案',
            'service1-title': '初级保健',
            'service1-text': '常见疾病、预防保健和健康维护的全面咨询。',
            'service2-title': '专科咨询',
            'service2-text': '与心脏病学、皮肤病学、精神病学等领域的专家联系。',
            'service3-title': '第二意见',
            'service3-text': '从全球专家那里获得有关诊断和治疗计划的更多专业意见。',
            'learn-more': '了解更多',
            'testimonials-title': '患者成功案例',
            'testimonials-subtitle': '来自我们全球患者网络的真实经历',
            'contact-title': '准备好获取全球医疗保健服务了吗？',
            'contact-text': '安排我们的平台演示，或与我们的患者护理团队联系，了解我们如何将您与世界一流的医疗专业人员联系起来。',
            'email-label': '电子邮件',
            'phone-label': '电话',
            'address-label': '地址',
            'name-label': '姓名',
            'message-label': '信息',
            'send-message': '发送信息',
            'company-label': '公司',
            'resources-label': '资源',
            'connect-label': '联系',
            'blog-link': '健康博客',
            'faq-link': '常见问题',
            'privacy-link': '隐私政策',
            'terms-link': '服务条款',
            'copyright': '© 2023 Strive & Fit Co. 版权所有。',
            'lang-english': 'English',
            'lang-chinese': '中文',
            'lang-arabic': 'العربية',
            'login-title': '访问您的医疗记录',
            'login-dob': '出生日期 (YYYY-MM-DD)',
            'login-account': '账号',
            'login-button': '访问记录',
            'login-no-account': '没有账户？',
            'login-generate': '生���账户',
            'generate-title': '生成新账户',
            'generate-dob': '出生日期 (YYYY-MM-DD)',
            'generate-warning': '⚠️ 重要：您需要出生日期和生成的账号才能访问您的记录。请安全保存！',
            'generate-button': '生成账号',
            'account-generated': '您的账号：',
            'save-instructions': '请将此账号与您的出生日期保存在安全的地方。这是访问您医疗记录的唯一方式。',
            'copy-account': '复制账号',
            'have-account': '已有账户？',
            'back-login': '返回登录',
            'dob-hint': '请输入您的出生日期，格式为 YYYY-MM-DD',
            
            // Dashboard translations
            'dashboard-title': '医疗记录仪表板',
            'account-label': '账户',
            'logout': '退出登录',
            'upload-documents': '上传文档',
            'upload-title': '上传医疗文档',
            'upload-subtitle': '拖拽文件到此处或点击浏览',
            'documents-title': '您的文档',
            'search-placeholder': '搜索文档...',
            'selected-count': '已选择 {0} 个',
            'download-selected': '下载所选',
            'delete-selected': '删除所选',
            'process-selected': '处理所选',
            'document-name': '文档名称',
            'upload-date': '上传日期',
            'size': '大小',
            'status': '状态',
            'actions': '操作',
            'process': '处理',
            'download': '下载',
            'delete': '删除',
            'pending': '等待中',
            'processing': '处理中',
            'completed': '已完成',
            'failed': '失败',
            'original': '原始',
            'processed': '已处理',
            'translated': '已翻译',
            'no-documents': '未找到文档。上传您的第一个文档开始使用。',
            'upload-progress': '上传中...',
            'processing-status': '处理状态',
            'total-documents': '总计:',
            'last-update': '最后更新:',
            'never': '从未'
        },
        'ARB': {
            'nav-about': 'حول',
            'nav-approach': 'نهجنا',
            'nav-services': 'الخدمات',
            'nav-testimonials': 'الشهادات',
            'nav-contact': 'اتصل بنا',
            'start-consultation': 'ابدأ الاستشارة',
            'hero-title': 'الرعاية الصحية العالمية في متناول يدك',
            'hero-subtitle': 'تواصل مع أطباء عالميين عن بُعد من أي مكان وفي أي وقت.',
            'about-title': 'عن شركة سترايف آند فيت',
            'about-subtitle': 'نحن نسد الفجوات الجغرافية في الرعاية الصحية من خلال حلول التطبيب عن بُعد المبتكرة.',
            'mission-title': 'مهمتنا',
            'mission-text': 'في سترايف آند فيت، نؤمن بأن الرعاية الصحية الجيدة يجب أن تكون متاحة للجميع، بغض النظر عن الموقع. مهمتنا هي ربط المرضى بأفضل المتخصصين الطبيين عالميًا من خلال تقنية التطبيب عن بُعد الآمنة والموثوقة.',
            'story-title': 'قصتنا',
            'story-text': 'تأسست شركة سترايف آند فيت بواسطة فريق من متخصصي الرعاية الصحية وخبراء التكنولوجيا، وُلدت من الرغبة في إزالة الحواجز الجغرافية للوصول إلى الرعاية الصحية وتزويد المرضى بمزيد من الخيارات للرعاية المتخصصة.',
            'approach-title': 'نهجنا',
            'approach-subtitle': 'عملية سلسة مصممة لتوفير رعاية صحية عالية الجودة عن بُعد',
            'step1-title': 'تسجيل المريض',
            'step1-text': 'أنشئ ملفك الشخصي الآمن مع التاريخ الطبي والمخاوف الصحية الحالية.',
            'step2-title': 'مطابقة الطبيب',
            'step2-text': 'يقوم نظامنا بمطابقتك مع المتخصصين المناسبين لاحتياجاتك الصحية المحددة.',
            'step3-title': 'استشارة افتراضية',
            'step3-text': 'تواصل مع طبيبك من خلال منصة الفيديو الآمنة عالية الدقة.',
            'step4-title': 'الرعاية المستمرة',
            'step4-text': 'احصل على الوصفات الطبية والمواعيد المتابعة والدعم المستمر من خلال منصتنا.',
            'services-title': 'خدماتنا',
            'services-subtitle': 'حلول شاملة للتطبيب عن بُعد للرعاية الصحية العالمية',
            'service1-title': 'الرعاية الأولية',
            'service1-text': 'استشارات عامة للأمراض الشائعة والرعاية الوقائية والحفاظ على الصحة.',
            'service2-title': 'استشارات متخصصة',
            'service2-text': 'تواصل مع متخصصين في أمراض القلب والجلدية والطب النفسي والمزيد.',
            'service3-title': 'آراء ثانية',
            'service3-text': 'احصل على وجهات نظر خبراء إضافية حول التشخيصات وخطط العلاج من متخصصين عالميين.',
            'learn-more': 'اعرف المزيد',
            'testimonials-title': 'قصص نجاح المرضى',
            'testimonials-subtitle': 'تجارب حقيقية من شبكة المرضى العالمية لدينا',
            'contact-title': 'هل أنت جاهز للوصول إلى الرعاية الصحية العالمية؟',
            'contact-text': 'جدول عرضًا توضيحيًا لمنصتنا أو تحدث مع فريق رعاية المرضى لدينا لمعرفة كيف يمكننا توصيلك بمتخصصين طبيين عالميين.',
            'email-label': 'البريد الإلكتروني',
            'phone-label': 'الهاتف',
            'address-label': 'العنوان',
            'name-label': 'الاسم',
            'message-label': 'الرسالة',
            'send-message': 'إرسال رسالة',
            'company-label': 'الشركة',
            'resources-label': 'الموارد',
            'connect-label': 'تواصل',
            'blog-link': 'مدونة الصحة',
            'faq-link': 'الأسئلة ��لشائعة',
            'privacy-link': 'سياسة الخصوصية',
            'terms-link': 'شروط الخدمة',
            'copyright': '© 2023 سترايف آند فيت. جميع الحقوق محفوظة.',
            'lang-english': 'English',
            'lang-chinese': '中文',
            'lang-arabic': 'العربية',
            'login-title': 'الوصول إلى سجلاتك الطبية',
            'login-dob': 'تاريخ الميلاد (YYYY-MM-DD)',
            'login-account': 'رقم الحساب',
            'login-button': 'الوصول للسجلات',
            'login-no-account': 'ليس لديك حساب؟',
            'login-generate': 'إنشاء حساب',
            'generate-title': 'إنشاء حساب جديد',
            'generate-dob': 'تاريخ الميلاد (YYYY-MM-DD)',
            'generate-warning': '⚠️ مهم: ستحتاج إلى تاريخ ميلادك ورقم الحساب المُولَّد للوصول إلى سجلاتك. احفظهما بأمان!',
            'generate-button': 'إنشاء رقم حساب',
            'account-generated': 'رقم حسابك:',
            'save-instructions': 'يرجى حفظ رقم الحساب هذا مع تاريخ ميلادك في مكان آمن. هذه هي الطريقة الوحيدة ل��وصول إلى سجلاتك الطبية.',
            'copy-account': 'نسخ رقم الحساب',
            'have-account': 'لديك حساب بالفعل؟',
            'back-login': 'العودة للتسجيل',
            'dob-hint': 'أدخل تاريخ ميلادك بصيغة YYYY-MM-DD',
            
            // Dashboard translations
            'dashboard-title': 'لوحة السجلات الطبية',
            'account-label': 'الحساب',
            'logout': 'تسجيل الخروج',
            'upload-documents': 'رفع المستندات',
            'upload-title': 'رفع المستندات الطبية',
            'upload-subtitle': 'اسحب واترك الملفات هنا أو انقر للتصفح',
            'documents-title': 'مستنداتك',
            'search-placeholder': 'البحث في المستندات...',
            'selected-count': 'تم تحديد {0}',
            'download-selected': 'تحميل المحدد',
            'delete-selected': 'حذف المحدد',
            'process-selected': 'معالجة المحدد',
            'document-name': 'اسم المستند',
            'upload-date': 'تاريخ الرفع',
            'size': 'الحجم',
            'status': 'الحالة',
            'actions': 'الإجراءات',
            'process': 'معالجة',
            'download': 'تحميل',
            'delete': 'حذف',
            'pending': 'في الانتظار',
            'processing': 'قيد المعالجة',
            'completed': 'مكتمل',
            'failed': 'فشل',
            'original': 'الأصلي',
            'processed': 'معالج',
            'translated': 'مترجم',
            'no-documents': 'لم يتم العثور على مستندات. ارفع مستندك الأول للبدء.',
            'upload-progress': 'جاري الرفع...',
            'processing-status': 'حالة المعالجة',
            'total-documents': 'المجموع:',
            'last-update': 'آخر تحديث:',
            'never': 'أبداً'
        }
    };

    function setLanguage(lang) {
        const langMap = {
            'ENG': 'English',
            'CHN': '中文',
            'ARB': 'العربية'
        };

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (translations[lang] && translations[lang][key]) {
                el.setAttribute('title', translations[lang][key]);
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        document.querySelectorAll('[data-i18n-format]').forEach(el => {
            const key = el.getAttribute('data-i18n-format');
            const value = el.getAttribute('data-i18n-value');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key].replace('{0}', value);
            }
        });

        document.documentElement.lang = lang.toLowerCase();
        document.documentElement.dir = lang === 'ARB' ? 'rtl' : 'ltr';
        
        const selectedLanguageSpan = document.querySelector('.selected-language span');
        if (selectedLanguageSpan) {
            selectedLanguageSpan.textContent = langMap[lang];
        }
    }

    const languageDropdown = document.querySelector('.language-dropdown');
    if (languageDropdown) {
        const selectedLanguageContainer = languageDropdown.querySelector('.selected-language');
        const selectedLanguageSpan = selectedLanguageContainer.querySelector('span');
        
        selectedLanguageContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('open');
        });

        languageDropdown.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = option.getAttribute('data-lang');
                if (selectedLanguageSpan) {
                    selectedLanguageSpan.textContent = option.textContent;
                }
                localStorage.setItem('selectedLanguage', lang);
                setLanguage(lang);
                languageDropdown.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!languageDropdown.contains(e.target)) {
                languageDropdown.classList.remove('open');
            }
        });
    }

    const savedLang = localStorage.getItem('selectedLanguage') || 'ENG';
    const langOption = document.querySelector(`.language-option[data-lang="${savedLang}"]`);
    if (langOption) {
        langOption.click();
    }
});
