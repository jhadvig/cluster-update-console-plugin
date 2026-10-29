import { derivePhase } from '../models/agenticrun';
import { resourcesFor, type Scenario } from '../preview/data';
import { getPreview, setScenario, startStage } from '../preview/store';

it.each<[Scenario, string]>([
  ['Pending', 'Pending'],
  ['Analyzing', 'Analyzing'],
  ['Proposed', 'Proposed'],
  ['Executing', 'Executing'],
  ['AwaitingVerification', 'AwaitingSync'],
  ['Verifying', 'Verifying'],
  ['Completed', 'Completed'],
  ['AnalysisFailed', 'Failed'],
  ['ExecutionFailed', 'Failed'],
  ['VerificationFailed', 'Failed'],
  ['Denied', 'Denied'],
  ['NoAction', 'Analysed'],
])('renders the real %s fixture as phase %s', (scenario, phase) => {
  const { run, results } = resourcesFor(scenario, 1);
  expect(derivePhase(run)).toBe(phase);
  if (results.length) {
    expect(run.status?.steps?.analysis?.results?.[0].name).toBe(results[0].metadata?.name);
    expect(results[0].metadata?.namespace).toBe(run.metadata?.namespace);
  }
});

it('simulates approval transitions and cancels an old transition when a scenario is reset', () => {
  jest.useFakeTimers();
  try {
    startStage('Analyzing');
    expect(getPreview().scenario).toBe('Analyzing');
    jest.advanceTimersByTime(14000);
    expect(getPreview().scenario).toBe('Proposed');
    startStage('Executing');
    jest.advanceTimersByTime(14000);
    expect(getPreview().scenario).toBe('AwaitingVerification');
    startStage('Verifying');
    jest.advanceTimersByTime(14000);
    expect(derivePhase(getPreview().run)).toBe('Completed');
    startStage('Executing');
    setScenario('AnalysisFailed');
    jest.advanceTimersByTime(14000);
    expect(getPreview().scenario).toBe('AnalysisFailed');
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    setScenario('Proposed');
    jest.useRealTimers();
  }
});

it.each<Scenario>(['Completed', 'ExecutionFailed'])(
  'provides the referenced execution actions for the %s preview',
  (scenario) => {
    const { run, executionResults } = resourcesFor(scenario, 1);
    expect(run.status?.steps?.execution?.results?.at(-1)?.name).toBe(
      executionResults[0].metadata.name,
    );
    expect(executionResults[0].spec.agenticRunName).toBe(run.metadata?.name);
    expect(
      executionResults[0].status.actionsTaken.some((action) => action.outcome === 'Failed'),
    ).toBe(scenario === 'ExecutionFailed');
  },
);
