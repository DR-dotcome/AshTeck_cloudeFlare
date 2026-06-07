(function () {
  const adminTokenKey = "straitsec-admin-token";
  const languageKey = "straitsec-language";
  const supportedLanguages = ["en", "fr", "ar"];
  const languageLabels = {
    en: "English",
    fr: "Français",
    ar: "العربية"
  };
  const dateLocales = {
    en: undefined,
    fr: "fr-FR",
    ar: "ar-MA"
  };
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  let currentLanguage = normalizeLanguage(localStorage.getItem(languageKey) || "en");
  let originalDocumentTitle = "";
  const adminState = {
    messagesPage: 1,
    quotesPage: 1,
    limit: 6,
    search: "",
    preferredLanguage: "",
    service: "",
    messagesTotalPages: 1,
    quotesTotalPages: 1
  };

  const translations = {
    "StraitSec | IT Services, Digital Infrastructure & Cybersecurity": {
      fr: "StraitSec | Services IT, infrastructure digitale et cybersécurité",
      ar: "StraitSec | خدمات تقنية المعلومات والبنية الرقمية والأمن السيبراني"
    },
    "StraitSec | IT Services, Networks, CCTV and Cybersecurity": {
      fr: "StraitSec | Services IT, réseaux, CCTV et cybersécurité",
      ar: "StraitSec | خدمات تقنية المعلومات والشبكات والكاميرات والأمن السيبراني"
    },
    "Services | StraitSec": {
      fr: "Services | StraitSec",
      ar: "الخدمات | StraitSec"
    },
    "Solutions | StraitSec": {
      fr: "Solutions | StraitSec",
      ar: "الحلول | StraitSec"
    },
    "Projects | StraitSec": {
      fr: "Projets | StraitSec",
      ar: "المشاريع | StraitSec"
    },
    "Contact | StraitSec": {
      fr: "Contact | StraitSec",
      ar: "اتصل بنا | StraitSec"
    },
    "Admin | StraitSec": {
      fr: "Administration | StraitSec",
      ar: "الإدارة | StraitSec"
    },
    "IT Services, Digital Infrastructure & Cybersecurity": {
      fr: "Services IT, infrastructure digitale et cybersécurité",
      ar: "خدمات تقنية المعلومات والبنية الرقمية والأمن السيبراني"
    },
    "IT Services": {
      fr: "Services IT",
      ar: "خدمات تقنية المعلومات"
    },
    "Home": {
      fr: "Accueil",
      ar: "الرئيسية"
    },
    "Services": {
      fr: "Services",
      ar: "الخدمات"
    },
    "Solutions": {
      fr: "Solutions",
      ar: "الحلول"
    },
    "Projects": {
      fr: "Projets",
      ar: "المشاريع"
    },
    "Contact": {
      fr: "Contact",
      ar: "اتصل بنا"
    },
    "Admin": {
      fr: "Admin",
      ar: "الإدارة"
    },
    "Open navigation": {
      fr: "Ouvrir la navigation",
      ar: "فتح القائمة"
    },
    "StraitSec home": {
      fr: "Accueil StraitSec",
      ar: "الرئيسية StraitSec"
    },
    "Networks • CCTV • Cybersecurity • Maintenance": {
      fr: "Réseaux • CCTV • Cybersécurité • Maintenance",
      ar: "الشبكات • كاميرات المراقبة • الأمن السيبراني • الصيانة"
    },
    "StraitSec": {
      fr: "StraitSec",
      ar: "StraitSec"
    },
    "IT Services, Digital Infrastructure & Cybersecurity for businesses, shops, schools, offices, and homes.": {
      fr: "Services IT, infrastructure digitale et cybersécurité pour entreprises, commerces, écoles, bureaux et maisons.",
      ar: "خدمات تقنية المعلومات والبنية الرقمية والأمن السيبراني للشركات والمتاجر والمدارس والمكاتب والمنازل."
    },
    "Reliable infrastructure, secure cameras, optimized Wi-Fi, and practical IT support for businesses, shops, schools, offices, and homes.": {
      fr: "Infrastructure fiable, caméras sécurisées, Wi-Fi optimisé et support informatique pratique pour entreprises, commerces, écoles, bureaux et maisons.",
      ar: "بنية تحتية موثوقة، كاميرات آمنة، واي فاي محسّن، ودعم تقني عملي للشركات والمتاجر والمدارس والمكاتب والمنازل."
    },
    "Réseaux fiables, sécurité claire, support rapide.": {
      fr: "Réseaux fiables, sécurité claire, support rapide.",
      ar: "شبكات موثوقة، أمان واضح، ودعم سريع."
    },
    "Reliable networks, clear security, fast support.": {
      fr: "Réseaux fiables, sécurité claire, support rapide.",
      ar: "شبكات موثوقة، أمان واضح، ودعم سريع."
    },
    "شبكات مستقرة، كاميرات مراقبة، وحماية أساسية باحتراف.": {
      fr: "Réseaux stables, caméras de surveillance et protection de base avec professionnalisme.",
      ar: "شبكات مستقرة، كاميرات مراقبة، وحماية أساسية باحتراف."
    },
    "Request Quote": {
      fr: "Demander un devis",
      ar: "اطلب عرض سعر"
    },
    "Contact Us": {
      fr: "Contactez-nous",
      ar: "اتصل بنا"
    },
    "3": {
      fr: "3",
      ar: "3"
    },
    "Languages": {
      fr: "Langues",
      ar: "اللغات"
    },
    "8": {
      fr: "8",
      ar: "8"
    },
    "7+": {
      fr: "7+",
      ar: "+7"
    },
    "Core services": {
      fr: "Services clés",
      ar: "خدمات أساسية"
    },
    "SMB": {
      fr: "PME",
      ar: "الأعمال الصغيرة"
    },
    "Ready support": {
      fr: "Support prêt",
      ar: "دعم جاهز"
    },
    "StraitSec trust commitments": {
      fr: "Engagements de confiance StraitSec",
      ar: "\u0627\u0644\u062a\u0632\u0627\u0645\u0627\u062a \u0627\u0644\u062b\u0642\u0629 \u0645\u0646 StraitSec"
    },
    "Documented handover": {
      fr: "Livraison documentee",
      ar: "\u062a\u0633\u0644\u064a\u0645 \u0645\u0648\u062b\u0642"
    },
    "Secure network design": {
      fr: "Conception reseau securisee",
      ar: "\u062a\u0635\u0645\u064a\u0645 \u0634\u0628\u0643\u0629 \u0622\u0645\u0646"
    },
    "Backup-aware planning": {
      fr: "Planification orientee sauvegarde",
      ar: "\u062a\u062e\u0637\u064a\u0637 \u064a\u0631\u0627\u0639\u064a \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a"
    },
    "Practical cyber guidance": {
      fr: "Conseils cyber pratiques",
      ar: "\u0625\u0631\u0634\u0627\u062f\u0627\u062a \u0633\u064a\u0628\u0631\u0627\u0646\u064a\u0629 \u0639\u0645\u0644\u064a\u0629"
    },
    "Core Services": {
      fr: "Services principaux",
      ar: "الخدمات الرئيسية"
    },
    "Clean installations for connected, protected spaces": {
      fr: "Installations propres pour espaces connectés et protégés",
      ar: "تركيبات منظمة لمساحات متصلة ومحمية"
    },
    "Clean installations for connected spaces": {
      fr: "Installations propres pour espaces connectés",
      ar: "تركيبات منظمة للمساحات المتصلة"
    },
    "StraitSec builds and maintains practical IT systems that stay organized, secure, documented, and easy to support.": {
      fr: "StraitSec installe et maintient des systèmes IT pratiques, organisés, sécurisés, documentés et faciles à supporter.",
      ar: "تقوم StraitSec ببناء وصيانة أنظمة تقنية عملية تبقى منظمة وآمنة وموثقة وسهلة الدعم."
    },
    "StraitSec builds and maintains practical IT systems that stay organized, secure, and easy to support.": {
      fr: "StraitSec installe et maintient des systèmes IT pratiques, organisés, sécurisés et faciles à supporter.",
      ar: "تقوم StraitSec ببناء وصيانة أنظمة تقنية عملية تبقى منظمة وآمنة وسهلة الدعم."
    },
    "Network Installation": {
      fr: "Installation réseau",
      ar: "تركيب الشبكات"
    },
    "Structured cabling, rack cleanup, LAN planning, and dependable connectivity from the first cable to final test.": {
      fr: "Câblage structuré, organisation de baie, planification LAN et connectivité fiable du premier câble au test final.",
      ar: "كابلات منظمة، ترتيب الراك، تخطيط الشبكة المحلية، واتصال موثوق من أول كابل حتى الاختبار النهائي."
    },
    "CCTV/IP Cameras": {
      fr: "Caméras CCTV/IP",
      ar: "كاميرات CCTV/IP"
    },
    "CCTV / IP Camera Systems": {
      fr: "Systèmes de caméras CCTV / IP",
      ar: "أنظمة كاميرات CCTV / IP"
    },
    "Indoor and outdoor camera coverage, NVR recording, mobile access, and separation from business traffic when possible.": {
      fr: "Couverture intérieure et extérieure, enregistrement NVR, accès mobile et séparation du trafic métier lorsque c'est possible.",
      ar: "تغطية كاميرات داخلية وخارجية وتسجيل NVR ووصول عبر الهاتف وفصلها عن حركة العمل عند الإمكان."
    },
    "Camera placement, NVR setup, remote viewing, and coverage designed for real security needs.": {
      fr: "Positionnement des caméras, configuration NVR, consultation à distance et couverture pensée pour les besoins réels de sécurité.",
      ar: "تحديد أماكن الكاميرات، إعداد NVR، المشاهدة عن بعد، وتغطية مناسبة لاحتياجات الأمان الحقيقية."
    },
    "Wi-Fi Optimization": {
      fr: "Optimisation Wi-Fi",
      ar: "تحسين الواي فاي"
    },
    "Router & Switch Configuration": {
      fr: "Configuration routeur et switch",
      ar: "إعداد الراوتر والسويتش"
    },
    "Router hardening, VLAN planning, firmware updates, port labeling, and clean switch documentation.": {
      fr: "Renforcement du routeur, planification VLAN, mises à jour firmware, étiquetage des ports et documentation claire des switchs.",
      ar: "تقوية الراوتر وتخطيط VLAN وتحديثات البرامج الثابتة وتسمية المنافذ وتوثيق السويتش بوضوح."
    },
    "Signal mapping, access point placement, guest networks, and better performance in busy environments.": {
      fr: "Analyse du signal, placement des points d'accès, réseaux invités et meilleure performance dans les environnements chargés.",
      ar: "تحليل الإشارة، وضع نقاط الوصول، شبكات الضيوف، وأداء أفضل في الأماكن المزدحمة."
    },
    "Basic Cybersecurity": {
      fr: "Cybersécurité de base",
      ar: "أمن سيبراني أساسي"
    },
    "Basic Cybersecurity Audit & Recommendations": {
      fr: "Audit cybersécurité de base et recommandations",
      ar: "تدقيق أمن سيبراني أساسي وتوصيات"
    },
    "Practical checks for networks, devices, accounts, Wi-Fi, backups, and common risks with clear next steps.": {
      fr: "Vérifications pratiques des réseaux, appareils, comptes, Wi-Fi, sauvegardes et risques courants avec prochaines étapes claires.",
      ar: "فحوصات عملية للشبكات والأجهزة والحسابات والواي فاي والنسخ الاحتياطي والمخاطر الشائعة مع خطوات واضحة."
    },
    "Router hardening, password review, updates, backups, and clear recommendations for safer daily operations.": {
      fr: "Renforcement du routeur, vérification des mots de passe, mises à jour, sauvegardes et recommandations claires pour un usage quotidien plus sûr.",
      ar: "تقوية إعدادات الراوتر، مراجعة كلمات المرور، التحديثات، النسخ الاحتياطي، وتوصيات واضحة لاستخدام يومي أكثر أمانا."
    },
    "Explore all services": {
      fr: "Voir tous les services",
      ar: "استكشف كل الخدمات"
    },
    "Why choose StraitSec?": {
      fr: "Pourquoi choisir StraitSec ?",
      ar: "لماذا تختار StraitSec؟"
    },
    "Why Choose StraitSec": {
      fr: "Pourquoi choisir StraitSec",
      ar: "لماذا StraitSec"
    },
    "Built for small businesses that need reliable IT, secure networks, and practical cybersecurity guidance.": {
      fr: "Conçu pour les petites entreprises qui ont besoin d'un IT fiable, de réseaux sécurisés et de conseils cybersécurité pratiques.",
      ar: "مصمم للشركات الصغيرة التي تحتاج إلى تقنية موثوقة وشبكات آمنة وإرشادات أمن سيبراني عملية."
    },
    "Premium service without enterprise complexity": {
      fr: "Service premium sans complexité d'entreprise",
      ar: "خدمة احترافية بدون تعقيد المؤسسات الكبيرة"
    },
    "We focus on clean diagnostics, careful installation, clear documentation, and recommendations you can actually use.": {
      fr: "Nous privilégions un diagnostic propre, une installation soignée, une documentation claire et des recommandations réellement utiles.",
      ar: "نركز على تشخيص واضح وتركيب دقيق وتوثيق مفهوم وتوصيات عملية قابلة للتطبيق."
    },
    "We focus on clear diagnostics, careful installation, and documentation that makes future maintenance simpler.": {
      fr: "Nous misons sur un diagnostic clair, une installation soignée et une documentation qui simplifie la maintenance future.",
      ar: "نركز على تشخيص واضح، تركيب دقيق، وتوثيق يجعل الصيانة المستقبلية أسهل."
    },
    "Reliable IT support": {
      fr: "Support IT fiable",
      ar: "دعم تقني موثوق"
    },
    "Monthly or on-demand support for slow systems, unstable networks, and practical everyday issues.": {
      fr: "Support mensuel ou à la demande pour systèmes lents, réseaux instables et problèmes pratiques du quotidien.",
      ar: "دعم شهري أو عند الطلب للأنظمة البطيئة والشبكات غير المستقرة والمشاكل اليومية العملية."
    },
    "Secure network setup": {
      fr: "Configuration réseau sécurisée",
      ar: "إعداد شبكة آمنة"
    },
    "Router hardening, VLAN planning, camera separation, guest Wi-Fi, and safer access habits.": {
      fr: "Renforcement routeur, planification VLAN, séparation caméras, Wi-Fi invité et habitudes d'accès plus sûres.",
      ar: "تقوية الراوتر وتخطيط VLAN وفصل الكاميرات وواي فاي الضيوف وعادات وصول أكثر أمانا."
    },
    "Clear documentation": {
      fr: "Documentation claire",
      ar: "توثيق واضح"
    },
    "Network maps, port labels, handover notes, and practical records for future maintenance.": {
      fr: "Cartes réseau, étiquettes de ports, notes de livraison et dossiers pratiques pour la maintenance future.",
      ar: "خرائط شبكة وتسميات منافذ وملاحظات تسليم وسجلات عملية للصيانة المستقبلية."
    },
    "Practical cybersecurity recommendations": {
      fr: "Recommandations cybersécurité pratiques",
      ar: "توصيات أمن سيبراني عملية"
    },
    "Simple, prioritized guidance for passwords, updates, backups, phishing risks, and safer workflows.": {
      fr: "Conseils simples et priorisés pour mots de passe, mises à jour, sauvegardes, phishing et processus plus sûrs.",
      ar: "إرشادات بسيطة ومرتبة للأولويات حول كلمات المرور والتحديثات والنسخ الاحتياطي ومخاطر التصيد وسير عمل أكثر أمانا."
    },
    "Cloud-ready and backup-aware solutions": {
      fr: "Solutions prêtes pour le cloud et conscientes des sauvegardes",
      ar: "حلول جاهزة للسحابة ومراعية للنسخ الاحتياطي"
    },
    "Backup planning, file organization, restore checks, and sensible cloud options for critical data.": {
      fr: "Planification des sauvegardes, organisation des fichiers, tests de restauration et options cloud raisonnables pour les données critiques.",
      ar: "تخطيط النسخ الاحتياطي وتنظيم الملفات وفحوصات الاسترجاع وخيارات سحابية مناسبة للبيانات المهمة."
    },
    "Clean physical work": {
      fr: "Travail physique propre",
      ar: "عمل ميداني منظم"
    },
    "Cables, racks, cameras, and access points are installed neatly with future service in mind.": {
      fr: "Câbles, baies, caméras et points d'accès sont installés proprement pour faciliter les interventions futures.",
      ar: "يتم تركيب الكابلات والراك والكاميرات ونقاط الوصول بشكل منظم مع مراعاة الصيانة مستقبلا."
    },
    "Clear multilingual communication": {
      fr: "Communication multilingue claire",
      ar: "تواصل واضح بعدة لغات"
    },
    "English, français, والعربية for smoother planning, support, and handover.": {
      fr: "English, français et العربية pour une planification, un support et une remise plus fluides.",
      ar: "English وfrançais والعربية لتخطيط ودعم وتسليم أكثر سلاسة."
    },
    "English, French, and Arabic for smoother planning, support, and handover.": {
      fr: "Anglais, français et arabe pour une planification, un support et une remise plus fluides.",
      ar: "الإنجليزية والفرنسية والعربية لتخطيط ودعم وتسليم أكثر سلاسة."
    },
    "Security by default": {
      fr: "Sécurité par défaut",
      ar: "الأمان من البداية"
    },
    "Network separation, strong credentials, firmware checks, and backup basics are part of the conversation.": {
      fr: "Séparation réseau, identifiants solides, vérification du firmware et bases de sauvegarde font partie du travail.",
      ar: "فصل الشبكات، كلمات مرور قوية، فحص التحديثات، وأساسيات النسخ الاحتياطي جزء من الخدمة."
    },
    "Practical maintenance": {
      fr: "Maintenance pratique",
      ar: "صيانة عملية"
    },
    "We keep systems understandable, documented, and ready for quick troubleshooting.": {
      fr: "Nous gardons les systèmes compréhensibles, documentés et prêts pour un dépannage rapide.",
      ar: "نحافظ على الأنظمة واضحة وموثقة وجاهزة للتشخيص السريع."
    },
    "Process": {
      fr: "Processus",
      ar: "طريقة العمل"
    },
    "From site visit to stable operation": {
      fr: "De la visite du site au fonctionnement stable",
      ar: "من زيارة الموقع إلى تشغيل مستقر"
    },
    "A predictable workflow keeps projects calm, transparent, and easy to approve.": {
      fr: "Une méthode claire rend les projets plus calmes, transparents et faciles à valider.",
      ar: "طريقة عمل واضحة تجعل المشاريع أكثر هدوءا وشفافية وسهولة في الموافقة."
    },
    "Discovery": {
      fr: "Analyse",
      ar: "الاستكشاف"
    },
    "We review the space, users, current equipment, risks, and what the network needs to support.": {
      fr: "Nous analysons l'espace, les utilisateurs, l'équipement existant, les risques et les besoins réseau.",
      ar: "نراجع المكان والمستخدمين والمعدات الحالية والمخاطر وما تحتاج الشبكة إلى دعمه."
    },
    "Design": {
      fr: "Conception",
      ar: "التصميم"
    },
    "You receive a clear plan covering hardware, cabling, cameras, Wi-Fi zones, and security basics.": {
      fr: "Vous recevez un plan clair couvrant matériel, câblage, caméras, zones Wi-Fi et bases de sécurité.",
      ar: "تحصل على خطة واضحة تشمل الأجهزة والكابلات والكاميرات ومناطق الواي فاي وأساسيات الأمان."
    },
    "Installation": {
      fr: "Installation",
      ar: "التركيب"
    },
    "We configure routers, switches, cameras, access points, backups, and test the full path end to end.": {
      fr: "Nous configurons routeurs, switches, caméras, points d'accès, sauvegardes et testons l'ensemble de bout en bout.",
      ar: "نقوم بإعداد الراوترات والسويتشات والكاميرات ونقاط الوصول والنسخ الاحتياطي واختبار كل شيء من البداية للنهاية."
    },
    "Handover": {
      fr: "Remise",
      ar: "التسليم"
    },
    "We provide passwords, diagrams, support notes, maintenance recommendations, and next-step options.": {
      fr: "Nous fournissons mots de passe, schémas, notes de support, recommandations de maintenance et prochaines étapes.",
      ar: "نوفر كلمات المرور والمخططات وملاحظات الدعم وتوصيات الصيانة وخيارات الخطوات التالية."
    },
    "Testimonials": {
      fr: "Témoignages",
      ar: "آراء العملاء"
    },
    "Trusted by local teams and families": {
      fr: "Apprécié par les équipes locales et les familles",
      ar: "ثقة الفرق المحلية والعائلات"
    },
    "“Our shop Wi-Fi and camera system finally feel stable. The installation was clean and the explanation was simple.”": {
      fr: "« Le Wi-Fi et les caméras de notre magasin sont enfin stables. L'installation était propre et l'explication simple. »",
      ar: "« أصبح واي فاي المحل ونظام الكاميرات مستقرين أخيرا. التركيب كان منظما والشرح بسيطا. »"
    },
    "Retail shop owner": {
      fr: "Propriétaire de commerce",
      ar: "صاحب متجر"
    },
    "“StraitSec organized the school lab network, separated guest access, and gave us clear documentation.”": {
      fr: "« StraitSec a organisé le réseau du laboratoire, séparé l'accès invité et fourni une documentation claire. »",
      ar: "« نظمت StraitSec شبكة مختبر المدرسة، وفصلت وصول الضيوف، وقدمت توثيقا واضحا. »"
    },
    "School administrator": {
      fr: "Administrateur scolaire",
      ar: "مسؤول مدرسة"
    },
    "“La connexion est plus rapide, les caméras sont accessibles à distance, et le support est très réactif.”": {
      fr: "« La connexion est plus rapide, les caméras sont accessibles à distance, et le support est très réactif. »",
      ar: "« الاتصال أصبح أسرع، والكاميرات متاحة عن بعد، والدعم سريع الاستجابة. »"
    },
    "Office manager": {
      fr: "Responsable de bureau",
      ar: "مدير مكتب"
    },
    "FAQ": {
      fr: "FAQ",
      ar: "الأسئلة الشائعة"
    },
    "Common questions": {
      fr: "Questions fréquentes",
      ar: "أسئلة شائعة"
    },
    "Do you work with homes as well as businesses?": {
      fr: "Travaillez-vous avec les maisons et les entreprises ?",
      ar: "هل تعملون مع المنازل والشركات؟"
    },
    "Yes. StraitSec supports small businesses, shops, schools, offices, and homes with scaled solutions.": {
      fr: "Oui. StraitSec accompagne petites entreprises, commerces, écoles, bureaux et maisons avec des solutions adaptées.",
      ar: "نعم. تدعم StraitSec الشركات الصغيرة والمتاجر والمدارس والمكاتب والمنازل بحلول مناسبة للحجم."
    },
    "Can you improve an existing network?": {
      fr: "Pouvez-vous améliorer un réseau existant ?",
      ar: "هل يمكنكم تحسين شبكة موجودة؟"
    },
    "Yes. We audit current cabling, router settings, switches, Wi-Fi coverage, and security basics before recommending changes.": {
      fr: "Oui. Nous auditons câblage, réglages routeur, switches, couverture Wi-Fi et sécurité de base avant de recommander des changements.",
      ar: "نعم. نراجع الكابلات وإعدادات الراوتر والسويتشات وتغطية الواي فاي وأساسيات الأمان قبل اقتراح التغييرات."
    },
    "Do you configure CCTV remote viewing?": {
      fr: "Configurez-vous la visualisation CCTV à distance ?",
      ar: "هل تقومون بإعداد مشاهدة الكاميرات عن بعد؟"
    },
    "Yes. We configure IP cameras, NVR access, mobile viewing, and basic account security where supported by the equipment.": {
      fr: "Oui. Nous configurons caméras IP, accès NVR, visualisation mobile et sécurité de compte selon l'équipement.",
      ar: "نعم. نعد كاميرات IP ووصول NVR والمشاهدة من الهاتف وأمان الحسابات الأساسي حسب دعم الأجهزة."
    },
    "Can you provide support in Arabic or French?": {
      fr: "Pouvez-vous fournir le support en arabe ou en français ?",
      ar: "هل يمكنكم تقديم الدعم بالعربية أو الفرنسية؟"
    },
    "Yes. We can communicate in English, French, and Arabic for planning, installation, and support.": {
      fr: "Oui. Nous pouvons communiquer en anglais, français et arabe pour la planification, l'installation et le support.",
      ar: "نعم. يمكننا التواصل بالإنجليزية والفرنسية والعربية للتخطيط والتركيب والدعم."
    },
    "Ready to upgrade?": {
      fr: "Prêt à améliorer votre installation ?",
      ar: "جاهز للتطوير؟"
    },
    "Tell StraitSec what you need connected, protected, or repaired.": {
      fr: "Dites à StraitSec ce que vous voulez connecter, protéger ou réparer.",
      ar: "أخبر StraitSec بما تحتاج إلى ربطه أو حمايته أو إصلاحه."
    },
    "Network installation, CCTV, Wi-Fi, maintenance, and basic cybersecurity for practical daily operations.": {
      fr: "Installation réseau, CCTV, Wi-Fi, maintenance et cybersécurité de base pour les opérations quotidiennes.",
      ar: "تركيب الشبكات والكاميرات والواي فاي والصيانة والأمن السيبراني الأساسي للعمل اليومي."
    },
    "IT services, digital infrastructure, camera systems, backups, training, and practical cybersecurity guidance.": {
      fr: "Services IT, infrastructure digitale, systemes de cameras, sauvegardes, formation et conseils cybersecurite pratiques.",
      ar: "\u062e\u062f\u0645\u0627\u062a \u062a\u0642\u0646\u064a\u0629 \u0648\u0628\u0646\u064a\u0629 \u0631\u0642\u0645\u064a\u0629 \u0648\u0623\u0646\u0638\u0645\u0629 \u0643\u0627\u0645\u064a\u0631\u0627\u062a \u0648\u0646\u0633\u062e \u0627\u062d\u062a\u064a\u0627\u0637\u064a \u0648\u062a\u062f\u0631\u064a\u0628 \u0648\u0625\u0631\u0634\u0627\u062f\u0627\u062a \u0623\u0645\u0646 \u0633\u064a\u0628\u0631\u0627\u0646\u064a \u0639\u0645\u0644\u064a\u0629."
    },
    "Pages": {
      fr: "Pages",
      ar: "الصفحات"
    },
    "Phone: +212 600 000 000": {
      fr: "Téléphone : +212 600 000 000",
      ar: "الهاتف: +212 600 000 000"
    },
    "Email: contact@straitsec.example": {
      fr: "Email : contact@straitsec.example",
      ar: "البريد: contact@straitsec.example"
    },
    "خدمة محلية ودعم عن بعد": {
      fr: "Service local et support à distance",
      ar: "خدمة محلية ودعم عن بعد"
    },
    "© 2026 StraitSec. All rights reserved.": {
      fr: "© 2026 StraitSec. Tous droits réservés.",
      ar: "© 2026 StraitSec. جميع الحقوق محفوظة."
    },
    "IT infrastructure services built for reliability": {
      fr: "Services d'infrastructure informatique conçus pour la fiabilité",
      ar: "خدمات بنية تحتية تقنية مصممة للاعتمادية"
    },
    "Installation, configuration, maintenance, and practical security support across homes and organizations.": {
      fr: "Installation, configuration, maintenance et support de sécurité pratique pour maisons et organisations.",
      ar: "تركيب وإعداد وصيانة ودعم أمني عملي للمنازل والمؤسسات."
    },
    "Network installation and simple security.": {
      fr: "Installation réseau et sécurité simple.",
      ar: "تركيب الشبكات وأمان بسيط."
    },
    "Installation réseau et sécurité simple.": {
      fr: "Installation réseau et sécurité simple.",
      ar: "تركيب شبكات وأمان بسيط."
    },
    "تركيب الشبكات والكاميرات وتحسين الأداء.": {
      fr: "Installation de réseaux, caméras et optimisation des performances.",
      ar: "تركيب الشبكات والكاميرات وتحسين الأداء."
    },
    "Structured cabling, rack organization, patch panels, LAN design, labeling, and testing for stable daily use.": {
      fr: "Câblage structuré, organisation de baie, panneaux de brassage, conception LAN, étiquetage et tests pour un usage stable.",
      ar: "كابلات منظمة، ترتيب الراك، لوحات توزيع، تصميم LAN، تسمية واختبار لاستخدام يومي مستقر."
    },
    "Ethernet cabling and wall outlets": {
      fr: "Câblage Ethernet et prises murales",
      ar: "كابلات إيثرنت ومخارج حائط"
    },
    "Small rack and cabinet setup": {
      fr: "Installation de petites baies et armoires",
      ar: "إعداد راك أو خزانة صغيرة"
    },
    "Network map and handover notes": {
      fr: "Plan réseau et notes de remise",
      ar: "خريطة الشبكة وملاحظات التسليم"
    },
    "Router & Switch Configuration": {
      fr: "Configuration routeur et switch",
      ar: "إعداد الراوتر والسويتش"
    },
    "Professional setup for routers, managed switches, VLANs, guest networks, firewall basics, and access policies.": {
      fr: "Configuration professionnelle des routeurs, switches administrables, VLAN, réseaux invités, bases firewall et règles d'accès.",
      ar: "إعداد احترافي للراوترات والسويتشات المدارة وVLAN وشبكات الضيوف وأساسيات الجدار الناري وسياسات الوصول."
    },
    "Router hardening and updates": {
      fr: "Renforcement et mises à jour du routeur",
      ar: "تقوية الراوتر وتحديثه"
    },
    "VLAN planning for staff, guests, cameras, and POS": {
      fr: "Planification VLAN pour personnel, invités, caméras et caisse",
      ar: "تخطيط VLAN للموظفين والضيوف والكاميرات ونقاط البيع"
    },
    "Port labeling and switch documentation": {
      fr: "Étiquetage des ports et documentation du switch",
      ar: "تسمية المنافذ وتوثيق السويتش"
    },
    "IP camera installation, camera placement, NVR configuration, remote access, storage planning, and account security.": {
      fr: "Installation de caméras IP, positionnement, configuration NVR, accès à distance, stockage et sécurité des comptes.",
      ar: "تركيب كاميرات IP، تحديد الأماكن، إعداد NVR، الوصول عن بعد، تخطيط التخزين، وأمان الحسابات."
    },
    "Indoor and outdoor camera coverage": {
      fr: "Couverture intérieure et extérieure",
      ar: "تغطية كاميرات داخلية وخارجية"
    },
    "NVR recording and mobile access": {
      fr: "Enregistrement NVR et accès mobile",
      ar: "تسجيل NVR ووصول من الهاتف"
    },
    "Camera network separation when possible": {
      fr: "Séparation du réseau caméras si possible",
      ar: "فصل شبكة الكاميرات عند الإمكان"
    },
    "Signal checks, channel planning, access point placement, mesh tuning, and better roaming for busy rooms.": {
      fr: "Contrôle du signal, choix des canaux, placement des points d'accès, réglage mesh et meilleur roaming.",
      ar: "فحص الإشارة، تخطيط القنوات، وضع نقاط الوصول، ضبط Mesh، وتحسين التنقل بين النقاط."
    },
    "Dead-zone and interference checks": {
      fr: "Vérification des zones mortes et interférences",
      ar: "فحص المناطق الضعيفة والتداخل"
    },
    "Guest Wi-Fi setup": {
      fr: "Configuration Wi-Fi invité",
      ar: "إعداد واي فاي للضيوف"
    },
    "Performance testing after changes": {
      fr: "Tests de performance après modification",
      ar: "اختبار الأداء بعد التغييرات"
    },
    "IT Maintenance": {
      fr: "Maintenance informatique",
      ar: "صيانة تقنية المعلومات"
    },
    "Routine checks for network devices, computers, cameras, printers, updates, passwords, and performance issues.": {
      fr: "Contrôles réguliers des équipements réseau, ordinateurs, caméras, imprimantes, mises à jour, mots de passe et performances.",
      ar: "فحوصات دورية لأجهزة الشبكة والحواسيب والكاميرات والطابعات والتحديثات وكلمات المرور ومشاكل الأداء."
    },
    "Monthly or on-demand support": {
      fr: "Support mensuel ou à la demande",
      ar: "دعم شهري أو عند الطلب"
    },
    "Device inventory and health checks": {
      fr: "Inventaire et contrôle de santé des appareils",
      ar: "جرد الأجهزة وفحص حالتها"
    },
    "Troubleshooting for slow or unstable systems": {
      fr: "Dépannage des systèmes lents ou instables",
      ar: "تشخيص الأنظمة البطيئة أو غير المستقرة"
    },
    "Backup Solutions": {
      fr: "Solutions de sauvegarde",
      ar: "حلول النسخ الاحتياطي"
    },
    "Simple backup planning for documents, camera retention, NAS devices, external drives, and cloud sync workflows.": {
      fr: "Planification simple des sauvegardes pour documents, rétention vidéo, NAS, disques externes et synchronisation cloud.",
      ar: "تخطيط بسيط للنسخ الاحتياطي للملفات وتسجيلات الكاميرات وأجهزة NAS والأقراص الخارجية والمزامنة السحابية."
    },
    "Backup schedule recommendations": {
      fr: "Recommandations de calendrier de sauvegarde",
      ar: "توصيات جدول النسخ الاحتياطي"
    },
    "Local and cloud backup options": {
      fr: "Options de sauvegarde locale et cloud",
      ar: "خيارات نسخ احتياطي محلية وسحابية"
    },
    "Restore checks for critical files": {
      fr: "Vérification de restauration des fichiers critiques",
      ar: "اختبار استرجاع الملفات المهمة"
    },
    "Basic Cybersecurity Audit": {
      fr: "Audit cybersécurité de base",
      ar: "تدقيق أمن سيبراني أساسي"
    },
    "A practical review of passwords, router exposure, firmware, Wi-Fi security, backups, user accounts, remote access, and risky habits.": {
      fr: "Revue pratique des mots de passe, exposition routeur, firmware, sécurité Wi-Fi, sauvegardes, comptes, accès distant et habitudes risquées.",
      ar: "مراجعة عملية لكلمات المرور وانكشاف الراوتر والتحديثات وأمان الواي فاي والنسخ الاحتياطي وحسابات المستخدمين والوصول عن بعد والعادات الخطرة."
    },
    "Clear findings with priority levels": {
      fr: "Constats clairs avec niveaux de priorité",
      ar: "نتائج واضحة مع مستويات أولوية"
    },
    "Fast fixes for common weaknesses": {
      fr: "Corrections rapides des faiblesses courantes",
      ar: "إصلاحات سريعة للثغرات الشائعة"
    },
    "Recommendations in English, French, or Arabic": {
      fr: "Recommandations en anglais, français ou arabe",
      ar: "توصيات بالإنجليزية أو الفرنسية أو العربية"
    },
    "Need a service plan?": {
      fr: "Besoin d'un plan de service ?",
      ar: "هل تحتاج خطة خدمة؟"
    },
    "Send a few details and StraitSec will prepare the right next step.": {
      fr: "Envoyez quelques détails et StraitSec préparera la prochaine étape adaptée.",
      ar: "أرسل بعض التفاصيل وستجهز StraitSec الخطوة المناسبة."
    },
    "Installation, configuration, maintenance, training, and practical security support across homes and organizations.": {
      fr: "Installation, configuration, maintenance, formation et support securite pratique pour maisons et organisations.",
      ar: "\u062a\u0631\u0643\u064a\u0628 \u0648\u0625\u0639\u062f\u0627\u062f \u0648\u0635\u064a\u0627\u0646\u0629 \u0648\u062a\u062f\u0631\u064a\u0628 \u0648\u062f\u0639\u0645 \u0623\u0645\u0646\u064a \u0639\u0645\u0644\u064a \u0644\u0644\u0645\u0646\u0627\u0632\u0644 \u0648\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a."
    },
    "Ethernet cabling, wall outlets, small rack setup, cabinet organization, network mapping, and handover documentation.": {
      fr: "Cablage Ethernet, prises murales, petite baie, organisation d'armoire, cartographie reseau et documentation de livraison.",
      ar: "\u0643\u0627\u0628\u0644\u0627\u062a Ethernet \u0648\u0645\u062e\u0627\u0631\u062c \u062d\u0627\u0626\u0637 \u0648\u0625\u0639\u062f\u0627\u062f \u0631\u0627\u0643 \u0635\u063a\u064a\u0631 \u0648\u062a\u0646\u0638\u064a\u0645 \u0627\u0644\u062e\u0632\u0627\u0646\u0629 \u0648\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645."
    },
    "Network mapping and handover documentation": {
      fr: "Cartographie reseau et documentation de livraison",
      ar: "\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u062a\u0633\u0644\u064a\u0645"
    },
    "Router hardening, firmware updates, VLAN planning for staff, guests, cameras, and POS, port labeling, and switch documentation.": {
      fr: "Renforcement routeur, mises a jour firmware, VLAN pour equipe, invites, cameras et POS, etiquetage des ports et documentation switch.",
      ar: "\u062a\u0642\u0648\u064a\u0629 \u0627\u0644\u0631\u0627\u0648\u062a\u0631 \u0648\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0627\u0644\u0628\u0631\u0627\u0645\u062c \u0648\u062a\u062e\u0637\u064a\u0637 VLAN \u0644\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0648\u0627\u0644\u0636\u064a\u0648\u0641 \u0648\u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627\u062a \u0648POS \u0648\u062a\u0633\u0645\u064a\u0629 \u0627\u0644\u0645\u0646\u0627\u0641\u0630 \u0648\u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u0633\u0648\u064a\u062a\u0634."
    },
    "IT Maintenance & Support": {
      fr: "Maintenance et support IT",
      ar: "\u0635\u064a\u0627\u0646\u0629 \u0648\u062f\u0639\u0645 \u062a\u0642\u0646\u064a"
    },
    "Monthly or on-demand support, device inventory, health checks, and troubleshooting for slow or unstable systems.": {
      fr: "Support mensuel ou a la demande, inventaire des appareils, controles de sante et depannage des systemes lents ou instables.",
      ar: "\u062f\u0639\u0645 \u0634\u0647\u0631\u064a \u0623\u0648 \u0639\u0646\u062f \u0627\u0644\u0637\u0644\u0628 \u0648\u062c\u0631\u062f \u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0648\u0641\u062d\u0648\u0635\u0627\u062a \u0627\u0644\u062d\u0627\u0644\u0629 \u0648\u0625\u0635\u0644\u0627\u062d \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0628\u0637\u064a\u0626\u0629 \u0623\u0648 \u063a\u064a\u0631 \u0627\u0644\u0645\u0633\u062a\u0642\u0631\u0629."
    },
    "Digitization & Backup Solutions": {
      fr: "Digitalisation et solutions de sauvegarde",
      ar: "\u0627\u0644\u0631\u0642\u0645\u0646\u0629 \u0648\u062d\u0644\u0648\u0644 \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a"
    },
    "Backup schedule recommendations, local and cloud backup options, file organization, and restore checks for critical files.": {
      fr: "Recommandations de planning de sauvegarde, options locales et cloud, organisation des fichiers et controles de restauration.",
      ar: "\u062a\u0648\u0635\u064a\u0627\u062a \u062c\u062f\u0648\u0644\u0629 \u0627\u0644\u0646\u0633\u062e \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a \u0648\u062e\u064a\u0627\u0631\u0627\u062a \u0645\u062d\u0644\u064a\u0629 \u0648\u0633\u062d\u0627\u0628\u064a\u0629 \u0648\u062a\u0646\u0638\u064a\u0645 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0648\u0641\u062d\u0648\u0635\u0627\u062a \u0627\u0644\u0627\u0633\u062a\u0631\u062c\u0627\u0639."
    },
    "Cybersecurity Awareness & Training": {
      fr: "Sensibilisation et formation cybersécurite",
      ar: "\u0627\u0644\u062a\u0648\u0639\u064a\u0629 \u0648\u0627\u0644\u062a\u062f\u0631\u064a\u0628 \u0641\u064a \u0627\u0644\u0623\u0645\u0646 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a"
    },
    "Training sessions for employees about phishing, social engineering, password safety, safe browsing, new cyber threats, and basic security tools.": {
      fr: "Sessions pour employes sur phishing, ingenierie sociale, mots de passe, navigation sure, nouvelles menaces et outils de securite de base.",
      ar: "\u062d\u0635\u0635 \u062a\u062f\u0631\u064a\u0628\u064a\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u062d\u0648\u0644 \u0627\u0644\u062a\u0635\u064a\u062f \u0648\u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a\u0629 \u0648\u0623\u0645\u0627\u0646 \u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0645\u0631\u0648\u0631 \u0648\u0627\u0644\u062a\u0635\u0641\u062d \u0627\u0644\u0622\u0645\u0646 \u0648\u0627\u0644\u062a\u0647\u062f\u064a\u062f\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629."
    },
    "Workshops & Practical Training": {
      fr: "Ateliers et formation pratique",
      ar: "\u0648\u0631\u0634\u0627\u062a \u0648\u062a\u062f\u0631\u064a\u0628 \u0639\u0645\u0644\u064a"
    },
    "Practical workshops for small teams, students, and businesses about networking, cybersecurity basics, digital tools, and safe IT practices.": {
      fr: "Ateliers pratiques pour petites equipes, etudiants et entreprises sur reseaux, bases cybersécurite, outils digitaux et bonnes pratiques IT.",
      ar: "\u0648\u0631\u0634\u0627\u062a \u0639\u0645\u0644\u064a\u0629 \u0644\u0644\u0641\u0631\u0642 \u0627\u0644\u0635\u063a\u064a\u0631\u0629 \u0648\u0627\u0644\u0637\u0644\u0627\u0628 \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062a \u062d\u0648\u0644 \u0627\u0644\u0634\u0628\u0643\u0627\u062a \u0648\u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u0623\u0645\u0646 \u0627\u0644\u0633\u064a\u0628\u0631\u0627\u0646\u064a \u0648\u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0631\u0642\u0645\u064a\u0629."
    },
    "Reliable networks, cameras, Wi-Fi, maintenance, and cybersecurity basics.": {
      fr: "Réseaux fiables, caméras, Wi-Fi, maintenance et bases de cybersécurité.",
      ar: "شبكات موثوقة، كاميرات، واي فاي، صيانة، وأساسيات الأمن السيبراني."
    },
    "Technology plans for real environments": {
      fr: "Plans technologiques pour des environnements réels",
      ar: "خطط تقنية لبيئات حقيقية"
    },
    "Every space has different traffic, risk, budget, and support needs. StraitSec adapts the design to the place.": {
      fr: "Chaque espace a son trafic, ses risques, son budget et ses besoins de support. StraitSec adapte la conception au lieu.",
      ar: "لكل مكان حركة استخدام ومخاطر وميزانية واحتياجات دعم مختلفة. StraitSec تصمم الحل حسب المكان."
    },
    "For Small Businesses": {
      fr: "Pour les petites entreprises",
      ar: "للشركات الصغيرة"
    },
    "Reliable office LAN, secure guest Wi-Fi, printer sharing, backups, camera visibility, and simple maintenance routines.": {
      fr: "LAN de bureau fiable, Wi-Fi invité sécurisé, partage imprimante, sauvegardes, caméras visibles et maintenance simple.",
      ar: "شبكة مكتبية موثوقة، واي فاي ضيوف آمن، مشاركة الطابعات، نسخ احتياطي، رؤية الكاميرات، وصيانة بسيطة."
    },
    "Infrastructure propre pour travailler sans interruptions.": {
      fr: "Infrastructure propre pour travailler sans interruptions.",
      ar: "بنية تحتية منظمة للعمل دون انقطاع."
    },
    "For Shops": {
      fr: "Pour les commerces",
      ar: "للمتاجر"
    },
    "POS-ready networks, CCTV coverage, stable Wi-Fi for staff and customers, and isolated camera or payment devices.": {
      fr: "Réseaux prêts pour caisse, couverture CCTV, Wi-Fi stable pour équipe et clients, caméras ou paiements isolés.",
      ar: "شبكات جاهزة لنقاط البيع، تغطية كاميرات، واي فاي مستقر للموظفين والزبائن، وعزل أجهزة الكاميرات أو الدفع."
    },
    "شبكة مستقرة للمحل وكاميرات واضحة للمتابعة اليومية.": {
      fr: "Réseau stable pour le magasin et caméras claires pour le suivi quotidien.",
      ar: "شبكة مستقرة للمحل وكاميرات واضحة للمتابعة اليومية."
    },
    "For Schools": {
      fr: "Pour les écoles",
      ar: "للمدارس"
    },
    "Lab networks, access point planning, content-safe basics, administrative device separation, and documented support.": {
      fr: "Réseaux de laboratoire, points d'accès, bases de filtrage, séparation administrative et support documenté.",
      ar: "شبكات المختبر، تخطيط نقاط الوصول، أساسيات أمان المحتوى، فصل أجهزة الإدارة، ودعم موثق."
    },
    "Connexion fiable pour les classes, l'administration et les invités.": {
      fr: "Connexion fiable pour les classes, l'administration et les invités.",
      ar: "اتصال موثوق للفصول والإدارة والضيوف."
    },
    "For Homes": {
      fr: "Pour les maisons",
      ar: "للمنازل"
    },
    "Whole-home Wi-Fi, smart camera setup, parental control basics, backups, and help with everyday device issues.": {
      fr: "Wi-Fi dans toute la maison, caméras intelligentes, contrôle parental de base, sauvegardes et aide quotidienne.",
      ar: "واي فاي لكل المنزل، إعداد كاميرات ذكية، أساسيات الرقابة الأبوية، نسخ احتياطي، ومساعدة لمشاكل الأجهزة اليومية."
    },
    "واي فاي قوي في البيت، كاميرات، وحماية أساسية للعائلة.": {
      fr: "Wi-Fi puissant à la maison, caméras et protection de base pour la famille.",
      ar: "واي فاي قوي في البيت، كاميرات، وحماية أساسية للعائلة."
    },
    "For Offices": {
      fr: "Pour les bureaux",
      ar: "للمكاتب"
    },
    "Structured cabling, conference room connectivity, shared resources, secure remote access, and proactive maintenance.": {
      fr: "Câblage structuré, connectivité salle de réunion, ressources partagées, accès distant sécurisé et maintenance proactive.",
      ar: "كابلات منظمة، اتصال غرف الاجتماعات، موارد مشتركة، وصول آمن عن بعد، وصيانة استباقية."
    },
    "Un bureau connecté, organisé et prêt pour la croissance.": {
      fr: "Un bureau connecté, organisé et prêt pour la croissance.",
      ar: "مكتب متصل ومنظم وجاهز للنمو."
    },
    "Solution Packages": {
      fr: "Packs de solutions",
      ar: "باقات الحلول"
    },
    "Common starting points": {
      fr: "Points de départ fréquents",
      ar: "نقاط بداية شائعة"
    },
    "Stability Check": {
      fr: "Contrôle de stabilité",
      ar: "فحص الاستقرار"
    },
    "Audit the router, Wi-Fi coverage, cable quality, switch ports, passwords, and visible network risks.": {
      fr: "Audit du routeur, couverture Wi-Fi, qualité du câble, ports switch, mots de passe et risques visibles.",
      ar: "فحص الراوتر وتغطية الواي فاي وجودة الكابلات ومنافذ السويتش وكلمات المرور والمخاطر الظاهرة."
    },
    "Secure Camera Setup": {
      fr: "Installation caméra sécurisée",
      ar: "إعداد كاميرات آمن"
    },
    "Install IP cameras, configure recording, enable remote access, and secure user accounts.": {
      fr: "Installer les caméras IP, configurer l'enregistrement, activer l'accès distant et sécuriser les comptes.",
      ar: "تركيب كاميرات IP، إعداد التسجيل، تفعيل الوصول عن بعد، وتأمين حسابات المستخدمين."
    },
    "Growth Network": {
      fr: "Réseau évolutif",
      ar: "شبكة قابلة للنمو"
    },
    "Plan cabling, VLANs, access points, rack layout, backups, and maintenance notes for expanding teams.": {
      fr: "Planifier câblage, VLAN, points d'accès, baie, sauvegardes et notes de maintenance pour équipes en croissance.",
      ar: "تخطيط الكابلات وVLAN ونقاط الوصول وترتيب الراك والنسخ الاحتياطي وملاحظات الصيانة للفرق المتوسعة."
    },
    "Tell us your space": {
      fr: "Décrivez votre espace",
      ar: "صف لنا مكانك"
    },
    "We will match the setup to your users, building, and budget.": {
      fr: "Nous adapterons l'installation à vos utilisateurs, votre bâtiment et votre budget.",
      ar: "سنطابق الإعداد مع المستخدمين والمبنى والميزانية."
    },
    "Start a conversation": {
      fr: "Commencer la discussion",
      ar: "ابدأ التواصل"
    },
    "IT solutions for businesses, shops, schools, homes, and offices.": {
      fr: "Solutions IT pour entreprises, commerces, écoles, maisons et bureaux.",
      ar: "حلول تقنية للشركات والمتاجر والمدارس والمنازل والمكاتب."
    },
    "Example deployments with measurable improvements": {
      fr: "Exemples de déploiements avec améliorations mesurables",
      ar: "نماذج مشاريع بتحسينات قابلة للقياس"
    },
    "Realistic scenarios showing how StraitSec upgrades weak networks, camera systems, and support routines.": {
      fr: "Scenarios realistes montrant comment StraitSec ameliore les reseaux faibles, les systemes de cameras et les routines de support.",
      ar: "\u0633\u064a\u0646\u0627\u0631\u064a\u0648\u0647\u0627\u062a \u0648\u0627\u0642\u0639\u064a\u0629 \u062a\u0648\u0636\u062d \u0643\u064a\u0641 \u062a\u0637\u0648\u0631 StraitSec \u0627\u0644\u0634\u0628\u0643\u0627\u062a \u0627\u0644\u0636\u0639\u064a\u0641\u0629 \u0648\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627\u062a \u0648\u0631\u0648\u062a\u064a\u0646\u0627\u062a \u0627\u0644\u062f\u0639\u0645."
    },
    "Realistic scenarios showing how StraitSec upgrades weak networks, camera systems, and IT maintenance habits.": {
      fr: "Scénarios réalistes montrant comment StraitSec améliore réseaux faibles, caméras et habitudes de maintenance.",
      ar: "سيناريوهات واقعية توضح كيف تطور StraitSec الشبكات الضعيفة وأنظمة الكاميرات وعادات الصيانة."
    },
    "Retail": {
      fr: "Commerce",
      ar: "متجر"
    },
    "2 days": {
      fr: "2 jours",
      ar: "يومان"
    },
    "Shop POS, CCTV, and Guest Wi-Fi Upgrade": {
      fr: "Amélioration caisse, CCTV et Wi-Fi invité d'un magasin",
      ar: "ترقية نقاط البيع والكاميرات وواي فاي الضيوف لمتجر"
    },
    "A small retail shop had unstable payment terminals, weak Wi-Fi near the entrance, and cameras sharing the same unmanaged network.": {
      fr: "Un petit commerce avait des terminaux de paiement instables, un Wi-Fi faible à l'entrée et des caméras sur le même réseau non géré.",
      ar: "كان لدى متجر صغير أجهزة دفع غير مستقرة، وواي فاي ضعيف قرب المدخل، وكاميرات على نفس الشبكة غير المدارة."
    },
    "Separated POS, guest Wi-Fi, and CCTV traffic": {
      fr: "Séparation du trafic caisse, Wi-Fi invité et CCTV",
      ar: "فصل حركة نقاط البيع وواي فاي الضيوف والكاميرات"
    },
    "Installed two access points and a managed switch": {
      fr: "Installation de deux points d'accès et d'un switch administrable",
      ar: "تركيب نقطتي وصول وسويتش مدار"
    },
    "Configured secure remote camera access": {
      fr: "Configuration d'un accès caméra distant sécurisé",
      ar: "إعداد وصول آمن للكاميرات عن بعد"
    },
    "Result": {
      fr: "Résultat",
      ar: "النتيجة"
    },
    "Fewer outages during peak hours": {
      fr: "Moins de coupures aux heures de pointe",
      ar: "انقطاعات أقل في أوقات الذروة"
    },
    "Education": {
      fr: "Éducation",
      ar: "تعليم"
    },
    "4 days": {
      fr: "4 jours",
      ar: "4 أيام"
    },
    "School Lab Network Cleanup": {
      fr: "Réorganisation du réseau d'un laboratoire scolaire",
      ar: "تنظيم شبكة مختبر مدرسة"
    },
    "A school computer room needed organized cabling, stable internet for lessons, and a separate admin network.": {
      fr: "Une salle informatique scolaire avait besoin de câblage organisé, d'Internet stable pour les cours et d'un réseau admin séparé.",
      ar: "احتاجت قاعة حواسيب مدرسية إلى كابلات منظمة وإنترنت مستقر للدروس وشبكة إدارية منفصلة."
    },
    "Rebuilt patching and labeled all ports": {
      fr: "Reprise du brassage et étiquetage de tous les ports",
      ar: "إعادة تنظيم التوصيلات وتسمية كل المنافذ"
    },
    "Added staff, student, and guest network separation": {
      fr: "Séparation des réseaux personnel, étudiants et invités",
      ar: "إضافة فصل بين شبكات الموظفين والطلاب والضيوف"
    },
    "Delivered a clear network diagram": {
      fr: "Livraison d'un schéma réseau clair",
      ar: "تسليم مخطط شبكة واضح"
    },
    "Cleaner support and faster troubleshooting": {
      fr: "Support plus propre et dépannage plus rapide",
      ar: "دعم أوضح وتشخيص أسرع"
    },
    "Home Wi-Fi and Camera Reliability": {
      fr: "Fiabilité Wi-Fi et caméras à domicile",
      ar: "استقرار واي فاي وكاميرات المنزل"
    },
    "A family had dead zones upstairs, buffering video calls, and camera notifications that stopped when the router restarted.": {
      fr: "Une famille avait des zones mortes à l'étage, des appels vidéo qui bloquaient et des notifications caméra instables.",
      ar: "كانت لدى عائلة مناطق بلا تغطية في الطابق العلوي، وتقطيع في مكالمات الفيديو، وتنبيهات كاميرا تتوقف عند إعادة تشغيل الراوتر."
    },
    "Repositioned access points after signal checks": {
      fr: "Repositionnement des points d'accès après contrôle du signal",
      ar: "إعادة وضع نقاط الوصول بعد فحص الإشارة"
    },
    "Updated router settings and strong passwords": {
      fr: "Mise à jour des réglages routeur et mots de passe forts",
      ar: "تحديث إعدادات الراوتر وكلمات مرور قوية"
    },
    "Configured camera app access and backup notes": {
      fr: "Configuration de l'accès application caméra et notes de sauvegarde",
      ar: "إعداد تطبيق الكاميرات وملاحظات النسخ الاحتياطي"
    },
    "Full-home coverage and simpler support": {
      fr: "Couverture complète de la maison et support simplifié",
      ar: "تغطية كاملة للمنزل ودعم أبسط"
    },
    "Before / After": {
      fr: "Avant / Après",
      ar: "قبل / بعد"
    },
    "Network improvement examples": {
      fr: "Exemples d'amélioration réseau",
      ar: "أمثلة لتحسين الشبكة"
    },
    "Wi-Fi coverage": {
      fr: "Couverture Wi-Fi",
      ar: "تغطية الواي فاي"
    },
    "Before": {
      fr: "Avant",
      ar: "قبل"
    },
    "Dead zones in meeting room and entrance.": {
      fr: "Zones mortes dans la salle de réunion et l'entrée.",
      ar: "مناطق ضعيفة في غرفة الاجتماعات والمدخل."
    },
    "After": {
      fr: "Après",
      ar: "بعد"
    },
    "Access point placement improved roaming and speed.": {
      fr: "Le placement des points d'accès a amélioré le roaming et la vitesse.",
      ar: "تحسن التنقل والسرعة بعد ضبط أماكن نقاط الوصول."
    },
    "Cable organization": {
      fr: "Organisation des câbles",
      ar: "تنظيم الكابلات"
    },
    "Unlabeled cables made outages hard to diagnose.": {
      fr: "Les câbles non étiquetés rendaient les pannes difficiles à diagnostiquer.",
      ar: "الكابلات غير المسماة جعلت تشخيص الأعطال صعبا."
    },
    "Ports labeled, patched cleanly, and documented.": {
      fr: "Ports étiquetés, brassage propre et documentation prête.",
      ar: "منافذ مسماة، توصيلات منظمة، وتوثيق واضح."
    },
    "Security basics": {
      fr: "Bases de sécurité",
      ar: "أساسيات الأمان"
    },
    "Default passwords, exposed remote access, no backup check.": {
      fr: "Mots de passe par défaut, accès distant exposé, aucune vérification de sauvegarde.",
      ar: "كلمات مرور افتراضية، وصول عن بعد مكشوف، وعدم فحص النسخ الاحتياطي."
    },
    "Passwords changed, updates checked, remote access tightened.": {
      fr: "Mots de passe changés, mises à jour vérifiées, accès distant renforcé.",
      ar: "تم تغيير كلمات المرور وفحص التحديثات وتشديد الوصول عن بعد."
    },
    "Your project next": {
      fr: "Votre projet ensuite",
      ar: "مشروعك هو التالي"
    },
    "Share a short description and StraitSec will recommend a clean path forward.": {
      fr: "Partagez une courte description et StraitSec recommandera une voie claire.",
      ar: "شارك وصفا قصيرا وستقترح StraitSec مسارا واضحا."
    },
    "Example projects for networks, cameras, Wi-Fi, and security basics.": {
      fr: "Exemples de projets pour réseaux, caméras, Wi-Fi et bases de sécurité.",
      ar: "أمثلة مشاريع للشبكات والكاميرات والواي فاي وأساسيات الأمان."
    },
    "Plan your network, cameras, Wi-Fi, or IT support": {
      fr: "Planifiez votre réseau, vos caméras, votre Wi-Fi ou votre support IT",
      ar: "خطط لشبكتك أو كاميراتك أو الواي فاي أو الدعم التقني"
    },
    "Send a message or request a quote. StraitSec will respond with a practical next step.": {
      fr: "Envoyez un message ou demandez un devis. StraitSec répondra avec une prochaine étape pratique.",
      ar: "أرسل رسالة أو اطلب عرض سعر. سترد StraitSec بخطوة عملية مناسبة."
    },
    "Reach StraitSec": {
      fr: "Joindre StraitSec",
      ar: "تواصل مع StraitSec"
    },
    "Direct contact": {
      fr: "Contact direct",
      ar: "تواصل مباشر"
    },
    "WhatsApp": {
      fr: "WhatsApp",
      ar: "واتساب"
    },
    "Email": {
      fr: "Email",
      ar: "البريد الإلكتروني"
    },
    "Phone": {
      fr: "Téléphone",
      ar: "الهاتف"
    },
    "Casablanca • Rabat • Remote support": {
      fr: "Casablanca • Rabat • Support à distance",
      ar: "الدار البيضاء • الرباط • دعم عن بعد"
    },
    "Contact Form": {
      fr: "Formulaire de contact",
      ar: "نموذج التواصل"
    },
    "Send a message": {
      fr: "Envoyer un message",
      ar: "أرسل رسالة"
    },
    "Name": {
      fr: "Nom",
      ar: "الاسم"
    },
    "Preferred language": {
      fr: "Langue préférée",
      ar: "اللغة المفضلة"
    },
    "English": {
      fr: "Anglais",
      ar: "الإنجليزية"
    },
    "French": {
      fr: "Français",
      ar: "الفرنسية"
    },
    "Français": {
      fr: "Français",
      ar: "الفرنسية"
    },
    "Arabic": {
      fr: "Arabe",
      ar: "العربية"
    },
    "العربية": {
      fr: "Arabe",
      ar: "العربية"
    },
    "Subject": {
      fr: "Sujet",
      ar: "الموضوع"
    },
    "Message": {
      fr: "Message",
      ar: "الرسالة"
    },
    "Email or phone is required.": {
      fr: "Email ou téléphone requis.",
      ar: "البريد الإلكتروني أو الهاتف مطلوب."
    },
    "Send Message": {
      fr: "Envoyer le message",
      ar: "إرسال الرسالة"
    },
    "Quote Request": {
      fr: "Demande de devis",
      ar: "طلب عرض سعر"
    },
    "Get a practical estimate": {
      fr: "Recevoir une estimation pratique",
      ar: "احصل على تقدير عملي"
    },
    "Tell us about your site, the service you need, and the current problem. Clear details help StraitSec prepare faster.": {
      fr: "Décrivez votre site, le service souhaité et le problème actuel. Des détails clairs aident StraitSec à préparer plus vite.",
      ar: "أخبرنا عن موقعك والخدمة المطلوبة والمشكلة الحالية. التفاصيل الواضحة تساعد StraitSec على التحضير بسرعة."
    },
    "Company or place": {
      fr: "Entreprise ou lieu",
      ar: "الشركة أو المكان"
    },
    "Space type": {
      fr: "Type d'espace",
      ar: "نوع المكان"
    },
    "Select one": {
      fr: "Choisir",
      ar: "اختر"
    },
    "Small business": {
      fr: "Petite entreprise",
      ar: "شركة صغيرة"
    },
    "Shop": {
      fr: "Commerce",
      ar: "متجر"
    },
    "School": {
      fr: "École",
      ar: "مدرسة"
    },
    "Office": {
      fr: "Bureau",
      ar: "مكتب"
    },
    "Service": {
      fr: "Service",
      ar: "الخدمة"
    },
    "Select a service": {
      fr: "Choisir un service",
      ar: "اختر خدمة"
    },
    "Router and switch configuration": {
      fr: "Configuration routeur et switch",
      ar: "إعداد الراوتر والسويتش"
    },
    "Budget range": {
      fr: "Fourchette de budget",
      ar: "نطاق الميزانية"
    },
    "Not sure yet": {
      fr: "Pas encore sûr",
      ar: "غير متأكد بعد"
    },
    "Starter": {
      fr: "Démarrage",
      ar: "بداية"
    },
    "Standard": {
      fr: "Standard",
      ar: "قياسي"
    },
    "Advanced": {
      fr: "Avancé",
      ar: "متقدم"
    },
    "Maintenance plan": {
      fr: "Plan de maintenance",
      ar: "خطة صيانة"
    },
    "Timeline": {
      fr: "Délai",
      ar: "المدة"
    },
    "Flexible": {
      fr: "Flexible",
      ar: "مرن"
    },
    "Urgent": {
      fr: "Urgent",
      ar: "عاجل"
    },
    "This week": {
      fr: "Cette semaine",
      ar: "هذا الأسبوع"
    },
    "This month": {
      fr: "Ce mois-ci",
      ar: "هذا الشهر"
    },
    "Planning ahead": {
      fr: "Planification future",
      ar: "تخطيط مسبق"
    },
    "Location": {
      fr: "Localisation",
      ar: "الموقع"
    },
    "Project details": {
      fr: "Détails du projet",
      ar: "تفاصيل المشروع"
    },
    "Contact StraitSec for installations, upgrades, maintenance, and practical security support.": {
      fr: "Contactez StraitSec pour installations, améliorations, maintenance et support sécurité pratique.",
      ar: "تواصل مع StraitSec للتركيب والترقية والصيانة والدعم الأمني العملي."
    },
    "Protected Area": {
      fr: "Zone protégée",
      ar: "منطقة محمية"
    },
    "Secure portal": {
      fr: "Portail securise",
      ar: "\u0628\u0648\u0627\u0628\u0629 \u0622\u0645\u0646\u0629"
    },
    "StraitSec Admin Dashboard": {
      fr: "Tableau de bord admin StraitSec",
      ar: "\u0644\u0648\u062d\u0629 \u0625\u062f\u0627\u0631\u0629 StraitSec"
    },
    "StraitSec dashboard": {
      fr: "Tableau de bord StraitSec",
      ar: "لوحة تحكم StraitSec"
    },
    "Review contact messages, quote requests, and client service requests securely stored in Cloudflare D1.": {
      fr: "Consultez les messages de contact, demandes de devis et demandes de service client stockes de facon securisee dans Cloudflare D1.",
      ar: "\u0631\u0627\u062c\u0639 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0648\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0637\u0644\u0628\u0627\u062a \u062e\u062f\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u062e\u0632\u0646\u0629 \u0628\u0623\u0645\u0627\u0646 \u0641\u064a Cloudflare D1."
    },
    "Review contact messages and quote requests stored in Cloudflare D1.": {
      fr: "Consultez les messages de contact et demandes de devis stockés dans Cloudflare D1.",
      ar: "راجع رسائل التواصل وطلبات عروض الأسعار المخزنة في Cloudflare D1."
    },
    "Admin login": {
      fr: "Connexion admin",
      ar: "تسجيل دخول الإدارة"
    },
    "Password": {
      fr: "Mot de passe",
      ar: "كلمة المرور"
    },
    "Open Dashboard": {
      fr: "Ouvrir le tableau de bord",
      ar: "فتح لوحة التحكم"
    },
    "Inbox": {
      fr: "Boîte de réception",
      ar: "الوارد"
    },
    "Submissions": {
      fr: "Soumissions",
      ar: "الإرسالات"
    },
    "Refresh": {
      fr: "Actualiser",
      ar: "تحديث"
    },
    "Logout": {
      fr: "Déconnexion",
      ar: "تسجيل الخروج"
    },
    "Messages": {
      fr: "Messages",
      ar: "الرسائل"
    },
    "Quote requests": {
      fr: "Demandes de devis",
      ar: "طلبات عروض السعر"
    },
    "Contact messages": {
      fr: "Messages de contact",
      ar: "رسائل التواصل"
    },
    "© 2026 StraitSec. Admin dashboard.": {
      fr: "© 2026 StraitSec. Tableau de bord admin.",
      ar: "© 2026 StraitSec. لوحة الإدارة."
    },
    "Dashboard refreshed.": {
      fr: "Tableau de bord actualisé.",
      ar: "تم تحديث لوحة التحكم."
    },
    "Deleted.": {
      fr: "Supprimé.",
      ar: "تم الحذف."
    },
    "Password is required.": {
      fr: "Le mot de passe est requis.",
      ar: "كلمة المرور مطلوبة."
    },
    "Please complete the required fields.": {
      fr: "Veuillez compléter les champs requis.",
      ar: "يرجى إكمال الحقول المطلوبة."
    },
    "Please add details before submitting.": {
      fr: "Veuillez ajouter des détails avant l'envoi.",
      ar: "يرجى إضافة التفاصيل قبل الإرسال."
    },
    "Sending...": {
      fr: "Envoi...",
      ar: "جار الإرسال..."
    },
    "Submission received.": {
      fr: "Soumission reçue.",
      ar: "تم استلام الإرسال."
    },
    "Request failed.": {
      fr: "La requête a échoué.",
      ar: "فشل الطلب."
    },
    "Delete failed.": {
      fr: "La suppression a échoué.",
      ar: "فشل الحذف."
    },
    "Server returned an invalid response.": {
      fr: "Le serveur a renvoyé une réponse invalide.",
      ar: "أعاد الخادم استجابة غير صالحة."
    },
    "Your message was received. StraitSec will contact you soon.": {
      fr: "Votre message a été reçu. StraitSec vous contactera bientôt.",
      ar: "تم استلام رسالتك. ستتواصل معك StraitSec قريبا."
    },
    "Your quote request was received. StraitSec will prepare a response soon.": {
      fr: "Votre demande de devis a été reçue. StraitSec préparera une réponse bientôt.",
      ar: "تم استلام طلب عرض السعر. ستجهز StraitSec الرد قريبا."
    },
    "Contact submission failed validation.": {
      fr: "La soumission du contact n'a pas passé la validation.",
      ar: "فشل التحقق من رسالة التواصل."
    },
    "Quote request failed validation.": {
      fr: "La demande de devis n'a pas passé la validation.",
      ar: "فشل التحقق من طلب عرض السعر."
    },
    "Name is required.": {
      fr: "Le nom est requis.",
      ar: "الاسم مطلوب."
    },
    "Email or phone is required.": {
      fr: "Email ou téléphone requis.",
      ar: "البريد الإلكتروني أو الهاتف مطلوب."
    },
    "Message is required.": {
      fr: "Le message est requis.",
      ar: "الرسالة مطلوبة."
    },
    "Project details are required.": {
      fr: "Les détails du projet sont requis.",
      ar: "تفاصيل المشروع مطلوبة."
    },
    "Service is required.": {
      fr: "Le service est requis.",
      ar: "الخدمة مطلوبة."
    },
    "Email format is invalid.": {
      fr: "Le format de l'email est invalide.",
      ar: "صيغة البريد الإلكتروني غير صحيحة."
    },
    "Phone format is invalid.": {
      fr: "Le format du téléphone est invalide.",
      ar: "صيغة رقم الهاتف غير صحيحة."
    },
    "Admin password is required or invalid.": {
      fr: "Le mot de passe admin est requis ou invalide.",
      ar: "كلمة مرور الإدارة مطلوبة أو غير صحيحة."
    },
    "Invalid email or password.": {
      fr: "Email ou mot de passe invalide.",
      ar: "\u0627\u0644\u0628\u0631\u064a\u062f \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629."
    },
    "Please log in again.": {
      fr: "Veuillez vous reconnecter.",
      ar: "\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0646 \u062c\u062f\u064a\u062f."
    },
    "No quote requests yet.": {
      fr: "Aucune demande de devis pour le moment.",
      ar: "لا توجد طلبات عروض سعر بعد."
    },
    "No contact messages yet.": {
      fr: "Aucun message de contact pour le moment.",
      ar: "لا توجد رسائل تواصل بعد."
    },
    "Unknown": {
      fr: "Inconnu",
      ar: "غير معروف"
    },
    "No date": {
      fr: "Aucune date",
      ar: "لا يوجد تاريخ"
    },
    "Invalid date": {
      fr: "Date invalide",
      ar: "تاريخ غير صالح"
    },
    "Company": {
      fr: "Entreprise",
      ar: "الشركة"
    },
    "Budget": {
      fr: "Budget",
      ar: "الميزانية"
    },
    "Details": {
      fr: "Détails",
      ar: "التفاصيل"
    },
    "Language": {
      fr: "Langue",
      ar: "اللغة"
    },
    "Delete Quote": {
      fr: "Supprimer le devis",
      ar: "حذف طلب السعر"
    },
    "Delete Message": {
      fr: "Supprimer le message",
      ar: "حذف الرسالة"
    },
    "Message deleted successfully.": {
      fr: "Message supprimé avec succès.",
      ar: "تم حذف الرسالة بنجاح."
    },
    "Quote request deleted successfully.": {
      fr: "Demande de devis supprimée avec succès.",
      ar: "تم حذف طلب عرض السعر بنجاح."
    },
    "Page Not Found | StraitSec": {
      fr: "Page introuvable | StraitSec",
      ar: "الصفحة غير موجودة | StraitSec"
    },
    "Server Error | StraitSec": {
      fr: "Erreur serveur | StraitSec",
      ar: "خطأ في الخادم | StraitSec"
    },
    "Page not found": {
      fr: "Page introuvable",
      ar: "الصفحة غير موجودة"
    },
    "The page may have moved, or the address may be incorrect.": {
      fr: "La page a peut-être été déplacée, ou l'adresse est incorrecte.",
      ar: "ربما تم نقل الصفحة أو أن العنوان غير صحيح."
    },
    "Something went wrong": {
      fr: "Une erreur s'est produite",
      ar: "حدث خطأ ما"
    },
    "Error": {
      fr: "Erreur",
      ar: "خطأ"
    },
    "Please try again later, or contact StraitSec if the issue continues.": {
      fr: "Veuillez réessayer plus tard ou contacter StraitSec si le problème continue.",
      ar: "يرجى المحاولة لاحقا أو التواصل مع StraitSec إذا استمرت المشكلة."
    },
    "Go Home": {
      fr: "Retour à l'accueil",
      ar: "العودة للرئيسية"
    },
    "Contact StraitSec": {
      fr: "Contacter StraitSec",
      ar: "تواصل مع StraitSec"
    },
    "Export Messages CSV": {
      fr: "Exporter les messages CSV",
      ar: "تصدير الرسائل CSV"
    },
    "Export Quotes CSV": {
      fr: "Exporter les devis CSV",
      ar: "تصدير طلبات السعر CSV"
    },
    "Search submissions": {
      fr: "Rechercher dans les soumissions",
      ar: "البحث في الطلبات"
    },
    "Name, email, phone, service, or message": {
      fr: "Nom, email, téléphone, service ou message",
      ar: "الاسم أو البريد أو الهاتف أو الخدمة أو الرسالة"
    },
    "Message language": {
      fr: "Langue du message",
      ar: "لغة الرسالة"
    },
    "All languages": {
      fr: "Toutes les langues",
      ar: "كل اللغات"
    },
    "Quote service": {
      fr: "Service du devis",
      ar: "خدمة طلب السعر"
    },
    "All services": {
      fr: "Tous les services",
      ar: "كل الخدمات"
    },
    "Network installation": {
      fr: "Installation réseau",
      ar: "تركيب الشبكات"
    },
    "Network Installation": {
      fr: "Installation réseau",
      ar: "تركيب الشبكات"
    },
    "Router and switch configuration": {
      fr: "Configuration routeur et switch",
      ar: "إعداد الراوتر والسويتش"
    },
    "Router & Switch Configuration": {
      fr: "Configuration routeur et switch",
      ar: "إعداد الراوتر والسويتش"
    },
    "CCTV/IP cameras": {
      fr: "Caméras CCTV/IP",
      ar: "كاميرات CCTV/IP"
    },
    "CCTV / IP Camera Systems": {
      fr: "Systèmes de caméras CCTV / IP",
      ar: "أنظمة كاميرات CCTV / IP"
    },
    "Wi-Fi optimization": {
      fr: "Optimisation Wi-Fi",
      ar: "تحسين Wi-Fi"
    },
    "IT maintenance": {
      fr: "Maintenance informatique",
      ar: "صيانة تقنية المعلومات"
    },
    "IT Maintenance & Support": {
      fr: "Maintenance et support IT",
      ar: "صيانة ودعم تقنية المعلومات"
    },
    "Backup solutions": {
      fr: "Solutions de sauvegarde",
      ar: "حلول النسخ الاحتياطي"
    },
    "Digitization & Backup Solutions": {
      fr: "Digitalisation et solutions de sauvegarde",
      ar: "الرقمنة وحلول النسخ الاحتياطي"
    },
    "Cybersecurity Awareness & Training": {
      fr: "Sensibilisation et formation cybersécurité",
      ar: "التوعية والتدريب في الأمن السيبراني"
    },
    "Basic cybersecurity audit": {
      fr: "Audit cybersécurité de base",
      ar: "تدقيق الأمن السيبراني الأساسي"
    },
    "Basic Cybersecurity Audit & Recommendations": {
      fr: "Audit cybersécurité de base et recommandations",
      ar: "تدقيق أمن سيبراني أساسي وتوصيات"
    },
    "Workshops & Practical Training": {
      fr: "Ateliers et formation pratique",
      ar: "ورشات وتدريب عملي"
    },
    "Apply Filters": {
      fr: "Appliquer les filtres",
      ar: "تطبيق الفلاتر"
    },
    "Clear": {
      fr: "Effacer",
      ar: "مسح"
    },
    "Quote requests": {
      fr: "Demandes de devis",
      ar: "طلبات عروض السعر"
    },
    "Today": {
      fr: "Aujourd'hui",
      ar: "اليوم"
    },
    "Never": {
      fr: "Jamais",
      ar: "أبدا"
    },
    "Last login": {
      fr: "Dernière connexion",
      ar: "آخر تسجيل دخول"
    },
    "Previous": {
      fr: "Précédent",
      ar: "السابق"
    },
    "Next": {
      fr: "Suivant",
      ar: "التالي"
    },
    "Recent activity": {
      fr: "Activité récente",
      ar: "النشاط الأخير"
    },
    "Page 1 of 1": {
      fr: "Page 1 sur 1",
      ar: "الصفحة 1 من 1"
    },
    "Filters applied.": {
      fr: "Filtres appliqués.",
      ar: "تم تطبيق الفلاتر."
    },
    "Filters cleared.": {
      fr: "Filtres effacés.",
      ar: "تم مسح الفلاتر."
    },
    "Messages CSV exported.": {
      fr: "Messages CSV exportés.",
      ar: "تم تصدير الرسائل CSV."
    },
    "Quote requests CSV exported.": {
      fr: "Demandes de devis CSV exportées.",
      ar: "تم تصدير طلبات السعر CSV."
    },
    "Email is required.": {
      fr: "L'email est requis.",
      ar: "البريد الإلكتروني مطلوب."
    },
    "Admin login successful.": {
      fr: "Connexion admin réussie.",
      ar: "تم تسجيل دخول الإدارة بنجاح."
    },
    "Admin logout successful.": {
      fr: "Deconnexion admin reussie.",
      ar: "\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0628\u0646\u062c\u0627\u062d."
    },
    "No activity yet.": {
      fr: "Aucune activité pour le moment.",
      ar: "لا يوجد نشاط حاليا."
    },
    "Activity": {
      fr: "Activité",
      ar: "نشاط"
    },
    "Phone": {
      fr: "Téléphone",
      ar: "الهاتف"
    },
    "Location": {
      fr: "Localisation",
      ar: "الموقع"
    },
    "Space type": {
      fr: "Type d'espace",
      ar: "نوع المكان"
    },
    "Timeline": {
      fr: "Délai",
      ar: "المدة"
    },
    "Map placeholder": {
      fr: "Emplacement de la carte",
      ar: "مكان الخريطة"
    },
    "Cannot reach backend. Make sure Wrangler Pages dev is running.": {
      fr: "Impossible de joindre le backend. Vérifiez que Wrangler Pages dev est lancé.",
      ar: "تعذر الاتصال بالخلفية. تأكد من تشغيل Wrangler Pages dev."
    },
    "Export failed.": {
      fr: "L'export a échoué.",
      ar: "فشل التصدير."
    },
    "Delete failed.": {
      fr: "La suppression a échoué.",
      ar: "فشل الحذف."
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    originalDocumentTitle = document.title;
    initLanguage();
    initNavigation();
    markActiveNav();
    bindForm("#contact-form", "/api/contact");
    bindForm("#quote-request-form", "/api/quote");
    initAdmin();
    applyLanguage(currentLanguage);
  });

  function normalizeLanguage(language) {
    return supportedLanguages.includes(language) ? language : "en";
  }

  function initLanguage() {
    const header = document.querySelector(".site-header");

    if (header && !document.querySelector("[data-language-select]")) {
      const control = document.createElement("label");
      control.className = "language-control";
      control.dataset.noTranslate = "true";

      const text = document.createElement("span");
      text.className = "sr-only";
      text.textContent = "Language";

      const select = document.createElement("select");
      select.setAttribute("aria-label", "Language");
      select.dataset.languageSelect = "true";

      supportedLanguages.forEach((language) => {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = languageLabels[language];
        select.appendChild(option);
      });

      select.value = currentLanguage;
      control.append(text, select);
      header.appendChild(control);
    }

    const selector = document.querySelector("[data-language-select]");

    if (selector) {
      selector.value = currentLanguage;
      selector.addEventListener("change", () => {
        applyLanguage(normalizeLanguage(selector.value));
      });
    }
  }

  function applyLanguage(language) {
    currentLanguage = normalizeLanguage(language);
    localStorage.setItem(languageKey, currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    document.title = translatePhrase(originalDocumentTitle);

    const selector = document.querySelector("[data-language-select]");

    if (selector) {
      selector.value = currentLanguage;
    }

    applyTranslations(document.body);
    updateLocalizedVisibility(document.body);
  }

  function applyTranslations(root) {
    if (!root) {
      return;
    }

    translateAttributes(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;

        if (!parent || shouldSkipTranslation(parent) || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let node = walker.nextNode();

    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach(translateTextNode);
  }

  function translateAttributes(root) {
    const elements = [];

    if (root.nodeType === Node.ELEMENT_NODE) {
      elements.push(root);
    }

    elements.push(...root.querySelectorAll("[aria-label], [title], [placeholder]"));

    elements.forEach((element) => {
      if (shouldSkipTranslation(element)) {
        return;
      }

      ["aria-label", "title", "placeholder"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) {
          return;
        }

        let originals = originalAttributes.get(element);

        if (!originals) {
          originals = {};
          originalAttributes.set(element, originals);
        }

        if (!originals[attribute]) {
          originals[attribute] = element.getAttribute(attribute);
        }

        element.setAttribute(attribute, translatePhrase(originals[attribute]));
      });
    });
  }

  function translateTextNode(node) {
    if (!originalTextNodes.has(node)) {
      const raw = node.nodeValue;
      const match = raw.match(/^(\s*)(.*?)(\s*)$/s);
      originalTextNodes.set(node, {
        prefix: match ? match[1] : "",
        text: match ? match[2] : raw.trim(),
        suffix: match ? match[3] : ""
      });
    }

    const original = originalTextNodes.get(node);
    node.nodeValue = `${original.prefix}${translatePhrase(original.text)}${original.suffix}`;
  }

  function updateLocalizedVisibility(root) {
    if (!root) {
      return;
    }

    const elements = [];

    if (root.nodeType === Node.ELEMENT_NODE && root.matches("[lang]:not(html)")) {
      elements.push(root);
    }

    elements.push(...root.querySelectorAll("[lang]:not(html)"));

    elements.forEach((element) => {
      if (element.closest("[data-no-translate]")) {
        return;
      }

      const elementLanguage = normalizeLanguage(element.getAttribute("lang"));
      const shouldShow = elementLanguage === currentLanguage;

      element.hidden = !shouldShow;
      element.dataset.languageHidden = shouldShow ? "false" : "true";

      if (shouldShow) {
        element.setAttribute("dir", elementLanguage === "ar" ? "rtl" : "ltr");
      }
    });
  }

  function shouldSkipTranslation(element) {
    return Boolean(element.closest("[data-no-translate], script, style, code, pre, .brand-mark, .card-icon, .security-score"));
  }

  function translatePhrase(value) {
    const text = String(value || "").trim();

    if (!text || currentLanguage === "en") {
      return text;
    }

    return translations[text]?.[currentLanguage] || text;
  }

  function initNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");

    if (!toggle || !nav) {
      return;
    }

    const setOpenStyles = (isOpen) => {
      if (isOpen) {
        nav.style.setProperty("max-height", "440px", "important");
        nav.style.setProperty("opacity", "1", "important");
        nav.style.setProperty("pointer-events", "auto", "important");
        nav.style.setProperty("transform", "translateY(0)", "important");
        nav.style.setProperty("visibility", "visible", "important");
      } else {
        nav.style.removeProperty("max-height");
        nav.style.removeProperty("opacity");
        nav.style.removeProperty("pointer-events");
        nav.style.removeProperty("transform");
        nav.style.removeProperty("visibility");
      }
    };

    const closeNavigation = () => {
      nav.classList.remove("open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      setOpenStyles(false);
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      setOpenStyles(isOpen);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeNavigation();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("open")) {
        return;
      }

      if (!event.target.closest("[data-nav]") && !event.target.closest("[data-nav-toggle]")) {
        closeNavigation();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNavigation();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) {
        closeNavigation();
      }
    });
  }

  function markActiveNav() {
    const page = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".site-nav a").forEach((link) => {
      const linkPage = link.getAttribute("href");

      if (linkPage === page) {
        link.classList.add("active");
      }
    });
  }

  function bindForm(selector, endpoint) {
    const form = document.querySelector(selector);

    if (!form) {
      return;
    }

    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearStatus(status);

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(status, "Please complete the required fields.", "error");
        return;
      }

      const payload = formToObject(form);

      if (!hasMeaningfulValue(payload)) {
        setStatus(status, "Please add details before submitting.", "error");
        return;
      }

      setLoading(submitButton, true);

      try {
        const result = await sendJson(endpoint, payload);
        setStatus(status, result.message || "Submission received.", "success");
        notify(result.message || "Submission received.", "success");
        form.reset();
      } catch (error) {
        setStatus(status, error.message, "error");
        notify(error.message, "error");
      } finally {
        setLoading(submitButton, false);
      }
    });
  }

  function formToObject(form) {
    return Array.from(new FormData(form).entries()).reduce((data, entry) => {
      const [key, value] = entry;
      data[key] = typeof value === "string" ? value.trim() : value;
      return data;
    }, {});
  }

  function hasMeaningfulValue(payload) {
    return Object.values(payload).some((value) => String(value || "").trim().length > 0);
  }

  async function sendJson(url, payload, options = {}) {
    const response = await safeFetch(url, {
      method: options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: payload ? JSON.stringify(payload) : undefined
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      const message = translatePhrase(data.message || "Request failed.");
      const details = Array.isArray(data.errors)
        ? data.errors.map(translatePhrase).filter((error) => !message.includes(error))
        : [];
      const detail = details.length ? ` ${details.join(" ")}` : "";
      throw new Error(`${message}${detail}`);
    }

    return data;
  }

  async function getJson(url, token) {
    const response = await safeFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(translatePhrase(data.message || "Request failed."));
    }

    return data;
  }

  async function deleteJson(url, token) {
    const response = await safeFetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(translatePhrase(data.message || "Delete failed."));
    }

    return data;
  }

  async function safeFetch(url, options) {
    try {
      return await fetch(url, options);
    } catch {
      throw new Error("Cannot reach backend. Make sure Wrangler Pages dev is running.");
    }
  }

  async function parseJsonResponse(response) {
    try {
      return await response.json();
    } catch {
      return {
        success: false,
        message: "Server returned an invalid response."
      };
    }
  }

  function setLoading(button, isLoading) {
    if (!button) {
      return;
    }

    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = translatePhrase("Sending...");
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function clearStatus(element) {
    if (!element) {
      return;
    }

    element.textContent = "";
    element.classList.remove("success", "error");
  }

  function setStatus(element, message, type) {
    if (!element) {
      return;
    }

    element.textContent = translatePhrase(message);
    element.classList.remove("success", "error");

    if (type) {
      element.classList.add(type);
    }
  }

  function notify(message, type = "success") {
    let root = document.querySelector("#toast-root");

    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      root.className = "toast-root";
      root.setAttribute("aria-live", "polite");
      document.body.appendChild(root);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = translatePhrase(message);
    root.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
    }, 4200);
  }

  function initAdmin() {
    const loginForm = document.querySelector("#admin-login-form");
    const dashboard = document.querySelector("#admin-dashboard");

    if (!loginForm || !dashboard) {
      return;
    }

    const loginStatus = document.querySelector("[data-admin-login-status]");
    const adminStatus = document.querySelector("#admin-status");
    const refreshButton = document.querySelector("#admin-refresh");
    const logoutButton = document.querySelector("#admin-logout");
    const loginButton = loginForm.querySelector("button[type='submit']");
    const controlsForm = document.querySelector("#admin-controls-form");
    const clearFiltersButton = document.querySelector("#admin-clear-filters");
    const exportMessagesButton = document.querySelector("#export-messages");
    const exportQuotesButton = document.querySelector("#export-quotes");
    sessionStorage.removeItem(adminTokenKey);
    showLogin(loginForm, dashboard);

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = String(new FormData(loginForm).get("email") || "").trim();
      const password = String(new FormData(loginForm).get("password") || "").trim();
      clearStatus(loginStatus);

      if (!email) {
        setStatus(loginStatus, "Email is required.", "error");
        return;
      }

      if (!password) {
        setStatus(loginStatus, "Password is required.", "error");
        return;
      }

      setLoading(loginButton, true);

      try {
        const result = await sendJson("/api/admin/login", { email, password }, { method: "POST" });
        const token = result.token;

        if (!token) {
          throw new Error("Server returned an invalid response.");
        }

        sessionStorage.setItem(adminTokenKey, token);
        await loadAdminData(token);
        showDashboard(loginForm, dashboard);
        loginForm.reset();
        notify("Admin login successful.", "success");
      } catch (error) {
        showLogin(loginForm, dashboard);
        setStatus(loginStatus, error.message, "error");
        notify(error.message, "error");
      } finally {
        setLoading(loginButton, false);
      }
    });

    if (controlsForm) {
      controlsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = sessionStorage.getItem(adminTokenKey) || "";
        const data = new FormData(controlsForm);
        adminState.search = String(data.get("search") || "").trim();
        adminState.preferredLanguage = String(data.get("preferredLanguage") || "").trim();
        adminState.service = String(data.get("service") || "").trim();
        adminState.messagesPage = 1;
        adminState.quotesPage = 1;
        clearStatus(adminStatus);

        try {
          await loadAdminData(token);
          setStatus(adminStatus, "Filters applied.", "success");
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        }
      });
    }

    if (clearFiltersButton && controlsForm) {
      clearFiltersButton.addEventListener("click", async () => {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        controlsForm.reset();
        adminState.search = "";
        adminState.preferredLanguage = "";
        adminState.service = "";
        adminState.messagesPage = 1;
        adminState.quotesPage = 1;
        clearStatus(adminStatus);

        try {
          await loadAdminData(token);
          setStatus(adminStatus, "Filters cleared.", "success");
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        }
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        clearStatus(adminStatus);
        setLoading(refreshButton, true);

        try {
          await loadAdminData(token);
          setStatus(adminStatus, "Dashboard refreshed.", "success");
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        } finally {
          setLoading(refreshButton, false);
        }
      });
    }

    if (exportMessagesButton) {
      exportMessagesButton.addEventListener("click", async () => {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        setLoading(exportMessagesButton, true);
        clearStatus(adminStatus);

        try {
          await downloadCsv(`/api/messages/export${buildQueryString(buildMessageQuery(false))}`, token, "straitsec-contact-messages.csv");
          setStatus(adminStatus, "Messages CSV exported.", "success");
          notify("Messages CSV exported.", "success");
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        } finally {
          setLoading(exportMessagesButton, false);
        }
      });
    }

    if (exportQuotesButton) {
      exportQuotesButton.addEventListener("click", async () => {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        setLoading(exportQuotesButton, true);
        clearStatus(adminStatus);

        try {
          await downloadCsv(`/api/quotes/export${buildQueryString(buildQuoteQuery(false))}`, token, "straitsec-quote-requests.csv");
          setStatus(adminStatus, "Quote requests CSV exported.", "success");
          notify("Quote requests CSV exported.", "success");
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        } finally {
          setLoading(exportQuotesButton, false);
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        if (token) {
          try {
            await sendJson("/api/admin/logout", null, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          } catch {
            // Local logout should still complete if the token is already expired.
          }
        }
        sessionStorage.removeItem(adminTokenKey);
        document.body.classList.remove("admin-authenticated");
        dashboard.classList.add("hidden");
        loginForm.classList.remove("hidden");
        clearStatus(adminStatus);
        notify("Admin logout successful.", "success");
      });
    }

    dashboard.addEventListener("click", async (event) => {
      const pageButton = event.target.closest("[data-page-target]");

      if (pageButton) {
        const token = sessionStorage.getItem(adminTokenKey) || "";
        const target = pageButton.dataset.pageTarget;
        const direction = Number(pageButton.dataset.pageDirection) || 0;
        const key = target === "messages" ? "messagesPage" : "quotesPage";
        const maxKey = target === "messages" ? "messagesTotalPages" : "quotesTotalPages";
        adminState[key] = Math.min(Math.max(1, adminState[key] + direction), adminState[maxKey]);
        clearStatus(adminStatus);
        setLoading(pageButton, true);

        try {
          await loadAdminData(token);
        } catch (error) {
          if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
            setStatus(adminStatus, error.message, "error");
            notify(error.message, "error");
          }
        } finally {
          setLoading(pageButton, false);
        }
        return;
      }

      const button = event.target.closest("[data-delete-type]");

      if (!button) {
        return;
      }

      const token = sessionStorage.getItem(adminTokenKey) || "";
      const type = button.dataset.deleteType;
      const id = button.dataset.deleteId;
      const endpoint = type === "quote" ? `/api/quotes/${id}` : `/api/messages/${id}`;

      button.disabled = true;
      clearStatus(adminStatus);

      try {
        const result = await deleteJson(endpoint, token);
        setStatus(adminStatus, result.message || "Deleted.", "success");
        notify(result.message || "Deleted.", "success");
        await loadAdminData(token);
      } catch (error) {
        if (!handleAdminAuthError(error, loginForm, dashboard, adminStatus)) {
          setStatus(adminStatus, error.message, "error");
          notify(error.message, "error");
        }
      } finally {
        button.disabled = false;
      }
    });
  }

  function showDashboard(loginForm, dashboard) {
    document.body.classList.add("admin-authenticated");
    loginForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function showLogin(loginForm, dashboard) {
    sessionStorage.removeItem(adminTokenKey);
    document.body.classList.remove("admin-authenticated");
    dashboard.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }

  function handleAdminAuthError(error, loginForm, dashboard, statusElement) {
    if (!isAdminAuthError(error)) {
      return false;
    }

    showLogin(loginForm, dashboard);
    const message = "Please log in again.";
    setStatus(statusElement, message, "error");
    notify(message, "error");
    return true;
  }

  function isAdminAuthError(error) {
    return /admin login|admin session|invalid or expired|please log in/i.test(String(error?.message || ""));
  }

  async function loadAdminData(token) {
    const [statsResponse, messagesResponse, quotesResponse, activityResponse] = await Promise.all([
      getJson("/api/admin/stats", token),
      getJson(`/api/messages${buildQueryString(buildMessageQuery(true))}`, token),
      getJson(`/api/quotes${buildQueryString(buildQuoteQuery(true))}`, token),
      getJson("/api/admin/activity?page=1&limit=6", token)
    ]);

    renderAdminList("#messages-list", messagesResponse.data || [], "message");
    renderAdminList("#quotes-list", quotesResponse.data || [], "quote");
    renderActivity(activityResponse.data || []);
    setCount("#message-count", statsResponse.data?.totalMessages || 0);
    setCount("#quote-count", statsResponse.data?.totalQuotes || 0);
    setCount("#today-count", statsResponse.data?.todaySubmissions || 0);
    setCount("#last-login", formatDate(statsResponse.data?.lastLoginAt), true);
    adminState.messagesTotalPages = messagesResponse.totalPages || 1;
    adminState.quotesTotalPages = quotesResponse.totalPages || 1;
    updatePagination("messages", messagesResponse);
    updatePagination("quotes", quotesResponse);
    applyTranslations(document.querySelector("#admin-dashboard"));
    updateLocalizedVisibility(document.querySelector("#admin-dashboard"));
  }

  function buildMessageQuery(includePagination) {
    return {
      search: adminState.search,
      preferredLanguage: adminState.preferredLanguage,
      page: includePagination ? adminState.messagesPage : "",
      limit: includePagination ? adminState.limit : ""
    };
  }

  function buildQuoteQuery(includePagination) {
    return {
      search: adminState.search,
      service: adminState.service,
      page: includePagination ? adminState.quotesPage : "",
      limit: includePagination ? adminState.limit : ""
    };
  }

  function buildQueryString(params) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        query.set(key, String(value).trim());
      }
    });

    const text = query.toString();
    return text ? `?${text}` : "";
  }

  function setCount(selector, value, noTranslate = false) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = String(value);
      if (noTranslate) {
        element.dataset.noTranslate = "true";
      }
    }
  }

  function updatePagination(type, response) {
    const page = response.page || 1;
    const totalPages = response.totalPages || 1;
    const label = document.querySelector(`[data-page-label="${type}"]`);
    const previous = document.querySelector(`[data-page-target="${type}"][data-page-direction="-1"]`);
    const next = document.querySelector(`[data-page-target="${type}"][data-page-direction="1"]`);

    if (label) {
      label.textContent = formatPageLabel(page, totalPages);
      label.dataset.noTranslate = "true";
    }

    if (previous) {
      previous.disabled = page <= 1;
    }

    if (next) {
      next.disabled = page >= totalPages;
    }
  }

  function formatPageLabel(page, totalPages) {
    if (currentLanguage === "fr") {
      return `Page ${page} sur ${totalPages}`;
    }

    if (currentLanguage === "ar") {
      return `الصفحة ${page} من ${totalPages}`;
    }

    return `Page ${page} of ${totalPages}`;
  }

  async function downloadCsv(url, token, filename) {
    const response = await safeFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await parseJsonResponse(response);
      throw new Error(translatePhrase(data.message || "Export failed."));
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  }

  function renderAdminList(selector, items, type) {
    const container = document.querySelector(selector);

    if (!container) {
      return;
    }

    container.textContent = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = type === "quote" ? "No quote requests yet." : "No contact messages yet.";
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      container.appendChild(createAdminItem(item, type));
    });
  }

  function renderActivity(items) {
    const container = document.querySelector("#activity-list");

    if (!container) {
      return;
    }

    container.textContent = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No activity yet.";
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "admin-item compact";

      const title = document.createElement("strong");
      title.textContent = item.event || "Activity";

      const time = document.createElement("time");
      time.dateTime = item.createdAt || "";
      time.textContent = formatDate(item.createdAt);
      time.dataset.noTranslate = "true";

      const meta = document.createElement("p");
      meta.textContent = item.ipAddress || "Unknown";
      meta.dataset.noTranslate = "true";

      article.append(title, time, meta);
      container.appendChild(article);
    });
  }

  function createAdminItem(item, type) {
    const article = document.createElement("article");
    article.className = "admin-item";

    const header = document.createElement("div");
    header.className = "admin-item-header";

    const title = document.createElement("strong");
    title.textContent = item.name || "Unknown";
    title.dataset.noTranslate = "true";

    const time = document.createElement("time");
    time.dateTime = item.createdAt || "";
    time.textContent = formatDate(item.createdAt);
    time.dataset.noTranslate = "true";

    header.append(title, time);
    article.appendChild(header);

    const fields = document.createElement("div");
    fields.className = "admin-fields";

    if (type === "quote") {
      appendField(fields, "Email", item.email);
      appendField(fields, "Phone", item.phone);
      appendField(fields, "Company", item.company);
      appendField(fields, "Location", item.location);
      appendField(fields, "Space type", item.businessType);
      appendField(fields, "Service", item.service);
      appendField(fields, "Budget", item.budget);
      appendField(fields, "Timeline", item.timeline);
      appendField(fields, "Details", item.details);
    } else {
      appendField(fields, "Email", item.email);
      appendField(fields, "Phone", item.phone);
      appendField(fields, "Subject", item.subject);
      appendField(fields, "Language", item.preferredLanguage);
      appendField(fields, "Message", item.message);
    }

    article.appendChild(fields);

    const deleteButton = document.createElement("button");
    deleteButton.className = "button button-danger";
    deleteButton.type = "button";
    deleteButton.dataset.deleteType = type;
    deleteButton.dataset.deleteId = item.id;
    deleteButton.textContent = type === "quote" ? "Delete Quote" : "Delete Message";
    article.appendChild(deleteButton);

    return article;
  }

  function appendField(container, label, value) {
    if (!value) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "admin-field";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("p");
    valueElement.textContent = value;
    valueElement.dataset.noTranslate = "true";

    wrapper.append(labelElement, valueElement);
    container.appendChild(wrapper);
  }

  function formatDate(value) {
    if (!value) {
      return "No date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat(dateLocales[currentLanguage], {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }
})();
