import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Smart Saloon",
      "skip_wait": "Skip the Wait.",
      "find_empty": "Find Empty Salons.",
      "hero_desc": "Real-time AI camera tracking meets elegant design. Know exactly how many people are waiting and your estimated wait time before you even leave home.",
      "find_salon_btn": "Find a Salon",
      "open_map_btn": "Open Live Map",
      "install_app": "Install App",
      "nav_find": "Find Salons",
      "nav_customer_login": "Customer Sign In",
      "nav_register": "Register Shop",
      "nav_owner_login": "Owner Login",
      "distance_km": "{{dist}} km away",
      "people_waiting": "{{count}} people waiting",
      "wait_time": "Wait Time: {{time}} mins",
      "status_available": "AVAILABLE",
      "status_medium": "MEDIUM",
      "status_busy": "BUSY",
      "last_updated": "Last updated: {{time}}",
      "current_crowd": "Current Crowd",
      "predicted_wait": "Predicted Wait",
      "remove_watchlist": "Remove from Watchlist",
      "add_watchlist": "Add to Watchlist",
      "back_to_map": "Back to Map",
      "future_queueing": "The Future of",
      "salon_queueing": "Salon Queueing",
      "location_based": "Location Based",
      "location_desc": "Instantly find salons near you utilizing accurate Haversine geolocation.",
      "realtime_tracking": "Real-time Tracking",
      "realtime_desc": "Powerful AI cameras count the crowd live. No more guessing if it's busy.",
      "smart_predictions": "Smart Predictions",
      "smart_desc": "Our algorithm predicts your exact wait time based on the active crowd.",
      "find_nearby": "Find Salons Nearby",
      
      "register_title": "New Saloon Registration",
      "register_subtitle": "Power your business with AI.",
      "owner_name": "Owner Name",
      "email_address": "Email Address",
      "password": "Password",
      "phone_number": "Phone Number",
      "salon_name": "Salon Name",
      "set_location": "Set My Shop Location",
      "location_success": "Location Saved Successfully!",
      "acquiring_gps": "Acquiring GPS...",
      "register_btn": "Complete Registration",
      "already_have_account": "Already have an account?",
      
      "customer_login_title": "Customer Login",
      "customer_join_title": "Join Smart Saloon",
      "customer_login_sub": "Access your synchronized favorites.",
      "customer_join_sub": "Sign Up to Save Favorites permanently.",
      "full_name": "Full Name",
      "login_btn": "Login to Smart Saloon",
      "create_customer_btn": "Create Customer Account",
      "need_account": "Need an account? Sign Up",
      "have_account_login": "Already have an account? Login",
      
      "owner_portal": "Owner Portal",
      "manage_status": "Manage your salon status",
      "sign_in": "Sign In",
      
      "salon_dashboard": "Salon Dashboard",
      "logout": "Logout",
      "store_status": "Store Status",
      "store_status_desc": "Turn your store online so customers can see you on the map.",
      "close_store": "Close Store",
      "open_store": "Open Store",
      "camera_data_desc": "When active, the AI Camera data will be pushed automatically to customers looking for salons.",
      
      "nearby_salons": "Nearby Salons",
      "refresh": "Refresh",
      "finding_salons": "Finding nearby salons...",
      "no_active_salons": "No active salons found near you."
    }
  },
  bn: {
    translation: {
      "app_name": "স্মার্ট সেলুন",
      "skip_wait": "অপেক্ষা এড়িয়ে যান।",
      "find_empty": "ফাঁকা সেলুন খুঁজুন।",
      "hero_desc": "রিয়েল-টাইম এআই ক্যামেরা ট্র্যাকিংয়ের সাথে চমৎকার ডিজাইনের মেলবন্ধন। সেলুনে যাওয়ার আগেই জেনে নিন ঠিক কতজন অপেক্ষা করছেন এবং আপনার কতক্ষণ লাগবে।",
      "find_salon_btn": "সেলুন খুঁজুন",
      "open_map_btn": "লাইভ ম্যাপ খুলুন",
      "install_app": "অ্যাপ ইনস্টল করুন",
      "nav_find": "সেলুন খুঁজুন",
      "nav_customer_login": "কাস্টমার লগইন",
      "nav_register": "দোকান নিবন্ধন করুন",
      "nav_owner_login": "মালিক লগইন",
      "distance_km": "{{dist}} কিমি দূরে",
      "people_waiting": "{{count}} জন অপেক্ষায়",
      "wait_time": "অপেক্ষার সময়: {{time}} মিনিট",
      "status_available": "ফাঁকা",
      "status_medium": "মাঝারি",
      "status_busy": "ব্যস্ত",
      "last_updated": "সর্বশেষ আপডেট: {{time}}",
      "current_crowd": "বর্তমান ভিড়",
      "predicted_wait": "অনুমানিত সময়",
      "remove_watchlist": "তালিকা থেকে সরান",
      "add_watchlist": "তালিকাভুক্ত করুন",
      "back_to_map": "ম্যাপে ফিরে যান",
      "future_queueing": "ভবিষ্যতের",
      "salon_queueing": "সেলুন কিউইং",
      "location_based": "লোকেশন ভিত্তিক",
      "location_desc": "নির্ভুল জিওলোকেশন ব্যবহার করে আপনার কাছাকাছি সেলুন খুঁজুন।",
      "realtime_tracking": "রিয়েল-টাইম ট্র্যাকিং",
      "realtime_desc": "শক্তিশালী এআই ক্যামেরা লাইভ ভিড় গণনা করে। সেলুন ফাঁকা নাকি ব্যস্ত, তা আর অনুমান করতে হবে না।",
      "smart_predictions": "স্মার্ট পূর্বাভাস",
      "smart_desc": "আমাদের অ্যালগরিদম সেলুনের ভিড়ের ওপর ভিত্তি করে আপনার অপেক্ষার সঠিক সময় অনুমান করে।",
      "find_nearby": "কাছাকাছি সেলুন খুঁজুন",
      
      "register_title": "নতুন সেলুন নিবন্ধন",
      "register_subtitle": "এআই দিয়ে আপনার ব্যবসাকে শক্তিশালী করুন।",
      "owner_name": "মালিকের নাম",
      "email_address": "ইমেইল অ্যাড্রেস",
      "password": "পাসওয়ার্ড",
      "phone_number": "ফোন নম্বর",
      "salon_name": "দোকানের নাম",
      "set_location": "আমার দোকানের অবস্থান সেট করুন",
      "location_success": "অবস্থান সফলভাবে রেকর্ড করা হয়েছে!",
      "acquiring_gps": "জিপিএস খুঁজছি...",
      "register_btn": "নিবন্ধন সম্পন্ন করুন",
      "already_have_account": "ইতোমধ্যে অ্যাকাউন্ট আছে?",
      
      "customer_login_title": "কাস্টমার লগইন",
      "customer_join_title": "স্মার্ট সেলুনে যোগ দিন",
      "customer_login_sub": "আপনার সিঙ্ক করা ফেভারিট তালিকা অ্যাক্সেস করুন।",
      "customer_join_sub": "সবসময়ের জন্য ফেভারিট সেভ করতে সাইন আপ করুন।",
      "full_name": "পুরো নাম",
      "login_btn": "লগইন করুন",
      "create_customer_btn": "কাস্টমার অ্যাকাউন্ট তৈরি করুন",
      "need_account": "অ্যাকাউন্ট নেই? সাইন আপ করুন",
      "have_account_login": "ইতোমধ্যে অ্যাকাউন্ট আছে? লগইন করুন",
      
      "owner_portal": "মালিক পোর্টাল",
      "manage_status": "আপনার সেলুনের স্ট্যাটাস পরিচালনা করুন",
      "sign_in": "সাইন ইন করুন",
      
      "salon_dashboard": "সেলুন ড্যাশবোর্ড",
      "logout": "লগআউট",
      "store_status": "দোকানের স্ট্যাটাস",
      "store_status_desc": "আপনার দোকান অনলাইনে চালু করুন যাতে গ্রাহকরা ম্যাপে দেখতে পারেন।",
      "close_store": "দোকান বন্ধ করুন",
      "open_store": "দোকান খুলুন",
      "camera_data_desc": "চালু থাকলে, স্বয়ংক্রিয়ভাবে সেলুন খোঁজা গ্রাহকদের কাছে এআই ক্যামেরা ডেটা পৌঁছাবে।",
      
      "nearby_salons": "কাছাকাছি সেলুন",
      "refresh": "রিফ্রেশ করুন",
      "finding_salons": "কাছাকাছি সেলুন খোঁজা হচ্ছে...",
      "no_active_salons": "আপনার কাছাকাছি কোনো সক্রিয় সেলুন পাওয়া যায়নি।"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
