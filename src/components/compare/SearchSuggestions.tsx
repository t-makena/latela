import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

interface SearchSuggestionsProps {
  onSelect: (term: string) => void;
}

export const SearchSuggestions = ({ onSelect }: SearchSuggestionsProps) => {
  const { t } = useLanguage();
  
  const suggestions = ['bread', 'milk', 'eggs', 'chicken', 'rice', 'sugar', 'flour', 'butter'];
  
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((term) => (
        <Button
          key={term}
          variant="outline"
          size="sm"
          onClick={() => onSelect(term)}
          className="rounded-full border-2 border-foreground hover:bg-accent capitalize"
        >
          {term}
        </Button>
      ))}
    </div>
  );
};
