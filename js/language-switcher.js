document.addEventListener('DOMContentLoaded', function() {
    // Language dropdown functionality
    const languageDropdown = document.querySelector('.language-dropdown');
    const selectedLanguage = document.querySelector('.selected-language');
    const languageOptions = document.querySelector('.language-options');
    const languageOptionItems = document.querySelectorAll('.language-option');
    
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
                
                // Update selected language text
                if (selectedLanguage) {
                    const span = selectedLanguage.querySelector('span');
                    if (span) span.textContent = langText;
                }
                
                // Close dropdown
                if (languageDropdown) {
                    languageDropdown.classList.remove('open');
                }
                
                // Apply RTL for Arabic only (unless overridden by page-specific script)
                if (lang === 'ARB') {
                    document.body.classList.add('rtl');
                    document.dir = 'rtl';
                } else {
                    document.body.classList.remove('rtl');
                    document.dir = 'ltr';
                }
                
                // Load translations
                loadTranslations(lang);
                
                // Store the selected language in localStorage
                localStorage.setItem('selectedLanguage', lang);
            });
        });
    }
    
    // Listen for custom language change events (from login page)
    document.addEventListener('languageChange', function(event) {
        if (event.detail && event.detail.lang) {
            loadTranslations(event.detail.lang);
        }
    });
    
    // Function to load translations
    function loadTranslations(lang) {
        // Define translations
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
                'login-title': 'Login to Your Account',
                'login-email': 'Email',
                'login-password': 'Password',
                'login-remember': 'Remember me',
                'login-forgot': 'Forgot password?',
                'login-button': 'Login',
                'login-no-account': 'Don\'t have an account?',
                'login-signup': 'Sign up'
            },
            'CHN': {
                'nav-about': '关于我们',
                'nav-approach': '我们的方法',
                'nav-services': '服务',
                'nav-testimonials': '客户评价',
                'nav-contact': '联系我们',
                'get-started': '开始使用',
                'hero-title': '全球医疗触手可及',
                'hero-subtitle': '随时随地远程连接世界一流医生。',
                'hero-cta': '预约咨询',
                'login-title': '登录您的账户',
                'login-email': '电子邮件',
                'login-password': '密码',
                'login-remember': '记住我',
                'login-forgot': '忘记密码？',
                'login-button': '登录',
                'login-no-account': '没有账户？',
                'login-signup': '注册'
            },
            'ARB': {
                'nav-about': 'حول',
                'nav-approach': 'نهجنا',
                'nav-services': 'خدمات',
                'nav-testimonials': 'الشهادات',
                'nav-contact': 'اتصل',
                'get-started': 'البدء',
                'hero-title': 'الرعاية الصحية العالمية في متناول يدك',
                'hero-subtitle': 'تواصل مع أطباء على مستوى عالمي عن بُعد من أي مكان وفي أي وقت.',
                'hero-cta': 'جدولة استشارة',
                'login-title': 'تسجيل الدخول إلى حسابك',
                'login-email': 'البريد الإلكتروني',
                'login-password': 'كلمة المرور',
                'login-remember': 'تذكرني',
                'login-forgot': 'نسيت كلمة المرور؟',
                'login-button': 'تسجيل الدخول',
                'login-no-account': 'ليس لديك حساب؟',
                'login-signup': 'التسجيل'
            }
        };
        
        // Apply translations to elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
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
    
    // Load previously selected language if available
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        // Find the language option with the saved language
        const option = Array.from(languageOptionItems).find(opt => 
            opt.getAttribute('data-lang') === savedLanguage
        );
        
        if (option) {
            // Simulate a click on that option
            option.click();
        }
    }
    
    // Add console logging for debugging
    console.log('Language dropdown initialized:', {
        dropdown: languageDropdown,
        selectedLanguage: selectedLanguage,
        options: languageOptions,
        optionItems: languageOptionItems
    });
});