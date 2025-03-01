import { Button, ButtonProps } from '@chakra-ui/react';
import { useConfirm } from 'chakra-confirm';
import React from 'react';
import { Event, useCancelEventMutation } from '../../../../generated/graphql';
import { DASHBOARD_EVENT, DASHBOARD_EVENTS } from '../graphql/queries';
import {
  DATA_PAGINATED_EVENTS_TOTAL_QUERY,
  EVENT,
} from '../../../events/graphql/queries';

interface EventCancelButtonProps {
  size?: ButtonProps['size'];
  buttonText: string;
  event: Pick<Event, 'id' | 'canceled'>;
  isDisabled?: boolean;
}

const EventCancelButton = (props: EventCancelButtonProps) => {
  const { isDisabled = false, buttonText, event, ...rest } = props;

  const [cancel] = useCancelEventMutation();

  const confirmCancel = useConfirm({
    title: 'Are you sure you want to cancel this',
    body: 'Canceling this will send emails to attendees',
    buttonColor: 'orange',
  });

  const data = {
    variables: { eventId: event.id },
    refetchQueries: [
      { query: EVENT, variables: { eventId: event.id } },
      { query: DASHBOARD_EVENT, variables: { eventId: event.id } },
      {
        query: DATA_PAGINATED_EVENTS_TOTAL_QUERY,
        variables: { offset: 0, limit: 2 },
      },
      { query: DASHBOARD_EVENTS },
    ],
  };

  const clickCancel = async () => {
    const ok = await confirmCancel();
    if (ok) {
      await cancel(data);
    }
  };
  return (
    <Button {...rest} onClick={clickCancel} isDisabled={isDisabled}>
      {buttonText}
    </Button>
  );
};

export default EventCancelButton;
