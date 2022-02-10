'use strict';

import {Action, PREFIX, DEFAULT_TIMEOUT, DEFAULT_DOMAINS, DEFAULT_IGNORE_PINNED, DEFAULT_NOTIFY, DEFAULT_ACTION, DEFAULT_NOTIFY_DELAY, load_prefs} from '/settings.mjs';

function save(e) {
  e.preventDefault();
  const timeout = document.querySelector('#timeout').value || DEFAULT_TIMEOUT;
  const domains = [...(new Set(document.querySelector('#domains').value.split(',').map(d => d?.trim()?.toLowerCase()).filter(d => d?.length > 1)))];
  const ignore_pinned = !!document.querySelector('#ignore_pinned').checked;
  const action = document.querySelector('#action').value || DEFAULT_ACTION;
  // const notify = !!document.querySelector('#notify').checked;
  // const notify_delay = document.querySelector('#notify_delay').value || DEFAULT_NOTIFY_DELAY;
  browser.storage.sync.set({
    timeout, domains, ignore_pinned, action, // notify, notify_delay
  }).then(() => {
    const confirmation = document.querySelector('#confirmation');
    confirmation.classList.remove('fade_out');
    void confirmation.offsetHeight; // trigger reflow to allow restarting the animation
    confirmation.classList.add('fade_out');
  });
  browser.idle.setDetectionInterval(timeout * 60);
}

async function restore() {
  let prefs = await load_prefs();
  document.querySelector('#timeout').value = prefs.timeout || DEFAULT_TIMEOUT;
  document.querySelector('#domains').value = prefs.domains.join(',');
  document.querySelector('#ignore_pinned').checked = prefs.ignore_pinned;
  document.querySelector('#action').value = prefs.action || DEFAULT_ACTION;
  // document.querySelector('#notify').checked = prefs.notify;
  // document.querySelector('#notify_delay').value = prefs.notify_delay || DEFAULT_NOTIFY_DELAY;
}

function submit(event) {
  document.querySelector('form').requestSubmit();
}

function reset(event) {
  browser.storage.sync.clear().then(restore);
}

document.addEventListener('DOMContentLoaded', async () => {
  let select = document.querySelector('#action');
  for (let action in Action) {
    let option = document.createElement('option');
    option.text = action;
    option.value = Action[action];
    select.appendChild(option);
  }
  await restore();
  document.querySelector('form').addEventListener("submit", save);
  document.querySelector('#reset').addEventListener("click", reset);
  document.querySelectorAll('input[type="text"], input[type="number"]').forEach(text => {
    text.addEventListener('blur', submit);
  });
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', submit);
  });
  document.querySelectorAll('select').forEach(text => {
    text.addEventListener('change', submit);
  });
});

document.querySelectorAll('#confirmation, .confirmation').forEach(confirmation => {
  confirmation.addEventListener('animationend', e => {
    e.currentTarget.classList.remove('fade_out');
  });
});

export {};
