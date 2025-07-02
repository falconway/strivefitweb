document.addEventListener('DOMContentLoaded', function() {
    // Language dropdown functionality
    const languageDropdown = document.querySelector('.language-dropdown');
    const selectedLanguage = document.querySelector('.selected-language');
    const languageOptions = document.querySelector('.language-options');
    const languageOptionItems = document.querySelectorAll('.language-option');
    
    console.log('Language switcher initializing...');
    
    // Toggle dropdown when clicking on selected language
    if (selectedLanguage) {
        selectedLanguage.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up
            languageDropdown.classList.toggle('open');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (languageDropdown && !languageDropdown.contains(event.target)) {
            languageDropdown.classList.remove('open');
        }
    });
    
    // Language switching functionality
    if (languageOptionItems) {
        languageOptionItems.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling up
                const lang = this.getAttribute('data-lang');
                const langText = this.textContent;
                
                console.log('Language selected:', lang);
                
                // Update selected language text
                if (selectedLanguage) {
                    const span = selectedLanguage.querySelector('span');
                    if (span) span.textContent = langText;
                }
                
                // Close dropdown
                if (languageDropdown) {
                    languageDropdown.classList.remove('open');
                }
                
                // Apply RTL for Arabic only
                if (lang === 'ARB') {
                    document.body.classList.add('rtl');
                    document.dir = 'rtl';
                    console.log('RTL applied for Arabic');
                } else {
                    document.body.classList.remove('rtl');
                    document.dir = 'ltr';
                    console.log('LTR applied');
                }
                
                // Load translations
                loadTranslations(lang);
                
                // Store the selected language in localStorage
                localStorage.setItem('selectedLanguage', lang);
            });
        });
    }
    
    // Function to load translations
    function loadTranslations(lang) {
        console.log('Loading translations for:', lang);
        
        // Define translations
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
                'about-subtitle': 'We\'re bridging geographical gaps in healthcare through innovative telemedicine solutions.',
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
                
                // Dashboard translations
                'dashboard-title': 'Medical Records Dashboard',
                'account-label': 'Account:',
                'logout': 'Logout',
                'upload-title': 'Upload Medical Documents',
                'upload-subtitle': 'Drag and drop files here or click to browse',
                'upload-formats': 'Max 50MB',
                'browse-files': 'Browse Files',
                'uploading': 'Uploading...',
                'documents-title': 'Your Medical Documents',
                'loading-documents': 'Loading documents...',
                'download': 'Download',
                'uploaded-on': 'Uploaded on',
                'no-documents': 'No documents uploaded yet',
                'upload-first': 'Upload your first medical document to get started',
                'upload-success': 'Document uploaded successfully',
                'upload-error': 'Error uploading document',
                'load-error': 'Error loading documents',
                'delete': 'Delete',
                'select-all': 'Select All',
                'batch-download': 'Download Selected (ZIP)',
                'batch-delete': 'Delete Selected',
                'patient-info-title': 'Patient Information',
                'account-details': 'Account Details',
                'account-number': 'Account Number',
                'registration-date': 'Registered',
                'preferred-language': 'Language',
                'document-statistics': 'Document Statistics',
                'total-documents': 'Total',
                'processed-documents': 'Processed',
                'recent-activity': 'Recent Activity',
                'last-upload': 'Last Upload',
                'last-view': 'Last Viewed',
                'no-document-selected': 'No document selected',
                'view-original': 'Original',
                'view-processed': 'Processed',
                'view-translated': 'Translated',
                'select-document-to-view': 'Select a document to view'
            },
            'CHN': {
                'nav-about': '关于我们',
                'nav-approach': '我们的方法',
                'nav-services': '服务',
                'nav-testimonials': '客户评价',
                'nav-contact': '联系我们',
                'start-consultation': '开始咨询',
                'hero-title': '全球医疗触手可及',
                'hero-subtitle': '随时随地远程连接世界一流医生。',
                'about-title': '关于Strive & Fit Co.',
                'about-subtitle': '我们通过创新的远程医疗解决方案弥合医疗保健的地理差距。',
                'mission-title': '我们的使命',
                'mission-text': '在Strive & Fit Co.，我们相信无论位置如何，优质医疗保健都应该人人可及。我们的使命是通过安全、可靠的远程医疗技术将患者与全球最好的医疗专业人员连接起来。',
                'story-title': '我们的故事',
                'story-text': 'Strive & Fit Co.由一群医疗保健专业人员和技术专家创立，源于消除医疗保健获取的地理障碍并为患者提供更多专业护理选择的愿望。',
                'approach-title': '我们的方法',
                'approach-subtitle': '旨在远程提供优质医疗保健的无缝流程',
                'step1-title': '患者注册',
                'step1-text': '创建您的安全个人资料，包括病史和当前健康问题。',
                'step2-title': '医生匹配',
                'step2-text': '我们的系统将您与适合您特定健康需求的专家匹配。',
                'step3-title': '虚拟咨询',
                'step3-text': '通过我们安全的高清视频平台与您的医生连接。',
                'step4-title': '持续护理',
                'step4-text': '通过我们的平台接收处方、后续预约和持续支持。',
                'services-title': '我们的服务',
                'services-subtitle': '全球医疗保健的综合远程医疗解决方案',
                'service1-title': '初级保健',
                'service1-text': '针对常见疾病、预防保健和健康维护的一般咨询。',
                'service2-title': '专家咨询',
                'service2-text': '与心脏病学、皮肤病学、精神病学等领域的专家联系。',
                'service3-title': '第二意见',
                'service3-text': '从全球专家那里获得关于诊断和治疗计划的额外专家观点。',
                'learn-more': '了解更多',
                'testimonials-title': '患者成功故事',
                'testimonials-subtitle': '来自我们全球患者网络的真实经历',
                'contact-title': '准备好获取全球医疗保健了吗？',
                'contact-text': '安排我们平台的演示或与我们的患者护理团队交谈，了解我们如何将您与世界一流的医疗专业人员联系起来。',
                'email-label': '电子邮件',
                'phone-label': '电话',
                'address-label': '地址',
                'name-label': '姓名',
                'message-label': '留言',
                'send-message': '发送消息',
                'company-label': '公司',
                'resources-label': '资源',
                'connect-label': '连接',
                'blog-link': '健康博客',
                'faq-link': '常见问题',
                'privacy-link': '隐私政策',
                'terms-link': '服务条款',
                'copyright': '© 2023 Strive & Fit Co. 保留所有权利。',
                
                // Dashboard translations
                'dashboard-title': '医疗记录仪表板',
                'account-label': '账户：',
                'logout': '登出',
                'upload-title': '上传医疗文档',
                'upload-subtitle': '将文件拖放到此处或点击浏览',
                'upload-formats': '最大50MB',
                'browse-files': '浏览文件',
                'uploading': '上传中...',
                'documents-title': '您的医疗文档',
                'loading-documents': '加载文档中...',
                'download': '下载',
                'uploaded-on': '上传于',
                'no-documents': '尚未上传文档',
                'upload-first': '上传您的第一个医疗文档开始使用',
                'upload-success': '文档上传成功',
                'upload-error': '上传文档时出错',
                'load-error': '加载文档时出错',
                'delete': '删除',
                'select-all': '全选',
                'batch-download': '下载选中文档 (ZIP)',
                'batch-delete': '删除选中文档',
                'patient-info-title': '患者信息',
                'account-details': '账户详情',
                'account-number': '账户号码',
                'registration-date': '注册时间',
                'preferred-language': '语言',
                'document-statistics': '文档统计',
                'total-documents': '总计',
                'processed-documents': '已处理',
                'recent-activity': '最近活动',
                'last-upload': '最后上传',
                'last-view': '最后查看',
                'no-document-selected': '未选择文档',
                'view-original': '原始',
                'view-processed': '已处理',
                'view-translated': '已翻译',
                'select-document-to-view': '选择要查看的文档'
            },
            'ARB': {
                'nav-about': 'حول',
                'nav-approach': 'نهجنا',
                'nav-services': 'خدمات',
                'nav-testimonials': 'الشهادات',
                'nav-contact': 'اتصل',
                'start-consultation': 'ابدأ الاستشارة',
                'hero-title': 'الرعاية الصحية العالمية في متناول يدك',
                'hero-subtitle': 'تواصل مع أطباء على مستوى عالمي عن بُعد من أي مكان وفي أي وقت.',
                'about-title': 'حول Strive & Fit Co.',
                'about-subtitle': 'نحن نسد الفجوات الجغرافية في الرعاية الصحية من خلال حلول التطبيب عن بُعد المبتكرة.',
                'mission-title': 'مهمتنا',
                'mission-text': 'في Strive & Fit Co.، نؤمن بأن الرعاية الصحية الجيدة يجب أن تكون متاحة للجميع، بغض النظر عن الموقع. مهمتنا هي ربط المرضى بأفضل المتخصصين الطبيين عالميًا من خلال تقنية التطبيب عن بُعد الآمنة والموثوقة.',
                'story-title': 'قصتنا',
                'story-text': 'تأسست Strive & Fit Co. بواسطة فريق من متخصصي الرعاية الصحية وخبراء التكنولوجيا، وُلدت من الرغبة في إزالة الحواجز الجغرافية للوصول إلى الرعاية الصحية وتزويد المرضى بمزيد من الخيارات للرعاية المتخصصة.',
                'approach-title': 'نهجنا',
                'approach-subtitle': 'عملية سلسة مصممة لتوفير رعاية صحية عالية الجودة عن بُعد',
                'step1-title': 'تسجيل المريض',
                'step1-text': 'قم بإنشاء ملفك الشخصي الآمن مع التاريخ الطبي والمخاوف الصحية الحالية.',
                'step2-title': 'مطابقة الطبيب',
                'step2-text': 'يطابق نظامنا بينك وبين المتخصصين المناسبين لاحتياجاتك الصحية المحددة.',
                'step3-title': 'استشارة افتراضية',
                'step3-text': 'تواصل مع طبيبك من خلال منصة الفيديو الآمنة عالية الدقة.',
                'step4-title': 'الرعاية المستمرة',
                'step4-text': 'احصل على الوصفات الطبية والمواعيد المتابعة والدعم المستمر من خلال منصتنا.',
                'services-title': 'خدماتنا',
                'services-subtitle': 'حلول شاملة للتطبيب عن بُعد للرعاية الصحية العالمية',
                'service1-title': 'الرعاية الأولية',
                'service1-text': 'استشارات عامة للأمراض الشائعة والرعاية الوقائية والحفاظ على الصحة.',
                'service2-title': 'استشارات المتخصصين',
                'service2-text': 'تواصل مع متخصصين في أمراض القلب والأمراض الجلدية والطب النفسي والمزيد.',
                'service3-title': 'آراء ثانية',
                'service3-text': 'احصل على وجهات نظر خبراء إضافية حول التشخيصات وخطط العلاج من المتخصصين العالميين.',
                'learn-more': 'اعرف المزيد',
                'testimonials-title': 'قصص نجاح المرضى',
                'testimonials-subtitle': 'تجارب حقيقية من شبكة المرضى العالمية لدينا',
                'contact-title': 'هل أنت مستعد للوصول إلى الرعاية الصحية العالمية؟',
                'contact-text': 'قم بجدولة عرض توضيحي لمنصتنا أو تحدث مع فريق رعاية المرضى لدينا لمعرفة كيف يمكننا ربطك بالمتخصصين الطبيين على مستوى عالمي.',
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
                'faq-link': 'الأسئلة الشائعة',
                'privacy-link': 'سياسة الخصوصية',
                'terms-link': 'شروط الخدمة',
                'copyright': '© 2023 Strive & Fit Co. جميع الحقوق محفوظة.',
                
                // Dashboard translations
                'dashboard-title': 'لوحة السجلات الطبية',
                'account-label': 'الحساب:',
                'logout': 'تسجيل خروج',
                'upload-title': 'رفع المستندات الطبية',
                'upload-subtitle': 'اسحب وأفلت الملفات هنا أو انقر للتصفح',
                'upload-formats': 'حد أقصى 50 ميجابايت',
                'browse-files': 'تصفح الملفات',
                'uploading': 'جاري الرفع...',
                'documents-title': 'مستنداتك الطبية',
                'loading-documents': 'جاري تحميل المستندات...',
                'download': 'تحميل',
                'uploaded-on': 'تم رفعه في',
                'no-documents': 'لم يتم رفع أي مستندات بعد',
                'upload-first': 'ارفع مستندك الطبي الأول للبدء',
                'upload-success': 'تم رفع المستند بنجاح',
                'upload-error': 'خطأ في رفع المستند',
                'load-error': 'خطأ في تحميل المستندات',
                'delete': 'حذف',
                'select-all': 'تحديد الكل',
                'batch-download': 'تنزيل المحدد (ZIP)',
                'batch-delete': 'حذف المحدد',
                'patient-info-title': 'معلومات المريض',
                'account-details': 'تفاصيل الحساب',
                'account-number': 'رقم الحساب',
                'registration-date': 'تاريخ التسجيل',
                'preferred-language': 'اللغة',
                'document-statistics': 'إحصائيات المستندات',
                'total-documents': 'المجموع',
                'processed-documents': 'معالج',
                'recent-activity': 'النشاط الأخير',
                'last-upload': 'آخر رفع',
                'last-view': 'آخر عرض',
                'no-document-selected': 'لم يتم تحديد مستند',
                'view-original': 'الأصل',
                'view-processed': 'معالج',
                'view-translated': 'مترجم',
                'select-document-to-view': 'اختر مستندًا للعرض'
            }
        };
        
        // Apply translations to elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                console.log('Translating:', key, 'to', translations[lang][key]);
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[lang][key];
                } else {
                    element.textContent = translations[lang][key];
                }
            } else {
                console.warn('Missing translation for key:', key, 'in language:', lang);
            }
        });
    }
    
    // Load previously selected language if available
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        console.log('Found saved language:', savedLanguage);
        // Find the language option with the saved language
        const option = Array.from(languageOptionItems).find(opt => 
            opt.getAttribute('data-lang') === savedLanguage
        );
        
        if (option) {
            console.log('Applying saved language:', savedLanguage);
            // Simulate a click on that option
            option.click();
        }
    }
});