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
