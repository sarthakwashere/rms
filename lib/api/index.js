/**
 * Legacy API facade kept for compatibility with older UI components.
 * New code should import directly from `@/lib/api/client`.
 */

import { AllocationAPI as AllocationClientAPI } from './client';
export const AllocationAPI = {
  ...AllocationClientAPI,
  reallocate: async (_allocationId, _newResourceIdentifier, _reason) => {
    throw new Error('Legacy Gantt reallocation is not wired in this API facade.');
  }
};
export * from './types';
export const TimelineAPI = {
  // Placeholder shim for legacy Gantt component.
  gantt: async _req => ({
    resources: []
  })
};
