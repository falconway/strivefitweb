document.addEventListener('DOMContentLoaded', function() {
    // Language dropdown functionality
    const languageDropdown = document.querySelector('.language-dropdown');
    const selectedLanguage = document.querySelector('.selected-language');
    const languageOptions = document.querySelector('.language-options');
    const languageOptionElements = document.querySelectorAll('.language-option');
    const selectedLanguageText = document.querySelector('.selected-language span');
    
    // Toggle dropdown
    selectedLanguage.addEventListener('click', function(e) {
        e.stopPropagation();
        languageDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('open');
        }
    });
    
    // Language translations
    const translations = {
        'ARB': {
            // Navigation
            'nav-about': 'حول',
            'nav-approach': 'نهجنا',
            'nav-services': 'الخدمات',
            'nav-testimonials': 'الشهادات',
            'nav-contact': 'اتصل بنا',
            'get-started': 'ابدأ الآن',
            
            // Hero section
            'hero-title': 'الرعاية الصحية العالمية في متناول يدك',
            'hero-subtitle': 'تواصل مع أطباء عالميين عن بُعد من أي مكان وفي أي وقت.',
            'hero-cta': 'جدولة استشارة',
            
            // About section
            'about-title': 'عن شركة سترايف آند فيت',
            'about-subtitle': 'نحن نسد الفجوات الجغرافية في الرعاية الصحية من خلال حلول التطبيب عن بُعد المبتكرة.',
            'mission-title': 'مهمتنا',
            'mission-text': 'في سترايف آند فيت، نؤمن بأن الرعاية الصحية الجيدة يجب أن تكون متاحة للجميع، بغض النظر عن الموقع. مهمتنا هي ربط المرضى بأفضل المتخصصين الطبيين عالميًا من خلال تقنية التطبيب عن بُعد الآمنة والموثوقة.',
            'story-title': 'قصتنا',
            'story-text': 'تأسست شركة سترايف آند فيت بواسطة فريق من متخصصي الرعاية الصحية وخبراء التكنولوجيا، وُلدت من الرغبة في إزالة الحواجز الجغرافية للوصول إلى الرعاية الصحية وتزويد المرضى بمزيد من الخيارات للرعاية المتخصصة.',
            
            // Approach section
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
            
            // Services section
            'services-title': 'خدماتنا',
            'services-subtitle': 'حلول شاملة للتطبيب عن بُعد للرعاية الصحية العالمية',
            'primary-care': 'الرعاية الأولية',
            'primary-care-text': 'استشارات عامة للأمراض الشائعة والرعاية الوقائية والحفاظ على الصحة.',
            'specialist-consultations': 'استشارات متخصصة',
            'specialist-consultations-text': 'تواصل مع متخصصين في أمراض القلب والجلدية والطب النفسي والمزيد.',
            'second-opinions': 'آراء ثانية',
            'second-opinions-text': 'احصل على وجهات نظر خبراء إضافية حول التشخيصات وخطط العلاج من متخصصين عالميين.',
            'learn-more': 'اعرف المزيد',
            
            // Testimonials section
            'testimonials-title': 'قصص نجاح المرضى',
            'testimonials-subtitle': 'تجارب حقيقية من شبكة المرضى العالمية لدينا',
            
            // Contact section
            'contact-title': 'هل أنت جاهز للوصول إلى الرعاية الصحية العالمية؟',
            'contact-text': 'جدول عرضًا توضيحيًا لمنصتنا أو تحدث مع فريق رعاية المرضى لدينا لمعرفة كيف يمكننا توصيلك بمتخصصين طبيين عالميين.',
            'email-label': 'البريد الإلكتروني',
            'phone-label': 'الهاتف',
            'address-label': 'العنوان',
            'name-label': 'الاسم',
            'message-label': 'الرسالة',
            'send-message': 'إرسال رسالة',
            
            // Footer
            'company': 'الشركة',
            'resources': 'الموارد',
            'connect': 'تواصل',
            'health-blog': 'مدونة الصحة',
            'faq': 'الأسئلة الشائعة',
            'privacy-policy': 'سياسة الخصوصية',
            'terms-of-service': 'شروط الخدمة',
            'copyright': '© 2023 سترايف آند فيت. جميع الحقوق محفوظة.'
        }
    };
    
    // Function to change language
    function changeLanguage(langCode) {
        if (langCode === 'ENG') {
            // Reload the page to get back to English
            window.location.reload();
            return;
        }
        
        if (translations[langCode]) {
            // Change text direction for Arabic
            if (langCode === 'ARB') {
                document.documentElement.setAttribute('dir', 'rtl');
                document.body.classList.add('rtl');
            } else {
                document.documentElement.setAttribute('dir', 'ltr');
                document.body.classList.remove('rtl');
            }
            
            // Update navigation
            document.querySelector('a[href="#about"]').textContent = translations[langCode]['nav-about'];
            document.querySelector('a[href="#approach"]').textContent = translations[langCode]['nav-approach'];
            document.querySelector('a[href="#services"]').textContent = translations[langCode]['nav-services'];
            document.querySelector('a[href="#testimonials"]').textContent = translations[langCode]['nav-testimonials'];
            document.querySelector('a[href="#contact"]').textContent = translations[langCode]['nav-contact'];
            document.querySelector('a.cta-button').textContent = translations[langCode]['get-started'];
            
            // Update hero section
            document.querySelector('.hero h1').textContent = translations[langCode]['hero-title'];
            document.querySelector('.hero p').textContent = translations[langCode]['hero-subtitle'];
            document.querySelector('.hero .cta-button').textContent = translations[langCode]['hero-cta'];
            
            // Update about section
            document.querySelector('#about .section-header h2').textContent = translations[langCode]['about-title'];
            document.querySelector('#about .section-header p').textContent = translations[langCode]['about-subtitle'];
            document.querySelectorAll('.about-text h3')[0].textContent = translations[langCode]['mission-title'];
            document.querySelectorAll('.about-text p')[0].textContent = translations[langCode]['mission-text'];
            document.querySelectorAll('.about-text h3')[1].textContent = translations[langCode]['story-title'];
            document.querySelectorAll('.about-text p')[1].textContent = translations[langCode]['story-text'];
            
            // Update approach section
            document.querySelector('#approach .section-header h2').textContent = translations[langCode]['approach-title'];
            document.querySelector('#approach .section-header p').textContent = translations[langCode]['approach-subtitle'];
            
            const steps = document.querySelectorAll('.step');
            steps[0].querySelector('h3').textContent = translations[langCode]['step1-title'];
            steps[0].querySelector('p').textContent = translations[langCode]['step1-text'];
            steps[1].querySelector('h3').textContent = translations[langCode]['step2-title'];
            steps[1].querySelector('p').textContent = translations[langCode]['step2-text'];
            steps[2].querySelector('h3').textContent = translations[langCode]['step3-title'];
            steps[2].querySelector('p').textContent = translations[langCode]['step3-text'];
            steps[3].querySelector('h3').textContent = translations[langCode]['step4-title'];
            steps[3].querySelector('p').textContent = translations[langCode]['step4-text'];
            
            // Update services section
            document.querySelector('#services .section-header h2').textContent = translations[langCode]['services-title'];
            document.querySelector('#services .section-header p').textContent = translations[langCode]['services-subtitle'];
            
            const services = document.querySelectorAll('.service-card');
            services[0].querySelector('h3').textContent = translations[langCode]['primary-care'];
            services[0].querySelector('p').textContent = translations[langCode]['primary-care-text'];
            services[1].querySelector('h3').textContent = translations[langCode]['specialist-consultations'];
            services[1].querySelector('p').textContent = translations[langCode]['specialist-consultations-text'];
            services[2].querySelector('h3').textContent = translations[langCode]['second-opinions'];
            services[2].querySelector('p').textContent = translations[langCode]['second-opinions-text'];
            
            document.querySelectorAll('.learn-more').forEach(link => {
                link.textContent = translations[langCode]['learn-more'];
            });
            
            // Update testimonials section
            document.querySelector('#testimonials .section-header h2').textContent = translations[langCode]['testimonials-title'];
            document.querySelector('#testimonials .section-header p').textContent = translations[langCode]['testimonials-subtitle'];
            
            // Update contact section
            document.querySelector('.contact-info h2').textContent = translations[langCode]['contact-title'];
            document.querySelector('.contact-info > p').textContent = translations[langCode]['contact-text'];
            
            document.querySelectorAll('.contact-item h4')[0].textContent = translations[langCode]['email-label'];
            document.querySelectorAll('.contact-item h4')[1].textContent = translations[langCode]['phone-label'];
            document.querySelectorAll('.contact-item h4')[2].textContent = translations[langCode]['address-label'];
            
            document.querySelector('label[for="name"]').textContent = translations[langCode]['name-label'];
            document.querySelector('label[for="email"]').textContent = translations[langCode]['email-label'];
            document.querySelector('label[for="phone"]').textContent = translations[langCode]['phone-label'];
            document.querySelector('label[for="message"]').textContent = translations[langCode]['message-label'];
            document.querySelector('.contact-form .cta-button').textContent = translations[langCode]['send-message'];
            
            // Update footer
            document.querySelectorAll('.footer-column h4')[0].textContent = translations[langCode]['company'];
            document.querySelectorAll('.footer-column h4')[1].textContent = translations[langCode]['resources'];
            document.querySelectorAll('.footer-column h4')[2].textContent = translations[langCode]['connect'];
            
            const footerLinks = document.querySelectorAll('.footer-column ul li a');
            footerLinks[4].textContent = translations[langCode]['health-blog'];
            footerLinks[5].textContent = translations[langCode]['faq'];
            footerLinks[6].textContent = translations[langCode]['privacy-policy'];
            footerLinks[7].textContent = translations[langCode]['terms-of-service'];
            
            document.querySelector('.copyright p').textContent = translations[langCode]['copyright'];
        }
    }
    
    // Select language
    languageOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            const langCode = this.getAttribute('data-lang');
            
            // Only change if selecting a different language
            if (selectedLanguageText.textContent !== this.textContent) {
                selectedLanguageText.textContent = this.textContent;
                
                // Change language content
                changeLanguage(langCode);
            }
            
            languageDropdown.classList.remove('open');
        });
    });
});
// Add this to your existing script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Update logo link to maintain language
    function updateLogoLink() {
        const logoLink = document.querySelector('.logo a');
        const currentLang = document.querySelector('.selected-language span').textContent;
        
        if (currentLang === 'العربية') {
            logoLink.href = 'index.html?lang=ARB';
        } else {
            logoLink.href = 'index.html';
        }
    }
    
    // Initial update
    updateLogoLink();
    
    // Update when language changes
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Wait a moment for the language to change
            setTimeout(updateLogoLink, 100);
        });
    });
    
    // Check URL parameters for language on page load
    function getLanguageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('lang');
    }
    
    // Set initial language based on URL parameter
    const urlLang = getLanguageFromURL();
    if (urlLang === 'ARB') {
        // Find and click the Arabic language option
        const arabicOption = document.querySelector('.language-option[data-lang="ARB"]');
        if (arabicOption) {
            arabicOption.click();
        }
    }
});
// Add this to your script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Update the Get Started button to include language parameter
    function updateGetStartedLink() {
        const getStartedBtn = document.querySelector('a.cta-button');
        const currentLang = document.querySelector('.selected-language span').textContent;
        
        if (currentLang === 'العربية') {
            getStartedBtn.href = 'login.html?lang=ARB';
        } else {
            getStartedBtn.href = 'login.html';
        }
    }
    
    // Initial update
    updateGetStartedLink();
    
    // Update when language changes
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Wait a moment for the language to change
            setTimeout(updateGetStartedLink, 100);
        });
    });
});