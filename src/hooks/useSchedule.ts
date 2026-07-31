"use client";

import { useCallback, useEffect, useState } from "react";
import { generateId } from "@/lib/id";
import { storage } from "@/lib/storage";
import type { ScheduleEvent } from "@/lib/types";
import { useLocalStorageReady } from "./useLocalStorageReady";

function sortByDateTimeAsc(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );
}

const NOW_REFRESH_MS = 30000;

export function useSchedule() {
  const ready = useLocalStorageReady();
  const [allEvents, setAllEvents] = useState<ScheduleEvent[]>([]);
  // Tracked as state (refreshed on an interval) rather than calling Date.now()
  // directly during render, which would make the render impure.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage once client-hydrated
    if (ready) setAllEvents(sortByDateTimeAsc(storage.getSchedule()));
  }, [ready]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- clock tick, not derived render state */
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), NOW_REFRESH_MS);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => clearInterval(interval);
  }, []);

  const persist = useCallback((next: ScheduleEvent[]) => {
    const sorted = sortByDateTimeAsc(next);
    setAllEvents(sorted);
    storage.setSchedule(sorted);
  }, []);

  const addEvent = useCallback(
    (title: string, dateTime: string, reminderMinutesBefore: number) => {
      const next: ScheduleEvent = {
        id: generateId(),
        title,
        dateTime,
        reminderMinutesBefore,
        createdAt: new Date().toISOString(),
      };
      persist([...allEvents, next]);
    },
    [allEvents, persist]
  );

  const removeEvent = useCallback(
    (id: string) => {
      persist(allEvents.filter((event) => event.id !== id));
    },
    [allEvents, persist]
  );

  const markNotified = useCallback(
    (id: string) => {
      persist(
        allEvents.map((event) =>
          event.id === id ? { ...event, notifiedAt: new Date().toISOString() } : event
        )
      );
    },
    [allEvents, persist]
  );

  const events =
    now === null ? [] : allEvents.filter((event) => new Date(event.dateTime).getTime() > now);
  // Kept visible (most recent first) instead of silently vanishing the moment
  // an event's time passes — users read that as "my event got deleted".
  const pastEvents =
    now === null
      ? []
      : allEvents.filter((event) => new Date(event.dateTime).getTime() <= now).reverse();

  return { ready, events, pastEvents, addEvent, removeEvent, markNotified };
}
