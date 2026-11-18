import { createClient } from '@supabase/supabase-js';
const demoPlaces = [
  { id: 'sample-1', name: 'Dosa House · sample', cuisine: 'South Indian · Dosas & street food', area: 'Dublin 2', distance: '0.4 km', score: 94, price: '€€', color: 'terracotta', icon: '◉' },
  { id: 'sample-2', name: 'Olive Table · sample', cuisine: 'Middle Eastern · Vegetarian', area: 'Dublin 1', distance: '0.8 km', score: 89, price: '€', color: 'olive', icon: '✳' },
  { id: 'sample-3', name: 'Copper Spoon · sample', cuisine: 'Indian · Regional cooking', area: 'Dublin 2', distance: '1.1 km', score: 84, price: '€€€', color: 'plum', icon: '✦' },
];

const config = {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
const supabase = config.url && config.key
  ? createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

let query = 'masala dosa';
let filter = 'Best match';
let session = null;
let createMode = false;
let pendingSave = false;
let recoveryMode = false;
let previewUrl = null;

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#discover" aria-label="NEMO home"><span class="brand-mark">n</span><span>NEMO</span></a>
    <nav aria-label="Main navigation"><a href="#discover" class="nav-active">Discover</a><a href="#how">How it works</a></nav>
    <div class="account"><span class="location"><span class="pin">⌖</span> Dublin demo area</span><button class="login-button" id="account-button" type="button">Log in</button><button class="avatar" id="saved-button" type="button" aria-label="View saved searches">♡</button></div>
  </header>
  <main id="discover">
    <section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> A taste of home, wherever you are</span><h1>What are you<br/>craving <em>today?</em></h1><p>Show us a dish you love. We’ll help you find a familiar bite nearby.</p></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="art-plate"><div class="plate-food">🥘</div></div><div class="art-leaf leaf-one">✳</div><div class="art-leaf leaf-two">✦</div><span class="art-note">Good food<br/>brings us home.</span></div></section>
    <section class="search-panel" aria-label="Find food"><div class="search-tabs"><button class="tab active" type="button" data-tab="photo">⌁ &nbsp;Use a photo</button><button class="tab" type="button" data-tab="text">⌕ &nbsp;Search by dish</button></div>
      <div class="photo-panel" id="photo-panel"><label class="upload-zone" for="food-photo" id="drop-zone"><span class="upload-icon">↑</span><span><strong>Choose or drop a food photo</strong><small>JPG, PNG, or WebP · up to 10 MB</small></span><span class="privacy-note">Previewed on this device only</span></label><input id="food-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden /></div>
      <div class="text-panel hidden" id="text-panel"><label class="dish-input"><span aria-hidden="true">⌕</span><input id="dish-search" value="masala dosa" maxlength="100" placeholder="Type a dish you love" aria-label="Dish to search"/><button id="search-button" type="button">Find places <span>→</span></button></label><small class="suggestion-label">TRY A DISH</small><div class="suggestions"><button type="button">Jollof rice</button><button type="button">Ramen</button><button type="button">Arepas</button><button type="button">Pad thai</button></div></div>
      <div class="photo-result hidden" id="photo-result"></div>
    </section>
    <section class="results-head"><div><span class="eyebrow section-eyebrow">DEMO SHORTLIST</span><h2>Places that feel familiar <span class="result-count">03</span></h2><p>Illustrative suggestions for <strong id="query-label">Masala dosa</strong> · Dublin demo</p></div><div class="result-actions"><button class="save-search-button" id="save-search" type="button">♡ <span>Save search</span></button><button class="filter-button" id="filter-button" type="button" aria-label="Change result sorting">☷ &nbsp; <span>Best match</span> <b>⌄</b></button></div></section>
    <section class="results-layout"><div class="place-list" id="place-list" aria-live="polite"></div><aside class="map-card" aria-label="Illustrative Dublin map preview"><div class="map-label"><span class="live-dot"></span> MAP PREVIEW · NOT LIVE <span class="map-expand">DUBLIN</span></div><div class="map-canvas"><div class="river"></div><div class="street street-a"></div><div class="street street-b"></div><div class="street street-c"></div><div class="street street-d"></div><div class="block block-a"></div><div class="block block-b"></div><div class="block block-c"></div><div class="block block-d"></div><div class="block block-e"></div><div class="map-park">ST STEPHEN’S<br/>GREEN</div><button class="map-pin pin-a" data-place="0" type="button" aria-label="Find Indian food in Maps">1</button><button class="map-pin pin-b" data-place="1" type="button" aria-label="Find vegetarian food in Maps">2</button><button class="map-pin pin-c" data-place="2" type="button" aria-label="Find restaurants in Maps">3</button><div class="you-pin"><span></span></div><span class="map-text text-one">GRAFTON ST</span><span class="map-text text-two">RIVER LIFFEY</span><span class="map-text text-three">TEMPLE BAR</span><div class="map-credit">Illustration · locations are examples</div></div><div class="map-footer"><span><i class="you-dot"></i> Dublin demo centre</span><a href="https://www.openstreetmap.org/search?query=Dublin%20Ireland" target="_blank" rel="noreferrer">Explore Dublin map ↗</a></div></aside></section>
    <section class="trust-strip"><span>✳ &nbsp;Thoughtful recommendations</span><span>⌖ &nbsp;Built for curious travellers</span><span>♡ &nbsp;Photos stay on your device</span></section>
  </main>
  <footer id="how"><a class="brand footer-brand" href="#discover"><span class="brand-mark">n</span><span>NEMO</span></a><p>Find your kind of food, wherever you are.</p><span class="footer-note">Dublin demo · Sample places and scores only</span></footer>
  <dialog id="auth-dialog" aria-labelledby="auth-title"><form method="dialog" class="dialog-close"><button aria-label="Close sign-in dialog" type="submit">×</button></form><div class="auth-mark">n</div><span class="eyebrow">WELCOME TO NEMO</span><h2 id="auth-title">Find a taste of home.</h2><p class="auth-copy">Sign in to save your food searches securely.</p><form id="auth-form"><label>Email address<input type="email" id="auth-email" required autocomplete="email" maxlength="254" placeholder="you@example.com"/></label><label>Password<input type="password" id="auth-password" required minlength="8" maxlength="72" autocomplete="current-password" placeholder="At least 8 characters"/></label><button class="auth-submit" type="submit">Continue <span>→</span></button><p id="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><button class="auth-toggle" id="auth-toggle" type="button">New to NEMO? <strong>Create an account</strong></button><button class="reset-password" id="reset-password" type="button">Forgot password?</button></div><p class="auth-foot">Supabase handles your password. NEMO does not store it.</p></dialog>
  <dialog id="saved-dialog" aria-labelledby="saved-title"><form method="dialog" class="dialog-close"><button aria-label="Close saved searches" type="submit">×</button></form><span class="eyebrow">YOUR ACCOUNT</span><h2 id="saved-title">Saved searches</h2><div id="saved-list" class="saved-list"></div><p class="auth-foot">Only you can access your saved searches. You can remove them here.</p></dialog>
  <div id="toast" role="status" aria-live="polite" class="toast"></div>`;

const $ = (selector) => document.querySelector(selector);
const authDialog = $('#auth-dialog');
const savedDialog = $('#saved-dialog');

function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3500);
}

function mapsSearch(place) {
  const terms = `${place.cuisine} restaurant Dublin Ireland`;
  window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(terms)}`, '_blank', 'noopener,noreferrer');
}

