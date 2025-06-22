/**
 * FAQ Database Loader for A1 PVC Assistant
 * Loads product knowledge and FAQ data
 */

class FAQLoader {
    constructor() {
        this.faqData = [];
        this.productCategories = [];
        this.companyInfo = {};
        this.initialized = false;
    }

    /**
     * Initialize FAQ data with A1 PVC information
     */
    async initialize() {
        if (this.initialized) return;

        console.log('A1: Initializing FAQ Loader...');
        
        // Load static A1 PVC company information
        this.loadCompanyInfo();
        this.loadProductCategories();
        this.loadStaticFAQData();
        
        this.initialized = true;
        console.log('A1: FAQ Loader initialized successfully');
    }

    /**
     * Load company information
     */
    loadCompanyInfo() {
        this.companyInfo = {
            name: 'Özemek Plastik (A1 PVC)',
            established: '1970s',
            experience: '50+ years',
            location: 'Turkey',
            facility: '10,000 m² production facility',
            capacity: '1,000 tons monthly production',
            exportCountries: '50+ countries worldwide',
            website: 'https://a1pvcmarket.com/',
            phone: '0850 888 22 47',
            email: 'info@ozemekplastik.com',
            specialties: [
                'PVC Profile Manufacturing',
                'Edge Banding Systems',
                'Window and Door Systems',
                'Construction Materials'
            ]
        };
    }

    /**
     * Load product categories
     */
    loadProductCategories() {
        this.productCategories = [
            {
                id: 1,
                name: 'Kenar Bandi',
                nameEn: 'Edge Banding',
                description: 'PVC kenar bandı sistemleri',
                applications: ['Furniture', 'Cabinet Making', 'Interior Design']
            },
            {
                id: 2,
                name: 'PVC Profiller',
                nameEn: 'PVC Profiles',
                description: 'Pencere ve kapı sistemleri için PVC profiller',
                applications: ['Windows', 'Doors', 'Construction']
            },
            {
                id: 3,
                name: 'Stor Kapaklari',
                nameEn: 'Blind/Shutter Doors',
                description: 'Stor ve panjur sistemleri',
                applications: ['Window Coverings', 'Privacy Solutions']
            },
            {
                id: 4,
                name: 'Mutfak ve Mobilya Aksesuarlari',
                nameEn: 'Kitchen & Furniture Accessories',
                description: 'Mutfak ve mobilya için aksesuarlar',
                applications: ['Kitchen Design', 'Furniture Manufacturing']
            },
            {
                id: 5,
                name: 'Hotmelt',
                nameEn: 'Hot Melt Adhesives',
                description: 'Sıcak eriyik yapıştırıcılar',
                applications: ['Bonding', 'Sealing', 'Assembly']
            },
            {
                id: 6,
                name: 'Karavan Malzemeleri',
                nameEn: 'Caravan Materials',
                description: 'Karavan ve mobil yapılar için malzemeler',
                applications: ['RV Manufacturing', 'Mobile Homes']
            },
            {
                id: 7,
                name: 'Yapi Kimyasallari',
                nameEn: 'Construction Chemicals',
                description: 'İnşaat sektörü için kimyasal ürünler',
                applications: ['Construction', 'Building Materials']
            },
            {
                id: 8,
                name: 'Yapiskanli Vida Tapalari',
                nameEn: 'Adhesive Screw Plugs',
                description: 'Yapışkanlı vida tıkaçları',
                applications: ['Fastening', 'Mounting Solutions']
            },
            {
                id: 9,
                name: 'Ahsap Kapi Fitilleri',
                nameEn: 'Wooden Door Strips',
                description: 'Ahşap kapı fitilleri ve sızdırmazlık',
                applications: ['Door Sealing', 'Weather Stripping']
            },
            {
                id: 10,
                name: 'Kapi Esik Citalari',
                nameEn: 'Door Threshold Strips',
                description: 'Kapı eşik çıtaları ve geçiş profilleri',
                applications: ['Floor Transitions', 'Door Thresholds']
            }
        ];
    }

