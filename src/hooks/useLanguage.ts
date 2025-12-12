import { useTranslation } from 'react-i18next';
import { languages } from '@/lib/i18n';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language;
  const currentLanguageInfo = languages.find(l => l.code === currentLanguage) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  // Helper to get translated category name
  const getCategoryTranslation = (categoryKey: string): string => {
    const key = `categories.${categoryKey}`;
    const translation = t(key);
    return translation !== key ? translation : categoryKey;
  };

  return {
    t,
    currentLanguage,
    currentLanguageInfo,
    changeLanguage,
    languages,
    getCategoryTranslation,
  };
};
