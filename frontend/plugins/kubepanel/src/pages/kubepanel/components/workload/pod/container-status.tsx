import { PodContainerStatus } from '@/k8slens/kube-object';
import { LocaleDate } from '@/components/kube/local-date';
import moment from 'moment-timezone';
import { getStatusColor } from '@/utils/status-color';
import { entries, startCase } from 'lodash';
import { KubeRecord } from '@/components/kube/kube-record';
import React from 'react';

interface ContainerStatusProps {
  state: string;
  status: PodContainerStatus | null | undefined;
}

const ContainerStatus = ({ state, status }: ContainerStatusProps) => {
  const { ready = false, state: containerState = {} } = status ?? {};
  const { terminated } = containerState;

  const color = getStatusColor(state) ?? 'color-terminated';

  return (
    <span className={`text-${color}`}>
      {state}
      {ready ? ', ready' : null}
      {terminated ? ` - ${terminated.reason} (exit code: ${terminated.exitCode})` : null}
    </span>
  );
};

interface ContainerLastStateProps {
  lastState: string;
  status: PodContainerStatus | null | undefined;
}

export const ContainerLastState = ({ lastState, status }: ContainerLastStateProps) => {
  const { lastState: lastContainerState = {} } = status ?? {};
  const { terminated } = lastContainerState;
  const localeTimezone = moment.tz.guess();
  if (lastState === 'terminated' && terminated) {
    return (
      <span>
        {lastState}
        <br />
        Reason:
        {`Reason: ${terminated.reason} - exit code: ${terminated.exitCode}`}
        <br />
        {'Started at: '}
        {<LocaleDate date={terminated.startedAt} localeTimezone={localeTimezone} />}
        <br />
        {'Finished at: '}
        {<LocaleDate date={terminated.finishedAt} localeTimezone={localeTimezone} />}
        <br />
      </span>
    );
  }

  return null;
};

const legalKeys = ['running', 'terminated', 'waiting'] as const;
export const renderContainerStateTooltipTitle = (
  name: string,
  stateKey: string,
  status: PodContainerStatus | undefined | null
) => {
  const { state } = status ?? {};
  if (!state) return null;

  const key = stateKey as keyof typeof state;
  if (!legalKeys.includes(key)) return null;

  return (
    <>
      <div className="text-center">
        {name} {<ContainerStatus state={key} status={status} />}
      </div>
      <div className="flex flex-col align-center flex-wrap w-max">
        {entries(state[key]).map(([name, value]) => (
          <div className="grid gap-2.5 grid-cols-[max-content_1fr] grid-flow-row" key={name}>
            <div className="text-right font-medium">{startCase(name)}</div>
            <div className="text-left font-light text-gray-300">{value}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ContainerStatus;
