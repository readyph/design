import { addons } from '@storybook/manager-api';

/**
 * RDY-356. The toolbar's viewport tool reads `parameters.viewport.viewports` once, when a story is selected, and the story's
 * parameters arrive a moment later (STORY_PREPARED). For a story that has not been opened yet in this session the tool therefore
 * stayed on its built-in list, did not find the chosen size (Large desktop, Laptop, Shell 375) and fell back to Responsive:
 * the label and the canvas size dropped to the pane size until something else re-rendered the toolbar. Nudging a hidden global once
 * the parameters are in makes the tool render again with the right list.
 */
addons.register('rph/viewport-refresh', (api) => {
  api.on('storyPrepared', () => {
    // `rphRefresh` is a hidden global (see preview.tsx): changing it re-renders the toolbar, and it goes back to 0 right after,
    // so it never stays in the URL. Nothing about the canvas changes.
    setTimeout(() => {
      api.updateGlobals({ rphRefresh: 1 });
      setTimeout(() => api.updateGlobals({ rphRefresh: 0 }), 50);
    }, 0);
  });
});
