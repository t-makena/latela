import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import zu from '@/locales/zu.json';
import xh from '@/locales/xh.json';
import af from '@/locales/af.json';
import nso from '@/locales/nso.json';
import tn from '@/locales/tn.json';
import st from '@/locales/st.json';
import ts from '@/locales/ts.json';
import ss from '@/locales/ss.json';
import ve from '@/locales/ve.json';
import nr from '@/locales/nr.json';

const resources = {
  en: { translation: en },
  zu: { translation: zu },
  xh: { translation: xh },
  af: { translation: af },
  nso: { translation: nso },
  tn: { translation: tn },
  st: { translation: st },
  ts: { translation: ts },
  ss: { translation: ss },
  ve: { translation: ve },
  nr: { translation: nr },
};

// Get saved language or default to English
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zu', name: 'isiZulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'isiXhosa', nativeName: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'nso', name: 'Sepedi', nativeName: 'Sepedi' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
  { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga' },
  { code: 'ss', name: 'siSwati', nativeName: 'siSwati' },
  { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda' },
  { code: 'nr', name: 'isiNdebele', nativeName: 'isiNdebele' },
];

export default i18n;
