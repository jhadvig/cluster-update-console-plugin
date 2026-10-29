// Adapted from lightspeed-agentic-console at 203075b. See README.md in this directory.
import {
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ExpandableSection,
  ExpandableSectionToggle,
} from '@patternfly/react-core';
import { type FC, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_NAMESPACE } from '../../../utils/constants';

export const CodeBlockWithClipboard: FC<{ code: string; maxLines?: number }> = ({
  code,
  maxLines = 20,
}) => {
  const { t } = useTranslation(I18N_NAMESPACE);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const id = useId();
  const toggleId = `code-block-toggle-${id}`;
  const contentId = `code-block-expand-${id}`;
  const lines = code.split('\n');
  const isExpandable = lines.length > maxLines;

  return (
    <CodeBlock
      actions={
        <CodeBlockAction>
          <ClipboardCopyButton
            id={`copy-code-button-${id}`}
            exitDelay={copyStatus !== 'idle' ? 1500 : 600}
            onClick={() => {
              if (!navigator.clipboard) {
                setCopyStatus('error');
                return;
              }
              navigator.clipboard.writeText(code).then(
                () => setCopyStatus('success'),
                () => setCopyStatus('error'),
              );
            }}
            onTooltipHidden={() => setCopyStatus('idle')}
            variant="plain"
          >
            {copyStatus === 'success'
              ? t('Successfully copied to clipboard!')
              : copyStatus === 'error'
                ? t('Failed to copy to clipboard')
                : t('Copy to clipboard')}
          </ClipboardCopyButton>
        </CodeBlockAction>
      }
    >
      <CodeBlockCode aria-label={t('Copyable code')}>
        {isExpandable ? lines.slice(0, maxLines).join('\n') : code}
        {isExpandable && (
          <ExpandableSection
            contentId={contentId}
            isDetached
            isExpanded={isExpanded}
            toggleId={toggleId}
          >
            {'\n' + lines.slice(maxLines).join('\n')}
          </ExpandableSection>
        )}
      </CodeBlockCode>
      {isExpandable && (
        <ExpandableSectionToggle
          contentId={contentId}
          direction="up"
          isExpanded={isExpanded}
          onToggle={setIsExpanded}
          toggleId={toggleId}
        >
          {isExpanded ? t('Show less') : t('Show more')}
        </ExpandableSectionToggle>
      )}
    </CodeBlock>
  );
};
