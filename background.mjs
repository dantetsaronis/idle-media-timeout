'use strict';

import {Action, PREFIX, load_prefs} from '/settings.mjs';

/** @enum {number} */
const Alarm_Type = {
  Action: 0,
  Notify: 1,
};

const prefs = {};

function create_alarm(/** @type {Alarm_Type} */ alarm_type) {
  const alarm_name = `${PREFIX}alarm_${alarm_type}`;
  return browser.alarms.create(alarm_name, {
    delayInMinutes: alarm_type === Alarm_Type.Notify ? prefs.timeout : prefs.notify_delay,
  });
}

function restart_alarm(/** @type {Alarm_Type} */ alarm_type) {
  const alarm_name = `${PREFIX}alarm_${alarm_type}`;
  console.debug(`restart_alarm: ${alarm_name}`);
  browser.alarms.clear(alarm_name).then(() => {
    return browser.alarms.create(alarm_name, {
      delayInMinutes: alarm_type === Alarm_Type.Notify ? prefs.timeout : prefs.notify_delay,
    });
  });
}

function clear_alarm(/** @type {Alarm_Type} */ alarm_type) {
  const alarm_name = `${PREFIX}alarm_${alarm_type}`;
  console.debug(`clear_alarm: ${alarm_name}`);
  return browser.alarms.clear(alarm_name);
}

async function get_tabs() {
  return load_prefs()
    .then(loaded_prefs => Object.assign(prefs, loaded_prefs))
    .then(() => browser.tabs.query({
      audible: true,
      discarded: false,
    }))
    .then(tabs => tabs.filter(tab => {
      if (tab.id === browser.tabs.TAB_ID_NONE) return false; // e.g. devtools
      if (prefs.ignore_pinned && tab.pinned) return false;
      if (prefs.domains?.size > 0 && ![...prefs.domains].some(domain => {
          const hostname = new URL(tab.url).hostname.toLowerCase();
          return hostname === domain || hostname.endsWith('.' + domain);
        })) return false;
      return true;
    }));
}

async function perform_action() {
  get_tabs()
    .then(filtered_tabs => {
      console.debug(`filtered_tabs.length: ${filtered_tabs.length}`);
      console.debug(filtered_tabs);
      if (!(filtered_tabs?.length > 0)) return;
      switch (prefs.action) {
        case Action.Reload:
          filtered_tabs.forEach(tab => {
            console.debug(`reloading a single tab twice: ${tab.id}`);
            browser.tabs.reload(tab.id);
            browser.tabs.reload(tab.id); // do it twice to override abusive beforeUnload event handlers
          });
          break;
        case Action.Unload:
          filtered_tabs.forEach(tab => {
            console.debug(`discarding a single tab: ${tab.id}`);
            browser.tabs.discard(tab.id)
              .catch(err => {
                /* "It's not possible to discard the currently active tab, or a tab whose document contains a beforeunload listener that would display a prompt."
                  - per https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/discard 2022-02-07
                  As it turns out, this won't throw (or be caught); the promise resolves with undefined, so this catch clause does nothing.
                  This was tested on music.youtube.com, and makes the unload action effectively useless because it wouldn't work for the most common use cases (active/visible/focused tabs).
                  */
                console.error(err);
                browser.tabs.update(tab.id, {
                  url: `/placeholder.html#${tab.url}`,
                });
              });
          });
          break;
        case Action.Redirect:
          filtered_tabs.forEach(tab => {
            console.debug(`redirecting a single tab twice: ${tab.id}`);
            browser.tabs.update(tab.id, {
              url: `/placeholder.html#${tab.url}`,
            });
            browser.tabs.update(tab.id, {
              url: `/placeholder.html#${tab.url}`,
            }); // do it twice to override beforeUnload event handlers
          });
          break;
        case Action.Alert:
          // Only works in the active tab unless we rewrite this to use all_urls / overly broad hosts permission and content injection.
          console.debug(`alerting the active tab`);
          browser.tabs.executeScript({
            code: `alert('Media was playing while idle. Click OK to resume, although you may need to reload and/or reauthenticate for some web sites.\n\n${new Date().toLocaleString}')`,
          });
          break;
      }
  });
}

async function idle_state_changed(state) {
  console.debug(`idle_state_changed: ${state}`);
  if (['idle', 'locked'].includes(state)) {
    Object.assign(prefs, await load_prefs());
    browser.idle.queryState(prefs.timeout * 60)
      .then(s => {
        console.debug(`queryState: ${s}`);
        if (['idle', 'locked'].includes(s)) {
          if (prefs.notify) {
            // browser.notifications.create({
            //   type: 'basic',
            //   title: 'Idle media timeout',
            //   message: `Your media tab(s) will be ${prefs.action}ed in ${prefs.notify_delay} minute${prefs.notify_delay === 1 ? '' : 's'} if your browser remains idle.`,
            // });
            restart_alarm(Alarm_Type.Action);
          }
          else {
            perform_action().catch(console.error);
          }
        }
      });
    return;
  }
  if (state === 'active') {
    clear_alarm(Alarm_Type.Notify);
    clear_alarm(Alarm_Type.Action);
  }
}

browser.alarms.onAlarm.addListener(alarm => {
  console.debug(`alarm event: ${alarm.name}`);
  const alarm_name = `${PREFIX}alarm_${Alarm_Type.Action}`;
  if (alarm.name == alarm_name) {
    perform_action().catch(console.error);
  }
});

async function main() {
  const HAS_RUN_FLAG = `${PREFIX}timeout_has_run`;
  if (window[HAS_RUN_FLAG]) {
    return;
  }
  window[HAS_RUN_FLAG] = true;

  Object.assign(prefs, await load_prefs());

  browser.idle.setDetectionInterval(prefs.timeout * 60);
  browser.idle.onStateChanged.addListener(idle_state_changed);
  browser.idle.queryState(prefs.timeout * 60)
    .then(idle_state_changed);
}

main().catch(console.error);

export {};
