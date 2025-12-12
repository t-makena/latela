import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const LanguageSettings = () => {
  const { t, currentLanguage, changeLanguage, languages } = useLanguage();

  return (
    <Card style={{ boxShadow: '4px 4px 0px #000000' }}>
      <CardHeader>
        <CardTitle>{t('settings.language')}</CardTitle>
        <CardDescription>{t('settings.chooseLanguage')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={currentLanguage} onValueChange={changeLanguage}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder={t('settings.chooseLanguage')} />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50">
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
