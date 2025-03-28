document.addEventListener('DOMContentLoaded', function() {
    // 获取语言选择器元素
    const languageDropdown = document.querySelector('.language-dropdown');
    const selectedLanguage = document.querySelector('.selected-language span');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // 语言数据对象
    const translations = {
        'ENG': {
            'nav-about': 'About',
            'nav-approach': 'Our Approach',
            'nav-services': 'Services',
            'nav-testimonials': 'Testimonials',
            'nav-contact': 'Contact',
            'get-started': 'Get Started',
            'hero-title': 'Global Healthcare at Your Fingertips',
            'hero-subtitle': 'Connect with world-class doctors remotely from anywhere, anytime.',
            'hero-cta': 'Schedule a Consultation',
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
            // 登录页面翻译
            'login-title': 'Login to Your Account',
            'login-subtitle': 'Access your healthcare dashboard',
            'email-placeholder': 'Enter your email',
            'password-placeholder': 'Enter your password',
            'remember-me': 'Remember me',
            'forgot-password': 'Forgot Password?',
            'login-button': 'Login',
            'no-account': 'Don\'t have an account?',
            'signup-link': 'Sign up'
        },
        'ZH-CN': {
            'nav-about': '关于我们',
            'nav-approach': '我们的方法',
            'nav-services': '服务项目',
            'nav-testimonials': '客户评价',
            'nav-contact': '联系我们',
            'get-started': '立即开始',
            'hero-title': '全球医疗服务触手可及',
            'hero-subtitle': '随时随地远程连接世界一流医生。',
            'hero-cta': '预约咨询',
            'about-title': '关于Strive & Fit公司',
            'about-subtitle': '我们通过创新的远程医疗解决方案弥合医疗保健的地理差距。',
            'mission-title': '我们的使命',
            'mission-text': '在Strive & Fit公司，我们相信优质的医疗保健应该人人可及，无论地理位置如何。我们的使命是通过安全、可靠的远程医疗技术，将患者与全球最优秀的医疗专业人员连接起来。',
            'story-title': '我们的故事',
            'story-text': 'Strive & Fit公司由一群医疗保健专业人员和技术专家创立，源于消除医疗保健获取的地理障碍并为患者提供更多专科护理选择的愿望。',
            'approach-title': '我们的方法',
            'approach-subtitle': '专为远程提供优质医疗保健而设计的无缝流程',
            'step1-title': '患者注册',
            'step1-text': '创建您的安全个人资料，包括病史和当前健康问题。',
            'step2-title': '医生匹配',
            'step2-text': '我们的系统将您与适合您特定健康需求的专家匹配。',
            'step3-title': '虚拟咨询',
            'step3-text': '通过我们安全、高清的视频平台与医生连接。',
            'step4-title': '持续护理',
            'step4-text': '通过我们的平台接收处方、后续预约和持续支持。',
            'services-title': '我们的服务',
            'services-subtitle': '全球医疗保健的综合远程医疗解决方案',
            'service1-title': '初级保健',
            'service1-text': '针对常见疾病、预防保健和健康维护的一般咨询。',
            'service2-title': '专科咨询',
            'service2-text': '与心脏病学、皮肤病学、精神病学等领域的专家联系。',
            'service3-title': '第二诊疗意见',
            'service3-text': '从全球专家那里获得关于诊断和治疗计划的额外专业观点。',
            'learn-more': '了解更多',
            'testimonials-title': '患者成功案例',
            'testimonials-subtitle': '来自我们全球患者网络的真实体验',
            'contact-title': '准备好获取全球医疗服务了吗？',
            'contact-text': '安排我们平台的演示或与我们的患者护理团队交谈，了解我们如何将您与世界一流的医疗专业人员联系起来。',
            'email-label': '电子邮件',
            'phone-label': '电话',
            'address-label': '地址',
            'name-label': '姓名',
            'message-label': '留言',
            'send-message': '发送消息',
            'company-label': '公司',
            'resources-label': '资源',
            'connect-label': '关注我们',
            'blog-link': '健康博客',
            'faq-link': '常见问题',
            'privacy-link': '隐私政策',
            'terms-link': '服务条款',
            'copyright': '© 2023 Strive & Fit公司。保留所有权利。',
            // 登录页面翻译
            'login-title': '登录您的账户',
            'login-subtitle': '访问您的医疗保健仪表板',
            'email-placeholder': '输入您的电子邮件',
            'password-placeholder': '输入您的密码',
            'remember-me': '记住我',
            'forgot-password': '忘记密码？',
            'login-button': '登录',
            'no-account': '还没有账户？',
            'signup-link': '注册'
        },
        'ARB': {
            // 保留现有的阿拉伯语翻译
        }
    };
    
    // 切换语言下拉菜单
    languageDropdown.addEventListener('click', function(e) {
        languageDropdown.classList.toggle('open');
    });
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (!languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('open');
        }
    });
    
    // 语言选择
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            selectedLanguage.textContent = this.textContent;
            
            // 设置语言方向（阿拉伯语是RTL）
            if (lang === 'ARB') {
                document.body.classList.add('rtl');
            } else {
                document.body.classList.remove('rtl');
            }
            
            // 更新页面内容
            updatePageContent(lang);
            
            // 保存语言选择到本地存储
            localStorage.setItem('selectedLanguage', lang);
        });
    });
    
    // 更新页面内容的函数
    function updatePageContent(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[lang][key];
                } else {
                    element.textContent = translations[lang][key];
                }
            }
        });
    }
    
    // 页面加载时检查本地存储中的语言设置
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        // 找到对应的语言选项并模拟点击
        const option = document.querySelector(`.language-option[data-lang="${savedLanguage}"]`);
        if (option) {
            option.click();
        }
    }
});