import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Card,
  CardBody,
  Content,
  ExpandableSection,
  Flex,
  FlexItem,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { BanIcon } from '@patternfly/react-icons';
import {
  AgenticRunPhase,
  LightspeedAgenticRun,
  LightspeedAnalysisResult,
  derivePhase,
  getAnalysisDataFromResult,
  getFailedStage,
  getPhaseDisplay,
  hasRemediationPlan,
} from '../../models/agenticrun';
import { ClusterVersion } from '../../models/clusterversion';
import { I18N_NAMESPACE } from '../../utils/constants';
import { hasExecution } from '../../utils/execution';
import { getLogCondition, hasStepLogs } from '../../utils/logPhase';
import { AnalysisLogs, ExecutionLogs } from '../shared/ExecutionLogs';
import PhaseIcon from '../shared/PhaseIcon';
import AnalysisResultView from './AnalysisResultView';
import DecisionActions from './DecisionActions';
import PlanHeader from './PlanHeader';

type UpdatePhaseSectionProps = {
  title: string;
  phase: AgenticRunPhase;
  skipped?: boolean;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  children: React.ReactNode;
};

const UpdatePhaseSection: React.FC<UpdatePhaseSectionProps> = ({
  title,
  phase,
  skipped,
  isExpanded,
  onToggle,
  children,
}) => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const status = skipped ? t('Skipped') : getPhaseDisplay(phase).label;

  return (
    <Card>
      <CardBody>
        <ExpandableSection
          toggleWrapper="h2"
          toggleContent={
            <span className="cluster-update-plugin__phase-heading">
              <span role="img" aria-label={status}>
                {skipped ? (
                  <Icon>
                    <BanIcon />
                  </Icon>
                ) : (
                  <PhaseIcon phase={phase} />
                )}
              </span>
              {title}
            </span>
          }
          isExpanded={isExpanded}
          onToggle={(_event, expanded) => onToggle(expanded)}
        >
          {children}
        </ExpandableSection>
      </CardBody>
    </Card>
  );
};

type UpdatePlanSectionsProps = {
  agenticRun: LightspeedAgenticRun;
  clusterVersion: ClusterVersion;
  analysisResults: LightspeedAnalysisResult[];
  submitted: boolean;
  reanalyseButton: React.ReactNode;
};