function renderPlaces() {
  const sorted = [...demoPlaces].sort((a, b) => filter === 'Closest'
    ? Number.parseFloat(a.distance) - Number.parseFloat(b.distance)
    : b.score - a.score);
  $('#place-list').innerHTML = sorted.map((place, index) => `
    <article class="place-card"><div class="place-thumb ${place.color}" aria-hidden="true"><span>${place.icon}</span><small>${String(index + 1).padStart(2, '0')}</small></div>
      <div class="place-info"><div class="place-topline"><span class="match-pill">Sample score · ${place.score}%</span><span class="distance">⌖ ${place.distance}</span></div>
      <h3>${place.name}</h3><p class="cuisine">${place.cuisine}</p><p class="dish-evidence"><span>↗</span> Related to <strong>${escapeHtml(query)}</strong> <i>· example only</i></p><div class="place-meta"><span>${place.price}</span><span>${place.area}</span></div></div>
      <button class="directions" type="button" data-place="${demoPlaces.indexOf(place)}" aria-label="Search Maps for ${place.cuisine}">↗</button></article>`).join('');
  document.querySelectorAll('.directions').forEach((button) => button.addEventListener('click', () => mapsSearch(demoPlaces[Number(button.dataset.place)])));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function runSearch(value) {
  const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 100);
  if (!cleaned) {
    showToast('Enter a dish name to search.');
    $('#dish-search').focus();
    return;
  }
  query = cleaned;
  $('#query-label').textContent = query;
  renderPlaces();
  showToast(`Showing illustrative demo suggestions for “${query}”.`);
}

function resetPhotoPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  $('#photo-result').replaceChildren();
  $('#photo-result').classList.add('hidden');
}

function handlePhoto(file) {
  resetPhotoPreview();
  if (!file) return;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Choose a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('That image is over 10 MB. Choose a smaller photo.');
    return;
  }
  previewUrl = URL.createObjectURL(file);
  const image = document.createElement('img');
  image.src = previewUrl;
  image.alt = 'Your selected food photo, previewed on this device';
  const details = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = 'Photo ready';
  const note = document.createElement('span');
  note.textContent = 'AI image recognition is not connected in this demo. Your photo has not been uploaded.';
  const searchButton = document.createElement('button');
  searchButton.type = 'button';
  searchButton.textContent = 'Search by dish name instead →';
  searchButton.addEventListener('click', () => {
    $('[data-tab="text"]').click();
    $('#dish-search').focus();
  });
  details.append(heading, note, searchButton);
  $('#photo-result').append(image, details);
  $('#photo-result').classList.remove('hidden');
}

async function saveCurrentSearch() {
  if (!supabase) {
    showToast('Saving needs a Supabase project. Configure .env.local first.');
    return;
  }
  if (!session) {
    pendingSave = true;
    authDialog.showModal();
    showToast('Sign in to save this search.');
    return;
  }
  try {
    const { error } = await supabase.from('saved_searches').insert({ user_id: session.user.id, dish_name: query });
    if (error) {
      if (error.code === '23505') showToast('This search is already saved.');
      else showToast(error.message.includes('saved_searches') ? 'Apply the NEMO database migration before saving.' : 'Could not save this search. Please try again.');
      return;
    }
    pendingSave = false;
    showToast('Search saved to your account.');
  } catch {
    showToast('Could not reach NEMO right now. Check your connection and try again.');
  }
}

async function loadSavedSearches() {
  if (!supabase) {
    $('#saved-list').textContent = 'Saved searches become available after Supabase is configured.';
    return;
  }
  if (!session) {
    savedDialog.close();
    authDialog.showModal();
    showToast('Log in to view your saved searches.');
    return;
  }
  $('#saved-list').textContent = 'Loading…';
  savedDialog.showModal();
  let data;
  let error;
  try {
    ({ data, error } = await supabase.from('saved_searches').select('id,dish_name,created_at').order('created_at', { ascending: false }));
  } catch {
    $('#saved-list').textContent = 'Could not reach NEMO. Check your connection and try again.';
    return;
  }
  if (error) {
    $('#saved-list').textContent = 'Could not load saved searches. Check the database migration and try again.';
    return;
  }
  if (!data.length) {
    $('#saved-list').textContent = 'No saved searches yet. Use “Save search” on a dish you want to remember.';
    return;
  }
  const list = document.createElement('ul');
  for (const item of data) {
    const row = document.createElement('li');
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = item.dish_name;
    open.addEventListener('click', () => {
      runSearch(item.dish_name);
      savedDialog.close();
      $('[data-tab="text"]').click();
      $('#dish-search').value = item.dish_name;
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-saved';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove saved search ${item.dish_name}`);
    remove.addEventListener('click', async () => {
      let deleteError;
      try {
        ({ error: deleteError } = await supabase.from('saved_searches').delete().eq('id', item.id));
      } catch {
        showToast('Could not reach NEMO. Check your connection and try again.');
        return;
      }
      if (deleteError) showToast('Could not remove this saved search.');
      else {
        row.remove();
        if (!list.children.length) $('#saved-list').textContent = 'No saved searches yet.';
        showToast('Saved search removed.');
      }
    });
    row.append(open, remove);
    list.append(row);
  }
  $('#saved-list').replaceChildren(list);
}

function updateAccountButton() {
  $('#account-button').textContent = session ? 'Log out' : 'Log in';
  $('#account-button').setAttribute('aria-label', session ? 'Log out of NEMO' : 'Log in to NEMO');
}

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
  $('#photo-panel').classList.toggle('hidden', button.dataset.tab !== 'photo');
  $('#text-panel').classList.toggle('hidden', button.dataset.tab !== 'text');
  if (button.dataset.tab === 'text') resetPhotoPreview();
}));