    /**
     * Load static FAQ data based on common customer questions
     */
    loadStaticFAQData() {
        this.faqData = [
            {
                question: 'A1 PVC şirketi hakkında bilgi verebilir misiniz?',
                answer: 'Özemek Plastik, 1970\'li yıllarda kurulmuş olup A1 PVC markasıyla 50+ yıllık deneyime sahiptir. 10.000 m² üretim alanında aylık 1.000 ton kapasiteyle üretim yapmakta ve 50\'yi aşkın ülkeye ihracat gerçekleştirmektedir.',
                category: 'company'
            },
            {
                question: 'Hangi ürünleri üretiyorsunuz?',
                answer: 'Ana ürün gruplarımız: PVC Profiller (pencere-kapı sistemleri), Kenar Bandı, Stor Kapakları, Mutfak ve Mobilya Aksesuarları, Hotmelt Yapıştırıcılar, Karavan Malzemeleri, Yapı Kimyasalları, Yapışkanlı Vida Tıkaçları, Ahşap Kapı Fitilleri ve Kapı Eşik Çıtalarıdır.',
                category: 'products'
            },
            {
                question: 'PVC profil çeşitleriniz nelerdir?',
                answer: 'Sert PVC Profil, Yumuşak PVC Kenar Kapama, Süpürgelik PVC Profil, Duşakabin Kapısı ve Baza PVC Aparat gibi geniş bir ürün yelpazesi sunmaktayız.',
                category: 'products'
            },
            {
                question: 'İhracat yapıyor musunuz?',
                answer: 'Evet, 50\'yi aşkın ülkeye ihracat yapmaktayız. Uluslararası kalite standartlarında üretim yaparak global pazarlarda hizmet vermekteyiz.',
                category: 'export'
            },
            {
                question: 'Kalite sertifikalarınız var mı?',
                answer: 'Ürünlerimiz uluslararası kalite standartlarına uygun olarak üretilmekte ve gerekli sertifikalara sahiptir. Detaylı bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.',
                category: 'quality'
            },
            {
                question: 'Müşteri hizmetlerinize nasıl ulaşabilirim?',
                answer: 'Müşteri hizmetlerimize 0850 888 22 47 numaralı telefondan ulaşabilir veya info@ozemekplastik.com adresine e-posta gönderebilirsiniz. Web sitemiz: https://a1pvcmarket.com/',
                category: 'contact'
            },
            {
                question: 'Teknik destek sağlıyor musunuz?',
                answer: 'Evet, ürünlerimizle ilgili teknik destek ve danışmanlık hizmeti sunmaktayız. Uzman ekibimiz projenize en uygun çözümü belirlemenizde yardımcı olur.',
                category: 'support'
            },
            {
                question: 'Minimum sipariş miktarınız nedir?',
                answer: 'Minimum sipariş miktarları ürün grubuna göre değişmektedir. Detaylı bilgi için satış temsilcilerimizle iletişime geçmenizi öneriyoruz.',
                category: 'orders'
            }
        ];
    }

    /**
     * Search FAQ data
     */
    searchFAQ(query) {
        if (!query || query.trim().length < 2) return [];

        const searchTerms = query.toLowerCase().trim().split(' ');
        
        return this.faqData.filter(faq => {
            const combinedText = (faq.question + ' ' + faq.answer + ' ' + faq.category).toLowerCase();
            return searchTerms.some(term => combinedText.includes(term));
        });
    }

    /**
     * Get FAQ by category
     */
    getFAQByCategory(category) {
        return this.faqData.filter(faq => faq.category === category);
    }

    /**
     * Get all product categories
     */
    getProductCategories() {
        return this.productCategories;
    }

    /**
     * Get company information
     */
    getCompanyInfo() {
        return this.companyInfo;
    }

    /**
     * Get formatted context for AI
     */
    getAIContext() {
        const companyContext = `
ŞIRKET BİLGİLERİ:
${this.companyInfo.name} - ${this.companyInfo.experience} deneyim
Lokasyon: ${this.companyInfo.location}
Üretim: ${this.companyInfo.facility}, ${this.companyInfo.capacity}
İhracat: ${this.companyInfo.exportCountries}
İletişim: ${this.companyInfo.phone} | ${this.companyInfo.website}
`;

        const productContext = `
ÜRÜN KATEGORİLERİ:
${this.productCategories.map((cat, index) => 
    `${index + 1}. ${cat.name} (${cat.nameEn}): ${cat.description}`
).join('\n')}
`;

        const faqContext = `
SIK SORULAN SORULAR:
${this.faqData.map(faq => 
    `S: ${faq.question}\nC: ${faq.answer}`
).join('\n\n')}
`;

        return companyContext + '\n' + productContext + '\n' + faqContext;
    }

    /**
     * Get summary statistics
     */
    getStats() {
        return {
            totalFAQs: this.faqData.length,
            totalCategories: this.productCategories.length,
            totalProductTypes: this.productCategories.length,
            isInitialized: this.initialized
        };
    }
}

// Create and export singleton instance
const faqLoader = new FAQLoader();

// Make it globally accessible
window.faqLoader = faqLoader;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = faqLoader;
}