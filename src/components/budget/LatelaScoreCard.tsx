import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useBudgetScore } from '@/hooks/useBudgetScore';
import { useLanguage } from '@/hooks/useLanguage';
import { Shield, TrendingUp, AlertTriangle, Flame, Calendar } from 'lucide-react';

interface LatelaScoreCardProps {
  compact?: boolean;
}

export function LatelaScoreCard({ compact = false }: LatelaScoreCardProps) {
  const { scoreData, loading, totalScore, pillars, metrics, riskLevel } = useBudgetScore();
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card className={cn("w-full", compact && "border-0 shadow-none bg-transparent")}>
        <CardContent className={cn("pt-6", compact && "p-0")}>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    if (score >= 40) return 'border-orange-500';
    return 'border-red-500';
  };

  const getRiskIcon = () => {
    const iconClass = "h-5 w-5";
    switch (riskLevel) {
      case 'safe': return <Shield className={cn(iconClass, "text-green-600 dark:text-green-400")} />;
      case 'mild': return <TrendingUp className={cn(iconClass, "text-yellow-600 dark:text-yellow-400")} />;
      case 'moderate': return <AlertTriangle className={cn(iconClass, "text-orange-500 dark:text-orange-400")} />;
      case 'high': return <AlertTriangle className={cn(iconClass, "text-red-500 dark:text-red-400")} />;
      case 'critical': return <Flame className={cn(iconClass, "text-red-700 dark:text-red-500")} />;
    }
  };

  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'safe': return t('score.riskMessages.safe') || "You're on track to make it to payday comfortably.";
      case 'mild': return t('score.riskMessages.mild') || "Slight caution advised, but you should be fine.";
      case 'moderate': return t('score.riskMessages.moderate') || "Consider reducing spending to stay safe.";
      case 'high': return t('score.riskMessages.high') || "High risk of running short before payday.";
      case 'critical': return t('score.riskMessages.critical') || "Urgent: You may not have enough to last.";
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'safe': return t('score.riskLevels.safe') || 'Safe';
      case 'mild': return t('score.riskLevels.mild') || 'Mild Risk';
      case 'moderate': return t('score.riskLevels.moderate') || 'Moderate Risk';
      case 'high': return t('score.riskLevels.high') || 'High Risk';
      case 'critical': return t('score.riskLevels.critical') || 'Critical';
    }
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Compact version for mobile dashboard
  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
        {/* Score Circle */}
        <div className={cn(
          "flex items-center justify-center w-16 h-16 rounded-full border-4",
          getScoreBorderColor(totalScore)
        )}>
          <span className={cn("text-2xl font-black", getScoreColor(totalScore))}>
            {totalScore}
          </span>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getRiskIcon()}
            <span className="font-semibold text-foreground">{getRiskLabel()}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatCurrency(metrics.safeToSpendPerDay)}/{t('score.perDay') || 'day'}
          </p>
        </div>
        
        {/* Days to payday */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{metrics.daysUntilPayday}d</span>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="heading-main">
          {t('score.latelaScore') || 'Latela Score'}
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{metrics.daysUntilPayday} {t('score.daysToPayday') || 'days to payday'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Circle */}
        <div className="flex flex-col items-center py-4">
          <div className={cn(
            "flex items-center justify-center w-28 h-28 rounded-full border-8 mb-2",
            getScoreBorderColor(totalScore)
          )}>
            <span className={cn("text-4xl font-black", getScoreColor(totalScore))}>
              {totalScore}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('score.outOf100') || 'out of 100'}
          </p>
        </div>

        {/* Risk Status */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          {getRiskIcon()}
          <div className="flex-1">
            <p className="font-semibold text-foreground capitalize">{getRiskLabel()}</p>
            <p className="text-sm text-muted-foreground">{getRiskMessage()}</p>
          </div>
        </div>

        {/* Safe to Spend */}
        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">
            {t('score.safeToSpend') || 'You can safely spend'}
          </p>
          <p className="text-2xl font-black text-primary">
            {formatCurrency(metrics.safeToSpendPerDay)}
            <span className="text-base font-normal text-muted-foreground">/{t('score.perDay') || 'day'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('score.forNextDays')?.replace('{{days}}', String(metrics.daysUntilPayday)) || 
              `for the next ${metrics.daysUntilPayday} days`}
          </p>
        </div>

        {/* Pillar Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {t('score.scoreBreakdown') || 'Score Breakdown'}
          </h4>
          <PillarProgress 
            label={t('score.budgetCompliance') || 'Budget Compliance'} 
            value={pillars.budgetCompliance} 
            weight={40} 
          />
          <PillarProgress 
            label={t('score.spendingConsistency') || 'Spending Consistency'} 
            value={pillars.spendingConsistency} 
            weight={25} 
          />
          <PillarProgress 
            label={t('score.savingsHealth') || 'Savings Health'} 
            value={pillars.savingsHealth} 
            weight={25} 
          />
          <PillarProgress 
            label={t('score.cashSurvival') || 'Cash Survival'} 
            value={pillars.cashSurvivalRisk} 
            weight={10} 
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <MetricBox 
            label={t('finance.availableBalance') || 'Available Balance'} 
            value={formatCurrency(metrics.remainingBalance)} 
          />
          <MetricBox 
            label={t('score.expectedSpend') || 'Expected Spend'} 
            value={formatCurrency(metrics.expectedSpendToPayday)} 
          />
          <MetricBox 
            label={t('score.avgDailySpend') || 'Avg Daily Spend'} 
            value={formatCurrency(metrics.avgDailySpend)} 
          />
          <MetricBox 
            label={t('score.riskRatio') || 'Risk Ratio'} 
            value={`${metrics.riskRatio.toFixed(2)}x`} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PillarProgress({ label, value, weight }: { label: string; value: number; weight: number }) {
  const percentage = Math.round(value * 100);
  
  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    if (pct >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{percentage}% · {weight}% weight</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", getProgressColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