$('#search-button').addEventListener('click', () => runSearch($('#dish-search').value));
$('#dish-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') runSearch(event.target.value); });
document.querySelectorAll('.suggestions button').forEach((button) => button.addEventListener('click', () => {
  $('#dish-search').value = button.textContent;
  runSearch(button.textContent);
}));
$('#food-photo').addEventListener('change', (event) => handlePhoto(event.target.files?.[0]));
const dropZone = $('#drop-zone');
for (const name of ['dragenter', 'dragover']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
for (const name of ['dragleave', 'drop']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', (event) => handlePhoto(event.dataTransfer.files?.[0]));
$('#filter-button').addEventListener('click', () => {
  const options = ['Best match', 'Closest', 'Top sample score'];
  filter = options[(options.indexOf(filter) + 1) % options.length];
  $('#filter-button span').textContent = filter;
  renderPlaces();
});
document.querySelectorAll('.map-pin').forEach((button) => button.addEventListener('click', () => mapsSearch(demoPlaces[Number(button.dataset.place)])));
$('#save-search').addEventListener('click', saveCurrentSearch);
$('#saved-button').addEventListener('click', loadSavedSearches);

$('#account-button').addEventListener('click', async () => {
  if (session && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) showToast('Could not log out. Try again.');
    else showToast('You are logged out.');
    return;
  }
  authDialog.showModal();
});

$('#auth-toggle').addEventListener('click', () => {
  createMode = !createMode;
  $('#auth-title').textContent = createMode ? 'Create your NEMO account.' : 'Find a taste of home.';
  $('#auth-toggle').innerHTML = createMode ? 'Already have an account? <strong>Log in</strong>' : 'New to NEMO? <strong>Create an account</strong>';
  $('#auth-password').autocomplete = createMode ? 'new-password' : 'current-password';
  $('#reset-password').classList.toggle('hidden', createMode);
  $('#auth-message').textContent = '';
});

$('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('#auth-message');
  if (!supabase) {
    message.textContent = 'Sign-in is not configured. Add the Supabase project URL and publishable key to .env.local; guest browsing still works.';
    return;
  }
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  message.textContent = 'Please wait…';
  let result;
  try {
    result = recoveryMode
      ? await supabase.auth.updateUser({ password })
      : createMode
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email, password });
  } catch {
    message.textContent = 'Could not reach NEMO. Check your connection and try again.';
    return;
  }
  if (result.error) {
    message.textContent = 'We could not complete that request. Check your details and try again.';
    return;
  }
  if (createMode && !result.data.session) {
    message.textContent = 'Check your email for a confirmation link, then return here to log in.';
    return;
  }
  session = recoveryMode ? session : result.data.session;
  if (recoveryMode) {
    recoveryMode = false;
    createMode = false;
    $('#auth-password').value = '';
    $('#auth-title').textContent = 'Find a taste of home.';
    $('#auth-toggle').classList.remove('hidden');
    $('#reset-password').classList.remove('hidden');
    $('.auth-submit').firstChild.textContent = 'Continue ';
  }
  updateAccountButton();
  authDialog.close();
  if (pendingSave) await saveCurrentSearch();
  else showToast(createMode ? 'Your account is ready.' : 'Welcome back.');
});

$('#reset-password').addEventListener('click', async () => {
  if (!supabase) {
    $('#auth-message').textContent = 'Password reset needs the Supabase project configured.';
    return;
  }
  const email = $('#auth-email').value.trim();
  if (!email) {
    $('#auth-message').textContent = 'Enter your email address first.';
    $('#auth-email').focus();
    return;
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    $('#auth-message').textContent = error ? 'Could not send a reset link. Please try again.' : 'If this account can receive a reset email, a link is on its way.';
  } catch {
    $('#auth-message').textContent = 'Could not reach NEMO. Check your connection and try again.';
  }
});

renderPlaces();
if (supabase) {
  supabase.auth.onAuthStateChange((event, nextSession) => {
    session = nextSession;
    updateAccountButton();
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      createMode = false;
      $('#auth-title').textContent = 'Set a new password.';
      $('#auth-toggle').classList.add('hidden');
      $('#reset-password').classList.add('hidden');
      $('.auth-submit').firstChild.textContent = 'Update password ';
      authDialog.showModal();
    }
  });
  supabase.auth.getSession().then(({ data }) => {
    session = data.session;
    updateAccountButton();
  }).catch(() => showToast('Could not restore your account session. Log in again if needed.'));
}
window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });

