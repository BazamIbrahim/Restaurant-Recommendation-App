import { createClient } from '@supabase/supabase-js';
import { markets } from './markets.js';
const demoPlaces = [
  { id: 'sample-1', name: 'Dosa House · sample', cuisine: 'South Indian · Dosas & street food', area: 'Dublin 2', distance: '0.4 km', score: 94, dishes: ['masala dosa', 'dosa'], price: '€€', color: 'terracotta', icon: '◉' },
  { id: 'sample-2', name: 'South Spice · sample', cuisine: 'South Indian · Vegetarian', area: 'Dublin 1', distance: '1.2 km', score: 96, dishes: ['masala dosa', 'idli', 'uttapam'], price: '€', color: 'olive', icon: '✳' },
  { id: 'sample-3', name: 'Olive Table · sample', cuisine: 'Middle Eastern · Vegetarian', area: 'Dublin 1', distance: '0.8 km', score: 89, dishes: ['falafel', 'hummus', 'falafel wrap'], price: '€', color: 'olive', icon: '✳' },
  { id: 'sample-4', name: 'Jollof Corner · sample', cuisine: 'West African · Homestyle', area: 'Dublin 7', distance: '1.3 km', score: 91, dishes: ['jollof rice', 'suya', 'fried plantain'], price: '€€', color: 'terracotta', icon: '◉' },
  { id: 'sample-5', name: 'Noodle House · sample', cuisine: 'Japanese · Noodles & broth', area: 'Dublin 2', distance: '1.0 km', score: 90, dishes: ['ramen', 'tonkotsu ramen', 'udon'], price: '€€', color: 'plum', icon: '✦' },
  { id: 'sample-6', name: 'Arepa Kitchen · sample', cuisine: 'Venezuelan · Street food', area: 'Dublin 8', distance: '1.5 km', score: 92, dishes: ['arepas', 'arepa', 'pabellon'], price: '€€', color: 'olive', icon: '✳' },
  { id: 'sample-7', name: 'Thai Basil · sample', cuisine: 'Thai · Noodles & curry', area: 'Dublin 4', distance: '1.4 km', score: 93, dishes: ['pad thai', 'green curry', 'som tam'], price: '€€', color: 'terracotta', icon: '◉' },
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
let selectedMarket = markets.find((market) => market.iso2 === 'IE');

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#discover" aria-label="NEMO home"><span class="brand-mark">n</span><span>NEMO</span></a>
    <nav aria-label="Main navigation"><a href="#discover" class="nav-active">Discover</a><a href="#how">How it works</a></nav>
    <div class="account"><label class="market-picker"><span class="pin" aria-hidden="true">⌖</span><select id="market-select" aria-label="Choose country and capital"></select></label><button class="login-button" id="account-button" type="button">Log in</button><button class="avatar" id="saved-button" type="button" aria-label="View saved searches">♡</button></div>
  </header>
  <main id="discover">
    <section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> A taste of home, wherever you are</span><h1>What are you<br/>craving <em>today?</em></h1><p>Show us a dish you love. We’ll help you find a familiar bite nearby.</p></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="art-plate"><div class="plate-food">🥘</div></div><div class="art-leaf leaf-one">✳</div><div class="art-leaf leaf-two">✦</div><span class="art-note">Good food<br/>brings us home.</span></div></section>
    <section class="search-panel" aria-label="Find food"><div class="search-tabs"><button class="tab active" type="button" data-tab="photo">⌁ &nbsp;Use a photo</button><button class="tab" type="button" data-tab="text">⌕ &nbsp;Search by dish</button></div>
      <div class="photo-panel" id="photo-panel"><div class="photo-actions"><label class="upload-zone" for="food-photo" id="drop-zone"><span class="upload-icon">↑</span><span><strong>Choose or drop a food photo</strong><small>JPG, PNG, or WebP · up to 10 MB</small></span><span class="privacy-note">Previewed on this device only</span></label><button class="camera-button" id="take-photo" type="button">◎ <span>Take a photo</span></button></div><input id="food-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden /><input id="camera-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden /></div>
      <div class="text-panel hidden" id="text-panel"><label class="dish-input"><span aria-hidden="true">⌕</span><input id="dish-search" value="masala dosa" maxlength="100" placeholder="Type a dish you love" aria-label="Dish to search"/><button id="search-button" type="button">Find places <span>→</span></button></label><small class="suggestion-label">TRY A DISH</small><div class="suggestions"><button type="button">Jollof rice</button><button type="button">Ramen</button><button type="button">Arepas</button><button type="button">Pad thai</button></div></div>
      <div class="photo-result hidden" id="photo-result"></div>
    </section>
    <section class="results-head"><div><span class="eyebrow section-eyebrow" id="result-mode">DUBLIN DEMO SHORTLIST</span><h2>Places that feel familiar <span class="result-count" id="result-count">02</span></h2><p><span id="result-description">Illustrative suggestions for </span><strong id="query-label">Masala dosa</strong><span id="market-context"> · Dublin demo</span></p></div><div class="result-actions"><button class="save-search-button" id="save-search" type="button">♡ <span>Save search</span></button><button class="filter-button" id="filter-button" type="button" aria-label="Change result sorting">☷ &nbsp; <span>Best match</span> <b>⌄</b></button></div></section>
    <section class="results-layout"><div class="place-list" id="place-list" aria-live="polite"></div><aside class="map-card" id="map-card" aria-label="Map preview"><div class="map-label"><span class="live-dot" id="map-dot"></span><span id="map-label">MAP PREVIEW · NOT LIVE</span><span class="map-expand" id="map-expand">DUBLIN</span></div><div class="map-canvas" id="map-canvas"><div class="river"></div><div class="street street-a"></div><div class="street street-b"></div><div class="street street-c"></div><div class="street street-d"></div><div class="block block-a"></div><div class="block block-b"></div><div class="block block-c"></div><div class="block block-d"></div><div class="block block-e"></div><div class="map-park">ST STEPHEN’S<br/>GREEN</div><div id="map-pins"></div><div class="you-pin"><span></span></div><span class="map-text text-one">GRAFTON ST</span><span class="map-text text-two">RIVER LIFFEY</span><span class="map-text text-three">TEMPLE BAR</span><div class="map-credit">Illustration · locations are examples</div></div><div class="map-empty hidden" id="map-empty"><strong>Map preview unavailable</strong><span>Restaurant and map coverage has not been verified for this capital yet.</span></div><div class="map-footer"><span id="map-center"><i class="you-dot"></i> Dublin demo centre</span><a id="map-link" href="https://www.openstreetmap.org/search?query=Dublin%20Ireland" target="_blank" rel="noreferrer">Explore Dublin map ↗</a></div></aside></section>
    <section class="trust-strip"><span>✳ &nbsp;Thoughtful recommendations</span><span>⌖ &nbsp;Built for curious travellers</span><span>♡ &nbsp;Photos stay on your device</span></section>
  </main>
  <footer id="how"><a class="brand footer-brand" href="#discover"><span class="brand-mark">n</span><span>NEMO</span></a><p>Find your kind of food, wherever you are.</p><span class="footer-note" id="footer-note">Dublin demo · Sample places and scores only</span></footer>
  <dialog id="auth-dialog" aria-labelledby="auth-title"><form method="dialog" class="dialog-close"><button aria-label="Close sign-in dialog" type="submit">×</button></form><div class="auth-mark">n</div><span class="eyebrow">WELCOME TO NEMO</span><h2 id="auth-title">Find a taste of home.</h2><p class="auth-copy">Sign in to save your food searches securely.</p><form id="auth-form"><label>Email address<input type="email" id="auth-email" required autocomplete="email" maxlength="254" placeholder="you@example.com"/></label><label>Password<input type="password" id="auth-password" required minlength="8" maxlength="72" autocomplete="current-password" placeholder="At least 8 characters"/></label><button class="auth-submit" type="submit">Continue <span>→</span></button><p id="auth-message" role="status" aria-live="polite"></p></form><div class="auth-links"><button class="auth-toggle" id="auth-toggle" type="button">New to NEMO? <strong>Create an account</strong></button><button class="reset-password" id="reset-password" type="button">Forgot password?</button></div><p class="auth-foot">Supabase handles your password. NEMO does not store it.</p></dialog>
  <dialog id="saved-dialog" aria-labelledby="saved-title"><form method="dialog" class="dialog-close"><button aria-label="Close saved searches" type="submit">×</button></form><span class="eyebrow">YOUR ACCOUNT</span><h2 id="saved-title">Saved searches</h2><div id="saved-list" class="saved-list"></div><p class="auth-foot">Only you can access your saved searches. You can remove them here.</p></dialog>
  <div id="toast" role="status" aria-live="polite" class="toast"></div>`;

const $ = (selector) => document.querySelector(selector);
const authDialog = $('#auth-dialog');
const savedDialog = $('#saved-dialog');
const marketSelect = $('#market-select');
for (const market of markets) {
  const option = document.createElement('option');
  option.value = market.iso2;
  option.textContent = `${market.country} — ${market.capital}`;
  marketSelect.append(option);
}
marketSelect.value = selectedMarket.iso2;
marketSelect.addEventListener('change', () => {
  selectedMarket = markets.find((market) => market.iso2 === marketSelect.value) || markets.find((market) => market.iso2 === 'IE');
  updateMarketInterface();
});

function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3500);
}

function mapsSearch(place) {
  const terms = `${place.cuisine} restaurant ${selectedMarket.capital} ${selectedMarket.country}`;
  window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(terms)}`, '_blank', 'noopener,noreferrer');
}

function updateMarketInterface() {
  const isDublinDemo = selectedMarket.iso2 === 'IE';
  const marketLabel = `${selectedMarket.capital}, ${selectedMarket.country}`;
  $('#market-context').textContent = isDublinDemo ? ' · Dublin demo' : ` · ${selectedMarket.capital} coverage not verified`;
  $('#result-description').textContent = isDublinDemo ? 'Illustrative suggestions for ' : 'No verified NEMO listings for ';
  $('#result-mode').textContent = isDublinDemo ? 'DUBLIN DEMO SHORTLIST' : 'COUNTRY COVERAGE IN RESEARCH';
  $('#map-expand').textContent = selectedMarket.capital.toLocaleUpperCase();
  $('#map-label').textContent = isDublinDemo ? 'MAP PREVIEW · NOT LIVE' : 'MAP COVERAGE NOT VERIFIED';
  $('#map-dot').classList.toggle('coverage-pending-dot', !isDublinDemo);
  $('#map-canvas').classList.toggle('hidden', !isDublinDemo);
  $('#map-empty').classList.toggle('hidden', isDublinDemo);
  $('#map-center').innerHTML = `<i class="you-dot"></i> ${isDublinDemo ? 'Dublin demo centre' : escapeHtml(marketLabel)}`;
  $('#map-link').href = `https://www.openstreetmap.org/search?query=${encodeURIComponent(marketLabel)}`;
  $('#map-link').textContent = `Explore ${selectedMarket.capital} map ↗`;
  $('#map-card').setAttribute('aria-label', `${isDublinDemo ? 'Illustrative demo' : 'External map search'} for ${marketLabel}`);
  $('#footer-note').textContent = isDublinDemo ? 'Dublin demo · Sample places and scores only' : 'Research coverage only · No verified listings';
  renderPlaces();
}

