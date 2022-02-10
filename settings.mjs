'use strict';

/** @enum Action {string} */
const Action = {
  Reload: 'reload',
  //Unload: 'unload', // DEPRECATED - see background.mjs perform_action() for reasoning
  Redirect: 'redirect',
  Alert: 'alert',
};

const PREFIX = '__idle_media_timeout_extension__';
const DEFAULT_TIMEOUT = 2 * 60; // minutes
const DEFAULT_DOMAINS = ['youtube.com', 'hulu.com'];
const DEFAULT_IGNORE_PINNED = false;
const DEFAULT_NOTIFY = false;
const DEFAULT_ACTION = Action.Redirect;
const DEFAULT_NOTIFY_DELAY = 1; // minutes before ACTION is taken to notify the user

const prefs = {
  /** @type {number} */ timeout: DEFAULT_TIMEOUT, // minutes
  /** @type {string[]} */ domains: DEFAULT_DOMAINS,
  /** @type {boolean} */ ignore_pinned: DEFAULT_IGNORE_PINNED,
  /** @type {boolean} */ notify: DEFAULT_NOTIFY,
  /** @type {Action} */ action: DEFAULT_ACTION,
  /** @type {number} */ notify_delay: DEFAULT_NOTIFY_DELAY, // minutes
};

async function load_prefs() {
  const props = await browser.storage.sync.get(prefs);
  if (typeof props.timeout !== 'number') props.timeout = Number.parseFloat(props.timeout, 10);
  if (typeof props.notify_delay !== 'number') props.notify_delay = Number.parseFloat(props.notify_delay);
  return props;
}

export {Action, PREFIX, DEFAULT_TIMEOUT, DEFAULT_DOMAINS, DEFAULT_IGNORE_PINNED, DEFAULT_NOTIFY, DEFAULT_ACTION, DEFAULT_NOTIFY_DELAY, load_prefs};
