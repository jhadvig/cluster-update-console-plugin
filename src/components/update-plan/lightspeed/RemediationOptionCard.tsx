// Adapted from lightspeed-agentic-console at 203075b. See README.md in this directory.
import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Radio,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { AngleDownIcon, AngleUpIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { RemediationOption, getRiskColor } from '../../../models/agenticrun';
import { I18N_NAMESPACE } from '../../../utils/constants';
import { MarkdownContent } from '../../shared/MarkdownContent';
import { CodeBlockWithClipboard } from './CodeBlockWithClipboard';
import { RequiredPermissions } from './RequiredPermissions';

type RemediationOptionCardProps = {
  option: RemediationOption;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect?: () => void;
  onToggleExpand: () => void;
};

export const RemediationOptionCard: React.FC<RemediationOptionCardProps> = ({
  option,
  index,
  isExpanded,
  isSelected,
  onSelect,
  onToggleExpand,
}) => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const id = React.useId();
  const plan = option.remediationPlan;
  const title = option.title || t('Remediation Plan {{index}}', { index: index + 1 });
  const reversibility = plan?.reversible;
  return (
    <Card
      className={
        onSelect && isSelected ? 'cluster-update-plugin__remediation-option--selected' : undefined
      }
    >
      <CardHeader>
        <Stack hasGutter>
          <StackItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              {onSelect && (
                <FlexItem>
                  <Radio
                    id={`select-option-${id}`}
                    name="remediation-option"
                    isChecked={isSelected}
                    onChange={onSelect}
                    label={t('Select plan {{number}}', { number: index + 1 })}
                  />
                </FlexItem>
              )}
              {plan?.risk && (
                <FlexItem>
                  <Label color={getRiskColor(plan.risk)} isCompact>
                    {t('Risk: {{risk}}', { risk: plan.risk })}
                  </Label>
                </FlexItem>
              )}
              {reversibility && (
                <FlexItem>
                  <Label color={reversibility === 'Reversible' ? 'green' : 'orange'} isCompact>
                    {reversibility === 'Reversible'
                      ? t('Reversible')
                      : reversibility === 'Partial'
                        ? t('Partially reversible')
                        : t('Irreversible')}
                  </Label>
                </FlexItem>
              )}
            </Flex>
          </StackItem>
          <StackItem>
            <CardTitle>{title}</CardTitle>
          </StackItem>
          {option.summary && (
            <StackItem>
              <MarkdownContent text={option.summary} />
            </StackItem>
          )}
          <StackItem>
            <Button
              icon={isExpanded ? <AngleUpIcon /> : <AngleDownIcon />}
              iconPosition="end"
              isInline
              variant="link"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              aria-controls={`plan-details-${id}`}
              aria-label={
                isExpanded
                  ? t('Hide details for {{title}}', { title })
                  : t('View details for {{title}}', { title })
              }
            >
              {isExpanded ? t('Hide plan details') : t('View plan details')}
            </Button>
          </StackItem>
        </Stack>
      </CardHeader>
      <CardBody id={`plan-details-${id}`} hidden={!isExpanded}>
        <Stack hasGutter>
          {plan?.description && (
            <StackItem>
              <MarkdownContent text={plan.description} />
            </StackItem>
          )}
          {option.diagnosis && (
            <StackItem>
              <Title headingLevel="h4" size="md">
                {t('Root cause analysis')}
              </Title>
              <Card>
                <CardBody>
                  <MarkdownContent text={option.diagnosis.rootCause} />
                  <MarkdownContent text={option.diagnosis.summary} />
                </CardBody>
              </Card>
            </StackItem>
          )}
          {option.rbac && (
            <StackItem>
              <RequiredPermissions rbac={option.rbac} />
            </StackItem>
          )}
          {plan?.estimatedImpact && (
            <StackItem>
              <Title headingLevel="h4" size="md">
                {t('Estimated impact')}
              </Title>
              <MarkdownContent text={plan.estimatedImpact} />
            </StackItem>
          )}
          {!!plan?.actions?.length && (
            <StackItem>
              <Title headingLevel="h4" size="md">
                {t('Proposed agent commands')}
              </Title>
              <Content component="ol">
                {plan.actions.map((action, i) => (
                  <Content component="li" key={i}>
                    <Label isCompact variant="outline">
                      {action.type}
                    </Label>
                    <MarkdownContent text={action.description} />
                    {action.command && <CodeBlockWithClipboard code={action.command} />}
                  </Content>
                ))}
              </Content>
            </StackItem>
          )}
          {plan?.rollbackPlan && (
            <StackItem>
              <Title headingLevel="h4" size="md">
                {t('Recovery plan')}
              </Title>
              <MarkdownContent text={plan.rollbackPlan.description} />
              {plan.rollbackPlan.command && (
                <CodeBlockWithClipboard code={plan.rollbackPlan.command} />
              )}
            </StackItem>
          )}
          {option.verification && (
            <StackItem>
              <Title headingLevel="h4" size="md">
                {t('Verification plan')}
              </Title>
              <MarkdownContent text={option.verification.description} />
              <DescriptionList>
                {option.verification.steps?.map((step, i) => (
                  <DescriptionListGroup key={i}>
                    <DescriptionListTerm>{step.name}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {step.command && <CodeBlockWithClipboard code={step.command} />}
                      {step.expected && (
                        <Content component="small">
                          {t('Expected: {{expected}}', { expected: step.expected })}
                        </Content>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