const UpdatePlanSections: React.FC<UpdatePlanSectionsProps> = ({
  agenticRun,
  clusterVersion,
  analysisResults,
  submitted,
  reanalyseButton,
}) => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const phase = derivePhase(agenticRun);
  const analysisCondition = getLogCondition(agenticRun, 'analysis');
  const executionCondition = getLogCondition(agenticRun, 'execution');
  const executionSkipped = executionCondition?.reason === 'Skipped';
  const executionStarted =
    !executionSkipped &&
    (hasExecution(agenticRun) ||
      ['AwaitingSync', 'Verifying', 'Completed', 'Escalating', 'Escalated'].includes(phase));
  const [expanded, setExpanded] = React.useState({
    analysis: !executionStarted,
    execution: executionStarted,
  });

  // Follow phase transitions, but preserve manual toggles during status refreshes.
  React.useEffect(() => {
    setExpanded({ analysis: !executionStarted, execution: executionStarted });
  }, [executionStarted]);

  const analysisPhase: AgenticRunPhase =
    analysisCondition?.status === 'True'
      ? 'Completed'
      : analysisCondition?.status === 'False'
        ? 'Failed'
        : phase === 'Analyzing' || submitted
          ? 'Analyzing'
          : 'Pending';
  const executionPhase =
    executionStarted || phase === 'Approved' || phase === 'Denied' ? phase : 'Pending';
  const failedStage = phase === 'Failed' ? getFailedStage(agenticRun) : undefined;
  const analysisFailed = analysisPhase === 'Failed';
  const stepResults = agenticRun.status?.steps?.analysis?.results;
  const resultRef = (stepResults?.[stepResults.length - 1] as { name?: string })?.name;
  const result = resultRef
    ? analysisResults.find(
        (r) =>
          r.metadata?.name === resultRef &&
          r.metadata?.namespace === agenticRun.metadata?.namespace,
      )
    : undefined;
  const resultData = getAnalysisDataFromResult(result);
  const hasResultData =
    resultData.options.length > 0 || resultData.components.length > 0 || !!resultData.analysisData;
  const analysisLogs = hasStepLogs(agenticRun, 'analysis') ? (
    <AnalysisLogs run={agenticRun} />
  ) : null;

  return (
    <>
      <StackItem>
        <UpdatePhaseSection
          title={t('Update analysis')}
          phase={analysisPhase}
          skipped={analysisCondition?.reason === 'Skipped'}
          isExpanded={expanded.analysis}
          onToggle={(analysis) => setExpanded((prev) => ({ ...prev, analysis }))}
        >
          <Stack hasGutter>
            <StackItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem grow={{ default: 'grow' }}>
                  <PlanHeader agenticRun={agenticRun} />
                </FlexItem>
                {phase !== 'Pending' && <FlexItem>{reanalyseButton}</FlexItem>}
              </Flex>
            </StackItem>
            {analysisPhase === 'Analyzing' && (
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <Spinner size="lg" aria-label={t('Analyzing')} />
                  </FlexItem>
                  <FlexItem>
                    <Stack>
                      <StackItem>
                        <strong>
                          {agenticRun.status?.steps?.analysis?.sandbox?.claimName
                            ? t('AI agent is analysing cluster readiness...')
                            : t('Starting analysis — waiting for agent sandbox...')}
                        </strong>
                      </StackItem>
                      {agenticRun.status?.steps?.analysis?.sandbox?.claimName && (
                        <StackItem>
                          <Content component="small">
                            {t('Sandbox: {{name}}', {
                              name: agenticRun.status.steps.analysis.sandbox.claimName,
                            })}
                          </Content>
                        </StackItem>
                      )}
                    </Stack>
                  </FlexItem>
                </Flex>
              </StackItem>
            )}
            {analysisFailed && (
              <StackItem>
                <Alert variant="danger" isInline title={t('Analysis failed')}>
                  {result?.status?.failureReason ??
                    analysisCondition?.message ??
                    t('Unknown error')}
                </Alert>
              </StackItem>
            )}
            {hasResultData && analysisPhase !== 'Analyzing' ? (
              <StackItem>
                <AnalysisResultView analysisData={resultData} analysisLogs={analysisLogs} />
              </StackItem>
            ) : (
              <>
                {analysisPhase !== 'Analyzing' && !analysisFailed && (
                  <StackItem>
                    <Content component="p">
                      {phase === 'Pending'
                        ? t('Select Analyse to assess cluster readiness for this update.')
                        : t('Analysis result not yet available.')}
                    </Content>
                  </StackItem>
                )}
                {analysisLogs && <StackItem>{analysisLogs}</StackItem>}
              </>
            )}
            {result && !hasRemediationPlan(result) && phase === 'Proposed' && (
              <StackItem>
                <Alert variant="info" isInline title={t('No remediation plan available')}>
                  {t(
                    'Analysis indicates this upgrade is not feasible. Review diagnosis for details.',
                  )}
                </Alert>
              </StackItem>
            )}
            {result && hasRemediationPlan(result) && phase === 'Proposed' && (
              <StackItem>
                <DecisionActions
                  agenticRun={agenticRun}
                  clusterVersion={clusterVersion}
                  analysisData={resultData}
                />
              </StackItem>
            )}
          </Stack>
        </UpdatePhaseSection>
      </StackItem>
      <StackItem>
        <UpdatePhaseSection
          title={t('Update execution')}
          phase={executionPhase}
          skipped={executionSkipped}
          isExpanded={expanded.execution}
          onToggle={(execution) => setExpanded((prev) => ({ ...prev, execution }))}
        >
          <Stack hasGutter>
            {failedStage && !analysisFailed && (
              <StackItem>
                <Alert
                  variant="danger"
                  isInline
                  title={t('{{stage}} failed', { stage: failedStage.label })}
                >
                  {failedStage.message ?? t('Unknown error')}
                </Alert>
              </StackItem>
            )}
            {hasExecution(agenticRun) && !executionSkipped ? (
              <StackItem>
                <ExecutionLogs run={agenticRun} />
              </StackItem>
            ) : (
              <StackItem>
                <Content component="p">
                  {executionSkipped
                    ? t('Execution was skipped for this analysis-only update plan.')
                    : phase === 'Denied'
                      ? t('Execution was denied.')
                      : phase === 'Approved'
                        ? t('Waiting for execution to start...')
                        : t(
                            'Execution has not started. Review and approve the analysis plan to proceed.',
                          )}
                </Content>
              </StackItem>
            )}
          </Stack>
        </UpdatePhaseSection>
      </StackItem>
    </>
  );
};

export default UpdatePlanSections;
