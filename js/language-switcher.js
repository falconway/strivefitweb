document.addEventListener('DOMContentLoaded', function() {
    const translations = {
        'ENG': {
            'dashboard-title': 'Medical Records Dashboard',
            'account-label': 'Account:',
            'logout': 'Logout',
            'upload-documents': 'Upload Documents',
            'upload-title': 'Upload Medical Documents',
            'upload-subtitle': 'Drag and drop files here or click to browse',
            'documents-title': 'Your Documents',
            'search-placeholder': 'Search documents...',
            'last-updated': 'Last updated:',
            'selected-count': '{0} selected',
            'doc-count': '{0} documents',
            'download-selected': 'Download Selected',
            'delete-selected': 'Delete Selected',
            'process-selected': 'Process Selected',
            'table-header-name': 'Name',
            'table-header-date': 'Date Uploaded',
            'table-header-status': 'Status',
            'table-header-actions': 'Actions',
            'loading-documents': 'Loading documents...',
            'no-document-selected': 'No document selected',
            'select-document-to-view': 'Select a document to view',
            'view-original': 'Original',
            'view-processed': 'Processed',
            'view-translated': 'Translated',
        },
        'CHN': {
            'dashboard-title': '医疗记录仪表板',
            'account-label': '账户:',
            'logout': '登出',
            'upload-documents': '上传文件',
            'upload-title': '上传医疗文件',
            'upload-subtitle': '将文件拖放到此处或点击浏览',
            'documents-title': '您的文件',
            'search-placeholder': '搜索文件...',
            'last-updated': '最后更新:',
            'selected-count': '已选择 {0} 个',
            'doc-count': '{0} 个文件',
            'download-selected': '下载所选',
            'delete-selected': '删除所选',
            'process-selected': '处理所选',
            'table-header-name': '名称',
            'table-header-date': '上传日期',
            'table-header-status': '状态',
            'table-header-actions': '操作',
            'loading-documents': '正在加载文件...',
            'no-document-selected': '未选择文件',
            'select-document-to-view': '选择要查看的文件',
            'view-original': '原文',
            'view-processed': '已处理',
            'view-translated': '译文',
        },
        'ARB': {
            'dashboard-title': 'لوحة تحكم السجلات الطبية',
            'account-label': 'الحساب:',
            'logout': 'تسجيل الخروج',
            'upload-documents': 'تحميل المستندات',
            'upload-title': 'تحميل المستندات الطبية',
            'upload-subtitle': 'اسحب وأفلت الملفات هنا أو انقر للتصفح',
            'documents-title': 'مستنداتك',
            'search-placeholder': 'ابحث في المستندات...',
            'last-updated': 'آخر تحديث:',
            'selected-count': 'تم تحديد {0}',
            'doc-count': '{0} مستندات',
            'download-selected': 'تنزيل المحدد',
            'delete-selected': 'حذف المحدد',
            'process-selected': 'معالجة المحدد',
            'table-header-name': 'الاسم',
            'table-header-date': 'تاريخ التحميل',
            'table-header-status': 'الحالة',
            'table-header-actions': 'الإجراءات',
            'loading-documents': 'جاري تحميل المستندات...',
            'no-document-selected': 'لم يتم تحديد أي مستند',
            'select-document-to-view': 'حدد مستندًا لعرضه',
            'view-original': 'الأصلي',
            'view-processed': 'معالج',
            'view-translated': 'مترجم',
        }
    };

    function setLanguage(lang) {
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
                selectedLanguageSpan.textContent = option.textContent;
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