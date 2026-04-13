import { create } from 'zustand';
import { addHours, startOfDay } from 'date-fns';
const ZOOM_HOURS = {
  hour: 2,
  '6hour': 6,
  day: 24,
  week: 168
};
export const useRMSStore = create((set, get) => ({
  timelineView: {
    startTime: startOfDay(new Date()),
    endTime: addHours(startOfDay(new Date()), 24),
    zoomLevel: 'day',
    resourceTypes: ['GATE', 'STAND', 'BELT']
  },
  filters: {
    airlines: [],
    showConflictsOnly: false
  },
  simulationMode: {
    enabled: false
  },
  setTimeRange: (start, end) => set(s => ({
    timelineView: {
      ...s.timelineView,
      startTime: start,
      endTime: end
    }
  })),
  setZoomLevel: level => {
    const {
      startTime
    } = get().timelineView;
    const endTime = addHours(startTime, ZOOM_HOURS[level]);
    set(s => ({
      timelineView: {
        ...s.timelineView,
        zoomLevel: level,
        endTime
      }
    }));
  },
  setResourceTypes: types => set(s => ({
    timelineView: {
      ...s.timelineView,
      resourceTypes: types
    }
  })),
  setFilters: f => set(s => ({
    filters: {
      ...s.filters,
      ...f
    }
  })),
  selectAllocation: id => set({
    selectedAllocation: id
  }),
  selectResource: id => set({
    selectedResource: id
  }),
  enableSimulation: id => set({
    simulationMode: {
      enabled: true,
      simulationId: id
    }
  }),
  disableSimulation: () => set({
    simulationMode: {
      enabled: false
    }
  }),
  shiftForward: () => {
    const {
      startTime,
      endTime,
      zoomLevel
    } = get().timelineView;
    const delta = ZOOM_HOURS[zoomLevel] / 2;
    set(s => ({
      timelineView: {
        ...s.timelineView,
        startTime: addHours(startTime, delta),
        endTime: addHours(endTime, delta)
      }
    }));
  },
  shiftBackward: () => {
    const {
      startTime,
      endTime,
      zoomLevel
    } = get().timelineView;
    const delta = ZOOM_HOURS[zoomLevel] / 2;
    set(s => ({
      timelineView: {
        ...s.timelineView,
        startTime: addHours(startTime, -delta),
        endTime: addHours(endTime, -delta)
      }
    }));
  },
  resetToNow: () => {
    const {
      zoomLevel
    } = get().timelineView;
    const now = new Date();
    set(s => ({
      timelineView: {
        ...s.timelineView,
        startTime: now,
        endTime: addHours(now, ZOOM_HOURS[zoomLevel])
      }
    }));
  }
}));