function renderPlaces() {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matched = (selectedMarket.iso2 === 'IE' ? demoPlaces : []).filter((place) => place.dishes.some((dish) => {
    const normalizedDish = dish.toLocaleLowerCase();
    return normalizedQuery.includes(normalizedDish) || normalizedDish.includes(normalizedQuery);
  }));
  const sorted = matched.sort((a, b) => filter === 'Closest'
    ? Number.parseFloat(a.distance) - Number.parseFloat(b.distance)
    : b.score - a.score);
  $('#result-count').textContent = String(sorted.length).padStart(2, '0');
  $('#place-list').innerHTML = sorted.length ? sorted.map((place, index) => {
    const evidenceDish = place.dishes.find((dish) => normalizedQuery.includes(dish) || dish.includes(normalizedQuery)) || place.dishes[0];
    return `
    <article class="place-card"><div class="place-thumb ${place.color}" aria-hidden="true"><span>${place.icon}</span><small>${String(index + 1).padStart(2, '0')}</small></div>
      <div class="place-info"><div class="place-topline"><span class="match-pill">Sample score · ${place.score}%</span><span class="distance">⌖ ${place.distance}</span></div>
      <h3>${place.name}</h3><p class="cuisine">${place.cuisine}</p><p class="dish-evidence"><span>↗</span> Example menu tag: <strong>${escapeHtml(evidenceDish)}</strong> <i>· sample only</i></p><div class="place-meta"><span>${place.price}</span><span>${place.area}</span></div></div>
      <button class="directions" type="button" data-place="${demoPlaces.indexOf(place)}" aria-label="Search Maps for ${place.cuisine}">↗</button></article>`;
  }).join('')
  : selectedMarket.iso2 === 'IE'
    ? `<div class="empty-results"><strong>No sample listings for “${escapeHtml(query)}”</strong><p>Try one of the suggested dishes or type a dish included in this Dublin demo.</p></div>`
    : `<div class="empty-results"><strong>No verified NEMO listings in ${escapeHtml(selectedMarket.capital)} yet</strong><p>This market is in the Europe coverage plan, but restaurant, menu, and review data have not been verified. Use the map link to explore the area.</p></div>`;
  document.querySelectorAll('.directions').forEach((button) => button.addEventListener('click', () => mapsSearch(demoPlaces[Number(button.dataset.place)])));
  const pinClasses = ['pin-a', 'pin-b', 'pin-c'];
  $('#map-pins').innerHTML = selectedMarket.iso2 === 'IE' ? sorted.slice(0, 3).map((place, index) => `
    <button class="map-pin ${pinClasses[index]}" data-place="${demoPlaces.indexOf(place)}" type="button" aria-label="Search Maps for ${place.cuisine}">${index + 1}</button>`).join('')
    : '';
  document.querySelectorAll('#map-pins .map-pin').forEach((button) => button.addEventListener('click', () => mapsSearch(demoPlaces[Number(button.dataset.place)])));
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
  showToast(selectedMarket.iso2 === 'IE'
    ? `Showing illustrative demo suggestions for “${query}”.`
    : `No verified restaurant listings for ${selectedMarket.capital} yet.`);
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
    const { error } = await supabase.from('saved_searches').insert({
      user_id: session.user.id,
      dish_name: query,
      country_code: selectedMarket.iso2,
      city: selectedMarket.capital,
    });
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
    ({ data, error } = await supabase.from('saved_searches').select('id,dish_name,country_code,city,created_at').order('created_at', { ascending: false }));
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
    open.textContent = `${item.dish_name} · ${item.city}, ${item.country_code}`;
    open.addEventListener('click', () => {
      selectedMarket = markets.find((market) => market.iso2 === item.country_code) || markets.find((market) => market.iso2 === 'IE');
      marketSelect.value = selectedMarket.iso2;
      updateMarketInterface();
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
for (const input of [$('#food-photo'), $('#camera-photo')]) {
  input.addEventListener('change', (event) => {
    handlePhoto(event.target.files?.[0]);
    event.target.value = '';
  });
}
$('#take-photo').addEventListener('click', () => $('#camera-photo').click());
const dropZone = $('#drop-zone');
for (const name of ['dragenter', 'dragover']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
for (const name of ['dragleave', 'drop']) dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', (event) => handlePhoto(event.dataTransfer.files?.[0]));
$('#filter-button').addEventListener('click', () => {
  const options = ['Best match', 'Closest'];
  filter = options[(options.indexOf(filter) + 1) % options.length];
  $('#filter-button span').textContent = filter;
  $('#filter-button').setAttribute('aria-label', `Sort results: ${filter}. Activate to change sorting.`);
  renderPlaces();
});
$('#save-search').addEventListener('click', saveCurrentSearch);
$('#saved-button').addEventListener('click', loadSavedSearches);

$('#account-button').addEventListener('click', async () => {
  if (session && supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) showToast('Could not log out. Try again.');
      else {
        session = null;
        updateAccountButton();
        showToast('You are logged out.');
      }
    } catch {
      showToast('Could not reach NEMO. Check your connection and try again.');
    }
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
  const createdAccount = createMode;
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
  createMode = false;
  $('#auth-title').textContent = 'Find a taste of home.';
  $('#auth-toggle').innerHTML = 'New to NEMO? <strong>Create an account</strong>';
  $('#auth-password').autocomplete = 'current-password';
  updateAccountButton();
  authDialog.close();
  if (pendingSave) await saveCurrentSearch();
  else showToast(createdAccount ? 'Your account is ready.' : 'Welcome back.');
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

updateMarketInterface();
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
