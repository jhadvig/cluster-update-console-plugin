// Adapted from lightspeed-agentic-console at 203075b. See README.md in this directory.
import { ExpandableSection, Label, Stack, StackItem, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { RBACResult } from '../../../models/agenticrun';
import { I18N_NAMESPACE } from '../../../utils/constants';

export const RequiredPermissions: FC<{ rbac: RBACResult }> = ({ rbac }) => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const rules = [
    ...(rbac.namespaceScoped ?? []).map((rule) => ({ ...rule, clusterScoped: false })),
    ...(rbac.clusterScoped ?? []).map((rule) => ({ ...rule, clusterScoped: true })),
  ];
  if (!rules.length) return null;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h4" size="md">
          {t('Required permissions')}
        </Title>
      </StackItem>
      <StackItem>
        <ExpandableSection toggleText={t('View permission details')}>
          <Table aria-label={t('Required permissions')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Namespace')}</Th>
                <Th>{t('API groups')}</Th>
                <Th>{t('Resources')}</Th>
                <Th>{t('Resource names')}</Th>
                <Th>{t('Verbs')}</Th>
                <Th>{t('Purpose')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rules.map((rule, i) => (
                <Tr key={i}>
                  <Td dataLabel={t('Namespace')}>
                    {rule.clusterScoped ? (
                      <Label color="purple" isCompact>
                        {t('Cluster-wide')}
                      </Label>
                    ) : (
                      rule.namespace || '-'
                    )}
                  </Td>
                  <Td dataLabel={t('API groups')}>
                    {rule.apiGroups.map((group) => group || t('Core')).join(', ')}
                  </Td>
                  <Td dataLabel={t('Resources')}>{rule.resources.join(', ')}</Td>
                  <Td dataLabel={t('Resource names')}>
                    {rule.resourceNames?.join(', ') || t('All')}
                  </Td>
                  <Td dataLabel={t('Verbs')}>{rule.verbs.join(', ')}</Td>
                  <Td dataLabel={t('Purpose')}>{rule.justification}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ExpandableSection>
      </StackItem>
    </Stack>
  );
};
