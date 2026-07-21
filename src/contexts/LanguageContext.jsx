import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    heroTitle: "Empowering Communities, Together.",
    heroSubtitle: "Join our decentralized mutual aid network to provide disaster relief and support to those who need it most.",
    donateNow: "Donate Now",
    volunteerNow: "Become a Volunteer",
    currentCampaigns: "Active Campaigns",
    donationChannels: "Donation Channels",
    gallery: "Impact Gallery",
    moneyDonation: "Financial Support",
    itemDonation: "Item Donations",
    loginRequired: "Please login to continue.",
    home: "Home",
    login: "Login",
    register: "Register",
    
    // Dashboard translations
    dashboardTitle: "Dashboard",
    mainPage: "Main Page",
    welcomePrefix: "Welcome from Hnaung Kyoe",
    dashboardDesc: "Your dashboard gives you a quick overview of your contributions, pending requests, and latest updates from our relief network.",
    myOverview: "My Overview",
    totalDonations: "Total Donations",
    pendingItems: "Pending Items",
    confirmed: "Confirmed",
    aidRequests: "Aid Requests",
    pendingAid: "Pending Aid",
    unreadNotifs: "Unread Notifs",
    actionsModules: "Actions & Modules",
    myAidRequestsTitle: "My Aid Requests",
    myAidRequestsDesc: "View or request emergency aid and track your request statuses.",
    manageRequests: "Manage Requests",
    donationCampTitle: "Donation Campaigns",
    donationCampDesc: "Browse and contribute to active verified campaigns.",
    browseCampaigns: "Browse Campaigns",
    myItemDonationsTitle: "My Item Donations",
    myItemDonationsDesc: "Track the physical items you've donated or scheduled for pickup.",
    viewItems: "View Items",
    financialDonationsTitle: "Financial Donations",
    financialDonationsDesc: "Check the status of your financial contributions and receipts.",
    viewHistory: "View History",
    volunteerCenter: "Volunteer Center",
    volunteerActiveDesc: "You are an active volunteer. Check your assignments.",
    viewAssignments: "View Assignments",
    volunteerApplyDesc: "Join our on-field relief team and make a direct impact.",
    applyNow: "Apply Now",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity.",
    adminControls: "Admin Controls",
    adminDesc: "Restricted access area for system management.",
    systemSettings: "System Settings",
    manageContent: "Manage Content",
    
    // Admin Dashboard
    commandCenter: "Command Center",
    welcomeBack: "Welcome back",
    adminDashboardDesc: "Global view across all regions and data points.",
    liveMetrics: "Live Metrics",
    operationsActions: "Operations & Actions",
    totalVolunteers: "Total Volunteers",
    totalCampaigns: "Active Campaigns",
    totalAdmins: "Total Admins",
    pendingAidReq: "Pending Aid Req",
    manageCampaignsTitle: "Manage Campaigns",
    manageCampaignsDesc: "Create, edit, and delete donation campaigns. Control which campaigns are active.",
    volunteerListTitle: "Volunteer List",
    volunteerListDesc: "View all active volunteers. Search by name, filter by status, and manage volunteers.",
    applicationsTitle: "Applications",
    applicationsDesc: "Review pending volunteer applications. Approve or reject applicants.",
    managePostsTitle: "Manage Posts",
    managePostsDesc: "Write and publish news posts and platform announcements.",
    manageDonationsTitle: "Manage Donations",
    manageDonationsDesc: "Confirm or reject donation submissions. View all donation records.",
    donationApprovalsTitle: "Donation Approvals",
    donationApprovalsDesc: "Approve or reject pending donations. View full donation history with export.",
    aidRequestsTitle: "Aid Requests",
    aidRequestsDesc: "Review aid requests submitted by users. Approve or reject each request.",
    storeInventoryTitle: "Store / Inventory",
    storeInventoryDesc: "Manage warehouse items, storage actions, and offline emergency usages.",
    auditLogsTitle: "Audit Logs",
    auditLogsDesc: "View system audit logs. Track admin actions and security events.",
    userManagementTitle: "User Management",
    userManagementDesc: "Manage all system users, view admin lists, change roles, and delete accounts.",
    viewAction: "View",
    manageAction: "Manage"
  },
  my: {
    heroTitle: "လူမှုအသိုင်းအဝိုင်းများ ပိုမိုအားကောင်းလာစေရန်။",
    heroSubtitle: "သဘာဝဘေးအန္တရာယ် ကယ်ဆယ်ရေးနှင့် အမှန်တကယ် လိုအပ်နေသူများကို ကူညီရန် ကျွန်ုပ်တို့၏ အပြန်အလှန်ကူညီရေး ကွန်ရက်တွင် ပါဝင်လိုက်ပါ။",
    donateNow: "ယခုလှူဒါန်းမည်",
    volunteerNow: "စေတနာ့ဝန်ထမ်းအဖြစ် ပါဝင်မည်",
    currentCampaigns: "လက်ရှိ လှုပ်ရှားမှုများ",
    donationChannels: "အလှူခံမည့် နည်းလမ်းများ",
    gallery: "လှူဒါန်းမှု မှတ်တမ်းများ",
    moneyDonation: "ငွေကြေးလှူဒါန်းရန်",
    itemDonation: "ပစ္စည်းလှူဒါန်းရန်",
    loginRequired: "ဆက်လက်လုပ်ဆောင်ရန် Login ဝင်ပါ။",
    home: "ပင်မစာမျက်နှာ",
    login: "အကောင့်ဝင်ရန်",
    register: "အကောင့်သစ်ဖွင့်ရန်",

    // Dashboard translations
    dashboardTitle: "ထိန်းချုပ်ခန်း (Dashboard)",
    mainPage: "ပင်မစာမျက်နှာ",
    welcomePrefix: "နှောင်ကြိုးမှ နွေးထွေးစွာ ကြိုဆိုပါတယ်",
    dashboardDesc: "သင်၏ လှူဒါန်းမှုများ၊ အကူအညီတောင်းခံမှုများနှင့် ကွန်ရက်မှ နောက်ဆုံးရသတင်းများကို ဤနေရာတွင် အလွယ်တကူ ကြည့်ရှုနိုင်ပါသည်။",
    myOverview: "အနှစ်ချုပ် အခြေအနေ",
    totalDonations: "စုစုပေါင်း လှူဒါန်းမှုများ",
    pendingItems: "စောင့်ဆိုင်းဆဲ",
    confirmed: "အတည်ပြုပြီး",
    aidRequests: "အကူအညီ တောင်းခံမှုများ",
    pendingAid: "စောင့်ဆိုင်းဆဲ (အကူအညီ)",
    unreadNotifs: "မဖတ်ရသေးသော အကြောင်းကြားစာ",
    actionsModules: "လုပ်ဆောင်ချက်များ",
    myAidRequestsTitle: "ကျွန်ုပ်၏ အကူအညီတောင်းခံမှုများ",
    myAidRequestsDesc: "အရေးပေါ် အကူအညီတောင်းခံရန်နှင့် အခြေအနေများကို စစ်ဆေးရန်။",
    manageRequests: "စီမံရန်",
    donationCampTitle: "အလှူငွေကောက်ခံမှုများ",
    donationCampDesc: "အတည်ပြုထားသော အလှူငွေကောက်ခံမှုများကို ကြည့်ရှု လှူဒါန်းရန်။",
    browseCampaigns: "ကြည့်ရှုရန်",
    myItemDonationsTitle: "ကျွန်ုပ်၏ ပစ္စည်းလှူဒါန်းမှုများ",
    myItemDonationsDesc: "လှူဒါန်းထားသော ပစ္စည်းများ၏ အခြေအနေကို စစ်ဆေးရန်။",
    viewItems: "စစ်ဆေးရန်",
    financialDonationsTitle: "ကျွန်ုပ်၏ ငွေကြေးလှူဒါန်းမှုများ",
    financialDonationsDesc: "ငွေကြေးလှူဒါန်းမှု မှတ်တမ်းနှင့် ပြေစာများကို ကြည့်ရှုရန်။",
    viewHistory: "မှတ်တမ်းကြည့်ရန်",
    volunteerCenter: "စေတနာ့ဝန်ထမ်း စင်တာ",
    volunteerActiveDesc: "သင်သည် စေတနာ့ဝန်ထမ်း ဖြစ်ပါသည်။ တာဝန်များကို စစ်ဆေးပါ။",
    viewAssignments: "တာဝန်များကြည့်ရန်",
    volunteerApplyDesc: "ကယ်ဆယ်ရေးအဖွဲ့တွင် ပါဝင်ပြီး ကူညီပေးနိုင်ရန် လျှောက်ထားပါ။",
    applyNow: "ယခုလျှောက်ထားမည်",
    recentActivity: "လတ်တလော လှုပ်ရှားမှုများ",
    noRecentActivity: "လတ်တလော လှုပ်ရှားမှု မရှိပါ။",
    adminControls: "အက်ဒမင် လုပ်ဆောင်ချက်များ",
    adminDesc: "စနစ်ကို စီမံခန့်ခွဲရန် သီးသန့်နေရာ။",
    systemSettings: "စနစ် ဆက်တင်များ",
    manageContent: "အချက်အလက်များ စီမံရန်",

    // Admin Dashboard
    commandCenter: "အဓိက ထိန်းချုပ်ခန်း",
    welcomeBack: "ပြန်လည်ကြိုဆိုပါသည်",
    adminDashboardDesc: "ဒေသအားလုံးနှင့် အချက်အလက်များအားလုံးကို ခြုံငုံကြည့်ရှုနိုင်ပါသည်။",
    liveMetrics: "လက်ရှိ အခြေအနေများ",
    operationsActions: "လုပ်ဆောင်ချက်များ",
    totalVolunteers: "စုစုပေါင်း စေတနာ့ဝန်ထမ်း",
    totalCampaigns: "လက်ရှိလှုပ်ရှားမှုများ",
    totalAdmins: "စုစုပေါင်း အက်ဒမင်များ",
    pendingAidReq: "စောင့်ဆိုင်းဆဲ အကူအညီ",
    manageCampaignsTitle: "ကမ်ပိန်းများ စီမံရန်",
    manageCampaignsDesc: "အလှူငွေကောက်ခံမှုများကို ဖန်တီးရန်၊ ပြင်ဆင်ရန်နှင့် ဖျက်သိမ်းရန်။",
    volunteerListTitle: "စေတနာ့ဝန်ထမ်း စာရင်း",
    volunteerListDesc: "စေတနာ့ဝန်ထမ်းများကို ကြည့်ရှုရန်၊ ရှာဖွေရန်နှင့် စီမံခန့်ခွဲရန်။",
    applicationsTitle: "လျှောက်လွှာများ",
    applicationsDesc: "စေတနာ့ဝန်ထမ်း လျှောက်လွှာများကို စစ်ဆေး အတည်ပြုရန်။",
    managePostsTitle: "သတင်းများ စီမံရန်",
    managePostsDesc: "သတင်းများနှင့် ကြေညာချက်များကို ရေးသား လွှင့်တင်ရန်။",
    manageDonationsTitle: "အလှူငွေများ စီမံရန်",
    manageDonationsDesc: "အလှူငွေ လွှဲပြောင်းမှုများကို စစ်ဆေး အတည်ပြုရန်။",
    donationApprovalsTitle: "အလှူငွေ အတည်ပြုချက်များ",
    donationApprovalsDesc: "စောင့်ဆိုင်းဆဲ အလှူငွေများကို အတည်ပြု/ပယ်ချရန်နှင့် မှတ်တမ်းကြည့်ရန်။",
    aidRequestsTitle: "အကူအညီ တောင်းခံမှုများ",
    aidRequestsDesc: "အသုံးပြုသူများ၏ အကူအညီတောင်းခံမှုများကို စစ်ဆေး အတည်ပြုရန်။",
    storeInventoryTitle: "ကုန်လှောင်ရုံ / ပစ္စည်းများ",
    storeInventoryDesc: "လှူဒါန်းထားသော ပစ္စည်းများကို စီမံရန်နှင့် အရေးပေါ်ထုတ်ယူမှုများကို မှတ်တမ်းတင်ရန်။",
    auditLogsTitle: "လုပ်ဆောင်ချက် မှတ်တမ်းများ",
    auditLogsDesc: "အက်ဒမင် လုပ်ဆောင်ချက်များနှင့် လုံခြုံရေး မှတ်တမ်းများကို ကြည့်ရှုရန်။",
    userManagementTitle: "အကောင့်များ စီမံရန်",
    userManagementDesc: "စနစ်အတွင်းရှိ အသုံးပြုသူအားလုံးကို စီမံရန်၊ ရာထူးပြောင်းရန်နှင့် အကောင့်ဖျက်ရန်။",
    viewAction: "ကြည့်ရှုရန်",
    manageAction: "စီမံရန်"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("language") || "en";
  });

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "my" : "en";
    setLang(newLang);
    localStorage.setItem("language", newLang);
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
