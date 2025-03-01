import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { isFuture } from 'date-fns';

import {
  useCreateEventMutation,
  useJoinChapterMutation,
  useSendEventInviteMutation,
} from '../../../../generated/graphql';
import { useAlert } from '../../../../hooks/useAlert';
import { DashboardLayout } from '../../shared/components/DashboardLayout';
import EventForm from '../components/EventForm';
import { EventFormData, parseEventData } from '../components/EventFormUtils';
import { CHAPTER } from '../../../chapters/graphql/queries';
import { DASHBOARD_EVENTS } from '../graphql/queries';
import { NextPageWithLayout } from '../../../../pages/_app';
import { DATA_PAGINATED_EVENTS_TOTAL_QUERY } from 'modules/events/graphql/queries';

export const NewEventPage: NextPageWithLayout<{
  chapterId?: number;
}> = ({ chapterId }) => {
  const router = useRouter();

  const [createEvent] = useCreateEventMutation();

  const [publish] = useSendEventInviteMutation();

  const addAlert = useAlert();

  const [joinChapter] = useJoinChapterMutation();

  const onSubmit = async (data: EventFormData) => {
    const { chapter_id, attend_event } = data;
    const { data: eventData, errors } = await createEvent({
      variables: {
        chapterId: chapter_id,
        data: parseEventData(data),
        attendEvent: attend_event ?? false,
      },
      refetchQueries: [
        { query: CHAPTER, variables: { chapterId: chapter_id } },
        {
          query: DATA_PAGINATED_EVENTS_TOTAL_QUERY,
          variables: { offset: 0, limit: 2 },
        },
        {
          query: DASHBOARD_EVENTS,
        },
      ],
    });

    if (errors) throw errors;

    if (eventData) {
      if (attend_event) joinChapter({ variables: { chapterId: chapter_id } });
      if (isFuture(data.start_at)) {
        await publish({ variables: { eventId: eventData.createEvent.id } });
      }
      await router.replace(
        `/dashboard/events/[id]`,
        `/dashboard/events/${eventData.createEvent.id}`,
      );
      addAlert({
        title: `Event "${eventData.createEvent.name}" created!`,
        status: 'success',
      });
    }
  };

  return (
    <EventForm
      onSubmit={onSubmit}
      submitText="Add event"
      loadingText="Adding Event"
      chapterId={chapterId}
      formType="new"
    />
  );
};

NewEventPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
