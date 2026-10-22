import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { useApprovalPolicy } from '../../hooks/useAgenticRuns';
import { I18N_NAMESPACE } from '../../utils/constants';

const isManual = (stage?: { approval: string }) => (stage?.approval ?? 'Manual') === 'Manual';

const ApprovalPolicyWarningBanner: React.FC = () => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const [policy, loaded, error] = useApprovalPolicy();
  const [dismissed, setDismissed] = React.useState(false);

  const stages = policy?.spec?.stages ?? [];
  const analysisStage = stages.find((s) => s.name === 'Analysis');
  const executionStage = stages.find((s) => s.name === 'Execution');

  const showBanner =
    loaded && !error && !!policy && (!isManual(analysisStage) || !isManual(executionStage));

  // Reset dismissal when the policy no longer warrants a warning, so a later switch back re-shows it.
  React.useEffect(() => {
    if (!showBanner) {
      setDismissed(false);
    }
  }, [showBanner]);

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      isInline
      title={t('Cluster ApprovalPolicy not set to Manual for all stages')}
      actionClose={<AlertActionCloseButton onClose={() => setDismissed(true)} />}
    >
      {t(
        'For upgrade workflows, it is strongly recommended to set ApprovalPolicy to Manual for both Analysis and Execution stages to ensure all upgrade actions require explicit administrator approval.',
      )}
    </Alert>
  );
};

export default ApprovalPolicyWarningBanner;
