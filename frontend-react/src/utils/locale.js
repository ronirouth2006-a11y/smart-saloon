export const convertToBengaliDigits = (str) => {
  if (!str) return str;
  const bengaliDigits = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return str.toString().replace(/[0-9]/g, w => bengaliDigits[w]);
};

export const formatLocalTime = (timeStr, lang) => {
  if (!timeStr) return timeStr;
  if (!lang.startsWith('bn')) return timeStr;

  let converted = convertToBengaliDigits(timeStr);
  converted = converted.replace('AM', 'পূর্বাহ্ন').replace('PM', 'অপরাহ্ন');
  return converted;
};

export const formatLocalNum = (num, lang) => {
  if (num === null || num === undefined) return num;
  if (lang.startsWith('bn')) {
    return new Intl.NumberFormat('bn-IN', { useGrouping: false }).format(num);
  }
  return num;
};
